import { exportLogo } from "./logo-export.ts";
import { renderLogo } from "./logo-render.ts";
import { validateLogo } from "./logo-validate.ts";
import { jobDirectory, reportCliError } from "./utils/common.ts";
import { logoOptions } from "./utils/logo.ts";


const USAGE =
  "Usage: bun run logo:render <output directory> [--size 1024] [--background transparent|#RRGGBB]; bun run logo:export <output directory>; bun run logo:validate <output directory>";

async function main(): Promise<void> {
  const [command, ...args] = Bun.argv.slice(2);

  if (args.length === 1 && ["--help", "-h"].includes(args[0]!)) {
    console.log(USAGE);

    return;
  }

  if (!["render", "export", "validate"].includes(command ?? "") || !args[0] || args[0].startsWith("--")) {
    throw new Error(USAGE);
  }

  let size = 1024,
    background = "transparent";
  const seen = new Set<string>();

  for (let i = 1; i < args.length; i += 2) {
    const flag = args[i]!;
    const value = args[i + 1];

    if (command !== "render" || !value || seen.has(flag) || !["--size", "--background"].includes(flag)) {
      throw new Error(USAGE);
    }
    seen.add(flag);

    if (flag === "--size") {
      size = Number(value);
    } else {
      background = value;
    }
  }

  const options = logoOptions(size, background);
  const directory = await jobDirectory(args[0]);

  if (command === "render") {
    await renderLogo(directory, options);
  } else if (command === "export") {
    await exportLogo(directory);
  } else {
    await validateLogo(directory);
  }
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    reportCliError(error);
  }
}
