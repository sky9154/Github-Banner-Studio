import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

import { hashBytes, localFile, outputFile, readJson } from "./utils/common.ts";
import {
  LOGO_PREVIEW_SIZES,
  MAX_LOGO_BYTES,
  MIN_LOGO_MARGIN,
  alphaBounds,
  measureAlphaBounds,
  verifyLogoRender,
  type LogoExportReport
} from "./utils/logo.ts";


export async function validateLogo(directory: string): Promise<void> {
  const output = await outputFile(directory, "validation.md");

  try {
    if (!(await readFile(await localFile(directory, "brief.md"), "utf8")).trim()) {
      throw new Error("brief.md must not be empty.");
    }

    const report = await verifyLogoRender(directory);
    const bounds = await alphaBounds(await readFile(await localFile(directory, "preview.png")));

    if (bounds.margin < MIN_LOGO_MARGIN - 1 / report.size || bounds.margin !== report.margin) {
      throw new Error("Logo safe margin does not match the render record.");
    }

    const exported = await readJson<LogoExportReport>(directory, "export.json");

    if (exported.version !== 1 || exported.previewHash !== report.previewHash) {
      throw new Error("Logo export record is out of date.");
    }

    const rows: string[] = [];
    const pixels = new Map<string, Buffer>();

    for (const name of ["logo.png", "logo.webp", ...LOGO_PREVIEW_SIZES.map((size) => `logo-${size}.png`)]) {
      const input = await readFile(await localFile(directory, name));

      if (hashBytes(input) !== exported.outputs?.[name]) {
        throw new Error(`Logo output hash mismatch: ${name}`);
      }

      const metadata = await sharp(input).metadata();
      const smallSize = name.match(/logo-(\d+)\.png/);
      const size = smallSize ? Number(smallSize[1]) : report.size;
      const format = name.endsWith("webp") ? "webp" : "png";

      if (
        metadata.format !== format ||
        metadata.width !== size ||
        metadata.height !== size ||
        (metadata.pages ?? 1) !== 1 ||
        metadata.space !== "srgb"
      ) {
        throw new Error(`${name} format, 1:1 dimensions, or sRGB color space is invalid.`);
      }

      const raw = await sharp(input, { failOn: "warning" }).ensureAlpha().raw().toBuffer();

      if (name === "logo.png" || name === "logo.webp") {
        pixels.set(name, raw);
      }

      const { opaque } = measureAlphaBounds(raw, size, size);

      if ((report.background === "transparent" && opaque) || (report.background !== "transparent" && !opaque)) {
        throw new Error(`${name} transparency does not match the requested setting.`);
      }

      const corners = [0, size - 1, (size - 1) * size, size * size - 1];

      if (report.background === "transparent" && corners.some((pixel) => raw[pixel * 4 + 3] !== 0)) {
        throw new Error(`${name} corners are not transparent.`);
      }

      if (report.background !== "transparent") {
        const expected = [1, 3, 5].map((offset) => parseInt(report.background.slice(offset, offset + 2), 16));

        if (corners.some((pixel) => expected.some((value, channel) => raw[pixel * 4 + channel] !== value))) {
          throw new Error(`${name} background color does not match the requested setting.`);
        }
      }

      if (input.length > MAX_LOGO_BYTES) {
        throw new Error(`${name} exceeds the Studio's 8 MiB acceptance limit.`);
      }

      rows.push(
        `- ${name}: PASS; ${size} × ${size}; ${format.toUpperCase()}; sRGB; fully decoded; ${input.length} bytes.`
      );
    }

    const png = pixels.get("logo.png")!;
    const webp = pixels.get("logo.webp")!;

    for (let i = 0; i < png.length; i += 4) {
      if (
        png[i + 3] !== webp[i + 3] ||
        (png[i + 3] !== 0 && (png[i] !== webp[i] || png[i + 1] !== webp[i + 1] || png[i + 2] !== webp[i + 2]))
      ) {
        throw new Error("Visible pixels differ between PNG and WebP.");
      }
    }

    await writeFile(
      output,
      [
        "# Logo Quality Validation",
        "",
        "Automated validation: PASS",
        "",
        `- SVG: valid square viewBox; rendered by Chromium ${report.chromium}.`,
        `- Source type: ${report.vector ? "pure vector (no image)" : "contains an embedded raster image; do not call it pure vector"}.`,
        `- Proportions and canvas bounds: PASS; transparent preview safe margin ${(report.margin * 100).toFixed(2)}% (8% minimum, with one-pixel quantization allowance).`,
        `- Background: ${report.background}; PNG/WebP visible pixels and alpha match.`,
        `- Fonts: ${report.fonts.length ? report.fonts.join(", ") + "; availability check passed" : "no text fonts declared"}.`,
        ...rows,
        "",
        "Visual review: NOT VERIFIED",
        "",
        "The 32/64/128 px files were generated and decoded. Inspect them to judge legibility, visual balance, product relevance, brand preservation, and internal overlap or cropping. Record the current SVG/PNG/WebP hashes and findings in visual-review.md. Automated checks do not count as visual approval.",
        ""
      ].join("\n")
    );
    console.log(`Automated logo checks passed: ${output}. Record visual findings separately.`);
  } catch (error) {
    await writeFile(
      output,
      `# Logo Quality Validation\n\nAutomated validation: FAIL\n\n${error instanceof Error ? error.message : String(error)}\n\nVisual review: NOT VERIFIED\n`
    );
    throw error;
  }
}
