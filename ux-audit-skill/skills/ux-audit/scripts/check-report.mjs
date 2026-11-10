#!/usr/bin/env node
// Validates a finished ux-audit report.   node check-report.mjs [--theme-only] report.html
// Exit 0 = ready to deliver; exit 1 = errors listed. No dependencies.
import { readFile, stat } from 'node:fs/promises';

const args = process.argv.slice(2);
const themeOnly = args.includes('--theme-only');
const file = args.find((a) => !a.startsWith('--'));
if (!file) { console.error('Usage: node check-report.mjs [--theme-only] report.html'); process.exit(1); }
const html = await readFile(file, 'utf8');
const errors = [], warnings = [];
const lineOf = (i) => html.slice(0, i).split('\n').length;

// ---------- theme contrast ----------
const hexToRgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const lum = (rgb) => { const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(hexToRgb(a)), lum(hexToRgb(b))]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const theme = html.match(/THEME:START[\s\S]*?:root\s*\{([\s\S]*?)\}/);
if (!theme) errors.push('THEME block not found (expected "THEME:START" followed by a :root { … } block).');
else {
  const vars = {};
  for (const m of theme[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  const pairs = [['ink', 'surface'], ['ink-2', 'surface'], ['ink', 'bg'], ['ink-2', 'bg'], ['accent', 'surface'], ['on-brand', 'brand'], ['header-ink', 'header-bg'], ['site-on-primary', 'site-primary'], ['site-ink', 'site-bg']];
  for (const [fg, bg] of pairs) {
    const a = vars[fg], b = vars[bg];
    if (!a || !b) continue;
    if (!/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(a) || !/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(b)) { warnings.push(`Theme: --${fg} on --${bg} not checked (use hex values to enable the check).`); continue; }
    const r = ratio(a, b);
    if (r < 4.5) errors.push(`Theme contrast: --${fg} (${a}) on --${bg} (${b}) is ${r.toFixed(2)}:1, needs 4.5:1.`);
  }
}

if (!themeOnly) {
  // ---------- leftovers ----------
  for (const m of html.matchAll(/\{\{[^}]{0,80}\}\}/g)) errors.push(`Unfilled slot ${m[0]} (line ${lineOf(m.index)}).`);
  for (const m of html.matchAll(/<!--\s*EXAMPLE: replace/g)) errors.push(`Leftover "EXAMPLE: replace" comment (line ${lineOf(m.index)}): replace the example and delete the comment.`);
  if (/Northwind/.test(html)) errors.push('Example brand "Northwind" still present: replace the template examples.');

  // ---------- sections ----------
  for (const id of ['summary', 'journey', 'lenses', 'findings', 'a11y', 'devices', 'strengths', 'roadmap', 'method']) {
    if (!new RegExp(`<section[^>]*id="${id}"`).test(html)) errors.push(`Missing section #${id}.`);
  }
  if (!/<section[^>]*id="perf"/.test(html)) warnings.push('No #perf section: state in Method why performance was not measured.');

  // ---------- findings ----------
  const articles = [...html.matchAll(/<article class="finding"([^>]*)>([\s\S]*?)<\/article>/g)];
  if (!articles.length) errors.push('No findings (<article class="finding">).');
  const counts = { crit: 0, high: 0, med: 0, low: 0 };
  const sevBadge = { crit: 'b-crit', high: 'b-high', med: 'b-med', low: 'b-low' };
  articles.forEach((m, i) => {
    const attrs = m[1], body = m[2];
    const id = (attrs.match(/id="([^"]+)"/) || [])[1] || `#${i + 1}`;
    const sev = (attrs.match(/data-sev="([^"]+)"/) || [])[1];
    const where = `Finding ${id}`;
    if (!/^f\d{2,}$/.test(id)) errors.push(`${where}: id must look like f01, f02…`);
    if (!sev || !(sev in counts)) { errors.push(`${where}: data-sev must be crit, high, med or low.`); return; }
    counts[sev]++;
    if (!body.includes(sevBadge[sev])) errors.push(`${where}: severity badge does not match data-sev="${sev}" (expected class ${sevBadge[sev]}).`);
    if (!/<h3>[\s\S]+?<\/h3>/.test(body)) errors.push(`${where}: missing title <h3>.`);
    if ((body.match(/<span class="tag">/g) || []).length < 1) errors.push(`${where}: needs at least one lens tag.`);
    const fText = body.match(/class="f-text">([\s\S]*?)<\/div>\s*<aside/);
    const h4s = fText ? (fText[1].match(/<h4>/g) || []).length : (body.match(/<h4>/g) || []).length;
    if (h4s < 3) errors.push(`${where}: needs Observed, Why it matters and Recommendation blocks (found ${h4s} <h4>).`);
    const impact = body.match(/<aside class="impact"[\s\S]*?<\/aside>/);
    if (!impact) errors.push(`${where}: missing predicted-impact <aside class="impact">.`);
    else if ((impact[0].match(/<dt>/g) || []).length < 5) errors.push(`${where}: impact needs metric, change, who, confidence and effort (5 <dt>).`);
    if ((sev === 'crit' || sev === 'high') && !/ftag proposed/.test(body)) errors.push(`${where}: ${sev === 'crit' ? 'Critical' : 'High'} findings need a Proposed mockup.`);
    const marks = (body.match(/class="mark"/g) || []).length, callouts = (body.match(/<span class="n">/g) || []).length;
    if (marks && marks !== callouts) warnings.push(`${where}: ${marks} markers on captures but ${callouts} numbered callouts.`);
    if (/ftag today/.test(body) && !/<img[^>]+alt="[^"]{20,}"/.test(body)) warnings.push(`${where}: Today capture needs a descriptive alt text.`);
  });

  // ---------- filter counts ----------
  const total = articles.length;
  for (const m of html.matchAll(/data-filter="(\w+)"[^>]*>[^<(]*\((\d+)\)/g)) {
    const expect = m[1] === 'all' ? total : counts[m[1]];
    if (expect === undefined) continue;
    if (+m[2] !== expect) errors.push(`Filter "${m[1]}" says ${m[2]} but there are ${expect} findings.`);
  }
  for (const k of Object.keys(counts)) if (counts[k] && !html.includes(`data-filter="${k}"`)) errors.push(`Filter button for "${k}" missing (${counts[k]} findings).`);

  // ---------- internal links ----------
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const broken = new Set([...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]).filter((id) => !ids.has(id)));
  broken.forEach((id) => errors.push(`Broken internal link #${id}.`));

  // ---------- images ----------
  for (const m of html.matchAll(/<img[^>]*\ssrc="([^"]*)"/g)) {
    const src = m[1];
    if (!src) errors.push(`Empty image src (line ${lineOf(m.index)}).`);
    else if (/^https?:/.test(src)) warnings.push(`Remote image (line ${lineOf(m.index)}): embed as data: URI so the report works offline.`);
    else if (!src.startsWith('data:')) errors.push(`Local image path "${src.slice(0, 60)}" (line ${lineOf(m.index)}): embed as data: URI.`);
  }

  // ---------- size ----------
  const mb = (await stat(file)).size / 1024 / 1024;
  if (mb > 15) errors.push(`File is ${mb.toFixed(1)} MB; keep it under 15 MB (downscale/crop screenshots).`);
  else if (mb > 8) warnings.push(`File is ${mb.toFixed(1)} MB; consider lighter screenshots.`);

  console.log(`Findings: ${total} (critical ${counts.crit}, high ${counts.high}, medium ${counts.med}, low ${counts.low})`);
}

warnings.forEach((w) => console.log(`warning: ${w}`));
errors.forEach((e) => console.log(`ERROR: ${e}`));
console.log(errors.length ? `\n${errors.length} error(s). Fix and re-run.` : '\nReport OK.');
process.exit(errors.length ? 1 : 0);
