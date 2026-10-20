# Logo Quality Checklist

## Automated checks

- A non-empty brief and SVG exist. The SVG parses as XML, includes `xmlns`, and has a valid square viewBox.
- Chromium renders the SVG. Assets are self-contained and static; declared fonts are available; no external assets or render errors remain.
- The SVG does not use `preserveAspectRatio="none"`. The root canvas is valid and shapes remain within bounds. The transparent preview has at least 8% alpha margin, allowing one pixel of quantization error.
- PNG and WebP have the requested 1:1 dimensions, use sRGB, contain a single image, decode fully, and match the current source hash. Each file is at most 8 MiB (the Studio's acceptance limit).
- Transparent output retains alpha and transparent corners. Solid-background output is opaque and has the requested corner color.
- Visible pixels and alpha match between PNG and lossless WebP rendered from the same SVG. Differences in RGB values of fully transparent pixels do not affect the image.
- 32/64/128 px files are rendered directly from the same SVG, exist, and decode. Their existence does not prove legibility.
- If the SVG contains an `image`, report that it contains raster artwork; do not call it pure vector.

Automated checks cannot determine whether internal clipping is intentional, whether the composition is balanced, or whether it fits the product. Font availability does not prove licensing, complete glyph coverage, or brand-accurate typography.

## Visual inspection

Inspect the 32/64/128 px images at their actual display sizes, not only enlarged. Also inspect the full PNG and WebP, compare them with the rendered SVG and original source, and record:

- No distortion, incorrect proportions, unintended cropping, or internal obstruction.
- Adequate safe margins and balanced visual weight.
- Recognizable outlines, negative space, details, and text at all three sizes.
- A relationship between the graphic and verified product functions.
- For Refine/Export, preserved defining brand traits. For Create, approved direction and authorization to replace an existing official mark.
- No font fallback or missing glyphs; font licensing and outlining status are accurate.

Put automated findings in `validation.md` and human findings in `visual-review.md`, with SVG/PNG/WebP hashes, viewer, and viewing sizes. Use PASS, FAIL, NOT VERIFIED, or not applicable with a reason. Without image inspection or source evidence, retain NOT VERIFIED; do not claim brand accuracy or legibility. For an isolated test fixture, product relevance and official-brand preservation are not applicable.

