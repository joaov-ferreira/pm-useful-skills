# Building the Today / Proposed pair

Every Critical and High finding, and any Medium that is hard to picture in words, gets a **gallery**: the annotated real screenshot (*Today*) next to an HTML/CSS wireframe of the fix (*Proposed*). The template's F01 article is the reference implementation; copy its markup.

## Today: the annotated capture

- Use the real screenshot from the evidence folder, cropped to the moment that shows the problem (first screen, after an action, error state). Embed it as a `data:image/jpeg;base64,…` URI.
- Place a numbered `.mark` box over each problem, positioned in percentages from measured boxes (snippet in `measurement.md`), never by eye. A box may cover a group of elements (a row of options, a whole card) when the problem is the group; measure the group's bounding box.
- When the problem only shows after an interaction (an open menu, an error, a toast), capture that state first (*Today states* in `measurement.md`).
- Explain each number in `ol.callouts` in the figcaption, one short sentence each.
- Write a complete `alt` on the image that describes what the screenshot shows and where each marker is; the lightbox reuses it as the caption.
- At most three markers per capture. More problems → more captures or more findings.

## Proposed: the mockup

A mockup is a **wireframe in the product's own visual language**: it should look like the next release of the product, not like a generic template.

1. **Start from the Today screen.** Rebuild the same screen with the mockup kit (`.mk-*` classes in the template) at the same device size (see *Scale* below), with the same real content: real product names, prices, labels and copy taken from the page. Lorem ipsum and fake brands are not allowed.
2. **Change only what the finding fixes, and mark only that.** The rest of the screen stays recognisably today's, so the reader sees the difference at a glance. Optionally outline new or changed elements with `.mk-new`. Two kinds of change are allowed without a marker:
   - **Other findings' fixes.** The Proposed screen shows the product after all recommended fixes, so apply every other finding's recommendation that touches a visible element (type sizes, labels, button text). A mockup that keeps a problem another finding condemns contradicts the report.
   - **Simplified chrome.** Draw page chrome that the finding is not about (header, footer, floating buttons) with kit components (`.mk-hdr`, `.mk-icon`), which already meet rule 5. Omit small chrome controls rather than copy them at a failing size.
3. **Use the theme.** Colours, fonts, radii and button style come from the `--site-*` and type tokens set during theming; never hard-code another palette, and never use the report's own tokens (`--brand`, `--surface-2`, `--crit`) inside a screen: those change in dark mode and the product does not. Use the real logo (`.mk-logo img`) when you embedded it in the report, otherwise the site name.
4. **Follow the cited standard.** The fix should use the pattern the lens recommends: a bottom sheet (HIG) for filters, an error summary plus inline errors (GOV.UK) for forms, a toast with Undo (Polaris) for destructive actions, a 44-px stepper (Fitts/HIG) for quantities, results count in a live region (Nielsen #1, WCAG 4.1.3).
5. **Respect the rules you audit.** Mockup targets ≥ 44 px, inputs ≥ 16 px font, text contrast ≥ 4.5:1, labels above fields. A mockup that breaks the guideline it illustrates undermines the report.
6. **Show states when the fix is a state.** Use two or three Proposed figures (e.g. *empty → filled → error*, or *before tap → after tap*) instead of cramming them into one.
7. **Number the resolutions.** The Proposed figcaption uses green `.n.ok` numbers matching each Today marker it resolves.
8. **Code when the fix is invisible.** For a fix with no visual change (focus order, ARIA, `inert`, a live region), the Proposed figure may be a `figure.code` with the corrected markup, using `<del>` and `<ins>` for the change, and a short caption saying what a screen-reader or keyboard user now gets.
9. **Accessible container.** The `.device` gets `role="img"` and an `aria-label` describing the proposal; the inner `.mk` gets `aria-hidden="true"`.

### Scale

The phone `.screen` is 270×460 px, but the phone it depicts is 390 px wide. A mockup laid out directly at 270 px makes every size wrong by a factor of 1.44, which matters whenever the finding is about text or target size. Lay the screen out at true scale: add `.mk-390` to the `.mk` element, which renders it at 390×664 CSS px and scales it by 0.6923 into the frame. Then a 16 px label in the mockup is a 16 px label on the phone. Usable height under a 52 px header is about 600 px at true scale (about 408 px in the unscaled frame).

Desktop screens (`figure.wide`, 16:10) are always schematic; describe sizes in the caption instead.

### Scoping

Each gallery carries its finding's working slug, `<div class="gallery" data-mock="sector-picker">`. Any extra style goes in a `<style>` right before the gallery with every selector prefixed by that attribute (`[data-mock="sector-picker"] .mk-slider {…}`), built from `--site-*` tokens, so one mockup cannot restyle another and renumbering ids never breaks a style.

### Kit reference

Inside a `.screen`, `.mk` is a flex column; put fixed chrome (`.mk-hdr`, `.mk-sticky`) outside `.mk-scroll`.

| Class | Component |
|---|---|
| `.mk-hdr`, `.mk-logo`, `.mk-icons > .mk-icon` | Header bar |
| `.mk-h1` (+ `small`), `.mk-sec`, `.mk-p` | Page title with meta line, section label, paragraph |
| `.mk-search` | Search field |
| `.mk-chips > .mk-chip(.on)` | Filter/category chips |
| `.mk-btn` (`.secondary`, `.link`) | Buttons |
| `.mk-card` (`.mk-thumb`, `b`, `small`, `.mk-price`) | List/product card |
| `.mk-field` (`label`, `.hint`, `.err`, `.mk-input`; `.error`) | Form field with hint and error |
| `.mk-errsum` | Error summary (GOV.UK) |
| `.mk-radio(.on)` | Radio card |
| `.mk-option(.on)` (`b`, `small`, `.mk-price`) | Selectable option card: sector, plan, variant, with price |
| `.mk-stepper` (`span`, `output`, `span`) | Quantity stepper |
| `.mk-sticky` (`.row`, `.mk-btn`) | Sticky bottom bar with total and CTA |
| `.mk-scrim` + `.mk-sheet` | Bottom sheet over a dimmed page |
| `.mk-toast` (`a`) | Toast with action (Undo) |
| `.mk-banner` | Inline notice (on `--site-surface`) |
| `.mk-empty` | Empty state |
| `.mk-new` | Highlight of what changed |
| `.mk-390` | True-scale layout (add to `.mk`) |
| `figure.code` (`pre`, `ins`, `del`) | Code proposal for an invisible fix |

Kit colours come from `--site-primary` (selected chips, radios, options, buttons), `--site-accent` (section labels), `--site-surface` (banners), `--site-error` (field errors, error summary) and `--site-radius`.

When a component is missing, add it in the scoped `<style>` described above.

## Done when

- Every Today marker has a matching resolution number in a Proposed figure.
- The mockup and the screenshot look like the same product, side by side.
- No hard-coded colour in mockup markup except image placeholders, and no report token (`--brand`, `--surface*`, `--crit`) inside a screen.
- Mockups for text or target-size findings use `.mk-390`.
