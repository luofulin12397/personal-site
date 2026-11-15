# 罗富麟 — 个人主页

一个零依赖、零构建的**两层**静态站。`index.html` 双击就能开，不上服务器也能看。

它不是能力清单，是**取舍清单**：每条都写了放弃什么、代价是什么、什么情况下会失效。改内容时请保住这条。

---

## 两层，各管一件事

| | 谁在读 | 讲什么 |
|---|---|---|
| 第一层 `index.html` | 从 GitHub profile 点进来的同行，10–60 秒 | 这个人：能敲命令的终端、四个判断、这一页本身怎么做的、有哪些仓库、在写什么 |
| 第二层 `projects/rag/index.html` | 已经想细看某个项目的人 | 这个项目：边界、两条链路、12 节点查询图、三个决定、代码、能回到源码的证据链接 |

首页不放大段架构图，二层不重复自我介绍。项目目录里的「看架构拆解」是第一层通向第二层的入口，终端里敲 `open case` 也能跳。

## 结构

```
index.html                    第一层：个人主页
projects/rag/index.html       第二层：knowledge-base 架构拆解
assets/css/main.css           两层共用的视觉系统
assets/css/case.css           第二层独有的组件
assets/js/app.js              终端、代码高亮、批注联动；两层共用，缺哪块跳过哪块
assets/fonts/                 自托管字体（含子集化的中文三个字重）
PRODUCT.md / DESIGN.md        产品真相与视觉取值理由
scripts/shoot.js              渲染验收：两层截图 + 量测
```

字体是 Archivo（拉丁）+ Azeret Mono（代码）+ Noto Sans SC（中文，按两层页面与终端文案的用字子集化）。不引 CDN，断网也能正确排版。

## 内容从哪来

全部来自 `github.com/luofulin12397` 的公开仓库。页面上的数字（文件数、行数、测试数）是用 `find` / `wc` / `grep` 数出来的，不是估的。第二层的节点名、边、条件分叉、权限判定，逐条对照过 `self/public/knowledge-base` 里的 `main_graph.py`、`node_perm_filter.py`、`perm_engine.py`。

**硬规矩**：任何数字都要能在仓库里对得上，否则不写。性能指标、用户量、客户名一个都不许编，理由写在 `PRODUCT.md`。第二层五条证据链接都核过文件真实存在；C4 文档与当前实现对不上这件事，页面里也如实写出来了。

## 改内容

| 想改什么 | 改哪里 |
|---|---|
| 首页取舍条目 | `index.html` 的 `#tradeoffs`，每条一个 `<li class="trade">` |
| 「这一页本身」 | `index.html` 的 `#craft`，每条一个 `<li class="craft__item">` |
| 仓库列表与二层入口 | `index.html` 的 `#work` |
| 二层边界 / 链路 / 决定 / 证据 | `projects/rag/index.html` 对应 section |
| 12 节点查询图与批注 | 二层 `#graph`：SVG 在上、`<li class="note" data-ref>` 在下，`data-ref` 必须成对 |
| 终端命令 | `assets/js/app.js` 的 `COMMANDS`；仓库短名在 `REPOS`；`open case` 指向二层 |
| 三段代码 | 同文件 `SNIPPETS`（key 要和 HTML 的 `data-lang` 对上），现在只放 knowledge-base 的三个真实文件 |
| 首屏自动打印 | 同文件 `boot()` |

终端支持：`help` `whoami` `ls` `cat stack.json` `cat tradeoffs.md` `explain <topic>` `open <repo|section|case>` `clear`，↑↓ 翻历史、Tab 补公共前缀。

## 改视觉

先看 `DESIGN.md`。所有颜色和尺寸在 `main.css` 的 `:root`；第二层组件在 `case.css`。两层共用同一套 token，不要在二层另起色板。

一条硬规矩：**不要加渐变文字**。强调靠字重和字号。

## 改字体

中文用字变了必须重新子集化，否则新字会掉到系统字体：

```bash
# 1. Noto Sans SC Regular / Medium / Bold 的 OTF 放到 .build/
#    来源：notofonts/noto-cjk 的 Sans/SubsetOTF/SC/
# 2. 抽出两层页面 + JS 用到的字
python - <<'PY'
from pathlib import Path
files = ['index.html', 'projects/rag/index.html', 'assets/js/app.js']
text = ''.join(Path(f).read_text(encoding='utf-8') for f in files)
chars = set(text) | set(chr(c) for c in range(0x20, 0x7f))
Path('.build/glyphs.txt').write_text(''.join(sorted(c for c in chars if c.strip() or c == ' ')), encoding='utf-8')
PY
# 3. 三个字重各跑一次
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

一次跑两层，打印：横向溢出、小于 12px 的文字、SVG 内文字换算后的实际字号、字体是否加载、七组对比度、三个代码标签页的面板高度是否一致、内部链接是否断、控制台报错；并输出桌面与 390px 移动端截图。

必须全过：正文对比度 ≥ 4.5:1、`scrollWidth` 不超过视口、控制台零报错、标签页切换不跳高度、内部链接无断链。

## 部署

线上地址：<https://luofulin12397.github.io/personal-site/>

- 第二层：<https://luofulin12397.github.io/personal-site/projects/rag/>
- 仓库 `github.com/luofulin12397/personal-site`，`main` 分支根目录开 Pages；`.nojekyll` 跳过 Jekyll。
- 改完 `git add -A && git commit -m "..." && git push origin main`，约几十秒生效，无构建步骤。
- 内部资源与互链都用相对路径（含显式 `index.html`），Pages 子路径和本地 `file://` 双击都成立。
- 旧的 Astro 脚手架仍在 `6b47fec` 这条历史里。

## 已知的取舍

- **URL 带 `/personal-site/` 子路径**，因为仓库名就是这个。想要根域名得把仓库改成同名，属对外改动，没擅自做。
- 只有浅色，不跟随系统深色。理由在 `DESIGN.md`。
- 中文只覆盖两层页面当前用到的字，加新文案要重新子集化。
- 12 节点 SVG 在 760px 以下隐藏，只留批注；但第二层用纯 CSS 画的链路阶段图在手机上仍可见，所以窄屏不是「没有图」。
- 代码面板按最长片段设了固定下限，短片段下方会留白。这是换「切换不跳高度」付的代价。
