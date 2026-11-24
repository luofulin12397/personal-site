import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Footer, Masthead, SkipLink } from './components/Shell';
import { PROJECTS } from './data/home';
import { HOME_URL } from './lib/site';
import './styles/tokens.css';
import './styles/shell.css';
import './styles/home.css';
import './styles/case.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SkipLink />
    <Masthead items={[]} branch="case" />
    <main id="main" className="wrap">
      <header className="case-head">
        <p className="eyebrow">02 / PROJECT BREAKDOWN</p>
        <h1 className="display">项目拆解</h1>
        <p className="section__intro">从实际请求出发，看系统的边界、执行链路和关键取舍。每篇案例都附源码证据。</p>
      </header>
      <section className="section" aria-labelledby="case-list">
        <div className="section__head">
          <h2 id="case-list">案例目录</h2>
        </div>
        <ul>
          {PROJECTS.map(({ name, lang, desc, caseHref }) => caseHref ? (
            <li className="proj__item" key={caseHref}>
              <div>
                <h3><a className="proj__name" href={caseHref}>{name}<span className="arrow" aria-hidden="true">→</span></a></h3>
                <p className="proj__lang">{lang}</p>
              </div>
              <p className="proj__desc">{desc}</p>
            </li>
          ) : null)}
        </ul>
      </section>
    </main>
    <Footer left="罗富麟 · 02 项目拆解" back={{ label: '← 返回 01 主页', href: HOME_URL }} />
  </StrictMode>,
);
