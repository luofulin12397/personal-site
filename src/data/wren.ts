const COMMIT = '48de0b6cbd02cbbe3753f29e37f4be24e8a9a7fd';
const WREN_REPO = 'https://github.com/Canner/WrenAI';
export const WREN_COMMIT = `${WREN_REPO}/tree/${COMMIT}`;
const SOURCE = `${WREN_REPO}/blob/${COMMIT}`;
const ENGINE = `${SOURCE}/core/wren/src/wren/engine.py`;

export const WREN_SOURCE = {
  model: `${SOURCE}/examples/v5-jaffle/models/orders/ref_sql.sql#L1`,
  cli: `${SOURCE}/core/wren/src/wren/cli.py#L481-L607`,
  context: `${SOURCE}/core/wren/src/wren/context_cli.py#L862-L936`,
  validate: `${SOURCE}/core/wren/src/wren/context_cli.py#L671-L940`,
  plan: `${ENGINE}#L238-L284`,
  policy: `${ENGINE}#L119-L160`,
  postPolicy: `${ENGINE}#L270-L284`,
  policyText: `${SOURCE}/core/wren/src/wren/policy.py#L380-L382`,
  rewriter: `${SOURCE}/core/wren/src/wren/mdl/cte_rewriter.py#L1148-L1166`,
  rewriterHead: `${SOURCE}/core/wren/src/wren/mdl/cte_rewriter.py#L1-L12`,
  profile: `${SOURCE}/core/wren/src/wren/profile.py#L226-L291`,
  memory: `${SOURCE}/core/wren/src/wren/memory/cli.py#L176-L280`,
  duckdbExec: `${SOURCE}/core/wren/src/wren/connector/duckdb.py#L80-L103`,
  duckdb: `${SOURCE}/core/wren/src/wren/connector/duckdb.py#L104-L116`,
  governed: `${SOURCE}/core/wren/src/wren/governed_query.py#L250-L322`,
  governedHead: `${SOURCE}/core/wren/src/wren/governed_query.py#L1-L32`,
  contextLoader: `${SOURCE}/core/wren-context-loader/src/lib.rs#L1-L58`,
};

export const WREN_VIEWS = [
  {
    id: 'build',
    no: '01',
    label: '构建离线产物',
    labelEn: 'BUILD / OFFLINE MDL',
    hint: '源文件经本地校验编译为 target/mdl.json；这一步不打开数据库连接。',
    defaultNode: 'manifest',
  },
  {
    id: 'query',
    no: '02',
    label: '查询主链路',
    labelEn: 'QUERY / POLICY & REWRITE',
    hint: '虚线为可选上下文；实线依次经过只读策略门、CTE 重写与目标连接器。',
    defaultNode: 'policy',
  },
  {
    id: 'runtime',
    no: '03',
    label: '运行配置与三条命令',
    labelEn: 'RUNTIME / INDEPENDENT MODES',
    hint: '并列配置与三个独立命令，按验证深度划分，不是同一次查询的手工串行步骤。',
    defaultNode: 'query',
  },
] as const;

export type WrenView = (typeof WREN_VIEWS)[number]['id'];

export const WREN_GUIDED = [
  {
    id: 'manifest',
    no: '01',
    label: '模型编译',
    title: '业务定义编译进 manifest，不混入连接凭据',
  },
  {
    id: 'policy',
    no: '02',
    label: '策略门拦截',
    title: '连库前核对模型清单，缺失直接拒绝',
  },
  {
    id: 'rewrite',
    no: '03',
    label: 'CTE 展开与执行',
    title: '逻辑模型 orders 重写为物理表查询',
  },
] as const;

export type WrenNode = {
  id: string;
  view: WrenView;
  index: string;
  title: string;
  tag: string;
  detail: string;
  proves: string;
  limits: string;
  href: string;
  sourceLabel: string;
  optional?: boolean;
  gate?: boolean;
};

export const WREN_NODES: WrenNode[] = [
  {
    id: 'source',
    view: 'build',
    index: '01',
    title: '项目源文件',
    tag: 'MDL SOURCES',
    detail: 'wren_project.yml、models、views、relationships、cubes 与 knowledge 是版本化源文件；模型既可引用 SQL 文件，也可内联定义。',
    proves: '业务表映射和字段口径能作为 Git 文件审阅，而不是藏在提示词里。',
    limits: '源文件不直接进入查询引擎，必须先编译成 manifest。',
    href: WREN_SOURCE.model,
    sourceLabel: 'examples/v5-jaffle/models/orders/ref_sql.sql',
  },
  {
    id: 'compile',
    view: 'build',
    index: '02',
    title: '校验并编译 MDL',
    tag: 'CONTEXT VALIDATE / BUILD',
    detail: 'context validate 做结构与本地语义检查；context build 默认阻断硬错误并产出引擎所需的 JSON 清单，两者通过条件不同。',
    proves: '命令行无需连接真实数据库，即可提前拦住模型结构错误。',
    limits: 'build 成功不等于语义校验全过，也不证明目标库存在对应物理表。',
    href: WREN_SOURCE.validate,
    sourceLabel: 'core/wren/src/wren/context_cli.py#L671-L940',
  },
  {
    id: 'manifest',
    view: 'build',
    index: '03',
    title: 'target/mdl.json',
    tag: 'COMPILED MANIFEST',
    detail: '编译生成的 manifest 汇总模型、关系、视图与度量，供 WrenEngine 加载；数据库连接 profile 独立存放，不写进该文件。',
    proves: '同一份编译产物可跨本地实验库与不同运行环境复用。',
    limits: 'manifest 不包含数据库账号权限，也不是物理表结构的实时快照。',
    href: WREN_SOURCE.context,
    sourceLabel: 'core/wren/src/wren/context_cli.py#L862-L936',
  },
  {
    id: 'context',
    view: 'query',
    index: '04',
    title: 'Skills / Memory',
    tag: 'OPTIONAL CONTEXT',
    detail: 'Skills 描述工作流，Memory 负责召回业务规则与已确认问句；本页实验直接传入逻辑 SQL，未经过这两层。',
    proves: '上层 Agent 能在生成 SQL 前按需检索上下文。',
    limits: '属于可选辅助检索层，不能替代 MDL，也不是 CLI 查询的必经节点。',
    href: WREN_SOURCE.memory,
    sourceLabel: 'core/wren/src/wren/memory/cli.py#L176-L280',
    optional: true,
  },
  {
    id: 'sql',
    view: 'query',
    index: '05',
    title: '输入逻辑模型 SQL',
    tag: 'LOGICAL SQL INPUT',
    detail: '调用方提交只引用 orders 模型的分组计数查询，语句里不出现 fixture.public.raw_orders 这个库表全名。',
    proves: '上游调用面只需面向稳定的逻辑模型名与公开列。',
    limits: '大模型能否从自然语言写对这句逻辑 SQL，不在本次实测范围。',
    href: WREN_SOURCE.cli,
    sourceLabel: 'core/wren/src/wren/cli.py#L481-L607',
  },
  {
    id: 'policy',
    view: 'query',
    index: '06',
    title: '只读策略门',
    tag: 'SQL_POLICY_CHECK · GATE',
    detail: '显式 --read-only 入口先拒绝写操作与带库/目录前缀的表引用，再核对引用表是否已在 manifest 定义；缺失时直接报 MODEL_NOT_FOUND。',
    proves: '即使物理表仍在数据库里，未建模的表引用也会在连库前被拦截。',
    limits: '本结论仅针对显式开启的只读模式，不代表所有入口默认启用同等约束。',
    href: WREN_SOURCE.policy,
    sourceLabel: 'core/wren/src/wren/engine.py#L119-L160',
    gate: true,
  },
  {
    id: 'rewrite',
    view: 'query',
    index: '07',
    title: '裁剪 manifest 并重写',
    tag: 'CTEREWRITER + RUST CORE',
    detail: '_plan() 先按本次查询引用的表裁剪 manifest，再通过 CTERewriter 与 PyO3 Rust SessionContext 展开 WITH orders AS (...)，最后复检生成 SQL。',
    proves: 'dry-plan 输出清晰展示逻辑模型如何映射到底层物理表读取。',
    limits: '纯内存改写完成，不代表目标数据库一定接受该方言语法或具备权限。',
    href: WREN_SOURCE.plan,
    sourceLabel: 'core/wren/src/wren/engine.py#L238-L284',
  },
  {
    id: 'connector',
    view: 'query',
    index: '08',
    title: '连接器执行与返回',
    tag: 'DUCKDB CONNECTOR',
    detail: '引擎在真正需要校验或取数时才获取连接器，把展开后的方言 SQL 交给 DuckDB 执行，并以 Arrow 表把计数结果带回 Python。',
    proves: '规划产出的 SQL 通过了真实数据库的解析、读表与聚合计数。',
    limits: '数据库能算出数字，不代表 COUNT(*) 已经排除了取消单等业务口径问题。',
    href: WREN_SOURCE.duckdbExec,
    sourceLabel: 'core/wren/src/wren/connector/duckdb.py#L80-L103',
  },
  {
    id: 'profile',
    view: 'runtime',
    index: '09',
    title: '连接 profile',
    tag: 'CONNECTION PROFILE',
    detail: 'profiles.yml 管理数据源类型与连接参数；指定 profile 不存在时直接报错退出，不会静默回退到其他数据库。',
    proves: '模型产物与运行环境配置解耦，切换环境有显式边界。',
    limits: 'profile 只负责连到哪个库，不能替代数据库自身的只读账号与行级权限。',
    href: WREN_SOURCE.profile,
    sourceLabel: 'core/wren/src/wren/profile.py#L226-L291',
  },
  {
    id: 'dry-plan',
    view: 'runtime',
    index: '10',
    title: 'wren dry-plan',
    tag: 'LOCAL PLAN ONLY',
    detail: '仅运行解析、策略检查与 CTE 重写，向标准输出打印展开后的目标方言 SQL，全程不读取连接器。',
    proves: '可在无数据库环境下审阅模型展开逻辑与字段映射。',
    limits: '不连库，无法发现物理表缺失、列类型冲突或账号无权限。',
    href: WREN_SOURCE.plan,
    sourceLabel: 'core/wren/src/wren/engine.py#L238-L284',
  },
  {
    id: 'dry-run',
    view: 'runtime',
    index: '11',
    title: 'wren dry-run',
    tag: 'CONNECTOR LIMIT 0',
    detail: '完成规划后连接 DuckDB，用 SELECT * FROM (...) LIMIT 0 包装执行校验，确认物理表和语法合法但不拉取数据行。',
    proves: '目标数据库能解析展开后的 SQL，且引用的物理表与列真实存在。',
    limits: '不扫描全量数据行，不验证聚合结果，也不能排除运行期算术错误。',
    href: WREN_SOURCE.duckdb,
    sourceLabel: 'core/wren/src/wren/connector/duckdb.py#L104-L116',
  },
  {
    id: 'query',
    view: 'runtime',
    index: '12',
    title: 'wren query --read-only',
    tag: 'READ-ONLY EXECUTION',
    detail: '走完规划前策略门、CTE 展开、规划后复检与连接器执行，返回 101 两单、202 一单的真实聚合记录。',
    proves: '从逻辑 SQL 到物理表聚合的显式只读闭环在本地可复现。',
    limits: '只覆盖直接 CLI 入口，不代表 governed stdio、Agent Service 或 MCP 的运行特征。',
    href: WREN_SOURCE.cli,
    sourceLabel: 'core/wren/src/wren/cli.py#L481-L607',
  },
];

export const INPUT_SQL = `SELECT customer_id, COUNT(*) AS order_count
FROM orders
GROUP BY customer_id
ORDER BY customer_id`;

// Recorded DuckDB dry-plan output, with whitespace added for reading.
export const EXPANDED_SQL = `WITH orders AS (
  SELECT "wren_src_orders".customer_id AS customer_id
  FROM (
    SELECT orders.customer_id FROM (
      SELECT __source.customer_id AS customer_id
      FROM (
        SELECT id, customer_id, amount
        FROM fixture.public.raw_orders
      ) AS __source
    ) AS orders
  ) AS "wren_src_orders"
)
SELECT customer_id, COUNT(*) AS order_count
FROM orders
GROUP BY customer_id
ORDER BY customer_id`;

export const WREN_STEPS = [
  {
    command: 'dry-plan',
    summary: '本地展开 CTE',
    output: EXPANDED_SQL,
    proves: '本地规划成功，把逻辑模型 orders 展开成指向 fixture.public.raw_orders 的 CTE。',
    limits: '全程没连 DuckDB，不能证明物理表存在，也不能证明数据库接受这条 SQL。',
  },
  {
    command: 'dry-run',
    summary: 'LIMIT 0 校验',
    output: 'OK',
    proves: 'DuckDB 连接器对展开后的 SQL 提交了 LIMIT 0 包装查询，表结构与语法校验通过。',
    limits: '没有返回数据行，不能证明完整聚合执行无误，也看不到两位客户的计数结果。',
  },
  {
    command: 'query --read-only',
    summary: '只读查回结果',
    output: '{"customer_id": 101, "order_count": 2}\n{"customer_id": 202, "order_count": 1}',
    proves: '显式只读入口走完策略检查、重写与 DuckDB 执行，准确取回两位客户的订单数。',
    limits: '能算出数字不代表业务口径完整，例如取消单要不要计入仍取决于模型自身定义。',
  },
] as const;

export const MANIFEST_DIFF = `- "models": [ { "name": "orders", "tableReference": { "table": "raw_orders", ... } } ]
+ "models": []`;

export const TABLE_CHECK = `SELECT COUNT(*) FROM public.raw_orders;
-- 返回: 3（物理表与三笔合成订单原封未动）`;

export const MODEL_REMOVED = `Error: [MODEL_NOT_FOUND] Table 'orders' is not defined in the MDL manifest. In strict mode, all table references must correspond to MDL models. phase=SQL_POLICY_CHECK`;

// Selected lines from _plan(); the marker represents omitted error handling.
export const PLAN_EXCERPT = `extractor = get_manifest_extractor(self.manifest_str)
manifest = extractor.extract_by(tables)
effective_manifest = to_json_base64(manifest)

# … 省略异常处理与会话创建 …
rewriter = CTERewriter(
    effective_manifest, session, self.data_source,
    fallback=self._fallback,
)
dialect_sql = rewriter.rewrite(sql)
validate_planned_sql(dialect_sql, dialect)
return dialect_sql`;

export const WREN_DECISIONS = [
  {
    no: '01',
    tag: 'MDL vs PROFILE',
    title: '把可移植业务模型和数据库连接拆成两份输入',
    text: '模型、关系和度量编译进 target/mdl.json，数据库地址与凭据留在 profile。同一套语义定义可以在本地 DuckDB 与其他环境间复用，不会把测试库路径硬编码进业务资产。',
    fail: '失效条件：切换 profile 时若目标库物理表结构已漂移，或误把 profile 当成数据库行级权限隔离，离线构建不会报错，问题会在 dry-run 或执行期才暴露。',
    href: WREN_SOURCE.profile,
    sourceLabel: 'profile.py#L226-L291',
  },
  {
    no: '02',
    tag: 'DUAL POLICY CHECK',
    title: '规划前查输入模型，重写后再查生成 SQL',
    text: '输入 SQL 只写 FROM orders，不代表展开后的 SQL 依然满足只读与安全约束。模型的 ref_sql 或视图定义可能夹带未预期引用，因此 _plan() 在重写完成后还会调用 validate_planned_sql 复检。',
    fail: '代价与边界：多一次 SQL 解析开销；且这里的策略门只覆盖经过引擎规划的入口，若外部脚本拿到数据库文件直连，自然不受 manifest 约束。',
    href: WREN_SOURCE.postPolicy,
    sourceLabel: 'engine.py#L270-L284',
  },
  {
    no: '03',
    tag: 'RUST MODEL / PYTHON VIEW',
    title: '逻辑模型交由 Rust 核心展开，视图保留原生 SQL 拼装',
    text: 'Python 侧提取引用子集并组织 CTE 顺序，PyO3 调用 Rust SessionContext 展开模型内部语义；而视图保留自身 SQL，仅预先生成它依赖的模型 CTE。两边职责按语义复杂度切分。',
    fail: '排查盲区：定位视图或嵌套 CTE 改写异常时，如果只盯住 Rust 模型转换，会漏掉 Python CTERewriter 的依赖排序与外层拼装逻辑。',
    href: WREN_SOURCE.rewriterHead,
    sourceLabel: 'mdl/cte_rewriter.py#L1-L12',
  },
  {
    no: '04',
    tag: 'DIRECT CLI vs GOVERNED WORKER',
    title: 'CLI 进程内直调引擎，受控服务另起子进程管生命周期',
    text: '直接运行命令行时无需额外守护进程；而在宿主驱动的 governed stdio 模式下，查询交给 POSIX worker 子进程以只读方式执行并检查返回体积，超时或取消时主进程可回收 worker。',
    fail: '失效条件：杀掉本地 worker 子进程不保证远端数据仓库同步中止慢查询；同时也不能拿直接 CLI 的延迟与生命周期表现去推断受控服务。',
    href: WREN_SOURCE.governedHead,
    sourceLabel: 'governed_query.py#L1-L32',
  },
] as const;

export const WREN_EVIDENCE = [
  {
    no: '01',
    title: 'CLI 规划、校验与只读查询入口',
    path: 'core/wren/src/wren/cli.py#L481-L607',
    href: WREN_SOURCE.cli,
  },
  {
    no: '02',
    title: 'WrenEngine 只读策略门与 _plan() 重写主链',
    path: 'core/wren/src/wren/engine.py#L119-L284',
    href: WREN_SOURCE.plan,
  },
  {
    no: '03',
    title: 'CTERewriter 与 PyO3 Rust SessionContext 桥接',
    path: 'core/wren/src/wren/mdl/cte_rewriter.py#L1148-L1166',
    href: WREN_SOURCE.rewriter,
  },
  {
    no: '04',
    title: 'DuckDB 连接器执行与 LIMIT 0 干跑校验',
    path: 'core/wren/src/wren/connector/duckdb.py#L80-L116',
    href: WREN_SOURCE.duckdbExec,
  },
  {
    no: '05',
    title: 'Governed stdio 受控查询子进程与大小门限',
    path: 'core/wren/src/wren/governed_query.py#L250-L322',
    href: WREN_SOURCE.governed,
  },
  {
    no: '06',
    title: 'Rust Context Loader（Warble 投影与血缘图，不执行查询）',
    path: 'core/wren-context-loader/src/lib.rs#L1-L58',
    href: WREN_SOURCE.contextLoader,
  },
] as const;
