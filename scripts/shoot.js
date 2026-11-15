/* 渲染验收：截图 + 量测，覆盖首页与项目拆解页两层。
   需要本机 Chrome 与 puppeteer-core。CHROME_PATH 可覆盖浏览器路径。
   用法：node scripts/shoot.js [--out .shots]                                    */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const root = path.resolve(__dirname, '..');
const out = path.resolve(root, process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : '.shots');
const fileUrl = (rel) => 'file:///' + path.join(root, rel).replace(/\\/g, '/');

if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });

const PAGES = [
  {
    key: 'home',
    file: 'index.html',
    wait: 2600,
    sections: [
      ['tradeoffs', '#tradeoffs'],
      ['craft', '#craft'],
      ['work', '#work'],
      ['notes', '#notes'],
    ],
  },
  {
    key: 'case',
    file: 'projects/rag/index.html',
    wait: 700,
    sections: [
      ['boundary', '#boundary'],
      ['pipelines', '#pipelines'],
      ['graph', '#graph'],
      ['code', '#code'],
      ['thinking', '#thinking'],
      ['evidence', '#evidence'],
      ['known', '#known'],
    ],
    tabs: ['graph', 'perm', 'engine'],
  },
];

// 内部 href / src 指向的文件或目录必须真的存在（相对 file:// 与 Pages 子路径都成立）
function brokenLinks(rel) {
  const full = path.join(root, rel);
  const base = path.dirname(full);
  const html = fs.readFileSync(full, 'utf8');
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  return refs.filter((h) => !/^(https?:|#|mailto:|data:)/.test(h)).filter((h) => {
    const target = path.resolve(base, h.split('#')[0]);
    if (!fs.existsSync(target)) return true;
    return fs.statSync(target).isDirectory() && !fs.existsSync(path.join(target, 'index.html'));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--hide-scrollbars', '--allow-file-access-from-files'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const errors = [];
  const report = {};

  for (const cfg of PAGES) {
    const page = await browser.newPage();
    page.on('pageerror', (e) => errors.push(`${cfg.key} pageerror: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`${cfg.key} console: ${m.text()}`); });

    await page.goto(fileUrl(cfg.file), { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    await sleep(cfg.wait);
    await page.mouse.move(1, 1);
    await page.screenshot({ path: path.join(out, `${cfg.key}-hero.png`) });

    report[cfg.key] = await page.evaluate(() => {
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
      // SVG 里的文字按 viewBox 缩放，实际字号另算；这里只看 HTML 文本
      const tiny = [...document.querySelectorAll('body *')].filter((el) => {
        const t = (el.textContent || '').trim();
        if (!t || el.children.length || el.closest('svg')) return false;
        return parseFloat(getComputedStyle(el).fontSize) < 12;
      }).map((el) => el.textContent.trim().slice(0, 24));

      const svg = document.querySelector('.topo');
      const sub = document.querySelector('.node__sub');
      const name = document.querySelector('.node__name');
      const scale = svg ? svg.getBoundingClientRect().width / svg.viewBox.baseVal.width : 0;

      return {
        docOverflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
        undersizedText: tiny,
        svgLabelPx: sub && name ? {
          sub: +(parseFloat(getComputedStyle(sub).fontSize) * scale).toFixed(1),
          name: +(parseFloat(getComputedStyle(name).fontSize) * scale).toFixed(1),
        } : 'not on this page',
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

    report[cfg.key].brokenLinks = brokenLinks(cfg.file);

    for (const [name, sel] of cfg.sections) {
      await page.$eval(sel, (el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await page.mouse.move(1, 1);
      await sleep(350);
      await page.screenshot({ path: path.join(out, `${cfg.key}-${name}.png`) });
    }

    if (cfg.tabs) {
      const heights = [];
      for (const lang of cfg.tabs) {
        await page.click(`.tab[data-lang="${lang}"]`);
        await sleep(180);
        heights.push(await page.evaluate(() => Math.round(document.querySelector('.codepanel').getBoundingClientRect().height)));
      }
      report[cfg.key].codePanelHeights = heights;
    }
    await page.close();
  }

  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
  const mobileOverflow = {};
  for (const cfg of PAGES) {
    await mobile.goto(fileUrl(cfg.file), { waitUntil: 'networkidle0' });
    await mobile.evaluate(() => document.fonts.ready);
    await sleep(cfg.wait);
    await mobile.screenshot({ path: path.join(out, `m-${cfg.key}.png`) });
    mobileOverflow[cfg.key] = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  }

  console.log(JSON.stringify(report, null, 1));
  console.log('mobile overflow:', mobileOverflow);
  console.log('console errors:', errors.length ? errors : 'none');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
