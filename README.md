# GitHub Banner Studio

A Codex workspace for designing GitHub README banners and repository logos. It includes three Skills and local tools for rendering, exporting, and validating assets. Source repositories remain read-only.

## Set up

Install Git and Bun 1.4.3. From the project directory, run:

```bash
git clone https://github.com/sky9154/Github-Banner-Studio.git

cd Github-Banner-Studio

bun install --frozen-lockfile
bun run setup:browser
```

Open the cloned repository in Codex.

## Use the Skills

Codex discovers the Skills in `.agents/skills/` when you open this repository. Choose a Skill for the task:

- `$repository-banner` creates or updates a README banner.
- `$repository-logo` creates, refines, or exports a repository logo.
- `$repository-brand` coordinates a complete logo and banner workflow.

For a complete brand task, the Skill guides you through direction selection and approval at each stage. For details, read the relevant `SKILL.md` and its references.

## Install the Plugin

`.codex-plugin/plugin.json` describes the plugin. `.agents/plugins/marketplace.json` lists it in a Codex Marketplace, a catalog of installable plugins (not GitHub Marketplace). After publishing the repository, add it as a source in Codex:

```bash
codex plugin marketplace add sky9154/Github-Banner-Studio
```

Then install GitHub Banner Studio from the Plugins Directory. To use the Skills without installing the plugin, open the repository in Codex.

## Run the tools

Run commands from the Studio root. Output directories must be inside the Studio.

| Command | Purpose |
| --- | --- |
| `bun run render 'banners/<owner>/<repository>'` | Render a banner preview. |
| `bun run export 'banners/<owner>/<repository>'` | Export the banner as WebP. |
| `bun run validate 'banners/<owner>/<repository>'` | Validate banner files and hashes. |
| `bun run logo:render 'logos/<owner>/<repository>'` | Render a logo preview. |
| `bun run logo:export 'logos/<owner>/<repository>'` | Export PNG, WebP, and small-size previews. |
| `bun run logo:validate 'logos/<owner>/<repository>'` | Validate logo files and exports. |
| `bun run brand:validate 'logos/<owner>/<repository>'` | Check consistency between the approved logo and banner. |

Add `--help` for command options. These tools do not modify the source repository.

## Output formats

- **Banner:** 1280 × 640 WebP with editable HTML, CSS, and SVG sources.
- **Logo:** square SVG source with PNG and WebP exports.

See [architecture](docs/architecture.md) and [workflow](docs/workflow.md) for more information.

## License

The original source code and documentation in this repository are available under the [MIT License](LICENSE). Copyright © 2026 oF.
