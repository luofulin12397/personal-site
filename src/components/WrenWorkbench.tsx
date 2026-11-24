import { useEffect, useState, type KeyboardEvent } from 'react';
import { WREN_NODES, WREN_VIEWS, type WrenView } from '../data/wren';

const NODES = new Map(WREN_NODES.map((node) => [node.id, node]));
const VIEWS = new Map(WREN_VIEWS.map((view) => [view.id, view]));

function nodesFor(view: WrenView) {
  return WREN_NODES.filter((node) => node.view === view);
}

function viewDefault(view: WrenView) {
  const definition = VIEWS.get(view)!;
  return nodesFor(view).find((node) => node.id === definition.defaultNode)?.id ?? nodesFor(view)[0].id;
}

function readState(): { view: WrenView; node: string } {
  const params = new URLSearchParams(window.location.search);
  const requestedNode = WREN_NODES.find((node) => node.id === params.get('node'));
  if (requestedNode) return { view: requestedNode.view, node: requestedNode.id };
  const requestedView = WREN_VIEWS.find((view) => view.id === params.get('view'))?.id ?? 'query';
  return { view: requestedView, node: viewDefault(requestedView) };
}

function writeState(view: WrenView, node: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('view', view);
  url.searchParams.set('node', node);
  if (!url.hash) url.hash = 'workbench';
  window.history.replaceState(window.history.state, '', url);
}

export default function WrenWorkbench() {
  const [selection, setSelection] = useState(readState);
  const selected = NODES.get(selection.node)!;
  const activeView = VIEWS.get(selection.view)!;
  const viewNodes = nodesFor(selection.view);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if ((params.has('view') || params.has('node')) && !params.has('step') && !window.location.hash) {
      document.getElementById('workbench')?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, []);

  function chooseNode(node: string) {
    const next = NODES.get(node)!;
    setSelection({ view: next.view, node: next.id });
    writeState(next.view, next.id);
  }

  function chooseView(view: WrenView) {
    const node = viewDefault(view);
    setSelection({ view, node });
    writeState(view, node);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const current = viewNodes.findIndex((node) => node.id === selection.node);
    let next = current;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % viewNodes.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + viewNodes.length) % viewNodes.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = viewNodes.length - 1;
    else return;
    event.preventDefault();
    const id = viewNodes[next].id;
    chooseNode(id);
    document.querySelector<HTMLButtonElement>(`[data-wren-node="${id}"]`)?.focus();
  }

  return (
    <section className="section workbench" id="workbench" aria-labelledby="wren-workbench-title">
      <div className="section__head">
        <h2 id="wren-workbench-title">一笔查询，经过哪几层？</h2>
        <p className="section__intro">Wren 不是一个单步改写器。构建、查询和运行边界是三条不同路径；先选视图，再点节点看职责、证据和边界。</p>
      </div>
      <div className="workbench__head">
        <span className="workbench__label">FEATURED SYSTEM / QUERY PLANNING</span>
        <span className="wren-map-note">← → 切换节点</span>
      </div>
      <fieldset className="wren-switch wren-views">
        <legend>选择视图</legend>
        {WREN_VIEWS.map((view) => (
          <label key={view.id}>
            <input type="radio" name="wren-view" checked={selection.view === view.id} onChange={() => chooseView(view.id)} />
            <span>{view.label}</span>
          </label>
        ))}
      </fieldset>
      <p className="wren-view-note">{activeView.hint}</p>
      <div className="workbench__grid wren-workbench">
        <div className="map wren-map" role="group" aria-label={`WrenAI ${activeView.label}系统图`} onKeyDown={onKeyDown}>
          <div className="map__meta" aria-hidden="true">
            <span>{activeView.label.toUpperCase()} / {viewNodes.length} NODES</span>
            <span>WRENAI / 48de0b6</span>
          </div>
          <div className="wren-map__body">
            <div className="wren-map__row">
              {viewNodes.map((node, index) => (
                <div className="wren-node-wrap" key={node.id}>
                  <button type="button" data-wren-node={node.id}
                    className={`wren-node${selection.node === node.id ? ' is-selected' : ''}`}
                    aria-pressed={selection.node === node.id} aria-controls="wren-inspector"
                    tabIndex={selection.node === node.id ? 0 : -1}
                    onClick={() => chooseNode(node.id)}>
                    <span className="wren-node__stage">{node.index} / {node.tag}</span>
                    <strong>{node.title}</strong>
                  </button>
                  {selection.view !== 'runtime' && index < viewNodes.length - 1 && (
                    <span className="wren-arrow" aria-hidden="true">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <p className="map__help"><span aria-hidden="true">→ </span>{selection.view === 'runtime' ? '这些是命令，不是同一次查询的步骤' : '沿链路选择节点，查看职责、证据和边界'}</p>
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
            <a className="text-action wren-node-link" href={`?view=${selected.view}&node=${selected.id}#workbench`}>节点直达链接</a>
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
