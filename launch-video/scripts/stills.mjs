import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import { mkdir } from "node:fs/promises";

const frames = process.argv.slice(2).map((n) => Number(n));
if (frames.length === 0 || frames.some((n) => Number.isNaN(n))) {
  console.error("usage: node scripts/stills.mjs <frame>...");
  process.exit(1);
}

const entry = path.resolve("src/index.ts");
const outDir = path.resolve("out/stills");
await mkdir(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: entry });
const composition = await selectComposition({
  serveUrl,
  id: "Launch",
  browserExecutable: "/usr/bin/google-chrome",
});

for (const frame of frames) {
  const output = path.join(outDir, `f${String(frame).padStart(4, "0")}.png`);
  await renderStill({
    composition,
    serveUrl,
    output,
    frame,
    browserExecutable: "/usr/bin/google-chrome",
    imageFormat: "png",
  });
  console.log(output);
}
