import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { validateLogo } from "./logo-validate.ts";
import {
  STUDIO_ROOT,
  hashFile,
  jobDirectory,
  localFile,
  outputFile,
  readJson,
  runCli,
  type RenderReport
} from "./utils/common.ts";
import type { LogoRenderReport } from "./utils/logo.ts";
import { validateBanner } from "./validate.ts";


interface BrandRecord {
  schema: 1;
  logo_directory: string;
  banner_directory: string;
  approved_logo: string;
  approved_logo_sha256: string;
  banner_logo_asset: string;
  logo_size: number;
  logo_background: string;
}

export async function validateBrand(directory: string): Promise<void> {
  const reportPath = await outputFile(directory, "brand-validation.md");
  try {
    const guidelines = await localFile(directory, "brand-guidelines.md");
    const content = await readFile(guidelines, "utf8");
    const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(content);

    if (!match) {
      throw new Error("brand-guidelines.md is missing YAML frontmatter.");
    }

    const parsed: unknown = Bun.YAML.parse(match[1]!);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Brand guidelines frontmatter must be an object.");
    }

    const record = parsed as BrandRecord;
    const fields = [
      "logo_directory",
      "banner_directory",
      "approved_logo",
      "approved_logo_sha256",
      "banner_logo_asset",
      "logo_background"
    ] as const;

    if (
      record.schema !== 1 ||
      fields.some((field) => typeof record[field] !== "string" || !record[field].trim()) ||
      !/^[a-f0-9]{64}$/i.test(record.approved_logo_sha256) ||
      !Number.isInteger(record.logo_size)
    ) {
      throw new Error("Complete the brand guideline fields first: source directories, logo hash, and output settings.");
    }

    for (const name of ["brand-analysis.md", "design-directions.md"]) {
      if (!(await readFile(await localFile(directory, name), "utf8")).trim()) {
        throw new Error(`${name} cannot be empty.`);
      }
    }

    const logoDirectory = await jobDirectory(resolve(STUDIO_ROOT, record.logo_directory));
    const bannerDirectory = await jobDirectory(resolve(STUDIO_ROOT, record.banner_directory));

    if (logoDirectory === bannerDirectory) {
      throw new Error("Logo and banner must use separate output directories.");
    }

    if (!["logo.svg", "logo.png", "logo.webp"].includes(record.approved_logo)) {
      throw new Error("Approved logo must be a validated logo.svg, logo.png, or logo.webp.");
    }

    const approved = await localFile(logoDirectory, record.approved_logo);
    const asset = await localFile(bannerDirectory, record.banner_logo_asset);
    const expected = record.approved_logo_sha256.toLowerCase();

    if ((await hashFile(approved)) !== expected) {
      throw new Error(
        "The current logo hash does not match the brand guidelines. Review the change and update the shared guidelines."
      );
    }

    if ((await hashFile(asset)) !== expected) {
      throw new Error("The banner logo is not the same original asset. Do not generate a similar logo.");
    }

    await validateLogo(logoDirectory);
    await validateBanner(bannerDirectory);

    const logo = await readJson<LogoRenderReport>(logoDirectory, "render.json");
    const banner = await readJson<RenderReport>(bannerDirectory, "render.json");

    if (logo.size !== record.logo_size || logo.background !== record.logo_background) {
      throw new Error("Logo dimensions or background do not match the brand guidelines.");
    }

    const assetName = record.banner_logo_asset.replaceAll("\\", "/");

    if (banner.inputs[assetName] !== expected) {
      throw new Error(
        "A logo with the expected name exists, but the banner render did not load it. Reference the approved asset and render again."
      );
    }

    await writeFile(
      reportPath,
      [
        "# Cross-Asset Brand Validation",
        "",
        "Automated validation: PASS",
        "",
        `- Brand guidelines SHA-256: ${await hashFile(guidelines)}`,
        `- Shared logo: ${approved}; SHA-256: ${expected}`,
        `- Asset loaded by the banner: ${asset}; bytes match the shared logo.`,
        `- Logo: ${logo.size} × ${logo.size}; ${logo.background}; existing logo validation passed.`,
        `- Banner: ${banner.width} × ${banner.height}; existing banner validation passed.`,
        "",
        "Visual consistency and user approval: NOT VERIFIED",
        "",
        "This tool checks files, render records, outputs, and guideline settings. It does not establish that the user selected a direction or approved the logo or banner. Inspect colors, typography, geometry, brand preservation, decoration, and thumbnail legibility. Record the review in brand-review.md and approval evidence in brand-guidelines.md.",
        ""
      ].join("\n")
    );

    console.log(
      `Automated cross-asset checks passed: ${reportPath}. Human visual review and user approval are not verified by this command.`
    );
  } catch (error) {
    await writeFile(
      reportPath,
      `# Cross-Asset Brand Validation\n\nAutomated validation: FAIL\n\n${error instanceof Error ? error.message : String(error)}\n\nVisual consistency and user approval: NOT VERIFIED\n`
    );

    throw error;
  }
}

if (import.meta.main) {
  await runCli("Usage: bun run brand:validate <shared brand records directory>", validateBrand);
}
