const COMMIT = '48de0b6cbd02cbbe3753f29e37f4be24e8a9a7fd';
const WREN_REPO = 'https://github.com/Canner/WrenAI';
export const WREN_COMMIT = `${WREN_REPO}/tree/${COMMIT}`;
const SOURCE = `${WREN_REPO}/blob/${COMMIT}`;
const ENGINE = `${SOURCE}/core/wren/src/wren/engine.py`;

export const WREN_SOURCE = {
  model: `${SOURCE}/examples/v5-jaffle/models/orders/ref_sql.sql#L1`,
  cli: `${SOURCE}/core/wren/src/wren/cli.py#L481-L607`,
  plan: `${ENGINE}#L238-L284`,
  policy: `${ENGINE}#L119-L160`,
  duckdb: `${SOURCE}/core/wren/src/wren/connector/duckdb.py#L104-L116`,
};

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
