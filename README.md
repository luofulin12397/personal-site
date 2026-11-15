# 罗富麟 — 个人主页

一个零依赖、零构建的单页站点。`index.html` 双击就能打开，不上服务器也能看。

它不是"能力清单"，是**取舍清单**：每条都写了放弃什么、代价是什么、什么情况下会失效。这是这个页面的全部立场，改内容时请保住它。

---

## 结构

```
index.html              页面骨架（语义化，无框架）
PRODUCT.md              产品真相：读者是谁、目标是什么、什么不许编
DESIGN.md               视觉系统：色板、字阶、栅格、组件的取值理由
assets/css/main.css     全部样式，token 驱动，无预处理器
assets/js/app.js        终端、代码高亮、批注联动。三个模块互不依赖
assets/fonts/           自托管字体（含子集化的中文字体）
scripts/shoot.js        渲染验收：截图 + 量测
```

字体是 `Archivo`（拉丁）+ `Azeret Mono`（代码）+ `Noto Sans SC`（中文，按页面用字子集化，三个字重）。不引任何 CDN，断网也能正确排版。

## 页面上的五个部分

1. **首屏终端** — 可以真的敲命令。`ls` 列的是真仓库，`open <repo>` 会跳到对应地址。
2. **四个取舍** — 页面主体，`选了 / 没选 / 代价 / 失效` 四段式。四条分别来自知识库、smart-bi、log-patrol 的真实实现。
3. **系统图** — knowledge-base 里那张 LangGraph 查询图的真实形状：12 个节点、两次条件分叉。A–E 是批注，点图或点右边的条目会互相高亮。
4. **代码** — 三个文件来自仓库，是上面取舍的直接后果。
5. **仓库** — 六个能跑的项目，带数出来的规模数字。

## 内容从哪来

全部来自 `github.com/luofulin12397` 的公开仓库。页面上的数字（文件数、行数、测试数）是用 `find` / `wc` / `grep` 数出来的，不是估的。

**加内容时的硬规矩**：任何数字都要能在仓库里对得上，否则不写。性能指标、用户量、客户名一个都不许编——理由写在 `PRODUCT.md`。

## 改内容

大部分内容在 `index.html` 里，直接改文字。需要动 JS 的有三处：

| 想改什么 | 改哪里 |
|---|---|
| 取舍条目 | `index.html` 的 `#tradeoffs`，每条一个 `<li class="trade">` |
| 系统图与批注 | `index.html` 的 `#system`：SVG 在上，`<li class="note" data-ref>` 在下，`data-ref` 必须成对 |
| 仓库列表 | `index.html` 的 `#work`，每条一个 `<li class="proj__item">` |
| 终端能敲的命令 | `assets/js/app.js` 的 `COMMANDS`；仓库短名在 `REPOS` |
| 三段代码 | 同文件的 `SNIPPETS`（key 要和 HTML 里的 `data-lang` 对上） |
| 首屏自动打印什么 | 同文件的 `boot()`，它复用 `COMMANDS` 和 `STACK` |

终端支持：`help` `whoami` `ls` `cat stack.json` `cat tradeoffs.md` `explain <topic>` `open <repo|section>` `clear`，外加 ↑↓ 翻历史、Tab 补全。加新主题只要往 `COMMANDS` 里加 key，再把名字加进 `TOPICS`。

## 改视觉

先看 `DESIGN.md`，那里写了每个取值的原因。所有颜色和尺寸都在 `main.css` 顶部的 `:root` 里，改 token 就能整体换色。

一条硬规矩：**不要加渐变文字**。强调靠字重和字号，不靠渐变。

## 改字体

中文用字变了（新增了字），必须重新子集化，否则新字会掉到系统字体，字形和行高都会不一致：

```bash
# 1. 下载 Noto Sans SC Regular / Medium / Bold 的 OTF 到 .build/
# 2. 抽出页面用到的字（含 JS 里的终端文案）
python - <<'PY'
text = open('index.html', encoding='utf-8').read() + open('assets/js/app.js', encoding='utf-8').read()
chars = set(text) | set(chr(c) for c in range(0x20, 0x7f)) | set('　、。，；：？！“”‘’（）《》—…·／')
open('.build/glyphs.txt', 'w', encoding='utf-8').write(''.join(sorted(c for c in chars if c.strip() or c == ' ')))
PY
# 3. 子集化（三个字重各跑一次）
python -m fontTools.subset .build/NotoSansSC-Regular.otf --text-file=.build/glyphs.txt \
  --flavor=woff2 --output-file=assets/fonts/noto-400.woff2 --layout-features="*" --no-hinting --desubroutinize
```

拉丁字体只在 ASCII 范围内用，不用动。

## 验收

没有测试套件，验收靠实际渲染。需要本机 Chrome + `puppeteer-core`：

```bash
npm i puppeteer-core
node scripts/shoot.js --out .shots
```

它会打印：横向溢出、小于 11px 的文字、SVG 内文字换算后的实际字号、字体是否真的加载、七组对比度、三个代码标签页的面板高度是否一致、控制台报错。截图落在 `--out` 目录。

四个必须过：正文对比度 ≥ 4.5:1、`scrollWidth` 不超过视口、控制台零报错、标签页切换不跳高度。

## 已知的取舍

- **只有浅色**，不跟随系统深色。理由写在 `DESIGN.md` 里；如果常在深夜看，这条会硌到你，可以商量。
- 中文只覆盖页面当前用到的字，加新文案要重新子集化。
- 系统图在 760px 以下直接隐藏，只留批注列表——12 个节点的图缩到手机宽度后字会小于 12px，那比没有更糟。
- 终端里的 `explain` 主题和仓库短名写在 JS 里，加仓库要同时改 `REPOS` 和首屏的 `ls` 文案。
