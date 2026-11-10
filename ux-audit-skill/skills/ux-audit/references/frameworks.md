# The nine lenses: checklists

Give every item a verdict (**Pass / Partial / Fail / N/A**) and one line of evidence. Items carry an ID (`K3`, `N5`, `F2`…) so findings can cite them. Where a probe field from `scripts/probe.js` measures the item, it is named in `probe:`.

Lenses are grouped into four **pillars** for scoring and for the report's lens tables:

| Pillar | Lenses |
|---|---|
| 1 · Usability principles | Krug, Nielsen, Norman, Fitts |
| 2 · Platform and design-system conventions | Apple HIG, Shopify Polaris, GOV.UK Design System |
| 3 · Accessibility | WCAG 2.2 AA |
| 4 · Mobile and forms | Wroblewski (Mobile First, Web Form Design), cross-device consistency |
| Performance (scored separately, outside the overall mean) | Nielsen's Law and the Core Web Vitals thresholds |

---

## Pillar 1 · Usability principles

### Steve Krug — *Don't Make Me Think* (`Krug`)

The page should be self-evident: a visitor understands it without thinking about it. Every question mark that pops into their head adds cognitive load and drains their **goodwill reservoir**.

| ID | Check | How to check | Fail looks like |
|---|---|---|---|
| K1 | **Trunk test**: dropped on any page, can a visitor tell site ID, page name, major sections, local options, "you are here", and where to search? | Land on a deep page cold, phone and desktop. Fill the trunk-test table in the report. | H1 is a promo title, not the page name; no current-section indicator; search hidden behind 2+ screens or an icon with no label. |
| K2 | **Self-evident purpose** within ~5 seconds of landing. | Look at the first screen only. Can you say what the page is and what to do? | First screen is a hero image, cookie banner, and a slogan. |
| K3 | **Obvious clickables**: everything clickable looks clickable, nothing else does. | Tap images, titles, cards, icons. | Card image looks like a link but is not; plain text that is a link; buttons styled as labels. |
| K4 | **Clear visual hierarchy**: importance maps to prominence, related things are grouped, nesting is visible. | Squint test on screenshots. | "Clear cart" more prominent than "Checkout"; three elements competing as the primary. |
| K5 | **Conventions** used for common things (logo top-left → home, cart top-right, search field with magnifier). | Compare to category leaders. | Novel icons or placements that need learning. |
| K6 | **Omit needless words**: no happy talk, no instructions nobody reads. | Count words above the first actionable element. | Welcome paragraphs, repeated slogans, internal jargon. |
| K7 | **Mindless choices**: each click is an obvious choice, even if there are more clicks. | Walk the primary task; note every hesitation. | Ambiguous labels ("Solutions", "Explore"), two links that seem to lead to the same place. |
| K8 | **Goodwill drains** absent: hidden prices/fees/contact, forcing a specific input format, asking for unneeded data, interstitials, sizzle in the way of the task. | Note every place you'd be annoyed. | Price only shown at checkout; phone field rejects spaces; newsletter modal on first visit. |

### Jakob Nielsen — 10 Usability Heuristics and Nielsen's Law (`Nielsen #n`, `Nielsen's Law`)

| ID | Check | How to check | Fail looks like |
|---|---|---|---|
| N1 | **Visibility of system status**: every action gives timely, visible feedback; long operations show progress. | Search, filter, add to cart, submit. Watch the viewport. | Results appear below the fold with no scroll or count; button gives no loading state; status says "Updated" whatever happened. |
| N2 | **Match between system and real world**: user's words, natural order. | Read labels as a newcomer. | Internal codes, system terms, dates or units in unexpected formats. |
| N3 | **User control and freedom**: undo, cancel, back, close all work. | Use Back after filtering; close every modal with ✕, Esc and outside tap. | Back loses filters; destructive action with no undo; modal with no close. |
| N4 | **Consistency and standards**: same thing looks and behaves the same everywhere; platform conventions respected. | Compare the same component across pages/viewports. | The same entity drawn three different ways; a link that opens a modal on one page and navigates on another. |
| N5 | **Error prevention**: constraints and good defaults stop errors before they happen. | Try invalid input, edge quantities, past dates. | Free-text where a picker fits; field truncates input silently; no confirmation on irreversible actions. |
| N6 | **Recognition rather than recall**: options, recent items and context are visible. | Does any step need memory of a previous screen? | Applied filters not shown; must remember a code from an earlier page. |
| N7 | **Flexibility and efficiency**: shortcuts for experienced users without hurting novices. | Autocomplete, saved state, sensible defaults, deep links. | No autocomplete; filters not in the URL; every visit starts from zero. |
| N8 | **Aesthetic and minimalist design**: no irrelevant information competing with the relevant. | Signal-to-noise of the first screen. | Duplicated lists, decorative blocks pushing the task down. |
| N9 | **Help users recognize, diagnose and recover from errors**: plain message, exact problem, constructive fix. | Trigger every error you safely can, including zero results. | "Invalid input"; empty state with no explanation or way out; browser-native English errors on a localized site. |
| N10 | **Help and documentation**: findable, task-focused help where it is needed. | Look for contextual help on complex steps. | Help only in a footer FAQ; no contact path during checkout. |
| NL | **Nielsen's Law of Internet Bandwidth**: users' bandwidth grows ~50%/year, slower than everything else, so the experience stays bandwidth-bound. Pages must be lean. Pair with Nielsen's response-time limits: 0.1 s feels instant, 1 s keeps flow, 10 s loses attention. | `probe: performance` + throttled run (see measurement.md). | LCP > 2.5 s on 4G, oversized images, heavy JS, interaction delay > 200 ms. |

### Don Norman — Affordances and Signifiers (`Norman`)

Affordance is what an element lets you do; a **signifier** is the perceivable cue that tells you so. Most web failures are signifier failures.

| ID | Check | How to check | Fail looks like |
|---|---|---|---|
| D1 | **Signifiers present**: interactive elements show they are interactive (shape, underline, chevron, cursor, button styling). | Inspect each control at rest, without hovering. | Text-only buttons indistinguishable from labels; swipeable carousel with no peek or dots. |
| D2 | **No false signifiers**: nothing looks interactive that is not. | Tap every image, card, icon, underline. | Underlined non-links; card image not clickable while title is. |
| D3 | **State signifiers distinct**: hover, focus, selected, disabled, pressed all differ, and selection is not shown by color alone. | Touch-emulate; tap a chip, then another. | Hover style equals selected style and sticks after a tap on touch devices. |
| D4 | **Mapping**: controls sit next to what they affect, in a spatially sensible order. | Where is each control relative to its effect? | Quantity stepper far from the price it changes; filter panel opens in an unrelated spot. |
| D5 | **Feedback**: immediate, informative response to every action. | As N1, focused on micro-interactions. | No pressed state; add-to-cart with no confirmation. |
| D6 | **Constraints**: the design makes wrong actions impossible or hard. | Steppers with min/max, disabled-until-valid only with an explanation. | Quantity field accepts "12" when the user meant "2"; invalid dates selectable. |
| D7 | **Coherent conceptual model**: the page's structure matches how users think about the domain. | Can a user predict where things are? | Product variants scattered across separate pages; "Account" containing orders, but "Orders" elsewhere too. |

### Paul Fitts — Fitts's Law (`Fitts`)

Time to acquire a target grows with distance and shrinks with size: `T = a + b · log2(D/W + 1)`. Make frequent and primary targets big and near; push destructive ones away.

| ID | Check | How to check | Fail looks like |
|---|---|---|---|
| F1 | **Target size**: interactive targets ≥ 44×44 px on touch (HIG 44 pt, Material 48 dp); the absolute floor is WCAG 2.5.8: 24×24 px, **or** the spacing exception (a 24 px circle centred on the target intersects no other target and no circle of another undersized target), or an inline link in a sentence. A target can fail F1 (under 44 px) and still pass 2.5.8; never fail 2.5.8 without checking the exception. | `probe: targets` (lists every target under 44 and under 24, with size and selector). | Text links of 78×18 px as the only way into a card; icon buttons of 32 px. |
| F2 | **Whole-object targets**: the obvious target (a card, a row) is fully clickable, not only a small link inside it. | Tap card edges, images, whitespace. | Only "View details" is clickable. |
| F3 | **Primary action near the thumb and big**: on phones, the primary CTA lives in the natural thumb zone (lower-middle) or a sticky bottom bar. | Screenshot position of the primary CTA on the phone viewport; `probe: primaryCandidates`. | Checkout below the fold; primary CTA at top-left corner on mobile. |
| F4 | **Distance between frequent sequential targets** is short. | Map the journey's taps on the screenshot. | Apply filters button at the top of a long panel after choosing the last filter at the bottom. |
| F5 | **Dangerous targets separated** from frequent ones and smaller than the primary. | Look at delete / clear / cancel placement. | "Delete" adjacent to "Save" with the same size and color. |
| F6 | **Spacing** between adjacent targets prevents mis-taps (≥ 8 px). | `probe: targets.under44[].nearestGap`. | Pagination links 4 px apart. |

---

## Pillar 2 · Platform and design-system conventions

These three systems are design references, not laws. Cite the rule that the finding breaks and the component the system recommends instead; that recommendation shapes the mockup.

### Apple Human Interface Guidelines (`HIG`)

| ID | Check | Fail looks like |
|---|---|---|
| H1 | **Hit targets** ≥ 44×44 pt on touch. | (See F1; cite both.) |
| H2 | **Legible type**: body ≈ 17 pt on iOS, nothing under 12 px (Apple's 11 pt floor, rounded up for the web); inputs ≥ 16 px on the web to avoid iOS auto-zoom. `probe: smallText`, `probe: inputs[].fontSize`. | Form fields at 14–15 px trigger zoom on focus; 10 px captions. |
| H3 | **Hierarchy and deference**: content first, chrome recedes. | Sticky header + floating chat button cover a third of a landscape viewport. |
| H4 | **Sheets and modality**: focused sub-tasks (filters, pickers, short forms) use a sheet; modals are rare, dismissible, and have a clear purpose. | A 700-px filter form expands inline mid-page; modal without close. |
| H5 | **Navigation**: clear back path, ≤ 5 tab-bar destinations, current location visible. | Hamburger hides all navigation while the page has room for it; no "back" from a deep step. |
| H6 | **Feedback and loading**: show content progressively, skeletons over spinners, no blocking without reason. | Blank page then everything at once. |
| H7 | **Gestures**: standard gestures only, always with a visible alternative; no hover-only functionality on touch. | Swipe-only carousel; info only in hover tooltips; sticky hover on tap. |
| H8 | **Destructive actions**: confirmation or undo, destructive styling, never the default. | "Clear cart" with no undo or confirmation. |
| H9 | **Safe areas and orientation**: content respects notches and works in landscape. | Fixed bars eating the landscape viewport; content under the home indicator. |
| H10 | **Appropriate keyboards**: email, tel, numeric, search keyboards via `type`/`inputmode`. `probe: inputs`. | Phone field opens the alphabetic keyboard. |

### Shopify Polaris (`Polaris`)

| ID | Check | Fail looks like |
|---|---|---|
| P1 | **One primary action per view or section**; secondary actions visually subordinate. | Two filled buttons side by side with equal weight. |
| P2 | **Actionable labels**: buttons as verb + noun ("Add to cart", "Save address"), sentence case, no "Click here", "Submit", "OK". | "Submit", "Continue" with no object, ALL CAPS labels. |
| P3 | **Feedback component fit**: toasts for brief success of non-critical actions (never for errors); banners for page-level status; inline errors next to fields. | Errors in a toast that vanishes; success shown only by a page reload. |
| P4 | **Empty states** explain what goes here and offer the next action. | Blank list or "No results" with nothing else. |
| P5 | **Destructive actions** use the critical tone, name the object ("Delete 3 products"), and confirm or undo. | Generic "Are you sure?" dialog with "OK / Cancel". |
| P6 | **Loading**: skeletons that match the final layout; no layout shift when content arrives. `probe: performance.cls`. | Spinner then jump; CLS > 0.1. |
| P7 | **Content guidelines**: plain, concise, consistent terms for the same thing; numbers and currency formatted for the locale. | "Agenda", "Calendar" and "Events" for the same list; `1000.5` instead of `$1,000.50`. |
| P8 | **Spacing and alignment** on a consistent scale; related items grouped. | Arbitrary gaps; labels detached from values. |

### GOV.UK Design System (`GOV.UK`)

The most rigorously user-tested public pattern library; strongest on forms, errors and content.

| ID | Check | Fail looks like |
|---|---|---|
| G1 | **Start with one thing per page** for complex forms (question pages); simple forms may group a few related fields. | A 20-field single page on mobile. |
| G2 | **Labels**: visible, above the field, never placeholder-only; hint text under the label. `probe: inputs[].label`. | Placeholder as the only label, disappearing on typing. |
| G3 | **Error summary + inline errors**: on submit, a summary at the top links to each field; each field shows a specific message; the page title gains "Error:". | Only a red border; generic "Please fix errors"; native browser bubbles. |
| G4 | **Validate on submit**, not on every keystroke; never disable the submit button as the only feedback. | Button greyed out with no reason; errors flashing while typing. |
| G5 | **Field width matches expected input** (postcode short, address long). | Every field full width, including a 2-digit quantity. |
| G6 | **Radios over selects** for short option lists; dates as day/month/year fields or a well-labelled picker. | Dropdown with 3 options; date picker that forces a calendar for a birth date. |
| G7 | **Plain English**: front-loaded, short sentences, no jargon. | Legalese on the critical path. |
| G8 | **Back link and check-your-answers** on multi-step flows; confirmation page with reference and next steps. | No summary before payment; no reference after. |
| G9 | **Cookie banner** with equally prominent accept and reject; does not block the task. | Reject buried in settings; banner covers half the phone screen. |
| G10 | **Focus state** highly visible (thick, high-contrast). | 1-px dotted outline or none. |

---

## Pillar 3 · Accessibility — WCAG 2.2, levels A and AA (`WCAG x.y.z`)

Fill the report's WCAG checklist with every criterion below. Automated probes find perhaps a third of the issues; the rest need the manual checks in `measurement.md`. Mark anything you could not check as **Not tested**, never as Pass.

| SC | Level | Criterion | How to check |
|---|---|---|---|
| 1.1.1 | A | Non-text content | `probe: images` (missing/empty alt on meaningful images, icon buttons without names). |
| 1.2.1–1.2.5 | A/AA | Captions, audio description for media | Only if the page has video/audio; else N/A. |
| 1.3.1 | A | Info and relationships | `probe: headings`, `landmarks`, `inputs[].label`; tables with headers. |
| 1.3.2 | A | Meaningful sequence | DOM order vs visual order (CSS order/absolute positioning). |
| 1.3.3 | A | Sensory characteristics | Instructions that rely on shape/position/color only. |
| 1.3.4 | AA | Orientation | Works in portrait and landscape. |
| 1.3.5 | AA | Identify input purpose | `probe: inputs[].autocomplete` on personal-data fields. |
| 1.4.1 | A | Use of color | Selected/error states conveyed by color alone. |
| 1.4.2 | A | Audio control | Autoplaying audio. |
| 1.4.3 | AA | Contrast (minimum) 4.5:1, 3:1 large | `probe: contrast` (text over images needs manual check). |
| 1.4.4 | AA | Resize text to 200% | Zoom to 200%; viewport meta must not block zoom (`probe: viewportMeta`). |
| 1.4.5 | AA | Images of text | Text baked into banners. |
| 1.4.10 | AA | Reflow at 320 CSS px | `probe: overflowX` at 320 px. |
| 1.4.11 | AA | Non-text contrast 3:1 | Input borders, icons, focus rings, chart lines. |
| 1.4.12 | AA | Text spacing | Inject spacing overrides (measurement.md); nothing clipped. |
| 1.4.13 | AA | Content on hover or focus | Tooltips/menus dismissible (Esc), hoverable, persistent. |
| 2.1.1 | A | Keyboard | Every control reachable and operable by keyboard. |
| 2.1.2 | A | No keyboard trap | Tab out of every widget and modal. |
| 2.1.4 | A | Character key shortcuts | Single-key shortcuts can be turned off. |
| 2.2.1 | A | Timing adjustable | Session timeouts warn and extend. |
| 2.2.2 | A | Pause, stop, hide | Auto-advancing carousels have a pause. |
| 2.3.1 | A | Three flashes | Flashing content. |
| 2.4.1 | A | Bypass blocks | Skip link or landmarks. `probe: skipLink`. |
| 2.4.2 | A | Page titled | `probe: title` is specific per page. |
| 2.4.3 | A | Focus order | Logical tab order; modals move and trap focus, return it on close. |
| 2.4.4 | A | Link purpose (in context) | `probe: vagueLinks` (links with vague names such as "Click here", "More"). |
| 2.4.5 | AA | Multiple ways | Search, nav, sitemap. |
| 2.4.6 | AA | Headings and labels | Descriptive H1/H2, labels. |
| 2.4.7 | AA | Focus visible | Visible focus on every control during the keyboard pass. |
| 2.4.11 | AA | Focus not obscured (minimum) | Focused element not hidden by sticky header/footer/chat button. |
| 2.5.1 | A | Pointer gestures | Multipoint/path gestures have single-pointer alternative. |
| 2.5.2 | A | Pointer cancellation | Actions fire on up-event. |
| 2.5.3 | A | Label in name | Accessible name contains the visible label. `probe: labelInName`. |
| 2.5.4 | A | Motion actuation | Shake/tilt alternatives. |
| 2.5.7 | AA | Dragging movements | Sliders, drag-to-reorder have a click alternative. |
| 2.5.8 | AA | Target size (minimum) 24×24, or the spacing exception | `probe: targets` (`under24` already applies the spacing exception; each undersized target has `spacingException`). |
| 3.1.1 | A | Language of page | `probe: lang`. |
| 3.1.2 | AA | Language of parts | Foreign-language passages marked. |
| 3.2.1 | A | On focus | No context change on focus. |
| 3.2.2 | A | On input | No unexpected navigation on select change. |
| 3.2.3 | AA | Consistent navigation | Same order across pages. |
| 3.2.4 | AA | Consistent identification | Same function, same name/icon. |
| 3.2.6 | A | Consistent help | Help/contact in the same place across pages. |
| 3.3.1 | A | Error identification | Errors described in text, tied to the field. |
| 3.3.2 | A | Labels or instructions | Required fields and formats stated up front. |
| 3.3.3 | AA | Error suggestion | Message says how to fix. |
| 3.3.4 | AA | Error prevention (legal, financial, data) | Review/confirm/undo before commit. |
| 3.3.7 | A | Redundant entry | No re-typing info already given in the same flow. |
| 3.3.8 | AA | Accessible authentication (minimum) | No cognitive test (puzzle CAPTCHA, retype code without paste) without alternative; paste allowed in password fields. |
| 4.1.2 | A | Name, role, value | `probe: unnamedControls`; ARIA states on toggles, tabs, accordions. |
| 4.1.3 | AA | Status messages | Results counts, cart updates, errors announced via live regions. `probe: liveRegions`. |

---

## Pillar 4 · Mobile and forms

### Luke Wroblewski — *Mobile First* and *Web Form Design* (`Wroblewski`)

| ID | Check | Fail looks like |
|---|---|---|
| W1 | **Mobile first = content first**: the first phone screen shows the content or action people came for, not chrome. Measure the distance (in screens) to the primary task element. `probe: primaryCandidates`, screenshot. | Search 2 screens down; hero + banner + cookie notice fill the first screen. |
| W2 | **Thumb-friendly layout**: primary actions reachable one-handed; nothing essential only at the top corners. | Only "Next" button at top-right. |
| W3 | **Navigation that doesn't crowd content**: compact header, collapsible on scroll, especially in landscape. | Fixed header + floating button cover > 25% of the viewport. |
| W4 | **Use device capabilities**: correct keyboards, autocomplete, location with fallback, camera for scanning, tap-to-call. `probe: inputs`. | No `type="tel"`, no `autocomplete`, no fallback when location is denied. |
| W5 | **Top-aligned labels, single column** for fastest completion. | Left-aligned labels squeezing fields on phones; two-column forms. |
| W6 | **Minimal fields**: every field justified; optional fields marked (mark the minority). | Asking for phone and birth date to sign up for a newsletter. |
| W7 | **Inline validation** after the user leaves a field, for fields with real error risk (email, password rules, availability). | Errors only after a full-page submit; or red errors while still typing. |
| W8 | **Forgiving formats**: accept spaces, dashes, case, accents; format for the user. | Card number rejects spaces; city search fails without diacritics. |
| W9 | **Primary action obvious, secondary de-emphasized**; avoid Reset/Clear buttons beside Submit. | "Reset" same size as "Send". |
| W10 | **Path to completion clear**: progress indicator on multi-step forms; nothing ambiguous about what is required next. | 4-step checkout with no steps shown. |

### Cross-device consistency (`Devices`)

| ID | Check | Fail looks like |
|---|---|---|
| X1 | Same capabilities on every viewport; breakpoints do not remove functions or targets. | Card fully clickable under 768 px only. |
| X2 | No horizontal scroll at any viewport. `probe: overflowX`. | Document 488 px wide in a 390-px viewport. |
| X3 | Density proportional to the screen; landscape phone gets a usable layout. | Landscape phone shows desktop cards one at a time under a fixed header. |
| X4 | Page length and distance to the primary task element reasonable on each device (report in screens). | 13 screens to scroll in landscape. |

### Performance (`Nielsen's Law`, `Polaris`)

Thresholds (Core Web Vitals, 75th percentile on mobile): **LCP ≤ 2.5 s** good, > 4 s poor · **INP ≤ 200 ms** good, > 500 ms poor · **CLS ≤ 0.1** good, > 0.25 poor. Also report transfer size, JS weight, and images served larger than displayed (`probe: oversizedImages`).
