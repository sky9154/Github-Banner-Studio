import { readFile, writeFile } from "node:fs/promises";
import { extname, relative } from "node:path";

import { openBrowser, type BrowserSession } from "./utils/browser.ts";
import { HEIGHT, WIDTH, hashBytes, localFile, outputFile, runCli, type RenderReport } from "./utils/common.ts";
import { inspectFonts } from "./utils/fonts.ts";


export async function renderBanner(directory: string): Promise<void> {
  await localFile(directory, "banner.html");
  await localFile(directory, "banner.css");

  const previewPath = await outputFile(directory, "preview.png");
  const reportPath = await outputFile(directory, "render.json");
  const errors = new Set<string>();
  const inputs: Record<string, string> = {};
  const mimeTypes: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf"
  };
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      try {
        const name = decodeURIComponent(new URL(request.url).pathname).replace(/^\/+/, "");
        const file = await localFile(directory, name);
        const bytes = await readFile(file);

        inputs[relative(directory, file).replaceAll("\\", "/")] = hashBytes(bytes);

        return new Response(bytes, {
          headers: {
            "Content-Type": mimeTypes[extname(file).toLowerCase()] ?? "application/octet-stream",
            "Cache-Control": "no-store",
            "Content-Security-Policy":
              "default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; script-src 'none'; frame-src 'none'; connect-src 'none'"
          }
        });
      } catch {
        return new Response("Local asset unavailable", { status: 404 });
      }
    }
  });

  let session: BrowserSession | undefined;

  try {
    console.log("Starting Chromium...");
    session = await openBrowser();

    const browser = session.browser;

    console.log("Creating the fixed canvas...");

    const context = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
      locale: "en-US",
      timezoneId: "UTC",
      colorScheme: "light",
      reducedMotion: "reduce",
      serviceWorkers: "block",
      javaScriptEnabled: false
    });

    context.setDefaultTimeout(15000);

    const origin = `http://127.0.0.1:${server.port}`;

    await context.route("**/*", async (route) => {
      const url = route.request().url();

      if (new URL(url).origin === origin || url.startsWith("data:")) {
        await route.continue();
      } else {
        errors.add(`External resource blocked: ${url}`);
        await route.abort("blockedbyclient");
      }
    });

    const page = await context.newPage();

    console.log("Loading the design and local assets...");

    page.on("pageerror", (error) => errors.add(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.add(message.text());
      }
    });
    page.on("requestfailed", (request) => errors.add(`Asset failed to load: ${request.url()}`));
    page.on("response", (response) => {
      if (response.status() >= 400) {
        errors.add(`HTTP ${response.status()}: ${response.url()}`);
      }
    });

    await page.goto(`${origin}/banner.html`, { waitUntil: "networkidle", timeout: 30000 });
    await page.evaluate(() => {
      const style = document.createElement("style");

      style.textContent =
        "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }";
      document.head.append(style);
    });

    console.log("Checking fonts and bounds...");

    const fonts = await page.evaluate(() =>
      (document.documentElement.dataset.bannerFonts ?? "")
        .split(",")
        .map((font) => font.trim())
        .filter(Boolean)
    );
    const fontFailures = await page.evaluate(inspectFonts, {
      fonts,
      sample: "Banner font sample Wm0123456789",
      failFast: false
    });
    const review = await page.evaluate(
      async ({ width, height, fonts, fontFailures }) => {
        const failures =
          fonts.length === 0
            ? ["HTML must declare the fonts it uses with data-banner-fonts.", ...fontFailures]
            : [...fontFailures];

        await Promise.all(
          [...document.images].map(async (image) => {
            try {
              await image.decode();
            } catch {
              failures.push(`Image cannot be decoded: ${image.getAttribute("src")}`);
            }
          })
        );

        const canvas = document.querySelector("#banner");
        if (!canvas) {
          failures.push("Missing #banner canvas.");
        } else {
          const box = canvas.getBoundingClientRect();

          if (box.x !== 0 || box.y !== 0 || box.width !== width || box.height !== height) {
            failures.push("#banner must be at (0,0) and measure 1280 × 640.");
          }
        }
        const outside = (box: DOMRect) =>
          box.width > 0 &&
          box.height > 0 &&
          (box.left < -0.5 || box.top < -0.5 || box.right > width + 0.5 || box.bottom > height + 0.5);

        for (const element of document.body.querySelectorAll("*")) {
          if (getComputedStyle(element).visibility === "hidden" || getComputedStyle(element).display === "none") {
            continue;
          }

          if (outside(element.getBoundingClientRect())) {
            failures.push(`Element outside canvas: ${element.tagName}${element.id ? `#${element.id}` : ""}`);
          }

          for (const child of element.childNodes) {
            if (child.nodeType !== Node.TEXT_NODE || !child.textContent?.trim()) {
              continue;
            }

            const firstFamily = getComputedStyle(element).fontFamily.split(",")[0]!.trim().replaceAll(/["']/g, "");

            if (!fonts.includes(firstFamily)) {
              failures.push(
                `Font is not declared: ${firstFamily}. Add the first CSS font family to data-banner-fonts.`
              );
            }

            const range = document.createRange();

            range.selectNodeContents(child);

            if ([...range.getClientRects()].some(outside)) {
              failures.push(`Text outside canvas: ${child.textContent.trim().slice(0, 50)}`);
            }
          }
        }

        if (document.documentElement.scrollWidth > width || document.documentElement.scrollHeight > height) {
          failures.push("Page overflow detected.");
        }

        return { fonts, failures };
      },
      { width: WIDTH, height: HEIGHT, fonts, fontFailures }
    );

    for (const error of review.failures) {
      errors.add(error);
    }

    if (!Object.keys(inputs).includes("banner.css")) {
      errors.add("banner.css was not loaded. Use a stylesheet link with a relative path.");
    }

    if (errors.size) {
      throw new Error([...errors].join("\n"));
    }

    const preview = await page.screenshot({
      type: "png",
      fullPage: false,
      animations: "disabled",
      omitBackground: false
    });

    await writeFile(previewPath, preview);

    const report: RenderReport = {
      version: 1,
      width: WIDTH,
      height: HEIGHT,
      chromium: browser.version(),
      fonts: review.fonts,
      inputs,
      previewHash: hashBytes(preview),
      errors: []
    };

    await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");

    console.log(`Render passed: ${previewPath}`);
  } catch (error) {
    await writeFile(
      reportPath,
      JSON.stringify(
        { version: 1, errors: [...errors, error instanceof Error ? error.message : String(error)] },
        null,
        2
      ) + "\n"
    );

    throw error;
  } finally {
    try {
      await session?.close();
    } finally {
      server.stop(true);
    }
  }
}

if (import.meta.main) {
  await runCli("Usage: bun run render <output directory>", renderBanner);
}
