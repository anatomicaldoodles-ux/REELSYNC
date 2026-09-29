import { describe, expect, it } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { extractTextEntries, readCentralDirectory } from "./zip-reader";

describe("zip-reader", () => {
  const zip = zipSync({
    "export/connections/followers_and_following/followers_1.json": strToU8("[]"),
    "export/media/posts/a.jpg": [new Uint8Array([1, 2, 3, 4]), { level: 0 }],
    "export/your_instagram_activity/likes/liked_posts.json": strToU8(JSON.stringify({ likes_media_likes: [] })),
  });
  const blob = new Blob([zip]);

  it("lists entries from the central directory", async () => {
    const entries = await readCentralDirectory(blob);
    expect(entries.map((e) => e.name).sort()).toEqual([
      "export/connections/followers_and_following/followers_1.json",
      "export/media/posts/a.jpg",
      "export/your_instagram_activity/likes/liked_posts.json",
    ]);
    expect(entries.find((e) => e.name.endsWith("a.jpg"))?.method).toBe(0);
  });

  it("extracts only filtered entries and decodes both stored and deflated data", async () => {
    const files = await extractTextEntries(blob, { filter: (n) => n.endsWith(".json") });
    expect([...files.keys()]).toHaveLength(2);
    expect(files.get("export/connections/followers_and_following/followers_1.json")).toBe("[]");
  });

  it("rejects non-zip input", async () => {
    await expect(readCentralDirectory(new Blob([strToU8("definitely not a zip file at all, no way")]))).rejects.toThrow(/Not a ZIP/);
  });
});
