/* ARCHIVE AI — لوحة التحكم */
(function (AA) {
  'use strict';
  const { L, esc, icon, ui } = AA;
  let range = '6m';

  const DAY = 86400000;
  const inLast = (iso, days, offset) => { const t = Date.now() - new Date(iso).getTime(); return t >= (offset || 0) * DAY && t < ((offset || 0) + days) * DAY; };

  function weekly(list, weeks) {
    const out = new Array(weeks).fill(0);
    list.forEach(iso => { const w = Math.floor((Date.now() - new Date(iso).getTime()) / (7 * DAY)); if (w >= 0 && w < weeks) out[weeks - 1 - w]++; });
    return out;
  }

  // سلاسل الرسم البياني حسب المدى المختار، من سجل النشاط الفعلي
  function series() {
    const act = AA.store.state.activity;
    const types = ['upload', 'search', 'download'];
    let labels = [], buckets = [];
    if (range === '30d') {
      for (let i = 29; i >= 0; i--) { const d = new Date(Date.now() - i * DAY); buckets.push(AA.dayKey(d.toISOString())); labels.push(AA.fmtDate(d.toISOString(), { day: 'numeric', month: 'short' })); }
      const idx = Object.fromEntries(buckets.map((b, i) => [b, i]));
      const data = types.map(() => new Array(30).fill(0));
      act.forEach(a => { const k = types.indexOf(a.type); const i = idx[AA.dayKey(a.at)]; if (k > -1 && i != null) data[k][i]++; });
      return { labels, data };
    }
    const n = range === '12m' ? 12 : 6;
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); buckets.push(d.getFullYear() * 12 + d.getMonth()); labels.push(AA.fmtDate(d.toISOString(), { month: 'short' })); }
    const data = types.map(() => new Array(n).fill(0));
    act.forEach(a => { const k = types.indexOf(a.type); if (k < 0) return; const d = new Date(a.at); const i = buckets.indexOf(d.getFullYear() * 12 + d.getMonth()); if (i > -1) data[k][i]++; });
    return { labels, data };
  }

  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? L('صباح الخير', 'Good morning') : h < 18 ? L('مساء الخير', 'Good afternoon') : L('مساء الخير', 'Good evening');
  }

  AA.pages.dashboard = {
    title: () => L('لوحة التحكم', 'Dashboard'),
    render() {
      const docs = AA.docs();
      const act = AA.store.state.activity;
      const me = AA.me();
      const searches = act.filter(a => a.type === 'search');
      const ups = docs.map(d => d.date);
      const recent30 = docs.filter(d => inLast(d.date, 30)).length;
      const prev30 = docs.filter(d => inLast(d.date, 30, 30)).length;
      const s30 = searches.filter(a => inLast(a.at, 30)).length;
      const sPrev = searches.filter(a => inLast(a.at, 30, 30)).length;
      const articles = docs.filter(d => d.cat === 'articles').length;
      const reports = docs.filter(d => d.cat === 'reports').length;
      const week = docs.filter(d => inLast(d.date, 7)).length;
      const perWeek = weekly(ups, 10);
      let run = docs.length - perWeek.reduce((a, b) => a + b, 0);
      const cum = perWeek.map(v => (run += v));

      const stat = (ic, a, b, lbl, val, trend, note, spark, color) => `
        <article class="stat glass spot">
          <div class="stat-top"><span class="stat-ic" style="--a:${a};--b:${b}">${icon(ic)}</span><span class="stat-lbl">${lbl}</span></div>
          <div class="stat-bottom"><span class="stat-val" data-count="${val}">0</span>${ui.spark(spark, color)}</div>
          <div class="stat-bottom">${trend}<span class="trend-note">${note}</span></div>
        </article>`;

      const cats = AA.CATS.map(c => ({ c, n: docs.filter(d => d.cat === c.id).length })).filter(x => x.n).sort((a, b) => b.n - a.n);
      const recentDocs = docs.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
      const lastSearches = searches.slice(0, 6);
      const favs = docs.filter(d => d.fav).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

      return `
      <section class="hero glass">
        <div>
          <span class="eyebrow">${AA.fmtDate(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <h1>${greeting()}${L('، ', ', ')}<span class="grad">${esc(AA.userName(me.id).split(' ')[0])}</span></h1>
          <p>${L(`في الأرشيف الآن ${AA.fmtNum(docs.length)} مستندًا، أضيف منها ${AA.fmtNum(week)} خلال آخر سبعة أيام. ابحث بلغتين، وحلّل المحتوى، وتابع النشاط من مكان واحد.`, `The archive holds ${AA.fmtNum(docs.length)} documents, ${AA.fmtNum(week)} added in the last seven days. Search in two languages, analyse content and follow activity in one place.`)}</p>
          <div class="hero-actions">
            <a class="btn primary" href="#/files?upload=1">${icon('upload')} ${L('رفع ملفات', 'Upload files')}</a>
            <a class="btn" href="#/search">${icon('sparkles')} ${L('البحث الذكي', 'AI Search')}</a>
            <button class="btn ghost" data-act="report">${icon('report')} ${L('تنزيل تقرير', 'Download report')}</button>
          </div>
        </div>
        <div class="orb" aria-hidden="true"><span class="o"><i></i></span><span class="o"><i></i></span><span class="o"><i></i></span><span class="core"></span></div>
      </section>

      <section class="stats">
        ${stat('files', '#a78bfa', '#6366f1', L('إجمالي المستندات المؤرشفة', 'Total archived documents'), docs.length, ui.trend(recent30, prev30), L('مقارنة بالشهر السابق', 'vs previous 30 days'), cum, '#a78bfa')}
        ${stat('newspaper', '#22d3ee', '#0284c7', L('المقالات والتقارير', 'Articles & reports'), articles + reports, `<span class="trend flat">${AA.fmtNum(articles)} ${L('مقال', 'articles')} · ${AA.fmtNum(reports)} ${L('تقرير', 'reports')}</span>`, '', weekly(docs.filter(d => d.cat === 'articles' || d.cat === 'reports').map(d => d.date), 10), '#22d3ee')}
        ${stat('upload', '#34d399', '#059669', L('أضيفت مؤخرًا (30 يومًا)', 'Added recently (30 days)'), recent30, ui.trend(recent30, prev30), L('ملفات جديدة', 'new files'), weekly(ups, 10), '#34d399')}
        ${stat('search', '#f472b6', '#9333ea', L('عمليات البحث', 'Searches'), searches.length, ui.trend(s30, sPrev), L(`${AA.fmtNum(s30)} هذا الشهر`, `${AA.fmtNum(s30)} this month`), weekly(searches.map(a => a.at), 10), '#f472b6')}
      </section>

      <section class="grid-2">
        <article class="glass card">
          <div class="card-head"><span class="card-title-ic">${icon('activity')}</span><div><h3>${L('نشاط الأرشيف', 'Archive activity')}</h3><div class="sub">${L('الرفع والبحث والتنزيل من سجل النشاط', 'Uploads, searches and downloads from the activity log')}</div></div>
            <div class="tools"><div class="seg" role="tablist" id="range">
              <button class="${range === '30d' ? 'on' : ''}" data-r="30d">${L('30 يومًا', '30 days')}</button>
              <button class="${range === '6m' ? 'on' : ''}" data-r="6m">${L('6 أشهر', '6 months')}</button>
              <button class="${range === '12m' ? 'on' : ''}" data-r="12m">${L('سنة', 'Year')}</button>
            </div></div>
          </div>
          <div class="chart-legend-inline" style="margin-bottom:10px">
            <span style="--c:#22d3ee"><i></i>${L('ملفات مضافة', 'Files added')}</span>
            <span style="--c:#a78bfa"><i></i>${L('عمليات بحث', 'Searches')}</span>
            <span style="--c:#34d399"><i></i>${L('تنزيلات', 'Downloads')}</span>
          </div>
          <div class="chart-box"><canvas id="act-chart" aria-label="${L('رسم بياني لنشاط الأرشيف', 'Archive activity chart')}" role="img"></canvas></div>
        </article>
        <article class="glass card">
          <div class="card-head"><span class="card-title-ic">${icon('pie')}</span><div><h3>${L('توزيع الملفات حسب التصنيف', 'Files by category')}</h3><div class="sub">${L('اضغط على تصنيف لعرض ملفاته', 'Click a category to browse it')}</div></div></div>
          <div class="donut-wrap">
            <div class="donut"><canvas id="cat-chart" role="img" aria-label="${L('توزيع التصنيفات', 'Category distribution')}"></canvas><div class="donut-center"><b data-count="${docs.length}">0</b><small>${L('مستند', 'documents')}</small></div></div>
            <div class="legend">${cats.map(({ c, n }) => `<button data-cat="${c.id}" style="--c:${c.color}"><i></i><span>${esc(AA.lang === 'ar' ? c.ar : c.en)}</span><em>${n}</em><small>${Math.round(n / docs.length * 100)}%</small></button>`).join('')}</div>
          </div>
        </article>
      </section>

      <section class="grid-3">
        <article class="glass card">
          <div class="card-head"><span class="card-title-ic">${icon('clock')}</span><h3>${L('أحدث الملفات المضافة', 'Recently added')}</h3><div class="tools"><a class="btn ghost sm" href="#/files">${L('الكل', 'All')}</a></div></div>
          <div class="list">${recentDocs.length ? recentDocs.map(d => `
            <div class="row" data-act="doc-open" data-id="${d.id}" role="button" tabindex="0">${ui.ftype(d.type, 'sm')}
              <span class="r-txt"><b>${esc(d.title)}${ui.isNew(d) ? `<span class="new-tag">${L('جديد', 'NEW')}</span>` : ''}</b><small>${esc(AA.catName(d.cat))} · <span class="num">${AA.fmtSize(d.size)}</span> · ${AA.timeAgo(d.date)}</small></span>
              <button class="mini-btn ${d.fav ? 'on' : ''}" data-act="fav" data-id="${d.id}" aria-label="${L('المفضلة', 'Favourite')}">${icon('star', d.fav ? 'fill' : '')}</button>
            </div>`).join('') : ui.empty('folder', L('لا توجد ملفات', 'No files'), '')}</div>
        </article>
        <article class="glass card">
          <div class="card-head"><span class="card-title-ic">${icon('search')}</span><h3>${L('آخر عمليات البحث', 'Recent searches')}</h3><div class="tools"><a class="btn ghost sm" href="#/search">${L('بحث جديد', 'New search')}</a></div></div>
          <div class="list">${lastSearches.length ? lastSearches.map(a => `
            <a class="row" href="#/search?q=${encodeURIComponent(a.q)}&run=1"><span class="q-ic">${icon('search')}</span>
              <span class="r-txt"><b>${esc(a.q)}</b><small>${esc(AA.userName(a.userId))} · ${AA.timeAgo(a.at)}</small></span>
              <span class="r-end"><span class="num">${AA.fmtNum(a.results || 0)}</span> ${L('نتيجة', 'results')}</span></a>`).join('') : ui.empty('search', L('لا توجد عمليات بحث بعد', 'No searches yet'), '')}</div>
        </article>
        <article class="glass card">
          <div class="card-head"><span class="card-title-ic" style="color:#fbbf24;background:rgba(251,191,36,.12);border-color:rgba(251,191,36,.25)">${icon('star')}</span><h3>${L('الملفات المفضلة', 'Favourites')}</h3><div class="tools"><a class="btn ghost sm" href="#/search?fav=1">${L('الكل', 'All')}</a></div></div>
          ${favs.length ? `<div class="fav-grid">${favs.map(d => `
            <div class="fav-card" data-act="doc-open" data-id="${d.id}" role="button" tabindex="0">
              <div class="ft">${ui.ftype(d.type, 'sm')}<button class="mini-btn on" data-act="fav" data-id="${d.id}" aria-label="${L('إزالة من المفضلة', 'Remove favourite')}">${icon('star', 'fill')}</button></div>
              <b>${esc(d.title)}</b><small>${esc(AA.catName(d.cat))} · ${AA.fmtDate(d.date)}</small>
            </div>`).join('')}</div>` : ui.empty('star', L('لا توجد ملفات مفضلة', 'No favourites yet'), L('اضغط على النجمة بجانب أي ملف لإضافته هنا.', 'Tap the star next to any file to pin it here.'))}
        </article>
      </section>`;
    },
    mount(root) {
      const { labels, data } = series();
      const ds = (label, d, color) => ({ label, data: d, borderColor: color, backgroundColor: c => ui.fade(c, color), fill: true, tension: .4, borderWidth: 2.2, pointRadius: range === '30d' ? 0 : 3, pointHoverRadius: 5, pointBackgroundColor: color, pointBorderColor: '#0b1029', pointBorderWidth: 2 });
      ui.chart(root.querySelector('#act-chart'), {
        type: 'line',
        data: { labels, datasets: [ds(L('ملفات مضافة', 'Files added'), data[0], '#22d3ee'), ds(L('عمليات بحث', 'Searches'), data[1], '#a78bfa'), ds(L('تنزيلات', 'Downloads'), data[2], '#34d399')] },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
          scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkipPadding: 14 } }, y: { beginAtZero: true, ticks: { precision: 0 }, border: { display: false } } } }
      });
      const docs = AA.docs();
      const cats = AA.CATS.map(c => ({ c, n: docs.filter(d => d.cat === c.id).length })).filter(x => x.n).sort((a, b) => b.n - a.n);
      ui.chart(root.querySelector('#cat-chart'), {
        type: 'doughnut',
        data: { labels: cats.map(x => AA.lang === 'ar' ? x.c.ar : x.c.en), datasets: [{ data: cats.map(x => x.n), backgroundColor: cats.map(x => x.c.color), borderColor: '#0b1029', borderWidth: 3, hoverOffset: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '72%', onClick: (e, els) => { if (els[0]) AA.go('search', { cat: cats[els[0].index].c.id }); } }
      });
      root.querySelector('#range').addEventListener('click', e => { const b = e.target.closest('button[data-r]'); if (b && b.dataset.r !== range) { range = b.dataset.r; AA.refresh(); } });
      root.querySelectorAll('.legend button').forEach(b => b.addEventListener('click', () => AA.go('search', { cat: b.dataset.cat })));
      root.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); } });
    }
  };
})(window.AA);
