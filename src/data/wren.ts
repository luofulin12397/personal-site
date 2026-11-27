const COMMIT = '48de0b6cbd02cbbe3753f29e37f4be24e8a9a7fd';
const WREN_REPO = 'https://github.com/Canner/WrenAI';
export const WREN_COMMIT = `${WREN_REPO}/tree/${COMMIT}`;
const SOURCE = `${WREN_REPO}/blob/${COMMIT}`;
const ENGINE = `${SOURCE}/core/wren/src/wren/engine.py`;
const POLICY = `${SOURCE}/core/wren/src/wren/policy.py`;
const READ_ONLY = `${SOURCE}/core/wren/src/wren/read_only.py`;
const CLI = `${SOURCE}/core/wren/src/wren/cli.py`;
const CONTEXT_CLI = `${SOURCE}/core/wren/src/wren/context_cli.py`;
const DUCKDB = `${SOURCE}/core/wren/src/wren/connector/duckdb.py`;

export const WREN_SOURCE = {
  model: `${SOURCE}/examples/v5-jaffle/models/orders/ref_sql.sql#L1`,
  modelMeta: `${SOURCE}/examples/v5-jaffle/models/orders/metadata.yml#L1-L19`,
  cli: `${CLI}#L481-L607`,
  cliQuery: `${CLI}#L481-L502`,
  cliDryPlan: `${CLI}#L550-L561`,
  context: `${CONTEXT_CLI}#L862-L936`,
  contextBuildGate: `${CONTEXT_CLI}#L914-L922`,
  contextBuildOut: `${CONTEXT_CLI}#L923-L936`,
  validate: `${CONTEXT_CLI}#L671-L735`,
  engineInit: `${ENGINE}#L68-L96`,
  engineDryPlan: `${ENGINE}#L102-L116`,
  engineDryRun: `${ENGINE}#L173-L185`,
  engineExec: `${ENGINE}#L157-L171`,
  plan: `${ENGINE}#L210-L284`,
  planExtract: `${ENGINE}#L238-L253`,
  policy: `${ENGINE}#L119-L160`,
  policyEntry: `${ENGINE}#L128-L156`,
  readOnlyCheck: `${READ_ONLY}#L44-L87`,
  policyValidate: `${POLICY}#L308-L384`,
  plannedSql: `${POLICY}#L264-L284`,
  postPolicy: `${ENGINE}#L270-L284`,
  policyText: `${POLICY}#L380-L382`,
  rewriter: `${SOURCE}/core/wren/src/wren/mdl/cte_rewriter.py#L1148-L1175`,
  rewriterHead: `${SOURCE}/core/wren/src/wren/mdl/cte_rewriter.py#L1-L12`,
  profile: `${SOURCE}/core/wren/src/wren/profile.py#L260-L294`,
  profilePin: `${SOURCE}/core/wren/src/wren/profile.py#L282-L294`,
  memory: `${SOURCE}/core/wren/src/wren/memory/cli.py#L176-L240`,
  memoryGrep: `${SOURCE}/core/wren/src/wren/memory/cli.py#L205-L223`,
  memoryRules: `${SOURCE}/core/wren/src/wren/memory/cli.py#L225-L238`,
  duckdbExec: `${DUCKDB}#L80-L103`,
  duckdb: `${DUCKDB}#L104-L118`,
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
    hint: '虚线为可选检索层；实线依次穿过规划前策略门、CTE 重写、规划后复检与目标连接器。',
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
    title: '连库前三层准入核对模型清单，缺失直接拒绝',
  },
  {
    id: 'post-policy',
    no: '03',
    label: '重写与二次复检',
    title: 'CTE 展开后再扫 AST，防止内联定义夹带写操作',
  },
] as const;

export type WrenNodeIO = {
  input: string;
  output: string;
  guard?: string;
};

export type WrenCodeAnnotation = {
  fn: string;
  loc: string;
  href: string;
  code: string;
  highlight?: number[];
  note: string;
};

export type WrenNode = {
  id: string;
  view: WrenView;
  index: string;
  title: string;
  tag: string;
  detail: string;
  io: WrenNodeIO;
  annotations: WrenCodeAnnotation[];
  proves: string;
  limits: string;
  href: string;
  sourceLabel: string;
  sectionLink?: { href: string; label: string };
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
    detail: 'wren_project.yml、models、views、relationships 与 knowledge 以版本化文件维护；物理表映射与公开列边界在这里显式声明。',
    io: {
      input: 'models/orders/{metadata.yml, ref_sql.sql}',
      output: '逻辑模型 orders（公开 id / customer_id / amount）',
    },
    annotations: [
      {
        fn: 'ref_sql.sql · 物理表绑定',
        loc: 'models/orders/ref_sql.sql:L1',
        href: WREN_SOURCE.model,
        code: 'SELECT id, customer_id, amount FROM public.raw_orders',
        highlight: [1],
        note: '把物理表名和原始取数口径收口在 SQL 源文件里；上层查询只写 FROM orders，不再直接引用底层表。',
      },
      {
        fn: 'metadata.yml · 公开列清单',
        loc: 'models/orders/metadata.yml:L1-L18',
        href: WREN_SOURCE.modelMeta,
        code: `name: orders
columns:
  - name: customer_id
    type: INTEGER
primary_key: id`,
        highlight: [1, 3],
        note: '模型名、公开列与主键均落盘为可审阅的 YAML；未声明的物理列不进入语义模型契约。',
      },
    ],
    proves: '业务表映射和字段口径能作为 Git 文件审阅，而不是藏在提示词里。',
    limits: '源文件不直接进入查询引擎，必须先编译成 manifest。',
    href: WREN_SOURCE.model,
    sourceLabel: 'examples/v5-jaffle/models/orders/ref_sql.sql',
    sectionLink: { href: '#boundary', label: '看下方模型与连接边界 ↓' },
  },
  {
    id: 'compile',
    view: 'build',
    index: '02',
    title: '校验并编译 MDL',
    tag: 'CONTEXT VALIDATE / BUILD',
    detail: 'context validate 按级别做结构与语义检查；context build 默认在打包前跑校验，遇硬错误直接中止，全程离线不连库。',
    io: {
      input: '本地项目目录（wren_project.yml / models / views）',
      output: '通过硬错误检查 → 进入 build_json() 汇编 manifest',
      guard: '存在 e.level == "error" → Build aborted，退出码 1',
    },
    annotations: [
      {
        fn: 'context_cli.py · build() 硬错误闸门',
        loc: 'context_cli.py:L914-L921',
        href: WREN_SOURCE.contextBuildGate,
        code: `if validate_first:
    errors = validate_project(project_path)
    hard_errors = [e for e in errors if e.level == "error"]
    if hard_errors:
        raise typer.Exit(1)`,
        highlight: [3, 4, 5],
        note: '默认开启 validate_first，但只拦截 level == "error" 的硬错误；警告（如缺字段描述）不会阻止产出清单。',
      },
      {
        fn: 'context_cli.py · validate() 分级检查',
        loc: 'context_cli.py:L671-L735',
        href: WREN_SOURCE.validate,
        code: `def validate(..., strict: bool = False, level: str = "warning"):
    # error (dry-plan only), warning (+ descriptions), strict (+ columns)
    struct_errors = validate_project(project_path)`,
        highlight: [1, 2],
        note: 'context validate 与 build 的通过门槛不同：可按 error / warning / strict 分级做本地 YAML 与视图规划校验。',
      },
    ],
    proves: '命令行无需连接真实数据库，即可提前拦住模型结构错误。',
    limits: 'build 成功不等于语义校验全过，也不证明目标库存在对应物理表。',
    href: WREN_SOURCE.validate,
    sourceLabel: 'core/wren/src/wren/context_cli.py#L671-L940',
    sectionLink: { href: '#boundary', label: '看下方编译产物说明 ↓' },
  },
  {
    id: 'manifest',
    view: 'build',
    index: '03',
    title: 'target/mdl.json',
    tag: 'COMPILED MANIFEST',
    detail: '编译产物汇总模型、关系与视图供 WrenEngine 加载；数据库连接信息独立存放，不写进 manifest 文件。',
    io: {
      input: '通过校验的 models / views / relationships 定义',
      output: 'target/mdl.json → Base64 传入 WrenEngine',
    },
    annotations: [
      {
        fn: 'context_cli.py · build_json() 落盘',
        loc: 'context_cli.py:L923-L936',
        href: WREN_SOURCE.contextBuildOut,
        code: `manifest_json = build_json(project_path)
out_path = save_target(manifest_json, project_path)
n_models = len(manifest_json.get("models", []))
n_views = len(manifest_json.get("views", []))`,
        highlight: [1, 2],
        note: '把零散的目录文件打包为单一纯语义 JSON 清单；里面不包含数据库账号、密码或环境地址。',
      },
      {
        fn: 'engine.py · WrenEngine.__init__() 懒连接',
        loc: 'engine.py:L77-L95',
        href: WREN_SOURCE.engineInit,
        code: `self.manifest_str = manifest_str
if isinstance(connection_info, dict) and connection_info:
    self.connection_info = data_source.get_connection_info(connection_info)
self._connector = None`,
        highlight: [1, 4],
        note: '引擎初始化允许空 connection_info 且把 self._connector 设为 None；只要只做规划，同一份清单可零连库复用。',
      },
    ],
    proves: '同一份编译产物可跨本地实验库与不同运行环境复用。',
    limits: 'manifest 不包含数据库账号权限，也不是物理表结构的实时快照。',
    href: WREN_SOURCE.context,
    sourceLabel: 'core/wren/src/wren/context_cli.py#L862-L936',
    sectionLink: { href: '#control', label: '看删模型 manifest 变更 ↓' },
  },
  {
    id: 'context',
    view: 'query',
    index: '04',
    title: 'Skills / Memory',
    tag: 'OPTIONAL CONTEXT',
    detail: 'Skills 管工作流，Memory 召回业务规则与历史 SQL 示例；本页实验直接传入逻辑 SQL，未经过这两层。',
    io: {
      input: '自然语言问句或 knowledge/sql/*.md 示例对',
      output: '召回规则与参考 SQL（供上层 Agent 生成查询）',
      guard: '本例 CLI 直传逻辑 SQL，完全旁路此可选层',
    },
    annotations: [
      {
        fn: 'memory/cli.py · index() 后端降级',
        loc: 'memory/cli.py:L205-L223',
        href: WREN_SOURCE.memoryGrep,
        code: `if resolve_backend() == "grep":
    n = len(load_query_pairs(project_path))
    typer.echo(f"grep backend: {n} pair(s) in knowledge/sql/")
    return`,
        highlight: [1, 4],
        note: '未安装可选扩展 wren[memory] 时自动回退到 grep 后端，直接检索 markdown 示例对，无需构建 LanceDB 向量索引。',
      },
      {
        fn: 'memory/cli.py · load_rules() 规则注入',
        loc: 'memory/cli.py:L225-L237',
        href: WREN_SOURCE.memoryRules,
        code: `manifest = _load_manifest(mdl)
instr, _ = load_rules(project_path)
if instr:
    manifest["_instructions"] = instr`,
        highlight: [2, 4],
        note: '业务口径提示（_instructions）只在检索建索引阶段附着，不替代执行期的 AST 策略门与模型白名单。',
      },
    ],
    proves: '上层 Agent 能在生成 SQL 前按需检索上下文。',
    limits: '本页实测未评估自然语言转 SQL 召回准确率，也不把这两层算进 CLI 默认路径。',
    href: WREN_SOURCE.memory,
    sourceLabel: 'core/wren/src/wren/memory/cli.py#L176-L240',
    sectionLink: { href: '#boundary', label: '看周边模块与核心边界 ↓' },
    optional: true,
  },
  {
    id: 'sql',
    view: 'query',
    index: '05',
    title: '输入逻辑模型 SQL',
    tag: 'LOGICAL SQL INPUT',
    detail: '调用方提交只引用逻辑模型 orders 的聚合查询，CLI 组装引擎参数后，首先用目标方言解析成 sqlglot AST。',
    io: {
      input: 'SELECT customer_id, COUNT(*) AS order_count FROM orders GROUP BY customer_id',
      output: '目标方言（duckdb）解析后的 sqlglot AST',
    },
    annotations: [
      {
        fn: 'cli.py · query() 透传 --read-only',
        loc: 'cli.py:L493-L497',
        href: WREN_SOURCE.cliQuery,
        code: `with _build_engine(mdl, connection_info, connection_file) as engine:
    result = engine.query(
        sql, limit=limit, **({"read_only": True} if read_only else {})
    )`,
        highlight: [2, 3],
        note: '注意默认 read_only=False；只有在命令行显式加上 --read-only 时，才会开启下一站的严格只读入口准入。',
      },
      {
        fn: 'engine.py · parse_one() 语法树化',
        loc: 'engine.py:L217-L222',
        href: WREN_SOURCE.plan,
        code: `dialect = get_sqlglot_dialect(self.data_source)
ast = parse_one(sql, dialect=dialect)`,
        highlight: [2],
        note: '所有检查与表名解析都在 sqlglot AST 上完成，避免简单字符串或正则匹配被注释、别名与大小写绕过。',
      },
    ],
    proves: '上游调用面只需面向稳定的逻辑模型名与公开列。',
    limits: '大模型能否从自然语言写对这句逻辑 SQL，不在本次实测范围。',
    href: WREN_SOURCE.cli,
    sourceLabel: 'core/wren/src/wren/cli.py#L481-L607',
    sectionLink: { href: '#path', label: '看下方四站链路与完整 SQL ↓' },
  },
  {
    id: 'policy',
    view: 'query',
    index: '06',
    title: '只读策略门',
    tag: 'SQL_POLICY_CHECK · GATE',
    detail: '显式 --read-only 入口在连库前连续过三道校验：单句只读与函数白名单 → 拒递归 CTE 与带库前缀表名 → 封堵文件读取器并核对 manifest 模型清单。',
    io: {
      input: '逻辑 SQL（FROM orders）+ manifest 声明表集 {orders}',
      output: '三道检查全过 → 放行进入 _plan() 裁剪与重写',
      guard: '写语句 / 非白名单函数 / 带库前缀 / 删模型后缺表 → 抛 INVALID_SQL 或 MODEL_NOT_FOUND（连库前拦截）',
    },
    annotations: [
      {
        fn: 'read_only.py · check_read_only_query()',
        loc: 'read_only.py:L44-L87',
        href: WREN_SOURCE.readOnlyCheck,
        code: `if len(statements) != 1:
    raise NotReadOnlyError("Expected one analytical query")
if any(isinstance(n, (exp.DML, exp.DDL, exp.Command, exp.Into, exp.Lock)) for n in nodes):
    raise NotReadOnlyError("Query contains an operation with side effects")
if isinstance(node, exp.Func) and (isinstance(node, exp.Anonymous) or node.key not in _FUNCTIONS):
    raise UnsupportedFunctionError("Query uses an unsupported function")`,
        highlight: [1, 3, 5],
        note: '第一道入口准入：只允许单条分析查询，遍历整棵 AST 拦截写/DDL/锁/命令，且仅放行 _FUNCTIONS 白名单内的只读函数（未知 UDF 直接 fail-closed）。',
      },
      {
        fn: 'engine.py · query(read_only=True)',
        loc: 'engine.py:L131-L155',
        href: WREN_SOURCE.policyEntry,
        code: `if any(w.args.get("recursive") for w in statement.find_all(exp.With)):
    raise WrenError(ErrorCode.INVALID_SQL, ..., phase=ErrorPhase.SQL_POLICY_CHECK)
if any(t.db or t.catalog for t in statement.find_all(exp.Table)):
    raise WrenError(ErrorCode.MODEL_NOT_FOUND, "Query only unqualified bound models.", ...)
validate_sql_policy(statement, names, replace(self._config, strict_mode=True, allowed_source_functions=frozenset()))`,
        highlight: [1, 3, 5],
        note: '第二道入口门控：拒绝 WITH RECURSIVE 与任何带 db/catalog 前缀的表名（防直指 fixture.public.raw_orders），再强制以 strict_mode=True 且禁用源表函数调起清单校验。',
      },
      {
        fn: 'policy.py · validate_sql_policy() & _check_tables()',
        loc: 'policy.py:L310-L384',
        href: WREN_SOURCE.policyValidate,
        code: `validate_read_only_ast(ast)
_check_data_readers(ast)  # 全位置禁 read_csv / read_parquet / dblink 等
if resolve_model_name(name, quoted, model_names) is not None:
    continue
raise WrenError(ErrorCode.MODEL_NOT_FOUND, f"Table '{name}' is not defined in the MDL manifest.", ...)`,
        highlight: [2, 5],
        note: '第三道清单校验：全树封堵 read_csv 等外部读取器后，逐表核对是否已在 manifest 定义；单变量删模型实验就是在这里连库前触发 MODEL_NOT_FOUND。',
      },
    ],
    proves: '即使物理表仍在数据库里，未建模的表引用也会在连库前被拦截。',
    limits: '入口层严格白名单针对显式 --read-only 入口，不代表所有调用方式默认开启同等限制。',
    href: WREN_SOURCE.policy,
    sourceLabel: 'core/wren/src/wren/engine.py#L119-L160',
    sectionLink: { href: '#control', label: '看下方删模型拦截实测 ↓' },
    gate: true,
  },
  {
    id: 'rewrite',
    view: 'query',
    index: '07',
    title: '裁剪 manifest 并重写',
    tag: 'CTEREWRITER + RUST CORE',
    detail: '_plan() 先按本次查询引用的表裁出最小 manifest，再经 CTERewriter 与 PyO3 Rust SessionContext 展开 WITH orders AS (...)。',
    io: {
      input: '过检的逻辑 SQL + 全量 manifest',
      output: 'WITH orders AS (SELECT ... FROM fixture.public.raw_orders) ...',
    },
    annotations: [
      {
        fn: 'engine.py · extract_by() 按表裁剪清单',
        loc: 'engine.py:L243-L253',
        href: WREN_SOURCE.planExtract,
        code: `resolved = resolve_model_name(t.name, quoted, queryable_names)
tables.append(resolved if resolved is not None else t.name)
extractor = get_manifest_extractor(self.manifest_str)
manifest = extractor.extract_by(tables)`,
        highlight: [3, 4],
        note: '先按 SQL 大小写规则归一模型名，再由 Rust 提取器裁出只包含引用模型和关联关系的最小子集 manifest，减少规划上下文噪音。',
      },
      {
        fn: 'cte_rewriter.py · transform_sql() 与别名防冲突',
        loc: 'mdl/cte_rewriter.py:L1157-L1175',
        href: WREN_SOURCE.rewriter,
        code: `model_sql = f'SELECT {col_list} FROM "{model_name}"'
expanded = self.session_context.transform_sql(model_sql)
expanded_ast = parse_one(expanded, dialect="wren")
self._rename_outer_alias(expanded_ast, ...)  # 改为 wren_src_orders`,
        highlight: [2, 4],
        note: '调用 PyO3 Rust 核心把逻辑模型展开为物理表子查询，并将最外层别名重命名为 wren_src_orders，防止嵌套进 WITH orders 时引发自引用歧义。',
      },
    ],
    proves: 'dry-plan 输出清晰展示逻辑模型如何映射到底层物理表读取。',
    limits: '纯内存改写完成，不代表目标数据库一定接受该方言语法或具备权限。',
    href: WREN_SOURCE.rewriter,
    sourceLabel: 'core/wren/src/wren/mdl/cte_rewriter.py#L1148-L1175',
    sectionLink: { href: '#expanded-sql', label: '看下方完整展开 CTE SQL ↓' },
  },
  {
    id: 'post-policy',
    view: 'query',
    index: '08',
    title: '规划后二次复检',
    tag: 'POST-PLAN GUARD · GATE',
    detail: '重写器会把 MDL 的视图 SQL 和模型 ref_sql 内联进最终方言 SQL；离开 _plan() 前再扫一次 AST，防止内联定义偷偷带入写操作。',
    io: {
      input: 'rewriter.rewrite(sql) 产出的目标方言 SQL',
      output: '确认不含写/改状态节点 → 返回给 dry-plan / 连接器',
      guard: '展开产物含写语句或锁操作 → 抛 BLOCKED_STATEMENT（连库前拦截）',
    },
    annotations: [
      {
        fn: 'engine.py · _plan() 返回前二次复检',
        loc: 'engine.py:L276-L280',
        href: WREN_SOURCE.postPolicy,
        code: `dialect_sql = rewriter.rewrite(sql)
# Planning inlines MDL view statements and model ref_sql, so the
# output can carry a mutating statement the input never did.
validate_planned_sql(dialect_sql, dialect)
return dialect_sql`,
        highlight: [4],
        note: '输入语句虽然只是 SELECT * FROM orders，但展开后的 SQL 携带了模型/视图源码；复检把安全闭环延展到真正下发给数据库的最终语句。',
      },
      {
        fn: 'policy.py · validate_planned_sql() fail-open 取舍',
        loc: 'policy.py:L264-L284',
        href: WREN_SOURCE.plannedSql,
        code: `def validate_planned_sql(sql: str, dialect: str | None = None) -> None:
    try:
        parsed = parse_one(sql, dialect=dialect)
    except Exception:
        return
    if parsed is not None:
        validate_read_only_ast(parsed)`,
        highlight: [4, 5, 7],
        note: '与入口层 fail-closed 不同，此处解析异常会 fail-open（避免方言转译产物因解析器差异被误杀），只要成功解析出 AST 就强制走只读全树扫描。',
      },
    ],
    proves: '安全检查不止盯用户输入，还覆盖了重写内联后生成的最终方言 SQL。',
    limits: '若目标方言的合法转译语法无法被 sqlglot 反向解析，二次复检会跳过该句；仍需配合数据库只读账号兜底。',
    href: WREN_SOURCE.plannedSql,
    sourceLabel: 'core/wren/src/wren/policy.py#L264-L284',
    sectionLink: { href: '#decisions', label: '看下方双道策略门取舍 ↓' },
    gate: true,
  },
  {
    id: 'connector',
    view: 'query',
    index: '09',
    title: '连接器执行与返回',
    tag: 'DUCKDB CONNECTOR',
    detail: '前序检查与规划全部通过后才懒加载连接器，按需包装 LIMIT 子查询并在连接锁内交给 DuckDB 执行，以 Arrow 表返回结果。',
    io: {
      input: '复检通过的 DuckDB 方言 SQL + 可选 limit',
      output: 'pyarrow.Table（本例 101 → 2，202 → 1）',
      guard: '超时或数据库报错 → 封装为 DatabaseTimeoutError / SQL_EXECUTION',
    },
    annotations: [
      {
        fn: 'engine.py · _get_connector() 延迟建连',
        loc: 'engine.py:L157-L160',
        href: WREN_SOURCE.engineExec,
        code: `dialect_sql = self.dry_plan(sql, properties)
connector = self._get_connector()
return connector.query(dialect_sql, limit)`,
        highlight: [2, 3],
        note: '连接器直到 dry_plan() 返回合法方言 SQL 之后才首次实例化，确保被策略门拒掉的查询完全不触达数据库。',
      },
      {
        fn: 'duckdb.py · query() 子查询限行与加锁',
        loc: 'connector/duckdb.py:L89-L102',
        href: WREN_SOURCE.duckdbExec,
        code: `stripped = self._strip(sql)
if limit is not None:
    sql = f"SELECT * FROM (\\n{stripped}\\n) AS _q LIMIT {limit}"
with self._connection_lock:
    return self.connection.execute(sql).to_arrow_table()`,
        highlight: [3, 4, 5],
        note: '用换行包裹子查询防止末尾 -- 注释吞掉外层 LIMIT；execute 与 to_arrow_table 放进同一把连接锁内，避免并发读串掉结果。',
      },
    ],
    proves: '规划产出的 SQL 通过了真实数据库的解析、读表与聚合计数。',
    limits: '数据库能算出数字，不代表 COUNT(*) 已经排除了取消单等业务口径问题。',
    href: WREN_SOURCE.duckdbExec,
    sourceLabel: 'core/wren/src/wren/connector/duckdb.py#L80-L103',
    sectionLink: { href: '#experiment', label: '看下方三条命令实测输出 ↓' },
  },
  {
    id: 'profile',
    view: 'runtime',
    index: '10',
    title: '连接 profile',
    tag: 'CONNECTION PROFILE',
    detail: 'profiles.yml 独立管理数据源类型与连接参数；项目显式绑定的 profile 若解析失败或缺失，直接退出而不静默切库。',
    io: {
      input: 'wren_project.yml 的 profile 字段 + ~/.wren/profiles.yml',
      output: '(pinned_name, profile_dict) 连接配置',
      guard: 'YAML 损坏或绑定名不存在 → SystemExit 硬阻断，绝不回退默认库',
    },
    annotations: [
      {
        fn: 'profile.py · 解析项目绑定（失败即停）',
        loc: 'profile.py:L262-L278',
        href: WREN_SOURCE.profile,
        code: `try:
    config = yaml.safe_load(project_yml.read_text(encoding="utf-8")) or {}
except yaml.YAMLError as exc:
    raise SystemExit(f"Error: invalid YAML in {project_yml}: {exc}") from exc`,
        highlight: [4],
        note: '项目配置文件写坏时绝不静默降级到全局 active profile，避免开发人员误把查询打到另一个环境。',
      },
      {
        fn: 'profile.py · 缺失 profile 显式报错',
        loc: 'profile.py:L284-L293',
        href: WREN_SOURCE.profilePin,
        code: `if pinned_name not in profiles:
    raise SystemExit(
        f"Error: project pins profile '{pinned_name}' but it doesn't exist in {_PROFILES_FILE}."
    )
return pinned_name, dict(profiles[pinned_name])`,
        highlight: [1, 2],
        note: '找不到项目绑定的环境名时直接列出现有可用 profile 并退出，把环境切换风险显式化。',
      },
    ],
    proves: '模型产物与运行环境配置解耦，切换环境有显式边界。',
    limits: 'profile 只负责连到哪个库，不能替代数据库自身的只读账号与行级权限。',
    href: WREN_SOURCE.profile,
    sourceLabel: 'core/wren/src/wren/profile.py#L260-L294',
    sectionLink: { href: '#boundary', label: '看下方连接与入口边界 ↓' },
  },
  {
    id: 'dry-plan',
    view: 'runtime',
    index: '11',
    title: 'wren dry-plan',
    tag: 'LOCAL PLAN ONLY',
    detail: '传入空连接参数运行规划、策略检查与 CTE 重写，向标准输出打印目标方言 SQL，全程零数据库访问。',
    io: {
      input: 'wren dry-plan --sql "SELECT ... FROM orders" --mdl target/mdl.json',
      output: '打印展开后的 DuckDB CTE SQL（退出码 0，不连库）',
    },
    annotations: [
      {
        fn: 'cli.py · dry_plan() 零连接构造',
        loc: 'cli.py:L550-L558',
        href: WREN_SOURCE.cliDryPlan,
        code: `with WrenEngine(
    manifest_str=manifest_str, data_source=ds,
    connection_info={}, config=config,
) as engine:
    result = engine.dry_plan(sql)
    typer.echo(result)`,
        highlight: [3, 5],
        note: '强制传入空连接字典 connection_info={}，只需要方言类型和 mdl.json 就能在离线环境跑完整套规划与策略检查。',
      },
      {
        fn: 'engine.py · dry_plan() 委托入口',
        loc: 'engine.py:L102-L116',
        href: WREN_SOURCE.engineDryPlan,
        code: `def dry_plan(self, sql: str, properties: dict | None = None) -> str:
    return self._plan(sql, properties)`,
        highlight: [2],
        note: '直接走 _plan() 返回展开文本，适合在提交或发版前检查模型映射、CTE 展开和列口径。',
      },
    ],
    proves: '可在无数据库环境下审阅模型展开逻辑与字段映射。',
    limits: '不连库，无法发现物理表缺失、列类型冲突或账号无权限。',
    href: WREN_SOURCE.cliDryPlan,
    sourceLabel: 'core/wren/src/wren/cli.py#L550-L561',
    sectionLink: { href: '#experiment', label: '切到下方 dry-plan 实测 ↓' },
  },
  {
    id: 'dry-run',
    view: 'runtime',
    index: '12',
    title: 'wren dry-run',
    tag: 'CONNECTOR LIMIT 0',
    detail: '完成规划后连接 DuckDB，用 LIMIT 0 子查询包装执行校验，确认物理表和列真实存在但不拉取数据行。',
    io: {
      input: 'wren dry-run --sql "SELECT ... FROM orders"',
      output: '数据库解析与表结构校验通过 → 打印 OK',
      guard: '物理表缺失或方言不合法 → 抛 SQL_DRY_RUN 错误',
    },
    annotations: [
      {
        fn: 'engine.py · dry_run() 规划加校验',
        loc: 'engine.py:L173-L177',
        href: WREN_SOURCE.engineDryRun,
        code: `def dry_run(self, sql: str, properties: dict | None = None) -> None:
    dialect_sql = self.dry_plan(sql, properties)
    connector = self._get_connector()
    connector.dry_run(dialect_sql)`,
        highlight: [2, 4],
        note: '先复用 dry_plan() 拿到展开 SQL，再调连接器的空跑方法，把“模型语义是否合法”和“物理表是否存在”串起来验证。',
      },
      {
        fn: 'duckdb.py · dry_run() LIMIT 0 防多语句',
        loc: 'connector/duckdb.py:L115-L117',
        href: WREN_SOURCE.duckdb,
        code: `stripped = self._strip(sql)
with self._connection_lock:
    self.connection.execute(f"SELECT * FROM (\\n{stripped}\\n) AS _q LIMIT 0")`,
        highlight: [3],
        note: '特意不用 EXPLAIN（DuckDB 批执行会跑掉分号后的语句），改用子查询 LIMIT 0 让尾随语句直接报语法错且零行物化。',
      },
    ],
    proves: '目标数据库能解析展开后的 SQL，且引用的物理表与列真实存在。',
    limits: '不扫描全量数据行，不验证聚合结果，也不能排除运行期算术错误。',
    href: WREN_SOURCE.duckdb,
    sourceLabel: 'core/wren/src/wren/connector/duckdb.py#L104-L118',
    sectionLink: { href: '#experiment', label: '切到下方 dry-run 实测 ↓' },
  },
  {
    id: 'query',
    view: 'runtime',
    index: '13',
    title: 'wren query --read-only',
    tag: 'READ-ONLY EXECUTION',
    detail: '串联只读入口准入、清单策略门、CTE 展开、规划后复检与 DuckDB 执行，返回 101 两单、202 一单的真实计数。',
    io: {
      input: 'wren query --read-only --sql "SELECT customer_id, COUNT(*) ... FROM orders"',
      output: 'customer_id: 101 → 2，202 → 1（退出码 0）',
      guard: '策略拒绝或连库失败 → 打印带 phase 的 WrenError，退出码 1',
    },
    annotations: [
      {
        fn: 'cli.py · query() 端到端入口',
        loc: 'cli.py:L493-L501',
        href: WREN_SOURCE.cliQuery,
        code: `with _build_engine(mdl, connection_info, connection_file) as engine:
    result = engine.query(
        sql, limit=limit, **({"read_only": True} if read_only else {})
    )
_print_result(result, output)`,
        highlight: [2, 3],
        note: '单条命令把策略准入、重写复检与连接器取数串成只读闭环，最后将 Arrow 结果格式化为表格或 JSON。',
      },
      {
        fn: 'engine.py · 错误相位标注',
        loc: 'engine.py:L165-L171',
        href: WREN_SOURCE.engineExec,
        code: `except Exception as e:
    raise WrenError(
        ErrorCode.GENERIC_USER_ERROR, str(e),
        phase=ErrorPhase.SQL_EXECUTION,
        metadata={DIALECT_SQL: dialect_sql},
    ) from e`,
        highlight: [4, 5],
        note: '把失败相位（SQL_POLICY_CHECK / SQL_PLANNING / SQL_EXECUTION）和展开后 SQL 一并带出，便于定位是哪一关拦截。',
      },
    ],
    proves: '从逻辑 SQL 到物理表聚合的显式只读闭环在本地可复现。',
    limits: '只覆盖直接 CLI 入口，不代表 governed stdio、Agent Service 或 MCP 的运行特征。',
    href: WREN_SOURCE.cli,
    sourceLabel: 'core/wren/src/wren/cli.py#L481-L607',
    sectionLink: { href: '#experiment', label: '切到下方 query 实测 ↓' },
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
    sourceLabel: 'profile.py#L260-L294',
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
    path: 'core/wren/src/wren/mdl/cte_rewriter.py#L1148-L1175',
    href: WREN_SOURCE.rewriter,
  },
  {
    no: '04',
    title: 'DuckDB 连接器执行与 LIMIT 0 干跑校验',
    path: 'core/wren/src/wren/connector/duckdb.py#L80-L118',
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
