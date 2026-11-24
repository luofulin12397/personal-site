const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const puppeteer = require('puppeteer-core');

const publicDir = resolve(__dirname, '../public');
const width = 1200;
const height = 630;
const fontFaces = [
  ['Noto', 700, 'noto-700'],
  ['Azeret', 400, 'azeret'],
].map(([family, weight, file]) => {
  const data = readFileSync(resolve(publicDir, `fonts/${file}.woff2`)).toString('base64');
  return `@font-face { font-family: ${family}; font-weight: ${weight}; src: url(data:font/woff2;base64,${data}) format('woff2'); }`;
}).join('\n');

const cards = {
  home: `<section class="home">
    <h1>罗富麟</h1>
    <p class="subtitle">后端与大模型应用</p>
    <p class="motto">先画边界，再写代码。</p>
  </section>`,
  rag: `<section class="case">
    <h1>RAG 项目拆解</h1>
    <p class="subtitle">权限感知知识库</p>
    <svg viewBox="0 0 1056 150" role="img" aria-label="原查询和假想答案汇入融合与精排，然后鉴权，最后流式回答">
      <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#d2f343"/></marker></defs>
      <g fill="none" stroke="#d2f343" stroke-width="2.5" marker-end="url(#arrow)">
        <path d="M180 40H216V75M180 110H216V75H272"/>
        <path d="M478 75H532"/><path d="M716 75H770"/>
      </g>
      <g fill="#162019" stroke="#526151" stroke-width="2">
        <rect x="1" y="13" width="179" height="54"/><rect x="1" y="83" width="179" height="54"/>
        <rect x="275" y="43" width="203" height="64"/><rect x="773" y="43" width="230" height="64"/>
      </g>
      <rect x="535" y="43" width="181" height="64" fill="#25321c" stroke="#d2f343" stroke-width="2"/>
      <g text-anchor="middle" dominant-baseline="central" font-size="25" font-weight="700" fill="#f8f7ee">
        <text x="90" y="40">原查询</text><text x="90" y="110">假想答案</text>
        <text x="376" y="75">融合与精排</text><text x="625" y="75" fill="#d2f343">鉴权</text><text x="888" y="75">流式回答</text>
      </g>
    </svg>
  </section>`,
};

async function renderCards() {
  const executablePath = process.env.CHROME_PATH;
  if (!executablePath) throw new Error('Set CHROME_PATH to a Chrome or Chromium executable.');
  const browser = await puppeteer.launch({ executablePath, defaultViewport: { width, height } });
  try {
    const page = await browser.newPage();
    for (const [name, content] of Object.entries(cards)) {
      await page.setContent(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>
        ${fontFaces}
        * { box-sizing: border-box; }
        body { margin: 0; height: ${height}px; padding: 54px 72px; background: #0c120e; color: #f8f7ee; font: 700 28px Noto, sans-serif; }
        header, footer { display: flex; justify-content: space-between; color: #adbaaa; font: 400 19px Azeret, monospace; letter-spacing: .09em; }
        header { border-bottom: 1px solid #526151; padding-bottom: 20px; }
        header strong { color: #d2f343; font-weight: 400; }
        footer { position: absolute; bottom: 48px; left: 72px; right: 72px; border-top: 1px solid #526151; padding-top: 19px; }
        h1, p { margin: 0; }
        h1 { line-height: 1.13; }
        .home { margin-top: 59px; }
        .home h1 { font-size: 105px; }
        .subtitle { margin-top: 15px; color: #d2f343; }
        .home .subtitle { font-size: 48px; }
        .motto { margin-top: 30px; color: #adbaaa; }
        .case { margin-top: 37px; }
        .case h1 { font-size: 72px; }
        .case .subtitle { font-size: 32px; }
        svg { display: block; width: 100%; margin-top: 28px; }
      </style><body>
        <header><strong>FULIN LUO</strong><span>${name === 'home' ? '01 / PORTFOLIO' : '02 / PROJECT BREAKDOWN'}</span></header>
        ${content}
        <footer><span>${name === 'home' ? 'RETRIEVAL / ASYNC SYSTEMS' : 'KNOWLEDGE-BASE / QUERY GRAPH'}</span><span>LUOFULIN12397</span></footer>
      </body></html>`);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: resolve(publicDir, `share-${name}.png`) });
    }
  } finally {
    await browser.close();
  }
}

renderCards().catch((error) => { console.error(error); process.exitCode = 1; });
