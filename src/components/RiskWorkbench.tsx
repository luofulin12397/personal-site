import { Fragment, useEffect, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { RISK_NODES } from '../data/risk';

type Node = (typeof RISK_NODES)[number];
type NodeId = Node['id'];

const NODES = new Map<NodeId, Node>(RISK_NODES.map((node) => [node.id, node]));
const DEFAULT_NODE = 'blacklist';
const GUIDED: readonly NodeId[] = ['blacklist', 'decision', 'auto-reject'];
const MOBILE_STAGES: Partial<Record<NodeId, string>> = {
  blocked: '命中 → 直接结束，不进引擎',
  features: '未命中 → 进入常规检查',
};
const GRAPH_GROUPS = [
  { label: '入口检查', nodes: RISK_NODES.filter((node) => node.row <= 3) },
  { label: '规则和模型分别给分，再汇合', nodes: RISK_NODES.filter((node) => node.row === 4 || node.row === 5) },
  { label: '保存评估，再按结果分流', nodes: RISK_NODES.filter((node) => node.row >= 6) },
];
const DECISION_CODE = <a className="text-action" href="#decision-code">为什么在融合后执行否决？</a>;
const EDGES = [
  ['request', 'blacklist', 'M500 78V100'],
  ['blacklist', 'blocked', 'M655 139H680'],
  ['blacklist', 'features', 'M500 178V200'],
  ['features', 'rules', 'M500 278V289H167V300'],
  ['features', 'model', 'M500 278V289H833V300'],
  ['rules', 'decision', 'M167 378V389H500V400'],
  ['model', 'decision', 'M833 378V389H500V400'],
  ['decision', 'persist', 'M500 478V500'],
  ['persist', 'auto-reject', 'M500 578V589H167V600'],
  ['persist', 'complete', 'M500 578V600'],
  ['persist', 'review', 'M500 578V589H833V600'],
] as const;

function readLinkedNode() {
  const id = new URLSearchParams(window.location.search).get('node');
  return RISK_NODES.find((node) => node.id === id)?.id;
}

function updateNodeUrl(id?: NodeId) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set('node', id);
  else url.searchParams.delete('node');
  window.history.replaceState(window.history.state, '', url);
}

export default function RiskWorkbench() {
  const [{ id, explore }, setSelection] = useState(() => {
    const linked = readLinkedNode();
    return { id: linked ?? DEFAULT_NODE, explore: linked !== undefined };
  });
  const selected = NODES.get(id)!;

  useEffect(() => {
    const hash = window.location.hash;
    if (readLinkedNode() && (!hash || hash === '#risk-inspector')) {
      document.getElementById('risk-inspector')?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    function restoreSelection() {
      const linked = readLinkedNode();
      setSelection((current) => linked ? { id: linked, explore: true }
        : current.explore ? { id: DEFAULT_NODE, explore: false } : current);
    }
    window.addEventListener('popstate', restoreSelection);
    return () => window.removeEventListener('popstate', restoreSelection);
  }, []);

  function select(next: NodeId) {
    if (next === id) return;
    setSelection({ id: next, explore });
    if (explore) updateNodeUrl(next);
  }

  function toggleExplore() {
    if (explore) {
      setSelection({ id: DEFAULT_NODE, explore: false });
      updateNodeUrl();
    } else {
      setSelection({ id, explore: true });
      updateNodeUrl(id);
    }
  }

  function onGraphKey(e: KeyboardEvent<HTMLDivElement>) {
    if (!explore || !(e.target instanceof HTMLButtonElement)) return;
    let next: Node | undefined;
    if (e.key === 'Home') next = RISK_NODES[0];
    else if (e.key === 'End') next = RISK_NODES[RISK_NODES.length - 1];
    else if (window.matchMedia('(max-width: 620px)').matches) {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      const index = RISK_NODES.findIndex((node) => node.id === id);
      next = RISK_NODES[index + (e.key === 'ArrowUp' ? -1 : 1)];
    }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const vertical = e.key === 'ArrowUp' || e.key === 'ArrowDown';
      const sign = e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 1;
      let best = Infinity;
      for (const node of RISK_NODES) {
        const row = node.row - selected.row;
        const col = node.col - selected.col;
        const primary = vertical ? row : col;
        if (primary * sign <= 0) continue;
        const score = Math.abs(primary) + 2 * Math.abs(vertical ? col : row);
        if (score < best) { best = score; next = node; }
      }
    } else return;
    e.preventDefault();
    if (next) e.currentTarget.querySelector<HTMLButtonElement>(`[data-node="${next.id}"]`)?.focus();
  }

  return (
    <section className="section workbench" id="pipeline" aria-labelledby="risk-map-title">
      <div className="section__head">
        <p className="kicker">02 / PIPELINE</p>
        <h2 id="risk-map-title">一次风险检查怎么走</h2>
        <p className="section__intro">这笔示例请求未命中黑名单，进入常规检查。跟着它看低模型分会不会改变最终结果。</p>
      </div>
      <div className="workbench__head">
        <span className="workbench__label">FEATURED SYSTEM / RISK DECISION</span>
        <button type="button" className="mode-toggle" aria-pressed={explore} aria-controls="risk-system-map" onClick={toggleExplore}>
          {explore ? '返回推荐路径' : '自由探索'} <span className="arrow" aria-hidden="true">→</span>
        </button>
      </div>
      {!explore && (
        <div className="guided">
          <span className="guided__label">推荐路径 / 3 个关键点</span>
          <p className="risk-route-summary">
            黑名单命中就停止；未命中才让规则和模型评分，再按结果分流。
            <strong>本例触发硬否决，自动拒绝，不进入待审队列。</strong>
          </p>
          <div className="guided__options">
            {GUIDED.map((nodeId, i) => {
              const node = NODES.get(nodeId)!;
              return (
                <div className="risk-guided-item" key={nodeId}>
                  <button type="button" className={`guided__option${id === nodeId ? ' is-active' : ''}`}
                    aria-pressed={id === nodeId} onClick={() => select(nodeId)}>
                    <span className="guided__no">0{i + 1}</span>
                    <span className="guided__opt"><strong>{node.title}</strong><small>{node.tag}</small></span>
                  </button>
                  {id === nodeId && (
                    <div className="risk-guided-detail" aria-live="polite">
                      <p>{node.detail}</p>
                      <a className="text-action" href={node.href}>查看源码</a>
                      {node.id === 'decision' && DECISION_CODE}
                      <a className="text-action" href={`?node=${node.id}`}>节点直达链接</a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className={`workbench__grid risk-workbench${explore ? '' : ' risk-workbench--guided'}`}>
        <div className="map" id="risk-system-map" role="group" aria-label="医保结算风险检查系统图" onKeyDown={onGraphKey}>
          <div className="map__meta" aria-hidden="true"><span>REQUEST → DECISION</span><span>AI_RISK_HEALTH</span></div>
          <div className="risk-graph">
            <svg className="map__wires" viewBox="0 0 1000 678" preserveAspectRatio="none" aria-hidden="true">
              <defs><marker id="risk-arrow" viewBox="0 0 8 8" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="context-stroke" /></marker></defs>
              {EDGES.map(([from, to, path]) => <path key={`${from}:${to}`} d={path} vectorEffect="non-scaling-stroke"
                className={`map-wire${id === from || id === to ? ' is-active' : ''}`} markerEnd="url(#risk-arrow)" />)}
            </svg>
            {GRAPH_GROUPS.map(({ label, nodes }) => (
              <div className="risk-graph__group" key={label}>
                <p className="risk-graph__stage">{label}</p>
                {nodes.map((node) => (
                  <Fragment key={node.id}>
                    {MOBILE_STAGES[node.id] && <p className="risk-graph__stage risk-graph__branch">{MOBILE_STAGES[node.id]}</p>}
                    <div className="risk-node" style={{ '--risk-row': node.row, '--risk-col': node.col } as CSSProperties}>
                      {explore ? (
                        <button type="button" className={`risk-node__tile${id === node.id ? ' is-selected' : ''}`} data-node={node.id}
                          aria-pressed={id === node.id} aria-controls="risk-inspector" tabIndex={id === node.id ? 0 : -1}
                          onClick={() => select(node.id)} onFocus={() => select(node.id)}>
                          <strong>{node.title}</strong><small>{node.tag}</small>
                        </button>
                      ) : (
                        <div className={`risk-node__tile${id === node.id ? ' is-selected' : ''}`}>
                          <strong>{node.title}</strong><small>{node.tag}</small>
                        </div>
                      )}
                      {explore && id === node.id && <a className="risk-details" href="#risk-inspector">查看详情 <span aria-hidden="true">↓</span></a>}
                    </div>
                  </Fragment>
                ))}
              </div>
            ))}
          </div>
          <p className="map__help">{explore ? '选择节点查看详情，方向键可切换节点' : '沿推荐路径阅读，或开启自由探索'}</p>
        </div>
        <aside className="inspector" id="risk-inspector" tabIndex={-1} aria-labelledby="risk-node-title">
          <div className="inspector__head"><span>NODE DETAILS</span><span className="selected">{selected.tag}</span></div>
          <div className="inspector__body" aria-live="polite">
            <h3 id="risk-node-title">{selected.title}</h3>
            <p className="inspector__desc">{selected.detail}</p>
          </div>
          <div className="risk-inspector-links">
            <a className="text-action" href={selected.href}>查看源码 <span aria-hidden="true">↗</span></a>
            {id === 'decision' && DECISION_CODE}
            {'related' in selected && <a className="text-action" href={selected.related}>查看建案条件 <span aria-hidden="true">↗</span></a>}
            <a className="text-action" href={`?node=${id}`}>节点直达链接 <span aria-hidden="true">↗</span></a>
          </div>
        </aside>
      </div>
    </section>
  );
}
