# 罗富麟 — 个人主页

> **状态（2026-11-16）**：**v3 已推送并部署上线**。React + TypeScript + Vite，两层页面、真终端、系统工作台都已落地；根路径与 `/personal-site/` 子路径两套构建均 `ALL GREEN`。线上 <https://luofulin12397.github.io/personal-site/> 由 GitHub Actions 构建 `dist/` 后发布到 Pages，`main` 分支不再直接当静态站用。`vercel.json` 保留，切 Vercel 仍是可选后续动作。产品立场见 `PRODUCT.md`，视觉理由见 `DESIGN.md`。
>
> 同日追加一轮调整：首页主体重排为「我这个人 → 我做的项目 → 我在写、想分享的」，技术取舍后置；「项目拆解」从一行小链接提升为**站点级一级分支**（顶栏常驻分区切换器 + 首页整块入口 + 二层页头徽标）。参考实现自此只作为视觉与交互零件来源，不再约束信息架构。
>
> **03 文章（2026-11-21 起）**：新增第三分区——目录页 + 文章详情页，数据驱动，现有 1 篇样例。以前「在写、想分享的」只是首页三条纯文本，没有可放的页面。
>
> **长文扩充（2026-11-23）**：把 B 站《本体论实战课·13 集全》讲透成一篇约 3 万字的长文，仍是 `Ontology 不是知识图谱的升级版` 这一篇。文章系统为此加了分组目录、工序清单、折叠练习、表格列宽；顺带把中文字体子集从 782 字扩到 1373 字，修掉长文掉字。详见 `PRODUCT.md` 末节。
>
> **同期合入的远程改动**：首页与 RAG 页的 Open Graph 分享卡片、RAG 工作台节点可分享链接、窄屏「查看详情」、首页首屏的 RAG CTA。这些与 03 文章是本轮两次并行的工作，合并时都保留。

一个需要构建的**三层站点**：讲这个人、拆一个项目、放读和写的东西。交付物是 `dist/`，不再双击 `index.html` 即开。

## 三个分区，都是一级

| | 谁在读 | 讲什么 |
|---|---|---|
| **01 主页** `/` | 从 GitHub profile 点进来的同行，10–60 秒 | 这个人：一段自我介绍、六个做过的项目、在写和想分享的笔记；能敲命令的真终端；四个判断与这一页本身放在后面 |
| **02 项目拆解** `/projects/` | 已经想细看某个项目的人 | 案例目录：RAG 知识库、AI_RISK_HEALTH 医疗风控，以及 WrenAI 查询规划的源码学习案例 |
| **03 文章** `/writing/` | 从某篇文章点进来、想知道这人判断靠不靠谱的人 | 读后判断：原文只作参照，写清哪几句不同意、哪一步还没验；目录页另列排队中的题目 |

顶栏常驻 `01 主页 / 02 项目拆解 / 03 文章` 分区切换器，当前所在分区信号色实心高亮。顶栏的「02 项目拆解」去案例目录；首页首屏「看 RAG 项目拆解」仍直达 RAG，项目列表也可直接进入各自的拆解。≤980px 隐藏页内锚点导航，≤760px 分区切换器独占一行。

首页不放大段架构图，二层不重复自我介绍。这条分层原则是上一轮拍板、v3 明确保留的。

## 结构

```
index.html                      Vite 首页入口（#root + noscript 兜底）
projects/index.html             项目拆解目录入口
projects/rag/index.html         RAG 知识库拆解入口
projects/ai-risk-health/index.html   医疗风控拆解入口
projects/wrenai/index.html      WrenAI 查询规划源码学习案例入口
writing/index.html              Vite 三层入口（目录 / 详情共用，?p=slug 取文章）
src/main.tsx / projects.tsx / case.tsx / risk.tsx / wren.tsx / writing.tsx   各页面的 React 挂载入口
src/pages/Home.tsx / Case.tsx / Writing.tsx / Article.tsx   页面结构
src/components/                 Shell（含分支切换器）/ Terminal / Workbench / CodePanel
src/data/home.ts / rag.ts       首页与二层的全部文案、终端命令、节点、连线、代码片段、证据链接
src/data/risk.ts / wren.ts      医疗风控节点与 WrenAI 实验证据、源码摘录
src/data/writing.ts             文章类型 + registry + 排队题目 + 字数/读时计算
src/data/articles/*.ts          一篇一个文件，blocks 数组描述正文
src/styles/                     tokens.css / shell.css / home.css / case.css / risk.css / wren.css / writing.css
src/lib/site.ts                 站内链接统一经 Vite base 生成，兼容两种部署路径
public/fonts/                   自托管字体（Archivo + Azeret Mono + Noto Sans SC 三个字重）
public/favicon.svg
vite.config.ts                  六个 rollup 输入（MPA）+ VITE_BASE 注入
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

`npm run build` 生成首页、项目目录、三个项目案例和文章目录六个静态 HTML 入口，均带 `noscript` 兜底。

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
| 加一篇新文章 | 在 `src/data/articles/` 新建一个 `.ts`，导出 `Article`，再登记进 `src/data/writing.ts` 的 `ARTICLES`；排队中的题目放 `QUEUE` |
| 增改「学习资源」卡片 | `src/data/writing.ts` 的 `LEARNING_RESOURCES`；目录把它们放在已成篇与排队中之间 |
| 长文分组与目录 | 小节写 `{ t:'h', no, text, group }`，`tocGroups()` 自动生成分组目录；顶栏只放分组锚点 |
| 正文里写代码 / 强调 | 反引号包标识符、`**…**` 加粗；表格、步骤、题面、图注同样支持 |
| 折叠练习、工序清单、表格列宽 | `t:'quiz'` / `t:'steps'` / `table.widths`；渲染规则在 `src/pages/Article.tsx` |
| 文末参照与边界 | `Article.credits` 统一列来源，`boundary` 写清哪些没跑、哪些是厂商口径 |

`SYSTEM_NODES` 是 **9 个视图节点**，合并展示源码里 **12 个真实图节点**（02–03 / 05–06 / 08–09 各占一格），页面 meta 写作 `09 VIEWS / 12 NODES / 03 BRANCHES`。改节点数量时记得同步这行标注。

二层内容沿用 v2 已核验的 GitHub 事实：`self/public/knowledge-base` 里的 `main_graph.py`、`node_perm_filter.py`、`perm_engine.py` 及 C4 文档。C4 仍写「并行三路召回」而源码是「两路并行 + web 兜底」，这处不一致在页面「还没对齐的地方」如实写出，别悄悄抹掉。

## 改视觉

先读 `DESIGN.md`。颜色与字阶都在 `src/styles/tokens.css` 的 `:root`；顶栏 / 页脚 / 分支切换器在 `shell.css`，首页在 `home.css`，二层工作台 / Inspector / 代码面板在 `case.css`。两层共用同一套 token，不要在二层另起色板。

v3 色板：石墨绿黑 `--ground: #0c120e`、暖纸白 `--paper: #f8f7ee`、信号芽绿 `--signal: #d2f343`。直角、细线、等宽标注、硬错位投影；信号色稀缺使用。v2 的「不要渐变文字 / 不要 eyebrow / 不要 CTA」禁令已在 v3 正式废弃，见 `PRODUCT.md` 七项裁决。

没放开的默认约束：任何文字 ≥12px、正文对比度 ≥4.5:1、颜色不作唯一信息载体、键盘可达、尊重 `prefers-reduced-motion`。

首页与 RAG 拆解页各自的 Open Graph 标签在对应的 HTML 入口，封面为 `public/share-home.png` 和 `public/share-rag.png`。改稿后运行 `CHROME_PATH=/path/to/chrome node scripts/share-cards.cjs` 重新生成两张 PNG。分享标签使用公开的 GitHub Pages 绝对地址；换域名时同步更新 `og:url` 与 `og:image`。

## 改字体

**中文用字变了必须重新子集化**，否则新字会掉到系统字体：本机装了同名 Noto Sans SC 时看不出来，换台机器就会混字形。2026-11-23 的 13 集长文引入 591 个新字，就是这样查出来的。

源字体改为系统自带的 `NotoSansSC-VF.ttf`（Noto Sans SC 变量字体，`wght` 100–900；也可从 `notofonts/noto-cjk` 下载）。从变量字体实例化出 400 / 500 / 700 三个真字重再各自子集化，比原来「找齐三个静态 OTF」更可复现。需要 `fonttools` + `brotli`（woff2 压缩用）。

```bash
python - <<'PY'
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
from pathlib import Path

VF = 'C:/Windows/Fonts/NotoSansSC-VF.ttf'
files = [*Path('src').rglob('*.tsx'), *Path('src').rglob('*.ts'), *Path('src').rglob('*.css'),
         Path('index.html'), *Path('projects').rglob('index.html'), Path('writing/index.html')]
chars = set(''.join(p.read_text(encoding='utf-8') for p in files))
chars |= set(chr(c) for c in range(0x20, 0x7f))
text = ''.join(sorted(c for c in chars if c.strip() or c == ' '))
Path('.build/glyphs.txt').write_text(text, encoding='utf-8')

for w in (400, 500, 700):
    f = TTFont(VF)
    instantiateVariableFont(f, {'wght': w}, inplace=True, updateFontNames=True)
    for t in ('fvar', 'STAT', 'avar', 'HVAR', 'VVAR', 'MVAR', 'gvar'):
        if t in f: del f[t]
    f['OS/2'].usWeightClass = w
    opt = subset.Options()
    opt.flavor = 'woff2'
    opt.layout_features = ['*']
    opt.notdef_outline = True
    opt.recommended_glyphs = True
    s = subset.Subsetter(options=opt)
    s.populate(text=text)
    s.subset(f)
    f.save(f'public/fonts/noto-{w}.woff2')
PY
```

当前字集 **1373 字（汉字 1238）**，三个字重覆盖检查均为 `missing=0`。代价是每字重约 429KB（TrueType 轮廓比旧方案的 CFF 大，旧文件 129KB/字重）；换来的是字重真实、来源单一、重跑脚本确定。

**重跑后复查掉字**：用 Chrome DevTools Protocol 的 `CSS.getPlatformFontsForNode` 抓文章正文节点，`isCustomFont: false` 且 family 为 Noto Sans SC 的 `glyphCount` 应全为 0。普通 `document.fonts.check()` 只查字体是否加载，查不出单字缺字形。

拉丁字体只在 ASCII 范围内用，不用动。注意特殊箭头类字符（如 `↳`）源字体可能没有，改用 `→` 或先查 `getBestCmap()`。

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

脚本对 `http://127.0.0.1:4173` 跑四个页面（首页 / 项目拆解 / 文章目录 / 文章详情）、1440px 与 390px 两个视口，检查：横向溢出、<12px 文字、SVG 内文字换算后字号、字体是否加载、七组对比度、断链、控制台报错、代码面板三个 Tab 高度一致性；另跑一组交互测试（终端 `help` / `explain perm` / Tab 公共前缀补全、CTA 跨页跳转、工作台自由探索与 Inspector 联动、代码 Tab 内容切换）。首页依次截 `#top / #about / #work / #notes / #branch / #tradeoffs / #craft`，二层截七个 section，三层截 `.w-head / #list / #queue / #how`，文章详情截 `.art__head / .art__body / .art__src`，输出到 `.shots/`（已 gitignore）。

最近一次结果（2026-11-23，13 集长文扩充 + 中文字体重新子集化后复跑）：四个页面在 `1440/1440` 与 `390/390` 下均无横向溢出，无 <12px 文字，最低对比度 `7.02:1`，代码面板 `560 / 560 / 560`，控制台零报错，`ALL GREEN`。另用 CDP 抽查文章标题 / 导语 / 正文 / 表格与首页正文，系统字体回退字形数全为 0。

上一次结果（2026-11-21，加入 03 文章后）：同样四个页面、`ALL GREEN`。

上一次结果（2026-11-16）：根路径与 `/personal-site/` 子路径两次构建各跑一遍，均为 `ALL GREEN`（子路径下 CTA 跳 `/personal-site/projects/rag/`，返回链接 `/personal-site/`，字体 / favicon / CSS / JS 全部 200）。两层 `1440/1440` 与 `390/390` 无溢出，最低对比度 `7.02:1`，代码面板 `560 / 560 / 560`，控制台零报错。另做了桌面 / 390px 视口截图人工复查：顶栏四段无重叠（brand 48–204 / branches 230–399 / nav 712–1004 / repo 1317–1392），移动端切换器 350×38px 且当前分区高亮正确。

## 部署

**当前线上**：<https://luofulin12397.github.io/personal-site/>，v3，GitHub Pages 托管。

部署链路：push 到 `main` → `.github/workflows/deploy-pages.yml` → `npm ci` → `VITE_BASE=personal-site npm run build` → 上传 `dist/` → `actions/deploy-pages`。Pages 的 Build and deployment 源已通过 API 从 `legacy`（按 main 根目录发布）切成 `GitHub Actions`（`build_type: workflow`）。**这一步必须先于 push**，否则 Pages 会把 Vite 的源码入口 `index.html` 当静态页直接发布，线上白屏。

`/projects/`、`/projects/rag/`、`/projects/ai-risk-health/`、`/projects/wrenai/` 和 `/writing/` 都有独立的 `index.html`，不需要 SPA rewrite。新增案例时，登记对应 Vite HTML 入口，并为 `src/data/home.ts` 的项目设置 `caseHref`，案例目录就会列出它。文章详情继续用 `?p=slug`。

医疗风控案例以医保结算为例，推荐路径按「黑名单检查 → 双轨决策 → 自动拒绝」走完示例，人工审核是另一条分支。窄屏推荐路径给出流程总览并就地展开说明，完整分支在自由探索中分组。`?node=decision` 等链接可分享。工作台后用固定版本源码摘录解释一票否决，并区分模型回退局限与未验证的实际效果。RAG 工作台和已有节点链接不变。

WrenAI 案例固定上游 `48de0b6`，与 RAG、医疗风控共用 `.wrap` 全宽网格与二层 `.branch-badge` 页头：首屏左侧立命题，右侧给出本地 DuckDB 三条合成订单样本，紧接「左三泳道系统剖面（构建 3 节点 / 查询主链 6 节点含规划前后双策略门 / 运行模式 4 节点，共 13 个节点同图可见）+ 右侧函数源码注解 Inspector（含 IN/OUT/BLOCK 边界、带高亮拦截行的真实代码摘录、逐段中文注解与信号色源码条）」工作台，可用 `?view=query&node=policy#view-query` 分享并在 ≤760px 下就地展开完整注解详情。

工作台后依次按全宽双栏展开边界、查询四站与展开 SQL、单变量删模型失败对照（`MODEL_NOT_FOUND` 在连库前拦截，而物理表 3 行仍在）、四个源码设计取舍横行、三条命令实测切换（`?step=query`）与本地一键复现脚本 `public/labs/wren-orders.py`，以及已核实范围与未验证边界；完整 LikeC4 架构图与 Archify 查询调用时序图以原尺寸独立链接供核查。

**切 Vercel（尚未执行）**：`vercel.json` 已指定 `buildCommand: npm run build`、`outputDirectory: dist`。切过去时不传 `VITE_BASE`，回到根 base。仍需单独确认：触发 Vercel 部署并验证两层 URL、关闭或保留 Pages 重定向、把新域名填进 GitHub profile 的 Website 字段。

旧的 Astro 脚手架仍在 `6b47fec` 这条历史里；每次替换都保留历史、普通 commit 推进，没有强推。

## 已知的取舍

- 失去「双击 `index.html` 即开」和「`view-source` 就是作品」。这两条是 v2 的说服力来源，换 v3 视觉与交互复杂度时主动放弃了，理由记在 `DESIGN.md`。
- 参考实现只提供色板与三个交互组件，**页面骨架不再照它**；它本身的单页长滚动与展示叙事不适合「人 + 项目 + 拆解分支」这套结构。
- 内容原则已放宽（不再要求每个数字可核验），但目前页面仍全部沿用 v2 已核验事实，没有主动加入未核数字。
- 中文只覆盖当前用字，加新文案要重新子集化。
- 代码面板固定 `height: 560px` 并内部滚动，短片段下方会留白——换「切换不跳高度」付的代价。
- 窄屏（≤620px）System Map 隐藏 SVG 连线，9 个节点改为双列卡片，最后一个兜底节点跨整行。自由探索时，选中卡片下方有「查看详情」；选择节点或用方向键切换不会跳到详情，只有打开这个链接才会跳转。
- 自由探索时，地址栏的 `?node=perm-filter` 等参数跟随选中节点更新，可直接复制分享。打开节点链接会恢复选择并定位到详情；返回推荐路径时移除 `node` 参数。
- ≤980px 隐藏页面内锚点导航，≤760px 顶栏变两行让分区切换器独占一行；`html` 的 `scroll-padding-top` 在窄屏提到 116px，避免锚点被压住。
- `assets/`、`assets/css/main.css`、`assets/js/app.js`、`.nojekyll` 是 v2 遗留，不参与 v3 构建，保留未删。
- 站内链接不能写死根路径：Pages 在 `/personal-site/` 子路径下，`href="/projects/rag/"` 会跳出站点。所有内部链接经 `site()` 生成，外部 GitHub 链接不受影响。
- `impeccable detect` 的规则按 v3 之前的视觉禁令编写，v3 已正式解禁 eyebrow / 编号 / CTA，因此**不作为验收门槛**，只当提示看。2026-11-23 对文章页跑过一次，剩 6 条：`hard-offset-shadow` 与 `hero-eyebrow-chip` 是 DESIGN.md 明确允许的设计语言，3 条 `wide-tracking` 落在代码块 `figcaption` 的 mono 标注上（被误判为 body text），1 条 `straggler` 是 advisory。
- 文章正文是数据驱动的 `Block[]`，不是 markdown；加内容时只改 `src/data/articles/`。中文用字变了记得重跑「改字体」那一节，否则新字会掉字形。
