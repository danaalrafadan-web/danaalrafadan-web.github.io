/* ARCHIVE AI — التحليل والتلخيص (AI Insights) والتقرير القابل للتنزيل */
(function (AA) {
  'use strict';
  const { L, esc, icon, ui } = AA;

  const st = { src: 'doc', docId: '', text: '' };

  function topTopics(n) {
    const c = {};
    AA.docs().forEach(d => d.keywords.forEach(k => { const key = k.trim().toLowerCase(); if (key) c[key] = c[key] || { word: k.trim(), n: 0 }; if (key) c[key].n++; }));
    // نجمع الكلمات حسب جذرها حتى لا تتكرر «البودكاست» و«بودكاست»
    const byStem = {};
    Object.values(c).forEach(x => {
      const s = AA.terms(x.word).join(' ') || x.word;
      if (!byStem[s]) byStem[s] = { word: x.word, n: 0 };
      byStem[s].n += x.n;
    });
    // ونضيف تكرار كلمات العناوين لإبراز المواضيع العامة
    const freq = {};
    AA.docs().forEach(d => AA.terms(d.title + ' ' + d.keywords.join(' ')).forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
    return Object.entries(byStem).map(([s, x]) => ({ word: x.word, n: Math.max(x.n, ...s.split(' ').map(t => freq[t] || 0)) }))
      .sort((a, b) => b.n - a.n || a.word.length - b.word.length).slice(0, n || 10);
  }

  function catStats() {
    const docs = AA.docs();
    return AA.CATS.map(c => {
      const ds = docs.filter(d => d.cat === c.id);
      return { c, n: ds.length, share: docs.length ? ds.length / docs.length : 0, avg: ds.length ? ds.reduce((a, d) => a + d.size, 0) / ds.length : 0, latest: ds.sort((a, b) => new Date(b.date) - new Date(a.date))[0] };
    }).filter(x => x.n).sort((a, b) => b.n - a.n);
  }

  function sourceText() {
    if (st.src === 'text') return { text: st.text, note: '' };
    const d = AA.doc(st.docId);
    if (!d) return { text: '', note: '' };
    if (d.content && d.content.length > 120) return { text: d.content, note: L('يُحلَّل النص المستخرج من الملف المرفوع.', 'Analysing the text extracted from the uploaded file.') };
    return { text: d.title + '. ' + d.summary + ' ' + (d.desc || '') + '. ' + d.keywords.join('، '), note: L('هذا مستند تجريبي بلا نص كامل، لذلك يعتمد التحليل على العنوان والملخص والكلمات المسجلة. ارفع ملفًا حقيقيًا لتحليل محتواه الكامل.', 'This sample document has no full text, so the analysis uses its title, summary and keywords. Upload a real file to analyse its full content.') };
  }

  function drawResult(root) {
    const out = root.querySelector('#an-out');
    const { text, note } = sourceText();
    if (text.trim().length < 20) {
      out.innerHTML = ui.empty('sparkles', L('أدخل نصًا أطول', 'Enter a longer text'), L('يحتاج التحليل إلى 20 حرفًا على الأقل. الصق نصًا أو اختر «نص تجريبي».', 'At least 20 characters are needed. Paste text or use a sample.'));
      return false;
    }
    const a = AA.analyze(text);
    const max = a.keywords[0] ? a.keywords[0].count : 1;
    const cat = AA.cat(a.cat);
    const second = a.scores[1] && a.scores[1].score ? AA.cat(a.scores[1].id) : null;
    out.innerHTML = `
      ${note ? `<div class="notice">${icon('info')}<div>${note}</div></div>` : ''}
      <div class="mini-stats">
        <div class="mini-stat"><small>${L('عدد الكلمات', 'Words')}</small><b>${AA.fmtNum(a.words)}</b></div>
        <div class="mini-stat"><small>${L('الجمل', 'Sentences')}</small><b>${AA.fmtNum(a.sentences)}</b></div>
        <div class="mini-stat"><small>${L('زمن القراءة', 'Reading time')}</small><b>${a.minutes}<span style="font-size:12px;color:var(--dim)"> ${L('د', 'min')}</span></b></div>
        <div class="mini-stat"><small>${L('اللغة المكتشفة', 'Detected language')}</small><b class="ar">${ui.langLabel(a.lang)}</b></div>
      </div>
      <div class="an-box"><h4>${icon('quote')} ${L('الملخص (استخلاصي)', 'Summary (extractive)')}</h4><p>${esc(a.summary)}</p></div>
      <div class="an-grid">
        <div class="an-box"><h4>${icon('target')} ${L('موضوع المستند وتصنيفه', 'Topic & classification')}</h4>
          <div class="topic-line">${ui.catChip(cat.id)}<b>${a.topic.length ? esc(a.topic.join(L('، ', ', '))) : L('غير محدد', 'Undetermined')}</b></div>
          <div class="conf"><i style="--w:${a.confidence}%"></i></div>
          <p style="font-size:12.5px;margin-top:8px">${a.confidence ? L(`ثقة التصنيف ${a.confidence}% حسب مطابقة قاموس التصنيفات${second ? `، يليه «${AA.catName(second.id)}»` : ''}.`, `${a.confidence}% classification confidence from category dictionary matches${second ? `, followed by “${AA.catName(second.id)}”` : ''}.`) : L('لم تُطابق كلمات النص أي تصنيف، فوُضع في «عام».', 'No category words matched, so it was placed in “General”.')}</p>
        </div>
        <div class="an-box"><h4>${icon('tag')} ${L('الكلمات المفتاحية المستخرجة', 'Extracted keywords')}</h4>
          <div class="kw-bars">${a.keywords.map(k => `<div class="kw-bar"><span title="${esc(k.word)}">${esc(k.word)}</span><span class="tr"><i style="--w:${Math.round(k.count / max * 100)}%"></i></span><em>${k.count}</em></div>`).join('') || `<span class="dim">—</span>`}</div>
        </div>
      </div>
      ${st.src === 'doc' && AA.doc(st.docId) && AA.can('edit') ? `<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn sm" id="apply-kw">${icon('wand')} ${L('اعتماد الكلمات المفتاحية للمستند', 'Apply keywords to document')}</button>${AA.doc(st.docId).cat !== a.cat ? `<button class="btn sm" id="apply-cat">${icon('tag')} ${L(`نقل إلى «${AA.catName(a.cat)}»`, `Move to “${AA.catName(a.cat)}”`)}</button>` : ''}</div>` : ''}`;
    const kwBtn = out.querySelector('#apply-kw');
    if (kwBtn) kwBtn.onclick = () => {
      const d = AA.doc(st.docId);
      const words = a.keywords.slice(0, 6).map(k => k.word);
      d.keywords = Array.from(new Set(d.keywords.concat(words))).slice(0, 12);
      AA.log('edit', { docId: d.id, title: d.title, detail: 'keywords' }); AA.store.save();
      AA.toast('success', L('تم تحديث الكلمات المفتاحية', 'Keywords updated'), d.title);
    };
    const catBtn = out.querySelector('#apply-cat');
    if (catBtn) catBtn.onclick = () => {
      const d = AA.doc(st.docId);
      d.cat = a.cat; d.autoCat = true; d.confidence = a.confidence;
      AA.log('edit', { docId: d.id, title: d.title, detail: 'cat' }); AA.store.save();
      AA.toast('success', L('تم تحديث التصنيف', 'Category updated'), `${d.title} → ${AA.catName(a.cat)}`);
      catBtn.remove();
    };
    return true;
  }

  /* ---------- التقرير ---------- */
  AA.reports = {
    download() {
      const docs = AA.docs(), act = AA.store.state.activity;
      const dir = AA.lang === 'ar' ? 'rtl' : 'ltr';
      const cs = catStats(), topics = topTopics(10);
      const since = Date.now() - 30 * 86400000;
      const last30 = t => act.filter(a => a.type === t && new Date(a.at).getTime() >= since).length;
      const qc = {}; act.forEach(a => { if (a.type === 'search') qc[a.q] = (qc[a.q] || 0) + 1; });
      const topQ = Object.entries(qc).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const types = Object.keys(AA.TYPES).map(t => [AA.TYPES[t].label, docs.filter(d => d.type === t).length]);
      const langs = [[L('عربي', 'Arabic'), docs.filter(d => d.lang === 'ar').length], [L('إنجليزي', 'English'), docs.filter(d => d.lang === 'en').length]];
      const recent = docs.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
      const tbl = (head, rows) => `<table><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      const html = `<!doctype html><html lang="${AA.lang}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ARCHIVE AI — ${L('تقرير الأرشيف', 'Archive report')}</title>
<style>body{font-family:"IBM Plex Sans Arabic",Tahoma,Arial,sans-serif;color:#141a33;background:#f5f6fb;margin:0;padding:32px 16px;line-height:1.7}
.wrap{max-width:900px;margin:0 auto;background:#fff;border-radius:18px;padding:36px;box-shadow:0 10px 40px -20px rgba(20,26,51,.3)}
header{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;border-bottom:3px solid #6366f1;padding-bottom:18px;margin-bottom:24px;flex-wrap:wrap}
.logo{font-family:Arial,sans-serif;font-weight:800;letter-spacing:.16em;font-size:22px;direction:ltr}.logo b{color:#6366f1}
h1{font-size:22px;margin:6px 0 0}h2{font-size:16px;margin:28px 0 10px;color:#3730a3}small,.muted{color:#5b6285}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.kpi{background:#f1f2fb;border-radius:12px;padding:14px}.kpi b{display:block;font-size:24px;font-family:Arial,sans-serif}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{padding:8px 10px;border-bottom:1px solid #e5e7f2;text-align:start}th{background:#f1f2fb;font-size:12.5px;color:#3d4366}
.note{background:#fff7e6;border:1px solid #f5d48a;border-radius:10px;padding:10px 14px;font-size:13px;margin-top:24px}
@media (max-width:640px){.kpis{grid-template-columns:1fr 1fr}.wrap{padding:20px}}@media print{body{background:#fff;padding:0}.wrap{box-shadow:none}}</style></head>
<body><div class="wrap"><header><div><div class="logo">ARCHIVE<b> AI</b></div><h1>${L('تقرير تحليلي تجريبي للأرشيف', 'Sample archive analytics report')}</h1></div><small>${L('تاريخ الإنشاء', 'Generated')}: ${AA.fmtDateTime(new Date().toISOString())}<br>${L('أعدّه', 'Prepared by')}: ${esc(AA.userName(AA.me().id))}</small></header>
<div class="kpis"><div class="kpi"><small>${L('إجمالي المستندات', 'Total documents')}</small><b>${docs.length}</b></div><div class="kpi"><small>${L('أضيفت خلال 30 يومًا', 'Added in 30 days')}</small><b>${last30('upload')}</b></div><div class="kpi"><small>${L('عمليات البحث (30 يومًا)', 'Searches (30 days)')}</small><b>${last30('search')}</b></div><div class="kpi"><small>${L('التنزيلات (30 يومًا)', 'Downloads (30 days)')}</small><b>${last30('download')}</b></div></div>
<h2>${L('التوزيع حسب التصنيف', 'By category')}</h2>${tbl([L('التصنيف', 'Category'), L('العدد', 'Count'), L('النسبة', 'Share'), L('متوسط الحجم', 'Avg size'), L('أحدث مستند', 'Latest')], cs.map(x => [esc(AA.lang === 'ar' ? x.c.ar : x.c.en), x.n, Math.round(x.share * 100) + '%', AA.fmtSize(Math.round(x.avg)), esc(x.latest ? x.latest.title : '—')]))}
<h2>${L('أنواع الملفات واللغات', 'File types & languages')}</h2>${tbl([L('النوع', 'Type'), L('العدد', 'Count')], types.concat(langs))}
<h2>${L('أكثر المواضيع تكرارًا', 'Most frequent topics')}</h2>${tbl(['#', L('الموضوع', 'Topic'), L('التكرار', 'Frequency')], topics.map((t, i) => [i + 1, esc(t.word), t.n]))}
<h2>${L('أكثر عبارات البحث', 'Top search queries')}</h2>${tbl([L('العبارة', 'Query'), L('مرات البحث', 'Times')], topQ.map(([q, n]) => [esc(q), n]))}
<h2>${L('أحدث المستندات', 'Latest documents')}</h2>${tbl([L('العنوان', 'Title'), L('التصنيف', 'Category'), L('النوع', 'Type'), L('التاريخ', 'Date')], recent.map(d => [esc(d.title), esc(AA.catName(d.cat)), d.type.toUpperCase(), AA.fmtDate(d.date)]))}
<div class="note">${L('تقرير تجريبي مولَّد من بيانات عرض داخل نموذج أولي مستقل مقترح لجهة التدريب. التحليل إحصائي محلي وليس ناتجًا عن نموذج ذكاء اصطناعي، وهو غير تابع رسميًا لأي جهة.', 'Sample report generated from demo data in an independent prototype proposed to the training host. Analysis is local and statistical, not produced by an AI model, and is not affiliated with any organisation.')}</div>
</div></body></html>`;
      AA.download(`archive-ai-report-${AA.today()}.html`, html, 'text/html;charset=utf-8');
      AA.log('report', {});
      AA.store.save();
      AA.toast('success', L('تم إنشاء التقرير', 'Report generated'), L('افتح الملف في المتصفح، ويمكنك طباعته أو حفظه PDF.', 'Open it in a browser; you can print it or save as PDF.'));
    }
  };

  AA.pages.insights = {
    title: () => L('التحليل الذكي', 'AI Insights'),
    render(p) {
      if (p.doc && AA.doc(p.doc)) { st.src = 'doc'; st.docId = p.doc; }
      if (!AA.doc(st.docId)) st.docId = (AA.docs()[0] || {}).id || '';
      const docs = AA.docs();
      const cs = catStats();
      const topics = topTopics(10);
      const tmax = topics[0] ? topics[0].n : 1;
      const sorted = docs.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
      const canA = AA.can('analyze');
      return `
      <div class="page-head">
        <div><span class="eyebrow">AI Insights</span><h1>${L('التحليل والتلخيص الذكي', 'Smart analysis & summaries')}</h1>
          <p>${L('لخّص المستندات، واستخرج كلماتها المفتاحية، وحدد موضوعها وتصنيفها، واطّلع على إحصائيات الأرشيف وأكثر مواضيعه تكرارًا.', 'Summarise documents, extract keywords, detect topics and categories, and explore archive statistics and trending topics.')}</p></div>
        <div class="actions"><button class="btn primary" data-act="report">${icon('report')} ${L('تنزيل التقرير', 'Download report')}</button></div>
      </div>
      <div class="notice">${icon('info')}<div><b>${L('كيف يعمل التحليل؟', 'How does the analysis work?')}</b> ${L('يتم محليًا داخل المتصفح بخوارزميات إحصائية: تكرار الكلمات بعد توحيد الحروف وحذف أدوات الربط، ومطابقة قاموس لكل تصنيف، وتلخيص استخلاصي يختار أهم الجمل. لا يُستخدم نموذج ذكاء اصطناعي حقيقي في هذا النموذج الأولي.', 'It runs locally in the browser using statistics: word frequency after normalisation and stop-word removal, dictionary matching per category, and an extractive summary that picks key sentences. No real AI model is used in this prototype.')}</div></div>

      <article class="glass card">
        <div class="card-head"><span class="card-title-ic">${icon('wand')}</span><div><h3>${L('محلل المستندات', 'Document analyser')}</h3><div class="sub">${L('اختر مستندًا من الأرشيف أو الصق نصًا', 'Pick an archived document or paste text')}</div></div>
          <div class="tools"><div class="seg" id="src"><button class="${st.src === 'doc' ? 'on' : ''}" data-s="doc">${icon('file')} ${L('من الأرشيف', 'From archive')}</button><button class="${st.src === 'text' ? 'on' : ''}" data-s="text">${icon('edit')} ${L('نص مخصص', 'Custom text')}</button></div></div></div>
        <div class="an-grid" style="align-items:start">
          <div style="display:grid;gap:12px">
            <div id="src-doc" ${st.src === 'doc' ? '' : 'hidden'}>
              <label class="field"><span>${L('المستند', 'Document')}</span><select class="select" id="an-doc">${sorted.map(d => `<option value="${d.id}" ${d.id === st.docId ? 'selected' : ''}>${esc(d.title)}${d.uploaded ? ' ★' : ''}</option>`).join('')}</select></label>
              <p class="dim" style="font-size:12px;margin-top:8px">${L('★ ملف مرفوع منك ويُحلَّل نصه الكامل.', '★ An uploaded file; its full text is analysed.')}</p>
            </div>
            <div id="src-text" ${st.src === 'text' ? '' : 'hidden'} style="display:grid;gap:10px">
              <label class="field"><span>${L('النص', 'Text')}</span><textarea class="textarea" id="an-text" dir="auto" rows="9" placeholder="${L('الصق هنا نص مقال أو تقرير…', 'Paste an article or report here…')}">${esc(st.text)}</textarea></label>
              <div class="chips"><button class="chip" data-sample="ar">${icon('file')} ${L('نص تجريبي عربي', 'Arabic sample')}</button><button class="chip" data-sample="en">${icon('file')} ${L('نص تجريبي إنجليزي', 'English sample')}</button><button class="chip" data-sample="">${icon('x')} ${L('مسح', 'Clear')}</button></div>
            </div>
            <button class="btn primary" id="run">${icon('sparkles')} ${L('حلّل الآن', 'Analyse now')}</button>
            ${canA ? '' : `<div class="notice warn">${icon('lock')}<div>${L('دور «قراءة فقط» لا يشمل التحليل. بدّل المستخدم من القائمة العلوية.', 'The read-only role does not include analysis. Switch user from the top menu.')}</div></div>`}
          </div>
          <div class="an-out" id="an-out">${ui.empty('sparkles', L('جاهز للتحليل', 'Ready to analyse'), L('اختر المصدر ثم اضغط «حلّل الآن» لعرض الملخص والكلمات المفتاحية والتصنيف.', 'Choose a source and press “Analyse now” to see the summary, keywords and category.'))}</div>
        </div>
      </article>

      <section class="grid-eq">
        <article class="glass card">
          <div class="card-head"><span class="card-title-ic">${icon('chart')}</span><div><h3>${L('أنواع المستندات', 'Document types')}</h3><div class="sub">${L('العدد والحجم الإجمالي لكل نوع', 'Count and total size per type')}</div></div></div>
          <div class="chart-box sm"><canvas id="type-chart" role="img" aria-label="${L('أنواع المستندات', 'Document types')}"></canvas></div>
        </article>
        <article class="glass card">
          <div class="card-head"><span class="card-title-ic">${icon('trend')}</span><div><h3>${L('أكثر الموضوعات تكرارًا', 'Most frequent topics')}</h3><div class="sub">${L('من الكلمات المفتاحية والعناوين — اضغط للبحث', 'From keywords and titles — click to search')}</div></div></div>
          <div class="kw-bars">${topics.map(t => `<div class="kw-bar" style="cursor:pointer" data-act="kw" data-q="${esc(t.word)}"><span>${esc(t.word)}</span><span class="tr"><i style="--w:${Math.round(t.n / tmax * 100)}%"></i></span><em>${t.n}</em></div>`).join('')}</div>
        </article>
      </section>

      <section class="grid-2">
        <article class="glass card">
          <div class="card-head"><span class="card-title-ic">${icon('table')}</span><h3>${L('إحصائيات التصنيفات', 'Category statistics')}</h3></div>
          <div class="table-wrap"><table class="table cards cat-table"><thead><tr><th>${L('التصنيف', 'Category')}</th><th>${L('العدد', 'Count')}</th><th>${L('النسبة', 'Share')}</th><th>${L('متوسط الحجم', 'Avg size')}</th><th>${L('أحدث مستند', 'Latest')}</th></tr></thead>
          <tbody>${cs.map(x => `<tr><td class="main-cell">${ui.catChip(x.c.id)}</td><td data-l="${L('العدد', 'Count')}"><span class="num">${x.n}</span></td><td data-l="${L('النسبة', 'Share')}"><span class="share-bar" style="--c:${x.c.color}"><span class="tr"><i style="width:${(x.share * 100).toFixed(1)}%"></i></span><em>${Math.round(x.share * 100)}%</em></span></td><td data-l="${L('متوسط الحجم', 'Avg size')}"><span class="num">${AA.fmtSize(Math.round(x.avg))}</span></td><td data-l="${L('أحدث مستند', 'Latest')}">${x.latest ? `<button class="link" data-act="doc-open" data-id="${x.latest.id}">${esc(x.latest.title.length > 34 ? x.latest.title.slice(0, 32) + '…' : x.latest.title)}</button>` : '—'}</td></tr>`).join('')}</tbody></table></div>
        </article>
        <article class="glass card">
          <div class="card-head"><span class="card-title-ic">${icon('languages')}</span><div><h3>${L('لغات المحتوى', 'Content languages')}</h3><div class="sub">${L('نسبة المستندات العربية والإنجليزية', 'Arabic vs English documents')}</div></div></div>
          <div class="chart-box sm"><canvas id="lang-chart" role="img" aria-label="${L('لغات المحتوى', 'Content languages')}"></canvas></div>
        </article>
      </section>`;
    },
    mount(root, p) {
      const docs = AA.docs();
      const types = Object.keys(AA.TYPES);
      const colors = { pdf: '#f43f5e', docx: '#3b82f6', xlsx: '#10b981', pptx: '#f59e0b' };
      ui.chart(root.querySelector('#type-chart'), {
        type: 'bar',
        data: { labels: types.map(t => AA.TYPES[t].label), datasets: [{ label: L('عدد الملفات', 'Files'), data: types.map(t => docs.filter(d => d.type === t).length), backgroundColor: types.map(t => colors[t] + 'cc'), borderRadius: 10, maxBarThickness: 46 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 }, border: { display: false } } },
          plugins: { tooltip: { callbacks: { afterLabel: c => L('الحجم: ', 'Size: ') + AA.fmtSize(docs.filter(d => d.type === types[c.dataIndex]).reduce((a, d) => a + d.size, 0)) } } } }
      });
      const ar = docs.filter(d => d.lang === 'ar').length;
      ui.chart(root.querySelector('#lang-chart'), {
        type: 'doughnut',
        data: { labels: [L('عربي', 'Arabic'), L('إنجليزي', 'English')], datasets: [{ data: [ar, docs.length - ar], backgroundColor: ['#8b5cf6', '#22d3ee'], borderColor: '#0b1029', borderWidth: 3 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: true, position: 'bottom', labels: { usePointStyle: true, padding: 16 } } } }
      });

      const srcSeg = root.querySelector('#src');
      srcSeg.addEventListener('click', e => {
        const b = e.target.closest('button[data-s]'); if (!b) return;
        st.src = b.dataset.s;
        srcSeg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        root.querySelector('#src-doc').hidden = st.src !== 'doc';
        root.querySelector('#src-text').hidden = st.src !== 'text';
      });
      root.querySelector('#an-doc').addEventListener('change', e => { st.docId = e.target.value; });
      const ta = root.querySelector('#an-text');
      ta.addEventListener('input', () => { st.text = ta.value; });
      root.querySelectorAll('[data-sample]').forEach(b => b.addEventListener('click', () => { ta.value = b.dataset.sample ? AA.SAMPLES[b.dataset.sample] : ''; st.text = ta.value; ta.focus(); }));

      const run = () => {
        if (!AA.guard('analyze')) return;
        const out = root.querySelector('#an-out');
        out.innerHTML = `<div class="an-box scan" style="height:120px"></div><div class="an-box scan" style="height:80px"></div>`;
        setTimeout(() => {
          if (!root.isConnected) return;
          if (drawResult(root)) AA.toast('success', L('اكتمل التحليل', 'Analysis complete'), st.src === 'doc' ? (AA.doc(st.docId) || {}).title : L('النص المخصص', 'Custom text'));
          else AA.toast('error', L('لا يمكن التحليل', 'Cannot analyse'), L('النص قصير جدًا.', 'The text is too short.'));
        }, 450);
      };
      root.querySelector('#run').addEventListener('click', run);
      if (p.doc && AA.doc(p.doc) && AA.can('analyze')) { AA.setParams({}); run(); }
    }
  };
})(window.AA);
