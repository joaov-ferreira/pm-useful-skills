# ux-audit — an agent skill for evidence-based UX audits

Give your AI agent a public URL and get back a **self-contained HTML audit report** in the audited product's own design system, with:

- a scorecard and executive verdict, with the measured numbers that matter;
- **severity-ranked findings** (Critical / High / Medium / Low), each with what was observed, why it matters, the recommendation and its **predicted impact** (metric, direction, reach, confidence, effort);
- **annotated screenshots** of today's experience next to **mockups of the proposed fix**, drawn in the product's own visual language;
- a full WCAG 2.2 AA checklist, cross-device measurements, Core Web Vitals, strengths to keep and a prioritised roadmap.

Every finding is judged through the same nine lenses:

| Standards | Principles |
|---|---|
| WCAG 2.2 (A/AA) | Steve Krug — *Don't Make Me Think* |
| Apple Human Interface Guidelines | Jakob Nielsen — 10 heuristics & Nielsen's Law |
| Shopify Polaris | Don Norman — affordances & signifiers |
| GOV.UK Design System | Luke Wroblewski — *Mobile First* & *Web Form Design* |
| | Paul Fitts — Fitts's Law |

## How it works

1. **Scope**: the URL, the visitor's primary task, the devices.
2. **Capture**: a Playwright script screenshots 5 viewports, measures target sizes, contrast, reflow, headings, form fields, fixed chrome, off-canvas focus traps and Core Web Vitals (simulated 4G), and samples the site's design tokens.
3. **Theme**: the generic report template is re-skinned to the product's design system: your `DESIGN.md` when you audit your own product (see [Design system](#design-system)), the live site's tokens otherwise.
4. **Evaluate**: every checklist item of every lens gets Pass / Partial / Fail / N/A with evidence.
5. **Rate**: a rubric sets severity, predicted impact, effort, priority and pillar scores.
6. **Design fixes**: Today/Proposed galleries for every Critical and High finding.
7. **Write, validate, review**: `check-report.mjs` validates the HTML, and a fresh-context reviewer checks every claim against the evidence.

Capture, theming, mockups and review are written as subagent briefs, so agents that can delegate (Claude Code, for example) run them in parallel with a clean context. Each brief names a model tier: mechanical jobs (capture) run on a small model such as Haiku, rule-bound craft (theming, most mockups) on a mid model such as Sonnet, and judgement (evaluation, rating, review, Critical mockups) stays on the main model. Agents that can't delegate do the same work inline.

## Install

**Claude Code (plugin):**

```bash
/plugin marketplace add joaov-ferreira/pm-useful-skills
/plugin install ux-audit@pm-useful-skills
```

**Claude Code (plain skill)**: copy the skill folder into your skills directory:

```bash
git clone https://github.com/joaov-ferreira/pm-useful-skills.git
cp -r pm-useful-skills/ux-audit-skill/skills/ux-audit ~/.claude/skills/
```

**Other agents**: point your agent at `skills/ux-audit/SKILL.md`; everything else is reached from there by relative links.

**For the capture script** (recommended, optional):

```bash
npm i -D playwright && npx playwright install chromium
```

Without Playwright, the agent drives any browser tool it has and evaluates `probe.js` / `extract-tokens.js` in the page.

## Example report

See a full report produced by the skill: **[UX audit of gov.br (homepage and search journey)](https://joaov-ferreira.github.io/pm-useful-skills/ux-audit-skill/examples/gov-br/)**, also available **[em português](https://joaov-ferreira.github.io/pm-useful-skills/ux-audit-skill/examples/gov-br/pt-br/)**. A button at the top of the report switches between the two languages. The source is in [`examples/gov-br/`](examples/gov-br/).

It is an independent example, not an official gov.br document. Its performance numbers are lab measurements on a simulated slow 4G connection.

## Use

Ask your agent in plain language. Give it a URL and, ideally, the one thing a visitor comes to do:

> Audit the UX of https://example.com — the main task is finding a product and adding it to the cart.

> Run a mobile usability and accessibility audit of https://example.com/checkout and write the report in Portuguese.

> Audit https://example.com/pricing on phone and desktop. Our design system is in ./DESIGN.md.

In Claude Code you can also invoke it directly: `/ux-audit https://example.com` as a plain skill, or `/ux-audit:ux-audit https://example.com` when installed as a plugin.

What you can set in the request (the agent infers sensible defaults and states them):

| Option | Default |
|---|---|
| Scope: one page, one journey, or the main templates | The URL(s) given |
| Primary task | Inferred from the page |
| Devices | Phone portrait first, plus desktop |
| Report language | The language of your request |
| Design system | `DESIGN.md` in the current project when it is the audited product, else sampled from the live site |
| Output path | `./ux-audit-<site>-<date>.html`, with evidence in `./ux-audit-evidence/` |

The agent replies with the overall score, a two-sentence verdict, the top three fixes and the report path.

## Design system

The report and every mockup in it are drawn in the audited product's own visual language, so the team sees the fix as it would ship. The skill looks for the design system in this order:

1. A source you name in the request: a file, a tokens JSON, a Storybook or Figma URL.
2. When the current project is the audited product: a **[`DESIGN.md`](https://github.com/google-labs-code/design.md)** at the project root, or a design-system document linked from `AGENTS.md` / `CLAUDE.md`.
3. Otherwise, tokens sampled from the live site (colours, fonts, radii, button style).

`DESIGN.md` is the open format Google Labs published with Stitch for describing a visual identity to coding agents: design tokens in YAML front matter, with the rationale in markdown prose ([announcement](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-design-md/), [specification](https://stitch.withgoogle.com/docs/design-md/specification)). If you audit your own product, keeping a `DESIGN.md` gives you an exact theme instead of a sampled one, and the same file steers any other agent that builds your UI.

Design documents drift from the shipped product. The skill always compares a document with the live site; where they disagree, the report follows the live site and notes the drift in its footer.

## Layout

```
skills/ux-audit/
  SKILL.md                    workflow (entry point)
  references/
    frameworks.md             the nine lenses as checklists
    scoring.md                severity, impact, effort, priority, scores
    measurement.md            viewports, probe fields, manual checks
    theming.md                design-system discovery (DESIGN.md) and token mapping
    mockups.md                Today/Proposed galleries and the mockup kit
    report-guide.md           section-by-section writing guide
    delegation.md             subagent briefs and model tiers
  scripts/
    capture.mjs               Playwright evidence capture
    probe.js                  in-page measurements (read-only)
    extract-tokens.js         in-page design-token sampler
    check-report.mjs          report validator (no dependencies)
  assets/
    report-template.html      themeable report template with worked examples
```

## Safety

The audit is read-only. The agent browses as an anonymous visitor, declines non-essential cookies, and never submits personal data, signs in, creates accounts or places orders. Flows behind those steps are reported as *not audited*.

## License

MIT, see the [LICENSE](../LICENSE) at the repository root.
