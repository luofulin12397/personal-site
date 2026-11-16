import { useEffect, useRef, useState } from 'react';
import { COMMANDS, GH, REPOS, SCROLL_TARGETS, STACK, TOPICS } from '../data/home';
import { CASE_URL } from '../lib/site';

type Line = { text: string; kind: 'cmd' | 'out' | 'head' | 'err' };
type Resolved =
  | { kind: 'none' }
  | { kind: 'error'; message: string }
  | { kind: 'key'; key: string }
  | { kind: 'clear' }
  | { kind: 'github' }
  | { kind: 'repo'; name: string }
  | { kind: 'page'; href: string }
  | { kind: 'scroll'; target: string };

function resolve(raw: string): Resolved {
  const s = raw.trim().replace(/\s+/g, ' ');
  if (!s) return { kind: 'none' };
  const low = s.toLowerCase();

  if (low === 'help' || low === '?' || low === 'man') return { kind: 'key', key: 'help' };
  if (low === 'clear' || low === 'cls') return { kind: 'clear' };
  if (COMMANDS[low]) return { kind: 'key', key: low };

  const cat = low.match(/^cat\s+(\S+)$/);
  if (cat) {
    const target = cat[1].replace(/^\.\//, '');
    const hit = Object.keys(COMMANDS).find((k) => k === `cat ${target}`);
    return hit ? { kind: 'key', key: hit } : { kind: 'error', message: `cat: ${target}: No such file or directory` };
  }

  if (low === 'explain') return { kind: 'error', message: `explain: 用法 explain <topic>。可用：${TOPICS.join(' / ')}` };
  const ex = low.match(/^explain\s+(\S+)$/);
  if (ex) {
    const topic = ex[1].replace(/[^a-z]/g, '');
    return COMMANDS[topic]
      ? { kind: 'key', key: topic }
      : { kind: 'error', message: `explain: 没有这个主题 ${topic}。试试 ${TOPICS.join(' / ')}` };
  }

  if (low === 'open') return { kind: 'error', message: `open: 用法 open <repo>。可用：github / case / ${Object.keys(REPOS).join(' / ')}` };
  const open = low.match(/^open\s+(\S+)$/);
  if (open) {
    const where = open[1].replace(/\/$/, '');
    if (where === 'github' || where === 'repo') return { kind: 'github' };
    if (where === 'case' || where === 'rag') return { kind: 'page', href: CASE_URL };
    if (REPOS[where]) return { kind: 'repo', name: where };
    if (SCROLL_TARGETS[where]) return { kind: 'scroll', target: SCROLL_TARGETS[where] };
    return { kind: 'error', message: `open: 打不开 ${where}。试试 github / case / ${Object.keys(REPOS).join(' / ')}` };
  }

  return { kind: 'error', message: `zsh: command not found: ${s.split(' ')[0]}` };
}

function commonPrefix(hits: string[], current: string): string {
  let prefix = hits[0];
  for (const h of hits) {
    let i = 0;
    while (i < prefix.length && h[i] === prefix[i]) i++;
    prefix = prefix.slice(0, i);
  }
  return prefix.length > current.length ? prefix : '';
}

const STATIC_LINES: Line[] = [
  { text: 'whoami', kind: 'cmd' },
  { text: '罗富麟 — 后端。检索链路、异步任务、静态站。', kind: 'out' },
  { text: 'ls', kind: 'cmd' },
  { text: 'ai-learning-site/  knowledge-base/  smart-bi/  risk-engine/  log-patrol/  personal-site/', kind: 'out' },
  { text: 'cat stack.json', kind: 'cmd' },
  { text: STACK.join('\n'), kind: 'out' },
  { text: '输入 help 看还能做什么。', kind: 'out' },
];

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>(STATIC_LINES);
  const [value, setValue] = useState('');
  const [typing, setTyping] = useState('');
  const history = useRef<string[]>([]);
  const cursor = useRef(-1);
  const interacted = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, typing]);

  // 开场：把静态行替换成逐字敲出来的。减少动效时直接显示。
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const script: Array<{ cmd: string; outs: string[] }> = [
      { cmd: 'whoami', outs: [COMMANDS.whoami()[0]] },
      { cmd: 'ls', outs: [COMMANDS.ls()[0]] },
      { cmd: 'cat stack.json', outs: [STACK.join('\n')] },
    ];
    let cancelled = false;
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    (async () => {
      await wait(280);
      if (cancelled || interacted.current) return;
      // 逐条累积，避免 StrictMode 下多次 effect 交错写 setLines
      const acc: Line[] = [];
      for (const step of script) {
        for (let i = 1; i <= step.cmd.length; i++) {
          if (cancelled || interacted.current) return;
          setTyping(step.cmd.slice(0, i));
          await wait(26 + Math.random() * 24);
        }
        if (cancelled || interacted.current) return;
        acc.push({ text: step.cmd, kind: 'cmd' }, ...step.outs.map((o) => ({ text: o, kind: 'out' as const })));
        setTyping('');
        setLines([...acc]);
        await wait(110);
      }
      // 结束态固定为完整静态内容，任何竞态都不会留下半截输出
      if (!cancelled && !interacted.current) {
        acc.push({ text: '输入 help 看还能做什么。', kind: 'out' });
        setLines([...acc]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function push(items: Line[]) {
    setLines((prev) => [...prev, ...items]);
  }

  function run(raw: string) {
    const cmd = raw.trim();
    if (!cmd) return;
    interacted.current = true;
    setTyping('');
    history.current.push(cmd);
    cursor.current = history.current.length;
    push([{ text: cmd, kind: 'cmd' }]);

    const res = resolve(cmd);
    switch (res.kind) {
      case 'none': return;
      case 'error':
        push([{ text: res.message, kind: 'err' }, { text: '输入 help 看可用命令。', kind: 'out' }]);
        return;
      case 'clear':
        setLines([]);
        return;
      case 'github':
        push([{ text: '正在打开 github.com/luofulin12397', kind: 'out' }]);
        window.open(GH, '_blank', 'noopener');
        return;
      case 'repo':
        push([{ text: `正在打开 ${REPOS[res.name].replace('https://', '')}`, kind: 'out' }]);
        window.open(REPOS[res.name], '_blank', 'noopener');
        return;
      case 'page':
        push([{ text: '正在进入 02 项目拆解（knowledge-base）', kind: 'out' }]);
        window.location.href = res.href;
        return;
      case 'scroll': {
        const el = document.querySelector(res.target);
        el?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        push([{ text: `跳到 ${res.target}`, kind: 'out' }]);
        return;
      }
      case 'key': {
        const out = COMMANDS[res.key]();
        push(out.map((text, i) => ({ text, kind: i === 0 ? 'head' : 'out' } as Line)));
        return;
      }
    }
  }

  function complete() {
    const v = value.trim().toLowerCase();
    if (!v) return;
    interacted.current = true;
    setTyping('');
    const pool = [
      ...Object.keys(COMMANDS).filter((k) => !k.includes(' ')),
      'clear', 'open github', 'open case', 'open rag',
      ...Object.keys(REPOS).map((r) => `open ${r}`),
      ...Object.keys(SCROLL_TARGETS).map((k) => `open ${k}`),
      ...TOPICS.map((t) => `explain ${t}`),
    ];
    const hits = pool.filter((c) => c.startsWith(v));
    if (!hits.length) return;
    if (hits.length === 1) { setValue(hits[0]); return; }
    const prefix = commonPrefix(hits, v);
    if (prefix) { setValue(prefix); return; }
    push([{ text: value, kind: 'cmd' }, { text: hits.join('   '), kind: 'out' }]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.current.length) return;
      cursor.current = Math.max(0, cursor.current - 1);
      setValue(history.current[cursor.current] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      cursor.current = Math.min(history.current.length, cursor.current + 1);
      setValue(history.current[cursor.current] ?? '');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'Escape') {
      setValue('');
    } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setLines([]);
    }
  }

  return (
    <div className="term" onClick={(e) => {
      if (window.getSelection()?.toString()) return;
      if ((e.target as HTMLElement).closest('a')) return;
      inputRef.current?.focus();
    }}>
      <div className="term__bar">
        <span className="term__title">zsh — interactive</span>
        <span className="term__hint">能敲命令，<kbd>help</kbd> 看有哪些</span>
      </div>
      <div className="term__body">
        <div className="term__log" ref={logRef} role="log" aria-live="polite" aria-label="终端输出">
          {lines.map((l, i) => l.kind === 'cmd'
            ? <p key={i}><span className="t-prompt">luo@local ~ %</span> <span className="t-cmd">{l.text}</span></p>
            : <p key={i} className={`t-${l.kind}`}>{l.text}</p>)}
          {typing && <p><span className="t-prompt">luo@local ~ %</span> <span className="t-cmd">{typing}</span></p>}
        </div>
        <form className="term__form" onSubmit={(e) => { e.preventDefault(); run(value); setValue(''); }} autoComplete="off">
          <label className="sr-only" htmlFor="termInput">输入命令</label>
          <span className="term__prompt" aria-hidden="true">luo@local ~ %</span>
          <input
            ref={inputRef}
            className="term__input"
            id="termInput"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="试试 explain perm"
            autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
            aria-describedby="termHint"
          />
          <span className="sr-only" id="termHint">可用命令：help、whoami、ls、cat stack.json、cat tradeoffs.md、explain perm|hyde|rrf|plan|milvus、open、clear。上下方向键翻历史，Tab 补全。</span>
        </form>
      </div>
    </div>
  );
}
