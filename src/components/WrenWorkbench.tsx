import { useEffect, useState, type KeyboardEvent } from 'react';
import { WREN_NODES, WREN_VIEWS, type WrenView } from '../data/wren';

const NODES = new Map(WREN_NODES.map((node) => [node.id, node]));
const VIEWS = new Map(WREN_VIEWS.map((view) => [view.id, view]));
type WrenViewDef = (typeof WREN_VIEWS)[number];
type Selection = Record<WrenView, string>;

function nodesFor(view: WrenView) {
  return WREN_NODES.filter((node) => node.view === view);
}

function viewDefault(view: WrenView) {
  const definition = VIEWS.get(view)!;
  return nodesFor(view).find((node) => node.id === definition.defaultNode)?.id ?? nodesFor(view)[0].id;
}

const NODE_ALIASES: Record<string, string> = {
  agent: 'sql',
  plan: 'rewrite',
  duckdb: 'connector',
};

function findLinkedNode(params: URLSearchParams) {
  const requested = params.get('node');
  if (!requested) return undefined;
  return WREN_NODES.find((node) => node.id === requested)
    ?? WREN_NODES.find((node) => node.id === NODE_ALIASES[requested]);
}

function initialSelection(): Selection {
  const params = new URLSearchParams(window.location.search);
  const selection = Object.fromEntries(WREN_VIEWS.map((view) => [view.id, viewDefault(view.id)])) as Selection;
  const requestedNode = findLinkedNode(params);
  if (requestedNode) {
    selection[requestedNode.view] = requestedNode.id;
    return selection;
  }
  const requestedView = WREN_VIEWS.find((view) => view.id === params.get('view'))?.id;
  if (requestedView) selection[requestedView] = viewDefault(requestedView);
  return selection;
}

function writeSelection(view: WrenView, node: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('view', view);
  url.searchParams.set('node', node);
  url.hash = `view-${view}`;
  window.history.replaceState(window.history.state, '', url);
}

function WrenViewSection({ view, selectedId, onSelect }: {
  view: WrenViewDef;
  selectedId: string;
  onSelect: (view: WrenView, node: string) => void;
}) {
  const viewNodes = nodesFor(view.id);
  const selected = NODES.get(selectedId)!;
  const inspectorId = `wren-inspector-${view.id}`;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const current = viewNodes.findIndex((node) => node.id === selectedId);
    let next = current;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % viewNodes.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + viewNodes.length) % viewNodes.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = viewNodes.length - 1;
    else return;
    event.preventDefault();
    const id = viewNodes[next].id;
    onSelect(view.id, id);
    document.querySelector<HTMLButtonElement>(`[data-wren-node="${id}"]`)?.focus();
  }

  return (
    <section className="wren-view" id={`view-${view.id}`} aria-labelledby={`view-${view.id}-title`}>
      <div className="wren-view__head">
        <p className="kicker">{view.no} / {view.labelEn}</p>
        <h3 id={`view-${view.id}-title`}>{view.label}</h3>
        <p className="section__intro">{view.hint}</p>
      </div>
      <div className="workbench__grid wren-workbench">
        <div className="map wren-map" role="group" aria-label={`WrenAI ${view.label}系统图`} onKeyDown={onKeyDown}>
          <div className="map__meta" aria-hidden="true">
            <span>{view.labelEn} / {viewNodes.length} NODES</span>
            <span>WRENAI / 48de0b6</span>
          </div>
          <div className="wren-map__body">
            <div className="wren-map__row">
              {viewNodes.map((node, index) => (
                <div className="wren-node-wrap" key={node.id}>
                  <button type="button" data-wren-node={node.id}
                    className={`wren-node${selectedId === node.id ? ' is-selected' : ''}`}
                    aria-pressed={selectedId === node.id} aria-controls={inspectorId}
                    tabIndex={selectedId === node.id ? 0 : -1}
                    onClick={() => onSelect(view.id, node.id)}>
                    <span className="wren-node__stage">{node.index} / {node.tag}</span>
                    <strong>{node.title}</strong>
                  </button>
                  {view.id !== 'runtime' && index < viewNodes.length - 1 && (
                    <span className="wren-arrow" aria-hidden="true">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <p className="map__help"><span aria-hidden="true">→ </span>{view.id === 'runtime' ? '这些是命令，不是同一次查询的步骤' : '沿链路选择节点，查看职责、证据和边界'}</p>
        </div>
        <aside className="inspector wren-inspector" id={inspectorId} tabIndex={-1} aria-live="polite" aria-labelledby={`wren-node-${view.id}`}>
          <div className="inspector__head"><span>NODE / {selected.index}</span><span className="selected">{selected.tag}</span></div>
          <div className="inspector__body">
            <h3 id={`wren-node-${view.id}`}>{selected.title}</h3>
            <p className="inspector__desc">{selected.detail}</p>
            <dl className="wren-notes wren-inspector__notes">
              <div><dt>这一步证明了什么</dt><dd>{selected.proves}</dd></div>
              <div><dt>还不能证明什么</dt><dd>{selected.limits}</dd></div>
            </dl>
            <a className="text-action wren-node-link" href={`?view=${view.id}&node=${selected.id}#view-${view.id}`}>节点直达链接</a>
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

export default function WrenWorkbench() {
  const [selection, setSelection] = useState<Selection>(initialSelection);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkedNode = findLinkedNode(params);
    const linkedView = WREN_VIEWS.find((view) => view.id === params.get('view'))?.id;
    if (!linkedNode && !linkedView) return;
    if (params.has('step') || window.location.hash) return;
    document.getElementById(`view-${linkedNode?.view ?? linkedView}`)?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, []);

  function select(view: WrenView, node: string) {
    setSelection((current) => ({ ...current, [view]: node }));
    writeSelection(view, node);
  }

  return (
    <section className="section workbench" id="workbench" aria-labelledby="wren-workbench-title">
      <div className="section__head">
        <p className="kicker">01 / SYSTEM PROFILE</p>
        <h2 id="wren-workbench-title">系统剖面</h2>
        <p className="section__intro">Wren 不是一个单步改写器。构建、查询和运行边界是三条不同路径；下面连续展开，先读结构，再进入细节。</p>
      </div>
      {WREN_VIEWS.map((view) => (
        <WrenViewSection key={view.id} view={view} selectedId={selection[view.id]} onSelect={select} />
      ))}
    </section>
  );
}
