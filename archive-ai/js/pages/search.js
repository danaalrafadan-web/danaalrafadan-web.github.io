/* ARCHIVE AI — البحث الذكي والمساعد التفاعلي */
(function (AA) {
  'use strict';
  const { L, esc, icon, ui } = AA;

  const st = { q: '', cat: '', type: '', lang: '', date: '', fav: false, sort: 'relevance', tab: 'search' };
  const chat = [];

  const DATES = () => [['', L('أي وقت', 'Any time')], ['7', L('آخر 7 أيام', 'Last 7 days')], ['30', L('آخر 30 يومًا', 'Last 30 days')], ['90', L('آخر 3 أشهر', 'Last 3 months')], ['365', L('آخر سنة', 'Last year')]];

  function filters() { return { cat: st.cat, type: st.type, lang: st.lang, date: st.date, fav: st.fav }; }

  function sortResults(list) {
    const by = {
      relevance: (a, b) => b.score - a.score || new Date(b.doc.date) - new Date(a.doc.date),
      newest: (a, b) => new Date(b.doc.date) - new Date(a.doc.date),
      oldest: (a, b) => new Date(a.doc.date) - new Date(b.doc.date),
      name: (a, b) => a.doc.title.localeCompare(b.doc.title, AA.lang)
    };
    return list.sort(by[st.sort] || by.relevance);
  }

  function resultCard(r, ts) {
    const d = r.doc;
    return `<article class="result glass spot" data-act="doc-open" data-id="${d.id}" tabindex="0" role="button" aria-label="${esc(d.title)}">
      ${ui.ftype(d.type)}
      <div style="min-width:0">
        <h3>${AA.highlight(d.title, ts)}${ui.isNew(d) ? `<span class="new-tag">${L('جديد', 'NEW')}</span>` : ''}</h3>
        <div class="r-meta">${ui.catChip(d.cat)}<span>${icon('globe')} ${ui.langLabel(d.lang)}</span><span>${icon('calendar')} ${AA.fmtDate(d.date)}</span><span class="num">${AA.fmtSize(d.size)}</span><span>${icon('users')} ${esc(AA.userName(d.author))}</span></div>
        <p class="r-sum"><span class="ai-label">${icon('sparkles')} ${L('ملخص', 'Summary')}</span>${AA.highlight(d.summary, ts)}</p>
        <div class="chips">${d.keywords.slice(0, 6).map(k => `<button class="chip ${ts.length && AA.isHit(k, ts) ? 'hit' : ''}" data-act="kw" data-q="${esc(k)}">${icon('hash')}${AA.highlight(k, ts)}</button>`).join('')}</div>
      </div>
      <div class="r-side">
        ${ts.length ? `<div class="rel" style="--p:${r.pct}" title="${L('مدى الارتباط بعبارة البحث', 'Relevance to your query')}"><b>${r.pct}%</b></div><span class="rel-lbl">${L('الارتباط', 'Relevance')}</span>` : ''}
        <div class="r-actions">
          <button class="mini-btn ${d.fav ? 'on' : ''}" data-act="fav" data-id="${d.id}" aria-label="${L('المفضلة', 'Favourite')}">${icon('star', d.fav ? 'fill' : '')}</button>
          <button class="mini-btn" data-act="doc-download" data-id="${d.id}" aria-label="${L('تنزيل', 'Download')}">${icon('download')}</button>
        </div>
      </div>
    </article>`;
  }

  function drawResults(root) {
    const out = AA.search.run(st.q, filters());
    const list = sortResults(out.results);
    // أعداد التصنيفات تحسب بنفس البحث والفلاتر الأخرى، مع تجاهل فلتر التصنيف نفسه
    const all = AA.search.run(st.q, Object.assign(filters(), { cat: '' })).results;
    const counts = {};
    all.forEach(r => { counts[r.doc.cat] = (counts[r.doc.cat] || 0) + 1; });
    root.querySelectorAll('[data-fcat]').forEach(b => {
      const id = b.dataset.fcat;
      b.querySelector('em').textContent = id ? (counts[id] || 0) : all.length;
      b.classList.toggle('on', st.cat === id);
    });

    const head = root.querySelector('#res-head .count');
    head.innerHTML = st.q.trim()
      ? L(`<b>${AA.fmtNum(list.length)}</b> نتيجة لعبارة «${esc(st.q)}» <span class="dim num">(${out.ms.toFixed(1)} ms)</span>`, `<b>${AA.fmtNum(list.length)}</b> results for “${esc(st.q)}” <span class="dim num">(${out.ms.toFixed(1)} ms)</span>`)
      : L(`تصفّح الأرشيف: <b>${AA.fmtNum(list.length)}</b> مستند`, `Browsing the archive: <b>${AA.fmtNum(list.length)}</b> documents`);
    const exp = root.querySelector('#expand');
    exp.innerHTML = out.expanded.length ? `${icon('languages')} ${L('وُسّع البحث تلقائيًا ليشمل:', 'Search was expanded to include:')} ${out.expanded.map(t => `<span class="chip">${esc(t)}</span>`).join('')}` : '';
    exp.style.display = out.expanded.length ? '' : 'none';

    const ts = out.terms.concat(out.expanded);
    root.querySelector('#results').innerHTML = list.length
      ? list.slice(0, 40).map(r => resultCard(r, ts)).join('')
      : `<div class="glass">${ui.empty('search', L('لا توجد نتائج مطابقة', 'No matching results'), L('جرّب كلمات أخرى أو أزل بعض الفلاتر. يمكنك البحث بالعربية أو الإنجليزية.', 'Try other words or remove some filters. You can search in Arabic or English.'), `<button class="btn sm" id="clear-f">${icon('refresh')} ${L('إعادة ضبط الفلاتر', 'Reset filters')}</button>`)}</div>`;
    AA.setParams({ q: st.q, cat: st.cat, type: st.type, lang: st.lang, date: st.date, fav: st.fav ? '1' : '', tab: st.tab === 'chat' ? 'chat' : '' });
    return list.length;
  }

  function popular() {
    const c = {};
    AA.store.state.activity.forEach(a => { if (a.type === 'search') c[a.q] = (c[a.q] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 6).map(x => x[0]);
  }

  /* ---------- المساعد: يجيب من البيانات التجريبية فقط ---------- */
  function detect(q) {
    const n = AA.norm(q);
    const ts = AA.terms(q);
    let cat = '';
    for (const c of AA.CATS) {
      if (c.id === 'other') continue;
      const names = AA.terms(c.ar + ' ' + c.en);
      if (names.some(x => ts.includes(x))) { cat = c.id; break; }
    }
    let type = '';
    if (/\bpdf\b/.test(n)) type = 'pdf';
    else if (/word|docx|وورد/.test(n)) type = 'docx';
    else if (/excel|xlsx|اكسل|جدول|جداول/.test(n)) type = 'xlsx';
    else if (/powerpoint|pptx|بوربوينت|عرض تقديمي|عروض/.test(n)) type = 'pptx';
    let lang = '';
    if (/english|انجليزي|بالانجليزي/.test(n)) lang = 'en';
    else if (/arabic|عربي|بالعربي/.test(n)) lang = 'ar';
    return {
      n, cat, type, lang,
      count: /(^|\s)(كم|عدد)(\s|$)|how many|count|number of/.test(n),
      latest: /احدث|اخر|جديد|latest|recent|newest|last/.test(n),
      fav: /مفضل|favou?rite/.test(n),
      sum: /لخص|ملخص|summar/.test(n)
    };
  }

  function scope(i) {
    const parts = [];
    if (i.cat) parts.push(L(`في تصنيف «${AA.catName(i.cat)}»`, `in “${AA.catName(i.cat)}”`));
    if (i.type) parts.push(L(`من نوع ${AA.TYPES[i.type].label}`, `of type ${AA.TYPES[i.type].label}`));
    if (i.lang) parts.push(L(i.lang === 'ar' ? 'باللغة العربية' : 'باللغة الإنجليزية', i.lang === 'ar' ? 'in Arabic' : 'in English'));
    return parts.join(' ');
  }
  const first = s => (String(s).split(/(?<=[.!?؟])\s/)[0] || s);
  const item = d => `<li><b>${esc(d.title)}</b> — ${esc(first(d.summary))}</li>`;

  function answer(q) {
    const i = detect(q);
    const pool = AA.docs().filter(d => (!i.cat || d.cat === i.cat) && (!i.type || d.type === i.type) && (!i.lang || d.lang === i.lang));
    const byDate = (a, b) => new Date(b.date) - new Date(a.date);
    const sc = scope(i);

    if (i.count) {
      const top = pool.slice().sort(byDate).slice(0, 3);
      return { html: L(`يوجد <b>${AA.docsCount(pool.length)}</b> ${sc || 'في الأرشيف'}.`, `There are <b>${AA.docsCount(pool.length)}</b> ${sc || 'in the archive'}.`) + (top.length ? `<br>${L('أحدثها:', 'Most recent:')}<ul>${top.map(item).join('')}</ul>` : ''), src: top.map(d => d.id) };
    }
    if (i.fav) {
      const f = pool.filter(d => d.fav).sort(byDate);
      return f.length ? { html: L(`في المفضلة <b>${AA.docsCount(f.length)}</b>:`, `You have <b>${f.length}</b> favourites:`) + `<ul>${f.slice(0, 5).map(item).join('')}</ul>`, src: f.slice(0, 5).map(d => d.id) }
        : { html: L('لا توجد ملفات في المفضلة بعد. اضغط النجمة بجانب أي ملف لإضافته.', 'No favourites yet. Tap the star next to any file to add it.'), src: [] };
    }
    const found = AA.search.run(q, { cat: i.cat, type: i.type, lang: i.lang, ask: true });
    if (i.latest && !found.terms.length) {
      const top = pool.slice().sort(byDate).slice(0, 5);
      return { html: L(`أحدث المستندات ${sc}:`, `Latest documents ${sc}:`) + `<ul>${top.map(d => `<li><b>${esc(d.title)}</b> — ${AA.timeAgo(d.date)}</li>`).join('')}</ul>`, src: top.map(d => d.id) };
    }
    if (!found.terms.length && (i.cat || i.type || i.lang)) {
      const top = pool.slice().sort(byDate).slice(0, 5);
      return { html: L(`وجدت <b>${AA.docsCount(pool.length)}</b> ${sc}، أبرزها:`, `I found <b>${AA.docsCount(pool.length)}</b> ${sc}, including:`) + `<ul>${top.map(item).join('')}</ul>`, src: top.map(d => d.id) };
    }
    let res = found.results;
    if (i.latest) res = res.slice().sort((a, b) => byDate(a.doc, b.doc));
    if (!res.length) {
      return { html: L('لم أجد مستندات مرتبطة بسؤالك في البيانات المتاحة. جرّب كلمات مثل: «البودكاست»، «الميزانية»، «التحقق من الأخبار» أو «data governance».', 'I couldn’t find related documents in the available data. Try words like “podcast”, “budget”, “verification” or “الميزانية”.'), src: [] };
    }
    const top = res.slice(0, 3).map(r => r.doc);
    if (i.sum) {
      const d = top[0];
      return { html: L(`ملخص «<b>${esc(d.title)}</b>»:`, `Summary of “<b>${esc(d.title)}</b>”:`) + `<br>${esc(d.summary)}<br><span class="dim">${L('الكلمات المفتاحية: ', 'Keywords: ')}${esc(d.keywords.join(L('، ', ', ')))}</span>`, src: [d.id] };
    }
    return {
      html: L(`وجدت <b>${AA.docsCount(res.length)}</b> ${res.length > 2 ? 'مرتبطة' : res.length === 2 ? 'مرتبطين' : 'مرتبطًا'} بسؤالك${sc ? ' ' + sc : ''}. الأقرب:`, `I found <b>${AA.docsCount(res.length)}</b> related to your question${sc ? ' ' + sc : ''}. Closest matches:`) + `<ul>${top.map(item).join('')}</ul>` + (res.length > 3 ? L(`<span class="dim">ويوجد ${res.length - 3} نتائج أخرى في تبويب نتائج البحث.</span>`, `<span class="dim">${res.length - 3} more in the Results tab.</span>`) : ''),
      src: top.map(d => d.id)
    };
  }

  function msgHtml(m) {
    if (m.role === 'user') return `<div class="msg user">${ui.avatar(AA.me(), 'sm')}<div class="bubble">${esc(m.text)}</div></div>`;
    if (m.typing) return `<div class="msg bot"><span class="bot-av" style="width:28px;height:28px;font-size:14px;border-radius:9px">${icon('bot')}</span><div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div></div>`;
    return `<div class="msg bot"><span class="bot-av" style="width:28px;height:28px;font-size:14px;border-radius:9px">${icon('bot')}</span><div class="bubble">${m.html}
      ${m.src && m.src.length ? `<div class="src">${m.src.map(id => { const d = AA.doc(id); return d ? `<button class="chip" data-act="doc-open" data-id="${id}">${icon('file')}${esc(d.title.length > 38 ? d.title.slice(0, 36) + '…' : d.title)}</button>` : ''; }).join('')}</div>` : ''}
      <div class="basis">${icon('info')} ${L('إجابة مبنية على مطابقة نصية في البيانات التجريبية، وليست من نموذج ذكاء اصطناعي.', 'Answer built from text matching over the sample data, not from an AI model.')}</div></div></div>`;
  }

  function drawChat(root) {
    const body = root.querySelector('#chat-body');
    if (!body) return;
    if (!chat.length) {
      const ex = [L('كم عدد التقارير في الأرشيف؟', 'How many reports are in the archive?'), L('ما المستندات المتعلقة بالذكاء الاصطناعي؟', 'Which documents cover artificial intelligence?'), L('لخص دليل التحقق من الأخبار', 'Summarise the breaking news handbook'), L('ما أحدث الملفات المالية؟', 'What are the latest finance files?')];
      body.innerHTML = `<div class="chat-welcome"><span class="bot-av">${icon('bot')}</span><h3>${L('اسأل عن أي مستند في الأرشيف', 'Ask about anything in the archive')}</h3>
        <p>${L('اكتب سؤالك بالعربية أو الإنجليزية، وسأبحث في عناوين المستندات وملخصاتها وكلماتها المفتاحية وأرجع لك الإجابة مع المصادر.', 'Ask in Arabic or English. I’ll look through titles, summaries and keywords and reply with sources.')}</p>
        <div class="examples">${ex.map(x => `<button data-ex="${esc(x)}">${icon('message')}<span>${esc(x)}</span></button>`).join('')}</div></div>`;
      return;
    }
    body.innerHTML = chat.map(msgHtml).join('');
    body.scrollTop = body.scrollHeight;
  }

  function ask(root, q) {
    q = q.trim();
    if (!q) return AA.toast('warning', L('اكتب سؤالك أولًا', 'Type a question first'), '');
    if (chat.some(m => m.typing)) return;
    chat.push({ role: 'user', text: q });
    const typing = { role: 'bot', typing: true };
    chat.push(typing);
    drawChat(root);
    const a = answer(q);
    AA.log('search', { q, results: a.src.length, detail: 'chat' });
    AA.store.save();
    setTimeout(() => {
      chat.splice(chat.indexOf(typing), 1, { role: 'bot', html: a.html, src: a.src });
      if (root.isConnected) drawChat(root);
    }, 550 + Math.random() * 400);
  }

  AA.pages.search = {
    title: () => L('البحث الذكي', 'AI Search'),
    render(p) {
      // قيم الرابط تتقدم على الحالة المحفوظة عند الدخول من رابط مباشر
      if (p.q != null || p.cat || p.type || p.fav || p.lang || p.date) {
        Object.assign(st, { q: p.q || '', cat: p.cat || '', type: p.type || '', lang: p.lang || '', date: p.date || '', fav: p.fav === '1' });
      }
      st.tab = p.tab === 'chat' ? 'chat' : 'search';
      const pop = popular();
      const opt = (key, val, label, extra) => `<button class="f-opt ${st[key] === val ? 'on' : ''}" data-k="${key}" data-v="${esc(val)}" ${extra || ''}>${label}</button>`;
      return `
      <section class="search-hero glass">
        <span class="ai-pill">${icon('sparkles')} AI Search · ${L('بحث ذكي ثنائي اللغة', 'Bilingual smart search')}</span>
        <h1>${L('ابحث في الأرشيف <span class="grad">بذكاء</span>', 'Search the archive <span class="grad">smarter</span>')}</h1>
        <p>${L('ابحث باسم الملف أو الموضوع أو الكلمات المفتاحية بالعربية أو الإنجليزية. النتائج مرتبة حسب مدى ارتباطها بعبارتك، مع ملخص لكل مستند.', 'Search by file name, topic or keyword in Arabic or English. Results are ranked by relevance with a summary for each document.')}</p>
        <form class="big-search" id="big-search" role="search">
          ${icon('search')}
          <input id="q" type="search" value="${esc(st.q)}" autocomplete="off" placeholder="${L('مثال: الذكاء الاصطناعي في غرف الأخبار، podcast، الميزانية…', 'e.g. AI in newsrooms, البودكاست, budget…')}" aria-label="${L('عبارة البحث', 'Search query')}">
          <button class="btn primary" type="submit">${icon('sparkles')} ${L('بحث', 'Search')}</button>
        </form>
        <div class="suggest"><span>${L('الأكثر بحثًا:', 'Popular:')}</span>${pop.map(q => `<button class="chip" data-sq="${esc(q)}">${esc(q)}</button>`).join('')}</div>
        <div class="tabs" role="tablist">
          <button role="tab" class="${st.tab === 'search' ? 'on' : ''}" data-tab="search" aria-selected="${st.tab === 'search'}">${icon('list')} ${L('نتائج البحث', 'Results')}</button>
          <button role="tab" class="${st.tab === 'chat' ? 'on' : ''}" data-tab="chat" aria-selected="${st.tab === 'chat'}">${icon('message')} ${L('اسأل الأرشيف', 'Ask the archive')}</button>
        </div>
      </section>
      ${st.tab === 'search' ? `
      <button class="btn filters-toggle" id="toggle-f" aria-expanded="false" aria-controls="filters">${icon('filter')} ${L('الفلاتر', 'Filters')}</button>
      <div class="search-layout">
        <aside class="filters glass" id="filters" aria-label="${L('الفلاتر', 'Filters')}">
          <div><h4>${L('التصنيف', 'Category')}</h4><div class="f-opts">
            <button class="f-opt" data-fcat="" data-k="cat" data-v=""><span class="dot" style="--c:#fff"></span><span>${L('كل التصنيفات', 'All categories')}</span><em></em></button>
            ${AA.CATS.map(c => `<button class="f-opt" data-fcat="${c.id}" data-k="cat" data-v="${c.id}"><span class="dot" style="--c:${c.color}"></span><span>${esc(AA.lang === 'ar' ? c.ar : c.en)}</span><em></em></button>`).join('')}
          </div></div>
          <div><h4>${L('تاريخ الإضافة', 'Date added')}</h4><div class="f-opts">${DATES().map(([v, l]) => opt('date', v, `<span>${l}</span>`)).join('')}</div></div>
          <div><h4>${L('نوع الملف', 'File type')}</h4><div class="chips">${[['', L('الكل', 'All')]].concat(Object.keys(AA.TYPES).map(t => [t, AA.TYPES[t].label])).map(([v, l]) => `<button class="chip ${st.type === v ? 'hit' : ''}" data-k="type" data-v="${v}">${l}</button>`).join('')}</div></div>
          <div><h4>${L('اللغة', 'Language')}</h4><div class="chips">${[['', L('الكل', 'All')], ['ar', L('عربي', 'Arabic')], ['en', L('إنجليزي', 'English')]].map(([v, l]) => `<button class="chip ${st.lang === v ? 'hit' : ''}" data-k="lang" data-v="${v}">${l}</button>`).join('')}</div></div>
          <label class="switch"><input type="checkbox" id="f-fav" ${st.fav ? 'checked' : ''}><i></i>${L('المفضلة فقط', 'Favourites only')}</label>
          <button class="btn sm" id="reset-f">${icon('refresh')} ${L('إعادة ضبط الفلاتر', 'Reset filters')}</button>
        </aside>
        <section>
          <div class="results-head" id="res-head"><span class="count"></span>
            <div class="tools"><label class="sr-only" for="sort">${L('الترتيب', 'Sort')}</label><select class="select" id="sort">
              <option value="relevance">${L('الأكثر ارتباطًا', 'Most relevant')}</option><option value="newest">${L('الأحدث', 'Newest')}</option><option value="oldest">${L('الأقدم', 'Oldest')}</option><option value="name">${L('الاسم', 'Name')}</option>
            </select></div>
            <div class="expand-note" id="expand"></div>
          </div>
          <div class="results" id="results" aria-live="polite"></div>
        </section>
      </div>` : `
      <section class="chat glass">
        <div class="chat-head"><span class="bot-av">${icon('bot')}</span><div><b>${L('مساعد الأرشيف التجريبي', 'Archive assistant (demo)')}</b><small>${L('يجيب من البيانات التجريبية المتاحة فقط', 'Answers only from the available sample data')}</small></div>
          <div class="tools"><span class="chip warn">${icon('info')} ${L('مطابقة نصية — ليس AI حقيقي', 'Text matching — not real AI')}</span><button class="btn ghost sm" id="chat-clear">${icon('trash')} ${L('مسح', 'Clear')}</button></div></div>
        <div class="chat-body" id="chat-body" aria-live="polite"></div>
        <form class="chat-input" id="chat-form"><input class="input" id="chat-q" autocomplete="off" placeholder="${L('اكتب سؤالك عن المستندات…', 'Ask about the documents…')}" aria-label="${L('سؤالك', 'Your question')}"><button class="btn primary" type="submit" aria-label="${L('إرسال', 'Send')}">${icon('send')}</button></form>
      </section>`}`;
    },
    mount(root, p) {
      const qIn = root.querySelector('#q');
      const submit = () => {
        st.q = qIn.value.trim();
        if (st.tab === 'chat') { if (st.q) { ask(root, st.q); qIn.value = ''; st.q = ''; } return; }
        const n = drawResults(root);
        if (st.q) { AA.log('search', { q: st.q, results: n }); AA.store.save(); }
      };
      root.querySelector('#big-search').addEventListener('submit', e => { e.preventDefault(); submit(); });
      root.querySelectorAll('[data-sq]').forEach(b => b.addEventListener('click', () => { qIn.value = b.dataset.sq; submit(); }));
      root.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { st.tab = b.dataset.tab; AA.go('search', Object.assign({}, st.q ? { q: st.q } : {}, st.tab === 'chat' ? { tab: 'chat' } : {})); }));

      if (st.tab === 'chat') {
        drawChat(root);
        const form = root.querySelector('#chat-form'), inp = root.querySelector('#chat-q');
        form.addEventListener('submit', e => { e.preventDefault(); ask(root, inp.value); inp.value = ''; });
        root.querySelector('#chat-body').addEventListener('click', e => { const b = e.target.closest('[data-ex]'); if (b) ask(root, b.dataset.ex); });
        root.querySelector('#chat-clear').addEventListener('click', () => { chat.length = 0; drawChat(root); AA.toast('success', L('تم مسح المحادثة', 'Conversation cleared'), ''); });
        setTimeout(() => inp.focus(), 50);
        return;
      }

      const live = AA.debounce(() => { st.q = qIn.value; drawResults(root); }, 180);
      qIn.addEventListener('input', live);
      root.querySelector('#sort').value = st.sort;
      root.querySelector('#sort').addEventListener('change', e => { st.sort = e.target.value; drawResults(root); });
      root.querySelector('.filters').addEventListener('click', e => {
        const b = e.target.closest('[data-k]');
        if (!b) return;
        st[b.dataset.k] = b.dataset.v;
        root.querySelectorAll(`.filters [data-k="${b.dataset.k}"]`).forEach(x => x.classList.toggle(x.classList.contains('chip') ? 'hit' : 'on', x.dataset.v === b.dataset.v));
        drawResults(root);
      });
      root.querySelector('#f-fav').addEventListener('change', e => { st.fav = e.target.checked; drawResults(root); });
      const reset = () => {
        Object.assign(st, { cat: '', type: '', lang: '', date: '', fav: false });
        root.querySelectorAll('.filters [data-k]').forEach(x => x.classList.toggle(x.classList.contains('chip') ? 'hit' : 'on', x.dataset.v === ''));
        root.querySelector('#f-fav').checked = false;
        drawResults(root);
        AA.toast('info', L('أعيد ضبط الفلاتر', 'Filters reset'), '');
      };
      root.querySelector('#reset-f').addEventListener('click', reset);
      root.querySelector('#toggle-f').addEventListener('click', e => {
        const open = root.querySelector('#filters').classList.toggle('open');
        e.currentTarget.setAttribute('aria-expanded', open);
      });
      root.addEventListener('click', e => { if (e.target.closest('#clear-f')) reset(); });
      root.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.result')) e.target.click(); });

      const n = drawResults(root);
      // البحث القادم من شريط البحث العلوي أو من الكلمات المفتاحية يُسجّل مرة واحدة
      if (p.run === '1' && st.q) { AA.log('search', { q: st.q, results: n }); AA.store.save(); AA.renderChrome(); }
      if (!st.q) qIn.focus();
    }
  };
})(window.AA);
