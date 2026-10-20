import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

import { hashBytes, localFile, outputFile } from "./utils/common.ts";
import { LOGO_PREVIEW_SIZES, verifyLogoRender, type LogoExportReport } from "./utils/logo.ts";

export async function exportLogo(directory: string): Promise<void> {
  const report = await verifyLogoRender(directory);
  const input = await readFile(await localFile(directory, "preview.png"));
  const metadata = await sharp(input).metadata();

  if (metadata.format !== "png" || metadata.width !== report.size || metadata.height !== report.size) {
    throw new Error("Logo preview has an invalid format or dimensions.");
  }

  const names = ["logo.png", "logo.webp", ...LOGO_PREVIEW_SIZES.map((size) => `logo-${size}.png`), "export.json"];
  const paths = new Map<string, string>();

  for (const name of names) {
    paths.set(name, await outputFile(directory, name));
  }

  const pipeline = sharp(input).toColourspace("srgb");

  if (report.background !== "transparent") {
    pipeline.flatten({ background: report.background }).removeAlpha();
  }

  const png = await pipeline.png().toBuffer();
  const webp = await sharp(png).webp({ lossless: true, effort: 6 }).toBuffer();
  const outputs: Record<string, string> = {};

  for (const [name, data] of [
    ["logo.png", png],
    ["logo.webp", webp]
  ] as const) {
    await writeFile(paths.get(name)!, data);

    outputs[name] = hashBytes(data);
  }

  for (const size of LOGO_PREVIEW_SIZES) {
    const name = `logo-${size}.png`;
    const small = sharp(await readFile(await localFile(directory, `preview-${size}.png`))).toColourspace("srgb");

    if (report.background !== "transparent") {
      small.flatten({ background: report.background }).removeAlpha();
    }

    const data = await small.png().toBuffer();

    await writeFile(paths.get(name)!, data);

    outputs[name] = hashBytes(data);
  }

  const exported: LogoExportReport = { version: 1, previewHash: report.previewHash, outputs };

  await writeFile(paths.get("export.json")!, JSON.stringify(exported, null, 2) + "\n");

  console.log(
    `Logo export complete. SVG source preserved; PNG and lossless WebP created at ${report.size} × ${report.size} on ${report.background}.`
  );
}
