import { useEffect, useState, type KeyboardEvent } from 'react';
import type { ReactNode } from 'react';
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

function useCompactWorkbench() {
  const [compact, setCompact] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches
  ));

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return compact;
}

function WrenInspector({ view, selected, inspectorId, inline }: {
  view: WrenViewDef;
  selected: (typeof WREN_NODES)[number];
  inspectorId: string;
  inline?: boolean;
}) {
  return (
    <aside
      className={`inspector wren-inspector${inline ? ' wren-inspector--inline' : ''}`}
      id={inspectorId}
      tabIndex={-1}
      aria-live="polite"
      aria-labelledby={`wren-node-${view.id}`}
    >
      <div className="inspector__head"><span>NODE / {selected.index}</span><span className="selected">{selected.tag}</span></div>
      <div className="inspector__body">
        <h3 id={`wren-node-${view.id}`}>{selected.title}</h3>
        <p className="inspector__desc">{selected.detail}</p>
        <dl className="wren-notes wren-inspector__notes">
          <div><dt>这一步证明了什么</dt><dd>{selected.proves}</dd></div>
          <div><dt>还不能证明什么</dt><dd>{selected.limits}</dd></div>
        </dl>
      </div>
      <div className="wren-inspector__foot">
        <a className="text-action wren-source-link" href={selected.href}>
          核对源码：{selected.sourceLabel} <span className="arrow" aria-hidden="true">↗</span>
        </a>
        <a className="text-action wren-node-link" href={`?view=${view.id}&node=${selected.id}#view-${view.id}`}>
          定位到此节点链接
        </a>
      </div>
    </aside>
  );
}

function WrenViewSection({ view, selectedId, compact, onSelect }: {
  view: WrenViewDef;
  selectedId: string;
  compact: boolean;
  onSelect: (view: WrenView, node: string) => void;
}) {
  const viewNodes = nodesFor(view.id);
  const selected = NODES.get(selectedId)!;
  const inspectorId = `wren-inspector-${view.id}`;
  const helpText = view.id === 'runtime'
    ? '这些是独立配置与命令，不是同一次查询的串行步骤 · 支持方向键切换'
    : view.id === 'query'
      ? '虚线框为可选上下文（本例 CLI 直连未经过） · 支持方向键切换节点'
      : '沿链路选择节点，查看职责、证据和边界 · 支持方向键切换节点';

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
              {viewNodes.map((node, index) => {
                const isSelected = selectedId === node.id;
                const isOptional = node.id === 'context';
                return (
                  <div className={`wren-node-wrap${isSelected ? ' is-selected-wrap' : ''}`} key={node.id}>
                    <button
                      type="button"
                      data-wren-node={node.id}
                      className={`wren-node${isOptional ? ' is-optional' : ''}${isSelected ? ' is-selected' : ''}`}
                      aria-pressed={isSelected}
                      aria-controls={inspectorId}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => onSelect(view.id, node.id)}
                    >
                      <span className="wren-node__stage">{node.index} / {node.tag}</span>
                      <strong>{node.title}</strong>
                    </button>
                    {compact && isSelected && (
                      <WrenInspector view={view} selected={selected} inspectorId={inspectorId} inline />
                    )}
                    {view.id !== 'runtime' && index < viewNodes.length - 1 && (
                      <span className={`wren-arrow${isOptional ? ' wren-arrow--optional' : ''}`} aria-hidden="true">
                        {isOptional ? '⇢' : '→'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <p className="map__help"><span aria-hidden="true">→ </span>{helpText}</p>
        </div>
        {!compact && <WrenInspector view={view} selected={selected} inspectorId={inspectorId} />}
      </div>
    </section>
  );
}

export default function WrenWorkbench({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<Selection>(initialSelection);
  const compact = useCompactWorkbench();

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
        <h2 id="wren-workbench-title">系统剖面</h2>
        <p className="section__intro">按构建、查询和运行边界查阅节点；每个节点都附有可核对的源码。</p>
      </div>
      {WREN_VIEWS.map((view) => (
        <WrenViewSection key={view.id} view={view} selectedId={selection[view.id]} compact={compact} onSelect={select} />
      ))}
      {children}
    </section>
  );
}
