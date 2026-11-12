export const site = {
  name: "罗富麟",
  romanName: "Fulin Luo",
  role: "大模型应用与系统工程",
  description: "我写 Text2SQL、Agent 和应用评测，也整理看过的技术分享，记录哪些观点值得拿来试一试。",
};

export const topics = [
  { slug: "text2sql", title: "Text2SQL", description: "从业务问题到可检查的查询计划" },
  { slug: "agent", title: "Agent", description: "工具调用、状态管理和任务恢复" },
  { slug: "evals", title: "推理与评测", description: "模型推理与应用失败分析" },
] as const;

export type TopicSlug = (typeof topics)[number]["slug"];

export const postHref = (slug: string) => `/posts/${slug}/`;
export const topicHref = (slug: TopicSlug) => `/topics/${slug}/`;
