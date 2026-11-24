// 首页内容。文案沿用 v2 已核验事实；只把「这一页本身」改写为 v3 真实情况。
// 顺序原则：先讲这个人，再讲做的项目与想分享的东西，技术取舍与实现细节靠后。

import { CASE_URL } from '../lib/site';

export const GH = 'https://github.com/luofulin12397';

export const HERO = {
  eyebrow: ['RETRIEVAL', '×', 'ASYNC SYSTEMS'],
  title: ['先画边界，', '再写代码。'],
  lede: '我叫罗富麟，写后端，做大模型应用和它底下那层系统。这个站放我做的东西、做的时候怎么想，以及还在写、没写完的笔记。',
  meta: '罗富麟 · 后端 · 检索链路与异步任务',
};

/* ------------------------------------------------------------ 这个人 */

export const ABOUT = {
  kicker: '01 / ABOUT ME',
  title: '我是谁，在这里写什么',
  paras: [
    '我叫罗富麟，写后端。主要做大模型应用和它底下那层系统：检索链路、异步任务、权限边界、向量库怎么接进业务。代码都在 GitHub 上，公开可看。',
    '这里不是简历。我把做过的东西、当时怎么选的、什么情况下会选错，一条条写下来；一个项目的结构、决定和代码片段，单独拆到项目页里，能点回源码核对。写下来是为了逼自己把判断说清楚，也方便别人直接反驳。',
    '想分享的也放这儿：把长教程拆成能跳转的知识库，读源码和调参数的笔记。写完的、没写完的都留着，不装作已经完成。',
  ],
  now: [
    { key: '在做', val: '带权限的 RAG 知识库、自然语言查数、日志巡逻。Python / FastAPI / LangGraph / PostgreSQL / Milvus。' },
    { key: '在写', val: 'AI 全栈笔记 21 章，Milvus 的 HNSW 参数实验，SkillOpt 的技能组织方式。' },
    { key: '在意', val: '边界先于实现，决策要能核对，代码要能被人拆开看。' },
  ],
};

/* ------------------------------------------------------------ 站点第二条分支 */

// 项目拆解不是项目列表里的一行小字，是和 01 主页并列的一层。
export const BRANCH = {
  kicker: 'BRANCH 02 / PROJECT BREAKDOWN',
  eyebrow: '这个站分两处',
  title: '项目拆解',
  desc: '01 主页讲我这个人和做了什么；02 这里只讲一个项目怎么搭：边界在哪、链路怎么走、为什么偏偏在那几个地方设门、代码长什么样。工作台里每个节点都能点开看当时的决定，也能直接跳到源码。',
  meta: 'knowledge-base · 12 节点查询图 · 3 处条件分叉 · 5 条源码证据',
  cta: '看 RAG 项目拆解',
  href: CASE_URL,
  note: '不是项目列表里的一行链接，是和主页并列的另一层',
};

export const FACTS = [
  ['02', '独立服务进程'],
  ['07', '文档导入节点'],
  ['12', '问答编排节点'],
  ['04', '权限控制维度'],
];

export type Tradeoff = {
  tag: string;
  title: string;
  chose: string;
  rejected: string;
  cost: string;
  fails: string;
};

export const TRADEOFFS: Tradeoff[] = [
  {
    tag: '权限 · 知识库',
    title: '权限判定放在精排之后，denied 绝不联网兜底',
    chose: 'rerank → perm_filter → answer。只有放行的切片进提示词；全部被拦就短路出拒绝文案，跳过模型生成和缓存写入。联网兜底只在「向量路完全无召回、且未被权限短路」时触发。',
    rejected: '召回前先按权限过滤（省算力），或者把 web 检索当成第三条并行召回。',
    cost: '无权内容也会被检索和精排一遍，算力白花；两道门（权限短路 / 无召回兜底）要一起维护，改一处得看另一处。',
    fails: '知识库本身不做分级，或权限只有单一维度时，这套是纯多余的 300 行。',
  },
  {
    tag: '查询 · smart-bi',
    title: '不让模型写 SQL，只让它说意图',
    chose: '模型输出 Intent，服务端按白名单指标和枚举维值编译成 QueryPlan。执行侧固定只读事务、固定角色、绝对期限。',
    rejected: '让模型直接生成 SQL 再执行，出了问题再靠提示词约束。',
    cost: '每加一个指标都要写代码和测试，17 个测试文件是这么长出来的。问法超出白名单就只能追问。',
    fails: '探索式分析：用户自己都还没想好切哪个维度时，白名单只会挡住路。',
  },
  {
    tag: '召回 · 知识库',
    title: '两路召回，融合之后再精排',
    chose: '原查询一路、HyDE 假想答案一路，并行跑，进 rrf 按排名融合，再交给交叉编码器精排。',
    rejected: '单路向量召回，靠调大 top_k 补准确率；或者把 web 检索并进来凑第三路。',
    cost: '每次查询多一次 HyDE 的模型调用；融合和精排各多一个调参点，参数之间会互相盖住。',
    fails: '问题里是精确术语（型号、编码、人名）时，HyDE 会把原词改写掉，召回反而变差。',
  },
  {
    tag: '异步 · log-patrol',
    title: '写入口只留一个，用队列把它串起来',
    chose: '文件 spool（pending/ → done/）当队列，常驻宿主一次只拉一个 run，串行跑完后移走。写入边界只有一处。',
    rejected: '并发跑多个 run，靠锁和事务解决冲突。',
    cost: '吞吐被串行按死，积压时延迟线性上涨；单点，宿主挂了就不动了。',
    fails: '单次 run 的耗时接近任务到达间隔时，队列永远追不上，串行成了瓶颈而不是保护。',
  },
];

// v3 里这一页是 React + Vite，不再是零构建。只写这一版真实成立的手艺。
export const CRAFT = [
  { key: '两条分支', val: '顶栏常驻 01 主页 / 02 项目拆解，当前所在分区实心高亮。首页讲人、项目与分享，二层把系统图做成可点的节点；不是同一页里塞两种内容。' },
  { key: '真终端', val: 'help / ls / cat / explain / open / clear 都能跑，↑↓ 翻历史，Tab 补公共前缀。不是装饰，是一个真的命令解析器。' },
  { key: '可核对', val: '节点详情里每条判断都挂一条指向具体源码文件的链接。工作台的 9 个节点、三处条件分叉，对应 knowledge-base 里 12 个真实图节点。' },
  { key: '字体', val: '拉丁用 Archivo 和 Azeret Mono，中文按页面实际用字把 Noto Sans SC 子集成三个字重，全部自托管。断网不掉字形，Windows 与 macOS 断行一致。' },
  { key: '可读性', val: '正文对比度不低于 4.5:1，任何文字不小于 12px，节点选中同时有描边和角点，全部交互可用键盘完成，尊重 prefers-reduced-motion。' },
];

export type Project = {
  name: string;
  href: string;
  lang: string;
  path?: string;
  desc: string;
  facts: string;
  case?: boolean;
};

export const PROJECTS: Project[] = [
  {
    name: 'ai-learning-site', href: `${GH}/ai-learning-site`, lang: 'HTML · JavaScript',
    desc: '把一本 407 页的教程拆成可跳转的静态知识库：四块主线互相引用，公式推导单独成页。零依赖、零构建，push 就到 Pages 和 Vercel。',
    facts: '7 个页面 · 5,024 行手写 HTML/JS/CSS · 21 章 · 双渠道自动发布',
  },
  {
    name: 'knowledge-base', href: `${GH}/self`, lang: 'Python · FastAPI · LangGraph', path: 'self / public/knowledge-base',
    desc: '带权限的 RAG 知识库。查询图十二个节点，双路召回 + RRF + 精排 + 四维权限；导入侧吃 PDF 和网页，切完推进 Milvus。SSE 流式返回，每段耗时都埋了点。',
    facts: '143 个文件 · 12,172 行 · 23 条路由 · Milvus + MongoDB + MinIO + Redis', case: true,
  },
  {
    name: 'smart-bi', href: `${GH}/self`, lang: 'Python · PostgreSQL', path: 'self / public/smart-bi',
    desc: '用自然语言问经营指标。模型只输出意图，服务端按白名单编译查询计划；数据库侧只读事务、固定角色、绝对期限。mypy strict 全绿，测试里有一条专门跑浏览器端到端。',
    facts: '49 个文件 · 6,592 行 · 108 个测试 · 17 个测试文件 · strict mypy',
  },
  {
    name: 'AI_RISK_HEALTH', href: `${GH}/AI_RISK_HEALTH`, lang: 'Python · XGBoost',
    desc: '医疗风控：规则引擎和 XGBoost 双轨打分，四条决策流水线复用电商风控的抽象，业务层整套重写成医保结算、处方审核、挂号、药品代购四个场景。',
    facts: '92 个文件 · 17,607 行 · 25 维特征 · 19 条规则 · 40 个测试文件',
  },
  {
    name: 'log-patrol', href: `${GH}/self`, lang: 'Node · 无框架', path: 'self / public/log-patrol',
    desc: '让模型定时巡逻日志并出结论。文件 spool 当队列，常驻宿主串行派发，单次运行是独立子进程；模型 provider 可换，DeepSeek 和 ZAI 各接了一个。',
    facts: 'spool 队列 · 单写入边界 · 可换 provider · 自带 selftest',
  },
  {
    name: 'personal-site', href: `${GH}/personal-site`, lang: 'Astro · TypeScript',
    desc: '这个主页旁边那条正经的博客线：Markdown 进内容集合，出 RSS、主题页和精选位。发布规则写成了会跑的测试，不是一句「记得改 draft」。',
    facts: 'Astro 6 · 内容集合 · RSS · 发布规则有测试',
  },
];

export const NOTES = [
  { title: 'AI 全栈笔记', text: '21 章已经落到静态站上，还在补推导链和交叉引用。写得慢，因为每章都要先在本地跑一遍。' },
  { title: 'HNSW 参数实验', text: 'Docker 里跑 Milvus 2.6 和 MinIO，调 M 与 efConstruction，看召回率和内存怎么互相挤。数据还没攒够，不敢下结论。' },
  { title: '读 SkillOpt 的源码', text: '看它怎么组织技能、怎么决定一次工具调用该不该发生。还没形成结论。' },
];

/* ------------------------------------------------------------ 真终端数据 */

export const STACK = [
  '{',
  '  "lang":  ["Python", "TypeScript"],',
  '  "api":   ["FastAPI", "LangGraph"],',
  '  "db":    ["PostgreSQL", "psycopg3"],',
  '  "vec":   ["Milvus", "MongoDB"],',
  '  "infra": ["Docker", "MinIO", "Redis"],',
  '  "check": ["mypy strict", "pytest"]',
  '}',
];

export const REPOS: Record<string, string> = {
  'ai-learning-site': `${GH}/ai-learning-site`,
  'knowledge-base': `${GH}/self/tree/main/public/knowledge-base`,
  'smart-bi': `${GH}/self/tree/main/public/smart-bi`,
  'log-patrol': `${GH}/self/tree/main/public/log-patrol`,
  'risk-engine': `${GH}/AI_RISK_HEALTH`,
};

export const TOPICS = ['perm', 'hyde', 'rrf', 'plan', 'milvus'];

export const COMMANDS: Record<string, () => string[]> = {
  help: () => [
    '可用命令：',
    '  whoami                我是谁',
    '  ls                    看看有哪些仓库',
    '  cat stack.json        技术栈',
    '  cat tradeoffs.md      四个取舍的摘要',
    '  explain <topic>       perm / hyde / rrf / plan / milvus',
    '  open <repo>           打开仓库，如 open knowledge-base',
    '  open about            跳到「我是谁」',
    '  open case             进入 02 项目拆解',
    '  clear                 清屏',
    '',
    '上下键翻历史，Tab 补全。',
  ],
  whoami: () => ['罗富麟 — 后端。检索链路、异步任务、静态站。'],
  ls: () => ['ai-learning-site/  knowledge-base/  smart-bi/  risk-engine/  log-patrol/  personal-site/'],
  'cat stack.json': () => STACK,
  'cat tradeoffs.md': () => [
    '# 四个取舍', '',
    '权限  精排之后判权限，denied 绝不联网兜底。代价：无权内容也被检索一遍。',
    '查询  模型只出意图，SQL 由服务端编译。代价：加指标要改代码。',
    '召回  原查询 + HyDE 两路，RRF 再精排。代价：多一次模型调用。',
    '异步  spool 队列 + 单写入边界，串行派发。代价：吞吐被按死。', '',
    '每条的失效条件都写在下面，往下翻就是全文。',
  ],
  perm: () => [
    'perm · 四维权限（knowledge-base）', '',
    '全局 / 部门 / 角色 / 个人，四者取或，默认拒绝。判定点在精排之后、',
    '提示词组装之前：只有放行的切片才会进上下文。', '',
    '关键不变量：denied 分支绝不触发联网兜底。否则用户换个问法，',
    '就能从公网拿到本该无权的内容，权限边界等于没设。', '',
    '什么时候别用：语料本身不分级时，这层只是给每次请求加两次查询。',
  ],
  hyde: () => [
    'hyde · 假想答案召回（knowledge-base）', '',
    '先让模型写一段「答案大概长这样」，再用这段去检索。',
    '短问题的向量离文档很远，假想答案的向量反而更靠近。', '',
    '它和原查询并行跑，两路结果进 RRF 融合。不是替代，是补充。', '',
    '什么时候别用：问题里带精确型号、编码、人名时，改写会把原词弄丢，召回更差。',
  ],
  rrf: () => [
    'rrf · 按排名融合', '',
    '不看两路各自的分数，只看名次：score = Σ 1 / (k + rank)。',
    '好处是两路分数量纲不同也不用归一化，谁在前谁贡献大。', '',
    '代价：扔掉了分数里的置信度信息。真需要置信度时，得回到加权融合。',
  ],
  plan: () => [
    'plan · 服务端编译查询计划（smart-bi）', '',
    '模型只输出 Intent：要哪个指标、切哪些维、时间范围。',
    '服务端拿白名单指标表和枚举维值校验，编译成带参数的 QueryPlan。', '',
    '执行侧固定只读事务、固定角色、绝对期限，statement_timeout 和 lock_timeout 都设。',
    '模型碰不到 SQL，所以注入和慢查询这两个问题在这一层就不存在了。', '',
    '什么时候别用：探索式分析。白名单覆盖不了「随便看看」这种需求。',
  ],
  milvus: () => [
    'milvus · 向量检索（knowledge-base）', '',
    'BGE-M3 出向量，HNSW 建索引。M 决定每层出度，efConstruction 决定建索引时搜多深。',
    'M 调大召回更好、内存按 M 线性涨；efConstruction 只影响构建时间，不影响查询延迟。',
    '这两个参数经常被当成一回事。', '',
    '什么时候别用：语料小、过滤条件重的时候，pgvector 或 BM25 混排更省。',
  ],
};

export const SCROLL_TARGETS: Record<string, string> = {
  about: '#about', branch: '#branch', tradeoffs: '#tradeoffs',
  craft: '#craft', work: '#work', notes: '#notes',
};
