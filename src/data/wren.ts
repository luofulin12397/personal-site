const COMMIT = '48de0b6cbd02cbbe3753f29e37f4be24e8a9a7fd';
const WREN_REPO = 'https://github.com/Canner/WrenAI';
export const WREN_COMMIT = `${WREN_REPO}/tree/${COMMIT}`;
const SOURCE = `${WREN_REPO}/blob/${COMMIT}`;
const ENGINE = `${SOURCE}/core/wren/src/wren/engine.py`;

export const WREN_SOURCE = {
  model: `${SOURCE}/examples/v5-jaffle/models/orders/ref_sql.sql#L1`,
  cli: `${SOURCE}/core/wren/src/wren/cli.py#L481-L607`,
  context: `${SOURCE}/core/wren/src/wren/context_cli.py#L862-L936`,
  plan: `${ENGINE}#L238-L284`,
  policy: `${ENGINE}#L119-L160`,
  policyText: `${SOURCE}/core/wren/src/wren/policy.py#L380-L382`,
  duckdb: `${SOURCE}/core/wren/src/wren/connector/duckdb.py#L104-L116`,
};

export const WREN_NODES = [
  { id: 'agent', index: '01', title: 'Agent 写模型 SQL', tag: '外部输入',
    detail: 'Agent 把业务问题写成引用 orders 的 SQL。它可以先用 Skills 和 Memory 找上下文；本页用的是手写 SQL。',
    proves: '查询可以只依赖逻辑模型名，不必知道物理表。',
    limits: '模型能否正确生成 SQL，不在本次实验范围。',
    href: WREN_SOURCE.model, sourceLabel: 'orders/ref_sql.sql' },
  { id: 'manifest', index: '02', title: '加载 MDL 与 manifest', tag: '项目上下文',
    detail: 'context build 把模型、关系、视图等定义编译成 target/mdl.json。连接配置独立于 manifest。',
    proves: '引擎拿到的是可查询的模型和字段定义。',
    limits: '构建通过不等于语义验证通过；本页使用预先构建的 manifest。',
    href: WREN_SOURCE.context, sourceLabel: 'context_cli.py' },
  { id: 'plan', index: '03', title: '规划并重写 SQL', tag: 'Wren 引擎',
    detail: '引擎按 SQL 引用的模型裁剪 manifest，交给 CTERewriter 展开模型定义，并再次检查生成的 SQL。',
    proves: 'dry-plan 能看到 orders 展开成引用物理表的 CTE。',
    limits: '本地规划成功，不代表数据库接受这条 SQL。',
    href: WREN_SOURCE.plan, sourceLabel: 'engine.py / CTERewriter' },
  { id: 'duckdb', index: '04', title: 'DuckDB 执行', tag: '外部数据源',
    detail: '连接器只收到展开后的 SQL。dry-run 用 LIMIT 0 校验，query 才真正取回结果。',
    proves: '只读查询可以执行，并返回两位客户的订单计数。',
    limits: '能查出结果，不代表 COUNT(*) 符合业务口径。',
    href: WREN_SOURCE.duckdb, sourceLabel: 'connector/duckdb.py' },
  { id: 'policy', index: 'B', title: '模型缺失 → 拒绝', tag: '策略分支',
    detail: '如果 orders 不在 manifest 中，严格策略检查会拒绝未建模的表引用，即使物理表存在。',
    proves: '拒绝发生在 SQL_POLICY_CHECK，不是 DuckDB 找不到表。',
    limits: '只验证了显式 query --read-only；不代表其他入口默认如此。',
    href: WREN_SOURCE.policyText, sourceLabel: 'policy.py' },
] as const;


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
