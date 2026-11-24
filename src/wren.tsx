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
  { label: '订单示例', href: '#path' },
  { label: '失败对照', href: '#control' },
  { label: '架构图', href: '#architecture' },
  { label: '动手复现', href: '#evidence' },
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
        <h1 className="display">AI 已经会写 SQL，为什么还需要 WrenAI？</h1>
        <p className="case-lede">WrenAI 让 AI 和应用按业务模型查询数据库，而不是自己猜该查哪张表、用哪些字段。</p>
        <div className="wren-reading">
          <p>假设你问 AI：<strong>每位客户下了多少单？</strong> 我们手上只有三条订单：</p>
          <table className="wren-orders"><thead><tr><th scope="col">订单</th><th scope="col">客户</th></tr></thead><tbody><tr><td>1</td><td>101</td></tr><tr><td>2</td><td>101</td></tr><tr><td>3</td><td>202</td></tr></tbody></table>
          <p>不用写 SQL 就能看出答案：<strong>客户 101 两单，客户 202 一单。</strong></p>
          <p>难点不在怎么数，而在于数什么。这里一行是一笔订单；换成订单明细表，一笔订单可能占好几行，直接数行就错了。下面用手写 SQL 演示 Wren 收到查询后做了什么，不测试 AI 写 SQL 的准确率。</p>
        </div>
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

      <article className="wren-reading" aria-label="订单查询教程">
        <section className="section" id="path">
          <h2 id="boundary">01 / 这条查询要找的 <code>orders</code> 是什么？</h2>
          <p>三条订单存在 DuckDB 的物理表 <code>fixture.public.raw_orders</code>。但交给 Wren 的查询没有写这个名字：</p>
          <figure className="wren-code"><figcaption>输入 SQL · 按客户分组并数行</figcaption><pre tabIndex={0}><code>{INPUT_SQL}</code></pre></figure>
          <p><strong><code>orders</code> 是模型名，不是物理表名。</strong> 模型告诉 Wren 到哪里取数据，以及查询可用哪些字段。Wren 把这类定义称作 MDL。构建后，引擎读取整理好的模型清单（manifest）；连接配置决定连哪个数据库。</p>
          <p><a href={WREN_SOURCE.model}>查看上游模型定义</a></p>
        </section>
        <section className="section" id="policy">
          <h2>02 / 只读入口先检查：<code>orders</code> 有定义吗？</h2>
          <p><a href={WREN_SOURCE.cli}>命令行</a>把 SQL 交给 <a href={WREN_SOURCE.policy}><code>WrenEngine.query()</code></a>。在本例显式开启的只读模式下，引擎检查 SQL，再核对引用的模型。清单里有 <code>orders</code>，所以继续规划。<strong>此时还没去 DuckDB 查订单。</strong></p>
        </section>
        <section className="section" id="source">
          <h2>03 / 让 <code>orders</code> 指向实际取数的地方</h2>
          <p><a href={WREN_SOURCE.plan}><code>_plan()</code></a> 取出本次查询需要的模型定义，交给重写器。先看新增的 <code>WITH orders AS (...)</code>：它从物理表取列。下半段仍按客户分组、数订单。</p>
          <figure className="wren-code wren-code--wide" id="expanded-sql"><figcaption>实测规划输出 · 上半段取数，下半段计数</figcaption><pre tabIndex={0}><code>{EXPANDED_SQL}</code></pre></figure>
          <p><code>dry-plan</code> 到这里就结束了。它没有连接 DuckDB，不能证明查询跑得通。</p>
          <details><summary>查看规划器源码摘录</summary><figure className="wren-code"><pre tabIndex={0}><code>{PLAN_EXCERPT}</code></pre></figure></details>
        </section>
        <section className="section" id="result">
          <h2>04 / DuckDB 真正数了一遍订单</h2>
          <p>Wren 的<a href={source('core/wren/src/wren/connector/duckdb.py#L80-L103')}>连接器</a>把展开后的 SQL 交给 DuckDB。真正读取三条订单、分组并计数的是 DuckDB。结果和开头手数的一样：</p>
          <figure className="wren-code"><figcaption>只读查询实测 · 两行结果</figcaption><pre><code>{WREN_STEPS[2].output}</code></pre></figure>
          <p><strong>Wren 按模型找到数据，DuckDB 执行查询。</strong> 如果业务要求不算取消订单，这条 <code>COUNT(*)</code> 还没有表达那个要求。</p>
          <p><a href={site('diagrams/wren-query.html')}>回看查询时序图</a></p>
        </section>
        <section className="section" id="control">
          <h2>05 / 表还在，为什么同一条查询却失败了？</h2>
          <p>只改一件事：复制模型清单，从副本里删掉 <code>orders</code>。SQL、数据库和三条订单都不变。</p>
          <p><strong>先猜一下：</strong>查询是在 DuckDB 找表时失败，还是在到达 DuckDB 之前停住？</p>
          <p>实测是在<strong>到达 DuckDB 之前</strong>。只读入口在清单里找不到 <code>orders</code>，拒绝继续。<code>MODEL_NOT_FOUND</code> 是「模型没定义」，不是「没有这张表」。绕过 Wren 直接数物理表，仍然是 3 行。</p>
          <details><summary>查看实际改动和两份输出</summary>
            <figure className="wren-code wren-code--wrap"><figcaption>模型清单差异</figcaption><pre><code>{MANIFEST_DIFF}</code></pre></figure>
            <figure className="wren-code wren-code--wrap"><figcaption>只读查询错误</figcaption><pre><code>{MODEL_REMOVED}</code></pre></figure>
            <figure className="wren-code"><figcaption>直接查询物理表</figcaption><pre><code>{TABLE_CHECK}</code></pre></figure>
          </details>
        </section>
        <section className="section" id="limits">
          <h2 id="architecture">06 / 回到全景：这个例子走了哪一段？</h2>
          <p>沿图走一遍：从 CLI 进入 WrenEngine，模型清单和连接配置分别提供输入，最后经连接器到 DuckDB。其他分支可以先略过。</p>
          <figure className="wren-architecture">
            <img src={site('diagrams/overview.png')} width={2298} height={3710} loading="lazy" alt="CLI 将 SQL 交给引擎；模型清单提供数据定义，连接配置指定数据库；引擎规划后由连接器访问数据库。" />
            <figcaption>LikeC4 · 系统概览。<a className="text-action" href={site('diagrams/index.png')}>查看完整架构与标注 ↗</a></figcaption>
          </figure>
          <p>换成 AI 生成 SQL，变化发生在这条路线前面：AI 得先理解问题，再写查询。本例从手写 SQL 开始，只验证直接 CLI 的显式只读入口，不代表 Agent Service、MCP 或其他连接器的行为。</p>
          <p><strong>WrenAI 不替你决定订单数的业务口径；它让查询引用明确的模型，再按模型找到数据，交给数据库执行。</strong></p>
          <p><a href="#workbench">按模块查阅工作台 ↓</a></p>
        </section>
        <section className="section" id="evidence">
          <h2>附录 / 自己动手验证一次</h2>
          <p>先看本地规划，再校验数据库是否接受，最后真正取回订单数。只替换模型清单再查一次，确认失败发生在哪一层。</p>
          <p><a href={site('labs/wren-orders.py')} download>下载三行订单复现实验</a>。在安装 <code>wrenai==0.18.0</code>、<code>wren-core-py==0.8.2</code> 和 <code>duckdb==1.5.0</code> 的 Python 环境运行。第一个参数是新实验目录，第二个参数是检出的<a href={WREN_COMMIT}>上游固定版本</a>目录。</p>
          <figure className="wren-code wren-code--wrap"><pre><code>python wren-orders.py ./orders-lab /path/to/WrenAI</code></pre></figure>
          <Experiment />
        </section>
      </article>
      <WrenWorkbench>
        <details className="wren-subsection">
          <summary>模块索引与源码</summary>
          <dl className="wren-notes">{MODULES.map(([title, text, path]) => (
            <div key={title}><dt>{title}</dt><dd>{text} <a href={source(path)}>核对源码</a></dd></div>
          ))}</dl>
        </details>
      </WrenWorkbench>
    </main>
    <Footer left="罗富麟 · 02 项目拆解 / WrenAI" back={{ label: '← 返回项目拆解目录', href: PROJECTS_URL }} />
  </StrictMode>,
);
