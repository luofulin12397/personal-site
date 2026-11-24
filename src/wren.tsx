import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Footer, Masthead, SkipLink } from './components/Shell';
import { EXPANDED_SQL, INPUT_SQL, MODEL_REMOVED, PLAN_EXCERPT, WREN_COMMIT, WREN_SOURCE, WREN_STEPS } from './data/wren';
import { PROJECTS_URL } from './lib/site';
import './styles/tokens.css';
import './styles/shell.css';
import './styles/case.css';
import './styles/wren.css';

const NAV = [
  { label: '查询', href: '#query' },
  { label: '边界', href: '#boundary' },
  { label: '实测', href: '#experiment' },
  { label: '对照', href: '#control' },
  { label: '源码', href: '#source' },
];

function Experiment() {
  const [index, setIndex] = useState(0);
  const step = WREN_STEPS[index];
  return (
    <section className="section workbench" id="experiment" aria-labelledby="experiment-title">
      <div className="section__head">
        <h2 id="experiment-title">同一句 SQL，三种证据</h2>
        <p className="section__intro">这是三个独立命令的实测记录，不是执行一次查询前必须手动跑的三个步骤。</p>
      </div>
      <div className="workbench__head">
        <span className="workbench__label">FEATURED EVIDENCE / QUERY PLANNING</span>
      </div>
      <fieldset className="wren-switch">
        <legend>选择要查看的命令</legend>
        {WREN_STEPS.map(({ command }, i) => (
          <label key={command}>
            <input type="radio" name="wren-step" checked={index === i} onChange={() => setIndex(i)} />
            <code>{command}</code>
          </label>
        ))}
      </fieldset>
      <div className="wren-grid wren-result" aria-live="polite">
        <figure className="wren-code">
          <figcaption><code>wren {step.command}</code> · 退出码 0</figcaption>
          <pre tabIndex={0} aria-label={`${step.command} 实测输出`}><code>{step.output}</code></pre>
        </figure>
        <dl className="wren-notes">
          <div><dt>证明了什么</dt><dd>{step.proves}</dd></div>
          <div><dt>还不能证明什么</dt><dd>{step.limits}</dd></div>
        </dl>
      </div>
      <p className="wren-links"><a className="text-action" href={WREN_SOURCE.cli}>核对 CLI 入口</a><a className="text-action" href={WREN_SOURCE.duckdb}>核对 DuckDB 的校验</a></p>
    </section>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SkipLink />
    <Masthead items={NAV} branch="case" />
    <main id="main" className="wrap wren-case">
      <header className="case-head">
        <div className="branch-badge">
          <span className="branch-badge__no">02</span>
          <span className="branch-badge__name">项目拆解 / PROJECT BREAKDOWN</span>
          <span className="branch-badge__hint">项目案例 / WrenAI</span>
        </div>
        <p className="crumb"><a href={PROJECTS_URL}>← 返回项目拆解目录</a> <span className="crumb__sep" aria-hidden="true">/</span>WrenAI</p>
        <h1 className="display">Agent 写了 SQL，<br /><span className="soft">为什么还要经过 Wren？</span></h1>
        <p className="case-lede">要查每位客户下了多少单，SQL 写的是 <code>orders</code>，DuckDB 读的却是 <code>fixture.public.raw_orders</code>。中间这一步，决定了查询按什么模型理解数据。</p>
        <p className="case-meta">
          <a href={WREN_COMMIT}>Canner/WrenAI @ 48de0b6 ↗</a>
          <span>wrenai 0.18.0 · wren-core-py 0.8.2 · DuckDB 1.5.0</span>
        </p>
      </header>

      <section className="section" id="query" aria-labelledby="wren-query-title">
        <div className="section__head">
          <h2 id="wren-query-title">同一条查询，两种写法</h2>
          <p className="section__intro">Agent 先写面向逻辑模型的 SQL；Wren 按 MDL 展开，DuckDB 才看到物理表。</p>
        </div>
        <ol className="wren-flow" aria-label="订单查询链路">
          <li>Agent 写模型 SQL</li><li>Wren 按 MDL 展开</li><li>DuckDB 执行</li>
        </ol>
        <div className="wren-grid">
          <figure className="wren-code"><figcaption>输入 · 查询逻辑模型 <code>orders</code></figcaption><pre tabIndex={0} aria-label="输入 SQL"><code>{INPUT_SQL}</code></pre></figure>
          <figure className="wren-code"><figcaption>实测规划 · 展开到物理表，已排版</figcaption><pre tabIndex={0} aria-label="展开后的 SQL"><code>{EXPANDED_SQL}</code></pre></figure>
        </div>
      </section>

      <section className="section" id="boundary" aria-labelledby="wren-boundary-title">
        <div className="section__head"><h2 id="wren-boundary-title">模型定义含义，连接配置选数据库</h2></div>
        <dl className="wren-notes">
          <div><dt>Agent / Skills / Memory</dt><dd>外部 Agent 负责把提问写成 SQL，可用 Skills 和 Memory 找上下文。本次手写 SQL，没有运行自然语言生成或 Memory 检索。</dd></div>
          <div><dt>MDL 与规划</dt><dd>MDL 定义可查询的逻辑模型、字段与物理来源；编译后交给引擎的是 <code>target/mdl.json</code>。实验沿用上游 <code>orders</code> 的字段定义，把来源改成合成数据的 DuckDB 表。</dd></div>
          <div><dt>连接器</dt><dd>连接配置独立于 MDL，决定实际连哪个数据库。Wren 规划后，DuckDB 连接器接收数据源能运行的 SQL。</dd></div>
        </dl>
        <a className="text-action" href={WREN_SOURCE.model}>核对上游 orders 模型的物理来源</a>
      </section>

      <Experiment />

      <section className="section" id="control" aria-labelledby="wren-control-title">
        <div className="section__head"><h2 id="wren-control-title">表还在，为什么查询被拒绝？</h2></div>
        <p className="wren-prose">复制 manifest，只从 <code>models</code> 移除 <code>orders</code>。SQL、DuckDB 连接和 <code>query --read-only</code> 调用都不变，只切换 <code>--mdl</code> 指向的文件。</p>
        <figure className="wren-code wren-control">
          <figcaption>移除模型后的实测输出 · 退出码 1</figcaption>
          <pre tabIndex={0} aria-label="移除模型后的错误"><code>{MODEL_REMOVED}</code></pre>
        </figure>
        <p className="wren-prose">直接在 DuckDB 核对，物理表仍有 3 行。这次是在 <code>SQL_POLICY_CHECK</code> 阶段因模型未定义而拒绝，不是查不到物理表。这个结论限于显式启用的只读查询入口。</p>
        <a className="text-action" href={WREN_SOURCE.policy}>核对只读入口的前置策略检查</a>
      </section>

      <section className="section" id="source" aria-labelledby="wren-source-title">
        <div className="section__head"><h2 id="wren-source-title">为什么不让查询依赖物理表名？</h2></div>
        <div className="wren-grid">
          <figure className="wren-code">
            <figcaption><code>WrenEngine._plan()</code> · 源码摘录，已压缩换行</figcaption>
            <pre tabIndex={0} aria-label="语义规划源码摘录"><code>{PLAN_EXCERPT}</code></pre>
          </figure>
          <dl className="wren-notes">
            <div><dt>取舍</dt><dd>先按引用取出相关模型定义，再把查询重写成目标方言。相比让 Agent 直接写物理表名，查询可以依赖业务模型；代价是要维护模型与底层数据的对应关系。</dd></div>
            <div><dt>什么时候不够用</dt><dd>规划与执行都能通过，但如果业务上不该统计取消订单，单凭 <code>COUNT(*)</code> 查到的数字仍可能答错问题。</dd></div>
          </dl>
        </div>
        <a className="text-action" href={WREN_SOURCE.plan}>核对固定版本的规划与重写代码</a>
      </section>

      <section className="section" id="limits" aria-labelledby="wren-limits-title">
        <div className="section__head"><h2 id="wren-limits-title">这次实验没有验证什么</h2></div>
        <p className="wren-prose">这是作者对上游开源 WrenAI 的源码学习案例，不是上游官方作品或旧版 GenBI Classic 的拆解。实验仅使用手写 SQL、三条合成订单和一个 DuckDB 连接；没有测自然语言生成准确率、其他连接器、生产性能或所有入口的访问限制。</p>
        <a className="text-action" href="https://wren-ai-learning-dashboard.vercel.app/">延伸：WrenAI 第一周学习看板</a>
      </section>
    </main>
    <Footer left="罗富麟 · 02 项目拆解 / WrenAI" back={{ label: '← 返回项目拆解目录', href: PROJECTS_URL }} />
  </StrictMode>,
);
