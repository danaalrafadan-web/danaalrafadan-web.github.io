/* ARCHIVE AI — سجل النشاط */
(function (AA) {
  'use strict';
  const { L, esc, icon, ui } = AA;
  const st = { type: '', q: '', range: '', limit: 40 };
  const TYPES = ['upload', 'search', 'edit', 'download', 'delete', 'favorite', 'user', 'report'];
  const RANGES = () => [['', L('كل الأوقات', 'All time')], ['1', L('اليوم', 'Today')], ['7', L('آخر 7 أيام', 'Last 7 days')], ['30', L('آخر 30 يومًا', 'Last 30 days')]];

  function filtered(ignoreType) {
    const q = AA.norm(st.q.trim());
    const cut = st.range === '1' ? new Date(new Date().setHours(0, 0, 0, 0)).getTime() : st.range ? Date.now() - Number(st.range) * 86400000 : 0;
    return AA.store.state.activity.filter(a =>
      (ignoreType || !st.type || a.type === st.type || (st.type === 'favorite' && a.type === 'unfavorite')) &&
      (!cut || new Date(a.at).getTime() >= cut) &&
      (!q || AA.norm([a.title, a.q, a.target, AA.userName(a.userId)].join(' ')).includes(q)));
  }

  function draw(root) {
    const base = filtered(true);
    root.querySelectorAll('.tf').forEach(b => {
      const t = b.dataset.t;
      b.querySelector('em').textContent = t ? base.filter(a => a.type === t || (t === 'favorite' && a.type === 'unfavorite')).length : base.length;
      b.classList.toggle('on', st.type === t);
    });
    const list = filtered();
    const shown = list.slice(0, st.limit);
    const days = [];
    shown.forEach(a => { const k = AA.dayKey(a.at); let g = days[days.length - 1]; if (!g || g.k !== k) days.push(g = { k, at: a.at, items: [] }); g.items.push(a); });
    const today = AA.today(), yest = AA.dayKey(new Date(Date.now() - 86400000).toISOString());
    root.querySelector('#tl').innerHTML = shown.length ? days.map(g => `
      <div class="day"><h4>${g.k === today ? L('اليوم', 'Today') : g.k === yest ? L('أمس', 'Yesterday') : AA.fmtDate(g.at, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h4>
        <div class="events">${g.items.map(a => { const d = AA.describe(a); const u = AA.user(a.userId); return `
          <div class="ev"><span class="ev-ic" style="--c:${d.color}">${icon(d.icon)}</span>
            <div class="ev-txt"><b>${d.html}</b><small>${u ? ui.avatar(u, 'xs') : ''}${esc(AA.userName(a.userId))}${d.extra ? ` · ${esc(d.extra)}` : ''}${a.detail === 'chat' ? ` · ${L('عبر المساعد', 'via assistant')}` : ''}</small></div>
            <span class="ev-time" title="${AA.fmtDateTime(a.at)}">${AA.fmtTime(a.at)}</span></div>`; }).join('')}</div></div>`).join('')
      : `<div class="glass">${ui.empty('activity', L('لا يوجد نشاط مطابق', 'No matching activity'), L('غيّر نوع العملية أو الفترة الزمنية.', 'Change the activity type or time range.'))}</div>`;
    root.querySelector('#tl-more').innerHTML = list.length > shown.length ? `<button class="btn" id="more">${L(`عرض المزيد (${list.length - shown.length})`, `Show more (${list.length - shown.length})`)}</button>` : '';
    root.querySelector('#a-count').textContent = L(`${AA.fmtNum(list.length)} عملية`, `${AA.fmtNum(list.length)} events`);
  }

  AA.pages.activity = {
    title: () => L('سجل النشاط', 'Activity Log'),
    render() {
      if (!AA.can('activity')) {
        return `<div class="glass locked-page">${ui.empty('lock', L('سجل النشاط متاح للموظفين ومديري النظام', 'The activity log is for employees and admins'), L(`دورك الحالي «${AA.roleName(AA.me().role)}» لا يشمل الاطلاع على السجل. بدّل المستخدم من قائمة الحساب أعلى الصفحة.`, `Your role “${AA.roleName(AA.me().role)}” can’t view the log. Switch user from the account menu above.`), `<a class="btn" href="#/users">${icon('shield')} ${L('عرض مصفوفة الصلاحيات', 'View permission matrix')}</a>`)}</div>`;
      }
      return `
      <div class="page-head">
        <div><span class="eyebrow">${L('التدقيق', 'Audit')}</span><h1>${L('سجل النشاط', 'Activity log')}</h1>
          <p>${L('كل عملية على الأرشيف مسجلة بتاريخها ووقتها والمستخدم الذي قام بها: إضافة الملفات، عمليات البحث، التعديلات، التنزيلات وغيرها.', 'Every archive action is recorded with its date, time and user: uploads, searches, edits, downloads and more.')}</p></div>
        <div class="actions"><button class="btn" id="a-export">${icon('table')} ${L('تصدير CSV', 'Export CSV')}</button></div>
      </div>
      <div class="type-filters" role="toolbar" aria-label="${L('نوع العملية', 'Activity type')}">
        <button class="tf" data-t="">${icon('layers')} ${L('الكل', 'All')} <em></em></button>
        ${TYPES.map(t => `<button class="tf" data-t="${t}">${icon(AA.EV[t][0])} ${t === 'user' ? L('المستخدمون', 'Users') : t === 'report' ? L('التقارير', 'Reports') : t === 'favorite' ? L('المفضلة', 'Favourites') : t === 'upload' ? L('الإضافة', 'Uploads') : t === 'search' ? L('البحث', 'Searches') : t === 'edit' ? L('التعديلات', 'Edits') : t === 'download' ? L('التنزيلات', 'Downloads') : L('الحذف', 'Deletions')} <em></em></button>`).join('')}
      </div>
      <div class="toolbar">
        <div class="input-ic">${icon('search')}<input class="input" id="a-q" type="search" value="${esc(st.q)}" placeholder="${L('ابحث باسم ملف أو مستخدم أو عبارة بحث…', 'Search by file, user or query…')}" aria-label="${L('بحث في السجل', 'Search log')}"></div>
        <select class="select" id="a-range" aria-label="${L('الفترة', 'Range')}">${RANGES().map(([v, l]) => `<option value="${v}" ${st.range === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <span class="dim" id="a-count" style="font-size:13px"></span>
      </div>
      <section class="glass card"><div class="timeline" id="tl"></div><div class="more-wrap" id="tl-more"></div></section>`;
    },
    mount(root) {
      if (!AA.can('activity')) return;
      root.querySelector('.type-filters').addEventListener('click', e => { const b = e.target.closest('.tf'); if (b) { st.type = b.dataset.t; st.limit = 40; draw(root); } });
      root.querySelector('#a-q').addEventListener('input', AA.debounce(e => { st.q = e.target.value; st.limit = 40; draw(root); }, 150));
      root.querySelector('#a-range').addEventListener('change', e => { st.range = e.target.value; st.limit = 40; draw(root); });
      root.addEventListener('click', e => { if (e.target.closest('#more')) { st.limit += 40; draw(root); } });
      root.querySelector('#a-export').addEventListener('click', () => {
        const list = filtered();
        const strip = h => h.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        ui.csv(`archive-ai-activity-${AA.today()}.csv`, [[L('التاريخ', 'Date'), L('الوقت', 'Time'), L('النوع', 'Type'), L('الوصف', 'Description'), L('المستخدم', 'User'), L('تفاصيل', 'Details')]]
          .concat(list.map(a => { const d = AA.describe(a); return [AA.fmtDate(a.at), AA.fmtTime(a.at), AA.evLabel(a.type), strip(d.html), AA.userName(a.userId), d.extra]; })));
        AA.toast('success', L('تم تصدير السجل', 'Log exported'), L(`${list.length} عملية في ملف CSV`, `${list.length} events in a CSV file`));
      });
      draw(root);
    }
  };
})(window.AA);
