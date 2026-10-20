# Brand Preservation

## Find and identify assets

Check README image references, official documentation, `assets/`, `public/`, `docs/`, application icons, and UI screenshots. Identify logos by where and how they are used. Dependency badges, platform badges, and third-party service marks are not project logos. Record the actual source path or URL; do not treat an arbitrary image with a matching filename as official.

## Preserve and use assets

Prefer original vector assets such as SVG. Preserve the viewBox and aspect ratio. Scale proportionally, add whitespace, and choose a suitable background; do not stretch, crop identifying contours, redraw core geometry, or recolor arbitrarily. Record the source when using an official monochrome or reversed logo. Use raster logos at their original resolution and avoid visible upscaling.

Save only necessary assets that the user is authorized to use in the output's `assets/` directory, with source and licensing details. Do not save an entire external project, secrets, or proprietary fonts. Readable source does not imply permission to publish. If licensing is unclear, explain the limit and look for an authorized alternative.

Use brand colors in this order of authority: official brand guidelines or design tokens, official logo, actual UI stylesheet or screenshot, then README imagery. If sources conflict, record the chosen basis in the brief rather than imposing a preferred color.

## Abstract UI elements

Preserve recognizable geometry, proportions, colors, and information structure, then abstract them into flat SVG. A functional graphic needs evidence in the code or UI. Do not use a third-party mark to represent the project. Before using a UI screenshot that may contain private data, remove sensitive details or replace it with an abstract geometric representation.

## When no logo is found

Confirm that the source truly lacks a logo; distinguish that from a logo you cannot access. Use project-name typography and verified functional imagery if appropriate, and note “No usable logo found” in the brief. A functional graphic is not a new official mark and must not be presented as the brand identity. Ask the user for assets when needed.

