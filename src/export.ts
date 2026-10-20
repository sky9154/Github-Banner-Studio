import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

import {
  HEIGHT,
  WIDTH,
  hashBytes,
  hashFile,
  localFile,
  outputFile,
  readJson,
  runCli,
  type ExportReport,
  type RenderReport
} from "./utils/common.ts";


export async function verifyRender(directory: string): Promise<RenderReport> {
  const report = await readJson<RenderReport>(directory, "render.json");

  if (
    report.version !== 1 ||
    report.width !== WIDTH ||
    report.height !== HEIGHT ||
    !Array.isArray(report.errors) ||
    report.errors.length ||
    !report.inputs?.["banner.html"] ||
    !report.inputs["banner.css"]
  ) {
    throw new Error("Render record is incomplete or contains errors. Render again before exporting.");
  }

  for (const [name, hash] of Object.entries(report.inputs)) {
    if ((await hashFile(await localFile(directory, name))) !== hash) {
      throw new Error(`Source has changed: ${name}. Render again before exporting.`);
    }
  }

  if ((await hashFile(await localFile(directory, "preview.png"))) !== report.previewHash) {
    throw new Error("Preview does not match the render record.");
  }

  return report;
}

export async function exportBanner(directory: string): Promise<void> {
  const report = await verifyRender(directory);
  const preview = await localFile(directory, "preview.png");
  const input = await readFile(preview);
  const metadata = await sharp(input).metadata();

  if (metadata.format !== "png" || metadata.width !== WIDTH || metadata.height !== HEIGHT) {
    throw new Error("Preview must be a 1280 × 640 PNG. Fix the source; do not crop or stretch the output.");
  }

  const output = await outputFile(directory, "readme-banner.webp");
  const record = await outputFile(directory, "export.json");
  const quality = 95;
  const bytes = await sharp(input)
    .flatten({ background: "#ffffff" })
    .removeAlpha()
    .webp({ quality, alphaQuality: 100, effort: 6, smartSubsample: true })
    .toBuffer();

  await writeFile(output, bytes);

  const exported: ExportReport = {
    version: 1,
    previewHash: report.previewHash,
    outputHash: hashBytes(bytes),
    quality,
    bytes: bytes.length
  };

  await writeFile(record, JSON.stringify(exported, null, 2) + "\n");

  console.log(`Export complete: ${output} (${bytes.length} bytes)`);
}

if (import.meta.main) {
  await runCli("Usage: bun run export <output directory>", exportBanner);
}
