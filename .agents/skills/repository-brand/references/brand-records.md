# Brand Records and Approvals

## Storage and reuse

By default, keep shared brand records in `logos/<owner>/<repository>/`. Link the banner brief back to the same records with a relative path. Keep logo and banner files in their existing directories; do not create a central folder for external source code. If a suitable shared location already exists, reuse it as the single source of truth. Pass that directory to `brand:validate`.

For a complete brand task, copy the analysis, direction, and guideline templates from `assets/` into the output directory as needed. Templates are unfinished documents, not completed analysis or approval. Add a source to each field or mark it NOT VERIFIED; do not turn a gap into a guess.

- `brand-analysis.md`: repository evidence, product function, and brand sources; complete all 11 template fields.
- `design-directions.md`: two complete proposals with meaningful differences and the user's selection.
- `brand-guidelines.md`: the single approved logo, colors, typography, geometry, banner composition, and approval evidence.
- `brand-validation.md`: reproducible automated consistency report.
- `brand-review.md`: human comparison, current SVG/PNG/WebP/banner hashes, and user-approval status. Without evidence, use NOT VERIFIED.

## Three approval stages

1. Before a direction is selected, complete only evidence-based analysis and the two proposals. Do not begin formal design or output.
2. After direction approval, create the logo. Do not create the formal banner until the logo is approved.
3. After the banner is complete, show the preview and wait for approval before calling the full delivery approved.

Record the user's exact approval or a traceable conversation reference, along with the file or image SHA-256 values at that stage. A directory name, successful CLI run, the word “confirmed” in a document, or a note written by the agent is not user authorization. Do not ask for the same approval twice if it is already explicit in the conversation. These three approval gates come from the user-defined workflow, not an assumption made by the tools.

## Frontmatter and commands

The guidelines template includes `schema`, `logo_directory`, `banner_directory`, `approved_logo`, `approved_logo_sha256`, `banner_logo_asset`, `logo_size`, and `logo_background`. Directories are relative to the Studio root; asset paths are relative to their logo or banner output directory. `approved_logo` accepts only a validated `logo.svg`, `logo.png`, or `logo.webp`; prefer the original SVG. The default is a 1024 px transparent logo. Record and validate any settings the user specifies.

After approval, calculate the real file hash and complete the guidelines. Never run with the template's null or placeholder values. A SHA field identifies the expected asset version; code cannot infer user approval from a hash.

`brand:validate` updates the two automated `validation.md` reports and `brand-validation.md`. It does not modify design sources, image files, or `visual-review.md`. It cannot judge semantic color choices, brand consistency, user approval, or official asset provenance; these require human evidence. Before delivery, confirm that all three approvals still match the current versions.

## Iteration

Read the shared guidelines, brief, source files, and approval records first. Reanalyze only facts affected by the change. Preserve approved versions. Keep a single-asset candidate in that asset's `candidates/` folder; for a paired comparison, record the shared direction and both candidate paths. Update hashes and any affected approvals after changing files; approval of an older version does not carry over to a new image.

If only the output size changes, re-export and validate, then record the purpose and size in the guidelines. A banner composition change does not invalidate the approved logo. When the logo or shared colors change, assess the banner's assets and typography. If it needs an update, do that after the revised logo is approved. If the shared direction changes, show the new direction and wait for selection.

