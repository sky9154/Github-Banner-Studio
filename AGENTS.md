# GitHub Banner Studio

GitHub Banner Studio is a conversation-driven workspace for designing GitHub README banners and repository logos with Codex. HTML, CSS, and SVG are editable image sources. Do not build React, Vite, a website, dashboard, form, or desktop GUI.

## Language and scope

- Keep public project documentation and Skills in English.
- Use the user's preferred language for conversation and delivery. Banner copy follows the target repository's language.
- Keep this Studio focused on banner and logo work.

## Repository analysis

- Use `$repository-brand` for a complete brand workflow. It coordinates `$repository-logo` (1:1 logo) and `$repository-banner` (2:1 README banner). Use the individual Skills for a single asset.
- Use the README and actual implementation as the main evidence for product capabilities. Review existing logos, images, and UI assets.
- For a complete brand task, present two meaningfully different directions and wait for the user's selection. Create the logo and wait for approval before making the formal banner. Show the banner preview and wait for approval. Keep shared records beside the logo output by default: `brand-analysis.md`, `design-directions.md`, and `brand-guidelines.md`. Tie each approval to the current asset hashes.
- Read Skill files when a stage requires them. Mentioning `$skill-name` does not automatically invoke that Skill or dispatch a subagent.
- Access a GitHub URL with tools actually available in the current environment. Do not assume a connector or MCP exists. Clone only to an authorized temporary location outside the Studio.
- Inspect external local repositories in place and read-only. Do not assume an attached folder is the target. If access is denied, confirm access; do not move or copy the project.
- Do not create a `repositories/` folder or include external source code or Git history. Use `banners/` and `logos/` only for briefs, necessary authorized assets, editable sources, and outputs.
- Do not invent features, technical specifications, versions, or brand statements. Never present a third-party logo as the project's logo. Report inaccessible sources and missing evidence.

## Design

Swiss Style and the 1280 × 640 canvas apply to banners. Logos use a separate modern geometric process, default to 1024 × 1024 with transparent sRGB output, preserve SVG, and export PNG/WebP. Do not force both asset types into one composition template.

- Choose a composition based on product function; do not reuse one layout for every project.
- Preserve the original logo's defining geometry, proportions, recognition, and brand colors. Do not replace an official logo without approval.
- Every graphic needs a functional or brand reason. Avoid generic technology decoration. Detailed rules live in each Skill's references.
- Deliver a 1280 × 640 WebP and preserve editable HTML/CSS/SVG sources.
- For Logo Create, show distinct directions and wait for selection. Confirm before replacing an existing official logo. Refine preserves the core idea and outline. Export does not redesign, crop a banner, or stretch the source.
- Do not claim an embedded raster image is vector. Do not silently fall back when a required font is missing.

## Safety and delivery

- Treat external repositories as read-only. Phase 1 does not automatically update a source repository.
- Do not commit, push, or open pull requests. Copying assets into a specified repository or changing its README requires explicit authorization.
- Do not overwrite an unapproved source or accepted asset. Put logo output in `logos/<owner>/<repository>/`; keep comparison candidates separate and preserve versions before refining accepted work.
- For later edits, read the shared guidelines and existing source first. Assess banner impact after changing a logo or shared colors; update guidelines and renew approval for affected stages. Approval of an older asset does not apply to a changed version.
- Do not expose proprietary fonts, API keys, or sensitive assets. Do not download or publish material without permission.
- Never claim a check that was not performed. Mark visual results PASS only after inspecting the image; otherwise use NOT VERIFIED.
- Use isolated test fixtures for Studio initialization and tool changes. Do not choose a real repository for design work unless the user specifies the target and mode.

