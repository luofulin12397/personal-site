import { useEffect } from 'react';
import { GH } from '../data/home';
import { HOME_URL, PROJECTS_URL, WRITING_URL } from '../lib/site';

type NavItem = { label: string; href: string };
export type Branch = 'home' | 'case' | 'writing';

export function SkipLink() {
  return <a className="skip" href="#main">跳到正文</a>;
}

/* 站点级分区：不是页面内锚点，是三层之间的切换，常驻顶栏且当前分区实心高亮 */
const BRANCHES: Array<{ key: Branch; no: string; label: string; href: string }> = [
  { key: 'home', no: '01', label: '主页', href: HOME_URL },
  { key: 'case', no: '02', label: '项目拆解', href: PROJECTS_URL },
  { key: 'writing', no: '03', label: '文章', href: WRITING_URL },
];

export function Masthead({ items, branch }: { items: NavItem[]; branch: Branch }) {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant', block: 'start' }));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <header className="masthead">
      <div className="masthead__in">
        <a className="brand" href={HOME_URL} aria-label="罗富麟，返回 01 主页">
          <span className="brand__mark" aria-hidden="true" />
          <span>FULIN LUO</span>
          <span className="brand__cn">罗富麟</span>
        </a>
        <nav className="branches" aria-label="站点分区">
          {BRANCHES.map((b) => (
            <a
              key={b.key}
              href={b.href}
              className={branch === b.key ? 'is-current' : ''}
              aria-current={branch === b.key ? 'page' : undefined}
            >
              <span className="branches__no">{b.no}</span>{b.label}
            </a>
          ))}
        </nav>
        <nav className="nav" aria-label="页面章节">
          {items.map((it) => <a key={it.href} href={it.href}>{it.label}</a>)}
        </nav>
        <a className="masthead__repo" href={GH} target="_blank" rel="me noopener">
          GitHub <span className="arrow" aria-hidden="true">↗</span>
        </a>
      </div>
    </header>
  );
}

export function Footer({ left, back }: { left: string; back?: { label: string; href: string } }) {
  return (
    <footer className="footer">
      <div className="footer__in">
        <p className="footer__line">{left}</p>
        <p className="footer__line footer__line--dim">
          {back ? <a href={back.href}>{back.label}</a> : <span>01 主页 / 02 项目拆解 / 03 文章 · 三个分区</span>}
          {' · '}
          <a href={GH} target="_blank" rel="noopener">在 GitHub 上继续读</a>
        </p>
      </div>
    </footer>
  );
}
