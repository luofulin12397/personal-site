import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Footer, Masthead, SkipLink } from './components/Shell';
import RiskWorkbench from './components/RiskWorkbench';
import { RISK_REPO } from './data/risk';
import { PROJECTS_URL } from './lib/site';
import './styles/tokens.css';
import './styles/shell.css';
import './styles/case.css';
import './styles/risk.css';

const NAV = [
  { label: '边界', href: '#boundary' },
  { label: '链路', href: '#pipeline' },
];

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SkipLink />
    <Masthead items={NAV} branch="case" />
    <main id="main" className="wrap">
      <header className="case-head">
        <p className="crumb"><a href={PROJECTS_URL}>← 返回项目拆解目录</a></p>
        <p className="eyebrow">02 / AI_RISK_HEALTH</p>
        <h1 className="display">医疗风控：<br /><span className="soft">模型打分，谁做决定？</span></h1>
        <p className="section__intro">复用电商风控的决策骨架，重写医疗业务层。以一笔医保结算为例，拆开规则、XGBoost 和人工审核各自负责什么。</p>
        <p className="risk-source"><a className="text-action" href={RISK_REPO}>AI_RISK_HEALTH 源码 <span aria-hidden="true">↗</span></a></p>
      </header>

      <section className="section" id="boundary">
        <div className="section__head">
          <p className="kicker">01 / BOUNDARY</p>
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
      </section>

      <RiskWorkbench />
    </main>
    <Footer left="罗富麟 · 02 项目拆解 / AI_RISK_HEALTH" back={{ label: '← 返回项目拆解目录', href: PROJECTS_URL }} />
  </StrictMode>,
);
