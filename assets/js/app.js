/* =========================================================================
   Luo — interaction layer
   零依赖。三件事：终端、代码高亮、批注联动。任何一块挂掉不影响其余。
   ========================================================================= */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------------------------------------------------------- 终端 */

  const TERM = (() => {
    const root = $('#term');
    const log = $('#termLog');
    const form = $('#termForm');
    const input = $('#termInput');
    if (!root || !log || !form || !input) return;

    const history = [];
    let cursor = -1;

    const scroll = () => { log.parentElement.scrollTop = log.parentElement.scrollHeight; };

    const line = (html, cls) => {
      const p = document.createElement('p');
      if (cls) p.className = cls;
      p.innerHTML = html;
      log.appendChild(p);
      scroll();
      return p;
    };

    const echo = (cmd) => line(
      `<span class="t-prompt">luo@local ~ %</span> <span class="t-cmd">${esc(cmd)}</span>`
    );

    const out = (text) => line(esc(text), 't-out');

    const STACK = [
      '{',
      '  "lang":  ["Python", "TypeScript"],',
      '  "api":   ["FastAPI", "LangGraph"],',
      '  "db":    ["PostgreSQL", "psycopg3"],',
      '  "vec":   ["Milvus", "MongoDB"],',
      '  "infra": ["Docker", "MinIO", "Redis"],',
      '  "check": ["mypy strict", "pytest"]',
      '}',
    ];

    const REPOS = {
      'ai-learning-site': ['https://github.com/luofulin12397/ai-learning-site', ''],
      'knowledge-base': ['https://github.com/luofulin12397/self', 'public/knowledge-base'],
      'smart-bi': ['https://github.com/luofulin12397/self', 'public/smart-bi'],
      'log-patrol': ['https://github.com/luofulin12397/self', 'public/log-patrol'],
      'risk-engine': ['https://github.com/luofulin12397/AI_RISK_HEALTH', ''],
    };

    const COMMANDS = {
      help: () => [
        '可用命令：',
        '  whoami                我是谁',
        '  ls                    看看有哪些仓库',
        '  cat stack.json        技术栈',
        '  cat tradeoffs.md      四个取舍的摘要',
        '  explain <topic>       perm / hyde / rrf / plan / milvus',
        '  open <repo>           打开仓库，如 open knowledge-base',
        '  clear                 清屏',
        '',
        '上下键翻历史，Tab 补全。',
      ],

      whoami: () => ['罗富麟 — 后端。检索链路、异步任务、静态站。'],

      ls: () => ['ai-learning-site/  knowledge-base/  smart-bi/  risk-engine/  log-patrol/  personal-site/'],

      'cat stack.json': () => STACK,

      'cat tradeoffs.md': () => [
        '# 四个取舍',
        '',
        '权限  精排之后判权限，denied 绝不联网兜底。代价：无权内容也被检索一遍。',
        '查询  模型只出意图，SQL 由服务端编译。代价：加指标要改代码。',
        '召回  原查询 + HyDE 两路，RRF 再精排。代价：多一次模型调用。',
        '异步  spool 队列 + 单写入边界，串行派发。代价：吞吐被按死。',
        '',
        '每条都写了失效条件，往上滚能看到全文。',
      ],

      perm: () => [
        'perm · 四维权限（knowledge-base）',
        '',
        '全局 / 部门 / 角色 / 个人，四者取或，默认拒绝。判定点在精排之后、',
        '提示词组装之前：只有放行的切片才会进上下文。',
        '',
        '关键不变量：denied 分支绝不触发联网兜底。否则用户换个问法，',
        '就能从公网拿到本该无权的内容，权限边界等于没设。',
        '',
        '什么时候别用：语料本身不分级时，这层只是给每次请求加两次查询。',
      ],

      hyde: () => [
        'hyde · 假想答案召回（knowledge-base）',
        '',
        '先让模型写一段「答案大概长这样」，再用这段去检索。',
        '短问题的向量离文档很远，假想答案的向量反而更靠近。',
        '',
        '它和原查询并行跑，两路结果进 RRF 融合。不是替代，是补充。',
        '',
        '什么时候别用：问题里带精确型号、编码、人名时，改写会把原词弄丢，召回更差。',
      ],

      rrf: () => [
        'rrf · 按排名融合',
        '',
        '不看两路各自的分数，只看名次：score = Σ 1 / (k + rank)。',
        '好处是两路分数量纲不同也不用归一化，谁在前谁贡献大。',
        '',
        '代价：扔掉了分数里的置信度信息。真需要置信度时，得回到加权融合。',
      ],

      plan: () => [
        'plan · 服务端编译查询计划（smart-bi）',
        '',
        '模型只输出 Intent：要哪个指标、切哪些维、时间范围。',
        '服务端拿白名单指标表和枚举维值校验，编译成带参数的 QueryPlan。',
        '',
        '执行侧固定只读事务、固定角色、绝对期限，statement_timeout 和 lock_timeout 都设。',
        '模型碰不到 SQL，所以注入和慢查询这两个问题在这一层就不存在了。',
        '',
        '什么时候别用：探索式分析。白名单覆盖不了「随便看看」这种需求。',
      ],

      milvus: () => [
        'milvus · 向量检索（knowledge-base）',
        '',
        'BGE-M3 出向量，HNSW 建索引。M 决定每层出度，efConstruction 决定建索引时搜多深。',
        'M 调大召回更好、内存按 M 线性涨；efConstruction 只影响构建时间，不影响查询延迟。',
        '这两个参数经常被当成一回事。',
        '',
        '什么时候别用：语料小、过滤条件重的时候，pgvector 或 BM25 混排更省。',
      ],
    };

    const NAMES = Object.keys(COMMANDS);
    const TOPICS = ['perm', 'hyde', 'rrf', 'plan', 'milvus'];
    const SCROLL_TARGETS = { notes: '#notes', code: '#code', system: '#system', tradeoffs: '#tradeoffs', work: '#work' };

    function resolve(raw) {
      const s = raw.trim().replace(/\s+/g, ' ');
      if (!s) return null;
      const low = s.toLowerCase();

      if (low === 'help' || low === '?' || low === 'man') return { key: 'help' };
      if (low === 'clear' || low === 'cls') return { key: 'clear' };
      if (COMMANDS[low]) return { key: low };

      const cat = low.match(/^cat\s+(\S+)$/);
      if (cat) {
        const target = cat[1].replace(/^\.\//, '');
        const hit = Object.keys(COMMANDS).find((k) => k === `cat ${target}`);
        if (hit) return { key: hit };
        return { error: `cat: ${target}: No such file or directory` };
      }

      if (low === 'explain') return { error: `explain: 用法 explain <topic>。可用：${TOPICS.join(' / ')}` };

      const ex = low.match(/^explain\s+(\S+)$/);
      if (ex) {
        const topic = ex[1].replace(/[^a-z]/g, '');
        if (COMMANDS[topic]) return { key: topic };
        return { error: `explain: 没有这个主题 ${topic}。试试 ${TOPICS.join(' / ')}` };
      }

      if (low === 'open') return { error: `open: 用法 open <repo>。可用：github / ${Object.keys(REPOS).join(' / ')}` };

      const open = low.match(/^open\s+(\S+)$/);
      if (open) {
        const where = open[1].replace(/\/$/, '');
        if (where === 'github' || where === 'repo') return { key: 'open github' };
        if (REPOS[where]) return { repo: where };
        if (SCROLL_TARGETS[where]) return { scroll: where };
        return { error: `open: 打不开 ${where}。试试 github / ${Object.keys(REPOS).join(' / ')}` };
      }

      return { error: `zsh: command not found: ${s.split(' ')[0]}` };
    }

    function run(raw) {
      const cmd = raw.trim();
      if (!cmd) { echo(''); return; }
      history.push(cmd);
      cursor = history.length;
      echo(cmd);

      const res = resolve(cmd);
      if (!res) return;

      if (res.error) {
        line(esc(res.error), 't-err');
        line('输入 help 看可用命令。', 't-out');
        return;
      }

      if (res.key === 'clear') { log.innerHTML = ''; return; }

      if (res.key === 'open github') {
        out('正在打开 github.com/luofulin12397');
        window.open('https://github.com/luofulin12397', '_blank', 'noopener');
        return;
      }

      if (res.repo) {
        const [url, sub] = REPOS[res.repo];
        out(`正在打开 ${url.replace('https://', '')}${sub ? `（${sub}）` : ''}`);
        window.open(url, '_blank', 'noopener');
        return;
      }

      if (res.scroll) {
        const el = $(SCROLL_TARGETS[res.scroll]);
        if (el) {
          el.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
          out(`跳到 ${SCROLL_TARGETS[res.scroll]}`);
        }
        return;
      }

      const lines = COMMANDS[res.key]();
      lines.forEach((l, i) => {
        if (i === 0) line(esc(l), 't-head');
        else line(esc(l), 't-out');
      });
    }

    function complete() {
      const v = input.value.trim().toLowerCase();
      if (!v) return;
      const pool = [
        ...NAMES.filter((k) => !k.includes(' ')),
        'clear',
        'open github',
        ...Object.keys(REPOS).map((r) => `open ${r}`),
        ...Object.keys(SCROLL_TARGETS).map((k) => `open ${k}`),
        ...TOPICS.map((t) => `explain ${t}`),
      ];
      const hits = pool.filter((c) => c.startsWith(v));
      if (!hits.length) return;
      if (hits.length === 1) { input.value = hits[0]; return; }

      // 多个候选：先补到公共前缀，补不动了才把候选列出来
      let prefix = hits[0];
      for (const h of hits) {
        let i = 0;
        while (i < prefix.length && h[i] === prefix[i]) i++;
        prefix = prefix.slice(0, i);
      }
      if (prefix.length > v.length) { input.value = prefix; return; }
      echo(input.value);
      out(hits.join('   '));
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      run(input.value);
      input.value = '';
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!history.length) return;
        cursor = Math.max(0, cursor - 1);
        input.value = history[cursor] || '';
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!history.length) return;
        cursor = Math.min(history.length, cursor + 1);
        input.value = history[cursor] || '';
      } else if (e.key === 'Tab') {
        e.preventDefault();
        complete();
      } else if (e.key === 'Escape') {
        input.value = '';
      } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        log.innerHTML = '';
      }
    });

    root.addEventListener('click', (e) => {
      if (window.getSelection().toString()) return;
      if (e.target.closest('a')) return;
      input.focus();
    });

    /* 开场：把静态内容换成敲出来的。没有 JS 时静态文本仍可读。 */
    async function boot() {
      const stack = STACK.join('\n');

      const script = [
        ['whoami', [COMMANDS.whoami()[0]]],
        ['ls', [COMMANDS.ls()[0]]],
        ['cat stack.json', [stack]],
      ];
      log.innerHTML = '';
      const pace = reduce.matches ? 0 : 28;

      for (const [cmd, outs] of script) {
        const p = line(`<span class="t-prompt">luo@local ~ %</span> <span class="t-cmd"></span>`);
        const span = p.querySelector('.t-cmd');
        if (pace) {
          for (const ch of cmd) {
            span.textContent += ch;
            await new Promise((r) => setTimeout(r, pace + Math.random() * 26));
          }
          await new Promise((r) => setTimeout(r, 110));
        } else {
          span.textContent = cmd;
        }
        outs.forEach((o) => out(o));
      }
      if (pace) line('输入 help 看还能做什么。', 't-out');
    }

    if (document.readyState === 'complete') boot();
    else window.addEventListener('load', boot, { once: true });
  })();

  /* -------------------------------------------------------------- 代码高亮 */

  const CODE = (() => {
    const body = $('#codeBody');
    const target = $('#codeText');
    const tabs = $$('.tab');
    if (!body || !target || !tabs.length) return;

    const KW_PY = 'async|await|def|class|return|if|elif|else|for|while|try|except|finally|raise|with|as|import|from|yield|None|True|False|in|not|and|or|lambda|pass|global|SET';

    const RULES = {
      python: [
        { cls: 'c-com', src: '"""[\\s\\S]*?"""' },
        { cls: 'c-com', src: '#[^\\n]*' },
        { cls: 'c-str', src: '"[^"\\n]*"|\'[^\'\\n]*\'' },
        { cls: 'c-key', src: `\\b(?:${KW_PY})\\b` },
        { cls: 'c-num', src: '\\b\\d+(?:\\.\\d+)?\\b' },
      ],
      yaml: [
        { cls: 'c-com', src: '#[^\\n]*' },
        { cls: 'c-str', src: '"[^"\\n]*"|\'[^\'\\n]*\'' },
        { cls: 'c-key', src: '^[ \\t-]*[A-Za-z_][\\w.-]*(?=:)', flags: 'm' },
        { cls: 'c-num', src: '\\b\\d+\\b' },
      ],
    };
    RULES.graph = RULES.python;
    RULES.query = RULES.python;
    RULES.compose = RULES.yaml;

    function highlight(src, rules) {
      const re = new RegExp(rules.map((r) => `(${r.src})`).join('|'), 'gm');
      let html = '';
      let last = 0;
      let m;
      while ((m = re.exec(src)) !== null) {
        if (m[0] === '') { re.lastIndex++; continue; }
        html += esc(src.slice(last, m.index));
        let cls = '';
        for (let i = 1; i <= rules.length; i++) {
          if (m[i] !== undefined) { cls = rules[i - 1].cls; break; }
        }
        html += `<span class="${cls}">${esc(m[0])}</span>`;
        last = m.index + m[0].length;
      }
      return html + esc(src.slice(last));
    }

    const SNIPPETS = {
      graph: {
        lang: 'python',
        code: `graph = StateGraph(QueryGraphState)

# 十二个节点。入口是缓存：命中即结束，检索和模型一次都不跑
graph.set_entry_point("node_query_cache")


def node_perm_filter_after(state):
    """命中门：只有向量路完全无召回、且未被权限短路时，才允许联网兜底。

    安全不变量：denied 分支绝不联网。否则无权主题换个问法就能
    从公网拿到同类信息，四维权限边界被兜底旁路掉。
    """
    if state.get("answer"):
        return "node_answer_output"        # 权限短路，或前面已早退
    if not state.get("rrf_chunks") and not state.get("reranked_docs"):
        return "node_web_search_mcp"       # 真的什么都没召回
    return "node_answer_output"


# 两路召回并行，RRF 融合后精排；精排完才判权限
graph.add_edge("node_search_embedding", "node_rrf")
graph.add_edge("node_search_embedding_hyde", "node_rrf")
graph.add_edge("node_rrf", "node_rerank")
graph.add_edge("node_rerank", "node_perm_filter")`,
      },
      query: {
        lang: 'python',
        code: `async def execute(settings, plan, deadline):
    # plan 不是模型写的 SQL。模型只出意图，SQL 由服务端按白名单编译
    if not settings.db_password:
        raise PublicError("configuration_missing", 503, "只读凭据尚未配置")

    # 期限跟模型调用、维值查询共用一份，不给每条语句重新发预算
    if deadline - monotonic() <= 0:
        raise PublicError("query_timeout", 504, "已超过处理期限", True)

    async with asyncio.timeout_at(min(deadline, monotonic() + 5)):
        conn = await psycopg.AsyncConnection.connect(url, connect_timeout=5)

    async with asyncio.timeout_at(deadline):
        await conn.execute("SET TRANSACTION READ ONLY")
        if plan.role == "med_lab_reader":
            # 角色只从服务端固定计划来，模型说不出这个角色名
            await conn.execute("SET LOCAL ROLE med_lab_reader")
        await conn.execute("SET LOCAL lock_timeout = '1s'")
        await conn.execute("SELECT set_config('statement_timeout', %s, true)", (ms,))
        cursor = await conn.execute(plan.sql, plan.params)
        return await cursor.fetchall()
    except (psycopg.errors.QueryCanceled, psycopg.errors.LockNotAvailable):
        # 锁等不到和语句超时，对用户是同一件事：重试，别去改参数
        raise PublicError("query_timeout", 504, "查询超时", True) from None`,
      },
      compose: {
        lang: 'yaml',
        code: `services:
  app:
    image: \${APP_IMAGE:-medical-query-app:task16}
    # 只绑回环。外面必须还有一层反代，否则这条等于没写
    ports: ["127.0.0.1:18080:8000"]
    secrets: [db_password, deepseek_key]

    read_only: true                      # 根文件系统只读
    tmpfs: ["/tmp:rw,noexec,nosuid,size=16m,mode=1777"]
    security_opt: ["no-new-privileges:true"]
    cap_drop: [ALL]
    cap_add: [SETUID, SETGID]            # 只在读完 secret 后降权，业务以 10001 跑

    mem_limit: 512m
    pids_limit: 64

    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request as u; u.urlopen('http://127.0.0.1:8000/health', timeout=2)"]
      interval: 10s
      retries: 6

    logging:
      driver: json-file
      # 日志不设上限，磁盘迟早会在最不该满的时候满
      options: { max-size: 10m, max-file: "3" }`,
      },
    };

    function show(lang) {
      const snip = SNIPPETS[lang];
      if (!snip) return;
      target.innerHTML = highlight(snip.code, RULES[snip.lang]);

      tabs.forEach((t) => {
        const on = t.dataset.lang === lang;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      body.setAttribute('aria-labelledby', `tab-${lang}`);
      body.scrollTop = 0;
    }

    tabs.forEach((t) => {
      t.addEventListener('click', () => show(t.dataset.lang));
      t.addEventListener('keydown', (e) => {
        const i = tabs.indexOf(t);
        let next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (next) {
          e.preventDefault();
          next.focus();
          show(next.dataset.lang);
        }
      });
    });

    show('graph');
  })();

  /* -------------------------------------------------------------- 批注联动 */

  (() => {
    const nodes = $$('.node[data-ref]');
    const marks = $$('.mark[data-ref]');
    const notes = $$('.note[data-ref]');
    if (!nodes.length || !notes.length) return;

    const all = [...nodes, ...marks, ...notes];

    function setActive(ref, on) {
      all.forEach((el) => {
        if (el.dataset.ref === ref) el.classList.toggle('is-active', on);
      });
    }

    function bind(el) {
      const ref = el.dataset.ref;
      if (!ref) return;
      el.addEventListener('pointerenter', () => setActive(ref, true));
      el.addEventListener('pointerleave', () => setActive(ref, false));
      el.addEventListener('focus', () => setActive(ref, true));
      el.addEventListener('blur', () => setActive(ref, false));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(el); }
      });
      el.addEventListener('click', () => jump(el));
    }

    function jump(el) {
      const ref = el.dataset.ref;
      const note = notes.find((n) => n.dataset.ref === ref);
      if (!note) return;
      setActive(ref, true);
      note.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'center' });
      setTimeout(() => setActive(ref, false), 2200);
    }

    [...nodes, ...notes].forEach(bind);

    marks.forEach((m) => {
      m.style.cursor = 'pointer';
      m.addEventListener('pointerenter', () => setActive(m.dataset.ref, true));
      m.addEventListener('pointerleave', () => setActive(m.dataset.ref, false));
      m.addEventListener('click', () => jump(m));
    });
  })();
})();
