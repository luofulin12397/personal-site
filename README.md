# 罗富麟 — 个人主页

> **状态（2026-11-16）**：**v3 已推送并部署上线**。React + TypeScript + Vite，两层页面、真终端、系统工作台都已落地；根路径与 `/personal-site/` 子路径两套构建均 `ALL GREEN`。线上 <https://luofulin12397.github.io/personal-site/> 由 GitHub Actions 构建 `dist/` 后发布到 Pages，`main` 分支不再直接当静态站用。`vercel.json` 保留，切 Vercel 仍是可选后续动作。产品立场见 `PRODUCT.md`，视觉理由见 `DESIGN.md`。
>
> 同日追加一轮调整：首页主体重排为「我这个人 → 我做的项目 → 我在写、想分享的」，技术取舍后置；「项目拆解」从一行小链接提升为**站点级一级分支**（顶栏常驻分区切换器 + 首页整块入口 + 二层页头徽标）。参考实现自此只作为视觉与交互零件来源，不再约束信息架构。

一个需要构建的**两层站点**：第一层讲这个人，第二层讲一个项目。交付物是 `dist/`，不再双击 `index.html` 即开。

## 两条主线，都是一级

| | 谁在读 | 讲什么 |
|---|---|---|
| **01 主页** `/` | 从 GitHub profile 点进来的同行，10–60 秒 | 这个人：一段自我介绍、六个做过的项目、在写和想分享的笔记；能敲命令的真终端；四个判断与这一页本身放在后面 |
| **02 项目拆解** `/projects/rag/` | 已经想细看某个项目的人 | 这个项目：边界、导入 / 查询链路、System Map + Inspector、代码、设计决定、能回到源码的证据链接 |

顶栏常驻 `01 主页 / 02 项目拆解` 分区切换器，当前所在分区信号色实心高亮；≤980px 隐藏页面内锚点导航，≤760px 顶栏变两行、切换器独占一行始终可见。**分层不是把第二层藏起来**——首页首屏在自我介绍后、终端前提供「看 RAG 项目拆解」入口，正文保留整块分支入口。二层页头明确写「这个站的第二条主线，与 01 主页并列」。

首页不放大段架构图，二层不重复自我介绍。这条分层原则是上一轮拍板、v3 明确保留的。

## 结构

```
index.html                      Vite 首页入口（#root + noscript 兜底）
projects/rag/index.html         Vite 二层入口（#root + noscript 兜底）
src/main.tsx / src/case.tsx     两层各自的 React 挂载入口
src/pages/Home.tsx / Case.tsx  页面结构
src/components/                 Shell（含分支切换器）/ Terminal / Workbench / CodePanel
src/data/home.ts / rag.ts       全部文案、终端命令、节点、连线、代码片段、证据链接
src/styles/                     tokens.css / shell.css / home.css / case.css
src/lib/site.ts                 站内链接统一经 Vite base 生成，兼容两种部署路径
public/fonts/                   自托管字体（Archivo + Azeret Mono + Noto Sans SC 三个字重）
public/favicon.svg
vite.config.ts                  两个 rollup 输入（MPA）+ VITE_BASE 注入
.github/workflows/deploy-pages.yml   npm ci → build → 上传 dist → deploy Pages
vercel.json                     Vercel 配置（备用，暂未启用）
scripts/shoot.cjs               渲染验收脚本
assets/ · .nojekyll             v2 遗留文件，不参与 v3 构建，保留未删
dist/                           构建产物（已 gitignore）
```

字体不引 CDN，断网也能正确排版。样式是原生 CSS，不引 Tailwind。

## 本地跑起来

```bash
npm install
npm run dev                 # 开发服务器
npm run build               # tsc --noEmit && vite build → dist/
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

`npm run build` 会产出 `dist/index.html` 与 `dist/projects/rag/index.html` 两个入口。两个 HTML 都带 `noscript` 静态兜底，JS 没加载时不会只剩空壳。

**部署路径**：默认 `base: '/'`，对应 Vercel / 自定义域名。GitHub Pages 项目站在 `/personal-site/` 下，构建时传 `VITE_BASE=personal-site`（不带斜杠，避免 Git Bash 的 MSYS 把 `/xxx/` 当绝对路径转换）；`vite.config.ts` 补成 `/personal-site/`。站内链接一律走 `src/lib/site.ts` 的 `site()`，不要在组件里写死 `/projects/rag/`。

## 改内容

文案与数据全部集中在 `src/data/`，组件里不写死句子。首页 section 顺序是**关于我 → 项目 → 在写 → 分支入口 → 取舍 → 这一页本身**，改动时别把技术内容又挪回前面。

| 想改什么 | 改哪里 |
|---|---|
| 首屏标题 / 第一人称导语 | `src/data/home.ts` 的 `HERO` |
| 自我介绍、在做 / 在写 / 在意 | `src/data/home.ts` 的 `ABOUT` |
| 第二条分支的名称、说明、CTA、入口文案 | `src/data/home.ts` 的 `BRANCH`；顶栏分区项在 `src/components/Shell.tsx` 的 `BRANCHES` |
| 项目列表、在写的笔记、四个取舍、这一页本身 | `src/data/home.ts` 的 `PROJECTS` / `NOTES` / `TRADEOFFS` / `CRAFT` |
| 终端命令与输出、补全候选 | `src/data/home.ts` 的 `COMMANDS` / `REPOS` / `TOPICS` / `STACK` / `SCROLL_TARGETS`，解析逻辑在 `src/components/Terminal.tsx` 的 `resolve()` |
| 二层边界、链路、决定、证据、已知未对齐 | `src/data/rag.ts` 的 `BOUNDARY` / `IMPORT_STAGES` / `DECISIONS` / `EVIDENCE` / `KNOWN` |
| System Map 节点与连线 | `src/data/rag.ts` 的 `SYSTEM_NODES` / `CONNECTIONS`；坐标是 900×500 画布，`Workbench.tsx` 里换算成百分比 |
| 三段代码与语法高亮 | `src/data/rag.ts` 的 `SNIPPETS`，分词在 `src/components/CodePanel.tsx` |

`SYSTEM_NODES` 是 **9 个视图节点**，合并展示源码里 **12 个真实图节点**（02–03 / 05–06 / 08–09 各占一格），页面 meta 写作 `09 VIEWS / 12 NODES / 03 BRANCHES`。改节点数量时记得同步这行标注。

二层内容沿用 v2 已核验的 GitHub 事实：`self/public/knowledge-base` 里的 `main_graph.py`、`node_perm_filter.py`、`perm_engine.py` 及 C4 文档。C4 仍写「并行三路召回」而源码是「两路并行 + web 兜底」，这处不一致在页面「还没对齐的地方」如实写出，别悄悄抹掉。

## 改视觉

先读 `DESIGN.md`。颜色与字阶都在 `src/styles/tokens.css` 的 `:root`；顶栏 / 页脚 / 分支切换器在 `shell.css`，首页在 `home.css`，二层工作台 / Inspector / 代码面板在 `case.css`。两层共用同一套 token，不要在二层另起色板。

v3 色板：石墨绿黑 `--ground: #0c120e`、暖纸白 `--paper: #f8f7ee`、信号芽绿 `--signal: #d2f343`。直角、细线、等宽标注、硬错位投影；信号色稀缺使用。v2 的「不要渐变文字 / 不要 eyebrow / 不要 CTA」禁令已在 v3 正式废弃，见 `PRODUCT.md` 七项裁决。

没放开的默认约束：任何文字 ≥12px、正文对比度 ≥4.5:1、颜色不作唯一信息载体、键盘可达、尊重 `prefers-reduced-motion`。

## 改字体

中文用字变了必须重新子集化，否则新字会掉到系统字体：

```bash
# 1. Noto Sans SC Regular / Medium / Bold 的 OTF 放到 .build/
#    来源：notofonts/noto-cjk 的 Sans/SubsetOTF/SC/
# 2. 从组件、数据与两个 HTML 入口抽字（代码注释里的中文也一起算，无害）
python - <<'PY'
from pathlib import Path
files = [*Path('src').rglob('*.tsx'), *Path('src').rglob('*.ts'),
         Path('index.html'), Path('projects/rag/index.html')]
text = ''.join(p.read_text(encoding='utf-8') for p in files)
chars = set(text) | set(chr(c) for c in range(0x20, 0x7f))
Path('.build/glyphs.txt').write_text(
    ''.join(sorted(c for c in chars if c.strip() or c == ' ')), encoding='utf-8')
PY
# 3. 三个字重各跑一次
python -m fontTools.subset .build/NotoSansSC-Regular.otf --text-file=.build/glyphs.txt \
  --flavor=woff2 --output-file=public/fonts/noto-400.woff2 --layout-features="*" --no-hinting --desubroutinize
#    Medium → noto-500.woff2，Bold → noto-700.woff2
```

当前字集 782 字（其中汉字 668），三个字重覆盖检查均为 `missing=none`。拉丁字体只在 ASCII 范围内用，不用动。注意特殊箭头类字符（如 `↳`）源字体可能没有，改用 `→` 或先查 `getBestCmap()`。

## 验收

先起 preview 服务（另开一个终端），再跑脚本。需要本机 Chrome + `puppeteer-core`，路径可用 `CHROME_PATH` 覆盖：

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
node scripts/shoot.cjs --out .shots      # 或 npm run shoot -- --out .shots

# Pages 子路径：构建、预览、验收三处都要带对应 base
VITE_BASE=personal-site npm run build
VITE_BASE=personal-site npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
SHOOT_PREFIX=personal-site node scripts/shoot.cjs --out .shots-pages
```

脚本对 `http://127.0.0.1:4173` 跑两层、1440px 与 390px 两个视口，检查：横向溢出、<12px 文字、SVG 内文字换算后字号、字体是否加载、七组对比度、断链、控制台报错、代码面板三个 Tab 高度一致性；另跑一组交互测试（终端 `help` / `explain perm` / Tab 公共前缀补全、CTA 跨页跳转、工作台自由探索与 Inspector 联动、代码 Tab 内容切换）。首页依次截 `#top / #about / #work / #notes / #branch / #tradeoffs / #craft`，二层截七个 section，输出到 `.shots/`（已 gitignore）。

最近一次结果（2026-11-16）：根路径与 `/personal-site/` 子路径两次构建各跑一遍，均为 `ALL GREEN`（子路径下 CTA 跳 `/personal-site/projects/rag/`，返回链接 `/personal-site/`，字体 / favicon / CSS / JS 全部 200）。两层 `1440/1440` 与 `390/390` 无溢出，最低对比度 `7.02:1`，代码面板 `560 / 560 / 560`，控制台零报错。另做了桌面 / 390px 视口截图人工复查：顶栏四段无重叠（brand 48–204 / branches 230–399 / nav 712–1004 / repo 1317–1392），移动端切换器 350×38px 且当前分区高亮正确。

## 部署

**当前线上**：<https://luofulin12397.github.io/personal-site/>，v3，GitHub Pages 托管。

部署链路：push 到 `main` → `.github/workflows/deploy-pages.yml` → `npm ci` → `VITE_BASE=personal-site npm run build` → 上传 `dist/` → `actions/deploy-pages`。Pages 的 Build and deployment 源已通过 API 从 `legacy`（按 main 根目录发布）切成 `GitHub Actions`（`build_type: workflow`）。**这一步必须先于 push**，否则 Pages 会把 Vite 的源码入口 `index.html` 当静态页直接发布，线上白屏。

两个真实 URL：`/personal-site/` 与 `/personal-site/projects/rag/`。`dist/projects/rag/index.html` 是真实目录，不需要 SPA rewrite。

**切 Vercel（尚未执行）**：`vercel.json` 已指定 `buildCommand: npm run build`、`outputDirectory: dist`。切过去时不传 `VITE_BASE`，回到根 base。仍需单独确认：触发 Vercel 部署并验证两层 URL、关闭或保留 Pages 重定向、把新域名填进 GitHub profile 的 Website 字段。

旧的 Astro 脚手架仍在 `6b47fec` 这条历史里；每次替换都保留历史、普通 commit 推进，没有强推。

## 已知的取舍

- 失去「双击 `index.html` 即开」和「`view-source` 就是作品」。这两条是 v2 的说服力来源，换 v3 视觉与交互复杂度时主动放弃了，理由记在 `DESIGN.md`。
- 参考实现只提供色板与三个交互组件，**页面骨架不再照它**；它本身的单页长滚动与展示叙事不适合「人 + 项目 + 拆解分支」这套结构。
- 内容原则已放宽（不再要求每个数字可核验），但目前页面仍全部沿用 v2 已核验事实，没有主动加入未核数字。
- 中文只覆盖当前用字，加新文案要重新子集化。
- 代码面板固定 `height: 560px` 并内部滚动，短片段下方会留白——换「切换不跳高度」付的代价。
- 窄屏（≤620px）System Map 隐藏 SVG 连线，9 个绝对定位节点降级成双列流程卡片，最后一个兜底节点跨整行；方向键按方位导航只在桌面宽屏有意义。
- ≤980px 隐藏页面内锚点导航，≤760px 顶栏变两行让分区切换器独占一行；`html` 的 `scroll-padding-top` 在窄屏提到 116px，避免锚点被压住。
- `assets/`、`assets/css/main.css`、`assets/js/app.js`、`.nojekyll` 是 v2 遗留，不参与 v3 构建，保留未删。
- 站内链接不能写死根路径：Pages 在 `/personal-site/` 子路径下，`href="/projects/rag/"` 会跳出站点。所有内部链接经 `site()` 生成，外部 GitHub 链接不受影响。
- `impeccable detect` 未在 v3 组件源码上重跑：v3 已正式废弃 eyebrow / 编号 / CTA 等视觉禁令，那套模板指纹规则不再是验收门槛。
