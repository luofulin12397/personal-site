import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { CONNECTIONS, GUIDED_PATHS, SYSTEM_NODES, type SystemNode } from '../data/rag';

function centerOf(node: SystemNode) {
  return { x: node.x + node.w / 2, y: node.y + node.h / 2 };
}

const NODE_NOTE: Record<string, string> = {
  query_cache: 'a', context: 'b', retrieve: 'c', perm_filter: 'd', save_cache: 'e',
};

function SystemMap({ selectedId, interactive, onSelect, onHover }: {
  selectedId: string;
  interactive: boolean;
  onSelect: (id: string, reveal?: boolean) => void;
  onHover: (ref: string | null) => void;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!interactive || !(e.target instanceof HTMLButtonElement) ||
      !['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const current = SYSTEM_NODES.findIndex((n) => n.id === selectedId);
    let next = current;
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = SYSTEM_NODES.length - 1;
    else {
      const here = centerOf(SYSTEM_NODES[current]);
      const candidates = SYSTEM_NODES.flatMap((node, index) => {
        if (index === current) return [];
        const c = centerOf(node);
        const h = c.x - here.x;
        const v = c.y - here.y;
        const primary = e.key === 'ArrowRight' ? h : e.key === 'ArrowLeft' ? -h : e.key === 'ArrowDown' ? v : -v;
        const cross = e.key === 'ArrowRight' || e.key === 'ArrowLeft' ? v : h;
        return primary > 0 ? [{ index, score: primary + 2 * Math.abs(cross) }] : [];
      });
      next = candidates.sort((a, b) => a.score - b.score)[0]?.index ?? current;
    }
    e.preventDefault();
    onSelect(SYSTEM_NODES[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div
      className="map"
      id="system-map"
      aria-label={interactive ? '可交互的 RAG 查询图，方向键按方位切换节点' : 'RAG 查询图总览，推荐路径模式'}
      onKeyDown={onKeyDown}
    >
      <div className="map__meta" aria-hidden="true">
        <span>QUERY GRAPH / SOURCE ALIGNED</span>
        <span>09 VIEWS / 12 NODES / 03 BRANCHES</span>
      </div>
      <div className="map__canvas">
        <svg className="map__wires" viewBox="0 0 900 500" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="map-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0 0L8 4L0 8Z" fill="context-stroke" />
            </marker>
          </defs>
          {CONNECTIONS.map((c) => (
            <g key={c.id}>
              <path d={c.d} className={`map-wire ${c.nodes.includes(selectedId) ? 'is-active' : ''}`} markerEnd="url(#map-arrow)" />
              {c.label && (
                <text x={c.labelX} y={c.labelY} textAnchor={c.labelAnchor ?? 'middle'} className={`map-wire-label ${c.terminal ? 'map-end-label' : ''}`}>
                  {c.label}
                </text>
              )}
            </g>
          ))}
        </svg>
        {SYSTEM_NODES.map((node, index) => {
          const selected = node.id === selectedId;
          const style = {
            '--nx': node.x / 9,
            '--ny': node.y / 5,
            '--nw': node.w / 9,
            '--nh': node.h / 5,
          } as CSSProperties;
          return (
            <div className="map__item" key={node.id}>
              <button
                ref={(el) => { refs.current[index] = el; }}
                type="button"
                className={`map-node ${selected ? 'is-selected' : ''}`}
                style={style}
                disabled={!interactive}
                tabIndex={interactive && selected ? 0 : -1}
                aria-pressed={selected}
                aria-controls="node-inspector"
                aria-label={`${node.sub}，${node.label}。查看设计决策`}
                onClick={() => onSelect(node.id, !window.matchMedia('(max-width: 620px)').matches)}
                onFocus={() => { onSelect(node.id); onHover(NODE_NOTE[node.id] ?? null); }}
                onBlur={() => onHover(null)}
                onPointerEnter={() => onHover(NODE_NOTE[node.id] ?? null)}
                onPointerLeave={() => onHover(null)}
              >
                <span className="node__index">{node.index}</span>
                <span className="node__sub">{node.sub}</span>
                <span className="node__label">{node.label}</span>
                <span className="node__corner" aria-hidden="true" />
              </button>
              {interactive && selected && (
                <a className="map__details" href="#node-inspector">
                  查看详情 <span aria-hidden="true">↓</span>
                </a>
              )}
            </div>
          );
        })}
      </div>
      <p className="map__help">
        <span aria-hidden="true">→ </span>
        {interactive ? '选择节点查看设计决策 · 方向键按方位切换' : '沿推荐路径阅读，或开启自由探索'}
      </p>
    </div>
  );
}

function Inspector({ node }: { node: SystemNode }) {
  return (
    <aside className="inspector" id="node-inspector" aria-live="polite" tabIndex={-1}>
      <div className="inspector__head">
        <span>NODE / {node.index}</span>
        <span className="selected">SELECTED</span>
      </div>
      <div className="inspector__body" key={node.id}>
        <p className="inspector__label">{node.label}</p>
        <h3>{node.title}</h3>
        <p className="inspector__desc">{node.description}</p>
        <ol className="inspector__decisions">
          {node.decisions.map((d, i) => <li key={d}><span>0{i + 1}</span><p>{d}</p></li>)}
        </ol>
      </div>
      <a className="inspector__source" href={node.source} target="_blank" rel="noopener">
        <span><small>SOURCE EVIDENCE</small><strong>{node.sourceLabel}</strong></span>
        <span className="arrow" aria-hidden="true">↗</span>
      </a>
    </aside>
  );
}

export default function Workbench({ onHoverRef }: { onHoverRef: (ref: string | null) => void }) {
  const [selectedId, setSelectedId] = useState('perm_filter');
  const [explore, setExplore] = useState(false);
  const node = SYSTEM_NODES.find((n) => n.id === selectedId) ?? SYSTEM_NODES[5];

  function select(id: string, reveal?: boolean) {
    setSelectedId(id);
    if (reveal && window.matchMedia('(max-width: 1100px)').matches) {
      const el = document.getElementById('node-inspector');
      window.requestAnimationFrame(() => el?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
    }
  }

  return (
    <section className="section workbench" id="workbench">
      <div className="workbench__head">
        <span className="workbench__label">FEATURED SYSTEM / RAG</span>
        <button className="mode-toggle" type="button" aria-controls="system-map" aria-expanded={explore}
          onClick={() => { if (explore) setSelectedId('perm_filter'); setExplore((v) => !v); }}>
          {explore ? '返回推荐路径' : '自由探索 09 阶段'} <span className="arrow" aria-hidden="true">→</span>
        </button>
      </div>

      {!explore && (
        <div className="guided" aria-label="推荐系统阅读路径">
          <span className="guided__label">推荐路径 / 3 道边界</span>
          <div className="guided__options">
            {GUIDED_PATHS.map((p, i) => (
              <button key={p.id} type="button"
                className={`guided__option ${selectedId === p.id ? 'is-active' : ''}`}
                aria-pressed={selectedId === p.id} aria-controls="node-inspector"
                onClick={() => select(p.id, true)}>
                <span className="guided__no">0{i + 1}</span>
                <span className="guided__opt"><strong>{p.label}</strong><small>{p.title}</small></span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="workbench__grid">
        <SystemMap selectedId={selectedId} interactive={explore} onSelect={select} onHover={onHoverRef} />
        <Inspector node={node} />
      </div>
    </section>
  );
}
