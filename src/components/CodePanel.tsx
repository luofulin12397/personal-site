import { useMemo, useRef, useState } from 'react';
import { SNIPPETS } from '../data/rag';

const KEYS = ['graph', 'perm', 'engine'] as const;
type Key = typeof KEYS[number];

const KW = 'async|await|def|class|return|if|elif|else|for|while|try|except|finally|raise|with|as|import|from|yield|None|True|False|in|not|and|or|lambda|pass|global|SET';
const RULES: Array<{ cls: string; src: string; flags?: string }> = [
  { cls: 'c-com', src: '"""[\\s\\S]*?"""' },
  { cls: 'c-com', src: '#[^\\n]*' },
  { cls: 'c-str', src: '"[^"\\n]*"|\'[^\'\\n]*\'' },
  { cls: 'c-key', src: `\\b(?:${KW})\\b` },
  { cls: 'c-num', src: '\\b\\d+(?:\\.\\d+)?\\b' },
];

type Token = { text: string; cls?: string };

function tokenize(src: string): Token[] {
  const re = new RegExp(RULES.map((r) => `(${r.src})`).join('|'), 'gm');
  const out: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    if (m[0] === '') { re.lastIndex++; continue; }
    if (m.index > last) out.push({ text: src.slice(last, m.index) });
    let cls = '';
    for (let i = 1; i <= RULES.length; i++) {
      if (m[i] !== undefined) { cls = RULES[i - 1].cls; break; }
    }
    out.push({ text: m[0], cls });
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push({ text: src.slice(last) });
  return out;
}

export default function CodePanel() {
  const [active, setActive] = useState<Key>('graph');
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const tokens = useMemo(() => tokenize(SNIPPETS[active].code), [active]);

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (i + 1) % KEYS.length;
    if (e.key === 'ArrowLeft') next = (i - 1 + KEYS.length) % KEYS.length;
    if (next === null) return;
    e.preventDefault();
    setActive(KEYS[next]);
    tabs.current[next]?.focus();
  }

  return (
    <div className="codepanel">
      <div className="codepanel__bar" role="tablist" aria-label="代码片段">
        {KEYS.map((k, i) => (
          <button key={k} ref={(el) => { tabs.current[i] = el; }}
            className="tab" role="tab" id={`tab-${k}`} aria-controls="codeBody"
            aria-selected={active === k} tabIndex={active === k ? 0 : -1}
            onClick={() => setActive(k)} onKeyDown={(e) => onKeyDown(e, i)}>
            {SNIPPETS[k].label}
          </button>
        ))}
      </div>
      <pre className="code" id="codeBody" role="tabpanel" aria-labelledby={`tab-${active}`} tabIndex={0}><code>{tokens.map((t, i) => t.cls
        ? <span key={i} className={t.cls}>{t.text}</span>
        : <span key={i}>{t.text}</span>)}</code></pre>
    </div>
  );
}
