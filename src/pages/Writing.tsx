import { Footer, Masthead, SkipLink } from '../components/Shell';
import { ARTICLES, LEARNING_RESOURCES, QUEUE, STATUS_LABEL, charCount, formatDate, readingMinutes } from '../data/writing';
import { CASE_URL, HOME_URL, articleUrl } from '../lib/site';

const NAV = [
  { label: '已成篇', href: '#list' },
  { label: '排队中', href: '#queue' },
  { label: '怎么写', href: '#how' },
];

export default function Writing() {
  return (
    <>
      <SkipLink />
      <Masthead items={NAV} branch="writing" />
      <main id="main" className="wrap">
        <header className="w-head">
          <div className="w-head__in">
            <div>
              <p className="eyebrow"><span>03</span><span className="x">/</span><span>WRITING &amp; NOTES</span></p>
              <h1 className="display w-title">在写，<span className="soft">也在分享</span></h1>
            </div>
            <p className="w-lede">
              读一篇东西，留下判断，而不是摘要。写清楚哪几句我不同意、哪一步还没验，
              比把它复述一遍有用。没写完的也放在这儿，进度本身就是内容。
            </p>
          </div>
        </header>

        <section className="section" id="list">
          <div className="section__head">
            <p className="kicker">03.1 / PUBLISHED · {ARTICLES.length}</p>
            <h2>已成篇</h2>
            <p className="section__intro">每篇都以「我的判断」为主体，参照的材料只作线索。长文按小节分组，右侧目录可以直接跳；点进去是全文，不需要登录，也没有分页。</p>
          </div>
          <ul className="wlist">
            {ARTICLES.map((a) => (
              <li className="witem" key={a.slug}>
                <div className="witem__side">
                  <p className="witem__date">{formatDate(a.date)}</p>
                  <p className={`witem__status is-${a.status}`}>{STATUS_LABEL[a.status]}</p>
                  <p className="witem__count">{charCount(a)} 字 · {readingMinutes(a)} 分钟</p>
                </div>
                <div className="witem__main">
                  <h3 className="witem__title">
                    <a href={articleUrl(a.slug)}>{a.title}<span className="arrow" aria-hidden="true">→</span></a>
                  </h3>
                  <p className="witem__lede">{a.lede}</p>
                  <ul className="witem__tags">
                    {a.tags.map((t) => <li key={t}><span className="tag">{t}</span></li>)}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="section" id="resources">
          <div className="section__head">
            <p className="kicker">03.2 / LEARNING RESOURCES</p>
            <h2>学习资源</h2>
          </div>
          <div className="w-resources">
            {LEARNING_RESOURCES.map(({ title, kind, description, primary, secondary }) => (
              <article className="w-resource" key={primary.href}>
                <p className="kicker">{kind}</p>
                <h3 className="witem__title">{title}</h3>
                <p className="witem__lede">{description}</p>
                <div className="w-resource__links">
                  <a className="primary-action" href={primary.href}>
                    {primary.label} <span className="arrow" aria-hidden="true">↗</span>
                  </a>
                  <a className="text-action" href={secondary.href}>
                    {secondary.label} <span className="arrow" aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="queue">
          <div className="section__head">
            <p className="kicker">03.3 / QUEUE · {QUEUE.length}</p>
            <h2>排队中</h2>
            <p className="section__intro">还没成篇的题目，按真实进度排。不写成链接——地址打不开的东西不应该出现在目录里。</p>
          </div>
          <ul className="queue">
            {QUEUE.map((q, i) => (
              <li className="queue__item" key={q.title}>
                <p className="queue__no">{String(i + 1).padStart(2, '0')}</p>
                <div>
                  <p className="queue__title">{q.title}</p>
                  <p className="queue__note">{q.note}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="section" id="how">
          <div className="section__head">
            <p className="kicker">03.4 / HOW I WRITE THESE</p>
            <h2>这类文章怎么写</h2>
            <p className="section__intro">不转载、不翻译、不搬运原文段落。原文给的是定义，这里给的是取舍。</p>
          </div>
          <ul className="rules">
            <li><b>立论在前。</b>第一段就说出结论，不铺垫「随着大模型的发展」。</li>
            <li><b>判断标出处。</b>哪几条是我的判断、哪几条是原文的，写在块里，不混着说。</li>
            <li><b>实验没跑就写没跑。</b>设计可以写，结果不能编。这一条是为了自己半年后还敢回来看。</li>
            <li><b>原文链接留在文末。</b>读的人可以直接去对照，判断错了也不用替我遮掩。</li>
          </ul>
          <p className="w-back">
            <a className="text-action" href={HOME_URL}>回 01 主页 <span className="arrow" aria-hidden="true">↖</span></a>
            <a className="text-action" href={CASE_URL}>看 02 项目拆解 <span className="arrow" aria-hidden="true">↗</span></a>
          </p>
        </section>
      </main>
      <Footer left="罗富麟 · 读、判断、然后去验" back={{ label: '03 文章 · 目录', href: '#list' }} />
    </>
  );
}
