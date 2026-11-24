import { Footer, Masthead, SkipLink } from '../components/Shell';
import { ARTICLES, STATUS_LABEL, charCount, formatDate, readingMinutes, tocGroups } from '../data/writing';
import type { Article as A, Block } from '../data/writing';
import { WRITING_URL, articleUrl } from '../lib/site';

/* 正文里两种行内标记：反引号 → 行内代码，**…** → 强调。
   所有文本字段（含表格单元格、步骤标题、练习题面）都走它，
   否则数据里写的 **只写查询** 会原样显示成星号。 */
function Plain({ text }: { text: string }) {
  const parts = text.split('**');
  if (parts.length === 1) return <>{text}</>;
  return <>{parts.map((s, i) => (i % 2 ? <strong key={i}>{s}</strong> : s))}</>;
}

function Rich({ text }: { text: string }) {
  const parts = text.split('`');
  if (parts.length === 1) return <Plain text={text} />;
  return <>{parts.map((s, i) => (i % 2 ? <code key={i}>{s}</code> : <Plain key={i} text={s} />))}</>;
}

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case 'p':
      return <p className="art__p"><Rich text={b.text} /></p>;

    case 'h':
      return (
        <h2 className="art__h" id={`s${b.no}`}>
          <span className="art__hno" aria-hidden="true">{b.no}</span>
          <span><Rich text={b.text} /></span>
        </h2>
      );

    case 'list':
      return (
        <ul className="art__list">
          {b.items.map((it) => <li key={it}><Rich text={it} /></li>)}
        </ul>
      );

    case 'table': {
      const widths = b.widths ?? b.head.map(() => +(100 / b.head.length).toFixed(2));
      return (
        <figure className="art__figure">
          <div className="art__tablewrap">
            <table className="art__table">
              <colgroup>{widths.map((w, i) => <col key={i} style={{ width: `${w}%` }} />)}</colgroup>
              <thead>
                <tr>{b.head.map((h, i) => <th key={`${h}-${i}`} scope="col"><Rich text={h} /></th>)}</tr>
              </thead>
              <tbody>
                {b.rows.map((r) => (
                  <tr key={r[0]}>
                    {r.map((c, i) => (i === 0
                      ? <th key={`${c}-${i}`} scope="row"><Rich text={c} /></th>
                      : <td key={i} data-label={b.head[i]}><Rich text={c} /></td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {b.note && <figcaption className="art__cap"><Rich text={b.note} /></figcaption>}
        </figure>
      );
    }

    case 'steps':
      return (
        <figure className="art__steps">
          {b.label && <figcaption><Rich text={b.label} /></figcaption>}
          <ol>
            {b.items.map((s, i) => (
              <li key={s.head}>
                <span className="art__steps-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p className="art__steps-head"><Rich text={s.head} /></p>
                  <p className="art__steps-body"><Rich text={s.body} /></p>
                </div>
              </li>
            ))}
          </ol>
        </figure>
      );

    case 'quiz':
      return (
        <details className="art__quiz">
          <summary>
            <span className="art__quiz-label">动手 / CHECK</span>
            <span className="art__quiz-q"><Rich text={b.q} /></span>
            <span className="art__quiz-toggle" aria-hidden="true">展开答案 +</span>
          </summary>
          <div className="art__quiz-in">
            {b.hint && <p className="art__quiz-hint">提示：<Rich text={b.hint} /></p>}
            <p className="art__quiz-answer"><Rich text={b.answer} /></p>
          </div>
        </details>
      );

    case 'judge':
      return (
        <aside className="judge">
          <p className="judge__label">我的判断 <span aria-hidden="true">/</span> {b.no}</p>
          <h3 className="judge__title"><Rich text={b.title} /></h3>
          <p className="judge__body"><Rich text={b.body} /></p>
        </aside>
      );

    case 'note':
      return (
        <div className="art__note">
          <p className="art__note-label"><Rich text={b.label} /></p>
          <p className="art__note-body"><Rich text={b.text} /></p>
        </div>
      );

    case 'code':
      return (
        <figure className="art__code">
          {b.label && <figcaption><Rich text={b.label} /></figcaption>}
          <pre><code>
            {b.lines.map(([tone, line], i) => (
              <span key={i} className={tone ? `tone-${tone}` : undefined}>{line}{'\n'}</span>
            ))}
          </code></pre>
        </figure>
      );

    default:
      return null;
  }
}

export default function ArticlePage({ article }: { article: A }) {
  const idx = ARTICLES.findIndex((a) => a.slug === article.slug);
  const next = ARTICLES[idx + 1];
  const groups = tocGroups(article);
  const chapterCount = groups.reduce((n, g) => n + g.items.length, 0);

  /* 顶栏只放分组锚点。十几个章节全塞进顶栏会挤成一团，
     分组名去掉罗马编号，让导航条保持短。 */
  const nav = [
    ...groups.map((g) => ({
      label: g.name.replace(/^[ⅠⅡⅢⅣⅤⅥⅦ]\s*/, ''),
      href: `#s${g.items[0].no}`,
    })),
    { label: '来源', href: '#source' },
  ];

  return (
    <>
      <SkipLink />
      <Masthead items={nav} branch="writing" />
      <main id="main" className="wrap">
        <article className="art">
          <header className="art__head">
            <p className="crumb">
              <a href={WRITING_URL}><span className="arrow" aria-hidden="true">←</span> 03 文章</a>
            </p>
            <p className="eyebrow">
              <span>{article.kicker}</span>
              <span className="x">/</span>
              <span>{formatDate(article.date)}</span>
            </p>
            <h1 className="display art__title">{article.title}</h1>
            <p className="art__lede">{article.lede}</p>
            <dl className="art__meta">
              <div><dt>状态</dt><dd>{STATUS_LABEL[article.status]}</dd></div>
              <div><dt>篇幅</dt><dd>{charCount(article)} 字 / {readingMinutes(article)} 分钟</dd></div>
              <div><dt>标签</dt><dd>{article.tags.join(' · ')}</dd></div>
            </dl>
          </header>

          <div className="art__grid">
            <div className="art__body">
              {article.blocks.map((b, i) => <BlockView b={b} key={i} />)}
              {article.takeaway && (
                <aside className="art__takeaway">
                  <p className="art__takeaway-label">一句话带走</p>
                  <p><Rich text={article.takeaway} /></p>
                </aside>
              )}
            </div>
            <nav className="art__toc" aria-label="本文小节">
              <p className="art__toc-label">本文小节 / {chapterCount}</p>
              <div className="art__toc-scroll">
                {groups.map((g) => (
                  <div className="art__toc-group" key={g.name}>
                    <p className="art__toc-gname">{g.name}</p>
                    <ol>
                      {g.items.map((c) => (
                        <li key={c.no}><a href={`#s${c.no}`}><span>{c.no}</span>{c.text}</a></li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
              <p className="art__toc-foot">{charCount(article)} 字 · {readingMinutes(article)} 分钟</p>
            </nav>
          </div>

          <footer className="art__src" id="source">
            <div className="art__src-main">
              <p className="kicker">SOURCE &amp; BOUNDARY</p>
              {article.source && (
                <p className="art__src-line">
                  读的是
                  <a href={article.source.href} target="_blank" rel="noopener">
                    《{article.source.title}》<span className="arrow" aria-hidden="true">↗</span>
                  </a>
                  ，作者 {article.source.author}。
                </p>
              )}
              <p className="art__src-line"><Rich text={article.boundary} /></p>
              {article.credits && article.credits.length > 0 && (
                <div className="art__credits">
                  <p className="art__credits-label">参照与致谢</p>
                  <ul>
                    {article.credits.map((c) => (
                      <li key={c.title}>
                        <a href={c.href} target="_blank" rel="noopener">
                          {c.title}<span className="arrow" aria-hidden="true">↗</span>
                        </a>
                        <span className="art__credits-by">{c.author}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <nav className="art__next">
              <a className="text-action" href={WRITING_URL}><span className="arrow" aria-hidden="true">←</span> 回 03 目录</a>
              {next && (
                <a className="text-action" href={articleUrl(next.slug)}>下一篇：{next.title} <span className="arrow" aria-hidden="true">→</span></a>
              )}
            </nav>
          </footer>
        </article>
      </main>
      <Footer left="罗富麟 · 读、判断、然后去验" back={{ label: '03 文章 · 目录', href: WRITING_URL }} />
    </>
  );
}
