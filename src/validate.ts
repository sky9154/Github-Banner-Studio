import { readFile, stat, writeFile } from "node:fs/promises";
import sharp from "sharp";

import { verifyRender } from "./export.ts";
import {
  HEIGHT,
  MAX_BYTES,
  WIDTH,
  hashFile,
  localFile,
  outputFile,
  readJson,
  runCli,
  type ExportReport
} from "./utils/common.ts";


export async function validateBanner(directory: string): Promise<void> {
  const reportPath = await outputFile(directory, "validation.md");

  try {
    for (const name of [
      "brief.md",
      "banner.html",
      "banner.css",
      "preview.png",
      "readme-banner.webp",
      "render.json",
      "export.json"
    ]) {
      if ((await stat(await localFile(directory, name))).size === 0) {
        throw new Error(`Required file is empty: ${name}`);
      }
    }
    const rendered = await verifyRender(directory);
    const exported = await readJson<ExportReport>(directory, "export.json");
    const output = await localFile(directory, "readme-banner.webp");
    const size = (await stat(output)).size;

    if (
      exported.version !== 1 ||
      exported.previewHash !== rendered.previewHash ||
      exported.outputHash !== (await hashFile(output)) ||
      exported.bytes !== size
    ) {
      throw new Error("Export record does not match the current image. Export again.");
    }

    const rows: string[] = [];

    for (const [name, format] of [
      ["preview.png", "png"],
      ["readme-banner.webp", "webp"]
    ] as const) {
      const file = await localFile(directory, name);
      const input = await readFile(file);
      const metadata = await sharp(input).metadata();

      if (
        metadata.format !== format ||
        metadata.width !== WIDTH ||
        metadata.height !== HEIGHT ||
        (metadata.pages ?? 1) !== 1
      ) {
        throw new Error(`${name} format or dimensions are invalid.`);
      }

      await sharp(input, { failOn: "warning" }).raw().toBuffer();

      if (format === "webp" && metadata.hasAlpha) {
        throw new Error("WebP contains an alpha channel.");
      }
      rows.push(`- ${name}: PASS; ${format.toUpperCase()}; ${WIDTH} × ${HEIGHT}; 2:1; fully decoded.`);
    }
    if (size <= 0 || size > MAX_BYTES) {
      throw new Error(`WebP size ${size} bytes is outside the accepted range of 1–${MAX_BYTES} bytes.`);
    }

    await writeFile(
      reportPath,
      [
        "# Banner Validation",
        "",
        "Automated validation: PASS",
        "",
        ...rows,
        `- WebP size: ${size} bytes (2 MiB limit).`,
        "- Required files, source hashes, render record, and export record: PASS.",
        `- Declared fonts: ${rendered.fonts.join(", ")}; font loading, assets, and canvas bounds: PASS.`,
        "",
        "Visual review: NOT VERIFIED",
        "",
        "This command does not judge the logo, copy, colors, or composition. Inspect preview.png, readme-banner.webp, and a thumbnail in Codex, then record the findings and image hashes in visual-review.md. If image inspection is unavailable, leave the result NOT VERIFIED.",
        "Running this command again updates this report. Save human review in visual-review.md; this command does not overwrite it.",
        ""
      ].join("\n")
    );

    console.log(`Automated banner checks passed: ${reportPath}. Visual review is still required.`);
  } catch (error) {
    await writeFile(
      reportPath,
      `# Banner Validation\n\nAutomated validation: FAIL\n\n${error instanceof Error ? error.message : String(error)}\n\nVisual review: NOT VERIFIED\n`
    );

    throw error;
  }
}

if (import.meta.main) {
  await runCli("Usage: bun run validate <output directory>", validateBanner);
}
