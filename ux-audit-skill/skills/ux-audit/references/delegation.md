# Delegating to subagents

Several jobs in this workflow are self-contained and benefit from a **clean context**: a subagent that sees only its inputs works more carefully than the main agent carrying screenshots, probe dumps and nine checklists. Delegate them when your environment can spawn subagents (Claude Code's Agent tool, or equivalent); otherwise do the same work inline, in the same order.

## Jobs and model tiers

Not every job needs the strongest model. Match the tier to the judgement the job requires:

- **Small/fast tier** (for example Haiku, GPT mini-class or Gemini Flash-class models): mechanical work with a fixed procedure and a checkable output. Running a script, reading JSON, copying numbers into a table.
- **Mid tier** (for example Sonnet, or a mid-size GPT or Gemini model): bounded craft with clear rules and a visual check. Matching a brand, building a mockup from a written spec.
- **Main model** (the one running the skill, typically your strongest model): open judgement. Deciding what is a problem, how bad it is, and whether a claim holds.

| Job | Step | Tier | Why this tier | Runs in parallel with |
|---|---|---|---|---|
| **Capture & digest** | 2 | Small | Runs `capture.mjs`, then condenses `summary.json` and every `probe.json` into one key-numbers table. Fixed procedure; the main context never reads the raw dumps. | — |
| **Today states** | 6, before the mockups | Mid | Scripts interactions (open a menu, trigger an error), screenshots each state, measures marker boxes. Needs some judgement to reach the state without committing anything. | Theme, if still running |
| **Theme** | 3 | Mid | Rules-driven token mapping plus a side-by-side visual check; contrast is verified by the checker. | Evaluation, rating |
| **Mockup**, Medium and High findings | 6 | Mid | The finding, the pattern and the content are all in the brief; the job is faithful execution in the kit. | Each other |
| **Mockup**, Critical or interaction-heavy findings (multi-state flows, sheets, new patterns) | 6 | Main | The design itself is the open question; a weak mockup undermines the most important finding. | Each other |
| **Review** | 8 | Main | Must catch overclaims, wrong numbers and miscalibrated ratings: the hardest judgement in the workflow. In testing, the review caught about 20 errors in a report the writer believed was finished. | — |

Evaluation (step 4), rating (step 5) and writing (step 7) stay with the main agent: they need the whole picture and set every number the reader will act on.

In testing on one product page, theming and each mockup took roughly 100K tokens apiece and the review about 170K. Moving theming and Medium/High mockups to the mid tier, and capture to the small tier, cuts the cost of a typical audit substantially without touching the judgement jobs.

**Setting the tier.** In Claude Code, pass `model: "haiku"` or `model: "sonnet"` to the Agent tool; omit it to inherit the main model. In Codex, spawn a subagent and set its model when asked (or let it inherit). In Antigravity, use a sub-agent or a Manager-surface agent where available. Elsewhere, use whatever model selector the subagent call offers, or run the job inline when there is none. If a lower tier's output fails its *done* check twice, redo the job one tier up rather than patching it yourself.

## Rules for every brief

- Give **absolute paths** to every input and the exact output path. The subagent has none of your context.
- Paste the finding text itself (not "see finding F03"): the subagent cannot read your memory.
- Tell it what *done* means and to reply with a short summary, not the file contents.
- Check the result yourself before using it: open the file, render it, run the checker. A subagent's "done" is a claim.

---

## Capture & digest brief

> You are collecting evidence for a UX audit. Do not judge the page; only measure and report.
>
> **Read first**: `<SKILL_DIR>/references/measurement.md` (viewports and probe fields).
> **Run**: `node <SKILL_DIR>/scripts/capture.mjs --out <EVIDENCE_DIR> <URL> [<URL> …]`. If it fails because the browser is missing, run `npx playwright install chromium` once and retry; if it still fails, reply with the error.
>
> Then write `<EVIDENCE_DIR>/digest.md`: one table per page with, for each viewport, page length in screens, horizontal overflow, H1 count, skip link, landmarks, targets under 44 px and under 24 px (count and the five worst with size), `offscreenFocusable` count, contrast failures (count and the three worst with ratio), small-text count, inputs without labels or under 16 px, fixed chrome % of viewport, live regions; plus the throttled LCP, CLS and FCP from `perf.json`. Copy numbers exactly; write "n/a" for missing fields.
>
> **Done when** every page and viewport has a row and every number in `digest.md` appears in a JSON file. Reply with the path to `digest.md` and any capture errors.

## Today states brief

> You are capturing the visual evidence for specific usability problems on a live page. Read-only: never submit a form, sign in, add payment data or place an order.
>
> **Read first**: `<SKILL_DIR>/references/measurement.md`, sections *Today states* and *Boxes for annotations*.
> **Page**: `<URL>` on the phone viewport (Playwright's `iPhone 13` device: 390×664 CSS px, the same as `capture.mjs`; box percentages are relative to that size). Decline non-essential cookies.
> **States to capture**: `<slug: action to reach the state, elements to box>` for each finding, e.g. `sector-picker: tap "Leste Inferior"; box the sector list and the price line`.
>
> Measure sizes as `measurement.md` defines them: text by computed `font-size` (for text inside SVG, `font-size` × the SVG's scale, i.e. rendered width ÷ `viewBox` width), targets by `getBoundingClientRect`. Never report glyph heights from the image.
>
> Write a viewport screenshot per state to `<WORK_DIR>/today/<slug>-<state>.jpg` and the boxes (percentages of the screenshot, from measured `getBoundingClientRect`) to `<WORK_DIR>/today/boxes.json`.
>
> **Done when** every requested state has a screenshot that visibly shows it and a box per listed element. Reply with the list of files and any state you could not reach, with the reason.

## Theme brief

> You are re-skinning an HTML report template so it matches a product's design system.
>
> **Read first**: `<SKILL_DIR>/references/theming.md` (the whole procedure and the token mapping).
> **Template**: `<SKILL_DIR>/assets/report-template.html` → copy it to `<WORK_DIR>/report.html` and edit only that copy.
> **Design-system source**: `<DESIGN.md or other document path, or "none">`; sampled tokens: `<EVIDENCE_DIR>/tokens.json`; screenshots of the site for visual comparison: `<EVIDENCE_DIR>/<page>/desktop/first.jpg`, `<EVIDENCE_DIR>/<page>/phone/first.jpg`.
> **Product**: `<SITE_NAME>` at `<URL>`.
>
> Edit only the THEME block and the FONTS slot. Fill the light theme, both dark blocks, and every `--site-*` mockup token (including `--site-accent`, `--site-surface`, `--site-error`, `--site-radius`). When a design document is given, verify it against the screenshots and `tokens.json`; where they disagree, follow the live site.
>
> **Done when** `node <SKILL_DIR>/scripts/check-report.mjs --theme-only <WORK_DIR>/report.html` exits 0, and a screenshot of the themed report next to the site's screenshot reads as the same brand (primary colour, type family, heading style, corner radius, button style). Reply with the theme source used, any drift between document and live site, the final values of `--brand`, `--accent`, `--font-body`, `--head-style`, `--btn-radius`, and any colour you adjusted for contrast.

## Mockup brief

> You are designing the fix for one usability finding as an HTML/CSS wireframe, in the product's own visual language.
>
> **Read first**: `<SKILL_DIR>/references/mockups.md`, then the F01 `<article>` in `<WORK_DIR>/report.html` (reference markup) and that file's THEME block (the `--site-*` tokens you must use).
> **Finding** (verbatim): `<slug, severity, title, Observed, Why it matters, Recommendation, lenses cited>`
> **Today screenshot**: `<WORK_DIR>/today/<slug>-<state>.jpg` (`<W>×<H>` CSS px), with these problem boxes as % of the screenshot: `<1: left/top/width/height>`, `<2: …>`.
> **Real content to reuse**: `<product names, prices, labels, copy visible on that screen>`.
> **Other findings' recommendations that touch this screen** (apply them silently, without markers): `<e.g. prices 16 px, labels 14 px; button in sentence case>`.
>
> Write one file, `<WORK_DIR>/parts/<slug>-gallery.html`, containing only the `<div class="gallery" data-mock="<slug>">…</div>` (Today figure with embedded base64 screenshot, markers and callouts; one to three Proposed figures), plus a `<style>` before it whose every selector starts with `[data-mock="<slug>"]` if you need components the kit lacks. Lay phone screens out at true scale with `.mk-390` when the finding concerns text or target size. If the fix has no visual change, the Proposed figure may be a `figure.code`.
>
> **Done when** every Today marker has a matching green number in a Proposed figure, the proposal follows the pattern the cited lens recommends, every target is ≥ 44 px and every input font ≥ 16 px at true scale, and the screens use only `--site-*` tokens (no hard-coded colour except image placeholders). Reply with a two-line description of the proposal.

## Review brief

> You are reviewing a UX audit report as a sceptical product lead seeing it for the first time.
>
> **Report**: `<WORK_DIR>/report.html`. **Evidence**: `<EVIDENCE_DIR>` (screenshots, `probe.json`, `perf.json`, `summary.json`, `digest.md`) and `<WORK_DIR>/today/`.
>
> For every finding, check that each number in Observed appears in the evidence or is measurable from the screenshots, that severity and its modifiers follow `<SKILL_DIR>/references/scoring.md`, that the impact band and confidence are justified by the causal line, and that the mockup actually resolves each numbered problem. For every WCAG verdict, check the criterion's exceptions before accepting a Fail (2.5.8 spacing and inline exceptions, 1.4.3 incidental and logotype text, 1.4.10 content that needs two dimensions); re-measure where the evidence is borderline. Also check that the scorecard follows the scoring rules (home pillar per finding, counted once, caps applied, overall = mean of four pillars capped by severity), that every finding sits in exactly one roadmap bucket, that WCAG verdicts needing other pages or uncompleted flows are "Not tested", and that nothing is claimed about pages or flows that were not audited.
>
> **Done when** every finding has been checked. Reply with a list: finding id → OK, or the specific claim that is unsupported or the rating that is off, with the evidence file you checked. Do not edit the report.
