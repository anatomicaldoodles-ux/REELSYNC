import { Text, type TextProps } from "@react-pdf/renderer";

const DEVANAGARI_RUN = /[ऀ-ॿ᳐-᳿꣠-ꣿ]+(?:[\s।॥.,!?:;'"()\-]*[ऀ-ॿ᳐-᳿꣠-ꣿ]+)*/g;

export const DEVANAGARI_FAMILY = "NotoDevanagari";

/** Splits a string into runs that need the Devanagari font versus the default font. */
export function splitScriptRuns(text: string): { text: string; devanagari: boolean }[] {
  const runs: { text: string; devanagari: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(DEVANAGARI_RUN)) {
    const start = m.index ?? 0;
    if (start > last) runs.push({ text: text.slice(last, start), devanagari: false });
    runs.push({ text: m[0], devanagari: true });
    last = start + m[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last), devanagari: false });
  return runs;
}

/**
 * Text that switches to the Devanagari font for Hindi/Marathi/Nepali runs.
 * Use it wherever user-written content (names, bios, captions, words) is printed.
 */
export function MixedText({ children, ...props }: Omit<TextProps, "children"> & { children: string }) {
  const runs = splitScriptRuns(children);
  if (!runs.some((r) => r.devanagari)) return <Text {...props}>{children}</Text>;
  return (
    <Text {...props}>
      {runs.map((r, i) =>
        r.devanagari ? (
          <Text key={i} style={{ fontFamily: DEVANAGARI_FAMILY }}>
            {r.text}
          </Text>
        ) : (
          r.text
        ),
      )}
    </Text>
  );
}
