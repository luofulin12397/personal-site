import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Footer, Masthead, SkipLink } from './components/Shell';
import RiskWorkbench from './components/RiskWorkbench';
import { RISK_EVIDENCE, RISK_REPO, VETO_EXCERPT } from './data/risk';
import { PROJECTS_URL } from './lib/site';
import './styles/tokens.css';
import './styles/shell.css';
import './styles/case.css';
import './styles/risk.css';

const NAV = [
  { label: '边界', href: '#boundary' },
  { label: '链路', href: '#pipeline' },
  { label: '代码与取舍', href: '#decision-code' },
  { label: '验证边界', href: '#limits' },
];

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SkipLink />
    <Masthead items={NAV} branch="case" />
    <main id="main" className="wrap">
      <header className="case-head">
        <div className="branch-badge">
          <span className="branch-badge__no">02</span>
          <span className="branch-badge__name">项目拆解 / PROJECT BREAKDOWN</span>
          <span className="branch-badge__hint">项目案例 / AI_RISK_HEALTH</span>
        </div>
        <p className="crumb"><a href={PROJECTS_URL}>← 返回项目拆解目录</a> <span aria-hidden="true">/</span> AI_RISK_HEALTH</p>
        <h1 className="display">医疗风控：<br /><span className="soft">模型打分，谁做决定？</span></h1>
        <p className="section__intro">一笔医保结算触发极高风险规则，模型却给低分。系统会放行，还是拒绝？沿着这笔示例请求，看规则、模型和人分别在哪一步做决定。</p>
        <div className="risk-actions">
          <a className="primary-action" href="#pipeline">跟着一笔医保结算走</a>
          <a className="text-action" href={RISK_REPO}>查看项目源码</a>
        </div>
      </header>

      <section className="section" id="boundary">
        <div className="section__head">
          <h2>换业务，不重写风控骨架</h2>
        </div>
        <div className="boundary">
          <article className="boundary__card boundary__card--focus">
            <h3>医疗业务层</h3>
            <p>负责医保结算、处方审核、挂号和药品代购。场景改变后，业务实体、医疗特征和规则都要重新定义。</p>
          </article>
          <article className="boundary__card">
            <h3>风控核心</h3>
            <p>保留事件、特征、规则、评估与案件等抽象，以及检查请求到决策响应的契约。这里只拆教学系统，不把演示数据当成真实医疗效果。</p>
          </article>
        </div>
        <p className="risk-source"><a className="text-action" href={RISK_EVIDENCE.boundary}>核对项目的复用与重写范围</a></p>
      </section>

      <RiskWorkbench />

      <section className="section" id="decision-code" aria-labelledby="risk-code-title">
        <div className="section__head">
          <h2 id="risk-code-title">为什么一票否决要放在融合之后？</h2>
          <p className="section__intro">提高规则分，再和模型分加权，并不能保证结果仍是「拒绝」。实现先算分、按场景阈值映射决策，再执行硬否决。</p>
        </div>
        <div className="risk-analysis">
          <figure className="risk-excerpt">
            <figcaption>
              <code>app/engine/decision.py</code>
              <span>源码摘录：去掉注释与外层缩进，保留判定顺序。</span>
            </figcaption>
            <pre tabIndex={0} aria-label="双轨融合与硬否决 Python 源码"><code>{VETO_EXCERPT}</code></pre>
          </figure>
          <div>
            <dl className="risk-tradeoff">
              <div><dt>为什么不只改规则分</dt><dd>低模型分仍可能把融合分拉到拒绝线以下。否决是在约束最终动作，不是在给模型打分加一个权重。</dd></div>
              <div><dt>代价与适用边界</dt><dd>配置错的高风险规则也会强制拒绝，低模型分不能纠偏，自动拒绝的案件也不进待审队列。如果某条规则的证据只够提示风险，就不应把它当硬否决；需要的是人工复核，而不是调高或调低融合权重。</dd></div>
            </dl>
            <a className="text-action" href={RISK_EVIDENCE.veto}>核对完整决策函数中的融合与否决</a>
          </div>
        </div>
      </section>

      <section className="section" id="limits" aria-labelledby="risk-limit-title">
        <div className="section__head"><h2 id="risk-limit-title">代码能证明什么，还不能证明什么</h2></div>
        <dl className="risk-tradeoff">
          <div>
            <dt>已知局限：推理失败不等于只走规则</dt>
            <dd>模型没加载时只用规则分；已加载但推理报错时，当前实现返回零概率且仍标记为已加载。如果仍满足融合条件，这个零分就可能拉低最终分。<a className="text-action" href={RISK_EVIDENCE.modelFailure}>核对失败分支</a></dd>
          </div>
          <div>
            <dt>未验证：真实医保业务效果</dt>
            <dd>这是教学项目，本页只解读源码中的行为，不把模拟数据和训练结果当成真实医保场景的误拒率、漏判率或生产性能。</dd>
          </div>
        </dl>
      </section>
    </main>
    <Footer left="罗富麟 · 02 项目拆解 / AI_RISK_HEALTH" back={{ label: '← 返回项目拆解目录', href: PROJECTS_URL }} />
  </StrictMode>,
);
