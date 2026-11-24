import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Footer, Masthead, SkipLink } from './components/Shell';
import WrenWorkbench from './components/WrenWorkbench';
import { EXPANDED_SQL, INPUT_SQL, MANIFEST_DIFF, MODEL_REMOVED, PLAN_EXCERPT, TABLE_CHECK, WREN_COMMIT, WREN_SOURCE, WREN_STEPS } from './data/wren';
import { PROJECTS_URL, site } from './lib/site';
import './styles/tokens.css';
import './styles/shell.css';
import './styles/case.css';
import './styles/wren.css';

const NAV = [
  { label: '系统', href: '#workbench' },
  { label: '边界', href: '#boundary' },
  { label: '路径', href: '#path' },
  { label: '代码与取舍', href: '#source' },
  { label: '证据', href: '#evidence' },
  { label: '证明与边界', href: '#limits' },
];

const source = (path: string) => `${WREN_COMMIT.replace('/tree/', '/blob/')}/${path}`;
const MODULES = [
  ['项目文件与 MDL Schema', '模型、关系、视图和 Cube 用文件定义；context build 生成 manifest，供查询引擎读取。修改物理表映射时，先看模型源文件，再看编译结果。', 'core/wren/src/wren/context_cli.py#L862-L936'],
  ['Python CLI 与 SDK', 'Typer 负责参数、项目和连接配置；WrenEngine 负责规划与执行。要加一种输出格式，先找 CLI；要改查询行为，先找引擎。', 'core/wren/src/wren/cli.py#L482-L503'],
  ['sqlglot 与 Rust 核心', 'Python 识别模型和列、组合 CTE；PyO3 桥接 Rust SessionContext，展开模型内部语义。先分清逻辑模型内部的展开和整条用户 SQL 的拼装。', 'core/wren/src/wren/mdl/cte_rewriter.py#L1148-L1166'],
  ['Python 与 WASM 两种宿主', 'Python 通过原生扩展使用语义核心；WASM 另行编译同一核心，供浏览器侧应用使用。浏览器路径不是本次 Python 连接器实验的一步。', 'core/wren-core-wasm/Cargo.toml#L49-L63'],
  ['数据库连接器', '引擎在需要执行或数据库校验时才取得连接器。方言 SQL 到这里才交给数据库；查询结果回到 Python 时是 Arrow 表。', 'core/wren/src/wren/engine.py#L155-L190'],
  ['Skills、Memory 与外部集成', 'Skills 描述工作流，Memory 可召回业务规则和已确认问句。LangChain 和 Pydantic AI 有各自适配层；这些都不是手写 SQL 执行的必经步骤。', 'docs/core/reference/architecture.md#memory-layer'],
] as const;

const DECISIONS = [
  ['把可移植业务定义和连接分开', '同一逻辑模型可在不同环境复用；切环境时要重新核对物理映射和数据库权限，而不是把 profile 当成权限证明。', 'core/wren/src/wren/profile.py#L226-L291'],
  ['规划前后都检查 SQL', '输入只出现逻辑模型，不代表展开后的 SQL 也能满足执行约束。模型 ref_sql 和视图定义可以引入输入里没有的内容，所以重写后还有检查。', 'core/wren/src/wren/engine.py#L270-L284'],
  ['模型和视图不走同一条展开分支', '模型交给 Rust 展开；视图的原生 SQL 保留，依赖的模型 CTE 要先生成。追查视图问题时，不能只看 Rust 的模型转换。', 'core/wren/src/wren/mdl/cte_rewriter.py#L1-L12'],
  ['服务侧单独管理查询生命周期', '受控服务用 POSIX 子进程承载查询，主进程可在超时或取消时回收 worker。这个机制不保证远端数据库同时停止，也不是普通 CLI 的行为。', 'core/wren/src/wren/governed_query.py#L1-L32'],
] as const;

const STEP_SLUGS = ['dry-plan', 'dry-run', 'query'] as const;
const DEFAULT_STEP = 2;
const PLAN_HEAD = `${EXPANDED_SQL.split('\n').slice(0, 6).join('\n')}\n…`;

function readStepIndex() {
  const step = new URLSearchParams(window.location.search).get('step');
  const index = STEP_SLUGS.findIndex((slug) => slug === step);
  return index < 0 ? DEFAULT_STEP : index;
}

function CodeKeyboard() {
  useEffect(() => {
    const root = document.getElementById('main');
    if (!root) return;
    const sync = () => {
      root.querySelectorAll<HTMLPreElement>('pre').forEach((pre) => {
        pre.tabIndex = pre.scrollWidth > pre.clientWidth ? 0 : -1;
      });
    };
    const frame = requestAnimationFrame(sync);
    const observer = new MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true });
    window.addEventListener('resize', sync);
    document.fonts?.ready.then(sync).catch(() => {});

    const onKey = (event: KeyboardEvent) => {
      const pre = event.target;
      if (!(pre instanceof HTMLPreElement) || pre.scrollWidth <= pre.clientWidth) return;
      const page = Math.max(40, Math.round(pre.clientWidth * 0.8));
      switch (event.key) {
        case 'ArrowLeft': pre.scrollLeft -= 40; break;
        case 'ArrowRight': pre.scrollLeft += 40; break;
        case 'Home': pre.scrollLeft = 0; break;
        case 'End': pre.scrollLeft = pre.scrollWidth; break;
        case 'PageUp': pre.scrollLeft -= page; break;
        case 'PageDown': pre.scrollLeft += page; break;
        default: return;
      }
      event.preventDefault();
    };
    root.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', sync);
      root.removeEventListener('keydown', onKey);
    };
  }, []);
  return null;
}

function Experiment() {
  const [index, setIndex] = useState(readStepIndex);
  const step = WREN_STEPS[index];
  const folded = step.command === 'dry-plan';

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('step') || window.location.hash) return;
    document.getElementById('experiment')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, []);

  function choose(next: number) {
    setIndex(next);
    const url = new URL(window.location.href);
    url.searchParams.set('step', STEP_SLUGS[next]);
    url.hash = 'experiment';
    window.history.replaceState(window.history.state, '', url);
  }

  return (
    <div className="wren-subsection" id="experiment" aria-labelledby="experiment-title">
      <div className="wren-subsection__head">
        <p className="kicker">05.1 / COMMANDS</p>
        <h3 id="experiment-title">同一句 SQL，三种证据</h3>
        <p className="section__intro">这是三个独立命令的实测记录，不是执行一次查询前必须手动跑的三个步骤。</p>
      </div>
      <div className="workbench__head">
        <span className="workbench__label">FEATURED EVIDENCE / QUERY PLANNING</span>
      </div>
      <fieldset className="wren-switch">
        <legend>选择要查看的命令</legend>
        {WREN_STEPS.map(({ command }, i) => (
          <label key={command}>
            <input type="radio" name="wren-step" checked={index === i} onChange={() => choose(i)} />
            <code>{command}</code>
          </label>
        ))}
      </fieldset>
      <div className="wren-grid wren-result" aria-live="polite">
        <figure className={`wren-code${folded ? ' wren-code--wide' : ''}`}>
          <figcaption><code>wren {step.command}</code> · 退出码 0</figcaption>
          {folded ? (
            <div className="wren-collapsed">
              <p>dry-plan 的输出与上方「实测规划」相同。这里保留前几行，完整结果可直接跳到对应代码块。</p>
              <pre tabIndex={0} aria-label="dry-plan 展开 SQL 摘要"><code>{PLAN_HEAD}</code></pre>
              <a className="text-action" href="#expanded-sql">查看完整展开 SQL</a>
            </div>
          ) : (
            <pre tabIndex={0} aria-label={`${step.command} 实测输出`}><code>{step.output}</code></pre>
          )}
        </figure>
        <dl className="wren-notes">
          <div><dt>证明了什么</dt><dd>{step.proves}</dd></div>
          <div><dt>还不能证明什么</dt><dd>{step.limits}</dd></div>
        </dl>
      </div>
      <p className="wren-links"><a className="text-action" href={WREN_SOURCE.cli}>核对 CLI 入口</a><a className="text-action" href={WREN_SOURCE.duckdb}>核对 DuckDB 的校验</a></p>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SkipLink />
    <Masthead items={NAV} branch="case" />
    <main id="main" className="wrap wren-case">
      <CodeKeyboard />
      <header className="case-head">
        <div className="branch-badge">
          <span className="branch-badge__no">02</span>
          <span className="branch-badge__name">项目拆解 / PROJECT BREAKDOWN</span>
          <span className="branch-badge__hint">项目案例 / WrenAI</span>
        </div>
        <p className="crumb"><a href={PROJECTS_URL}>← 返回项目拆解目录</a> <span className="crumb__sep" aria-hidden="true">/</span>WrenAI</p>
        <h1 className="display">Agent 写了 SQL，<br /><span className="soft">为什么还要经过 Wren？</span></h1>
        <p className="case-lede">要查每位客户下了多少单，SQL 写的是 <code>orders</code>，DuckDB 读的却是 <code>fixture.public.raw_orders</code>。中间这一步，决定了查询按什么模型理解数据。</p>
        <p><a className="text-action" href="#path">跟着 <code>orders</code> 走一遍 ↓</a> <a className="text-action" href="#architecture">看系统架构图 ↓</a></p>
        <p className="case-meta">
          <a href={WREN_COMMIT}>Canner/WrenAI @ 48de0b6 ↗</a>
          <span>wrenai 0.18.0 · wren-core-py 0.8.2 · DuckDB 1.5.0</span>
        </p>
      </header>

      <details className="wren-toc">
        <summary>目录</summary>
        <nav aria-label="本文目录">
          {NAV.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
        </nav>
      </details>

      <WrenWorkbench>
        <section className="wren-subsection" id="architecture" aria-labelledby="wren-architecture-title">
          <div className="wren-subsection__head">
            <h3 id="wren-architecture-title">一次查询经过哪四层？</h3>
          </div>
          <figure className="wren-architecture">
            <img src={site('diagrams/overview.png')} width={2298} height={3710} loading="lazy" alt="CLI 把逻辑 SQL 交给 WrenEngine；MDL 提供模型，profile 提供连接配置，规划后由连接器访问数据库。" />
            <figcaption>LikeC4 · 系统概览。<a className="text-action" href={site('diagrams/index.png')}>放大查看完整架构与标注 ↗</a></figcaption>
          </figure>
          <details className="wren-subsection">
            <summary>模块索引：改动应该落在哪一层？</summary>
            <dl className="wren-notes">
              {MODULES.map(([title, text, path]) => (
                <div key={title}><dt>{title}</dt><dd>{text} <a className="text-action" href={source(path)} aria-label={`核对${title}源码`}>核对源码</a></dd></div>
              ))}
            </dl>
          </details>
        </section>
      </WrenWorkbench>

      <section className="section" id="boundary" aria-labelledby="wren-boundary-title">
        <div className="section__head">
          <p className="kicker">02 / BOUNDARY</p>
          <h2 id="wren-boundary-title">模型定义含义，连接配置选数据库</h2>
        </div>
        <dl className="wren-notes">
          <div><dt>Agent / Skills / Memory</dt><dd>外部 Agent 负责把提问写成 SQL，可用 Skills 和 Memory 找上下文。本次手写 SQL，没有运行自然语言生成或 Memory 检索。</dd></div>
          <div><dt>MDL 与规划</dt><dd>MDL 定义可查询的逻辑模型、字段与物理来源；编译后交给引擎的是 <code>target/mdl.json</code>。实验沿用上游 <code>orders</code> 的字段定义，把来源改成合成数据的 DuckDB 表。</dd></div>
          <div><dt>连接器</dt><dd>连接配置独立于 MDL，决定实际连哪个数据库。Wren 规划后，DuckDB 连接器接收数据源能运行的 SQL。</dd></div>
        </dl>
        <a className="text-action" href={WREN_SOURCE.model}>核对上游 orders 模型的物理来源</a>
      </section>

      <section className="wren-subsection" aria-labelledby="wren-entry-title">
        <h3 id="wren-entry-title">入口不同，执行约束也不同</h3>
        <dl className="wren-notes">
          <div><dt>直接 CLI / Python SDK</dt><dd>本页验证的是显式 <code>query --read-only</code>。CLI 把参数传入引擎，再序列化 Arrow 结果；不经过服务端 worker。 <a className="text-action" href={WREN_SOURCE.cli}>CLI 入口</a></dd></div>
          <div><dt>Governed stdio</dt><dd>宿主指定项目，通过标准输入输出发送类型化请求。查询走受控 worker，子进程用只读模式执行，返回前检查结果大小。 <a className="text-action" href={source('core/wren/src/wren/governed_query.py#L250-L322')}>Worker 实现</a></dd></div>
          <div><dt>Agent Service 与 MCP</dt><dd>Agent Service 注册会话、任务和 SQL 操作；另一个 MCP 模块注册自己的工具。它们不是 CLI 查询的必经环节。 <a className="text-action" href={source('core/wren/src/wren/agent_service.py#L1761-L1825')}>服务操作</a> · <a className="text-action" href={source('core/wren/src/wren/mcp_server.py')}>MCP 注册</a></dd></div>
        </dl>
      </section>

      <section className="section" id="path" aria-labelledby="wren-path-title">
        <div className="section__head">
          <p className="kicker">03 / PATH</p>
          <h2 id="wren-path-title">跟着一条订单查询走源码</h2>
          <p className="section__intro">用同一份三行订单数据，从输入 SQL 走到 DuckDB 的两行结果。每一步都标出代码入口、接收的输入和交给下一步的输出。</p>
        </div>
        <ol className="wren-path-guide">
          <li className="wren-subsection">
            <h3><a href={WREN_SOURCE.cli}>CLI 入口</a>：接收逻辑 SQL</h3>
            <p>要统计每位客户的订单数，输入按 <code>customer_id</code> 分组，只写逻辑模型名 <code>orders</code>。CLI 加载 manifest 和连接配置，把 SQL 与只读选项交给引擎。</p>
            <figure className="wren-code"><figcaption>输入 · 查询逻辑模型 <code>orders</code></figcaption><pre tabIndex={0} aria-label="输入 SQL"><code>{INPUT_SQL}</code></pre></figure>
          </li>
          <li className="wren-subsection">
            <h3><a href={WREN_SOURCE.policy}><code>query()</code></a>：先判断 <code>orders</code> 能不能查</h3>
            <p>只读入口检查 SQL 和模型引用。原始 manifest 有 <code>orders</code>，所以继续规划。仅移除模型再跑，同一条 SQL 在策略检查阶段就被拒绝，物理表仍有三行。<a className="text-action" href="#control">看拒绝对照</a></p>
          </li>
          <li className="wren-subsection">
            <h3><a href={WREN_SOURCE.plan}><code>_plan()</code></a>：把 <code>orders</code> 展开成物理来源</h3>
            <p>规划器保留本次查询所需的模型定义，交给 CTE 重写器。外层分组与计数保留，新增的 CTE 从 <code>fixture.public.raw_orders</code> 取列。下面是 <code>dry-plan</code> 的输出；这一步还没有连 DuckDB。</p>
            <figure className="wren-code wren-code--wide" id="expanded-sql"><figcaption>实测规划 · 展开到物理表，已排版</figcaption><pre tabIndex={0} aria-label="展开后的 SQL"><code>{EXPANDED_SQL}</code></pre></figure>
          </li>
          <li className="wren-subsection">
            <h3><a href={source('core/wren/src/wren/connector/duckdb.py#L80-L103')}>DuckDB 连接器</a>：执行并返回计数</h3>
            <p>连接器收到的是展开后的方言 SQL，不再需要解释 MDL。DuckDB 执行聚合，连接器返回 Arrow 表，CLI 再将它输出为 JSON：客户 101 有两单，202 有一单。<a className="text-action" href="?step=query#experiment">看完整实测输出</a></p>
          </li>
        </ol>
        <p className="wren-links"><a className="text-action" href={site('diagrams/wren-query.html')}>打开 Archify 查询时序图</a></p>
      </section>

      <section className="section" id="source" aria-labelledby="wren-source-title">
        <div className="section__head">
          <p className="kicker">04 / CODE &amp; TRADEOFF</p>
          <h2 id="wren-source-title">为什么不让查询依赖物理表名？</h2>
        </div>
        <div className="wren-grid">
          <figure className="wren-code wren-code--wide">
            <figcaption><code>WrenEngine._plan()</code> · 源码摘录，已压缩换行</figcaption>
            <pre tabIndex={0} aria-label="语义规划源码摘录"><code>{PLAN_EXCERPT}</code></pre>
          </figure>
          <dl className="wren-notes">
            <div><dt>取舍</dt><dd>先按引用取出相关模型定义，再把查询重写成目标方言。相比让 Agent 直接写物理表名，查询可以依赖业务模型；代价是要维护模型与底层数据的对应关系。</dd></div>
            <div><dt>什么时候不够用</dt><dd>规划与执行都能通过，但如果业务上不该统计取消订单，单凭 <code>COUNT(*)</code> 查到的数字仍可能答错问题。</dd></div>
          </dl>
        </div>
        <a className="text-action" href={WREN_SOURCE.plan}>核对固定版本的规划与重写代码</a>
        <dl className="wren-notes wren-decisions">
          {DECISIONS.map(([title, text, path]) => (
            <div key={title}><dt>{title}</dt><dd>{text} <a className="text-action" href={source(path)}>核对源码</a></dd></div>
          ))}
        </dl>
      </section>

      <section className="section" id="evidence" aria-labelledby="wren-evidence-title">
        <div className="section__head">
          <p className="kicker">05 / EVIDENCE</p>
          <h2 id="wren-evidence-title">证据</h2>
          <p className="section__intro">命令实测和负向对照分别证明不同层：一个检查规划，一个检查策略门。</p>
        </div>

        <Experiment />

        <div className="wren-subsection" id="control" aria-labelledby="wren-control-title">
          <div className="wren-subsection__head">
            <p className="kicker">05.2 / CONTROL</p>
            <h3 id="wren-control-title">表还在，为什么查询被拒绝？</h3>
          </div>
          <p className="wren-prose">复制 manifest，只从 <code>models</code> 移除 <code>orders</code>。SQL、DuckDB 连接和 <code>query --read-only</code> 调用都不变，只切换 <code>--mdl</code> 指向的文件。</p>
          <div className="wren-grid wren-control-evidence">
            <figure className="wren-code wren-code--wide">
              <figcaption>manifest 差异 · 只移除 models</figcaption>
              <pre tabIndex={0} aria-label="manifest 差异"><code>{MANIFEST_DIFF}</code></pre>
            </figure>
            <figure className="wren-code">
              <figcaption>直接连接 fixture.duckdb</figcaption>
              <pre tabIndex={0} aria-label="物理表行数"><code>{TABLE_CHECK}</code></pre>
            </figure>
          </div>
          <figure className="wren-code wren-control wren-code--wrap">
            <figcaption>移除模型后的实测输出 · 退出码 1</figcaption>
            <pre tabIndex={0} aria-label="移除模型后的错误"><code>{MODEL_REMOVED}</code></pre>
          </figure>
          <p className="wren-prose">直接在 DuckDB 核对，物理表仍有 3 行。这次是在 <code>SQL_POLICY_CHECK</code> 阶段因模型未定义而拒绝，不是查不到物理表。这个结论限于显式启用的只读查询入口。</p>
          <a className="text-action" href={WREN_SOURCE.policy}>核对只读入口的前置策略检查</a>
        </div>
      </section>

      <section className="section" id="limits" aria-labelledby="wren-limits-title">
        <div className="section__head">
          <p className="kicker">06 / LIMITS</p>
          <h2 id="wren-limits-title">这次证明了什么</h2>
          <p className="section__intro">同一句 <code>orders</code> 查询会展开到物理表；只读入口能返回结果；仅从 manifest 移除模型后，策略层会在执行前拒绝，而物理表仍在。</p>
        </div>
        <p className="wren-prose">这是我对上游开源 WrenAI 的源码学习案例，不是上游官方作品或旧版 GenBI Classic 的拆解。</p>
        <dl className="wren-notes wren-limits">
          <div><dt>没测自然语言生成</dt><dd>没有评估模型把问题写成 SQL 的准确率，本次输入是手写 SQL。</dd></div>
          <div><dt>没测其他连接器与入口</dt><dd>只验证了 DuckDB 和显式启用的 <code>query --read-only</code>，没有覆盖其他连接器或非只读入口的访问限制。</dd></div>
          <div><dt>没测生产性能</dt><dd>没有测延迟、吞吐或真实医保数据，三条合成订单不能代表生产负载。</dd></div>
        </dl>
        <a className="text-action" href="https://wren-ai-learning-dashboard.vercel.app/">延伸：WrenAI 第一周学习看板</a>
      </section>
    </main>
    <Footer left="罗富麟 · 02 项目拆解 / WrenAI" back={{ label: '← 返回项目拆解目录', href: PROJECTS_URL }} />
  </StrictMode>,
);
