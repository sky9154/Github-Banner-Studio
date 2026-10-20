# Logo Design

Create a modern geometric identity that is simple, distinctive, scalable, recognizable, geometrically consistent, relevant to the brand, and visually balanced. Derive the concept from verified product use. Use a defining contour or meaningful negative space; do not replace functional analysis with random geometry or generic tech decoration.

Prefer SVG Path, Circle, Rectangle, and Polygon. Use compound paths, even-odd fill, clipPath, or mask for boolean shapes when the result remains editable and has no unintended overlap. Keep angles, corner radii, stroke weights, and spacing consistent. Assess whitespace and optical balance together; mathematical symmetry does not guarantee visual balance.

Default to a square viewBox, 1024 × 1024, transparent background, and sRGB. Keep at least 8% safe margin. Export places the source proportionally on a square canvas; never stretch or crop it. A wide or tall source mark may sit in a nested SVG that preserves its original viewBox and ratio. The tools support integer edges from 16 to 4096 px; other ranges require a tool change.

Avoid excessive detail, complex shapes, 3D, shadows, and gradients. If an existing brand clearly relies on special effects, Refine or Export may preserve them when the source supports that choice. Do not apply the banner's flat-design rules as an absolute logo restriction. Do not imitate another brand or crop a banner into a square.

For Create, propose at least two directions. Explain “verified product function → geometry or negative space → small-size feature” and wait for the user's choice. Refine preserves the core contour and important brand concept. Export changes only proportional placement, whitespace, size, and background.

Verify font use and redistribution rights for text. Declare the first CSS font family in `data-logo-fonts`. Embed a licensed font or convert text to paths only when permitted; preserve the editable source. The tools do not automatically outline text or guarantee glyph coverage. Do not accept missing glyphs or a silent fallback.

Embed PNG, WebP, or JPEG only to faithfully export an existing raster logo. Record its source resolution and state that it is not pure vector. Upscaling a raster image does not vectorize it. Keep SVG self-contained; do not use external images, CDNs, file references, scripts, foreignObject, or animation.

