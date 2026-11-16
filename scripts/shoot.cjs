/* =========================================================================
   渲染验收（v3 / Vite）
   对 http://127.0.0.1:4173 的 vite preview 跑，需要先 npm run build。
   量测：横向溢出、最小字号、对比度、控制台报错、断链、面板高度、
        字体加载、移动端；另跑一组交互功能测试。
   用法：npm run build && node scripts/shoot.cjs --out .shots
   ========================================================================= */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.SHOOT_BASE || 'http://127.0.0.1:4173';
// Previewing with VITE_BASE=personal-site ? Set SHOOT_PREFIX=personal-site.
const PREFIX = process.env.SHOOT_PREFIX
  ? '/' + process.env.SHOOT_PREFIX.replace(/^\/+|\/+$/g, '')
  : '';
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const OUT = path.resolve(ROOT, outIdx >= 0 ? args[outIdx + 1] : '.shots');

const HOME = {
  name: 'home', url: PREFIX + '/',
  sections: [
    ['home-hero', '#top'], ['home-about', '#about'],
    ['home-work', '#work'], ['home-notes', '#notes'],
    ['home-branch', '#branch'], ['home-tradeoffs', '#tradeoffs'],
    ['home-craft', '#craft'],
  ],
};
const CASE = {
  name: 'case', url: PREFIX + '/projects/rag/',
  sections: [
    ['case-head', '.case-head'], ['case-workbench', '#workbench'],
    ['case-boundary', '#boundary'], ['case-pipelines', '#pipelines'],
    ['case-code', '#code'], ['case-thinking', '#thinking'],
    ['case-evidence', '#evidence'],
  ],
};

function luminance(hex) {
  const h = hex.replace('#', '');
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

async function measure(page) {
  return page.evaluate(() => {
    const res = {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      small: [], svgSmall: [], fonts: [], links: [],
    };
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('svg')) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!hasText) continue;
      const size = parseFloat(cs.fontSize);
      if (size < 12) res.small.push({ tag: el.tagName, cls: String(el.className).slice(0, 40), size, text: el.textContent.trim().slice(0, 28) });
    }
    for (const t of document.querySelectorAll('svg text')) {
      const size = parseFloat(getComputedStyle(t).fontSize) || 12;
      if (size < 12) res.svgSmall.push({ size, text: t.textContent.slice(0, 24) });
    }
    res.fonts = [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family))];
    for (const a of document.querySelectorAll('a[href]')) {
      const h = a.getAttribute('href');
      if (h && h.startsWith('#') && !document.querySelector(h)) res.links.push(h);
    }
    return res;
  });
}

async function shoot(page, name, selector, dir) {
  const el = await page.$(selector);
  if (!el) return `MISSING ${selector}`;
  await el.scrollIntoView();
  await new Promise((r) => setTimeout(r, 160));
  const file = path.join(dir, name + '.png');
  await el.screenshot({ path: file });
  return fs.statSync(file).size;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
  });

  const problems = [];
  for (const spec of [HOME, CASE]) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(BASE + spec.url, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 2600)); // 等终端打字结束

    const m = await measure(page);
    console.log(`\n=== ${spec.name} (${spec.url}) 1440px ===`);
    console.log(`scrollWidth ${m.scrollWidth} / client ${m.clientWidth} -> ${m.scrollWidth > m.clientWidth ? 'OVERFLOW' : 'ok'}`);
    console.log('fonts loaded:', m.fonts.join(', ') || '(none)');
    console.log('text < 12px:', m.small.length ? JSON.stringify(m.small.slice(0, 8)) : 'none');
    console.log('svg text < 12px:', m.svgSmall.length ? JSON.stringify(m.svgSmall.slice(0, 5)) : 'none');
    console.log('broken anchors:', m.links.length ? m.links : 'none');
    console.log('pageerrors:', errors.length ? errors : 'none');
    if (m.scrollWidth > m.clientWidth) problems.push(`${spec.name}: horizontal overflow`);
    if (m.small.length) problems.push(`${spec.name}: ${m.small.length} text below 12px`);
    if (m.svgSmall.length) problems.push(`${spec.name}: ${m.svgSmall.length} svg text below 12px`);
    if (m.links.length) problems.push(`${spec.name}: broken anchors ${m.links.join(',')}`);
    if (errors.length) problems.push(`${spec.name}: ${errors.length} console errors`);
    if (m.fonts.length < 3) problems.push(`${spec.name}: fonts not loaded (${m.fonts.length})`);

    const pairs = [
      ['paper/bg', '#f8f7ee', '#0c120e'],
      ['muted/bg', '#b7bdb1', '#0c120e'],
      ['muted2/bg', '#98a093', '#0c120e'],
      ['signal/bg', '#d2f343', '#0c120e'],
      ['ink/signal', '#0c120e', '#d2f343'],
      ['paper/surface', '#f8f7ee', '#131c16'],
      ['muted/surface', '#b7bdb1', '#131c16'],
    ];
    console.log('contrast:', pairs.map(([k, a, b]) => `${k} ${contrast(a, b).toFixed(2)}:1`).join(' | '));
    const worst = Math.min(...pairs.map(([, a, b]) => contrast(a, b)));
    if (worst < 4.5) problems.push(`${spec.name}: contrast below 4.5 (${worst.toFixed(2)})`);

    for (const [name, sel] of spec.sections) {
      console.log(`  shot ${name}: ${await shoot(page, name, sel, OUT)}`);
    }

    if (spec.name === 'case') {
      const heights = [];
      for (const lang of ['graph', 'perm', 'engine']) {
        await page.click(`#tab-${lang}`);
        await new Promise((r) => setTimeout(r, 120));
        heights.push(await page.$eval('#codeBody', (e) => Math.round(e.getBoundingClientRect().height)));
      }
      console.log('code panel heights:', heights.join(' / '));
      if (new Set(heights).size !== 1) problems.push('case: code panel height jumps between tabs');
    }

    const mob = await browser.newPage();
    await mob.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const mobErrors = [];
    mob.on('pageerror', (e) => mobErrors.push(e.message));
    await mob.goto(BASE + spec.url, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2600));
    const mm = await measure(mob);
    console.log(`--- ${spec.name} 390px --- scrollWidth ${mm.scrollWidth} / ${mm.clientWidth} -> ${mm.scrollWidth > mm.clientWidth ? 'OVERFLOW' : 'ok'}`);
    if (mm.scrollWidth > mm.clientWidth) problems.push(`${spec.name} mobile: horizontal overflow`);
    if (mobErrors.length) problems.push(`${spec.name} mobile: ${mobErrors.length} pageerrors`);
    await shoot(mob, `m-${spec.name}`, spec.name === 'home' ? '#top' : '.case-head', OUT);
    await mob.close();
    await page.close();
  }

  /* -------------------------------------------------------- 交互功能测试 */
  const p = await browser.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(BASE + PREFIX + '/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2600));
  await p.type('#termInput', 'help'); await p.keyboard.press('Enter');
  const help = await p.$eval('.term__log', (e) => e.textContent.includes('open case'));
  await p.type('#termInput', 'explain perm'); await p.keyboard.press('Enter');
  const explain = await p.$eval('.term__log', (e) => e.textContent.includes('关键不变量'));
  await p.type('#termInput', 'open c'); await p.keyboard.press('Tab');
  const tab = await p.$eval('#termInput', (e) => e.value);
  console.log('\n=== interaction ===');
  console.log('terminal help:', help, '| explain perm:', explain, '| Tab prefix:', JSON.stringify(tab));
  if (!help || !explain) problems.push('terminal commands failed');
  if (!tab.startsWith('open c')) problems.push('terminal Tab completion failed');

  await p.click('.primary-action');
  await p.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  const h1 = await p.$eval('h1', (e) => e.textContent.replace(/\s+/g, ''));
  console.log('CTA ->', p.url(), '| h1:', h1);
  if (!h1.includes('一次提问')) problems.push('cross-page link failed');

  await p.click('.mode-toggle');
  const interactive = await p.$eval('.map-node', (e) => !e.disabled);
  await p.evaluate(() => document.querySelectorAll('.map-node')[8].click());
  const inspector = await p.$eval('.inspector h3', (e) => e.textContent);
  console.log('workbench interactive:', interactive, '| inspector:', inspector);
  if (!interactive) problems.push('workbench free-explore did not enable nodes');

  await p.click('#tab-perm');
  const perm = await p.$eval('#codeBody', (e) => e.textContent.slice(0, 50));
  await p.click('#tab-engine');
  const engine = await p.$eval('#codeBody', (e) => e.textContent.slice(0, 50));
  console.log('code tabs differ:', perm !== engine);
  if (perm === engine) problems.push('code tabs show identical content');

  const back = await p.$eval('.crumb a', (e) => e.getAttribute('href'));
  console.log('crumb back link:', back);
  await p.close();
  await browser.close();

  console.log('\n=== RESULT ===');
  if (problems.length) { console.log('FAIL:\n - ' + problems.join('\n - ')); process.exitCode = 1; }
  else console.log('ALL GREEN');
})().catch((e) => { console.error(e); process.exit(1); });
