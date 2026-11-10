# Capturing evidence

## Viewports

| Key | Device emulated | CSS size | Why |
|---|---|---|---|
| `phone` | iPhone 13 | 390×664 | Reference phone; most findings are measured here. |
| `phone-small` | iPhone SE (1st gen) | 320×568 | Worst case for reflow, truncation and WCAG 1.4.10. |
| `phone-landscape` | iPhone 13 landscape | 750×342 | Fixed headers and floating buttons eat the viewport. |
| `tablet` | iPad Mini | 768×1024 | The usual breakpoint edge, where layouts switch. |
| `desktop` | — | 1440×900 | Reference desktop. |

Phone viewports use touch emulation (`hasTouch`, mobile user agent), which exposes "sticky hover" and hover-only UI.

## The capture script

```bash
npm i -D playwright && npx playwright install chromium   # once
node scripts/capture.mjs --out ./ux-audit-evidence URL [URL...]
```

Options: `--viewports phone,desktop` (subset), `--no-perf` (skip the throttled runs), `--keep-cookies` (don't decline the cookie banner). `UX_AUDIT_CHROMIUM=/path/to/chrome` uses a specific browser binary.

Output, per page: `first-raw.jpg` (the first screen a new visitor sees, banner included: evidence for GOV.UK G9 and Wroblewski W1), `first.jpg`, `full.jpg`, `probe.json` per viewport, and `perf.json`. At the root: `tokens.json` (for theming) and `summary.json` (key numbers per viewport, for the Devices table).

The capture script only declines cookies. Walking the task (typing, opening menus, applying filters) is your job, below.

## What `probe.js` returns

| Field | Use it for |
|---|---|
| `page.screens` | Page length in screen-heights (Devices table, distance chart). |
| `overflowX` | WCAG 1.4.10 / X2: `overflows` plus the widest offending elements. |
| `zoomBlocked`, `viewportMeta` | WCAG 1.4.4. |
| `headings` | H1 count and text, skipped levels (K1, WCAG 1.3.1, 2.4.6). |
| `landmarks`, `skipLink` | WCAG 1.3.1, 2.4.1. |
| `targets.under44` / `under24` | Fitts F1, HIG H1, WCAG 2.5.8 (size, `nearestGap`, `y` in screens). `under24` lists only targets that fail 2.5.8 after its spacing exception; an undersized target with `spacingException: true` passes 2.5.8 but can still fail F1/H1. Inline text links, off-canvas elements and anything inside `inert` / `aria-hidden` are already excluded. |
| `offscreenFocusable` | Focusable controls parked off-canvas (closed drawers, slide-out menus) without `inert` or `aria-hidden`: keyboard focus lands on something invisible (WCAG 2.4.3, 2.4.7, 4.1.2). A visually-hidden skip link at a large negative `x` is expected and not a finding if it becomes visible on focus. |
| `unnamedControls`, `labelInName`, `vagueLinks` | WCAG 4.1.2, 2.5.3, 2.4.4. |
| `liveRegions` | WCAG 4.1.3 (0 on a page with dynamic results is a red flag). |
| `text.smallText` | HIG H2 (text under 12 px). |
| `contrast.fails` | WCAG 1.4.3 with ratio, colours and selector. `overImageNeedsManualCheck` lists text over photos: judge those on the screenshot. |
| `images` | WCAG 1.1.1. |
| `oversizedImages` | Nielsen's Law / performance: images served far larger than displayed. |
| `inputs` | Labels, placeholder-only fields, `type`, `inputmode`, `autocomplete`, font size < 16 px (iOS zoom), width (G2, G5, H10, W4, WCAG 1.3.5). |
| `fixed` | Sticky/fixed chrome and the % of viewport each covers (H3, W3, WCAG 2.4.11). |
| `primaryCandidates` | Where the H1, the search field and the biggest filled buttons sit, in screens (W1, F3, K1). |
| `performance` | TTFB, FCP, LCP, CLS, requests, transfer by type. Unthrottled in `probe.json`; use `perf.json` for the report. |

Treat probe output as leads, not verdicts: confirm every number you put in a finding against the screenshot. Heuristics can misfire (a decorative element counted as a target, text over a gradient). Two traps seen in practice:

- **Full-page screenshots** draw `position: fixed` elements (a sticky bar, a chat button, a cookie banner) once, where they sat on the first screen. Their position lower down in `full.jpg` is an artifact of the capture, not evidence of overlap; judge overlap on viewport screenshots taken at that scroll position.
- **Text inside SVG** (maps, charts, seat plans) renders at `font-size × the SVG's scale` (rendered width ÷ `viewBox` width). Measure that, not the `font-size` attribute, before claiming text is too small.

## Without Playwright

Use whatever browser tool your environment has (a browser MCP, DevTools, an in-app browser):

1. Set the viewport (width × height) for each row of the table; on phones enable touch emulation if the tool allows.
2. Load the URL, wait for the page to settle, screenshot the first screen.
3. Decline non-essential cookies, screenshot again.
4. Evaluate the full text of `scripts/probe.js` in the page; save the JSON it returns.
5. At desktop width, evaluate `scripts/extract-tokens.js` and save it as `tokens.json`.
6. For performance, prefer a throttled Lighthouse/DevTools run (Slow 4G, 4× CPU); otherwise report the probe's unthrottled numbers and say so in Method.

## Manual checks (the probe cannot do these)

Do each on the phone viewport and record the result:

- **Primary task walk-through.** Perform the task as a first-time visitor; screenshot every step; note each hesitation, error and dead end, and where the result of each action appears relative to the viewport (`window.scrollY` before and after).
- **Feedback.** After every action (search, filter, add, submit), is the effect visible without scrolling? Is there a count or confirmation?
- **Error states.** Trigger the errors you safely can: empty required field, malformed email, zero-result search, out-of-range quantity. Never submit real personal data.
- **Keyboard pass** (desktop): Tab through the page. Is focus always visible, in a logical order, never hidden under sticky elements, never trapped? Do menus and modals open with Enter/Space and close with Esc, returning focus?
- **Zoom and text spacing**: zoom to 200% (no loss of content), and inject WCAG 1.4.12 spacing:
  ```js
  document.head.insertAdjacentHTML('beforeend','<style>*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}</style>')
  ```
- **Touch states**: tap a chip or card, then tap elsewhere. Does a hover style stick?
- **Landscape phone**: how much of the viewport is left for content?
- **Reduced motion**: carousels and animations respect `prefers-reduced-motion`; auto-advancing content can be paused.
- **Accessible names**: spot-check icon buttons and form fields in the accessibility tree.

## Today states

Many problems only show after an action: an opened menu, a validation error, a toast, a selected option, a drawer. Capture each such state for the Today figure with a small Playwright script (or your browser tool) on the phone viewport:

1. Load the page, dismiss the cookie banner, scroll the target into view.
2. Perform the action (`click`, `fill` with a dummy value that is never submitted, `press('Tab')`), wait for the UI to settle.
3. Screenshot the viewport (not the full page) and, in the same state, run the box snippet below for each problem element.
4. Save each state as `today/<slug>-<state>.jpg` with its boxes in `today/boxes.json`.

Stop before any step the read-only rule forbids (submitting, signing in, paying).

## Boxes for annotations

To place a numbered marker on a screenshot, get the element's box as percentages of the captured screen (run in the page at the same viewport and scroll position as the screenshot):

```js
((sel) => { const r = document.querySelector(sel).getBoundingClientRect();
  const p = (v, t) => Math.round(v / t * 1000) / 10 + '%';
  return `left:${p(r.left, innerWidth)};top:${p(r.top, innerHeight)};width:${p(r.width, innerWidth)};height:${p(r.height, innerHeight)}`; })('SELECTOR')
```

For a full-page screenshot, use `r.top + scrollY` and `document.documentElement.scrollHeight` instead of `r.top` and `innerHeight`.
