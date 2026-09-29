/**
 * Instagram's JSON export writes UTF-8 bytes as individual `\u00XX` escapes,
 * so after JSON.parse, "é" arrives as the two characters "Ã©". This re-decodes
 * such strings. Strings that already contain characters above U+00FF are left
 * untouched, as are strings that are not valid UTF-8 byte sequences.
 */
const decoder = new TextDecoder("utf-8", { fatal: true });

export function fixEncoding(input: string): string {
  let needsFix = false;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    if (c > 0xff) return input;
    if (c >= 0x80) needsFix = true;
  }
  if (!needsFix) return input;
  const bytes = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) bytes[i] = input.charCodeAt(i);
  try {
    return decoder.decode(bytes);
  } catch {
    return input;
  }
}

/** Recursively fixes every string value in a parsed JSON structure (in place). */
export function fixEncodingDeep<T>(value: T): T {
  if (typeof value === "string") return fixEncoding(value) as T;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = fixEncodingDeep(value[i]);
    return value;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of Object.keys(obj)) obj[key] = fixEncodingDeep(obj[key]);
    return value;
  }
  return value;
}
