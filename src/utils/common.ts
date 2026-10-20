import { createHash } from "node:crypto";
import { lstat, readFile, realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";


export const WIDTH = 1280;
export const HEIGHT = 640;
export const MAX_BYTES = 2 * 1024 * 1024;
export const STUDIO_ROOT = resolve(import.meta.dir, "../..");

export interface RenderReport {
  version: 1;
  width: number;
  height: number;
  chromium: string;
  fonts: string[];
  inputs: Record<string, string>;
  previewHash: string;
  errors: string[];
}

export interface ExportReport {
  version: 1;
  previewHash: string;
  outputHash: string;
  quality: number;
  bytes: number;
}

export function isWithin(root: string, path: string): boolean {
  const suffix = relative(root, path);

  return suffix === "" || (!isAbsolute(suffix) && suffix !== ".." && !suffix.startsWith(`..${sep}`));
}

export async function jobDirectory(input: string): Promise<string> {
  const root = await realpath(STUDIO_ROOT);
  const directory = await realpath(resolve(input));

  if (!isWithin(root, directory) || directory === root) {
    throw new Error(
      "Output directory must be a subdirectory of GitHub Banner Studio. External repositories may only be inspected by Codex in read-only mode."
    );
  }

  if (!(await stat(directory)).isDirectory()) {
    throw new Error("Specified path is not a directory.");
  }

  return directory;
}

export async function localFile(directory: string, name: string): Promise<string> {
  const file = await realpath(resolve(directory, name));

  if (!isWithin(directory, file) || !(await stat(file)).isFile()) {
    throw new Error(`Asset must be a file inside the output directory: ${name}`);
  }

  return file;
}

export async function outputFile(directory: string, name: string): Promise<string> {
  const file = resolve(directory, name);

  if (!isWithin(directory, file)) {
    throw new Error(`Output path escapes the output directory: ${name}`);
  }

  const existing = await lstat(file).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") {
      throw error;
    }

    return undefined;
  });

  if (existing && (!existing.isFile() || existing.isSymbolicLink())) {
    throw new Error(`Output must be a regular file, not a link: ${name}`);
  }

  if (!isWithin(directory, await realpath(dirname(file)))) {
    throw new Error("Output directory escapes the allowed directory.");
  }

  return file;
}

export function hashBytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function hashFile(file: string): Promise<string> {
  return hashBytes(await readFile(file));
}

export async function readJson<T>(directory: string, name: string): Promise<T> {
  return JSON.parse(await readFile(await localFile(directory, name), "utf8")) as T;
}

export function reportCliError(error: unknown): void {
  console.error(`Failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}

export async function runCli(usage: string, action: (directory: string) => Promise<void>): Promise<void> {
  const args = Bun.argv.slice(2);

  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    console.log(usage);

    return;
  }
  try {
    if (args.length !== 1 || !args[0]) {
      throw new Error(usage);
    }

    await action(await jobDirectory(args[0]));
  } catch (error) {
    reportCliError(error);
  }
}
