#!/usr/bin/env node
// Evidence capture for the ux-audit skill.
//
//   node capture.mjs [--out DIR] [--viewports phone,phone-small,phone-landscape,tablet,desktop]
//                    [--no-perf] [--keep-cookies] URL [URL...]
//
// For every URL × viewport it saves:
//   DIR/<page>/<viewport>/first-raw.jpg   first screen exactly as a new visitor sees it
//   DIR/<page>/<viewport>/first.jpg       first screen after declining non-essential cookies
//   DIR/<page>/<viewport>/full.jpg        full page
//   DIR/<page>/<viewport>/probe.json      output of probe.js
// plus DIR/<page>/perf.json (throttled 4G + 4x CPU run on the phone viewport, 3 runs),
// DIR/tokens.json (design tokens of the first URL, desktop) and DIR/summary.json.
//
// Requires Playwright:  npm i -D playwright && npx playwright install chromium
// (or set UX_AUDIT_CHROMIUM to any Chromium/Chrome binary; installed Chrome is tried as a fallback)
// Read-only: it never submits forms. The only click is on a "reject/decline cookies" button.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium, devices;
try {
  ({ chromium, devices } = await import('playwright'));
} catch {
  console.error('Playwright is not installed. Run:\n  npm i -D playwright && npx playwright install chromium\nOr follow the manual path in references/measurement.md.');
  process.exit(2);
}

const here = dirname(fileURLToPath(import.meta.url));
const PROBE = await readFile(join(here, 'probe.js'), 'utf8');
const TOKENS = await readFile(join(here, 'extract-tokens.js'), 'utf8');

const VIEWPORTS = {
  'phone':           { label: 'iPhone 13 · 390×664', device: 'iPhone 13' },
  'phone-small':     { label: 'iPhone SE · 320×568', device: 'iPhone SE' },
  'phone-landscape': { label: 'Phone landscape · 750×342', device: 'iPhone 13 landscape' },
  'tablet':          { label: 'iPad Mini · 768×1024', device: 'iPad Mini' },
  'desktop':         { label: 'Desktop · 1440×900', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
};
const COOKIE_REJECT = /^(reject( all)?|decline( all)?|deny|refuse|only (necessary|essential)|necessary only|use necessary cookies only|reject non-essential|recusar|rejeitar( todos)?|apenas (necess[aá]rios|essenciais)|rechazar( todo)?|solo necesarias|refuser|tout refuser|ablehnen|alle ablehnen)/i;

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); if (i === -1) return def; const v = args[i + 1]; args.splice(i, 2); return v; };
const flag = (name) => { const i = args.indexOf(name); if (i === -1) return false; args.splice(i, 1); return true; };
const OUT = opt('--out', './ux-audit-evidence');
const VPS = opt('--viewports', Object.keys(VIEWPORTS).join(',')).split(',').map((s) => s.trim()).filter(Boolean);
const NO_PERF = flag('--no-perf');
const KEEP_COOKIES = flag('--keep-cookies');
const URLS = args.filter((a) => /^https?:\/\//.test(a));
if (!URLS.length) { console.error('Usage: node capture.mjs [--out DIR] [--viewports …] [--no-perf] URL [URL...]'); process.exit(1); }

const slug = (u) => { const { hostname, pathname } = new URL(u); return (hostname + pathname).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60) || 'page'; };
const ctxOptions = (key) => {
  const v = VIEWPORTS[key]; if (!v) throw new Error(`Unknown viewport "${key}". Known: ${Object.keys(VIEWPORTS).join(', ')}`);
  return v.device ? { ...devices[v.device] } : { viewport: v.viewport, deviceScaleFactor: v.deviceScaleFactor };
};
const settle = async (page) => { try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch {} await page.waitForTimeout(1200); };
const rejectCookies = async (page) => {
  for (const frame of page.frames()) {
    const buttons = frame.locator('button, [role="button"], a');
    const n = Math.min(await buttons.count().catch(() => 0), 400);
    for (let i = 0; i < n; i++) {
      const b = buttons.nth(i);
      const t = ((await b.innerText({ timeout: 300 }).catch(() => '')) || '').trim();
      if (t && t.length < 60 && COOKIE_REJECT.test(t) && (await b.isVisible().catch(() => false))) {
        await b.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(800);
        return t;
      }
    }
  }
  return null;
};

// Browser: UX_AUDIT_CHROMIUM=/path/to/chrome wins; else Playwright's bundled Chromium;
// else a locally installed Google Chrome.
const launch = async () => {
  if (process.env.UX_AUDIT_CHROMIUM) return chromium.launch({ executablePath: process.env.UX_AUDIT_CHROMIUM });
  try { return await chromium.launch(); } catch (e) {
    try { return await chromium.launch({ channel: 'chrome' }); } catch { throw e; }
  }
};
const browser = await launch();
const summary = { generatedAt: new Date().toISOString(), pages: [] };
await mkdir(OUT, { recursive: true });

for (const url of URLS) {
  const pageDir = join(OUT, slug(url));
  const entry = { url, dir: pageDir, viewports: {} };
  for (const vp of VPS) {
    const dir = join(pageDir, vp); await mkdir(dir, { recursive: true });
    const context = await browser.newContext({ ...ctxOptions(vp), locale: 'en-US' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 200)));
    page.on('response', (r) => { if (r.status() >= 400 && r.request().method() === 'GET') errors.push(`${r.status()} ${r.url().slice(0, 120)}`); });
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      await settle(page);
      await page.screenshot({ path: join(dir, 'first-raw.jpg'), type: 'jpeg', quality: 70, scale: 'css' });
      const rejected = KEEP_COOKIES ? null : await rejectCookies(page);
      await page.screenshot({ path: join(dir, 'first.jpg'), type: 'jpeg', quality: 70, scale: 'css' });
      const probe = await page.evaluate(PROBE);
      probe.cookieBannerRejectedWith = rejected;
      probe.consoleAndHttpErrors = errors.slice(0, 20);
      await writeFile(join(dir, 'probe.json'), JSON.stringify(probe, null, 2));
      await page.screenshot({ path: join(dir, 'full.jpg'), type: 'jpeg', quality: 60, fullPage: true, scale: 'css' }).catch(() => {});
      if (vp === 'desktop' && url === URLS[0]) await writeFile(join(OUT, 'tokens.json'), JSON.stringify(await page.evaluate(TOKENS), null, 2));
      entry.viewports[vp] = {
        label: VIEWPORTS[vp].label, screens: probe.page.screens, overflowX: probe.overflowX.overflows,
        h1: probe.primaryCandidates.h1, searchAtScreens: probe.primaryCandidates.search ? probe.primaryCandidates.search.y : null,
        targetsUnder44: probe.targets.under44Count, targetsUnder24: probe.targets.under24Count,
        contrastFails: probe.contrast.failCount, smallText: probe.text.smallTextCount, unnamedControls: probe.unnamedControls.length,
        zoomBlocked: probe.zoomBlocked, fixedCoverPct: Math.round(probe.fixed.reduce((s, f) => s + f.coverPct, 0)),
      };
      console.log(`✓ ${url} @ ${vp}: ${probe.page.screens} screens, ${probe.targets.under44Count} targets <44px, ${probe.contrast.failCount} contrast fails`);
    } catch (e) {
      entry.viewports[vp] = { error: String(e.message).slice(0, 300) };
      console.log(`✗ ${url} @ ${vp}: ${e.message}`);
    }
    await context.close();
  }

  if (!NO_PERF) {
    const runs = [];
    for (let i = 0; i < 3; i++) {
      const context = await browser.newContext({ ...ctxOptions('phone') });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: i === 0 });
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      try {
        await page.goto(url, { waitUntil: 'load', timeout: 90000 });
        await settle(page);
        const p = await page.evaluate(PROBE);
        runs.push({ run: i + 1, cold: i === 0, ...p.performance, oversizedImages: p.oversizedImages.length });
      } catch (e) { runs.push({ run: i + 1, error: String(e.message).slice(0, 200) }); }
      await context.close();
    }
    const profile = 'Phone viewport, simulated 4G (150 ms RTT, 1.6 Mbps down, 750 kbps up), 4x CPU slowdown; run 1 without cache.';
    await writeFile(join(pageDir, 'perf.json'), JSON.stringify({ profile, runs }, null, 2));
    entry.perf = runs;
    console.log(`  perf ${url}: LCP ${runs.map((r) => r.lcpMs ?? '–').join(' / ')} ms, CLS ${runs.map((r) => r.cls ?? '–').join(' / ')}`);
  }
  summary.pages.push(entry);
}

await browser.close();
await writeFile(join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(`\nEvidence saved to ${OUT}  (summary.json, tokens.json, <page>/<viewport>/…)`);
