import { useEffect, useState, type KeyboardEvent } from 'react';
import { WREN_NODES } from '../data/wren';

type Node = (typeof WREN_NODES)[number];
type NodeId = Node['id'];

const NODES = new Map<NodeId, Node>(WREN_NODES.map((node) => [node.id, node]));
const DEFAULT_NODE: NodeId = 'plan';

function readLinkedNode(): NodeId {
  const requested = new URLSearchParams(window.location.search).get('node');
  return WREN_NODES.find((node) => node.id === requested)?.id ?? DEFAULT_NODE;
}

function writeLinkedNode(id: NodeId) {
  const url = new URL(window.location.href);
  url.searchParams.set('node', id);
  if (!url.hash) url.hash = 'workbench';
  window.history.replaceState(window.history.state, '', url);
}

export default function WrenWorkbench() {
  const [selectedId, setSelectedId] = useState<NodeId>(readLinkedNode);
  const selected = NODES.get(selectedId)!;
  const mainNodes = WREN_NODES.filter((node) => node.id !== 'policy');
  const branch = NODES.get('policy')!;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('node') && !params.has('step') && !window.location.hash) {
      document.getElementById('workbench')?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, []);

  function choose(id: NodeId) {
    setSelectedId(id);
    writeLinkedNode(id);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const current = WREN_NODES.findIndex((node) => node.id === selectedId);
    let next = current;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % WREN_NODES.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + WREN_NODES.length) % WREN_NODES.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = WREN_NODES.length - 1;
    else return;
    event.preventDefault();
    const id = WREN_NODES[next].id;
    choose(id);
    document.querySelector<HTMLButtonElement>(`[data-wren-node="${id}"]`)?.focus();
  }

  return (
    <section className="section workbench" id="workbench" aria-labelledby="wren-workbench-title">
      <div className="section__head">
        <h2 id="wren-workbench-title">一笔查询，经过哪几层？</h2>
        <p className="section__intro">选择链路上的一个节点，查看它负责什么、能证明什么，以及证据在哪里。策略分支不是主路径的一部分。</p>
      </div>
      <div className="workbench__head">
        <span className="workbench__label">FEATURED SYSTEM / QUERY PLANNING</span>
        <span className="wren-map-note">← → 切换节点</span>
      </div>
      <div className="workbench__grid wren-workbench">
        <div className="map wren-map" role="group" aria-label="WrenAI 查询规划系统图" onKeyDown={onKeyDown}>
          <div className="map__meta" aria-hidden="true">
            <span>MODEL SQL → MDL → PLAN → DUCKDB</span>
            <span>WRENAI / 48de0b6</span>
          </div>
          <div className="wren-map__body">
            <div className="wren-map__row">
              {mainNodes.map((node, index) => (
                <div className="wren-node-wrap" key={node.id}>
                  <button type="button" data-wren-node={node.id}
                    className={`wren-node${selectedId === node.id ? ' is-selected' : ''}`}
                    aria-pressed={selectedId === node.id} aria-controls="wren-inspector"
                    tabIndex={selectedId === node.id ? 0 : -1}
                    onClick={() => choose(node.id)}>
                    <span className="wren-node__stage">{node.index} / {node.tag}</span>
                    <strong>{node.title}</strong>
                  </button>
                  {index < mainNodes.length - 1 && <span className="wren-arrow" aria-hidden="true">→</span>}
                </div>
              ))}
            </div>
            <div className="wren-map__branch">
              <span className="wren-branch-label">模型不在 manifest</span>
              <span className="wren-branch-arrow" aria-hidden="true">↳</span>
              <button type="button" data-wren-node={branch.id}
                className={`wren-node wren-node--branch${selectedId === branch.id ? ' is-selected' : ''}`}
                aria-pressed={selectedId === branch.id} aria-controls="wren-inspector"
                tabIndex={selectedId === branch.id ? 0 : -1}
                onClick={() => choose(branch.id)}>
                <span className="wren-node__stage">{branch.index} / {branch.tag}</span>
                <strong>{branch.title}</strong>
              </button>
            </div>
          </div>
          <p className="map__help"><span aria-hidden="true">→ </span>选择节点查看职责、证据和边界</p>
        </div>
        <aside className="inspector wren-inspector" id="wren-inspector" tabIndex={-1} aria-live="polite">
          <div className="inspector__head"><span>NODE / {selected.index}</span><span className="selected">{selected.tag}</span></div>
          <div className="inspector__body">
            <h3>{selected.title}</h3>
            <p className="inspector__desc">{selected.detail}</p>
            <dl className="wren-notes wren-inspector__notes">
              <div><dt>这一步证明了什么</dt><dd>{selected.proves}</dd></div>
              <div><dt>还不能证明什么</dt><dd>{selected.limits}</dd></div>
            </dl>
            <a className="text-action wren-node-link" href={`?node=${selected.id}#workbench`}>节点直达链接</a>
          </div>
          <a className="inspector__source" href={selected.href}>
            <span><small>SOURCE EVIDENCE</small><strong>{selected.sourceLabel}</strong></span>
            <span className="arrow" aria-hidden="true">↗</span>
          </a>
        </aside>
      </div>
    </section>
  );
}
