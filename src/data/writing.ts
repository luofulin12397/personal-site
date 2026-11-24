import { ontologyNotAnUpgrade } from './articles/ontology-not-an-upgrade';

/* =========================================================================
   03 文章 · 数据层
   一篇一个文件，在这里登记。新增文章 = 加一个数据文件 + 一行 import。
   正文用 block 数组描述，不引 markdown 解析器：类型可查、样式可控、
   也不需要为了一篇文章多装一个依赖。
   ========================================================================= */

export type Tone = '' | 'c' | 'k' | 's';

/** 一个编号步骤。head 是动作名，body 是这一步要做出来的东西。 */
export type Step = { head: string; body: string };

export type Block =
  | { t: 'p'; text: string }
  /** group 只用于右栏目录分组，不给正文增加层级 */
  | { t: 'h'; no: string; text: string; group?: string }
  | { t: 'list'; items: string[] }
  /** widths 是各列百分比；不给就按列数平均。列数不同的表用这个对齐，别靠 CSS 猜 nth-child。 */
  | { t: 'table'; head: string[]; rows: string[][]; note?: string; widths?: number[] }
  | { t: 'judge'; no: string; title: string; body: string }
  | { t: 'note'; label: string; text: string }
  | { t: 'steps'; label?: string; items: Step[] }
  | { t: 'quiz'; q: string; hint?: string; answer: string }
  | { t: 'code'; label?: string; lines: Array<[Tone, string]> };

export type Source = { title: string; author: string; href: string };

export type Article = {
  slug: string;
  kicker: string;
  title: string;
  lede: string;
  date: string;
  status: 'finished' | 'wip';
  tags: string[];
  source?: Source;
  /** 文末统一致谢：正文不逐条标出处，参照过的材料在这里一次列清。 */
  credits?: Source[];
  /** 整篇只留一句：读者关页面前能记住的那句。放右栏底部。 */
  takeaway?: string;
  boundary: string;
  blocks: Block[];
};

const ALL: Article[] = [ontologyNotAnUpgrade];

export const ARTICLES: Article[] = [...ALL].sort((a, b) => (a.date < b.date ? 1 : -1));

export function findArticle(slug: string | null): Article | undefined {
  if (!slug) return undefined;
  return ARTICLES.find((a) => a.slug === slug);
}

/** 右栏目录：按 h 上的 group 顺序分组，没写 group 的归到「正文」。 */
export type TocGroup = { name: string; items: Array<{ no: string; text: string }> };

export function tocGroups(a: Article): TocGroup[] {
  const out: TocGroup[] = [];
  for (const b of a.blocks) {
    if (b.t !== 'h') continue;
    const name = b.group ?? '正文';
    let g = out.find((x) => x.name === name);
    if (!g) { g = { name, items: [] }; out.push(g); }
    g.items.push({ no: b.no, text: b.text });
  }
  return out;
}

const AI_LEARNING_URL = 'https://ai-learning-site-beta.vercel.app/';

export const LEARNING_RESOURCES = [
  {
    title: 'AI 全栈知识地图',
    kind: '交互式学习站',
    description: '基于左元《大语言模型、强化学习和多模态教程》整理。21 章串起大语言模型、强化学习、对齐和多模态；第一次读，建议从 60 行 microGPT 开始。',
    primary: { label: '打开学习站', href: AI_LEARNING_URL },
    secondary: { label: '从 microGPT 开始', href: `${AI_LEARNING_URL}llm.html#microgpt` },
  },
  {
    title: 'RAG 源码学习路线',
    kind: '四周源码学习计划',
    description: '以 FastGPT 为主线、RAGFlow 为对照，按 24 项任务读源码、做实验。进度和笔记保存在当前浏览器，也可以导出为 Markdown。',
    primary: { label: '打开学习路线', href: 'https://rag-source-learning-roadmap.vercel.app/' },
    secondary: { label: '查看 GitHub 源码', href: 'https://github.com/luofulin12397/rag-source-learning-roadmap' },
  },
];

/* 排队中：真实存在、还没成篇的题目。不写成链接，避免给出打不开的地址。 */
export const QUEUE: Array<{ title: string; note: string }> = [
  { title: 'MCP 给的不是能力，是检索接口', note: '拿一个内容站点的 MCP 做了实测：只读工具、分区权限、限流藏在 HTTP 200 里。测完了，还没写成篇。' },
  { title: 'Milvus HNSW：M 和 efConstruction 怎么互相挤', note: 'Docker 里跑 2.6，看召回率和内存之间的取舍。数据还在攒，不下结论。' },
  { title: '读 SkillOpt：技能是怎么被组织的', note: '看它怎么描述一个技能、怎么决定一次工具调用该不该发生。还没形成结论。' },
];

/* ---------------------------------------------------------------- 计算 */

export function plainText(a: Article): string {
  return a.blocks
    .map((b) => {
      if (b.t === 'p' || b.t === 'h') return b.text;
      if (b.t === 'list') return b.items.join('');
      if (b.t === 'judge') return b.title + b.body;
      if (b.t === 'note') return b.label + b.text;
      if (b.t === 'table') return b.head.join('') + b.rows.flat().join('') + (b.note ?? '');
      if (b.t === 'steps') return (b.label ?? '') + b.items.map((s) => s.head + s.body).join('');
      if (b.t === 'quiz') return b.q + (b.hint ?? '') + b.answer;
      return b.lines.map(([, s]) => s).join('');
    })
    .join('');
}

export function charCount(a: Article): number {
  return plainText(a).replace(/[\s`]/g, '').length;
}

/** 中文按 400 字/分钟估，向上取整，最少 1 分钟。 */
export function readingMinutes(a: Article): number {
  return Math.max(1, Math.ceil(charCount(a) / 400));
}

export function formatDate(d: string): string {
  return d.replace(/-/g, '.');
}

export const STATUS_LABEL: Record<Article['status'], string> = {
  finished: '已完稿',
  wip: '在写',
};
