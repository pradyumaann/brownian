// Next.js 16 static export on Windows writes prefetch segment files with backslash paths, so
// out/mood/__next.mood.__PAGE__.txt lands as out/mood/__next.mood/__PAGE__.txt and every prefetch 404s.
// Flatten any such folder back into the dotted filename the client router requests. No-op elsewhere.
import { readdir, rename, rm, stat } from "node:fs/promises";
import { join } from "node:path";

async function files(dir, rel = []) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...(await files(join(dir, e.name), [...rel, e.name])));
    else out.push([...rel, e.name]);
  }
  return out;
}

async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = join(dir, e.name);
    if (e.name.startsWith("__next.")) {
      for (const parts of await files(p)) await rename(join(p, ...parts), join(dir, [e.name, ...parts].join(".")));
      await rm(p, { recursive: true });
    } else if (e.name !== "_next") await walk(p);
  }
}

if ((await stat("out").catch(() => null))?.isDirectory()) await walk("out");
