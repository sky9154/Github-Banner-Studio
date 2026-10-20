# Banner Design System

The canvas is fixed at 1280 × 640 (2:1) and follows Swiss Style / International Typographic Style. Use a modular 12-column grid and asymmetric typography. A 48 px outer margin and 16 px gutters are reasonable starting points; adjust them to fit the copy and logo. The grid is not a fixed template.

Use the primary level for the project name or functional graphic, the secondary level for a source-verified explanation, and supporting text only when it adds necessary, sourced information. Use alignment, scale, and whitespace to establish relationships instead of filling the canvas evenly. The design must remain recognizable at thumbnail size.

Use neo-grotesque sans-serif typography. Build hierarchy with Regular and Bold weights; avoid mixing many typefaces and weights. Choose fonts that are available and cover the banner's language. Compatible sans-serif fonts may be paired for Latin and CJK text. Declare font names in `data-banner-fonts` and match the CSS order. Confirm both use and redistribution rights before saving a local font. Do not download, publish, or expose an unauthorized proprietary font.

A font loading failure is a render failure that must be fixed; never silently accept a fallback. System fonts may vary by computer, while local fonts improve consistency. Automated availability checks do not guarantee every glyph exists, so inspect missing glyphs, weight, and line breaks manually.

Use no more than 2–4 main colors, based on sourced project branding or UI colors. Additional neutrals must support hierarchy and legibility. Use flat design; avoid shadows, gradients, glow, textures, and 3D effects. If the official logo itself uses such effects, preserve it instead of flattening or redrawing it. Prefer an authorized flat logo variant and record the rationale in the brief.

Keep graphics simple and tied to product function. Do not add circuitry, particles, glowing grids, or generic AI decoration to fill space. Set the background color explicitly in the source.

