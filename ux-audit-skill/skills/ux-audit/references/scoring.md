# Severity, impact, effort and scores

Rate from the rubric, not from instinct, so two audits of the same page land on the same ratings.

## Severity

Pick the **highest** row whose condition holds. Severity is about harm to the user on the path they came for; business value enters through impact, below.

| Severity | Badge class | Condition (any one is enough) |
|---|---|---|
| **Critical** | `b-crit` | Blocks the primary task for a meaningful group of users (no workaround, or a workaround most people won't find) · loses or corrupts user data or money · WCAG A failure that locks out a whole group (keyboard trap, unlabeled checkout button, CAPTCHA with no alternative) · legal/compliance exposure. |
| **High** | `b-high` | Large, frequent friction on the primary path: many users err, hesitate or abandon · silent failure (zero results, truncated input, action that seems to do nothing) · WCAG AA failure on the primary path. |
| **Medium** | `b-med` | Noticeable friction, off the primary path or with an easy workaround · inconsistency that slows people down · WCAG failure off the primary path. |
| **Low** | `b-low` | Polish: cosmetic inconsistency, minor copy, small performance waste, best-practice gaps without measurable harm. |

Two modifiers, applied after picking the row:

- **Frequency**: if the problem hits on nearly every visit or every page (header, global nav, product card), raise one level (max Critical). Apply it only with evidence from at least two pages, or when the element is shared chrome you saw on every page in scope; on a single-page audit, the frequency of a page-specific element is unknown.
- **Reach**: if it only affects a rare edge case (an unusual viewport, a rare locale) lower one level (min Low). State the modifier in the finding.

Write the severity scale once in the report summary (the template has the sentence) so readers can calibrate.

## Predicted impact

Impact answers *"what changes for the business and the users if we fix this?"*. Every finding states five things, in the finding's **Impact** block:

| Field | What to write | Example |
|---|---|---|
| **Metric** | The one metric the fix moves most. Choose from: conversion rate, task success rate, error rate, time on task, abandonment/bounce, search-to-result rate, support contacts, accessibility reach, page speed (LCP/INP/CLS), trust/perceived quality, SEO. | Search-to-result rate |
| **Direction & band** | `↑` or `↓` plus a band: **Major** (likely double-digit % change on the metric), **Moderate** (single-digit %), **Minor** (hard to measure in isolation). | ↑ Major |
| **Who** | The affected segment and its rough share: "all mobile visitors (~70% of traffic, typical for retail)", "keyboard and screen-reader users", "users in landscape". If you don't know the traffic split, say so and give the industry-typical assumption. | Mobile visitors who search |
| **Why we expect it** | The causal chain from evidence to metric in one sentence, citing the principle. | Results appear off-screen, so users repeat the search or leave (Nielsen #1). |
| **Confidence** | **High** (direct evidence + well-established pattern), **Medium** (strong pattern, indirect evidence), **Low** (hypothesis; validate before investing). Use Low whenever the causal chain rests on an assumption you could not observe or source. | High |

Rules for honest impact:

- Never invent precise numbers ("+12.4% conversion"). Bands only. If you cite a published benchmark (Baymard, NN/g, Google case studies), name the source in the finding and keep it as context, not as a forecast.
- Recommend **how to measure** the impact after the fix whenever the metric is trackable (e.g. "compare search → product-page click-through for 2 weeks before/after").
- An accessibility failure always has impact on **accessibility reach**, even when no business metric moves; say so.

## Effort

| Effort | Meaning |
|---|---|
| **S** | CSS/copy/attribute change, one component, hours to a day. |
| **M** | Component redesign or new pattern, a few days, maybe one backend tweak. |
| **L** | Cross-cutting redesign, new backend capability, or a product decision; a sprint or more. |

Add a tag when the fix needs something beyond front-end work: `backend`, `content`, `product decision`.

## Priority

Order the "Top fixes" list and the roadmap by:

1. Severity (Critical → Low), then
2. Impact band (Major → Minor), then
3. Effort (S → L).

Roadmap buckets. Take the **first rule that matches**, so every finding lands in exactly one bucket:

1. **Backlog**: severity Low; or Medium with impact Minor and effort M or L.
2. **Strategic**: effort L, or tagged `product decision`.
3. **Quick wins**: effort S.
4. **Next 1–2 sprints**: everything else.

Strategic also lists validation work (usability test with 5 users, screen-reader session, analytics instrumentation). Critical findings are marked "fix now" in whichever bucket they land, and lead it.

## Home pillar

Every finding belongs to exactly one **home pillar**, chosen by the first rule that matches:

1. **Performance**: the finding is about load or response speed (Nielsen's Law, Core Web Vitals). It scores only in the Performance row.
2. **Mobile and forms** (pillar 4): the problem exists only on phones or touch, only in one orientation, or inside a form.
3. **Accessibility** (pillar 3): the finding fails a WCAG criterion.
4. **Conventions** (pillar 2): it departs from a named HIG, Polaris or GOV.UK pattern.
5. **Usability** (pillar 1): everything else.

The finding's first lens tag is a lens of its home pillar, so readers can see where it was counted. Other tags still cite every lens the finding breaks.

## Pillar scores (1–5)

1. Start at **5**.
2. Subtract per finding whose home pillar this is: Critical −1.5, High −0.75, Medium −0.35, Low −0.1. Each finding subtracts once, in its home pillar only.
3. Apply the **checklist cap**: a pillar with any Fail in its own checklist scores at most **4.5**; with a Fail on the primary task's path, at most **4.0**. This keeps a pillar honest when its failures were counted elsewhere.
4. Clamp to **1.0–5.0** and round to one decimal. No other adjustment: the rules above are the whole method, so two auditors with the same findings get the same scores.

**Overall score** = mean of the four pillar scores, rounded to one decimal, then capped by the worst finding: any Critical → at most **2.9**; any High on the primary task's path → at most **3.9**. A page whose main task is seriously hindered is not "good", whatever its other strengths.

**Performance** is a separate row outside the overall mean (it depends on network and device more than on design). Its base comes from the worst Core Web Vital in the **cold** throttled phone run (`perf.json`, `cold: true`; a first visit is what new users get). Lab runs do not measure INP, so judge LCP and CLS only unless you measured INP in a field or interaction trace (thresholds in `frameworks.md`): all good → **5.0**; worst is needs-improvement → **3.5**; worst is poor → **2.0**. Then subtract performance findings as above. Severity for the metric itself: a poor vital on phones is **High**, needs-improvement is **Medium**, waste with all vitals good (oversized images, heavy JS) is **Low**.

Show each pillar with a one-line note naming its best and worst trait, and write under the scorecard how the scores were computed: deductions per finding, any cap that applied and why.

Scale meaning, written under the score: 1 = broken · 2 = poor · 3 = works with friction · 4 = good · 5 = excellent.
