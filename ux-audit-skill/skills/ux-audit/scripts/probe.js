// UX audit probe. Evaluate this whole file in the page (Playwright page.evaluate,
// DevTools console, or any browser tool's "run JavaScript"). It resolves to one JSON
// object of measurements. Read-only: it never clicks, types or changes the page.
(async () => {
  const MAX = 40; // max samples per list
  const vw = window.innerWidth, vh = window.innerHeight, dpr = window.devicePixelRatio || 1;
  const docH = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
  const r1 = (n) => Math.round(n * 10) / 10;
  const r2 = (n) => Math.round(n * 100) / 100;

  const sel = (el) => {
    const parts = [];
    for (let e = el, i = 0; e && e.nodeType === 1 && i < 3; e = e.parentElement, i++) {
      let s = e.tagName.toLowerCase();
      if (e.id) { parts.unshift(s + '#' + CSS.escape(e.id)); break; }
      const cls = [...e.classList].filter((c) => !/^(css|sc|jsx|_)-?[a-z0-9]{4,}$/i.test(c)).slice(0, 2);
      if (cls.length) s += '.' + cls.map((c) => CSS.escape(c)).join('.');
      parts.unshift(s);
    }
    return parts.join(' > ');
  };
  const text = (el, n = 60) => (el.innerText || el.textContent || el.value || '').replace(/\s+/g, ' ').trim().slice(0, n);
  // Visible to sighted users: excludes display:none, hidden, transparent and
  // screen-reader-only (1-2 px or clipped) elements such as skip links at rest.
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 2 || r.height <= 2) return false;
    const cs = getComputedStyle(el);
    if (/rect\(0(px)?,? 0(px)?/.test(cs.clip) || /inset\(50%\)/.test(cs.clipPath)) return false;
    if (r.right <= 0 || r.left >= vw) return false; // parked off-canvas (closed drawers, slide-out menus)
    if (el.closest('[inert],[aria-hidden="true"]')) return false;
    return cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05;
  };
  const inConsent = (el) => !!el.closest('[id*="cookie" i],[class*="cookie" i],[id*="consent" i],[class*="consent" i],[aria-label*="cookie" i]');
  const absBox = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const screensAt = (y) => r2(y / vh);

  // ---------- accessible name (approximation of accname) ----------
  const accName = (el) => {
    const lb = el.getAttribute('aria-labelledby');
    if (lb) {
      const t = lb.split(/\s+/).map((id) => document.getElementById(id)).filter(Boolean).map((e) => text(e, 200)).join(' ').trim();
      if (t) return t;
    }
    const al = el.getAttribute('aria-label');
    if (al && al.trim()) return al.trim();
    if (el.labels && el.labels.length) { const t = [...el.labels].map((l) => text(l, 200)).join(' ').trim(); if (t) return t; }
    if (el.tagName === 'IMG') return (el.getAttribute('alt') || '').trim();
    if (el.tagName === 'INPUT' && ['submit', 'button', 'reset'].includes(el.type)) return (el.value || '').trim();
    const t = text(el, 200);
    if (t) return t;
    const img = el.querySelector && el.querySelector('img[alt]:not([alt=""]), svg[aria-label], [role="img"][aria-label]');
    if (img) return (img.getAttribute('alt') || img.getAttribute('aria-label') || '').trim();
    return (el.getAttribute('title') || el.getAttribute('placeholder') || '').trim();
  };

  // ---------- colour & contrast ----------
  const parseColor = (c) => {
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const blend = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1,
  });
  const bgOf = (el) => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && !/gradient/.test(cs.backgroundImage)) return { overImage: true };
      const c = parseColor(cs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base);
    return { color: base };
  };
  // Text painted over an <img>/<video>/<canvas> (e.g. hero banners) cannot be scored from CSS.
  const overMedia = (el) => {
    const r = el.getBoundingClientRect();
    for (let a = el.parentElement, i = 0; a && i < 5; a = a.parentElement, i++) {
      const media = a.querySelectorAll('img, video, canvas');
      if (media.length > 30) break;
      for (const m of media) {
        const q = m.getBoundingClientRect();
        const ix = Math.min(r.right, q.right) - Math.max(r.left, q.left), iy = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top);
        if (ix > r.width * 0.5 && iy > r.height * 0.5 && q.width > 40 && q.height > 40) return true;
      }
    }
    return false;
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };

  // ---------- page basics ----------
  const vm = document.querySelector('meta[name="viewport"]');
  const viewportMeta = vm ? vm.content : null;
  const zoomBlocked = !!(viewportMeta && (/user-scalable\s*=\s*(no|0)/i.test(viewportMeta) || /maximum-scale\s*=\s*1(\.0)?\b/i.test(viewportMeta)));

  const sw = document.documentElement.scrollWidth;
  const overflowOffenders = [];
  if (sw > vw + 1) {
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width > 0 && visible(el)) {
        overflowOffenders.push({ sel: sel(el), right: Math.round(r.right), w: Math.round(r.width) });
        if (overflowOffenders.length >= 10) break;
      }
    }
  }

  // ---------- headings & landmarks ----------
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')].filter(visible).map((h) => ({
    level: h.getAttribute('aria-level') ? +h.getAttribute('aria-level') : +h.tagName[1] || 2,
    text: text(h, 90), y: screensAt(absBox(h).y),
  }));
  const skipped = [];
  headings.forEach((h, i) => { if (i && h.level > headings[i - 1].level + 1) skipped.push(`${headings[i - 1].level}→${h.level} at "${h.text}"`); });
  const count = (q) => document.querySelectorAll(q).length;
  const navs = [...document.querySelectorAll('nav,[role="navigation"]')];
  const landmarks = {
    main: count('main,[role="main"]'), header: count('header,[role="banner"]'), footer: count('footer,[role="contentinfo"]'),
    nav: navs.length, unnamedNav: navs.length > 1 ? navs.filter((n) => !n.getAttribute('aria-label') && !n.getAttribute('aria-labelledby')).length : 0,
    search: count('[role="search"],search'),
  };
  // A skip link is an in-page anchor among the first focusable elements (it may sit after a cookie banner).
  const firstFocusables = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].slice(0, 12);
  const skipLink = firstFocusables.some((a) => a.tagName === 'A' && /^#./.test(a.getAttribute('href') || '') && /skip|jump|pular|saltar|ir para|main|content|conte[uú]do|contenido/i.test((a.textContent || '') + a.getAttribute('href')));

  // ---------- interactive targets ----------
  const interactiveSel = 'a[href],button,input:not([type="hidden"]),select,textarea,summary,[role="button"],[role="link"],[role="tab"],[role="checkbox"],[role="radio"],[role="switch"],[role="menuitem"],[tabindex]:not([tabindex="-1"])';
  const targets = [...document.querySelectorAll(interactiveSel)].filter(visible);
  const rects = targets.map((el) => el.getBoundingClientRect());
  const isInline = (el) => {
    const cs = getComputedStyle(el);
    if (el.tagName !== 'A' || !cs.display.startsWith('inline')) return false;
    const p = el.parentElement;
    return !!p && /^(P|LI|SPAN|TD|DD|LABEL)$/.test(p.tagName) && text(p, 400).length > text(el, 400).length + 15;
  };
  const gap = (i) => {
    const a = rects[i]; let best = Infinity;
    rects.forEach((b, j) => {
      if (i === j) return;
      const dx = Math.max(0, Math.max(a.left, b.left) - Math.min(a.right, b.right));
      const dy = Math.max(0, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom));
      if (Math.abs(a.top - b.top) < vh * 3) best = Math.min(best, Math.hypot(dx, dy));
    });
    return best === Infinity ? null : Math.round(best);
  };
  // WCAG 2.5.8 spacing exception: an undersized target passes when a 24 px circle centred on
  // its box intersects no other target and no circle of another undersized target.
  const small = rects.map((r) => r.width < 24 || r.height < 24);
  const centre = (r) => [r.left + r.width / 2, r.top + r.height / 2];
  const distToRect = ([x, y], r) => Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
  const spacingOk = (i) => {
    const c = centre(rects[i]);
    return rects.every((b, j) => {
      if (i === j || Math.abs(b.top - rects[i].top) > vh * 3) return true;
      if (distToRect(c, b) < 12) return false;
      if (small[j]) { const d = centre(b); if (Math.hypot(c[0] - d[0], c[1] - d[1]) < 24) return false; }
      return true;
    });
  };
  const under44 = [], under24 = [];
  targets.forEach((el, i) => {
    const r = rects[i];
    if (r.width >= 44 && r.height >= 44) return;
    if (el.type === 'checkbox' || el.type === 'radio') { if (el.labels && el.labels.length) return; }
    const item = { sel: sel(el), name: accName(el).slice(0, 50), w: Math.round(r.width), h: Math.round(r.height), y: screensAt(absBox(el).y), inline: isInline(el), nearestGap: gap(i) };
    if (item.inline) return; // inline text links are exempt from 2.5.8
    under44.push(item);
    if (r.width < 24 || r.height < 24) {
      item.spacingException = spacingOk(i);
      if (!item.spacingException) under24.push(item);
    }
  });

  // Focusable controls parked off-canvas without inert/aria-hidden: keyboard focus lands on
  // something nobody can see (WCAG 2.4.3, 2.4.7, 4.1.2). Typical cause: a closed drawer or menu.
  const offscreenFocusable = [...document.querySelectorAll('a[href],button:not([disabled]),input:not([type="hidden"]):not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])')]
    .filter((el) => {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if (r.width < 1 || r.height < 1 || cs.visibility === 'hidden' || cs.display === 'none') return false;
      if (el.closest('[inert],[aria-hidden="true"]')) return false;
      return r.right <= 0 || r.left >= vw;
    }).slice(0, MAX).map((el) => ({ sel: sel(el), name: accName(el).slice(0, 50), x: Math.round(el.getBoundingClientRect().left) }));
  const unnamedControls = targets.filter((el) => !accName(el)).slice(0, MAX).map((el) => ({ sel: sel(el), tag: el.tagName.toLowerCase() }));
  const labelInName = targets.filter((el) => {
    const al = el.getAttribute('aria-label'); const vis = text(el, 200);
    return al && vis && vis.length > 2 && !al.toLowerCase().includes(vis.toLowerCase());
  }).slice(0, MAX).map((el) => ({ sel: sel(el), visible: text(el, 50), ariaLabel: el.getAttribute('aria-label').slice(0, 80) }));
  const VAGUE = /^(click here|here|more|read more|learn more|see more|details|link|saiba mais|clique aqui|ver mais|leia mais|aqu[ií]|más|ver más)$/i;
  const vagueLinks = targets.filter((el) => el.tagName === 'A' && VAGUE.test(accName(el))).slice(0, MAX).map((el) => ({ sel: sel(el), name: accName(el) }));

  // ---------- text size & contrast ----------
  const textEls = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent.trim().length > 1 ? 1 : 2) });
  const seen = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!el || seen.has(el) || /^(SCRIPT|STYLE|NOSCRIPT|OPTION)$/.test(el.tagName) || !visible(el)) continue;
    seen.add(el); textEls.push(el);
    if (textEls.length > 1500) break;
  }
  const smallText = []; const contrastFails = []; const overImage = [];
  let contrastChecked = 0;
  for (const el of textEls) {
    const cs = getComputedStyle(el); const size = parseFloat(cs.fontSize); const weight = parseInt(cs.fontWeight, 10) || 400;
    if (size < 12 && smallText.length < MAX) smallText.push({ sel: sel(el), text: text(el, 40), px: size });
    const fg = parseColor(cs.color); if (!fg) continue;
    if (parseFloat(cs.textIndent) < -500 || size === 0 || cs.color === 'transparent') continue; // image-replaced text
    const bg = overMedia(el) ? { overImage: true } : bgOf(el);
    if (bg.overImage) { if (overImage.length < 15) overImage.push({ sel: sel(el), text: text(el, 40) }); continue; }
    const c = ratio(fg.a < 1 ? blend(fg, bg.color) : fg, bg.color); contrastChecked++;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;
    if (c < need && contrastFails.length < MAX) contrastFails.push({ sel: sel(el), text: text(el, 40), ratio: r2(c), need, px: size, fg: cs.color, bg: `rgb(${Math.round(bg.color.r)}, ${Math.round(bg.color.g)}, ${Math.round(bg.color.b)})` });
  }

  // ---------- images ----------
  const imgs = [...document.images].filter(visible);
  const resources = performance.getEntriesByType('resource');
  const bytesOf = (src) => { const e = resources.find((r) => r.name === src); return e ? e.transferSize || e.encodedBodySize || 0 : null; };
  const images = {
    total: imgs.length,
    missingAlt: imgs.filter((i) => !i.hasAttribute('alt')).slice(0, MAX).map((i) => ({ sel: sel(i), src: (i.currentSrc || i.src).slice(-80) })),
    emptyAlt: imgs.filter((i) => i.getAttribute('alt') === '').length,
    linkImagesWithoutName: [...document.querySelectorAll('a[href]')].filter((a) => visible(a) && !accName(a) && a.querySelector('img')).length,
  };
  const oversizedImages = imgs.filter((i) => i.naturalWidth && i.naturalWidth > i.getBoundingClientRect().width * dpr * 1.5 && i.getBoundingClientRect().width > 20)
    .slice(0, MAX).map((i) => ({ sel: sel(i), rendered: Math.round(i.getBoundingClientRect().width), natural: i.naturalWidth, kb: bytesOf(i.currentSrc || i.src) !== null ? Math.round(bytesOf(i.currentSrc || i.src) / 1024) : null }));

  // ---------- form fields ----------
  const fields = [...document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]),select,textarea')].filter(visible);
  const inputs = fields.slice(0, MAX).map((f) => {
    const labelled = (f.labels && f.labels.length) || f.getAttribute('aria-label') || f.getAttribute('aria-labelledby');
    return {
      sel: sel(f), tag: f.tagName.toLowerCase(), type: f.type || null, name: f.name || null,
      label: labelled ? accName(f).slice(0, 60) : null, placeholderOnly: !labelled && !!f.placeholder,
      placeholder: f.placeholder || null, autocomplete: f.getAttribute('autocomplete'), inputmode: f.getAttribute('inputmode'),
      required: f.required || f.getAttribute('aria-required') === 'true', maxlength: f.maxLength > 0 ? f.maxLength : null,
      fontSize: parseFloat(getComputedStyle(f).fontSize), w: Math.round(f.getBoundingClientRect().width), h: Math.round(f.getBoundingClientRect().height),
      y: screensAt(absBox(f).y),
    };
  });

  // ---------- fixed / sticky chrome ----------
  const fixed = [...document.querySelectorAll('body *')].filter((el) => {
    const p = getComputedStyle(el).position;
    if ((p !== 'fixed' && p !== 'sticky') || !visible(el)) return false;
    const r = el.getBoundingClientRect(); // keep only chrome that actually paints on top (skips closed drawers)
    const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 4, r.top + 4], [r.right - 4, r.bottom - 4]];
    return pts.some(([x, y]) => { if (x < 0 || y < 0 || x >= vw || y >= vh) return false; const hit = document.elementFromPoint(x, y); return !!hit && (el === hit || el.contains(hit)); });
  }).map((el) => { const r = el.getBoundingClientRect(); return { sel: sel(el), position: getComputedStyle(el).position, top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width), coverPct: r1(Math.min(r.height, vh) * Math.min(r.width, vw) / (vw * vh) * 100) }; })
    .filter((f) => f.coverPct > 0.5).slice(0, 15);

  // ---------- where the task starts ----------
  const search = [...document.querySelectorAll('input[type="search"],[role="search"] input,input[name*="search" i],input[name="q"],input[placeholder*="search" i],input[placeholder*="busca" i],input[placeholder*="buscar" i]')].find(visible);
  const h1 = document.querySelector('h1');
  const buttons = [...document.querySelectorAll('button,a[href],[role="button"],input[type="submit"]')].filter((b) => visible(b) && !inConsent(b)).map((b) => {
    const cs = getComputedStyle(b); const bg = parseColor(cs.backgroundColor); const r = b.getBoundingClientRect();
    return { el: b, filled: !!(bg && bg.a > 0.5 && !(bg.r > 240 && bg.g > 240 && bg.b > 240)), area: r.width * r.height };
  }).filter((b) => b.filled && b.area >= 1200).sort((a, b) => b.area - a.area).slice(0, 6);
  const primaryCandidates = {
    h1: h1 ? { text: text(h1, 90), y: screensAt(absBox(h1).y) } : null,
    search: search ? { sel: sel(search), y: screensAt(absBox(search).y) } : null,
    filledButtons: buttons.map((b) => ({ name: accName(b.el).slice(0, 40), sel: sel(b.el), y: screensAt(absBox(b.el).y), w: Math.round(b.el.getBoundingClientRect().width), h: Math.round(b.el.getBoundingClientRect().height) })),
  };

  // ---------- performance ----------
  const buffered = (type) => new Promise((res) => {
    const out = []; try {
      const po = new PerformanceObserver((l) => out.push(...l.getEntries()));
      po.observe({ type, buffered: true }); setTimeout(() => { po.disconnect(); res(out); }, 300);
    } catch (e) { res(out); }
  });
  const [lcpE, clsE] = await Promise.all([buffered('largest-contentful-paint'), buffered('layout-shift')]);
  const nav = performance.getEntriesByType('navigation')[0];
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  const byType = {};
  let totalKB = 0;
  resources.forEach((r) => { const k = r.initiatorType || 'other'; const kb = (r.transferSize || 0) / 1024; byType[k] = r1((byType[k] || 0) + kb); totalKB += kb; });
  const lastLcp = lcpE[lcpE.length - 1];
  const performanceData = {
    ttfbMs: nav ? Math.round(nav.responseStart - nav.startTime) : null,
    fcpMs: fcp ? Math.round(fcp.startTime) : null,
    lcpMs: lastLcp ? Math.round(lastLcp.startTime) : null,
    lcpElement: lastLcp && lastLcp.element ? sel(lastLcp.element) : null,
    cls: r2(clsE.filter((e) => !e.hadRecentInput).reduce((s, e) => s + e.value, 0) * 100) / 100,
    domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
    loadMs: nav ? Math.round(nav.loadEventEnd) : null,
    requests: resources.length + 1,
    transferKB: Math.round(totalKB + (nav ? nav.transferSize / 1024 : 0)),
    kbByType: byType,
    note: 'transferKB is 0 for cross-origin resources without Timing-Allow-Origin; treat as a lower bound.',
  };

  return {
    url: location.href, title: document.title, lang: document.documentElement.getAttribute('lang'),
    viewport: { w: vw, h: vh, dpr }, viewportMeta, zoomBlocked,
    page: { heightPx: docH, screens: r2(docH / vh) },
    overflowX: { scrollWidth: sw, viewportWidth: vw, overflows: sw > vw + 1, offenders: overflowOffenders },
    headings: { h1Count: headings.filter((h) => h.level === 1).length, skipped, list: headings.slice(0, 60) },
    landmarks, skipLink,
    offscreenFocusable,
    targets: { total: targets.length, under44Count: under44.length, under24Count: under24.length, under44: under44.slice(0, MAX), under24: under24.slice(0, MAX) },
    unnamedControls, labelInName, vagueLinks,
    liveRegions: count('[aria-live],[role="status"],[role="alert"],output'),
    text: { bodyFontPx: parseFloat(getComputedStyle(document.body).fontSize), smallTextCount: smallText.length, smallText },
    contrast: { checked: contrastChecked, failCount: contrastFails.length, fails: contrastFails, overImageNeedsManualCheck: overImage },
    images, oversizedImages, inputs, fixed, primaryCandidates, performance: performanceData,
  };
})()
