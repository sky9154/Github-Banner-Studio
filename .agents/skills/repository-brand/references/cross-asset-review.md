# Cross-Asset Review

## Automated evidence

`brand:validate` reuses the logo and banner validators to check settings, PNG/WebP decoding, and existing source evidence. It compares the logo SHA-256 in the guidelines with the logo output and the banner's copy. The banner's `render.json` must prove that it loaded that exact file; an unused file with the same name is not enough.

Matching bytes proves that both assets use the same source file. It does not prove the logo is visible in the banner, undistorted, or rendered with the same font. The tool cannot establish human approval, source licensing, or semantic brand consistency. Automated reports must retain NOT VERIFIED for those judgments.

## Human comparison

In `brand-review.md`, record the viewer, display size, and current asset hashes. Compare:

- The logo and banner use approved colors. Compare them with source CSS, design tokens, or SVG; do not mistake WebP compression differences for a color change.
- The visible banner logo is the approved version. Its outline, proportions, whitespace, and recognizability remain intact; it is not stretched, cropped, or redrawn as a similar mark.
- Geometry and functional graphics are consistent. No irrelevant decoration or extra brand marks were added.
- Fonts, project name, original language, and technical names are correct. No glyphs are missing, substituted, or cropped.
- The logo is legible at 32/64/128 px. The name and logo remain clear in a banner preview at 640 × 320 or larger.
- Colors, geometry, typography, and the selected direction support one another without brand conflict.

Use PASS, FAIL, NOT VERIFIED, or not applicable with a reason. Do not report a visual PASS without inspecting the images or a product/brand PASS without repository evidence. Real product relevance and formal human approval do not apply to test fixtures.

If review finds a mismatch, fix the source and rerun affected tools. After changing a logo, obtain approval for it before updating the banner, then show the final banner for approval. Do not force both assets into the same composition just to share colors.

