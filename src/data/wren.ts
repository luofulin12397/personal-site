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
  policyText: `${SOURCE}/core/wren/src/wren/policy.py#L380-L382`,
  profile: `${SOURCE}/core/wren/src/wren/profile.py#L226-L291`,
  memory: `${SOURCE}/core/wren/src/wren/memory/cli.py#L176-L280`,
  duckdb: `${SOURCE}/core/wren/src/wren/connector/duckdb.py#L104-L116`,
};

export const WREN_VIEWS = [
  { id: 'build', label: '构建', labelEn: 'BUILD', no: '01.1', hint: '离线编译：源文件 → 校验 → manifest。不在这一步读取数据库。', defaultNode: 'manifest' },
  { id: 'query', label: '查询', labelEn: 'QUERY', no: '01.2', hint: '运行时：Agent SQL → 策略 → 重写 → connector。', defaultNode: 'rewrite' },
  { id: 'runtime', label: '运行边界', labelEn: 'RUNTIME', no: '01.3', hint: '三条命令各自证明一层；profile 决定连哪个数据库。', defaultNode: 'query' },
] as const;

export type WrenView = (typeof WREN_VIEWS)[number]['id'];

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
};

export const WREN_NODES: WrenNode[] = [
  { id: 'source', view: 'build', index: '01', title: '项目源文件', tag: 'Git 中的 MDL',
    detail: 'wren_project.yml、models、views、relationships、cubes 与 knowledge 是项目源文件；模型可以引用 SQL，也可以内联定义。',
    proves: '业务含义可以作为可审阅、可版本化的文件维护。',
    limits: '这些源文件不是引擎直接加载的 manifest。',
    href: WREN_SOURCE.model, sourceLabel: 'orders/ref_sql.sql' },
  { id: 'compile', view: 'build', index: '02', title: '校验并编译 MDL', tag: 'context validate / build',
    detail: 'context validate 先做结构与本地语义检查；context build 默认阻断硬错误，再生成引擎 manifest。两者不是同一个通过条件。',
    proves: '命令行可以在不连数据库的情况下发现结构错误。',
    limits: '构建通过不等于语义验证通过；两者也都不证明数据库接受查询。',
    href: WREN_SOURCE.validate, sourceLabel: 'context_cli.py' },
  { id: 'manifest', view: 'build', index: '03', title: 'target/mdl.json', tag: '派生产物',
    detail: 'build 把模型、视图、关系、Cube 等编译成引擎加载的 manifest；连接 profile 不写进这个文件。',
    proves: '引擎拿到的是经过编译的模型定义。',
    limits: 'manifest 不是数据库快照，也不包含连接凭据。',
    href: WREN_SOURCE.context, sourceLabel: 'context_cli.py / build' },
  { id: 'context', view: 'query', index: '01', title: 'Skills / Memory', tag: '可选上下文',
    detail: 'Skills 提供工作流说明，Memory 可检索模型、规则和已确认问句；本页使用手写 SQL，没有运行这两层。',
    proves: 'Agent 可以在写 SQL 前获得额外上下文。',
    limits: 'Memory 是可选检索层，不是 MDL 的替代品，也不参与本页实验。',
    href: WREN_SOURCE.memory, sourceLabel: 'memory/cli.py' },
  { id: 'sql', view: 'query', index: '02', title: 'Agent 写模型 SQL', tag: '外部输入',
    detail: 'Agent 把业务问题写成引用 orders 的 SQL；查询不知道 fixture.public.raw_orders 这个物理表名。',
    proves: '查询可以只依赖逻辑模型。',
    limits: '模型能否正确生成 SQL，不在本次实验范围。',
    href: WREN_SOURCE.model, sourceLabel: 'orders/ref_sql.sql' },
  { id: 'policy', view: 'query', index: '03', title: '策略检查', tag: '只读查询入口',
    detail: '只读入口拒绝带库名或目录名的表引用，并要求引用属于 manifest 的模型。模型缺失时在 SQL_POLICY_CHECK 拒绝。',
    proves: '策略门在读库前拦住未建模的引用，即使物理表存在。',
    limits: '只验证了显式 query --read-only；不代表其他入口默认如此。',
    href: WREN_SOURCE.policyText, sourceLabel: 'policy.py' },
  { id: 'rewrite', view: 'query', index: '04', title: '裁剪 manifest 并重写', tag: 'Wren 引擎',
    detail: '引擎按 SQL 引用裁剪 manifest，交给 CTERewriter 展开模型定义；wren-core/DataFusion 规划后再检查生成的 SQL。',
    proves: 'dry-plan 能看到 orders 展开成物理表 CTE。',
    limits: '本地规划成功，不代表数据库接受这条 SQL。',
    href: WREN_SOURCE.plan, sourceLabel: 'engine.py / CTERewriter' },
  { id: 'connector', view: 'query', index: '05', title: '目标方言与 connector', tag: '运行时',
    detail: '重写后的 SQL 交给目标数据库连接器。连接器校验或执行失败时，不能回退成“规则已经算过”。',
    proves: '规划结果最终必须接受目标数据库的语法和权限检查。',
    limits: '连接器返回结果，不代表业务口径正确。',
    href: WREN_SOURCE.duckdb, sourceLabel: 'connector/duckdb.py' },
  { id: 'profile', view: 'runtime', index: '01', title: '连接 profile', tag: '独立配置',
    detail: 'profile 记录数据源与连接参数；项目可以固定 profile，名称不存在时直接失败，不静默切换数据库。',
    proves: 'manifest 与数据源连接是分离的。',
    limits: 'profile 不是 MDL 的一部分，也不能证明数据库权限设计正确。',
    href: WREN_SOURCE.profile, sourceLabel: 'profile.py' },
  { id: 'dry-plan', view: 'runtime', index: '02', title: 'dry-plan', tag: '本地规划',
    detail: '只做本地解析、策略和 CTE 重写，输出展开后的 SQL；不打开数据库连接。',
    proves: '可以检查逻辑模型如何变成物理表读取。',
    limits: '不证明数据库接受，也不证明结果正确。',
    href: WREN_SOURCE.plan, sourceLabel: 'engine.py' },
  { id: 'dry-run', view: 'runtime', index: '03', title: 'dry-run', tag: '连接器校验',
    detail: '把规划后的 SQL 交给连接器，用 LIMIT 0 包装检查；不返回数据行。',
    proves: '目标数据库能解析这份规划结果。',
    limits: '不证明完整执行成功，也不证明业务结果正确。',
    href: WREN_SOURCE.duckdb, sourceLabel: 'connector/duckdb.py' },
  { id: 'query', view: 'runtime', index: '04', title: 'query --read-only', tag: '执行与结果',
    detail: '真正执行只读查询并返回 Arrow 结果。本页返回两位客户的订单计数。',
    proves: '只读入口可以执行并返回结果。',
    limits: '执行成功不代表 COUNT(*) 符合业务口径。',
    href: WREN_SOURCE.cli, sourceLabel: 'cli.py / query' },
];


export const INPUT_SQL = `SELECT customer_id, COUNT(*) AS order_count
FROM orders
GROUP BY customer_id
ORDER BY customer_id`;

// Recorded DuckDB dry-plan output, with whitespace added for reading.
const EXPANDED_SQL = `WITH orders AS (
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

export { EXPANDED_SQL };

export const WREN_STEPS = [
  { command: 'dry-plan', output: EXPANDED_SQL,
    proves: '本地规划成功，把逻辑模型 orders 展开成引用物理表的 CTE。',
    limits: '这个命令没连 DuckDB，不能证明数据库接受这条 SQL。' },
  { command: 'dry-run', output: 'OK',
    proves: 'DuckDB 连接器对规划结果提交了 LIMIT 0 包装查询，校验通过。',
    limits: '没有返回数据行，不能证明完整执行会成功，也不能验证结果。' },
  { command: 'query --read-only', output: '{"customer_id": 101, "order_count": 2}\n{"customer_id": 202, "order_count": 1}',
    proves: '只读入口执行成功，取回两位客户的订单计数。',
    limits: '能查出结果，不代表 COUNT(*) 就符合业务要求，例如取消单要不要计入。' },
] as const;

export const MANIFEST_DIFF = `- "models": [ { "name": "orders", … } ]\n+ "models": []`;
export const TABLE_CHECK = `SELECT COUNT(*) FROM public.raw_orders;\n3`;

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
