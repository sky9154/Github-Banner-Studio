import { readFile, writeFile } from "node:fs/promises";

import { openBrowser, type BrowserSession } from "./utils/browser.ts";
import { hashBytes, localFile, outputFile } from "./utils/common.ts";
import { inspectFonts } from "./utils/fonts.ts";
import {
  LOGO_PREVIEW_SIZES,
  MIN_LOGO_MARGIN,
  alphaBounds,
  logoOptions,
  type LogoOptions,
  type LogoRenderReport
} from "./utils/logo.ts";


export async function renderLogo(directory: string, options: LogoOptions = logoOptions()): Promise<void> {
  const { size, background } = logoOptions(options.size, options.background);
  const record = await outputFile(directory, "render.json");
  let session: BrowserSession | undefined;
  const errors = new Set<string>();

  try {
    const source = await readFile(await localFile(directory, "logo.svg"), "utf8");

    if (/<!DOCTYPE/i.test(source)) {
      throw new Error("DOCTYPE is not supported in logo SVG. Use a self-contained SVG.");
    }

    const previewPath = await outputFile(directory, "preview.png");

    session = await openBrowser();

    const context = await session.browser.newContext({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
      locale: "en-US",
      timezoneId: "UTC",
      colorScheme: "light",
      reducedMotion: "reduce",
      serviceWorkers: "block",
      javaScriptEnabled: false
    });

    context.setDefaultTimeout(15000);

    await context.route("**/*", async (route) => {
      errors.add(`External asset blocked: ${route.request().url()}`);

      await route.abort();
    });

    const page = await context.newPage();

    page.on("pageerror", (error) => errors.add(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.add(message.text());
      }
    });
    page.on("requestfailed", (request) => errors.add(`Asset failed to load: ${request.url()}`));

    await page.setContent(
      "<!doctype html><html><head><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; script-src 'none'\"><style>html,body{margin:0;background:transparent}body>svg{display:block}*,*::before,*::after{animation:none!important;transition:none!important}</style></head><body></body></html>"
    );

    const structural = await page.evaluate(
      ({ source, size }) => {
        const parsed = new DOMParser().parseFromString(source, "image/svg+xml");

        if (parsed.querySelector("parsererror")) {
          throw new Error("Invalid SVG XML.");
        }

        const root: Element = parsed.documentElement;

        if (root.localName !== "svg" || root.namespaceURI !== "http://www.w3.org/2000/svg") {
          throw new Error("SVG must have a valid root element and xmlns.");
        }

        const viewBox = (root.getAttribute("viewBox") ?? "")
          .trim()
          .split(/[\s,]+/)
          .map(Number);

        if (
          viewBox.length !== 4 ||
          viewBox.some((value) => !Number.isFinite(value)) ||
          viewBox[2]! <= 0 ||
          viewBox[2] !== viewBox[3]
        ) {
          throw new Error(
            "logo.svg must have a valid square viewBox. In Export mode, place the artwork proportionally inside a square SVG."
          );
        }

        if (root.querySelector("script,foreignObject,animate,animateMotion,animateTransform,set")) {
          throw new Error("Logo SVG must be static; scripts, foreignObject, and animation are unsupported.");
        }

        for (const element of [root, ...root.querySelectorAll("*")]) {
          if (element.getAttribute("preserveAspectRatio")?.trim().startsWith("none")) {
            throw new Error("preserveAspectRatio=none would distort the logo.");
          }

          for (const attribute of element.attributes) {
            if (/^on/i.test(attribute.name)) {
              throw new Error("Event-handler code is not allowed in the logo SVG.");
            }

            if (
              attribute.localName === "href" &&
              !attribute.value.startsWith("#") &&
              !/^data:(image\/(png|webp|jpeg)|font\/)/i.test(attribute.value)
            ) {
              throw new Error("Assets must be embedded; external href values are not allowed.");
            }
          }

          const css =
            element.getAttribute("style") ?? (element.localName === "style" ? (element.textContent ?? "") : "");
          const values = [...element.attributes].map((attribute) => attribute.value).join(" ") + " " + css;

          if (
            /@import/i.test(css) ||
            [...values.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)].some(
              (match) => !match[2]!.startsWith("#") && !match[2]!.startsWith("data:")
            )
          ) {
            throw new Error("SVG CSS cannot use external url values or @import.");
          }
        }

        const svg = document.importNode(root, true) as SVGSVGElement;

        svg.setAttribute("width", String(size));
        svg.setAttribute("height", String(size));
        svg.style.width = `${size}px`;
        svg.style.height = `${size}px`;
        document.body.append(svg);

        const box = svg.getBoundingClientRect();

        if (box.x !== 0 || box.y !== 0 || box.width !== size || box.height !== size) {
          throw new Error("CSS or transforms changed the SVG root canvas dimensions.");
        }

        return { vector: svg.querySelector("image") === null };
      },
      { source, size }
    );
    const fonts = await page.evaluate(async () => {
      const svg = document.querySelector("svg")!;
      const declared = (svg.getAttribute("data-logo-fonts") ?? "")
        .split(",")
        .map((font) => font.trim())
        .filter(Boolean);

      await document.fonts.ready;

      for (const text of svg.querySelectorAll("text,tspan")) {
        if (!text.textContent?.trim()) {
          continue;
        }

        const family = getComputedStyle(text).fontFamily.split(",")[0]!.trim().replaceAll(/["']/g, "");

        if (!declared.includes(family)) {
          throw new Error(
            `Font is not declared: ${family}. Add it to SVG data-logo-fonts or convert the text to paths when permitted.`
          );
        }
      }

      return declared;
    });

    await page.evaluate(inspectFonts, { fonts, sample: "Logo font sample Wm012345", failFast: true });
    await page.evaluate(async (size) => {
      for (const image of document.querySelectorAll("svg image")) {
        const decoder = new Image();

        decoder.src = image.getAttribute("href") ?? image.getAttributeNS("http://www.w3.org/1999/xlink", "href") ?? "";

        await decoder.decode();
      }

      for (const element of document.querySelectorAll("svg *")) {
        if (element.closest("defs") || !(element instanceof SVGGraphicsElement)) {
          continue;
        }

        const box = element.getBoundingClientRect();

        if (
          box.width &&
          box.height &&
          (box.left < -0.5 || box.top < -0.5 || box.right > size + 0.5 || box.bottom > size + 0.5)
        ) {
          throw new Error("SVG artwork extends beyond the canvas and may be unintentionally cropped.");
        }
      }
    }, size);

    if (errors.size) {
      throw new Error([...errors].join("\n"));
    }

    const preview = await page.screenshot({
      type: "png",
      omitBackground: true,
      animations: "disabled",
      fullPage: false
    });
    const { margin } = await alphaBounds(preview);

    if (margin < MIN_LOGO_MARGIN - 1 / size) {
      throw new Error(
        `Logo safe margin is too small: ${(margin * 100).toFixed(2)}%. Keep at least 8% whitespace in the source.`
      );
    }

    const smallPreviews: Record<string, string> = {};

    for (const smallSize of LOGO_PREVIEW_SIZES) {
      const name = `preview-${smallSize}.png`;
      const path = await outputFile(directory, name);

      await page.setViewportSize({ width: smallSize, height: smallSize });
      await page.evaluate((size) => {
        const svg = document.querySelector<SVGSVGElement>("body > svg")!;
        svg.setAttribute("width", String(size));
        svg.setAttribute("height", String(size));
        svg.style.width = `${size}px`;
        svg.style.height = `${size}px`;
      }, smallSize);

      const data = await page.screenshot({ type: "png", omitBackground: true, animations: "disabled" });

      await writeFile(path, data);

      smallPreviews[name] = hashBytes(data);
    }

    await writeFile(previewPath, preview);

    const report: LogoRenderReport = {
      version: 1,
      size,
      background,
      sourceHash: hashBytes(new TextEncoder().encode(source)),
      previewHash: hashBytes(preview),
      smallPreviews,
      chromium: session.browser.version(),
      vector: structural.vector,
      fonts,
      margin,
      errors: []
    };

    await writeFile(record, JSON.stringify(report, null, 2) + "\n");

    console.log(`Logo render passed: ${previewPath} (${size} × ${size})`);
  } catch (error) {
    await writeFile(
      record,
      JSON.stringify({ version: 1, errors: [error instanceof Error ? error.message : String(error)] }, null, 2) + "\n"
    );

    throw error;
  } finally {
    await session?.close();
  }
}
