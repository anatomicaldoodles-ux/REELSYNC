/**
 * Writes a small synthetic Instagram export ZIP for manual testing.
 * Usage: npx tsx scripts/make-sample-export.ts out.zip
 */
import { zipSync, strToU8 } from "fflate";
import { writeFileSync } from "node:fs";
import { buildFixture } from "../src/lib/instagram/__tests__/fixture";

const out = process.argv[2] ?? "sample-export.zip";
const entries: Record<string, Uint8Array> = {};
for (const [path, text] of buildFixture()) entries[path] = strToU8(text);
// A large media file that the browser reader must skip.
entries["instagram-testuser-2026-01-01-abc/media/posts/big.jpg"] = new Uint8Array(5 * 1024 * 1024);
writeFileSync(out, zipSync(entries));
console.log(`wrote ${out} with ${Object.keys(entries).length} entries`);
