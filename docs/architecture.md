# Architecture

## Brand coordination

`repository-brand` coordinates the conversation workflow. It reads the two existing asset Skills and their references, analyzes the source, selects a shared direction, then waits for logo and banner approval in turn. It does not add a Skill invocation API, subagents, automatic approval, or another renderer.

Shared brand analysis, proposals, and guidelines live beside the logo output by default. The banner brief points to the same records. Assets remain in the existing `logos/` and `banners/` structure. For later changes, approved guidelines and hashes identify the stages that need to be repeated.

`src/brand-validate.ts` reuses `validateLogo` and `validateBanner`, then reads validated render records to check guideline settings, the logo SHA-256, the banner copy, and evidence that it was loaded. It does not recompute the same source hashes. The tool updates two automated reports and `brand-validation.md`. Human review records still provide evidence for color, geometry, fonts, brand meaning, and user approval. The tool cannot infer approval from a YAML field or hash.

## Logo tools

`repository-logo` defines Create, Refine, and Export decisions and a separate 1:1 quality standard. It shares read-only repository discovery and brand preservation with `repository-banner`, but not its composition template. Create requires the user to choose a direction; replacing an existing identity requires separate approval.

The Logo CLI in `src/logo.ts` routes to logo-render, logo-export, and logo-validate. It reuses the Windows Chromium/CDP flow in `utils/browser.ts` and output-path isolation and hashing in `utils/common.ts`. It leaves the three Banner tools and their contracts intact and adds no dependencies or UI.

~~~text
logo.svg
  → preview.png + preview-32/64/128.png + render.json
  → logo.png + logo.webp + logo-32/64/128.png + export.json
  → validation.md
~~~

All sizes preserve the same SVG viewBox ratio. PNG and lossless WebP come from the same rendered source; validation compares visible pixels and alpha. The background is composited only during export; the transparent preview is used to measure safe margins.

Logo SVG is parsed with DOMParser in Chromium, then rendered on a static canvas with JavaScript disabled and restricted resources. The source must be self-contained. Text fonts are declared explicitly. SVGs containing `image` are labeled as raster-based. Automated bounds checks do not prove that internal clipping, visual balance, or brand relevance is correct. Record human review in `visual-review.md`. The main output supports 16–4096 px and is limited to 8 MiB.

## Responsibilities

The Codex conversation interprets the request, gathers source evidence, selects a design direction, edits the design, inspects images, and delivers the results. `AGENTS.md` defines Studio workflow and safety rules. The three Skills coordinate brand work and provide distinct logo and banner workflows; references hold their detailed design rules.

The TypeScript CLI handles static design sources inside the Studio:

~~~text
Source repository (read-only) → Codex analysis → brief + HTML/CSS/SVG
                                                  ↓ render
                                         preview.png + render.json
                                                  ↓ export
                                      readme-banner.webp + export.json
                                                  ↓ validate
                                           validation.md (automated)
                                                  ↓ Codex image review
                                           visual-review.md (human)
~~~

## Isolation and loading

Output directories must remain inside the Studio, and asset realpaths must remain inside their output directory. The tools do not follow existing symlinks to external output files. External projects are not moved, copied in full, used as render roots, or added as Git history.

Rendering starts a temporary static server bound to `127.0.0.1` on a random port; it is not a user interface. On Windows, Playwright's Chromium Headless Shell is controlled through a temporary local CDP connection. Bun 1.4.3 is pinned as a project dependency for this transport; the global Bun installation is unchanged. The browser profile lives in the system temp directory. The server and Chromium are closed and the profile is removed when the run ends. Playwright and CSP restrict resource sources and disable JavaScript, frames, and service workers. A failed external asset request fails the render.

Font declarations, FontFace loading state, and system-font measurement provide availability checks; the first CSS font for each text element must also be declared. Glyph coverage, typography quality, and brand accuracy still require visual review. Geometric bounds catch common overflow but cannot guarantee the absence of all CSS clipping, overlap, or contrast problems.

Banner and logo tools share font availability checks in `utils/fonts.ts`, while retaining the distinction between collected Banner errors and immediate Logo failures. `utils/logo.ts` centralizes logo preview sizes, safe margins, and size limits. Validators reuse decoded pixels to measure alpha. `utils/common.ts` provides path isolation, hashing, and consistent CLI error reporting.

## Evidence and output

Render records include the Chromium version, declared fonts, hashes for successfully loaded HTML/CSS/assets, and the preview hash. A failure writes a failure record, so an earlier preview is no longer considered current. Export and validation compare hashes; changing the source requires a new render.

Sharp exports a quality-95 WebP from the preview at its original dimensions and removes alpha. Validation fully decodes PNG/WebP and checks 1280 × 640 dimensions, a single image, 2:1 ratio, WebP size, and required output files. The tools do not draw or replace logos and do not create Git commits.

`validation.md` can be regenerated. Human review belongs in `visual-review.md` and must refer to the exact image hashes. After an image changes, a prior review does not apply to the new version.

## Phase 1 boundary

The isolated fixture lives in `tests/fixtures/basic/` and is labeled as test material. The Studio does not automatically download repositories, update GitHub, modify source READMEs, or create an operating UI. Phase 2 can use the existing workflow to create the first formal banner after the user specifies a target.

