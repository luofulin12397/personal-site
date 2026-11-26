import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { WREN_GUIDED, WREN_NODES, WREN_VIEWS, type WrenNode } from '../data/wren';
import { site } from '../lib/site';

const NODES = new Map(WREN_NODES.map((node) => [node.id, node]));
const VIEWS = new Map(WREN_VIEWS.map((view) => [view.id, view]));
const DEFAULT_NODE_ID = 'policy';

const BUILD_NODES = WREN_NODES.filter((node) => node.view === 'build');
const CONTEXT_NODE = NODES.get('context')!;
const QUERY_NODES = WREN_NODES.filter((node) => node.view === 'query' && !node.optional);
const RUNTIME_NODES = WREN_NODES.filter((node) => node.view === 'runtime');

const NODE_ALIASES: Record<string, string> = {
  agent: 'sql',
  plan: 'rewrite',
  duckdb: 'connector',
};

type WireDef = {
  id: string;
  d: string;
  nodes: readonly [string, string];
};

type WireStage = {
  w: number;
  h: number;
  wires: WireDef[];
};

function findLinkedNode(params: URLSearchParams): WrenNode | undefined {
  const requested = params.get('node');
  if (requested) {
    const resolved = NODE_ALIASES[requested] ?? requested;
    if (NODES.has(resolved)) return NODES.get(resolved);
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
    const mq = window.matchMedia('(max-width: 760px)');
    const onChange = (event: MediaQueryListEvent) => setCompact(event.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return compact;
}

function measureStageWires(stage: HTMLElement): WireStage | null {
  const sr = stage.getBoundingClientRect();
  if (sr.width < 100 || sr.height < 100) return null;

  const ids = ['source', 'compile', 'manifest', 'sql', 'policy', 'rewrite', 'connector'] as const;
  const boxes: Record<string, { left: number; right: number; top: number; bottom: number; cx: number; cy: number }> = {};

  for (const id of ids) {
    const el = stage.querySelector<HTMLElement>(`[data-wren-node="${id}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    boxes[id] = {
      left: Math.round((r.left - sr.left) * 2) / 2,
      right: Math.round((r.right - sr.left) * 2) / 2,
      top: Math.round((r.top - sr.top) * 2) / 2,
      bottom: Math.round((r.bottom - sr.top) * 2) / 2,
      cx: Math.round(((r.left + r.right) / 2 - sr.left) * 2) / 2,
      cy: Math.round(((r.top + r.bottom) / 2 - sr.top) * 2) / 2,
    };
  }

  const midY = Math.round(boxes.manifest.bottom + (boxes.policy.top - boxes.manifest.bottom) * 0.46);

  return {
    w: Math.round(sr.width),
    h: Math.round(sr.height),
    wires: [
      {
        id: 'source-compile',
        d: `M${boxes.source.right} ${boxes.source.cy}H${boxes.compile.left - 1}`,
        nodes: ['source', 'compile'],
      },
      {
        id: 'compile-manifest',
        d: `M${boxes.compile.right} ${boxes.compile.cy}H${boxes.manifest.left - 1}`,
        nodes: ['compile', 'manifest'],
      },
      {
        id: 'manifest-policy',
        d: `M${boxes.manifest.cx} ${boxes.manifest.bottom}V${midY}H${boxes.policy.cx}V${boxes.policy.top - 1}`,
        nodes: ['manifest', 'policy'],
      },
      {
        id: 'manifest-rewrite',
        d: `M${boxes.manifest.cx} ${boxes.manifest.bottom}V${boxes.rewrite.top - 1}`,
        nodes: ['manifest', 'rewrite'],
      },
      {
        id: 'sql-policy',
        d: `M${boxes.sql.right} ${boxes.sql.cy}H${boxes.policy.left - 1}`,
        nodes: ['sql', 'policy'],
      },
      {
        id: 'policy-rewrite',
        d: `M${boxes.policy.right} ${boxes.policy.cy}H${boxes.rewrite.left - 1}`,
        nodes: ['policy', 'rewrite'],
      },
      {
        id: 'rewrite-connector',
        d: `M${boxes.rewrite.right} ${boxes.rewrite.cy}H${boxes.connector.left - 1}`,
        nodes: ['rewrite', 'connector'],
      },
    ],
  };
}

function WrenInspector({ selected, inline }: { selected: WrenNode; inline?: boolean }) {
  const view = VIEWS.get(selected.view)!;
  const inspectorId = inline ? 'wren-inspector-inline' : 'wren-inspector';

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
        <span className="selected">SELECTED</span>
      </div>
      <div className="inspector__body" key={selected.id}>
        <p className="inspector__label">{selected.tag}</p>
        <h3 id={`${inspectorId}-title`}>{selected.title}</h3>
        <p className="inspector__desc">{selected.detail}</p>
        <ol className="inspector__decisions">
          <li>
            <span>01</span>
            <p><strong>这一步证明：</strong>{selected.proves}</p>
          </li>
          <li>
            <span>02</span>
            <p><strong>边界与未证：</strong>{selected.limits}</p>
          </li>
        </ol>
        <p className="wren-inspector__deep">
          <a className="text-action" href={`?view=${selected.view}&node=${selected.id}#view-${selected.view}`}>
            定位到此节点深链（?node={selected.id}）
          </a>
        </p>
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

function WrenNodeTile({
  node,
  isSelected,
  compact,
  onSelect,
}: {
  node: WrenNode;
  isSelected: boolean;
  compact: boolean;
  onSelect: (id: string) => void;
}) {
  const stageRole = node.optional ? 'OPTIONAL' : node.gate ? 'GATE' : node.view.toUpperCase();

  return (
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
      aria-controls={compact ? (isSelected ? 'wren-inspector-inline' : undefined) : 'wren-inspector'}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => onSelect(node.id)}
    >
      <span className="wren-node__stage">{node.index} / {stageRole}</span>
      <strong>{node.mapTitle ?? node.title}</strong>
      <small className="wren-node__sub">{node.mapSub}</small>
      <span className="node__corner" aria-hidden="true" />
    </button>
  );
}

export default function WrenWorkbench() {
  const [selectedId, setSelectedId] = useState<string>(initialNodeId);
  const compact = useCompactWorkbench();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [wireStage, setWireStage] = useState<WireStage | null>(null);
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

  useLayoutEffect(() => {
    if (compact) {
      setWireStage(null);
      return;
    }
    const stage = stageRef.current;
    if (!stage) return;

    const update = () => {
      const measured = measureStageWires(stage);
      if (measured) setWireStage(measured);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    let active = true;
    document.fonts?.ready.then(() => {
      if (active) update();
    });

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [compact]);

  function select(id: string, revealInspector?: boolean) {
    const next = NODES.get(id);
    if (!next) return;
    setSelectedId(id);
    writeSelection(next);
    if (revealInspector && window.matchMedia('(max-width: 1100px)').matches) {
      const targetId = compact ? 'wren-inspector-inline' : 'wren-inspector';
      window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }

  function onMapKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const current = WREN_NODES.findIndex((node) => node.id === selectedId);
    if (current < 0) return;
    const total = WREN_NODES.length;
    const verticalStep = compact ? 2 : 4;
    let next = current;
    if (event.key === 'ArrowRight') next = (current + 1) % total;
    else if (event.key === 'ArrowLeft') next = (current - 1 + total) % total;
    else if (event.key === 'ArrowDown') next = (current + verticalStep) % total;
    else if (event.key === 'ArrowUp') next = (current - verticalStep + total) % total;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = total - 1;
    else return;
    event.preventDefault();
    const nextNode = WREN_NODES[next];
    select(nextNode.id);
    document.querySelector<HTMLButtonElement>(`[data-wren-node="${nextNode.id}"]`)?.focus();
  }

  const buildView = VIEWS.get('build')!;
  const queryView = VIEWS.get('query')!;
  const runtimeView = VIEWS.get('runtime')!;

  const sortedWires = wireStage
    ? [...wireStage.wires].sort(
        (a, b) => Number(a.nodes.includes(selectedId)) - Number(b.nodes.includes(selectedId)),
      )
    : [];

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
              aria-controls={compact ? 'wren-inspector-inline' : 'wren-inspector'}
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
            <span>SYSTEM PROFILE / 3 LANES · 12 NODES</span>
            <span>SOURCE ALIGNED / 48de0b6</span>
          </div>

          <div className="wren-map-stage" ref={stageRef}>
            {!compact && wireStage && (
              <svg
                className="map__wires wren-wires"
                viewBox={`0 0 ${wireStage.w} ${wireStage.h}`}
                aria-hidden="true"
              >
                <defs>
                  <marker
                    id="wren-arrow"
                    viewBox="0 0 8 8"
                    markerWidth="7"
                    markerHeight="7"
                    markerUnits="userSpaceOnUse"
                    refX="6.5"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M0 0.5L7.5 4L0 7.5Z" fill="context-stroke" />
                  </marker>
                </defs>
                {sortedWires.map((wire) => {
                  const active = wire.nodes.includes(selectedId);
                  return (
                    <path
                      key={wire.id}
                      d={wire.d}
                      className={`map-wire${active ? ' is-active' : ''}`}
                      markerEnd="url(#wren-arrow)"
                    />
                  );
                })}
              </svg>
            )}

            <div className="wren-lanes">
              <div className="wren-row-top">
                <section
                  className="wren-lane wren-lane--build"
                  id="view-build"
                  aria-labelledby="lane-title-build"
                >
                  <div className="wren-lane-bar">
                    <h3 className="wren-lane-bar__title" id="lane-title-build">
                      <span className="wren-lane-bar__no">{buildView.no} / BUILD</span>
                      <span>{buildView.label}</span>
                    </h3>
                    <span className="wren-lane-bar__hint">{buildView.hint}</span>
                  </div>
                  <div className="wren-lane__nodes wren-lane__nodes--build">
                    {BUILD_NODES.map((node) => (
                      <WrenNodeTile
                        key={node.id}
                        node={node}
                        isSelected={selectedId === node.id}
                        compact={compact}
                        onSelect={select}
                      />
                    ))}
                  </div>
                  {compact && selected.view === 'build' && <WrenInspector selected={selected} inline />}
                </section>

                <div className="wren-lane wren-lane--optional">
                  <div className="wren-lane-bar">
                    <span className="wren-lane-bar__title wren-lane-bar__title--muted">
                      <span className="wren-lane-bar__no">OPTIONAL</span>
                      <span>上层检索</span>
                    </span>
                  </div>
                  <div className="wren-lane__nodes wren-lane__nodes--optional">
                    <WrenNodeTile
                      node={CONTEXT_NODE}
                      isSelected={selectedId === CONTEXT_NODE.id}
                      compact={compact}
                      onSelect={select}
                    />
                  </div>
                  {compact && selectedId === CONTEXT_NODE.id && <WrenInspector selected={selected} inline />}
                </div>
              </div>

              <section
                className="wren-lane wren-lane--query"
                id="view-query"
                aria-labelledby="lane-title-query"
              >
                <div className="wren-lane-bar wren-lane-bar--corridor">
                  <h3 className="wren-lane-bar__title" id="lane-title-query">
                    <span className="wren-lane-bar__no">{queryView.no} / QUERY</span>
                    <span>{queryView.label}</span>
                  </h3>
                </div>
                <div className="wren-lane__nodes wren-lane__nodes--four">
                  {QUERY_NODES.map((node) => (
                    <WrenNodeTile
                      key={node.id}
                      node={node}
                      isSelected={selectedId === node.id}
                      compact={compact}
                      onSelect={select}
                    />
                  ))}
                </div>
                {compact && selected.view === 'query' && !selected.optional && (
                  <WrenInspector selected={selected} inline />
                )}
              </section>

              <section
                className="wren-lane wren-lane--runtime"
                id="view-runtime"
                aria-labelledby="lane-title-runtime"
              >
                <div className="wren-lane-bar">
                  <h3 className="wren-lane-bar__title" id="lane-title-runtime">
                    <span className="wren-lane-bar__no">{runtimeView.no} / RUNTIME</span>
                    <span>{runtimeView.label}</span>
                  </h3>
                  <span className="wren-lane-bar__hint">{runtimeView.hint}</span>
                </div>
                <div className="wren-lane__nodes wren-lane__nodes--four">
                  {RUNTIME_NODES.map((node) => (
                    <WrenNodeTile
                      key={node.id}
                      node={node}
                      isSelected={selectedId === node.id}
                      compact={compact}
                      onSelect={select}
                    />
                  ))}
                </div>
                {compact && selected.view === 'runtime' && <WrenInspector selected={selected} inline />}
              </section>
            </div>
          </div>

          <p className="map__help">
            <span aria-hidden="true">→ </span>
            点击节点或按方向键按行列切换；虚线框在本例 CLI 直连时未经过，策略门在连接 DuckDB 前执行
          </p>
        </div>

        {!compact && <WrenInspector selected={selected} />}
      </div>
    </section>
  );
}
