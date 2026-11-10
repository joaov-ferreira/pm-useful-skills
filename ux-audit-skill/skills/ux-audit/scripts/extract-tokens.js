// Design-token sampler. Evaluate in the target page (desktop viewport, cookie banner
// dismissed). Resolves to the site's de-facto design system: colour roles, type, radii,
// shadows, spacing and button styles, ranked by how much of the page uses them.
// Read-only. Output feeds references/theming.md.
(async () => {
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const area = (el) => { const r = el.getBoundingClientRect(); return Math.min(r.width, innerWidth) * Math.min(r.height, innerHeight * 3); };
  const toHex = (c) => {
    const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    if (p.length > 3 && p[3] === 0) return null;
    return '#' + p.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  };
  const tally = (map, key, w = 1) => { if (key) map.set(key, (map.get(key) || 0) + w); };
  const top = (map, n = 8) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([value, weight]) => ({ value, weight: Math.round(weight) }));
  const sat = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx; };

  const els = [...document.querySelectorAll('body *')].filter(visible).slice(0, 4000);
  const bg = new Map(), fg = new Map(), border = new Map(), fonts = new Map(), radii = new Map(), shadows = new Map(), gaps = new Map();
  for (const el of els) {
    const cs = getComputedStyle(el);
    tally(bg, toHex(cs.backgroundColor), area(el));
    if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) {
      tally(fg, toHex(cs.color), (el.textContent || '').trim().length);
      tally(fonts, cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(), (el.textContent || '').trim().length);
    }
    if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none') tally(border, toHex(cs.borderTopColor));
    if (parseFloat(cs.borderTopLeftRadius) > 0) tally(radii, cs.borderTopLeftRadius);
    if (cs.boxShadow && cs.boxShadow !== 'none') tally(shadows, cs.boxShadow);
    for (const g of [cs.rowGap, cs.columnGap, cs.paddingTop, cs.paddingLeft]) if (g && g !== 'normal' && parseFloat(g) > 0) tally(gaps, g);
  }

  // Buttons and links: the accent colour almost always lives here.
  const inConsent = (el) => !!el.closest('[id*="cookie" i],[class*="cookie" i],[id*="consent" i],[class*="consent" i]');
  const btns = [...document.querySelectorAll('button, a[href], [role="button"], input[type="submit"]')].filter((b) => visible(b) && !inConsent(b));
  const filled = btns.map((b) => ({ b, cs: getComputedStyle(b), r: b.getBoundingClientRect() }))
    .filter(({ b, cs }) => { const h = toHex(cs.backgroundColor); return h && sat(h) > 0.25 && (b.innerText || b.value || '').trim().length > 1; })
    .sort((x, y) => y.r.width * y.r.height - x.r.width * x.r.height);
  const isFilled = ({ b, cs }) => { const h = toHex(cs.backgroundColor); return h && !/^#(f[0-9a-f]){3}$/i.test(h) && h !== toHex(getComputedStyle(document.body).backgroundColor) && (b.innerText || b.value || '').trim().length > 1; };
  const anyFilled = btns.map((b) => ({ b, cs: getComputedStyle(b), r: b.getBoundingClientRect() })).filter(isFilled).sort((x, y) => y.r.width * y.r.height - x.r.width * x.r.height);
  const btn = filled[0] || anyFilled[0]; // saturated first; neutral (black/grey) buttons as fallback
  const accent = new Map();
  filled.forEach(({ cs, r }) => tally(accent, toHex(cs.backgroundColor), r.width * r.height));
  btns.filter((a) => a.tagName === 'A').forEach((a) => { const h = toHex(getComputedStyle(a).color); if (h && sat(h) > 0.25) tally(accent, h, 50); });

  const heading = document.querySelector('h1') || document.querySelector('h2');
  const hcs = heading ? getComputedStyle(heading) : null;
  const bcs = getComputedStyle(document.body);
  const rootVars = {};
  for (const sheet of [...document.styleSheets]) {
    let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
    for (const rule of [...rules]) {
      if (rule.selectorText && /(^|,)\s*(:root|html)\s*(,|$)/.test(rule.selectorText)) {
        for (const prop of [...rule.style]) if (prop.startsWith('--') && Object.keys(rootVars).length < 150) rootVars[prop] = rule.style.getPropertyValue(prop).trim();
      }
    }
  }
  const fontLinks = [...document.querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="typekit"], link[href*="fonts.bunny"]')].map((l) => l.href);
  const logo = document.querySelector('header img, [class*="logo" i] img, img[alt*="logo" i], header svg');

  return {
    url: location.href,
    colorScheme: getComputedStyle(document.documentElement).colorScheme,
    pageBackground: toHex(bcs.backgroundColor) || toHex(getComputedStyle(document.documentElement).backgroundColor) || '#ffffff',
    backgrounds: top(bg), textColors: top(fg), borderColors: top(border, 5), accentCandidates: top(accent, 5),
    fonts: { body: bcs.fontFamily, heading: hcs ? hcs.fontFamily : null, ranked: top(fonts, 5), webFontLinks: fontLinks },
    type: { bodyPx: parseFloat(bcs.fontSize), bodyLineHeight: bcs.lineHeight, h1: hcs ? { px: parseFloat(hcs.fontSize), weight: hcs.fontWeight, letterSpacing: hcs.letterSpacing, transform: hcs.textTransform, style: hcs.fontStyle } : null },
    radii: top(radii, 6), shadows: top(shadows, 4), spacing: top(gaps, 10),
    primaryButton: btn ? { text: (btn.b.innerText || '').trim().slice(0, 40), bg: toHex(btn.cs.backgroundColor), color: toHex(btn.cs.color), radius: btn.cs.borderRadius, height: Math.round(btn.r.height), font: `${btn.cs.fontWeight} ${btn.cs.fontSize} ${btn.cs.fontFamily.split(',')[0]}`, transform: btn.cs.textTransform, letterSpacing: btn.cs.letterSpacing } : null,
    logo: logo ? { tag: logo.tagName.toLowerCase(), src: logo.currentSrc || logo.src || null, alt: logo.getAttribute('alt') } : null,
    cssCustomProperties: rootVars,
  };
})()
