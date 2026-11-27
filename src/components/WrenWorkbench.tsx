import { useEffect, useState, type KeyboardEvent } from 'react';
import { WREN_GUIDED, WREN_NODES, WREN_VIEWS, type WrenCodeAnnotation, type WrenNode } from '../data/wren';
import { site } from '../lib/site';

const NODES = new Map(WREN_NODES.map((node) => [node.id, node]));
const VIEWS = new Map(WREN_VIEWS.map((view) => [view.id, view]));
const DEFAULT_NODE_ID = 'policy';

const NODE_ALIASES: Record<string, string> = {
  agent: 'sql',
  plan: 'rewrite',
  duckdb: 'connector',
  recheck: 'post-policy',
};

function findLinkedNode(params: URLSearchParams): WrenNode | undefined {
  const requested = params.get('node');
  if (requested) {
    const found = NODES.get(requested) ?? NODES.get(NODE_ALIASES[requested]);
    if (found) return found;
  }
  const viewId = params.get('view');
  const view = WREN_VIEWS.find((item) => item.id === viewId);
  return view ? NODES.get(view.defaultNode) : undefined;
}

function initialNodeId(): string {
  return findLinkedNode(new URLSearchParams(window.location.search))?.id ?? DEFAULT_NODE_ID;
}

function writeSelection(node: WrenNode) {
  const url = new URL(window.location.href);
  url.searchParams.set('view', node.view);
  url.searchParams.set('node', node.id);
  url.hash = `view-${node.view}`;
  window.history.replaceState(window.history.state, '', url);
}

function useCompactWorkbench() {
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 760px)').matches);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return compact;
}

function AnnotatedStep({ step, index }: { step: WrenCodeAnnotation; index: number }) {
  const stepNo = String(index + 1).padStart(2, '0');
  const lines = step.code.split('\n');
  const highlighted = new Set(step.highlight ?? []);

  return (
    <li className="wren-anno">
      <div className="wren-anno__head">
        <span className="wren-anno__fn">
          <span className="wren-anno__no">{stepNo}</span>
          <code>{step.fn}</code>
        </span>
        <a className="wren-anno__loc" href={step.href} target="_blank" rel="noopener">
          {step.loc} <span aria-hidden="true">↗</span>
        </a>
      </div>

      <pre className="wren-anno__code" tabIndex={0} aria-label={`${step.fn} 源码摘录`}>
        <code>
          {lines.map((line, i) => (
            <span key={i} className={`wren-anno__line${highlighted.has(i + 1) ? ' is-hl' : ''}`}>
              {line || ' '}
            </span>
          ))}
        </code>
      </pre>

      <p className="wren-anno__note">{step.note}</p>
    </li>
  );
}

function WrenInspector({ selected, inline }: { selected: WrenNode; inline?: boolean }) {
  const view = VIEWS.get(selected.view)!;
  const inspectorId = inline ? `wren-inspector-inline-${selected.id}` : 'wren-inspector';

  return (
    <aside
      className={`inspector wren-inspector${inline ? ' wren-inspector--inline' : ''}`}
      id={inspectorId}
      tabIndex={-1}
      aria-live="polite"
      aria-labelledby={`${inspectorId}-title`}
    >
      <div className="inspector__head">
        <span>NODE / {selected.index} · {view.id.toUpperCase()}</span>
        <span className="selected">SOURCE LOGIC</span>
      </div>

      <div className="inspector__body" key={selected.id}>
        <p className="inspector__label">{selected.tag}</p>
        <h3 id={`${inspectorId}-title`}>{selected.title}</h3>
        <p className="inspector__desc">{selected.detail}</p>

        <dl className="wren-io" aria-label="节点输入输出与拦截边界">
          <div className="wren-io__row">
            <dt className="wren-io__tag">IN</dt>
            <dd><code>{selected.io.input}</code></dd>
          </div>
          <div className="wren-io__row">
            <dt className="wren-io__tag wren-io__tag--out">OUT</dt>
            <dd>{selected.io.output}</dd>
          </div>
          {selected.io.guard && (
            <div className="wren-io__row wren-io__row--guard">
              <dt className="wren-io__tag wren-io__tag--guard">BLOCK</dt>
              <dd>{selected.io.guard}</dd>
            </div>
          )}
        </dl>

        <div className="wren-anno-section">
          <p className="wren-anno-section__title">核心函数与源码注解 · 48de0b6</p>
          <ol className="wren-anno-list">
            {selected.annotations.map((step, idx) => (
              <AnnotatedStep key={`${selected.id}-${step.loc}`} step={step} index={idx} />
            ))}
          </ol>
        </div>

        <ol className="inspector__decisions wren-inspector__summary">
          <li>
            <span>01</span>
            <p><strong>这一步证明：</strong>{selected.proves}</p>
          </li>
          <li>
            <span>02</span>
            <p><strong>边界与未证：</strong>{selected.limits}</p>
          </li>
        </ol>

        <div className="wren-inspector__links">
          <a className="text-action" href={`?view=${selected.view}&node=${selected.id}#view-${selected.view}`}>
            定位到此节点深链（?node={selected.id}）
          </a>
          {selected.sectionLink && (
            <a className="text-action" href={selected.sectionLink.href}>
              {selected.sectionLink.label}
            </a>
          )}
        </div>
      </div>

      <a className="inspector__source" href={selected.href} target="_blank" rel="noopener">
        <span>
          <small>SOURCE EVIDENCE · 48de0b6</small>
          <strong>{selected.sourceLabel}</strong>
        </span>
        <span className="arrow" aria-hidden="true">↗</span>
      </a>
    </aside>
  );
}

export default function WrenWorkbench() {
  const [selectedId, setSelectedId] = useState<string>(initialNodeId);
  const compact = useCompactWorkbench();
  const selected = NODES.get(selectedId) ?? NODES.get(DEFAULT_NODE_ID)!;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linked = findLinkedNode(params);
    if (linked && !params.has('step')) {
      const targetId = window.location.hash ? window.location.hash.slice(1) : `view-${linked.view}`;
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }

    function onPopState() {
      const restored = findLinkedNode(new URLSearchParams(window.location.search));
      setSelectedId(restored?.id ?? DEFAULT_NODE_ID);
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function select(id: string, revealInspector?: boolean) {
    const next = NODES.get(id);
    if (!next) return;
    setSelectedId(id);
    writeSelection(next);
    if (revealInspector && window.matchMedia('(max-width: 1100px)').matches) {
      const targetId = compact ? `wren-inspector-inline-${id}` : 'wren-inspector';
      window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }

  function onMapKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const current = WREN_NODES.findIndex((node) => node.id === selectedId);
    if (current < 0) return;
    let next = current;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % WREN_NODES.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + WREN_NODES.length) % WREN_NODES.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = WREN_NODES.length - 1;
    else return;
    event.preventDefault();
    const nextNode = WREN_NODES[next];
    select(nextNode.id);
    document.querySelector<HTMLButtonElement>(`[data-wren-node="${nextNode.id}"]`)?.focus();
  }

  return (
    <section className="section workbench" id="workbench" aria-labelledby="wren-workbench-title">
      <div className="workbench__head">
        <span className="workbench__label" id="wren-workbench-title">
          FEATURED SYSTEM / WRENAI · SEMANTIC ENGINE
        </span>
        <div className="wren-workbench-links">
          <a className="mode-toggle" href={site('diagrams/wren-query.html')} target="_blank" rel="noopener">
            查询调用时序图 <span className="arrow" aria-hidden="true">↗</span>
          </a>
          <a className="mode-toggle" href={site('diagrams/index.png')} target="_blank" rel="noopener">
            完整 LikeC4 架构图 <span className="arrow" aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      <div className="guided" aria-label="推荐系统阅读切面">
        <span className="guided__label">推荐切面 / 3 道边界</span>
        <div className="guided__options">
          {WREN_GUIDED.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`guided__option${selectedId === item.id ? ' is-active' : ''}`}
              aria-pressed={selectedId === item.id}
              aria-controls={compact ? `wren-inspector-inline-${item.id}` : 'wren-inspector'}
              onClick={() => select(item.id, true)}
            >
              <span className="guided__no">{item.no}</span>
              <span className="guided__opt">
                <strong>{item.label}</strong>
                <small>{item.title}</small>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="workbench__grid wren-workbench-grid">
        <div
          className="map wren-map"
          role="group"
          aria-label="WrenAI 三泳道系统剖面（构建、查询主链与运行模式）"
          onKeyDown={onMapKeyDown}
        >
          <div className="map__meta" aria-hidden="true">
            <span>SYSTEM PROFILE / 3 LANES · 13 NODES</span>
            <span>SOURCE ALIGNED / 48de0b6</span>
          </div>

          <div className="wren-lanes">
            {WREN_VIEWS.map((view) => {
              const laneNodes = WREN_NODES.filter((node) => node.view === view.id);
              const isRuntime = view.id === 'runtime';
              return (
                <section
                  key={view.id}
                  className={`wren-lane wren-lane--${view.id}`}
                  id={`view-${view.id}`}
                  aria-labelledby={`lane-title-${view.id}`}
                >
                  <div className="wren-lane__head">
                    <span className="wren-lane__kicker">{view.no} / {view.labelEn}</span>
                    <h3 id={`lane-title-${view.id}`}>{view.label}</h3>
                    <p>{view.hint}</p>
                  </div>

                  <div className={`wren-lane__nodes wren-lane__nodes--${view.id}`}>
                    {laneNodes.map((node, idx) => {
                      const isSelected = selectedId === node.id;
                      const controlsId = compact
                        ? `wren-inspector-inline-${node.id}`
                        : 'wren-inspector';
                      return (
                        <div
                          key={node.id}
                          className={`wren-node-cell${isSelected ? ' is-selected-cell' : ''}`}
                        >
                          <button
                            type="button"
                            data-wren-node={node.id}
                            className={[
                              'wren-node',
                              node.optional ? 'is-optional' : '',
                              node.gate ? 'is-gate' : '',
                              isSelected ? 'is-selected' : '',
                            ].filter(Boolean).join(' ')}
                            aria-pressed={isSelected}
                            aria-controls={controlsId}
                            tabIndex={isSelected ? 0 : -1}
                            onClick={() => select(node.id)}
                          >
                            <span className="wren-node__stage">
                              {node.index} / {node.optional ? 'OPTIONAL' : node.gate ? 'GATE' : view.id.toUpperCase()}
                            </span>
                            <strong>{node.title}</strong>
                            <small className="wren-node__sub">{node.sourceLabel.split('/').pop()}</small>
                            <span className="node__corner" aria-hidden="true" />
                          </button>
                          {compact && isSelected && <WrenInspector selected={selected} inline />}
                          {!isRuntime && idx < laneNodes.length - 1 && (
                            <span
                              className={`wren-arrow${node.optional ? ' wren-arrow--optional' : ''}`}
                              aria-hidden="true"
                            >
                              →
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <p className="map__help">
            <span aria-hidden="true">→ </span>
            点击任一节点或按方向键切换；右侧展开对应函数与源码注解，两道 GATE 在连库前后拦截
          </p>
        </div>

        {!compact && <WrenInspector selected={selected} />}
      </div>
    </section>
  );
}
