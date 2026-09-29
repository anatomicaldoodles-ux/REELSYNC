/**
 * Minimal ZIP reader for the browser that only touches the bytes it needs.
 * It reads the central directory from the end of the file, then slices and
 * inflates just the entries the caller asks for. That keeps multi-gigabyte
 * Instagram exports (mostly media) cheap: the JSON files are a few megabytes.
 * Supports ZIP64 (used by exports over 4 GB) and deflate/stored entries.
 */
import { inflateSync } from "fflate";

export interface ZipEntry {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  method: number;
  localHeaderOffset: number;
}

const SIG_EOCD = 0x06054b50;
const SIG_EOCD64_LOCATOR = 0x07064b50;
const SIG_EOCD64 = 0x06064b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_LOCAL = 0x04034b50;
const MAX_COMMENT = 0xffff;

const utf8 = new TextDecoder("utf-8");

async function readRange(blob: Blob, start: number, end: number): Promise<DataView> {
  const buf = await blob.slice(Math.max(0, start), Math.min(blob.size, end)).arrayBuffer();
  return new DataView(buf);
}

function u64(view: DataView, offset: number): number {
  const lo = view.getUint32(offset, true);
  const hi = view.getUint32(offset + 4, true);
  return hi * 0x1_0000_0000 + lo;
}

export async function readCentralDirectory(blob: Blob): Promise<ZipEntry[]> {
  if (blob.size < 22) throw new Error("File is too small to be a ZIP archive");
  const tailStart = Math.max(0, blob.size - (MAX_COMMENT + 22));
  const tail = await readRange(blob, tailStart, blob.size);
  let eocd = -1;
  for (let i = tail.byteLength - 22; i >= 0; i--) {
    if (tail.getUint32(i, true) === SIG_EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a ZIP archive (end of central directory not found)");

  let entryCount: number = tail.getUint16(eocd + 10, true);
  let cdSize: number = tail.getUint32(eocd + 12, true);
  let cdOffset: number = tail.getUint32(eocd + 16, true);

  const needs64 = entryCount === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff;
  if (needs64 && eocd >= 20 && tail.getUint32(eocd - 20, true) === SIG_EOCD64_LOCATOR) {
    const eocd64Offset = u64(tail, eocd - 20 + 8);
    const rec = await readRange(blob, eocd64Offset, eocd64Offset + 56);
    if (rec.getUint32(0, true) !== SIG_EOCD64) throw new Error("Corrupt ZIP64 end of central directory");
    entryCount = u64(rec, 32);
    cdSize = u64(rec, 40);
    cdOffset = u64(rec, 48);
  }

  const cd = await readRange(blob, cdOffset, cdOffset + cdSize);
  const entries: ZipEntry[] = [];
  let p = 0;
  for (let i = 0; i < entryCount && p + 46 <= cd.byteLength; i++) {
    if (cd.getUint32(p, true) !== SIG_CENTRAL) break;
    const flags = cd.getUint16(p + 8, true);
    const method = cd.getUint16(p + 10, true);
    let compressedSize: number = cd.getUint32(p + 20, true);
    let uncompressedSize: number = cd.getUint32(p + 24, true);
    const nameLen = cd.getUint16(p + 28, true);
    const extraLen = cd.getUint16(p + 30, true);
    const commentLen = cd.getUint16(p + 32, true);
    let localHeaderOffset: number = cd.getUint32(p + 42, true);
    const nameBytes = new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nameLen);
    const name = flags & 0x800 ? utf8.decode(nameBytes) : utf8.decode(nameBytes);

    // ZIP64 extra field carries the 64-bit values for any field that overflowed.
    let e = p + 46 + nameLen;
    const extraEnd = e + extraLen;
    while (e + 4 <= extraEnd) {
      const id = cd.getUint16(e, true);
      const size = cd.getUint16(e + 2, true);
      if (id === 0x0001) {
        let q = e + 4;
        if (uncompressedSize === 0xffffffff && q + 8 <= e + 4 + size) {
          uncompressedSize = u64(cd, q);
          q += 8;
        }
        if (compressedSize === 0xffffffff && q + 8 <= e + 4 + size) {
          compressedSize = u64(cd, q);
          q += 8;
        }
        if (localHeaderOffset === 0xffffffff && q + 8 <= e + 4 + size) {
          localHeaderOffset = u64(cd, q);
        }
      }
      e += 4 + size;
    }
    entries.push({ name, compressedSize, uncompressedSize, method, localHeaderOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

export async function readEntry(blob: Blob, entry: ZipEntry): Promise<Uint8Array> {
  const header = await readRange(blob, entry.localHeaderOffset, entry.localHeaderOffset + 30);
  if (header.getUint32(0, true) !== SIG_LOCAL) throw new Error(`Corrupt local header for ${entry.name}`);
  const nameLen = header.getUint16(26, true);
  const extraLen = header.getUint16(28, true);
  const dataStart = entry.localHeaderOffset + 30 + nameLen + extraLen;
  const raw = new Uint8Array(await blob.slice(dataStart, dataStart + entry.compressedSize).arrayBuffer());
  if (entry.method === 0) return raw;
  if (entry.method === 8) return inflateSync(raw);
  throw new Error(`Unsupported compression method ${entry.method} for ${entry.name}`);
}

export interface ExtractOptions {
  filter: (name: string) => boolean;
  /** Skip entries larger than this once decompressed (protects memory). */
  maxEntryBytes?: number;
  onProgress?: (done: number, total: number) => void;
}

/** Extracts the text of every entry accepted by `filter`. */
export async function extractTextEntries(blob: Blob, options: ExtractOptions): Promise<Map<string, string>> {
  const entries = await readCentralDirectory(blob);
  const wanted = entries.filter((e) => !e.name.endsWith("/") && options.filter(e.name));
  const maxBytes = options.maxEntryBytes ?? 256 * 1024 * 1024;
  const out = new Map<string, string>();
  let done = 0;
  for (const entry of wanted) {
    if (entry.uncompressedSize <= maxBytes) {
      const bytes = await readEntry(blob, entry);
      out.set(entry.name, utf8.decode(bytes));
    }
    done++;
    options.onProgress?.(done, wanted.length);
  }
  return out;
}

export function isZipFile(blob: Blob): Promise<boolean> {
  return readRange(blob, 0, 4).then((v) => v.byteLength >= 4 && v.getUint32(0, true) === SIG_LOCAL).catch(() => false);
}
