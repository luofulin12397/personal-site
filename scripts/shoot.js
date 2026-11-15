/* 渲染验收：截图 + 量测。需要本机 Chrome 与 puppeteer-core。
   CHROME_PATH 环境变量可覆盖浏览器路径。
   用法：node scripts/shoot.js [--out .shots]                                  */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const root = path.resolve(__dirname, '..');
const out = path.resolve(root, process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : '.shots');
const url = 'file:///' + path.join(root, 'index.html').replace(/\\/g, '/');

if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });

const SECTIONS = [
  ['tradeoffs', '#tradeoffs'],
  ['system', '#system'],
  ['code', '#code'],
  ['work', '#work'],
  ['notes', '#notes'],
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--hide-scrollbars', '--allow-file-access-from-files'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const errors = [];
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 2600));
  await page.mouse.move(1, 1);
  await page.screenshot({ path: path.join(out, 'hero.png') });

  const report = await page.evaluate(() => {
    const lum = (hex) => {
      const n = hex.replace('#', '');
      const v = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
        .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
      return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    };
    const ratio = (a, b) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
      return +((x + 0.05) / (y + 0.05)).toFixed(2);
    };
    // SVG 里的文字按 viewBox 缩放，实际字号另算（见 svgLabelPx），这里只看 HTML 文本
    const tiny = [...document.querySelectorAll('body *')].filter((el) => {
      const t = (el.textContent || '').trim();
      if (!t || el.children.length || el.closest('svg')) return false;
      return parseFloat(getComputedStyle(el).fontSize) < 11;
    }).map((el) => el.textContent.trim().slice(0, 20));

    const svg = document.querySelector('.topo');
    const scale = svg ? svg.getBoundingClientRect().width / svg.viewBox.baseVal.width : 0;
    const svgSubPx = +((parseFloat(getComputedStyle(document.querySelector('.node__sub')).fontSize) * scale)).toFixed(1);

    return {
      docOverflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      undersizedText: tiny,
      svgLabelPx: { sub: svgSubPx, name: +((parseFloat(getComputedStyle(document.querySelector('.node__name')).fontSize) * scale)).toFixed(1) },
      fontsLoaded: document.fonts.check('400 16px "Noto Sans SC"') && document.fonts.check('600 16px Archivo'),
      contrast: {
        'body ink-2': ratio('#3e4349', '#ecedee'),
        'note ink-3': ratio('#63686f', '#ecedee'),
        'accent text': ratio('#7d2c14', '#ecedee'),
        'code comment': ratio('#6a6f76', '#f7f8f8'),
        'term body': ratio('#e7e4db', '#15171a'),
        'term dim': ratio('#9aa1a9', '#15171a'),
        'term faint': ratio('#858d97', '#15171a'),
      },
    };
  });
  console.log(JSON.stringify(report, null, 1));

  for (const [name, sel] of SECTIONS) {
    await page.$eval(sel, (el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.mouse.move(1, 1);
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(out, `${name}.png`) });
  }

  // 三个标签页的面板高度必须一致，否则切换时会跳
  const heights = [];
  for (const lang of ['graph', 'query', 'compose']) {
    await page.click(`.tab[data-lang="${lang}"]`);
    await new Promise((r) => setTimeout(r, 200));
    heights.push(await page.evaluate(() => Math.round(document.querySelector('.codepanel').getBoundingClientRect().height)));
  }
  console.log('code panel heights:', heights, heights.every((h) => h === heights[0]) ? 'equal' : 'JUMP');

  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
  await mobile.goto(url, { waitUntil: 'networkidle0' });
  await mobile.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 2600));
  await mobile.screenshot({ path: path.join(out, 'm-hero.png') });
  console.log('mobile overflow:', await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1));

  console.log('console errors:', errors.length ? errors : 'none');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
