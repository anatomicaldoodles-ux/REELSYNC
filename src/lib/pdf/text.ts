/** Strips characters the bundled PDF font cannot draw (emoji, variation selectors, control chars). */
export function pdfSafe(input: string | undefined, max = 200): string {
  if (!input) return "";
  return input
    .replace(/[\p{Extended_Pictographic}‍️\u{1F3FB}-\u{1F3FF}]/gu, "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
