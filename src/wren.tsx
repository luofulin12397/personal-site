import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Footer, Masthead, SkipLink } from './components/Shell';
import WrenWorkbench from './components/WrenWorkbench';
import {
  EXPANDED_SQL,
  INPUT_SQL,
  MANIFEST_DIFF,
  MODEL_REMOVED,
  PLAN_EXCERPT,
  TABLE_CHECK,
  WREN_COMMIT,
  WREN_DECISIONS,
  WREN_EVIDENCE,
  WREN_SOURCE,
  WREN_STEPS,
} from './data/wren';
import { PROJECTS_URL, site } from './lib/site';
import './styles/tokens.css';
import './styles/shell.css';
import './styles/case.css';
import './styles/wren.css';

const NAV = [
  { label: '工作台', href: '#workbench' },
  { label: '边界', href: '#boundary' },
  { label: '查询链路', href: '#path' },
  { label: '失败对照', href: '#control' },
  { label: '取舍', href: '#decisions' },
  { label: '实测与证据', href: '#evidence' },
];

const STEP_SLUGS = ['dry-plan', 'dry-run', 'query'] as const;
const DEFAULT_STEP = 2;
const PLAN_HEAD = `${EXPANDED_SQL.split('\n').slice(0, 6).join('\n')}\n…`;

const LAB_SETUP = `git clone https://github.com/Canner/WrenAI.git ./WrenAI
git -C ./WrenAI checkout 48de0b6cbd02cbbe3753f29e37f4be24e8a9a7fd
python3 -m venv .venv && . .venv/bin/activate
pip install wrenai==0.18.0 wren-core-py==0.8.2 duckdb==1.5.0
python wren-orders.py ./orders-lab ./WrenAI`;

function readStepIndex() {
  const step = new URLSearchParams(window.location.search).get('step');
  const index = STEP_SLUGS.findIndex((slug) => slug === step);
  return index < 0 ? DEFAULT_STEP : index;
}

function CodeKeyboard() {
  useEffect(() => {
    function syncCodeFocus() {
      document.querySelectorAll<HTMLPreElement>('.wren-code pre').forEach((pre) => {
        if (!pre.getAttribute('aria-label')) {
          const cap = pre.closest('figure')?.querySelector('figcaption')?.textContent?.trim();
          pre.setAttribute('aria-label', cap || '代码或命令输出');
        }
        const scrollable = pre.scrollWidth > pre.clientWidth + 1 || pre.scrollHeight > pre.clientHeight + 1;
        if (scrollable) pre.setAttribute('tabindex', '0');
        else if (!pre.hasAttribute('data-keep-tabindex')) pre.removeAttribute('tabindex');
      });
    }

    syncCodeFocus();
    window.addEventListener('resize', syncCodeFocus);
    document.addEventListener('toggle', syncCodeFocus, true);
    return () => {
      window.removeEventListener('resize', syncCodeFocus);
      document.removeEventListener('toggle', syncCodeFocus, true);
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
    <div className="wren-experiment" id="experiment" aria-labelledby="experiment-title">
      <div className="wren-experiment__bar">
        <div>
          <h3 className="subhead" id="experiment-title">命令对照 · 同一句逻辑 SQL 的三层输出</h3>
          <p className="wren-muted">切换查看本地规划、连接器空跑校验与只读执行各自返回的真实记录。</p>
        </div>
        <fieldset className="wren-switch">
          <legend className="sr-only">选择要查看的命令</legend>
          {WREN_STEPS.map(({ command, summary }, i) => (
            <label key={command}>
              <input type="radio" name="wren-step" checked={index === i} onChange={() => choose(i)} />
              <code>{command}</code>
              <span className="wren-switch__hint">{summary}</span>
            </label>
          ))}
        </fieldset>
      </div>

      <div className="wren-grid wren-result" aria-live="polite">
        <figure className={`wren-code${folded ? ' wren-code--wide' : ''}`}>
          <figcaption>
            <code>wren {step.command}</code> · 退出码 0
          </figcaption>
          {folded ? (
            <div className="wren-collapsed">
              <p>dry-plan 的完整 CTE 已在上方「02 / 查询链路」展开展示；这里保留头部摘要，避免同页重复整段长 SQL。</p>
              <pre data-keep-tabindex tabIndex={0} aria-label="dry-plan 展开 SQL 摘要">
                <code>{PLAN_HEAD}</code>
              </pre>
              <a className="text-action" href="#expanded-sql">跳到完整展开 SQL ↑</a>
            </div>
          ) : (
            <pre data-keep-tabindex tabIndex={0} aria-label={`${step.command} 实测输出`}>
              <code>{step.output}</code>
            </pre>
          )}
        </figure>

        <div className="wren-proof-panel">
          <dl className="wren-notes">
            <div>
              <dt>这一条命令证明了什么</dt>
              <dd>{step.proves}</dd>
            </div>
            <div>
              <dt>它还不能证明什么</dt>
              <dd>{step.limits}</dd>
            </div>
          </dl>
          <p className="wren-links">
            <a className="text-action" href={WREN_SOURCE.cli} target="_blank" rel="noopener">核对 CLI 入口源码 ↗</a>
            <a className="text-action" href={WREN_SOURCE.duckdb} target="_blank" rel="noopener">核对 DuckDB 校验实现 ↗</a>
          </p>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SkipLink />
    <Masthead items={NAV} branch="case" />
    <main id="main" className="wrap wren-case">
      <CodeKeyboard />

      <header className="case-head wren-head">
        <div className="branch-badge">
          <span className="branch-badge__no">02</span>
          <span className="branch-badge__name">项目拆解 / PROJECT BREAKDOWN</span>
          <span className="branch-badge__hint">项目案例 / WrenAI（固定源码 48de0b6）</span>
        </div>

        <div className="wren-head__grid">
          <div className="wren-hero-copy">
            <p className="crumb">
              <a href={PROJECTS_URL}>← 返回项目拆解目录</a>
              <span className="crumb__sep" aria-hidden="true">/</span>
              <span>Canner/WrenAI @ 48de0b6</span>
            </p>
            <h1 className="display">
              AI 会写 SQL，
              <br />
              <span className="soft">为什么还需要 WrenAI？</span>
            </h1>
            <p className="case-lede">
              WrenAI 让 AI 与上层应用面向业务模型（MDL）写查询，而不是自己猜物理表名和关联字段。这一页固定上游提交{' '}
              <code>48de0b6</code>，用本地 DuckDB 的三笔合成订单走完一次显式只读查询，再做单变量删模型对照，拆清模型编译、策略门拦截与连接器执行的真实边界。
            </p>
            <div className="wren-hero-actions">
              <a className="primary-action" href="#workbench">
                查看三泳道系统剖面 <span className="arrow" aria-hidden="true">↓</span>
              </a>
              <a className="text-action" href={WREN_COMMIT} target="_blank" rel="noopener">
                固定版本源码 @ 48de0b6 ↗
              </a>
              <a className="text-action" href="#control">
                直接看删模型失败对照 ↓
              </a>
            </div>
          </div>

          <section className="wren-hero-sample" aria-labelledby="wren-sample-title">
            <div className="map__meta">
              <span>FIXTURE / 3 SYNTHETIC ORDERS</span>
              <span>fixture.public.raw_orders</span>
            </div>
            <div className="wren-hero-sample__body">
              <h2 id="wren-sample-title">实验基准：每位客户下了多少单？</h2>
              <table className="wren-orders" aria-label="三条合成订单样本">
                <thead>
                  <tr>
                    <th scope="col">订单 ID</th>
                    <th scope="col">客户 ID</th>
                    <th scope="col">金额</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>1</td><td>101</td><td>10</td></tr>
                  <tr><td>2</td><td>101</td><td>20</td></tr>
                  <tr><td>3</td><td>202</td><td>30</td></tr>
                </tbody>
              </table>
              <p className="wren-sample-verdict">
                <strong>预期聚合：101 两单，202 一单。</strong>
              </p>
              <p className="wren-sample-note">
                查询只写逻辑模型 <code>FROM orders</code>，不出现物理表名；这里一行恰好是一笔订单，若底层换成订单明细表，直接 <code>COUNT(*)</code> 就会数错。
              </p>
            </div>
          </section>
        </div>
      </header>

      <details className="wren-toc">
        <summary>本文章节目录</summary>
        <nav aria-label="本文目录">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </details>

      <WrenWorkbench />

      <section className="section" id="boundary" aria-labelledby="wren-boundary-title">
        <div className="section__head">
          <p className="kicker">01 / BOUNDARY</p>
          <h2 id="wren-boundary-title">先划边界：业务模型、数据库连接与调用入口</h2>
          <p className="section__intro">
            读懂源码的第一步，是区分「离线编译的语义资产」与「运行期的连接配置和宿主入口」。改物理表映射、换数据库环境、追查调用生命周期，分别落在不同模块。
          </p>
        </div>

        <div className="boundary">
          <article className="boundary__card boundary__card--focus">
            <p className="boundary__tag">PORTABLE SEMANTIC LAYER · 可移植业务定义</p>
            <h3>MDL 源文件与编译清单（manifest）</h3>
            <p>
              模型、关系、视图与度量以文件维护，由 <code>wren context build</code> 编译成引擎加载的{' '}
              <code>target/mdl.json</code>。它规定 <code>orders</code> 去哪张物理表取哪些列，但不存放数据库账号密码，也不直接持有数据。
            </p>
            <p className="boundary__file">examples/v5-jaffle/models/orders/ref_sql.sql · core/wren/src/wren/context_cli.py#L862-L936</p>
          </article>

          <article className="boundary__card">
            <p className="boundary__tag">RUNTIME &amp; ENTRYPOINTS · 连接与三类调用入口</p>
            <h3>直接 CLI、受控 Worker 与服务接口分开</h3>
            <p>
              <code>profile</code> 决定连哪个库。本页实测走显式 <code>wren query --read-only</code> 进程内调用引擎；宿主集成的{' '}
              <code>governed stdio</code> 用独立子进程做只读与结果体积门控；<code>Agent Service</code> 与 <code>MCP</code> 则注册各自的服务操作与工具，不是 CLI 查询的必经环节。
            </p>
            <p className="boundary__file">core/wren/src/wren/cli.py#L481-L607 · governed_query.py#L250-L322 · mcp_server.py</p>
          </article>
        </div>

        <div className="infra">
          <span className="infra__label">同一语义核心的周边模块</span>
          <ul>
            <li>wren-core-py（Python PyO3 原生扩展）</li>
            <li>wren-core-wasm（浏览器端编译产物，本例未涉及）</li>
            <li>wren-context-loader（投影 Warble 上下文与血缘图，不执行查询）</li>
            <li>Skills / Memory（上层 Agent 可选检索层）</li>
          </ul>
        </div>
      </section>

      <section className="section" id="path" aria-labelledby="wren-path-title">
        <div className="section__head">
          <p className="kicker">02 / QUERY PATH</p>
          <h2 id="wren-path-title">一条订单查询穿过四站：从逻辑模型到物理表计数</h2>
          <p className="section__intro">
            固定输入那句按客户分组计数的 SQL，左边按执行顺序追踪它在 CLI、策略门、重写器和 DuckDB 连接器里的职责，右边对照输入语句、展开后的 CTE 与规划器核心源码。
          </p>
        </div>

        <div className="wren-trace-grid">
          <div className="wren-trace-left">
            <ol className="notes wren-trace-notes">
              <li className="note">
                <span className="note__mark" aria-hidden="true">01</span>
                <div>
                  <h3>输入逻辑 SQL · 只认模型名 orders</h3>
                  <p>
                    交给命令行的查询只写 <code>FROM orders</code>，不暴露底层库名与物理表名{' '}
                    <code>fixture.public.raw_orders</code>。{' '}
                    <a className="text-action" href={WREN_SOURCE.model} target="_blank" rel="noopener">查看上游模型定义 ↗</a>
                  </p>
                </div>
              </li>

              <li className="note wren-anchor-target" id="policy">
                <span className="note__mark" aria-hidden="true">02</span>
                <div>
                  <h3>规划前策略门 · 连库前核对模型清单</h3>
                  <p>
                    在显式开启的 <code>--read-only</code> 模式下，<code>WrenEngine.query()</code> 先拦截写语句和带库/目录前缀的表引用，再核对{' '}
                    <code>orders</code> 是否在 manifest 中声明。<strong>此时尚未连接 DuckDB。</strong>{' '}
                    <a className="text-action" href={WREN_SOURCE.policy} target="_blank" rel="noopener">核对策略入口 ↗</a>
                  </p>
                </div>
              </li>

              <li className="note wren-anchor-target" id="source">
                <span className="note__mark" aria-hidden="true">03</span>
                <div>
                  <h3>裁剪清单并重写 CTE · 映射到底层物理表</h3>
                  <p>
                    <code>_plan()</code> 提取本次查询引用的模型子集，经 <code>CTERewriter</code> 与 Rust 核心生成{' '}
                    <code>WITH orders AS (...)</code>，并对生成的方言 SQL 再做一次策略复检。<code>dry-plan</code> 到此即止，不连数据库。{' '}
                    <a className="text-action" href={WREN_SOURCE.plan} target="_blank" rel="noopener">核对 _plan() ↗</a>
                  </p>
                </div>
              </li>

              <li className="note wren-anchor-target" id="result">
                <span className="note__mark" aria-hidden="true">04</span>
                <div>
                  <h3>DuckDB 连接器执行 · 真正读表并聚合返回</h3>
                  <p>
                    直到 <code>dry-run</code> 或 <code>query</code> 阶段，引擎才加载连接器访问 DuckDB，算出{' '}
                    <code>101 → 2</code>、<code>202 → 1</code>。<strong>Wren 负责按模型找数，DuckDB 负责执行计算；</strong>至于「取消单算不算一单」，仍需模型显式定义过滤口径。{' '}
                    <a className="text-action" href={WREN_SOURCE.duckdbExec} target="_blank" rel="noopener">核对连接器 ↗</a>
                  </p>
                </div>
              </li>
            </ol>

            <div className="wren-diagram-card wren-anchor-target" id="architecture">
              <p className="boundary__tag">ARCHITECTURE ARTIFACTS · 原尺寸外部图示</p>
              <h3>对照完整模块边界与一次查询的调用时序</h3>
              <p>
                不在正文窄栏里硬塞缩小的竖版导出位图；需要核查跨模块调用顺序或完整系统容器关系时，直接在新标签页打开原尺寸图示。
              </p>
              <div className="wren-links">
                <a className="text-action" href={site('diagrams/wren-query.html')} target="_blank" rel="noopener">
                  打开 Archify 查询调用时序图（SVG）↗
                </a>
                <a className="text-action" href={site('diagrams/overview.png')} target="_blank" rel="noopener">
                  打开 LikeC4 系统概览图 ↗
                </a>
                <a className="text-action" href={site('diagrams/index.png')} target="_blank" rel="noopener">
                  打开 LikeC4 完整架构图 ↗
                </a>
              </div>
            </div>
          </div>

          <div className="wren-sql-stack">
            <figure className="wren-code">
              <figcaption>
                <span>01 · 输入逻辑 SQL（引用模型 orders）</span>
              </figcaption>
              <pre data-keep-tabindex tabIndex={0} aria-label="输入逻辑 SQL：按客户分组并数行">
                <code>{INPUT_SQL}</code>
              </pre>
            </figure>

            <figure className="wren-code wren-code--wide wren-anchor-target" id="expanded-sql">
              <figcaption className="wren-code__cap">
                <span>02 · dry-plan 实测展开输出（上半段物理表 CTE，下半段聚合）</span>
                <a href="#experiment">跳到命令切换 ↓</a>
              </figcaption>
              <pre data-keep-tabindex tabIndex={0} aria-label="实测规划输出：完整展开 SQL">
                <code>{EXPANDED_SQL}</code>
              </pre>
            </figure>

            <figure className="wren-code">
              <figcaption className="wren-code__cap">
                <code>core/wren/src/wren/engine.py · _plan()</code>
                <a href={WREN_SOURCE.plan} target="_blank" rel="noopener">查看完整函数 ↗</a>
              </figcaption>
              <pre data-keep-tabindex tabIndex={0} aria-label="WrenEngine _plan 规划器源码摘录">
                <code>{PLAN_EXCERPT}</code>
              </pre>
            </figure>
          </div>
        </div>
      </section>

      <section className="section" id="control" aria-labelledby="wren-control-title">
        <div className="section__head">
          <p className="kicker">03 / FAILURE CONTROL</p>
          <h2 id="wren-control-title">单变量对照：物理表还在，为什么删掉模型就失败了？</h2>
          <p className="section__intro">
            保持查询语句、DuckDB 文件和三条合成订单完全不变，仅复制一份 <code>mdl-without-orders.json</code> 把{' '}
            <code>orders</code> 模型清空，验证拦截点究竟在数据库层还是引擎策略门。
          </p>
        </div>

        <div className="wren-control-spread">
          <div className="wren-control-summary">
            <dl className="wren-control-pair" aria-label="失败对照结果摘要">
              <div className="wren-control-card wren-control-card--blocked">
                <dt>
                  <span className="wren-pill wren-pill--blocked">BLOCKED BEFORE DB</span>
                  经 Wren 显式只读入口（移除 <code>orders</code> 模型）
                </dt>
                <dd>
                  返回 <code>SQL_POLICY_CHECK · MODEL_NOT_FOUND</code>，退出码 <code>1</code>。引擎在模型清单里找不到{' '}
                  <code>orders</code>，<strong>在建立 DuckDB 连接之前直接拒绝</strong>，不进入 CTE 重写与连接器执行。
                </dd>
              </div>

              <div className="wren-control-card">
                <dt>
                  <span className="wren-pill">DIRECT DB CHECK</span>
                  绕过 Wren 直查同一 DuckDB 物理表
                </dt>
                <dd>
                  直接执行 <code>SELECT COUNT(*) FROM public.raw_orders</code> 仍返回 <code>3</code>。说明{' '}
                  <code>MODEL_NOT_FOUND</code> 是「语义清单未声明该模型」，而不是「数据库里没这张表」。
                </dd>
              </div>
            </dl>

            <p className="wren-recovery">
              <strong>恢复方式：</strong>实验只改动副本 <code>mdl-without-orders.json</code>；把命令参数切回原编译产物{' '}
              <code>--mdl target/mdl.json</code> 即可立即恢复正常查询。
            </p>
          </div>

          <div className="wren-control-outputs">
            <figure className="wren-code wren-code--wrap">
              <figcaption>单变量改动 · mdl-without-orders.json</figcaption>
              <pre data-keep-tabindex tabIndex={0} aria-label="模型清单单变量改动差异">
                <code>{MANIFEST_DIFF}</code>
              </pre>
            </figure>

            <figure className="wren-code wren-code--wrap">
              <figcaption>经 Wren 只读入口报错输出 · phase=SQL_POLICY_CHECK</figcaption>
              <pre data-keep-tabindex tabIndex={0} aria-label="只读查询 MODEL_NOT_FOUND 报错输出">
                <code>{MODEL_REMOVED}</code>
              </pre>
            </figure>

            <figure className="wren-code wren-code--wrap">
              <figcaption>绕过 Wren 直查 DuckDB 物理表输出</figcaption>
              <pre data-keep-tabindex tabIndex={0} aria-label="DuckDB 直接查询物理表输出">
                <code>{TABLE_CHECK}</code>
              </pre>
            </figure>
          </div>
        </div>
      </section>

      <section className="section" id="decisions" aria-labelledby="wren-decisions-title">
        <div className="section__head">
          <p className="kicker">04 / DECISIONS</p>
          <h2 id="wren-decisions-title">四个源码设计取舍，以及什么时候会失效</h2>
          <p className="section__intro">
            沿着固定提交 <code>48de0b6</code> 的实现边界，整理出四个直接影响使用和排障的工程决定，每条同时记录收益与失效条件。
          </p>
        </div>

        <div className="rows">
          {WREN_DECISIONS.map((item) => (
            <article className="row" key={item.no}>
              <div>
                <p className="row__no">{item.no}</p>
                <p className="row__tag">{item.tag}</p>
              </div>
              <div>
                <h3>{item.title}</h3>
                <p className="row__text">{item.text}</p>
                <p className="row__fail">{item.fail}</p>
                <p className="wren-row-link">
                  <a className="text-action" href={item.href} target="_blank" rel="noopener">
                    核对源码：{item.sourceLabel} ↗
                  </a>
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="evidence" aria-labelledby="wren-evidence-title">
        <div className="section__head">
          <p className="kicker">05 / EVIDENCE &amp; LAB</p>
          <h2 id="wren-evidence-title">三条命令实测记录、复现脚本与源码定位</h2>
          <p className="section__intro">
            先对照 <code>dry-plan</code>、<code>dry-run</code> 与 <code>query --read-only</code> 的实测输出，再用独立 Python 脚本在本地一键重跑整套正向与删模型对照。
          </p>
        </div>

        <Experiment />

        <div className="wren-lab-spread">
          <div className="wren-lab-box">
            <div className="wren-lab-box__head">
              <div>
                <p className="boundary__tag">REPRODUCIBLE DUCKDB LAB · 本地复现</p>
                <h3>五步重跑三笔订单与删模型对照</h3>
              </div>
              <a className="text-action" href={site('labs/wren-orders.py')} download>
                下载 wren-orders.py ↓
              </a>
            </div>
            <p className="wren-muted">
              脚本在全新目录创建本地 DuckDB 表与临时配置，不污染现有环境。重跑时请传入一个不存在的新实验目录名（或先删除旧的{' '}
              <code>./orders-lab</code>）。
            </p>
            <figure className="wren-code">
              <figcaption>固定提交检出、依赖版本与执行命令</figcaption>
              <pre data-keep-tabindex tabIndex={0} aria-label="固定版本检出与虚拟环境安装运行命令">
                <code>{LAB_SETUP}</code>
              </pre>
            </figure>
            <p className="wren-muted">
              预期依次输出：<code>wren context [0]</code>、<code>wren dry-plan [0]</code>、<code>wren dry-run [0]</code>、<code>wren query [0]</code>，删模型对照{' '}
              <code>wren query [1]</code>，以及末尾 <code>Control check: public.raw_orders still exists with 3 rows.</code>
            </p>
          </div>

          <div className="wren-evidence-col">
            <h3 className="subhead">关键源码索引 · Canner/WrenAI @ 48de0b6</h3>
            <ul className="evidence">
              {WREN_EVIDENCE.map((item) => (
                <li key={item.no}>
                  <a href={item.href} target="_blank" rel="noopener">
                    <span className="evidence__no">{item.no}</span>
                    <span className="evidence__body">
                      <strong>{item.title}</strong>
                      <small>{item.path}</small>
                    </span>
                    <i aria-hidden="true">↗</i>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section" id="limits" aria-labelledby="wren-limits-title">
        <div className="section__head">
          <p className="kicker">06 / LIMITS</p>
          <h2 id="wren-limits-title">这份拆解能证明什么，还不能证明什么</h2>
          <p className="section__intro">
            明确区分本地实测证据、源码静态核对与未覆盖范围，不用最小合成实验暗示完整生产表现。
          </p>
        </div>

        <div className="wren-limits-grid">
          <article className="boundary__card">
            <p className="boundary__tag">VERIFIED SCOPE · 已实测范围</p>
            <h3>仅实测显式 CLI 只读入口 + 本地 DuckDB</h3>
            <p>
              命令输出与错误码均采自本地 DuckDB 三行合成数据的显式 <code>wren query --read-only</code>。不代表非只读默认入口、<code>governed stdio</code> 子进程回收、<code>Agent Service</code>、<code>MCP</code> 或其他数据库方言连接器的运行期表现。
            </p>
          </article>

          <article className="boundary__card">
            <p className="boundary__tag">UNVERIFIED · 未评测环节</p>
            <h3>不评测自然语言生成 SQL 的召回与业务口径</h3>
            <p>
              本页从固定手写逻辑 SQL 出发追踪引擎内部链路，没有跑自然语言转 SQL 评测集，也不替具体业务决定「取消单或退货单是否计入订单数」。
            </p>
          </article>

          <article className="boundary__card">
            <p className="boundary__tag">SOURCE SNAPSHOT · 源码快照边界</p>
            <h3>固定上游 48de0b6 的学习拆解</h3>
            <p>
              架构说明与行号对应上游 <code>Canner/WrenAI</code> 提交 <code>48de0b6</code> 的核心语义引擎与 CLI 模块（基于 59 条已核对源码记录，未声称覆盖全仓 786 个文件），不是官方产品文档，也不对应旧版 GenBI Classic。
            </p>
          </article>
        </div>
      </section>
    </main>
    <Footer left="罗富麟 · 02 项目拆解 / WrenAI" back={{ label: '← 返回项目拆解目录', href: PROJECTS_URL }} />
  </StrictMode>,
);
