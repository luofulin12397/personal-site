---
name: 罗富麟 · 个人站
description: 可拆解的系统——工程作品是一台能打开、追踪、核对的机器
colors:
  signal: "#d2f343"
  signal-dim: "#a6c235"
  signal-ink: "#0c120e"
  ground: "#0c120e"
  surface: "#131c16"
  surface-2: "#18231b"
  surface-3: "#1e2f22"
  line: "#2c3a2f"
  line-2: "#3a4b3d"
  wire: "#546654"
  paper: "#f8f7ee"
  paper-2: "#edecdf"
  muted: "#b7bdb1"
  muted-2: "#98a093"
typography:
  display:
    fontFamily: "Archivo, Noto Sans SC, sans-serif"
    fontSize: "clamp(46px, 4.5vw, 68px)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Archivo, Noto Sans SC, sans-serif"
    fontSize: "clamp(30px, 3.4vw, 46px)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.028em"
  title:
    fontFamily: "Archivo, Noto Sans SC, sans-serif"
    fontSize: "clamp(26px, 2.5vw, 34px)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Archivo, Noto Sans SC, sans-serif"
    fontSize: "15px"
    lineHeight: 1.8
  label:
    fontFamily: "Azeret Mono, Noto Sans SC, monospace"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.14em"
rounded:
  none: "0px"
spacing:
  pad: "clamp(20px, 3.4vw, 48px)"
  section: "clamp(58px, 7vw, 96px)"
  head-gap: "44px"
  maxw: "1520px"
components:
  button-primary:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.signal-ink}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "48px"
  branch-current:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.signal-ink}"
    rounded: "{rounded.none}"
  terminal:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
---

# Design System: 罗富麟 · 个人站

> 本文件只写现在成立的视觉与版式规则，值以 `src/styles/tokens.css` 为准。被替换的 v2「图纸与批注」及各轮理由见 [`docs/history.md`](docs/history.md)。改值之前先读理由；不同意理由再改值。

## Overview

**北极星：仪器面板。** 页面是一台可以打开的机器：系统结构本身是主要视觉内容，访客随时知道正在看哪个节点、为什么重要、证据在哪。

- 深色为主：带绿意的石墨近黑做地面，暖纸白做文字，不用纯黑纯白。
- **信号芽绿是唯一强调色**，语义是「运行状态」：当前分区、选中节点、活动连线、主动作。可以铺满按钮或选中节点，但不铺背景、不染大段正文、同屏不出现多个竞争按钮。
- 两种声音：黑体解释「为什么」，等宽指出「在哪里、什么状态、第几节」。一句长文里不混字体角色。
- 编号是坐标，不是装饰：`01 / BOUNDARY` 表示阅读顺序。

三个分区共用一套 token 与组件，模式不同：01 主页偏 Experience（人先出现），02 项目拆解是 Operate（扫读、点选、核对），03 文章是 Read（沉浸长读）。

## Colors

### Primary
- **信号芽绿 Signal** (`#d2f343`)：当前分区底、主 CTA、选中节点、活动连线、终端提示符。上面的文字一律用 `signal-ink`。
- **暗信号 Signal Dim** (`#a6c235`)：失效条件、次级强调文字。

### Neutral
- **石墨地面 Ground** (`#0c120e`)：页面底。
- **抬起面 Surface 1–3** (`#131c16` / `#18231b` / `#1e2f22`)：卡片、终端、节点底；层级靠相邻色阶，不靠阴影。
- **细线 Line / Line 2** (`#2c3a2f` / `#3a4b3d`)：分隔线与边框；`line-2` 不得当文字色（约 2:1）。
- **连线 Wire** (`#546654`)：图形连线的默认态。
- **纸白 Paper / Paper 2** (`#f8f7ee` / `#edecdf`)：标题与正文。
- **弱文字 Muted / Muted 2** (`#b7bdb1` / `#98a093`)：说明、注脚、元信息。最低实测对比度 7.02:1。

### Named Rules
- **信号稀缺**：一屏内信号色实心块 ≤ 2 处（顶栏当前分区 + 至多一个主 CTA 或一个选中节点）。
- **改色先算对比度**：正文 4.5:1 是底线，不是目标。

## Typography

| 角色 | 用途 | 值 |
|---|---|---|
| Display | 每页只一处：首屏命题 / 分区标题 | `clamp(46px, 4.5vw, 68px)` / 700 / 1.04 |
| Headline | 案例页头、分支入口大标题 | `clamp(30px, 3.4vw, 46px)` / 700 / 1.15 |
| Title (h2) | 区块标题 | `clamp(26px, 2.5vw, 34px)` / 700 / 1.25 |
| h3 | 条目标题、节点名 | 18–25px / 600–700 |
| Body | 正文 | 15px / 1.8；长文正文 16–17px / 1.9 |
| Label | `kicker` / `eyebrow` / 编号 / 文件路径 | Azeret Mono 12px，字距 0.08–0.16em，大写 |

- **任何文字 ≥ 12px**，含 SVG（按缩放后的渲染尺寸算）与代码注释。
- 行内 `code` 用 `0.92em`，在 13px 说明文字里仍 ≥ 12px。
- 段落行宽：导语与说明 ≤ 62ch，正文段落 ≤ 68ch；中文长文正文列 660px（约 40 字）。
- 等宽字体只用于代码、命令、编号、路径；不拿等宽给中文小标签制造「技术感」。
- 代码注释用颜色区分，**不用斜体**（中文会被合成倾斜）。

## Layout

### 一套外框
- 全站只有一个外框：`.wrap`，`max-width: 1520px`，左右内距 `clamp(20px, 3.4vw, 48px)`。
- 区块之间：`.section` 顶部细线 + `clamp(58px, 7vw, 96px)` 上间距；区块标题组到内容 44px。
- **容器不收窄，只有文字收窄**：01 与 02 的所有区块铺满 `.wrap`，行宽限制只加在段落元素上。禁止把整节锁成居中窄列（如 `max-width: 76ch` 的孤岛）。
- 例外只有一个：**03 文章详情**用 1064px 居中版心，内分 660px 正文 + 340px 右栏（目录）。文章目录页仍用 `.wrap`。

### 区块的三种骨架
每个区块必须选其一，不另造：

| 骨架 | 列 | 用于 |
|---|---|---|
| **A 标签横行** | 左列固定（140–260px）放名字 / 编号 / 标签，右列放内容；行间 `border-bottom` | 项目、取舍、证据、文章条目、「这一页」 |
| **B 双栏对照** | `1.1–1.25fr : 0.75–0.9fr` 两栏 | 首屏命题 + 导语、终端 + 说明、关于我（段落 + 现状）、System Map + Inspector |
| **C 整块** | 单个跨满全宽的面板，2px 信号色顶线 | 工作台、分区入口；每页至多一个 |

区块标题组（`kicker` + h2 + 导语）放在区块左上，不居中。

### 断点（统一为四档）
| 断点 | 变化 |
|---|---|
| ≤ 1100px | 三栏或更多改两栏；B 骨架比例收窄 |
| ≤ 980px | 隐藏页内锚点导航；B 骨架改单栏；工作台改单栏、详情就地展开 |
| ≤ 760px | 顶栏两行，分区切换器独占一行；A 骨架左列缩到 120px 或上下堆叠；`scroll-padding-top: 124px` |
| ≤ 480px | 全部单列；System Map 节点双列；触摸目标 ≥ 44px |

现有样式里还散落着 1080 / 1000 / 900 / 860 / 620px 等断点，后续改到对应的四档之一（见 ADR 0002「迁移」）。

## Elevation & Depth

整体是平面 + 细线 + 相邻色阶。只允许一种抬起手段：**硬错位投影**（无模糊），信号色低透明度。

| 用于 | 值 |
|---|---|
| 主 CTA | `4px 4px 0 rgba(210,243,67,.2)`，悬停 `4px 7px` |
| 品牌方标、选中节点 | `3–4px` 同色系 |
| 终端、边界卡焦点、工作台底座 | `5px 5px 0 rgba(210,243,67,.14–.18)` |

不用柔和浮层阴影、不发光、不用渐变或网格底。

## Shapes

- 全站直角，`border-radius: 0`。
- 边框 1px `line` 为主；强调用 2px（工作台顶线、选中节点描边）。
- 选中态 = 颜色 + 描边或角标，至少两种线索。

## Components

**顶栏（Masthead）**：左品牌方标 + 中文名；分区切换器 `01 主页 / 02 项目拆解 / 03 文章` 常驻，当前分区信号色实心；中间是页内锚点；右侧 GitHub 外链。

**主 CTA（`.primary-action`）**：信号色实心、直角、48px 高、错位投影。每屏最多一个。

**文字链接（`.text-action`）**：纸白文字 + 底部细线，悬停变信号色。次要入口一律用它。

**整行入口**：带实心小标签（如 `BRANCH 02`）的整行描边条，悬停描边变信号色。用于项目条目通往拆解页。

**事实条（`.facts`）**：四格等宽编号数字，上下细线。只放与所在分区相关的数字。

**取舍条目**：A 骨架；左列编号 + 分类，右列标题 + `选了 / 没选 / 代价 / 失效` 定义列表。用 `dl` 是因为语义就是字段 → 值。

**真终端**：首页唯一可输入的深色面板，提亮一档（`surface-2`），信号芽绿提示符与光标。命令：`help / whoami / ls / cat / explain / open / clear`，↑↓ 历史，Tab 补全。

**工作台（`.workbench`）**：C 骨架，2px 信号色顶线。桌面「左 System Map + 右 Evidence Inspector」；Inspector 底部是信号色源码证据条。多条真实路径在同一张图里分泳道，不用 tab 隐藏。选中节点写进 `?node=` 便于分享。240ms 短切换。

**System Map 节点**：直角小面板，左上编号，英文技术名 + 中文解释两级；正交折线，默认低对比、活动路径信号绿。

**源码注解（Inspector）**：`IN / OUT / BLOCK` 边界 → 高亮关键行的源码摘录（可键盘聚焦滚动）→ 逐段中文注解 → 固定提交行段链接。

**代码面板**：多标签切换时最小高度按最长一段定，切换不跳。

**文章正文**：`Block[]` 渲染；小节、列表、对照表、判断块、口径备注、代码块、工序清单、折叠练习；表格可吃满正文列，段落保持行宽上限。

**动效**：只有短促状态切换（≤ 240ms）和首屏终端打字。无入场动画、无滚动触发；减少动效偏好下全部跳过。

## Do's and Don'ts

**Do**
- 先选 A / B / C 骨架再排内容；同页的区块共享同一条左边界。
- 让编号表示顺序，让信号色表示状态。
- 高纵横比的静态架构导出图以原尺寸外链，主视图用字号可控的原生节点图。
- 每次改版跑 `scripts/shoot.cjs`，看 1440 与 390 两个视口的截图。

**Don't**
- 不把整节容器缩成窄列；不在 01 / 02 使用文章版心。
- 不用卡片网格排等价条目（项目、取舍、证据都是横行）。
- 不在同一屏放两个信号色主按钮；不让信号色铺背景或染正文。
- 不出现 < 12px 的文字；不用斜体中文；不用柔和阴影、发光、渐变。
- 不为填满版面放大字号或空框——信息不够就收窄网格或合并区块。
