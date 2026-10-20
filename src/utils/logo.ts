import { readFile } from "node:fs/promises";
import sharp from "sharp";

import { hashBytes, localFile, readJson } from "./common.ts";


export const LOGO_PREVIEW_SIZES = [32, 64, 128] as const;
export const MIN_LOGO_MARGIN = 0.08;
export const MAX_LOGO_BYTES = 8 * 1024 * 1024;

export interface LogoOptions {
  size: number;
  background: string;
}
export interface LogoRenderReport extends LogoOptions {
  version: 1;
  sourceHash: string;
  previewHash: string;
  smallPreviews: Record<string, string>;
  chromium: string;
  vector: boolean;
  fonts: string[];
  margin: number;
  errors: string[];
}
export interface LogoExportReport {
  version: 1;
  previewHash: string;
  outputs: Record<string, string>;
}

export function logoOptions(size = 1024, background = "transparent"): LogoOptions {
  if (!Number.isInteger(size) || size < 16 || size > 4096) {
    throw new Error("Logo size must be an integer from 16 to 4096 px.");
  }

  if (background !== "transparent" && !/^#[0-9a-f]{6}$/i.test(background)) {
    throw new Error("Background must be transparent or #RRGGBB.");
  }

  return { size, background };
}

export async function alphaBounds(input: Uint8Array): Promise<{ margin: number; opaque: boolean }> {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  return measureAlphaBounds(data, info.width, info.height);
}

export function measureAlphaBounds(
  data: Uint8Array,
  width: number,
  height: number
): { margin: number; opaque: boolean } {
  let minX = width,
    minY = height,
    maxX = -1,
    maxY = -1;
  let opaque = true;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3]!;

      if (alpha !== 255) {
        opaque = false;
      }

      if (alpha > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < 0) {
    throw new Error("Logo contains no visible artwork.");
  }

  return { margin: Math.min(minX, minY, width - 1 - maxX, height - 1 - maxY) / width, opaque };
}

export async function verifyLogoRender(directory: string): Promise<LogoRenderReport> {
  const report = await readJson<LogoRenderReport>(directory, "render.json");
  logoOptions(report.size, report.background);

  if (
    report.version !== 1 ||
    !Array.isArray(report.errors) ||
    report.errors.length ||
    typeof report.vector !== "boolean" ||
    !Array.isArray(report.fonts) ||
    !(report.margin >= MIN_LOGO_MARGIN - 1 / report.size)
  ) {
    throw new Error("Logo render record is incomplete or failed. Render again.");
  }

  if (hashBytes(await readFile(await localFile(directory, "logo.svg"))) !== report.sourceHash) {
    throw new Error("Logo source has changed. Render again.");
  }

  if (hashBytes(await readFile(await localFile(directory, "preview.png"))) !== report.previewHash) {
    throw new Error("Logo preview hash does not match the render record. Render again.");
  }

  for (const size of LOGO_PREVIEW_SIZES) {
    const name = `preview-${size}.png`;

    if (hashBytes(await readFile(await localFile(directory, name))) !== report.smallPreviews?.[name]) {
      throw new Error(`Logo small-preview hash mismatch: ${name}`);
    }
  }
  return report;
}
