import { useState } from 'react';
import CodePanel from '../components/CodePanel';
import Workbench from '../components/Workbench';
import { Footer, Masthead, SkipLink } from '../components/Shell';
import {
  ANNOTATIONS, BOUNDARY, CASE_HERO, DECISIONS, EVIDENCE, IMPORT_STAGES,
  KNOWN, QUERY_FLOW, RAG_ROOT,
} from '../data/rag';
import { PROJECTS_URL } from '../lib/site';

const NAV = [
  { label: '工作台', href: '#workbench' },
  { label: '边界', href: '#boundary' },
  { label: '链路', href: '#pipelines' },
  { label: '代码', href: '#code' },
  { label: '决定', href: '#thinking' },
  { label: '证据', href: '#evidence' },
];

export default function Case() {
  const [hoverRef, setHoverRef] = useState<string | null>(null);

  return (
    <>
      <SkipLink />
      <Masthead items={NAV} branch="case" />
      <main id="main" className="wrap">
        <section className="case-head">
          <div className="branch-badge">
            <span className="branch-badge__no">02</span>
            <span className="branch-badge__name">项目拆解 / PROJECT BREAKDOWN</span>
            <span className="branch-badge__hint">项目案例 / RAG 知识库</span>
          </div>
          <p className="crumb">
            <a href={PROJECTS_URL}>← 返回项目拆解目录</a>
            <span className="crumb__sep" aria-hidden="true">/</span>
            <span>{CASE_HERO.crumb}</span>
          </p>
          <h1 className="display">{CASE_HERO.title[0]}<br /><span className="soft">{CASE_HERO.title[1]}</span></h1>
          <p className="case-lede">{CASE_HERO.lede}</p>
          <p className="case-meta">
            <a href={RAG_ROOT} target="_blank" rel="noopener">self / public/knowledge-base ↗</a>
            <span>{CASE_HERO.meta}</span>
          </p>
        </section>

        <Workbench onHoverRef={setHoverRef} />

        <section className="section" id="boundary">
          <div className="section__head">
            <p className="kicker">01 / BOUNDARY</p>
            <h2>先划边界</h2>
            <p className="section__intro">导入和问答是两张独立的 LangGraph 图，各有自己的入口。计算密集的文档处理与 I/O 敏感的问答分开部署，故障和资源边界也跟着分开。</p>
          </div>
          <div className="boundary">
            <div className="boundary__card">
              <p className="boundary__tag">{BOUNDARY.a.tag}</p>
              <h3>{BOUNDARY.a.title}</h3>
              <p>{BOUNDARY.a.text}</p>
              <p className="boundary__file">{BOUNDARY.a.file}</p>
            </div>
            <div className="boundary__card boundary__card--focus">
              <p className="boundary__tag">{BOUNDARY.b.tag}</p>
              <h3>{BOUNDARY.b.title}</h3>
              <p>{BOUNDARY.b.text}</p>
              <p className="boundary__file">{BOUNDARY.b.file}</p>
            </div>
          </div>
          <div className="infra">
            <span className="infra__label">两边共用的基础设施</span>
            <ul>{BOUNDARY.infra.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        </section>

        <section className="section" id="pipelines">
          <div className="section__head">
            <p className="kicker">02 / PIPELINES</p>
            <h2>两条链路，各走各的</h2>
            <p className="section__intro">导入是一条直线，查询有分叉和一道门。下面是便于阅读的阶段视图；完整节点和条件分支在上面那张可交互的查询图里。</p>
          </div>

          <h3 className="subhead">导入 · 七个节点串成一条线</h3>
          <ol className="stages" aria-label="文档导入的七个节点">
            {IMPORT_STAGES.map(([no, name, file]) => (
              <li key={no}><span className="stages__no">{no}</span><b>{name}</b><small>{file}</small></li>
            ))}
          </ol>

          <h3 className="subhead">查询 · 两路并行，一道门</h3>
          <div className="flow" aria-label="查询链路：缓存未命中后压缩历史并确认主体，原查询与 HyDE 两路并行召回，RRF 融合后精排，四维权限过滤，最后生成答案并写缓存；联网检索只在完全无召回且未被权限短路时兜底。">
            <div className="flow__stage"><b>node_query_cache</b><span>两级缓存，命中即 END，检索和模型一次都不跑</span></div>
            <div className="flow__stem" />
            <div className="flow__stage"><b>history_compress → item_name_confirm → access_control</b><span>压历史、确认问的是哪份文档；判不出来就把问题抛回去，不猜</span></div>
            <div className="flow__stem" />
            <p className="flow__tag">{QUERY_FLOW.parallelTag}</p>
            <div className="flow__parallel">
              <div className="flow__stage"><b>node_search_embedding</b><span>原查询向量</span></div>
              <div className="flow__stage"><b>node_search_embedding_hyde</b><span>假想答案向量</span></div>
            </div>
            <div className="flow__stem flow__stem--join" />
            <div className="flow__stage"><b>node_rrf → node_rerank</b><span>按排名融合，再交给交叉编码器精排</span></div>
            <div className="flow__stem" />
            <div className="flow__stage flow__stage--gate"><b>node_perm_filter</b><span>四维判定、默认拒绝；只放行有权切片，denied 短路且不联网</span></div>
            <div className="flow__stem" />
            <div className="flow__stage"><b>node_answer_output → node_save_cache</b><span>只缓存成功生成的答案，拒绝文案不写进缓存</span></div>
            <p className="flow__note">{QUERY_FLOW.note}</p>
          </div>

          <h3 className="subhead" style={{ marginTop: 44 }}>五条批注 · 对应一次提问路上的五个决定</h3>
          <ol className="notes" id="annoList">
            {ANNOTATIONS.map((a) => (
              <li className={`note ${hoverRef === a.ref ? 'is-active' : ''}`} data-ref={a.ref} key={a.ref}>
                <span className="note__mark" aria-hidden="true">{a.ref.toUpperCase()}</span>
                <div><h3>{a.title}</h3><p>{a.text}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" id="code">
          <div className="section__head">
            <p className="kicker">03 / CODE</p>
            <h2>同样的事，写在代码里</h2>
            <p className="section__intro">三段都出自 knowledge-base，按源码压缩过：节点名、执行顺序和判定条件与文件一致，删了 import、日志和空行。注释写的是为什么这么写，不是这段在干什么。</p>
          </div>
          <CodePanel />
        </section>

        <section className="section" id="thinking">
          <div className="section__head">
            <p className="kicker">04 / DECISIONS</p>
            <h2>三个决定，以及什么时候会失效</h2>
            <p className="section__intro">结构好抄，判断不好抄。这三条是画上面那张图时真正犹豫过的地方，每条都写清代价和失效条件。</p>
          </div>
          <div className="rows">
            {DECISIONS.map((d) => (
              <article className="row" key={d.no}>
                <p className="row__no">{d.no}</p>
                <div>
                  <h3>{d.title}</h3>
                  <p className="row__text">{d.text}</p>
                  <p className="row__fail">{d.fail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="evidence">
          <div className="section__head">
            <p className="kicker">05 / EVIDENCE</p>
            <h2>每个结论，都能回到代码</h2>
            <p className="section__intro">上面的节点名、门和分支，都能在下面这些文件里对上。链接指向具体文件，不是仓库首页；每个文件都核过真实存在。</p>
          </div>
          <ul className="evidence">
            {EVIDENCE.map((e) => (
              <li key={e.no}>
                <a href={e.href} target="_blank" rel="noopener">
                  <span className="evidence__no">{e.no}</span>
                  <span className="evidence__body"><strong>{e.title}</strong><small>{e.path}</small></span>
                  <i aria-hidden="true">↗</i>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="section" id="known">
          <div className="section__head">
            <p className="kicker">06 / KNOWN GAPS</p>
            <h2>还没对齐的地方</h2>
            <p className="section__intro">写下来，是为了不把它藏起来。</p>
          </div>
          <ul className="log">
            {KNOWN.map((k) => <li className="log__item" key={k.title}><b>{k.title}</b>：{k.text}</li>)}
          </ul>
        </section>
      </main>
      <Footer left="罗富麟 · 02 项目拆解 / knowledge-base" back={{ label: '← 返回项目拆解目录', href: PROJECTS_URL }} />
    </>
  );
}
