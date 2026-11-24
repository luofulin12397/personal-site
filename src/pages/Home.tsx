import Terminal from '../components/Terminal';
import { Footer, Masthead, SkipLink } from '../components/Shell';
import { ABOUT, BRANCH, CRAFT, FACTS, GH, HERO, NOTES, PROJECTS, TRADEOFFS } from '../data/home';

const NAV = [
  { label: '关于我', href: '#about' },
  { label: '项目', href: '#work' },
  { label: '在写', href: '#notes' },
  { label: '取舍', href: '#tradeoffs' },
  { label: '这一页', href: '#craft' },
];

export default function Home() {
  return (
    <>
      <SkipLink />
      <Masthead items={NAV} branch="home" />
      <main id="main" className="wrap">
        <section className="hero" id="top">
          <div className="hero__intro">
            <div>
              <p className="eyebrow"><span>{HERO.eyebrow[0]}</span><span className="x">{HERO.eyebrow[1]}</span><span>{HERO.eyebrow[2]}</span></p>
              <h1 className="display hero__title">
                {HERO.title[0]}<br /><span className="soft">{HERO.title[1]}</span>
              </h1>
              <p className="hero__meta">
                <a href={GH} target="_blank" rel="me noopener">github.com/luofulin12397</a>
                <span className="sep" aria-hidden="true">/</span>
                <span>{HERO.meta}</span>
              </p>
            </div>
            <div>
              <p className="hero__lede">{HERO.lede}</p>
              <a className="primary-action hero__cta" href={BRANCH.href}>
                <span>{BRANCH.cta}</span><span className="arrow" aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <div className="hero__bench">
            <Terminal />
            <div className="bench__aside">
              <p className="bench__label">01 主页 / 从终端开始</p>
              <p className="bench__claim">这个站分两处：<em>这里讲人和项目</em>，02 讲一个系统怎么搭。</p>
              <p className="bench__note">右边这个终端是真的：能敲 <code>help</code>、<code>explain perm</code>、<code>open case</code>，↑↓ 翻历史，Tab 补公共前缀。</p>
              <div className="bench__facts">
                <dl className="facts">
                  {FACTS.map(([n, label]) => <div key={label}><dt>{label}</dt><dd>{n}</dd></div>)}
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* 01 这个人：先讲清楚是谁、在做什么、想分享什么 */}
        <section className="section" id="about">
          <div className="section__head">
            <p className="kicker">{ABOUT.kicker}</p>
            <h2>{ABOUT.title}</h2>
          </div>
          <div className="about__grid">
            <div className="about__paras">
              {ABOUT.paras.map((p) => <p key={p}>{p}</p>)}
            </div>
            <dl className="about__now">
              {ABOUT.now.map((n) => <div key={n.key}><dt>{n.key}</dt><dd>{n.val}</dd></div>)}
            </dl>
          </div>
        </section>

        {/* 02 我做的项目 */}
        <section className="section" id="work">
          <div className="section__head">
            <p className="kicker">02 / WHAT I BUILD</p>
            <h2>我做的项目</h2>
            <p className="section__intro">分布在四个仓库里，另外两个仓库还是空的，就不列了。数字是数出来的，不是估的；点名字进仓库，代码、测试、部署文件都在里面。带拆解的项目另有一条完整主线，讲结构和当时的决定。</p>
          </div>
          <ul>
            {PROJECTS.map((p) => (
              <li className="proj__item" key={p.name}>
                <div>
                  <a className="proj__name" href={p.href} target="_blank" rel="noopener">
                    {p.name}<span className="arrow" aria-hidden="true">↗</span>
                  </a>
                  <p className="proj__lang">{p.lang}</p>
                  {p.path && <p className="proj__path">{p.path}</p>}
                </div>
                <div>
                  <p className="proj__desc">{p.desc}</p>
                  <p className="proj__facts">{p.facts}</p>
                  {p.case && (
                    <a className="proj__case" href={BRANCH.href}>
                      <span className="proj__case-tag">BRANCH 02</span>
                      <span>项目拆解：看边界、决定与源码</span>
                      <span className="arrow" aria-hidden="true">→</span>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 03 在写、想分享的 */}
        <section className="section" id="notes">
          <div className="section__head">
            <p className="kicker">03 / WRITING & NOTES</p>
            <h2>在写，也在分享</h2>
            <p className="section__intro">笔记、实验和正在读的源码。没写完也留着，进度本身就是内容。</p>
          </div>
          <ul className="log">
            {NOTES.map((n) => <li className="log__item" key={n.title}><b>{n.title}</b>：{n.text}</li>)}
          </ul>
        </section>

        {/* 站点级第二条分支：整块入口，不藏在列表的一行小字里 */}
        <section className="section" id="branch">
          <div className="section__head">
            <p className="kicker">{BRANCH.kicker}</p>
            <h2>{BRANCH.eyebrow}</h2>
          </div>
          <div className="branch-entry">
            <div>
              <p className="branch-entry__eyebrow">{BRANCH.note}</p>
              <h3 className="branch-entry__title">{BRANCH.title}</h3>
              <p className="branch-entry__desc">{BRANCH.desc}</p>
              <p className="branch-entry__meta">{BRANCH.meta}</p>
            </div>
            <div className="branch-entry__go">
              <span className="branch-entry__no" aria-hidden="true">02</span>
              <a className="primary-action" href={BRANCH.href}>
                <span>{BRANCH.cta}</span><span className="arrow" aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>

        {/* 04 怎么想：取舍靠后，不再是首页主体 */}
        <section className="section" id="tradeoffs">
          <div className="section__head">
            <p className="kicker">04 / TRADEOFFS</p>
            <h2>四个取舍</h2>
            <p className="section__intro">都来自上面那几个仓库，改动前后的代码都还在。这里只写判断：为什么这么选、什么时候会失效。结构和代码片段放在<a href={BRANCH.href}>02 项目拆解</a>里。</p>
          </div>
          <div className="rows">
            {TRADEOFFS.map((t, i) => (
              <article className="row" key={t.title}>
                <div>
                  <p className="row__no">0{i + 1}</p>
                  <p className="row__tag">{t.tag}</p>
                </div>
                <div>
                  <h3>{t.title}</h3>
                  <dl className="spec">
                    <div><dt>选了</dt><dd>{t.chose}</dd></div>
                    <div><dt>没选</dt><dd>{t.rejected}</dd></div>
                    <div><dt>代价</dt><dd>{t.cost}</dd></div>
                    <div><dt>失效</dt><dd>{t.fails}</dd></div>
                  </dl>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 05 这一页本身 */}
        <section className="section" id="craft">
          <div className="section__head">
            <p className="kicker">05 / HOW THIS PAGE IS BUILT</p>
            <h2>这一页本身</h2>
            <p className="section__intro">React + Vite，没有 CDN，没有外部组件库。两层共用一套组件与色板，源码在 <a href={GH + '/personal-site'} target="_blank" rel="noopener">personal-site</a> 里可以逐行对。</p>
          </div>
          <ul className="craft">
            {CRAFT.map((c) => (
              <li className="craft__item" key={c.key}>
                <p className="craft__key">{c.key}</p>
                <p className="craft__val">{c.val}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer left="罗富麟 · 后端 · 检索与异步系统" />
    </>
  );
}
