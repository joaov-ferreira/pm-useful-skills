# Theming the report to the target's design system

The template ships with a neutral look. Before writing content, re-skin it so the report, and every mockup in it, looks like the product being audited. A report that looks like the product reads as *our* work to its team, and a mockup in the real visual language shows the fix as it would ship.

All visual decisions live in the template's `THEME:START … THEME:END` block plus the optional font `<link>` in `<head>`. Theming means editing those and nothing else.

## 1. Find the design-system source

Use the first source that applies, and record which one; it goes in the report footer (`{{THEME_SOURCE}}`) when the report is written in step 7:

1. **A design system the user names**: a file path, a Figma/Storybook/zeroheight URL, a tokens JSON. Use it.
2. **A design-system document in the current project**, used only when the project **is the audited product** (the document names the same brand or domain, or the user said so). A design system for a different product would dress the report in the wrong brand; skip to 3 and mention it. Look, in order:
   - **`DESIGN.md`** at the project root: Google's open format for describing a visual identity to agents, with design tokens in YAML front matter and the rationale in markdown prose. Take exact values from the front matter and intent (tone, density, what to avoid) from the prose.
   - **A document the agent instructions point to.** Read `AGENTS.md` (and `CLAUDE.md`, `.github/copilot-instructions.md` if present) and follow any link to a design-system document, whatever its name (`SYSTEM.md`, `design-system.md`, …).
   - Design tokens in code next to it (`tailwind.config.*`, `tokens.json`, `theme.ts`, CSS custom properties in the global stylesheet) are valid sources for exact values.
3. **The live site**: `tokens.json`, written by `scripts/capture.mjs` from `scripts/extract-tokens.js` on the first URL at desktop width. Without the capture script, evaluate `extract-tokens.js` in the page yourself (cookie banner dismissed). Confirm each value against the screenshots: the sampler ranks by area, so a hero photo overlay or a promo bar can win a slot it does not deserve.

**Verify a document against the live site.** Design documents drift. Before using a source from 1 or 2, compare its primary colour, heading and body families, and button shape with `tokens.json` and the screenshots. When they disagree, the live site wins: users see the live site, and the product team will compare the report with it. Use the document only where it agrees or where the site gives no signal, and write the drift in the footer note ("DESIGN.md lists Inter; the live site uses Avenir").

## 2. Map the source to the tokens

| Token | Take it from |
|---|---|
| `--brand` | The product's primary brand colour (logo, primary button, header). In `tokens.json`: `primaryButton.bg`, else the top `accentCandidates`. |
| `--on-brand` | Text colour on `--brand`. Usually `primaryButton.color`. |
| `--accent` | The link/action colour; if the brand is very dark or neutral, the brand's secondary or highlight colour. |
| `--header-bg`, `--header-ink` | The cover band: the site's header or hero colour and its text colour. A dark brand colour works well. |
| `--bg`, `--surface`, `--surface-2`, `--line` | The site's page background, card background, subtle fill and divider (`backgrounds`, `borderColors`). Keep `--surface` light enough for long reading. |
| `--ink`, `--ink-2` | Main and secondary text (`textColors`). |
| `--font-body`, `--font-head` | `fonts.body`, `fonts.heading`, always followed by a fallback stack. |
| `--head-weight`, `--head-transform`, `--head-tracking`, `--head-style` | `type.h1` weight, text-transform, letter-spacing and font-style (`italic` when the brand sets headings in italics). |
| `--radius`, `--radius-sm`, `--btn-radius` | `radii` (cards vs controls) and `primaryButton.radius`. A square-cornered brand gets `0`. |
| `--btn-transform`, `--btn-tracking` | `primaryButton.transform`, `primaryButton.letterSpacing`. |
| `--shadow` | Top `shadows`, or `none` for flat systems. |
| `--site-bg`, `--site-ink`, `--site-ink-2`, `--site-line*`, `--site-header-*` | The product's own UI as users see it: page background, text, dividers, header. These drive the mockups. |
| `--site-primary`, `--site-on-primary` | The product's primary button, exactly as rendered (`primaryButton`), not adjusted for the report. |
| `--site-accent` | The product's secondary colour: links, badges, section labels, selected states that are not the primary button. |
| `--site-surface` | The product's tinted panel colour (notices, banners, highlighted rows). |
| `--site-error` | The product's error red, from a visible error message or the design document; keep the template's red when neither shows one. |
| `--site-radius` | The product's card and input radius. |
| `--site-placeholder` | A neutral fill for image placeholders in mockups, close to the product's light grey. |

**Fonts.** If the family is on Google Fonts, add one `<link>` to it in the FONTS slot. If it is proprietary (custom brand fonts are common), do not copy or embed the font files; write the family name first in the stack so it renders for viewers who have it, followed by the closest generic fallback (geometric sans → `"Avenir Next", "Century Gothic", system-ui`; humanist → `"Segoe UI", "Helvetica Neue", Arial`; serif → `Georgia, serif`).

**Font kits locked to the product's domain.** Hosted kits such as Adobe Fonts (`use.typekit.net`), Fonts.com or a self-hosted font served with a restrictive CORS policy only render on the product's own domain, so a `<link>` to them fails when the report is opened from a file or another host. Do not link them. Treat the family as proprietary: name it first in the stack, follow it with the closest fallback, and write "brand font approximated by <fallback>" in the footer note. Only Google Fonts (or another open, CORS-enabled CDN) goes in the FONTS slot.

**Logo.** Optional: a small `data:` URI of the logo in the cover `brandline`, only when it is publicly served on the page; otherwise the site name in text.

## 3. Keep the report accessible

The report itself must pass WCAG AA; an accessibility audit that fails contrast loses its credibility. After mapping, these pairs must reach **4.5:1** (`check-report.mjs` verifies the hex values in the light theme):

- `--ink` and `--ink-2` on `--surface` and on `--bg`
- `--accent` on `--surface` (links)
- `--on-brand` on `--brand`, `--header-ink` on `--header-bg`
- `--site-on-primary` on `--site-primary`, `--site-ink` on `--site-bg`

When a brand colour fails, keep its hue and darken it (light theme) or lighten it (dark theme) until it passes, and report it so the footer note can say so ("accent darkened for contrast"). Keep the severity colours' hues recognisable (red, orange, amber, green): adjust lightness only.

**Dark theme.** Fill the two dark blocks: same hues, surfaces around L 8–14%, ink around L 90%, brand and accent lightened until they pass on the dark surface. Leave every `--site-*` token out of the dark blocks: mockups depict the product as users see it, so they stay light (or dark, if the product is dark) in both report themes. Mockup kit classes read only `--site-*` tokens for this reason; a mockup that uses `--brand` or `--surface-2` changes colour when the reader switches theme.

## 4. Done when

- Only the THEME block and the FONTS slot changed.
- The theme source, any drift between a design document and the live site, and any colour adjusted for contrast are reported back for the footer note (step 7 writes the footer).
- The cover, buttons, chips and a mockup screen, viewed side by side with the site's screenshot, read as the same brand: same primary colour, type family, corner radius and button style.
- `node scripts/check-report.mjs --theme-only <file>` reports no contrast failures.
