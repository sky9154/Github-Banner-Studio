import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, readFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, resolve } from "node:path";
import { chromium, type Browser } from "playwright";

import { isWithin } from "./common.ts";


export interface BrowserSession {
  browser: Browser;
  close: () => Promise<void>;
}

export async function openBrowser(): Promise<BrowserSession> {
  if (process.platform !== "win32") {
    const browser = await chromium.launch({ timeout: 15000 });

    return {
      browser,
      close: async () => {
        await browser.close();
      }
    };
  }

  const temporaryRoot = await realpath(tmpdir());
  const profile = await mkdtemp(resolve(temporaryRoot, "banner-studio-chromium-"));
  let browser: Browser | undefined;
  let child: ChildProcess | undefined;
  let exited: Promise<void> | undefined;

  async function close(): Promise<void> {
    try {
      if (browser?.isConnected()) {
        const session = await browser.newBrowserCDPSession();

        await session.send("Browser.close").catch(() => { });
        await browser.close();
      }
    } finally {
      child?.kill();

      if (exited) {
        await exited;
      }

      const target = await realpath(profile);

      if (!isWithin(temporaryRoot, target) || target === temporaryRoot) {
        throw new Error("Browser temporary cleanup path escapes the allowed directory.");
      }

      await rm(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
  }
  try {
    const bundledRoot = dirname(dirname(chromium.executablePath()));
    const executable = resolve(
      dirname(bundledRoot),
      basename(bundledRoot).replace("chromium-", "chromium_headless_shell-"),
      "chrome-headless-shell-win64/chrome-headless-shell.exe"
    );

    child = spawn(
      executable,
      [
        "--headless",
        "--disable-gpu",
        "--force-color-profile=srgb",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-background-networking",
        "--remote-debugging-address=127.0.0.1",
        "--remote-debugging-port=0",
        `--user-data-dir=${profile}`,
        "about:blank"
      ],
      { windowsHide: true }
    );

    let launchError: Error | undefined;
    let diagnostic = "";

    child.stdout?.resume();
    child.stderr?.on("data", (chunk) => {
      diagnostic = (diagnostic + String(chunk)).slice(-2000);
    });
    child.on("error", (error) => {
      launchError = error;
    });
    exited = new Promise((resolveExit) => {
      child!.once("close", () => resolveExit());
    });

    const deadline = Date.now() + 15000;

    while (Date.now() < deadline) {
      if (launchError) {
        throw launchError;
      }

      if (child.exitCode !== null) {
        throw new Error(
          `Chromium exited (${child.exitCode}). Confirm bun run setup:browser has completed.${diagnostic}`
        );
      }

      const active = await readFile(resolve(profile, "DevToolsActivePort"), "utf8").catch(() => "");
      const [port, socket] = active.trim().split(/\r?\n/);

      if (port && socket && /^\d+$/.test(port)) {
        browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${socket}`, { timeout: 15000 });

        return { browser, close };
      }

      await Bun.sleep(100);
    }

    throw new Error("Chromium launch timed out. Check the browser installation and execution permissions.");
  } catch (error) {
    await close();

    throw error;
  }
}
