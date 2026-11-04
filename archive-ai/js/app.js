/* ARCHIVE AI — الهيكل العام: القائمة الجانبية، الشريط العلوي، التنقل بين الصفحات،
   وإجراءات المستندات المشتركة بين كل الصفحات (فتح، تعديل، حذف، تنزيل، مفضلة). */
(function (AA) {
  'use strict';
  const { L, esc, icon, ui } = AA;
  AA.charts = [];

  const ROUTES = ['dashboard', 'search', 'files', 'insights', 'users', 'activity'];
  let current = { route: 'dashboard', params: {} };

  /* ---------- وصف أحداث السجل (يستخدمه السجل والإشعارات) ---------- */
  const EV = {
    upload: ['upload', '#22d3ee', 'إضافة ملف', 'File added'],
    search: ['search', '#a78bfa', 'بحث عن', 'Searched for'],
    edit: ['edit', '#fbbf24', 'تعديل بيانات', 'Metadata edited'],
    download: ['download', '#34d399', 'تنزيل', 'Downloaded'],
    delete: ['trash', '#fb7185', 'حذف ملف', 'File deleted'],
    favorite: ['star', '#f59e0b', 'إضافة إلى المفضلة', 'Added to favourites'],
    unfavorite: ['star', '#94a3b8', 'إزالة من المفضلة', 'Removed from favourites'],
    user: ['users', '#60a5fa', 'إدارة المستخدمين', 'User management'],
    report: ['report', '#ec4899', 'إنشاء تقرير تحليلي', 'Analytics report generated']
  };
  AA.EV = EV;
  AA.evLabel = t => (EV[t] ? (AA.lang === 'ar' ? EV[t][2] : EV[t][3]) : t);
  const FIELD = { title: ['العنوان', 'title'], cat: ['التصنيف', 'category'], desc: ['الوصف', 'description'], keywords: ['الكلمات المفتاحية', 'keywords'], lang: ['اللغة', 'language'], summary: ['الملخص', 'summary'] };
  const USER_ACT = { created: ['إضافة مستخدم', 'User added'], updated: ['تحديث بيانات مستخدم', 'User updated'], deleted: ['حذف مستخدم', 'User removed'], activated: ['تفعيل حساب', 'Account activated'], deactivated: ['إيقاف حساب', 'Account deactivated'] };
  const pickName = s => { const p = String(s || '').split(' | '); return AA.lang === 'en' && p[1] ? p[1] : p[0]; };

  AA.describe = a => {
    const e = EV[a.type] || ['info', '#94a3b8', a.type, a.type];
    const docRef = () => {
      const exists = a.docId && AA.doc(a.docId);
      const t = esc(exists ? exists.title : a.title || '');
      return exists ? ` «<button class="link" data-act="doc-open" data-id="${esc(a.docId)}">${t}</button>»` : ` «<span class="t">${t}</span>»`;
    };
    let html = AA.evLabel(a.type), extra = '';
    if (a.type === 'search') { html += ` <span class="q">“${esc(a.q)}”</span>`; extra = `${AA.fmtNum(a.results || 0)} ${L('نتيجة', 'results')}`; }
    else if (a.type === 'user') { const u = USER_ACT[a.detail] || USER_ACT.updated; html = (AA.lang === 'ar' ? u[0] : u[1]) + ` «<span class="t">${esc(pickName(a.target))}</span>»`; }
    else if (a.type === 'report') { /* بدون مرجع ملف */ }
    else { html += docRef(); }
    if (a.type === 'edit' && a.detail) extra = L('الحقول: ', 'Fields: ') + String(a.detail).split(',').map(f => FIELD[f] ? FIELD[f][AA.lang === 'ar' ? 0 : 1] : f).join(AA.L('، ', ', '));
    return { icon: e[0], color: e[1], html, extra };
  };

  /* ---------- الهيكل ---------- */
  function buildShell() {
    document.getElementById('app').innerHTML = `
    <div class="app">
      <aside class="sidebar" id="sidebar" aria-label="${L('القائمة الرئيسية', 'Main menu')}">
        <a class="brand" href="#/dashboard" aria-label="ARCHIVE AI">
          <span class="brand-mark">${AA.logoMark()}</span>
          <span class="brand-text"><span class="brand-name">ARCHIVE<b>AI</b></span><span class="brand-sub">${L('أرشيف · منصة المحتوى الذكية', 'Arshif · Smart content platform')}</span></span>
        </a>
        <div class="nav-label">${L('المنصة', 'Workspace')}</div>
        <nav class="nav" id="nav"></nav>
        <div class="side-card" id="storage"></div>
        <p class="proto-note"><b>${L('نموذج أولي مستقل', 'Independent prototype')}</b> — ${L('مقترح لجهة التدريب، وليس منتجًا رسميًا لأي جهة. كل البيانات تجريبية.', 'proposed for the training host; not an official product of any organisation. All data is sample data.')}</p>
      </aside>
      <div class="scrim" data-act="close-side"></div>
      <div class="main">
        <header class="topbar">
          <button class="icon-btn menu-btn" data-act="open-side" aria-label="${L('فتح القائمة', 'Open menu')}">${icon('menu')}</button>
          <form class="gsearch" id="gsearch" role="search">
            ${icon('search')}
            <input id="gsearch-input" type="search" autocomplete="off" placeholder="${L('ابحث في المستندات، المواضيع، الكلمات المفتاحية…', 'Search documents, topics, keywords…')}" aria-label="${L('بحث سريع', 'Quick search')}">
            <span class="kbd">Ctrl K</span>
          </form>
          <div class="top-actions">
            <button class="icon-btn lang-btn" data-act="lang" aria-label="${L('Switch to English', 'التبديل إلى العربية')}">${icon('languages')}<span>${L('English', 'العربية')}</span></button>
            <div class="rel-wrap">
              <button class="icon-btn" data-act="notif" aria-label="${L('الإشعارات', 'Notifications')}" aria-haspopup="true">${icon('bell')}<span id="notif-dot"></span></button>
            </div>
            <div class="rel-wrap">
              <button class="user-btn" data-act="profile" id="user-btn" aria-haspopup="true"></button>
            </div>
          </div>
        </header>
        <main class="view" id="view" tabindex="-1"></main>
        <footer class="app-footer">
          <span>© 2026 ARCHIVE AI · ${L('نموذج أولي مستقل مقترح لجهة التدريب — غير تابع رسميًا للمجموعة السعودية للأبحاث والإعلام (SRMG).', 'Independent prototype proposed for the training host — not an official SRMG product.')}</span>
          <span>${L('جميع المستندات والأسماء الواردة تجريبية وخيالية.', 'All documents and names shown are fictional sample data.')}</span>
        </footer>
      </div>
    </div>`;
    document.getElementById('gsearch').addEventListener('submit', e => {
      e.preventDefault();
      const q = document.getElementById('gsearch-input').value.trim();
      AA.go('search', q ? { q, run: '1' } : {});
      document.getElementById('gsearch-input').blur();
    });
  }

  function renderChrome() {
    const nav = [
      ['dashboard', 'grid', L('لوحة التحكم', 'Dashboard')],
      ['search', 'search', L('البحث الذكي', 'AI Search')],
      ['files', 'folder', L('إدارة الملفات', 'Files'), AA.docs().length],
      ['insights', 'sparkles', L('التحليل الذكي', 'AI Insights')],
      ['users', 'users', L('المستخدمون', 'Users'), AA.users().length],
      ['activity', 'activity', L('سجل النشاط', 'Activity Log')]
    ];
    document.getElementById('nav').innerHTML = nav.map(([id, ic, label, badge]) => {
      const locked = (id === 'activity' && !AA.can('activity'));
      return `<a href="#/${id}" class="${current.route === id ? 'active' : ''} ${locked ? 'locked' : ''}" ${current.route === id ? 'aria-current="page"' : ''}>${icon(ic)}<span>${label}</span>${locked ? `<span class="lock">${icon('lock')}</span>` : badge != null ? `<span class="badge">${badge}</span>` : ''}</a>`;
    }).join('');

    const used = AA.docs().reduce((a, d) => a + d.size, 0);
    const quota = 2 * 1024 * 1024 * 1024;
    document.getElementById('storage').innerHTML = `<h4>${icon('database')} ${L('مساحة الأرشيف التجريبية', 'Demo archive storage')}</h4>
      <div class="meter"><i style="width:${Math.max(2, Math.min(100, used / quota * 100)).toFixed(1)}%"></i></div>
      <small><span class="num">${AA.fmtSize(used)}</span> ${L('من', 'of')} <span class="num">2 GB</span> · ${AA.fmtNum(AA.docs().length)} ${L('مستند', 'documents')}</small>`;

    const me = AA.me();
    document.getElementById('user-btn').innerHTML = `${ui.avatar(me)}<span class="who"><b>${esc(AA.userName(me.id))}</b><small>${esc(AA.roleName(me.role))}</small></span>`;
    document.getElementById('user-btn').setAttribute('aria-label', L('حساب المستخدم: ', 'Account: ') + AA.userName(me.id));

    const unseen = AA.store.state.activity.filter(a => a.at > AA.store.state.notifSeen && a.userId !== me.id).length;
    document.getElementById('notif-dot').outerHTML = `<span id="notif-dot">${unseen ? `<span class="dot">${unseen > 9 ? '9+' : unseen}</span>` : ''}</span>`;
  }
  AA.renderChrome = renderChrome;

  /* ---------- التنقل ---------- */
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    return { route: ROUTES.includes(path) ? path : 'dashboard', params: Object.fromEntries(new URLSearchParams(qs || '')) };
  }
  AA.go = (route, params) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    const h = '#/' + route + (qs ? '?' + qs : '');
    if (location.hash === h) render(); else location.hash = h;
  };
  // تحديث الرابط دون إعادة رسم الصفحة (للبحث والفلاتر)
  AA.setParams = params => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null && v !== false));
    const qs = new URLSearchParams(clean).toString();
    history.replaceState(null, '', '#/' + current.route + (qs ? '?' + qs : ''));
  };

  function render(keep) {
    current = parseHash();
    const page = AA.pages[current.route];
    AA.charts.forEach(c => { try { c.destroy(); } catch (e) { /* الرسم أزيل مسبقًا */ } });
    AA.charts = [];
    closePop();
    const view = document.getElementById('view');
    const y = window.scrollY;
    view.innerHTML = `<div class="page ${keep ? '' : 'enter'}">${page.render(current.params)}</div>`;
    renderChrome();
    page.mount && page.mount(view.firstElementChild, current.params);
    ui.countUp(view);
    document.title = page.title() + ' · ARCHIVE AI';
    if (keep) window.scrollTo(0, y);
    else { window.scrollTo(0, 0); }
    document.body.classList.remove('side-open');
  }
  AA.refresh = () => render(true);
  AA.route = () => current;

  /* ---------- القوائم المنبثقة ---------- */
  let pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  function openPop(anchor, html, cls) {
    const wasSame = pop && pop.dataset.for === cls;
    closePop();
    if (wasSame) return null;
    pop = document.createElement('div');
    pop.className = 'popover';
    pop.dataset.for = cls;
    pop.innerHTML = html;
    anchor.parentElement.appendChild(pop);
    return pop;
  }

  function notifPop(btn) {
    const st = AA.store.state;
    const items = st.activity.slice(0, 8);
    const p = openPop(btn, `<div class="pop-head"><b>${L('آخر النشاطات', 'Recent activity')}</b><span class="dim" style="font-size:12px">${AA.fmtNum(st.activity.length)} ${L('عملية', 'events')}</span></div>
      <div class="pop-list">${items.map(a => { const d = AA.describe(a); return `<div class="pop-item">${a.at > st.notifSeen && a.userId !== AA.me().id ? '<span class="unread"></span>' : ''}<span class="ev-ic" style="--c:${d.color};width:30px;height:30px;font-size:14px">${icon(d.icon)}</span><div>${d.html}<small>${esc(AA.userName(a.userId))} · ${AA.timeAgo(a.at)}</small></div></div>`; }).join('')}</div>
      <div class="pop-foot"><a class="btn sm" href="#/activity">${L('عرض سجل النشاط كاملًا', 'Open full activity log')}</a></div>`, 'notif');
    if (!p) return;
    st.notifSeen = new Date().toISOString();
    AA.store.save();
    document.getElementById('notif-dot').innerHTML = '';
  }

  function profilePop(btn) {
    const me = AA.me();
    openPop(btn, `<div class="pop-user">${ui.avatar(me, 'lg')}<div><b>${esc(AA.userName(me.id))}</b><small>${esc(me.email)}</small><div style="margin-top:6px"><span class="chip">${esc(AA.roleName(me.role))}</span></div></div></div>
      <div class="pop-section"><h5>${L('تجربة الصلاحيات — الدخول كـ', 'Try permissions — view as')}</h5>
        ${AA.users().filter(u => u.status === 'active').map(u => `<button class="u-opt ${u.id === me.id ? 'on' : ''}" data-act="switch-user" data-id="${u.id}">${ui.avatar(u, 'sm')}<span>${esc(AA.userName(u.id))}</span><small class="dim">${esc(AA.roleName(u.role))}</small></button>`).join('')}
      </div>
      <div class="pop-section">
        <button class="u-opt" data-act="about">${icon('info')}<span>${L('عن النموذج الأولي', 'About this prototype')}</span></button>
        <button class="u-opt" data-act="reset">${icon('refresh')}<span>${L('إعادة ضبط البيانات التجريبية', 'Reset sample data')}</span></button>
      </div>`, 'profile');
  }

  function about() {
    ui.modal({
      title: L('عن ARCHIVE AI', 'About ARCHIVE AI'), icon: 'info',
      body: `<div style="display:grid;gap:14px;font-size:14px" class="muted">
        <p>${L('ARCHIVE AI (أرشيف) نموذج أولي مستقل لمنصة تنظيم المستندات والمقالات والتقارير والبحث فيها وتحليلها، صُمّم ليناسب بيئة عمل المؤسسات الإعلامية، ومقترح لجهة التدريب.', 'ARCHIVE AI (Arshif) is an independent prototype for organising, searching and analysing documents, articles and reports, designed for media-organisation workflows and proposed to the training host.')}</p>
        <div class="notice warn">${icon('warn')}<div>${L('هذا المشروع ليس منتجًا رسميًا للمجموعة السعودية للأبحاث والإعلام (SRMG) ولا يستخدم شعارها أو أي معلومات داخلية لها. كل المستندات والأسماء والبريد الإلكتروني تجريبية.', 'This is not an official SRMG product and uses none of its branding or internal information. All documents, names and emails are fictional.')}</div></div>
        <div class="notice">${icon('sparkles')}<div>${L('«البحث الذكي» و«التحليل الذكي» في هذا النموذج خوارزميات نصية تعمل داخل المتصفح (توحيد الحروف، مطابقة بالأوزان، مرادفات عربي-إنجليزي، تلخيص استخلاصي). لا يُستخدم نموذج ذكاء اصطناعي حقيقي، ويمكن ربط خدمة فعلية لاحقًا في ملف engine.js.', '“AI Search” and “AI Insights” in this prototype are in-browser text algorithms (normalisation, weighted matching, Arabic–English synonyms, extractive summaries). No real AI model is used; a real service can be connected later in engine.js.')}</div></div>
        <p>${L('البيانات تُحفظ في متصفحك فقط (localStorage للبيانات، وIndexedDB للملفات المرفوعة). التقنيات: HTML5 وCSS3 وJavaScript، مع Chart.js للرسوم، وJSZip وPDF.js لاستخراج نصوص الملفات.', 'Data stays in your browser (localStorage for metadata, IndexedDB for uploaded files). Built with HTML5, CSS3 and JavaScript, plus Chart.js for charts and JSZip / PDF.js for text extraction.')}</p>
      </div>`,
      foot: `<button class="btn primary" data-close>${L('حسنًا', 'Got it')}</button>`
    });
  }

  /* ---------- إجراءات المستندات ---------- */
  const A = AA.actions = {};

  A.open = id => {
    const d = AA.doc(id);
    if (!d) return AA.toast('error', L('الملف غير موجود', 'File not found'), L('ربما حُذف من الأرشيف.', 'It may have been deleted.'));
    d.views = (d.views || 0) + 1;
    AA.store.save();
    const row = (k, v) => `<div><span>${k}</span><b>${v}</b></div>`;
    const m = ui.modal({
      size: 'lg', title: L('تفاصيل المستند', 'Document details'), icon: 'file',
      body: `<div class="dd-head">${ui.ftype(d.type, 'lg')}<div style="min-width:0"><h2>${esc(d.title)}</h2>
          <div class="r-meta">${ui.catChip(d.cat)}<span>${icon('globe')} ${ui.langLabel(d.lang)}</span><span>${icon('calendar')} ${AA.fmtDate(d.date)}</span>${d.uploaded ? `<span class="chip info">${L('مرفوع منك', 'Uploaded')}</span>` : `<span class="chip">${L('مستند تجريبي', 'Sample document')}</span>`}</div></div></div>
        <div class="dd-grid">
          <div>
            <section class="dd-sec"><h4>${icon('sparkles')} ${L('الملخص', 'Summary')}</h4><p>${esc(d.summary)}</p>
              <p class="dim" style="font-size:12px;margin-top:6px">${d.uploaded ? L('مولَّد محليًا بخوارزمية تلخيص استخلاصي من نص الملف.', 'Generated locally by an extractive summary of the file text.') : L('ملخص تجريبي مُدخل مسبقًا ضمن بيانات العرض.', 'Pre-written sample summary.')}</p></section>
            <section class="dd-sec"><h4>${icon('message')} ${L('الوصف', 'Description')}</h4><p>${d.desc ? esc(d.desc) : `<span class="dim">${L('لا يوجد وصف بعد.', 'No description yet.')}</span>`}</p></section>
            <section class="dd-sec"><h4>${icon('tag')} ${L('الكلمات المفتاحية', 'Keywords')}</h4><div class="chips">${d.keywords.length ? d.keywords.map(k => `<button class="chip" data-act="kw" data-q="${esc(k)}">${icon('hash')}${esc(k)}</button>`).join('') : `<span class="dim">—</span>`}</div></section>
            ${d.uploaded ? `<section class="dd-sec"><h4>${icon('eye')} ${L('معاينة', 'Preview')}</h4><div class="preview" id="dd-preview">${d.content ? `<pre>${esc(d.content.slice(0, 1600))}${d.content.length > 1600 ? '…' : ''}</pre>` : `<pre class="dim">${L('لم يُستخرج نص من هذا الملف.', 'No text was extracted from this file.')}</pre>`}</div></section>` : ''}
          </div>
          <aside class="dd-side">
            ${row(L('النوع', 'Type'), esc(AA.typeName(d.type)))}
            ${row(L('الحجم', 'Size'), `<span class="num">${AA.fmtSize(d.size)}</span>`)}
            ${row(L('تاريخ الإضافة', 'Added'), AA.fmtDateTime(d.date))}
            ${row(L('أضافه', 'Added by'), esc(AA.userName(d.author)))}
            ${row(L('اسم الملف', 'File name'), `<span style="word-break:break-all">${esc(d.fileName || d.title + '.' + d.type)}</span>`)}
            ${row(L('المشاهدات', 'Views'), `<span class="num">${AA.fmtNum(d.views)}</span>`)}
            ${row(L('التنزيلات', 'Downloads'), `<span class="num">${AA.fmtNum(d.downloads)}</span>`)}
            ${d.autoCat ? row(L('التصنيف', 'Classification'), `${L('تلقائي', 'Automatic')} <span class="num">${d.confidence || 0}%</span>`) : ''}
          </aside>
        </div>`,
      foot: `<button class="btn danger sm" data-act="doc-delete" data-id="${d.id}">${icon('trash')} ${L('حذف', 'Delete')}</button>
        <button class="btn sm" data-act="doc-edit" data-id="${d.id}">${icon('edit')} ${L('تعديل', 'Edit')}</button>
        <button class="btn sm" data-act="doc-analyze" data-id="${d.id}">${icon('sparkles')} ${L('تحليل', 'Analyse')}</button>
        <span class="spacer"></span>
        <button class="btn sm" data-act="fav" data-id="${d.id}" id="dd-fav">${icon('star', d.fav ? 'fill' : '')} ${d.fav ? L('في المفضلة', 'Favourited') : L('أضف للمفضلة', 'Favourite')}</button>
        <button class="btn primary sm" data-act="doc-download" data-id="${d.id}">${icon('download')} ${L('تنزيل', 'Download')}</button>`
    });
    m.el.dataset.doc = d.id;
    // معاينة PDF المرفوع داخل النافذة
    if (d.uploaded && d.type === 'pdf') {
      AA.idb.get(d.id).then(blob => {
        const box = m.el.querySelector('#dd-preview');
        if (!blob || !box || !m.el.isConnected) return;
        const url = URL.createObjectURL(blob);
        box.innerHTML = `<iframe src="${url}" title="${esc(d.title)}"></iframe>`;
        const obs = new MutationObserver(() => { if (!m.el.isConnected) { URL.revokeObjectURL(url); obs.disconnect(); } });
        obs.observe(document.getElementById('modal-root'), { childList: true });
      }).catch(() => {});
    }
  };

  A.fav = id => {
    const d = AA.doc(id); if (!d) return;
    d.fav = !d.fav;
    AA.log(d.fav ? 'favorite' : 'unfavorite', { docId: d.id, title: d.title });
    AA.store.save();
    AA.toast('success', d.fav ? L('أضيف إلى المفضلة', 'Added to favourites') : L('أزيل من المفضلة', 'Removed from favourites'), d.title);
    const btn = document.getElementById('dd-fav');
    if (btn) btn.innerHTML = `${icon('star', d.fav ? 'fill' : '')} ${d.fav ? L('في المفضلة', 'Favourited') : L('أضف للمفضلة', 'Favourite')}`;
    AA.refresh();
  };

  A.download = async id => {
    const d = AA.doc(id); if (!d || !AA.guard('download')) return;
    try {
      if (d.uploaded) {
        const blob = await AA.idb.get(d.id);
        if (!blob) throw new Error('missing');
        AA.download(d.fileName || d.title + '.' + d.type, blob);
        AA.toast('success', L('بدأ التنزيل', 'Download started'), d.fileName || d.title);
      } else {
        // المستندات التجريبية ليس لها ملف أصلي، فننزّل بطاقة بياناتها بوضوح
        const txt = [
          'ARCHIVE AI — ' + L('بطاقة مستند تجريبي', 'Sample document card'),
          L('هذا مستند تجريبي ضمن بيانات العرض، ولا يوجد له ملف أصلي.', 'This is a sample record from the demo data; no original file exists.'),
          '',
          L('العنوان: ', 'Title: ') + d.title,
          L('النوع: ', 'Type: ') + AA.typeName(d.type),
          L('التصنيف: ', 'Category: ') + AA.catName(d.cat),
          L('اللغة: ', 'Language: ') + ui.langLabel(d.lang),
          L('تاريخ الإضافة: ', 'Added: ') + AA.fmtDateTime(d.date),
          L('أضافه: ', 'Added by: ') + AA.userName(d.author),
          '',
          L('الملخص:', 'Summary:'), d.summary,
          '',
          L('الكلمات المفتاحية: ', 'Keywords: ') + d.keywords.join(', '),
          d.desc ? '\n' + L('الوصف: ', 'Description: ') + d.desc : ''
        ].join('\n');
        AA.download(d.title.replace(/[\\/:*?"<>|]/g, '-') + '.txt', '﻿' + txt);
        AA.toast('info', L('تم تنزيل بطاقة المستند', 'Document card downloaded'), L('المستندات التجريبية بلا ملف أصلي؛ ارفع ملفاتك من صفحة إدارة الملفات لتنزيلها كما هي.', 'Sample documents have no original file; upload your own files to download them as-is.'));
      }
      d.downloads = (d.downloads || 0) + 1;
      AA.log('download', { docId: d.id, title: d.title });
      AA.store.save();
      renderChrome();
    } catch (e) {
      AA.toast('error', L('تعذّر التنزيل', 'Download failed'), L('لم يُعثر على محتوى الملف في متصفحك.', 'The file content was not found in this browser.'));
    }
  };

  A.edit = id => {
    const d = AA.doc(id); if (!d || !AA.guard('edit')) return;
    let chips;
    const m = ui.modal({
      title: L('تعديل بيانات الملف', 'Edit file details'), icon: 'edit',
      body: `<form class="form-grid" id="edit-form" novalidate>
        <label class="field full"><span>${L('العنوان', 'Title')}</span><input class="input" name="title" dir="auto" value="${esc(d.title)}" maxlength="140" required><small class="err-text"></small></label>
        <label class="field"><span>${L('التصنيف', 'Category')}</span><select class="select" name="cat">${AA.CATS.map(c => `<option value="${c.id}" ${c.id === d.cat ? 'selected' : ''}>${esc(AA.lang === 'ar' ? c.ar : c.en)}</option>`).join('')}</select></label>
        <label class="field"><span>${L('لغة المستند', 'Language')}</span><select class="select" name="lang"><option value="ar" ${d.lang === 'ar' ? 'selected' : ''}>${L('عربي', 'Arabic')}</option><option value="en" ${d.lang === 'en' ? 'selected' : ''}>${L('إنجليزي', 'English')}</option></select></label>
        <label class="field full"><span>${L('الوصف', 'Description')}</span><textarea class="textarea" name="desc" dir="auto" maxlength="500" placeholder="${L('وصف مختصر يساعد زملاءك على فهم الملف', 'A short note to help colleagues understand this file')}">${esc(d.desc || '')}</textarea></label>
        <div class="field full"><span>${L('الكلمات المفتاحية', 'Keywords')}</span><div id="kw-host"></div></div>
        <label class="field full"><span>${L('الملخص', 'Summary')}</span><textarea class="textarea" name="summary" dir="auto" maxlength="1200">${esc(d.summary)}</textarea></label>
      </form>`,
      foot: `<button class="btn ghost" data-close>${L('إلغاء', 'Cancel')}</button><button class="btn primary" id="edit-save">${icon('check')} ${L('حفظ التعديلات', 'Save changes')}</button>`,
      onMount: el => { chips = ui.chipInput(el.querySelector('#kw-host'), d.keywords); }
    });
    const save = () => {
      const f = m.el.querySelector('#edit-form');
      const title = f.title.value.trim();
      if (!title) {
        f.title.classList.add('invalid');
        f.title.nextElementSibling.textContent = L('العنوان مطلوب.', 'Title is required.');
        f.title.focus();
        return AA.toast('error', L('لم يتم الحفظ', 'Not saved'), L('أدخل عنوانًا للملف.', 'Please enter a title.'));
      }
      const next = { title, cat: f.cat.value, lang: f.lang.value, desc: f.desc.value.trim(), summary: f.summary.value.trim() || d.summary, keywords: chips.get() };
      const changed = Object.keys(next).filter(k => JSON.stringify(next[k]) !== JSON.stringify(d[k]));
      if (!changed.length) { m.close(); return AA.toast('info', L('لا توجد تغييرات', 'No changes'), L('لم تعدّل أي حقل.', 'Nothing was changed.')); }
      if (changed.includes('cat')) d.autoCat = false;
      Object.assign(d, next);
      AA.log('edit', { docId: d.id, title: d.title, detail: changed.join(',') });
      AA.store.save();
      m.close();
      ui.closeAll();
      AA.toast('success', L('تم حفظ التعديلات', 'Changes saved'), d.title);
      AA.refresh();
    };
    m.el.querySelector('#edit-form').addEventListener('input', e => { if (e.target.classList.contains('invalid')) { e.target.classList.remove('invalid'); const er = e.target.parentElement.querySelector('.err-text'); if (er) er.textContent = ''; } });
    m.el.querySelector('#edit-save').addEventListener('click', save);
    m.el.querySelector('#edit-form').addEventListener('submit', e => { e.preventDefault(); save(); });
  };

  A.remove = async id => {
    const d = AA.doc(id); if (!d || !AA.guard('delete')) return;
    const ok = await ui.confirm({ danger: true, title: L('حذف الملف؟', 'Delete this file?'), message: L(`سيُحذف «${esc(d.title)}» من الأرشيف ولن يظهر في البحث. لا يمكن التراجع عن هذه العملية.`, `“${esc(d.title)}” will be removed from the archive and search. This can't be undone.`), ok: L('نعم، احذف', 'Yes, delete') });
    if (!ok) return;
    AA.store.state.docs = AA.docs().filter(x => x.id !== id);
    if (d.uploaded) AA.idb.del(id);
    AA.log('delete', { docId: d.id, title: d.title });
    AA.store.save();
    ui.closeAll();
    AA.toast('success', L('تم حذف الملف', 'File deleted'), d.title);
    AA.refresh();
  };

  A.analyze = id => { if (!AA.guard('analyze')) return; ui.closeAll(); AA.go('insights', { doc: id }); };

  /* ---------- النقرات العامة ---------- */
  document.addEventListener('click', async e => {
    const el = e.target.closest('[data-act]');
    if (pop && !e.target.closest('.popover') && !(el && (el.dataset.act === 'notif' || el.dataset.act === 'profile'))) closePop();
    if (!el) return;
    const id = el.dataset.id;
    switch (el.dataset.act) {
      case 'doc-open': e.preventDefault(); A.open(id); break;
      case 'fav': e.preventDefault(); A.fav(id); break;
      case 'doc-download': e.preventDefault(); A.download(id); break;
      case 'doc-edit': e.preventDefault(); A.edit(id); break;
      case 'doc-delete': e.preventDefault(); A.remove(id); break;
      case 'doc-analyze': e.preventDefault(); A.analyze(id); break;
      case 'kw': ui.closeAll(); AA.go('search', { q: el.dataset.q, run: '1' }); break;
      case 'report': if (AA.guard('analyze')) AA.reports.download(); break;
      case 'open-side': document.body.classList.add('side-open'); break;
      case 'close-side': document.body.classList.remove('side-open'); break;
      case 'notif': notifPop(el); break;
      case 'profile': profilePop(el); break;
      case 'about': closePop(); about(); break;
      case 'lang': {
        AA.setLang(AA.lang === 'ar' ? 'en' : 'ar');
        ui.chartDefaults();
        buildShell();
        render(true);
        AA.toast('success', L('تم تغيير اللغة', 'Language changed'), L('الواجهة الآن باللغة العربية.', 'The interface is now in English.'));
        break;
      }
      case 'switch-user': {
        AA.store.state.me = id;
        AA.store.save();
        closePop();
        render(true);
        AA.toast('info', L('تم تبديل المستخدم', 'Switched user'), L(`أنت الآن «${AA.userName(id)}» بصلاحية ${AA.roleName(AA.me().role)}.`, `You are now “${AA.userName(id)}” (${AA.roleName(AA.me().role)}).`));
        break;
      }
      case 'reset': {
        closePop();
        const ok = await ui.confirm({ danger: true, ic: 'refresh', title: L('إعادة ضبط البيانات؟', 'Reset sample data?'), message: L('ستُحذف كل الملفات التي رفعتها والتعديلات التي أجريتها، وتعود البيانات التجريبية الأصلية.', 'All your uploads and edits will be removed and the original sample data restored.'), ok: L('إعادة الضبط', 'Reset') });
        if (!ok) return;
        await AA.store.reset();
        AA.go('dashboard');
        AA.toast('success', L('تمت إعادة الضبط', 'Data reset'), L('عادت البيانات التجريبية الأصلية.', 'The original sample data is back.'));
        break;
      }
    }
  });

  // إضاءة البطاقات تتبع المؤشر
  document.addEventListener('pointermove', e => {
    const c = e.target.closest && e.target.closest('.spot');
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); const i = document.getElementById('gsearch-input'); i && i.focus(); }
    else if (e.key === 'Escape') { if (!ui.closeTop()) { closePop(); document.body.classList.remove('side-open'); } }
  });

  window.addEventListener('hashchange', () => { ui.closeAll(); render(); });

  /* ---------- التشغيل ---------- */
  function start() {
    AA.setLang(AA.lang);
    AA.store.load();
    ui.chartDefaults();
    buildShell();
    render();
    const splash = document.getElementById('splash');
    const t0 = performance.now();
    const hide = () => { if (!splash.isConnected) return; splash.classList.add('hide'); setTimeout(() => splash.remove(), 800); };
    splash.addEventListener('click', hide);
    // نترك شاشة الترحيب تكمل حركتها (حوالي ثانيتين) ثم تختفي
    const wait = () => setTimeout(hide, Math.max(0, 2100 - (performance.now() - t0)));
    if (document.readyState === 'complete') wait(); else window.addEventListener('load', wait);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(window.AA);
