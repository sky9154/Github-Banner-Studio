# Workflow

Start each task in a Codex conversation. Analyze a specified GitHub URL or external absolute path read-only. Do not move an entire project. Verify brand sources using [Brand Preservation](../.agents/skills/repository-banner/references/brand-preservation.md). Report missing access or assets.

| Task | Workflow | Output |
| --- | --- | --- |
| Complete brand | [repository-brand](../.agents/skills/repository-brand/SKILL.md) | Shared guidelines, 1:1 logo, and 2:1 banner |
| Logo Create/Refine/Export | [repository-logo](../.agents/skills/repository-logo/SKILL.md) | SVG, PNG, WebP, and small-size previews |
| README banner | [repository-banner](../.agents/skills/repository-banner/SKILL.md) | HTML/CSS/SVG sources, preview, and 1280 × 640 WebP |

Read the Skill and relevant references explicitly before using the tools. A `$skill-name` mention in a document does not automatically invoke another Skill or dispatch a subagent.

## Approval order for a complete brand

Analyze the source and existing brand → show two meaningfully different directions and wait for a choice → create and validate the logo, show it, and wait for approval → use the approved original logo source in the banner, validate and show it, then wait for approval → review and deliver both assets together.

Do not produce a formal design before direction approval or a formal banner before logo approval. Confirm before substantially replacing an official logo. Logo Create also requires a direction choice; Refine preserves the core outline and concept; Export only places the source proportionally in a square and never redesigns or crops a banner.

Shared records live beside the logo output by default. Use [Brand Records](../.agents/skills/repository-brand/references/brand-records.md) for analysis, directions, guidelines, and approvals. Use [Cross-Asset Review](../.agents/skills/repository-brand/references/cross-asset-review.md) for human comparison.

## Run the tools

From the Studio root, use Git Bash and write to an existing output or a separate candidate directory:

~~~bash
bun run logo:render 'logos/<owner>/<repository>' --size 1024 --background transparent
bun run logo:export 'logos/<owner>/<repository>'
bun run logo:validate 'logos/<owner>/<repository>'

bun run render 'banners/<owner>/<repository>'
bun run export 'banners/<owner>/<repository>'
bun run validate 'banners/<owner>/<repository>'

bun run brand:validate '<shared-records-directory>'
~~~

Set logo size and background only when rendering; later commands reuse the render record. Brand validation updates automated reports, not design assets or human-review records. If fonts, assets, dimensions, bounds, or hashes fail, fix the source and rerun the relevant commands. Do not conceal a failure by cropping the output.

## Iterate and deliver

Read the brief, shared guidelines, sources, and current approval hashes first. Redo only affected work. Preserve accepted versions under `versions/<name>/`; place comparisons under `candidates/<direction>/`. A logo or shared-color change may affect the banner, update the guidelines, and require new approval. A banner-only change does not invalidate approval of an unchanged logo. Present a new direction before changing shared direction.

Store automated results in `validation.md` or `brand-validation.md`; store inspected-image findings in `visual-review.md` or `brand-review.md`, with current hashes and viewing sizes. Inspect logo previews at 32/64/128 px and banners at 640 × 320 or larger. Without the image or source evidence, use NOT VERIFIED. Existing files, automated PASS, or a status written in a document do not constitute human approval.

Deliver absolute paths to sources, images, guidelines, and validation. Keep external repositories read-only. Copying output into a source repository or changing its README requires separate authorization. Do not commit, push, or open a pull request.

