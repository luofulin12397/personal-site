// 二层内容。节点名、边、条件分叉、权限语义都对照过 self/public/knowledge-base 源码。
// 9 个视图节点合并展示 12 个真实图节点（02–03 / 05–06 / 08–09 各占一格）。

import { GH } from './home';

const RAG_BLOB = `${GH}/self/blob/main/public/knowledge-base/ai_rag_knowbase-master`;
export const RAG_ROOT = `${GH}/self/tree/main/public/knowledge-base`;

export const CASE_HERO = {
  crumb: '02 项目拆解 / knowledge-base',
  title: ['一次提问，', '要过几道门。'],
  lede: 'knowledge-base 是带权限的 RAG 知识库。这一页只讲两件事：它怎么分块、怎么连起来，以及为什么偏偏在这几个地方设了门。没有性能数字，因为没用固定评估集测过。',
  meta: '143 个文件 · 12,172 行 · 23 条路由',
};

export const BOUNDARY = {
  a: {
    tag: 'PROCESS A · IMPORT',
    title: '文档导入图',
    text: '7 个节点，从 node_entry 起串到 node_import_milvus：PDF 转 Markdown、图片处理、文本切片、知识单元识别、BGE 向量化，最后写进 Milvus。',
    file: 'app/process/import_/agent/main_graph.py',
  },
  b: {
    tag: 'PROCESS B · QUERY',
    title: '在线问答图',
    text: '12 个节点，入口是 node_query_cache。命中缓存直接 END；未命中才走压缩、主体确认、鉴权、两路召回、融合、精排、四维权限过滤、生成、写缓存。SSE 流式返回。',
    file: 'app/process/query/agent/main_graph.py',
  },
  infra: ['Milvus / 向量', 'MongoDB / 文档与权限', 'Redis / 语义缓存', 'MinIO / 对象存储'],
};

export const IMPORT_STAGES = [
  ['01', '文档接入', 'node_entry'],
  ['02', 'PDF 转 Markdown', 'node_pdf_to_md'],
  ['03', '图片处理', 'node_md_img'],
  ['04', '文本切片', 'node_document_split'],
  ['05', '知识单元识别', 'node_item_name_recognition'],
  ['06', 'BGE 向量化', 'node_bge_embedding'],
  ['07', '写入 Milvus', 'node_import_milvus'],
];

export const QUERY_FLOW = {
  parallelTag: '两路并行，不是三路',
  note: '旁路：node_web_search_mcp 只在「完全没有召回、且未被权限短路」时触发。它没有连到 RRF，不是第三条并行召回路。',
};

/* ------------------------------------------------------------ 工作台节点 */

export type SystemNode = {
  id: string;
  index: string;
  label: string;
  sub: string;
  title: string;
  description: string;
  decisions: string[];
  source: string;
  sourceLabel: string;
  x: number; y: number; w: number; h: number;
};

export type Connection = {
  id: string;
  d: string;
  nodes: string[];
  label?: string;
  labelX?: number;
  labelY?: number;
  labelAnchor?: 'start' | 'middle';
  terminal?: boolean;
};

export const SYSTEM_NODES: SystemNode[] = [
  {
    id: 'query_cache', index: '01', label: 'FAQ + SEMANTIC', sub: '两级缓存读取',
    title: '入口先查缓存，两级',
    description: '人工审核过的 FAQ 优先，语义缓存其次。命中任何一个都直接 END，后面的检索和模型一次都不跑。省的不是毫秒，是整套调用链的钱。',
    decisions: ['FAQ 优先于语义缓存', '缓存命中直接结束查询图', '命中即不进入历史压缩'],
    source: `${RAG_BLOB}/app/process/query/agent/nodes/node_query_cache.py`, sourceLabel: 'node_query_cache.py',
    x: 30, y: 50, w: 160, h: 80,
  },
  {
    id: 'context', index: '02–03', label: 'HISTORY + ITEM', sub: '历史压缩与主体确认',
    title: '判不出来就问回去，不猜',
    description: '缓存未命中后先把多轮对话压成一段，再确认问的是哪份文档。认不准就把问题抛回给用户，不往下走。猜错的代价是拿错文档编答案，比多问一句贵得多。',
    decisions: ['历史压缩先于主体确认', '主体不明直接前置早退', '中间状态沿 QueryGraphState 传递'],
    source: `${RAG_BLOB}/app/process/query/agent/main_graph.py`, sourceLabel: '查看前置节点顺序',
    x: 250, y: 50, w: 160, h: 80,
  },
  {
    id: 'access_control', index: '04', label: 'ACCESS CONTROL', sub: '前置访问控制',
    title: '先完成前置分流，再启动召回',
    description: '访问控制位于两路召回之前。需要前置澄清时直接转向回答输出；满足继续条件时，才同时启动普通向量与 HyDE 检索。',
    decisions: ['前置分流发生在检索之前', '澄清分支不启动并行召回', '继续分支同时启动两路检索'],
    source: `${RAG_BLOB}/app/process/query/agent/nodes/node_access_control.py`, sourceLabel: 'node_access_control.py',
    x: 470, y: 50, w: 160, h: 80,
  },
  {
    id: 'retrieve', index: '05–06', label: 'VECTOR + HyDE', sub: '两路并行向量召回',
    title: '两路召回不是冗余',
    description: '一路拿原问题去查，一路先让模型写个假想答案再拿它去查。两路错的方式不一样，RRF 按排名融合才比单路稳。Web 搜索不是第三条并行召回路。',
    decisions: ['两路检索共享前置访问边界', '两路结果使用独立状态字段', 'Web 搜索不属于并行召回'],
    source: `${RAG_BLOB}/app/process/query/agent/main_graph.py`, sourceLabel: '查看并行检索边',
    x: 690, y: 50, w: 160, h: 80,
  },
  {
    id: 'rank', index: '08–09', label: 'RRF + RERANK', sub: '融合与精排',
    title: '按名次融合，再交给交叉编码器',
    description: '两路召回分别 add_edge 到 node_rrf，按排名融合后严格进入 node_rerank。RRF 只按名次，两路分数量纲不同也不用归一化。',
    decisions: ['RRF 接收两路召回结果', '精排严格位于 RRF 之后', '相关性排序不替代权限过滤'],
    source: `${RAG_BLOB}/app/process/query/agent/nodes/node_rerank.py`, sourceLabel: 'node_rerank.py',
    x: 690, y: 240, w: 160, h: 90,
  },
  {
    id: 'perm_filter', index: '10', label: 'PERMISSION FILTER', sub: '四维权限过滤',
    title: '精排之后鉴权，无权内容不进入 Prompt',
    description: '四维（全局 / 部门 / 角色 / 个人）默认拒绝，只放行的切片进提示词。被拒的请求一律短路，不许走联网兜底，否则换个问法就能从公网拿到无权内容。',
    decisions: ['四维鉴权先于 Prompt 组装', '无权短路绝不进入联网兜底', '正常与短路分支共用回答出口'],
    source: `${RAG_BLOB}/app/process/query/agent/nodes/node_perm_filter.py`, sourceLabel: 'node_perm_filter.py',
    x: 470, y: 240, w: 160, h: 90,
  },
  {
    id: 'answer_output', index: '11', label: 'ANSWER OUTPUT', sub: '流式回答与引用',
    title: '生成与前置短路，共用回答出口',
    description: '正常链路在这里组装有权切片并生成回答；前置澄清和权限短路则复用已有答案。输出同时携带引用与拦截信息，SSE 流式返回。',
    decisions: ['已有答案跳过重复生成', '正常回答只使用有权切片', '引用与拦截信息随回答输出'],
    source: `${RAG_BLOB}/app/process/query/agent/nodes/node_answer_output.py`, sourceLabel: 'node_answer_output.py',
    x: 250, y: 240, w: 160, h: 90,
  },
  {
    id: 'save_cache', index: '12', label: 'SAVE CACHE', sub: '语义缓存写入',
    title: '只缓存生成成功的答案',
    description: '回答输出后进入语义缓存写入节点，再到 END。权限短路的拒绝文案不写进缓存：把「你无权查看」缓存成答案，下一个人问同一句话就会拿到它，而且再也纠不回来。',
    decisions: ['写缓存位于回答输出之后', '缓存命中不重复写入', '拒绝文案不写语义缓存'],
    source: `${RAG_BLOB}/app/process/query/agent/nodes/node_save_cache.py`, sourceLabel: 'node_save_cache.py',
    x: 30, y: 240, w: 160, h: 90,
  },
  {
    id: 'web_search', index: '07', label: 'WEB SEARCH MCP', sub: '完全无召回时联网',
    title: '联网是命中门后的兜底，不是并行捷径',
    description: '只有知识库向量路完全无召回、且没有权限短路时才进入 Web 搜索；完成后仍汇入统一的回答输出节点。它没有连到 RRF。',
    decisions: ['完全无召回才触发联网', '权限拒绝分支禁止联网', '联网结果仍进入统一回答出口'],
    source: `${RAG_BLOB}/app/process/query/agent/nodes/node_web_search_mcp.py`, sourceLabel: 'node_web_search_mcp.py',
    x: 470, y: 400, w: 160, h: 70,
  },
];

export const CONNECTIONS: Connection[] = [
  { id: 'cache-context', d: 'M190 90H250', nodes: ['query_cache', 'context'] },
  { id: 'context-access', d: 'M410 90H470', nodes: ['context', 'access_control'] },
  { id: 'access-retrieve', d: 'M630 90H690', nodes: ['access_control', 'retrieve'] },
  { id: 'retrieve-rank', d: 'M770 130V240', nodes: ['retrieve', 'rank'] },
  { id: 'rank-permission', d: 'M690 285H630', nodes: ['rank', 'perm_filter'] },
  { id: 'permission-answer', d: 'M470 285H410', nodes: ['perm_filter', 'answer_output'] },
  { id: 'answer-save', d: 'M250 285H190', nodes: ['answer_output', 'save_cache'] },
  { id: 'cache-end', d: 'M110 50V30', nodes: ['query_cache'], label: '缓存命中 · END', labelX: 125, labelY: 38, labelAnchor: 'start', terminal: true },
  { id: 'access-answer', d: 'M550 130V170H330V240', nodes: ['access_control', 'answer_output'], label: '主体不明 / 前置短路', labelX: 440, labelY: 158 },
  { id: 'permission-web', d: 'M550 330V400', nodes: ['perm_filter', 'web_search'], label: '完全无召回', labelX: 565, labelY: 370, labelAnchor: 'start' },
  { id: 'web-answer', d: 'M470 435H330V330', nodes: ['web_search', 'answer_output'] },
  { id: 'save-end', d: 'M110 330V370', nodes: ['save_cache'], label: 'END', labelX: 110, labelY: 390, terminal: true },
];

export const GUIDED_PATHS = [
  { id: 'retrieve', label: '检索', title: '双路召回，融合后精排' },
  { id: 'perm_filter', label: '权限', title: '无权内容，不进入 Prompt' },
  { id: 'answer_output', label: '回应', title: '回答与引用一起返回' },
];

/* ------------------------------------------------------------ 图下批注 */

export const ANNOTATIONS = [
  { ref: 'a', title: '入口先查缓存，两级', text: '人工审核过的 FAQ 优先，语义缓存其次。命中任何一个都直接返回，后面的检索和模型一次都不跑。省的不是毫秒，是整套调用链的钱。' },
  { ref: 'b', title: '判不出来就问回去，不猜', text: '认不准用户在问哪份文档时，这一层直接把问题抛回给用户，不往下走。猜错的代价是拿错文档编答案，比多问一句贵得多。' },
  { ref: 'c', title: '两路召回不是冗余', text: '一路拿原问题去查，一路先让模型写个假想答案再拿它去查。两路错的方式不一样，RRF 按排名融合才比单路稳。' },
  { ref: 'd', title: '权限卡在精排之后，denied 不联网', text: '四维（全局 / 部门 / 角色 / 个人）默认拒绝，只放行的切片进提示词。被拒的请求一律短路，不许走联网兜底。' },
  { ref: 'e', title: '只缓存生成成功的答案', text: '权限短路的拒绝文案不写进缓存。把「你无权查看」缓存成答案，下一个人问同一句话就会拿到它，而且再也纠不回来。' },
];

/* ------------------------------------------------------------ 代码片段 */

export type Snippet = { label: string; code: string };

export const SNIPPETS: Record<string, Snippet> = {
  graph: {
    label: 'main_graph.py',
    code: `query_graph_builder.set_entry_point("node_query_cache")

# 缓存命中直接 END，检索和模型一次都不跑
def node_query_cache_after(state: QueryGraphState):
    if state.get("cache_hit"):
        return END
    return "node_history_compress"


def node_access_control_after(state: QueryGraphState):
    # 认不准问的是哪份文档，就把问题抛回去，不猜
    if state.get("answer"):
        return "node_answer_output"
    # web 不是第三条并行召回路，降级为命中门之后的兜底
    return "node_search_embedding", "node_search_embedding_hyde"


query_graph_builder.add_edge("node_search_embedding", "node_rrf")
query_graph_builder.add_edge("node_search_embedding_hyde", "node_rrf")
query_graph_builder.add_edge("node_rrf", "node_rerank")
query_graph_builder.add_edge("node_rerank", "node_perm_filter")`,
  },
  perm: {
    label: 'node_perm_filter.py',
    code: `# 位置：node_rerank 之后、node_answer_output 之前
# 1. 精排切片按四维判定拆成 allowed / denied
# 2. 仅放行切片保留进 reranked_docs，提示词只含有权内容
# 3. 拦截切片写 denied_knowledge_ids 供审计，绝不进提示词
# 4. 全部被拦时短路，跳过 LLM 生成与语义缓存写入

@node_log("node_perm_filter")
def node_perm_filter(state):
    docs = state.get("reranked_docs") or []
    if not docs:
        return state

    user_ctx = {
        "user_id": state.get("user_id", ""),
        "department_id": state.get("department_id", ""),
        "role_ids": state.get("roles", []),
    }

    # file_title 缺失视为数据缺陷：不判定、不进提示词、不计入 denied
    kb_docs, unattributed_docs = [], []
    for d in docs:
        (kb_docs if knowledge_id_of(d.get("file_title", ""))
         else unattributed_docs).append(d)

    if not kb_docs:
        state["reranked_docs"] = []
        return state

    # 无权限记录的知识单元：默认拒绝
    perms_by_kid = permission_repository.list_by_knowledge_ids(...)
    for d in kb_docs:
        (allowed_docs if has_access(user_ctx, perms_by_kid.get(kid))
         else denied_docs).append(d)`,
  },
  engine: {
    label: 'perm_engine.py',
    code: `def normalize_perms(source: dict | None) -> dict:
    """任意历史格式统一归一成四维形状。"""
    if any(k in source for k in _NEW_SHAPE_KEYS):
        return {
            "global": bool(source.get("global", False)),
            "department_ids": list(source.get("department_ids") or []),
            "role_ids": list(source.get("role_ids") or []),
            "user_ids": list(source.get("user_ids") or []),
        }
    # 略：allowed_roles 等旧格式的兼容分支
    return _empty_perms()


def has_access(user_ctx: dict | None, perms: dict | None) -> bool:
    """四维 OR：全局 / 个人 / 部门 / 角色，任一命中即放行；否则默认拒绝。"""
    p = normalize_perms(perms)
    if not user_ctx:
        return False
    if p["global"]:
        return True
    uid = user_ctx.get("user_id")
    if uid and uid in p["user_ids"]:
        return True
    dept = user_ctx.get("department_id")
    if dept and dept in p["department_ids"]:
        return True
    role_ids = user_ctx.get("role_ids") or []
    if role_ids and set(role_ids) & set(p["role_ids"]):
        return True
    return False`,
  },
};

/* ------------------------------------------------------------ 决定与证据 */

export const DECISIONS = [
  {
    no: '01', title: '权限判定收敛成纯函数，并且卡在精排之后',
    text: 'perm_engine.py 在文件头写明自己是「单一权威实现」：不依赖数据库，输入 perms 和 user_ctx，输出一个布尔；配置接口、问答管线、后台任务一律复用，禁止散落第二份判定逻辑。图里把 node_perm_filter 放在 node_rerank 之后、node_answer_output 之前，提示词组装只拿到放行切片。',
    fail: '代价：无权内容也会被检索和精排一遍，算力白花。失效：语料本身不分级、或权限只有单一维度时，这层是纯多余。',
  },
  {
    no: '02', title: 'denied 分支绝不触发联网兜底',
    text: 'node_perm_filter_after 先检查 state["answer"]：权限短路或前置早退已经写了答案，就直接去生成；只有真的既没有 rrf_chunks 也没有 reranked_docs，才返回 node_web_search_mcp。这个顺序不能反，否则无权主题换个问法就能从公网拿到同类信息，四维边界被兜底旁路掉。',
    fail: '代价：短路门和无召回门要一起维护，改一处得看另一处。失效：如果改成开放域助手、允许公网兜底回答任何问题，这条约束就不再成立。',
  },
  {
    no: '03', title: '两路召回加 RRF，web 只做兜底',
    text: '源码把 node_search_embedding 和 node_search_embedding_hyde 分别 add_edge 到 node_rrf，node_access_control_after 的注释也明确写着「web 不再作为第三条并行召回路」。RRF 只按名次融合，两路分数量纲不同也不用归一化。',
    fail: '代价：每次查询多一次 HyDE 的模型调用，而且名次融合扔掉了分数里的置信度。失效：问精确型号、编码、人名时，HyDE 的改写会把原词弄丢。',
  },
];

export const EVIDENCE = [
  { no: '01', title: '查询图与三处条件分叉', path: 'app/process/query/agent/main_graph.py', href: `${RAG_BLOB}/app/process/query/agent/main_graph.py` },
  { no: '02', title: '文档导入的七个节点', path: 'app/process/import_/agent/main_graph.py', href: `${RAG_BLOB}/app/process/import_/agent/main_graph.py` },
  { no: '03', title: '前置权限过滤与短路', path: 'app/process/query/agent/nodes/node_perm_filter.py', href: `${RAG_BLOB}/app/process/query/agent/nodes/node_perm_filter.py` },
  { no: '04', title: '权限判断的纯函数', path: 'app/infra/security/perm_engine.py', href: `${RAG_BLOB}/app/infra/security/perm_engine.py` },
  { no: '05', title: '后端 C4 架构模型', path: 'architecture/model/backend.c4', href: `${GH}/self/blob/main/public/knowledge-base/architecture/model/backend.c4` },
];

export const KNOWN = [
  { title: 'C4 文档落后于实现', text: 'architecture/model/backend.c4 里还写着「并行三路召回」和「三路结果 RRF 融合」，当前源码是两路并行加 web 兜底。本页一切以 main_graph.py 为准。' },
  { title: '代码片段是压缩过的', text: '三个 Tab 按源码删了 import、日志与空行，节点名、顺序和判定条件保持一致，但不是逐字复制。要看原样请点上面的证据链接。' },
  { title: '没有性能数字', text: '检索命中率、引用正确率、端到端延迟都还没用固定评估集测过。所以这一页不写高并发，也不写准确率。' },
];
