---
name: ux-audit
description: Expert usability and accessibility audit of a public web page or site, delivered as a self-contained HTML report in the product's own design system, with severity-ranked findings, predicted impact, annotated screenshots and mockups of each fix. Use when asked to audit, evaluate, review or critique the UX, usability, accessibility (WCAG) or mobile experience of a URL.
---

# UX Audit

Turn a public URL into an evidence-backed audit report that covers what is broken, how badly, what it costs, and what the fix looks like. The deliverable is one self-contained `.html` file, built from [`assets/report-template.html`](assets/report-template.html) and re-skinned to the audited product's design system.

The audit judges the page through nine **lenses**, always the same nine. The full checklists are in [`references/frameworks.md`](references/frameworks.md).

| Lens | Tag used in findings |
|---|---|
| WCAG 2.2 (A and AA) | `WCAG 2.4.11` (criterion number) |
| Apple Human Interface Guidelines | `HIG` |
| Shopify Polaris | `Polaris` |
| GOV.UK Design System | `GOV.UK` |
| Steve Krug, *Don't Make Me Think* | `Krug` |
| Jakob Nielsen, 10 heuristics and Nielsen's Law | `Nielsen #1`…`#10`, `Nielsen's Law` |
| Don Norman, affordances and signifiers | `Norman` |
| Luke Wroblewski, *Mobile First* and *Web Form Design* | `Wroblewski` |
| Paul Fitts, Fitts's Law | `Fitts` |

Cross-device checks (`Devices · X1`…`X4`) and performance (`Nielsen's Law`) have their own checklists in the same file.

The four guideline systems are the **standards**: checkable rules that say what is wrong and which pattern fixes it. The five authors are the **principles**: they explain why it hurts people. A finding cites both whenever both apply.

## Ground rules

- **Evidence first.** Every finding rests on something observed and, wherever possible, measured in a real browser: a pixel size, a contrast ratio, a scroll distance, a step count, a screenshot. A claim without evidence is cut, or labelled as a hypothesis with Low confidence.
- **Read-only.** Audit as an anonymous visitor. Browse, search, open menus, type into fields to see validation, and stop before anything that commits, such as submitting personal data, signing in, creating accounts, entering payment details or placing orders. Decline non-essential cookies. Flows behind a login or payment are listed as *not audited* in Method.
- **Plain language.** Write for a product team. Lead with the person's problem; keep criterion numbers and heuristic names in tags.
- **Report language** follows the language of the user's request unless they ask otherwise. Lens names and WCAG criterion titles stay in English.

## Workflow

Track the steps as a checklist. Each one ends on its completion criterion; the next starts only when that criterion holds. Steps marked **delegate** go to a subagent with the brief in [`references/delegation.md`](references/delegation.md) when your environment supports subagents, on the model tier that file assigns (a smaller model for mechanical jobs, the main model for judgement). Otherwise, do them inline.

### 1. Scope

Settle the following with the user. When the request is unambiguous, infer them and state your assumptions.

- **Target**: the URL(s), and whether the scope is one page, one journey (*find a product → add to cart*) or the site's main templates.
- **Primary task**: the one thing a typical visitor came to do. The journey, the trunk test and every impact estimate hang off it.
- **Devices**: mobile-first (phone portrait) plus desktop by default.

**Done when** you can write the cover line: *site · scope · primary task · devices · date*.

### 2. Capture evidence (**delegate** capture & digest)

Run [`scripts/capture.mjs`](scripts/capture.mjs) when Node and Playwright are available. It captures every URL at five viewports, saves screenshots, runs [`scripts/probe.js`](scripts/probe.js) (target sizes, text sizes, contrast, reflow, headings, landmarks, form fields, fixed chrome, Core Web Vitals), runs throttled performance passes, and samples the site's design tokens:

```bash
node <skill-dir>/scripts/capture.mjs --out ./ux-audit-evidence https://example.com/ https://example.com/products
```

The capture subagent also writes `digest.md`, a key-numbers table, so you read that instead of the raw JSON. Without Playwright, use your browser tool and evaluate the scripts by hand, as described in [`references/measurement.md`](references/measurement.md). That file also covers the manual checks the probe cannot do. Then walk the primary task end to end on the phone viewport. Screenshot every step and note each place a person would hesitate, make an error or give up.

**Done when** every page in scope has phone and desktop screenshots, a probe JSON per viewport, `tokens.json` and `digest.md`, plus a keyboard pass and a screenshotted walk of the primary task.

### 3. Theme the report (**delegate**, in parallel with steps 4–5)

Find the product's design system: the user's own source; else, when the current project is the audited product, its `DESIGN.md` or a design-system document linked from `AGENTS.md` / `CLAUDE.md`; else the tokens sampled from the live site. Verify any document against the live site, which wins where they differ. Re-skin a copy of the template by editing only its THEME block, following [`references/theming.md`](references/theming.md).

**Done when** `node <skill-dir>/scripts/check-report.mjs --theme-only report.html` exits 0, and the themed report next to a site screenshot reads as the same brand.

### 4. Evaluate against every lens

Go through [`references/frameworks.md`](references/frameworks.md) one lens and one checklist item at a time. Give each item a verdict of **Pass**, **Partial**, **Fail** or **N/A** (WCAG criteria may also be **Not tested**), with one line of evidence. These verdicts fill the lens tables and the WCAG checklist.

Every Fail, and every Partial with real user cost, becomes a **finding**, named by a working slug until step 7 assigns ids ([`references/report-guide.md`](references/report-guide.md), *Finding ids*). Merge items that share one root cause into a single finding that cites every lens it breaks. Record **strengths** too, meaning what works and must survive the redesign.

**Done when** every checklist item in every lens has a verdict, and every Fail maps to a finding or to a stated reason it does not deserve one.

### 5. Rate each finding

Apply [`references/scoring.md`](references/scoring.md) to every finding. Each one gets a **severity** (from the rubric), a **predicted impact** (metric, direction and band, who is affected, the causal why, confidence) and an **effort** (S, M or L). Priority follows from these and orders the top fixes and the roadmap. Then give each finding its home pillar and score the pillars, the overall and Performance with the rules and caps in that file.

**Done when** every finding has a severity, all five impact fields, an effort, a home pillar and one roadmap bucket, and the scorecard is filled.

### 6. Design the fixes (**delegate**, one subagent per finding, in parallel)

Every Critical and High finding gets a gallery, as does any Medium whose fix is hard to picture. A gallery is the annotated real screenshot (*Today*) next to an HTML/CSS mockup of the fix (*Proposed*), built in the themed report's visual language with the mockup kit, following [`references/mockups.md`](references/mockups.md).

First delegate the *Today states* capture for every finding whose problem only shows after an interaction; each mockup brief needs its screenshot and boxes. Then start the mockups.

**Done when** every Critical and High finding has a gallery file in `parts/`, and every numbered problem on a Today capture is resolved by a matching number in a Proposed figure.

### 7. Write the report

Fill the themed copy section by section using [`references/report-guide.md`](references/report-guide.md), assign finding ids, and insert each gallery into its finding's `<article>`. Embed every image as a base64 `data:` URI so the report is one portable file.

**Done when** every gallery sits in its `<article>` and `node <skill-dir>/scripts/check-report.mjs report.html` exits 0.

### 8. Review (**delegate**)

Have a fresh-context reviewer check every claim against the evidence and every rating against the rubric. Fix what it flags, then re-run the checker.

**Done when** the reviewer's list has no open item and the checker exits 0.

### 9. Deliver

Save the report where the user asked, by default `./ux-audit-<site>-<YYYY-MM-DD>.html` next to the evidence folder. Open or publish it if your environment supports that. Reply with the overall score, the verdict in two sentences, the top three fixes and the file path.
