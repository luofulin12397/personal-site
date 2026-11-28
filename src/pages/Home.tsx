import Terminal from '../components/Terminal';
import { Footer, Masthead, SkipLink } from '../components/Shell';
import { ABOUT, CRAFT, FACTS, GH, HERO, PROJECTS, SECTIONS, TRADEOFFS, type Project } from '../data/home';
import { ARTICLES, LEARNING_RESOURCES, QUEUE, charCount, readingMinutes } from '../data/writing';
import { PROJECTS_URL, WRITING_URL, articleUrl } from '../lib/site';

const NAV = [
  { label: '关于我', href: '#about' },
  { label: '项目', href: '#work' },
  { label: '在写', href: '#notes' },
  { label: '取舍', href: '#tradeoffs' },
  { label: '这一页', href: '#craft' },
];

/* 项目条目按「有没有完整拆解」分两组；渲染形状同一条 A 骨架横行。 */
const WITH_CASE = PROJECTS.filter((p) => p.caseHref);
const OTHER = PROJECTS.filter((p) => !p.caseHref);

function ProjectRow({ p, compact = false }: { p: Project; compact?: boolean }) {
  return (
    <li className={compact ? 'proj__item proj__item--compact' : 'proj__item'}>
      <div>
        <a className="proj__name" href={p.href} target="_blank" rel="noopener">
          {p.name}<span className="arrow" aria-hidden="true">↗</span>
        </a>
        {p.tag && <p className="proj__tag">{p.tag}</p>}
        <p className="proj__lang">{p.lang}</p>
        {p.path && <p className="proj__path">{p.path}</p>}
      </div>
      <div>
        <p className="proj__desc">{p.desc}</p>
        <p className="proj__facts">{p.facts}</p>
        {p.caseHref && (
          <a className="proj__case" href={p.caseHref}>
            <span className="proj__case-tag">BRANCH 02</span>
            <span>项目拆解：看边界、决定与源码</span>
            <span className="arrow" aria-hidden="true">→</span>
          </a>
        )}
      </div>
    </li>
  );
}

export default function Home() {
  return (
    <>
      <SkipLink />
      <Masthead items={NAV} branch="home" />
      <main id="main" className="wrap">
        {/* 首屏：名字、命题、唯一主 CTA、三个分区索引。终端移到第 4 个区块。 */}
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
            <div className="hero__aside">
              <p className="hero__lede">{HERO.lede}</p>
              <a className="primary-action hero__cta" href={PROJECTS_URL}>
                <span>{HERO.cta}</span><span className="arrow" aria-hidden="true">↗</span>
              </a>
              <ul className="hero__index">
                {SECTIONS.map((s) => (
                  <li className="hero__index-item" key={s.no}>
                    <span className="hero__index-no">{s.no}</span>
                    <span className="hero__index-body">
                      <span className="hero__index-label">{s.label}</span>
                      <span className="hero__index-desc">{s.desc}</span>
                    </span>
                    <a className="hero__index-link" href={s.href}>
                      {s.cta}<span className="arrow" aria-hidden="true">→</span>
                    </a>
                  </li>
                ))}
              </ul>
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

        {/* 02 项目：有拆解的在前，其余仓库紧凑横行 */}
        <section className="section" id="work">
          <div className="section__head">
            <p className="kicker">02 / WHAT I BUILD</p>
            <h2>我做的项目</h2>
            <p className="section__intro">六个公开仓库，三个带完整拆解。WrenAI 是对上游 Canner/WrenAI 固定提交的源码学习，不算我的仓库；名字点进去是仓库，带拆解的项目另有一条从边界到源码的主线。</p>
          </div>

          <div className="proj__group">
            <p className="subhead">有完整拆解 · {WITH_CASE.length}</p>
            <ul>
              {WITH_CASE.map((p) => <ProjectRow key={p.name} p={p} />)}
            </ul>
          </div>

          <div className="proj__group">
            <p className="subhead">其余仓库 · {OTHER.length}</p>
            <ul>
              {OTHER.map((p) => <ProjectRow key={p.name} p={p} compact />)}
            </ul>
          </div>
        </section>

        {/* 03 在写与分享：直接由 03 的数据渲染，不在首页维护第二份清单 */}
        <section className="section" id="notes">
          <div className="section__head">
            <p className="kicker">03 / WRITING &amp; NOTES</p>
            <h2>在写，也在分享</h2>
            <p className="section__intro">成篇的在<a href={WRITING_URL}>03 文章</a>里有全文；学习资源是已经能打开的东西；没成篇的只在这里留一句进度，不装作完成。</p>
          </div>

          <div className="notes__group">
            <p className="subhead">已成篇 · {ARTICLES.length}</p>
            <ul className="log">
              {ARTICLES.map((a) => (
                <li className="log__item" key={a.slug}>
                  <a className="log__link" href={articleUrl(a.slug)}>
                    <b>{a.title}</b>
                    <span className="log__go">读全文 <span className="arrow" aria-hidden="true">→</span></span>
                  </a>
                  <p className="log__judge">{a.takeaway}</p>
                  <p className="log__meta">{a.kicker} · {charCount(a)} 字 · 约 {readingMinutes(a)} 分钟</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="notes__group">
            <p className="subhead">学习资源 · {LEARNING_RESOURCES.length}</p>
            <ul className="log">
              {LEARNING_RESOURCES.map((r) => (
                <li className="log__item" key={r.title}>
                  <a className="log__link" href={r.primary.href} target="_blank" rel="noopener">
                    <b>{r.title}</b>
                    <span className="log__go">{r.primary.label} <span className="arrow" aria-hidden="true">↗</span></span>
                  </a>
                  <p className="log__meta">{r.kind}</p>
                  <p className="log__judge">{r.description}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="notes__group">
            <p className="subhead">排队中 · {QUEUE.length}</p>
            <ul className="log">
              {QUEUE.map((q) => (
                <li className="log__item" key={q.title}>
                  <span className="log__queue-text"><b>{q.title}</b>：{q.note}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="log__more">
            <a className="text-action" href={WRITING_URL}>03 文章 · 目录与排队中 <span className="arrow" aria-hidden="true">↗</span></a>
          </p>
        </section>

        {/* 真终端：从首屏移到第 4 位，说明里的方位写对 */}
        <section className="section" id="terminal">
          <div className="section__head">
            <p className="kicker">TERMINAL / LIVE COMMANDS</p>
            <h2>会跑的命令行</h2>
          </div>
          <div className="term-section">
            <Terminal />
            <div className="term-section__aside">
              <p className="term-section__label">01 主页 / 从这里开始</p>
              <p className="term-section__claim">这个站分三处：<em>这里讲人和项目</em>，02 讲一个系统怎么搭，03 放我读和写的东西。</p>
              <p className="term-section__note">左边这个终端是真的：能敲 <code>help</code>、<code>explain perm</code>、<code>open case</code>，↑↓ 翻历史，Tab 补公共前缀。</p>
              <dl className="facts">
                {FACTS.map(([n, label]) => <div key={label}><dt>{label}</dt><dd>{n}</dd></div>)}
              </dl>
            </div>
          </div>
        </section>

        {/* 04 怎么想：取舍靠后，不再是首页主体 */}
        <section className="section" id="tradeoffs">
          <div className="section__head">
            <p className="kicker">04 / TRADEOFFS</p>
            <h2>四个取舍</h2>
            <p className="section__intro">都来自上面那几个仓库，改动前后的代码都还在。这里只写判断：为什么这么选、什么时候会失效。结构和代码片段放在<a href={PROJECTS_URL}>02 项目拆解</a>里。</p>
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
            <p className="section__intro">React + Vite，没有 CDN，没有外部组件库。三个分区共用一套组件与色板，源码在 <a href={GH + '/personal-site'} target="_blank" rel="noopener">personal-site</a> 里可以逐行对。</p>
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
