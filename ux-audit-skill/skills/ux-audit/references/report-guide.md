# Writing the report

Work from a themed copy of `assets/report-template.html`. Every `{{…}}` is a slot to fill; every block under `<!-- EXAMPLE: replace -->` is one worked example of a component. Copy it as many times as needed, replace its content, and delete the comment. Leave CSS and script unchanged, except a scoped mockup `<style>` (see `mockups.md`).

## Voice

- Address a product team. Short sentences, active voice, concrete numbers with units (`44&nbsp;px`, `2.4 screens`, `5.6&nbsp;s`).
- Say what the person experiences before naming the principle: "After searching, the screen doesn't move" → then `Nielsen #1`.
- Claim only what you saw. On a single-page audit, describe the page, not the site ("this page's sector list", not "the site's lists"); a claim about other pages needs a screenshot of them.
- Credit what works. The Strengths section is not optional: it tells the team what to protect.
- Use the user's language for the report text (see SKILL.md); keep lens names and WCAG criterion titles in English.

## Section by section

| Section | Content | Source |
|---|---|---|
| **Cover** | `{{HEADLINE_VERDICT}}`: one sentence that states the overall verdict with its main tension ("The list works on phones, but search and filters still work off-screen"). Lede: scope, lenses, what is inside. Meta pills: date, host, devices, locale. Three phone screenshots (first screen, a key step, a problem). | Step 1, evidence |
| **Key numbers** | 4–6 measured facts, each one anchoring a finding. A number plus a plain-language caption. | probe.json, perf.json, walk-through |
| **Verdict** | 1 short paragraph + 3–4 bullets naming the main problems + one callout that frames it with a principle. The severity-scale sentence stays. | Findings |
| **Scorecard** | Overall score (mean of the four pillars) and one row per pillar, plus Performance as a separate row outside the mean. Each row has a note naming its best and worst trait; a line under the table says how scores were computed. Bar width = score ÷ 5. | scoring.md |
| **Top fixes** | 5–8 items in priority order: finding link, the fix as an action, one-line why, severity badge, impact tag, effort tag. | scoring.md priority |
| **Trunk test** | Krug K1 table: site ID, page name, sections, local options, you-are-here, search, per device. | K1 |
| **Journey** | Today: one step per action in the primary task, `.pain` on friction steps, thumbnails, links to findings. Target flow: the same task after the fixes, fewer steps. | Walk-through |
| **Distance chart** | Per viewport: page length, first screen, and the positions of two key elements (e.g. search field, first result), all in screens. | summary.json and probe `primaryCandidates` for the H1, search and primary buttons; measure anything else (first result, buy button) by hand with the box snippet in measurement.md |
| **Lenses** | Four tables, one per pillar (Nielsen's Law belongs to the Performance section, not to a pillar table), one row per checklist item that is not N/A, verdict pill and one-line evidence with a finding link. Pillar 3 summarises by WCAG principle; the full list lives in Accessibility. | Step 4 verdicts |
| **Findings** | One `<article class="finding">` per finding, ids `f01…` in priority order, `data-sev` = `crit`/`high`/`med`/`low`. Filter button counts must match. | Steps 4–5 |
| **Accessibility** | Every WCAG 2.2 A/AA criterion from frameworks.md: Pass / Partial / Fail / N/A / Not tested, with a note. Criteria that need several pages (3.2.3 Consistent Navigation, 3.2.6 Consistent Help) or a flow you did not complete (3.3.4 Error Prevention at checkout, 3.3.7, 3.3.8) are **Not tested** on a single-page or read-only audit; never infer them from one page. | Step 4 |
| **Devices** | One row per viewport from summary.json, with the two key elements from the distance chart. | summary.json |
| **Performance** | Profile sentence + one row per run. Colour LCP/CLS cells by the thresholds. | perf.json |
| **What works** | 2–4 themed cards of concrete strengths. | Step 4 |
| **Roadmap** | Quick wins / Next 1–2 sprints / Strategic / Backlog, linking findings; every finding appears in exactly one bucket. Strategic includes validation (5-user test, screen-reader session, analytics). | scoring.md buckets |
| **Method** | Lenses, viewports, tools, what was walked; Limitations: what was not audited (logins, checkout, real devices, assistive tech) and why. Keep the References card. | Steps 1–2 |
| **Footer** | Date, source URL, the theme source, any drift between a design document and the live site, and any colour adjusted for contrast (all reported by the theme step). | theming.md |

## The finding article

Each finding has, in this order:

1. **Head**: id, severity badge, one tag per lens it breaks (`Nielsen #1`, `WCAG 2.5.8`, `Fitts`, `HIG · H4`, `Polaris · P3`, `GOV.UK · G3`, `Krug · K3`, `Norman · D3`, `Wroblewski · W7`, `Devices · X2`); the first tag is a lens of the finding's home pillar (scoring.md), and the title: the user's problem in one sentence, not the solution.
2. **Observed**: 2–4 bullets of measured facts, with the viewport where they were seen.
3. **Why it matters**: 1–3 bullets, each naming a principle in bold and the consequence for people.
4. **Recommendation**: 2–4 bullets, concrete enough to build, citing the recommended pattern.
5. **Where** (optional): the page, template or component name; a code path only when you could read the source.
6. **Predicted impact** aside: metric, change (arrow + band), who, confidence, effort, then a line with the causal "why" and how to measure it after the fix.
7. **Gallery**: Today/Proposed pair for Critical and High findings (mockups.md); a single annotated capture is enough for Medium and Low, unless the fix is hard to picture, in which case a Medium gets a full gallery too.

## Finding ids

Ids follow priority order (F01 is the top priority), but priorities move until the review is done. Through steps 4–6 give each finding a **working slug** (`sector-picker`, `buy-button`) and use it for file names (`parts/sector-picker-gallery.html`, `today/sector-picker-*.jpg`) and notes. Assign F01, F02… once, when you write the report (step 7). If the review changes a severity or effort, renumber in one pass from an old → new mapping, replacing each id through a temporary token (`F03 → @@3@@ → F05`) so no replacement overwrites another, across the report and every part file. Then re-run the checker, which catches broken `#f…` links.

## Images

Embed every image as a base64 `data:` URI so the report is one portable file:

```bash
printf 'data:image/jpeg;base64,%s' "$(base64 < first.jpg | tr -d '\n')"
```

Screenshots from the capture script are already at CSS-pixel scale (390 px wide on phones). Crop or downscale anything wider than ~900 px before embedding. Keep the whole file under 15 MB.

## Final check

```bash
node scripts/check-report.mjs ux-audit-<site>-<date>.html
```

It fails on unfilled slots, leftover `EXAMPLE` comments, findings missing a section or impact field, filter counts that don't match, broken `#f…` links, theme contrast failures and file size. Fix every error and re-run until it exits 0.
