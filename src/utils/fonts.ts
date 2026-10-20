interface FontInspectionOptions {
  fonts: string[];
  sample: string;
  failFast: boolean;
}

export async function inspectFonts({ fonts, sample, failFast }: FontInspectionOptions): Promise<string[]> {
  await document.fonts.ready;

  const failures: string[] = [];
  const probe = document.createElement("canvas").getContext("2d")!;

  for (const font of fonts) {
    const spec = `16px "${font}"`;

    try {
      await document.fonts.load(spec);
    } catch (error) {
      if (failFast) {
        throw error;
      }

      failures.push(`Font failed to load: ${font}`);
    }
    const faces = [...document.fonts].filter((face) => face.family.replaceAll(/["']/g, "") === font);
    const available =
      faces.length > 0
        ? faces.every((face) => face.status === "loaded")
        : ["monospace", "serif"].some((fallback) => {
            probe.font = `32px ${fallback}`;
            const baseline = probe.measureText(sample).width;
            probe.font = `32px "${font}", ${fallback}`;
            return probe.measureText(sample).width !== baseline;
          });
    if (!available || !document.fonts.check(spec)) {
      if (failFast) {
        throw new Error(`Font unavailable: ${font}. Silent fallback is not allowed.`);
      }

      failures.push(`Font unavailable: ${font}`);
    }
  }

  for (const face of document.fonts) {
    if (face.status !== "error") {
      continue;
    }

    if (failFast) {
      throw new Error(`Font failed to load: ${face.family}`);
    }

    failures.push(`Font resource error: ${face.family}`);
  }

  return failures;
}
