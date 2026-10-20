# Banner Quality Checklist

## Automated checks

- The brief, HTML, CSS, PNG preview, WebP, and render/export records exist and are non-empty.
- PNG and WebP formats are valid and fully decodable. Each image is 1280 × 640 (2:1).
- The final WebP has no alpha channel and is 1 byte to 2 MiB (the Studio's acceptance limit).
- The canvas starts at `(0,0)`. The page does not overflow, and no element or text extends beyond the screenshot bounds.
- Declared fonts are available. Images decode, and the stylesheet, CSS images, and local font assets load without errors. No external network resources are used.
- Source, preview, and export hashes match the current files. No outdated render is used.

Run `bun run render '<directory>'`, `bun run export '<directory>'`, then `bun run validate '<directory>'`. Fix failures before continuing. Automated boundary checks do not catch every overlap, CSS clipping issue, missing glyph, or low-contrast case.

## Visual inspection

Use an available image viewer to inspect the PNG and final WebP, then inspect the thumbnail at 640 × 320 or smaller. Record each item:

- The logo is undistorted; its outline, proportions, and recognizability are preserved.
- The project name and approved copy are correct. Glyphs, line breaks, and text contrast are clear.
- Brand colors are consistent and supported by sources.
- Primary, secondary, and supporting levels are clear; whitespace and alignment are deliberate.
- Graphics relate to product function and contain no unnecessary decoration.
- The design remains legible as a README thumbnail. WebP compression has not visibly damaged text or geometric edges.
- The banner is not too similar to banners for other Studio projects. If no other official banner exists, mark this “Not applicable: no official banner to compare”; do not invent a comparison.
- Nothing is cropped or obscured, and there are no font fallbacks or missing glyphs.

The automated result belongs in `validation.md`. Record human findings in `visual-review.md`, including the viewer and display size, PNG and WebP SHA-256 values, each PASS/FAIL/NOT VERIFIED/not-applicable result, and its reason. A test fixture without a supplied logo cannot establish brand correctness. If you cannot inspect the image, mark it NOT VERIFIED. Do not present automated checks as visual approval. After changing an image, verify its current hashes and review.

