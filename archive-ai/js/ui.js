/* ARCHIVE AI — مكونات الواجهة: التنبيهات، النوافذ، الشارات، الرسوم الصغيرة */
(function (AA) {
  'use strict';
  const ui = AA.ui = {};
  const { esc, icon, L } = AA;

  /* ---------- رسائل النجاح والخطأ ---------- */
  const T_IC = { success: 'check', error: 'alert', info: 'info', warning: 'warn' };
  AA.toast = (type, title, msg, opts) => {
    opts = opts || {};
    const box = document.getElementById('toasts');
    const ms = opts.ms || (type === 'error' ? 6000 : 4200);
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = `<div class="t-ic">${icon(T_IC[type] || 'info')}</div>
      <div><b>${esc(title)}</b>${msg ? `<p>${esc(msg)}</p>` : ''}${opts.action ? `<div class="t-act"><button class="btn sm">${esc(opts.action.label)}</button></div>` : ''}</div>
      <button class="t-close" aria-label="${L('إغلاق', 'Close')}">${icon('x')}</button>
      <span class="t-time" style="animation-duration:${ms}ms"></span>`;
    const close = () => { if (!el.isConnected) return; el.classList.add('out'); setTimeout(() => el.remove(), 280); };
    el.querySelector('.t-close').onclick = close;
    if (opts.action) el.querySelector('.t-act button').onclick = () => { opts.action.fn(); close(); };
    let timer = setTimeout(close, ms);
    el.onmouseenter = () => { clearTimeout(timer); el.querySelector('.t-time').style.animationPlayState = 'paused'; };
    el.onmouseleave = () => { timer = setTimeout(close, 1800); };
    box.appendChild(el);
    while (box.children.length > 4) box.firstElementChild.remove();
  };

  /* ---------- النوافذ ---------- */
  const stack = [];
  ui.modal = ({ title, body, foot, size, icon: ic, onMount, onClose }) => {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `<div class="modal ${size || ''}" role="dialog" aria-modal="true" aria-label="${esc(title || '')}">
      ${title != null ? `<div class="modal-head">${ic ? `<div class="card-title-ic">${icon(ic)}</div>` : ''}<h3>${esc(title)}</h3><button class="mini-btn" data-close aria-label="${L('إغلاق', 'Close')}">${icon('x')}</button></div>` : ''}
      <div class="modal-body">${body || ''}</div>
      ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
    </div>`;
    const prevFocus = document.activeElement;
    const close = () => {
      if (back.classList.contains('closing')) return;
      back.classList.add('closing');
      const i = stack.indexOf(m); if (i > -1) stack.splice(i, 1);
      setTimeout(() => { back.remove(); if (!stack.length) document.body.classList.remove('no-scroll'); }, 190);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      onClose && onClose();
    };
    const m = { el: back.firstElementChild, close };
    back.addEventListener('mousedown', e => { if (e.target === back) close(); });
    back.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
    document.getElementById('modal-root').appendChild(back);
    document.body.classList.add('no-scroll');
    stack.push(m);
    onMount && onMount(m.el, m);
    const f = m.el.querySelector('[autofocus], .modal-body input, .modal-body textarea, .modal-foot .btn.primary');
    if (f) setTimeout(() => f.focus(), 60);
    return m;
  };
  ui.closeTop = () => { const m = stack[stack.length - 1]; if (m) { m.close(); return true; } return false; };
  ui.closeAll = () => { while (stack.length) stack[stack.length - 1].close(); };

  ui.confirm = ({ title, message, ok, danger, ic }) => new Promise(resolve => {
    let done = false;
    const m = ui.modal({
      size: 'sm',
      title: null,
      body: `<div class="confirm-ic ${danger ? '' : 'info'}">${icon(ic || (danger ? 'trash' : 'info'))}</div>
        <h3 style="font-size:17px;margin-bottom:8px">${esc(title)}</h3><p class="muted" style="font-size:14px">${message}</p>`,
      foot: `<button class="btn ghost" data-close>${L('إلغاء', 'Cancel')}</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(ok || L('تأكيد', 'Confirm'))}</button>`,
      onMount: el => el.querySelector('[data-ok]').addEventListener('click', () => { done = true; resolve(true); m.close(); }),
      onClose: () => { if (!done) resolve(false); }
    });
  });

  /* ---------- شارات وعناصر صغيرة ---------- */
  ui.ftype = (t, size) => `<span class="ftype t-${esc(t)} ${size || ''}" aria-label="${esc(AA.typeName(t))}"><b>${esc((AA.TYPES[t] || { label: t }).label)}</b></span>`;
  ui.catChip = id => `<span class="chip cat" style="--c:${AA.cat(id).color}">${esc(AA.catName(id))}</span>`;
  ui.langLabel = l => (l === 'ar' ? L('عربي', 'Arabic') : L('إنجليزي', 'English'));
  ui.initial = u => {
    const n = (u.name[AA.lang] || u.name.ar || '?').trim();
    if (/[؀-ۿ]/.test(n)) return n[0];
    return n.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };
  ui.avatar = (u, size) => {
    if (!u) return `<span class="avatar ${size || ''}" style="--h:220">?</span>`;
    let h = 0; for (const c of u.id) h = (h * 31 + c.charCodeAt(0)) % 360;
    return `<span class="avatar ${size || ''}" style="--h:${(h * 7) % 360}">${esc(ui.initial(u))}</span>`;
  };
  ui.empty = (ic, title, text, action) => `<div class="empty"><div class="em-ic">${icon(ic)}</div><h4>${esc(title)}</h4>${text ? `<p>${esc(text)}</p>` : ''}${action || ''}</div>`;
  ui.isNew = d => Date.now() - new Date(d.date).getTime() < 3 * 86400000;

  // خط بياني صغير داخل بطاقة الإحصاء
  ui.spark = (vals, color) => {
    const w = 96, h = 34, max = Math.max(...vals, 1), min = Math.min(...vals, 0);
    const pts = vals.map((v, i) => [i * (w / (vals.length - 1 || 1)), h - 3 - ((v - min) / (max - min || 1)) * (h - 8)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const id = 'sp' + Math.random().toString(36).slice(2, 8);
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${d} L${w} ${h} L0 ${h}Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  };

  ui.trend = (now, prev) => {
    if (!prev && !now) return `<span class="trend flat">0%</span>`;
    if (!prev) return `<span class="trend up">${icon('trend')} ${L('جديد', 'new')}</span>`;
    const p = Math.round((now - prev) / prev * 100);
    const cls = p > 0 ? 'up' : p < 0 ? 'down' : 'flat';
    return `<span class="trend ${cls}">${p !== 0 ? icon(p > 0 ? 'trend' : 'trendDown') : ''}<span class="num" dir="ltr">${p > 0 ? '+' : ''}${p}%</span></span>`;
  };

  // عدّاد متحرك للأرقام الكبيرة
  ui.countUp = root => {
    root.querySelectorAll('[data-count]').forEach(el => {
      const to = Number(el.dataset.count);
      const t0 = performance.now(), dur = 900;
      const step = t => {
        const k = Math.min(1, (t - t0) / dur);
        el.textContent = AA.fmtNum(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };

  // حقل الكلمات المفتاحية: Enter أو الفاصلة يضيفان كلمة، و× يحذفها
  ui.chipInput = (host, initial) => {
    let items = (initial || []).slice();
    host.classList.add('chip-input');
    const draw = () => {
      host.innerHTML = items.map((k, i) => `<span class="chip">${esc(k)}<button type="button" data-i="${i}" aria-label="${L('حذف', 'Remove')} ${esc(k)}">${icon('x')}</button></span>`).join('') +
        `<input type="text" placeholder="${L('اكتب كلمة واضغط Enter', 'Type a keyword, press Enter')}" aria-label="${L('الكلمات المفتاحية', 'Keywords')}">`;
      const inp = host.querySelector('input');
      inp.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ',' || e.key === '،') && inp.value.trim()) { e.preventDefault(); add(inp.value); }
        else if (e.key === 'Backspace' && !inp.value && items.length) { items.pop(); draw(); host.querySelector('input').focus(); }
      });
      inp.addEventListener('blur', () => { if (inp.value.trim()) add(inp.value, true); });
    };
    const add = (v, silent) => {
      v.split(/[,،]/).map(s => s.trim()).filter(Boolean).forEach(s => { if (!items.includes(s) && items.length < 15) items.push(s); });
      draw();
      if (!silent) host.querySelector('input').focus();
    };
    host.addEventListener('click', e => {
      const b = e.target.closest('button[data-i]');
      if (b) { items.splice(Number(b.dataset.i), 1); draw(); host.querySelector('input').focus(); }
      else if (e.target === host) host.querySelector('input').focus();
    });
    draw();
    return { get: () => { const v = host.querySelector('input').value.trim(); if (v) add(v, true); return items.slice(); } };
  };

  // تنزيل CSV مع BOM حتى يفتح Excel الحروف العربية بشكل صحيح
  ui.csv = (name, rows) => {
    const cell = v => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    AA.download(name, '﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  };

  // إعدادات الرسوم البيانية المشتركة
  ui.chartReady = () => typeof window.Chart !== 'undefined';
  ui.chartDefaults = () => {
    if (!ui.chartReady()) return;
    const C = window.Chart;
    C.defaults.color = '#a3abcf';
    C.defaults.font.family = getComputedStyle(document.body).fontFamily;
    C.defaults.font.size = 12;
    C.defaults.borderColor = 'rgba(160,170,255,.08)';
    C.defaults.plugins.legend.display = false;
    Object.assign(C.defaults.plugins.tooltip, {
      backgroundColor: 'rgba(10,14,36,.96)', borderColor: 'rgba(160,170,255,.22)', borderWidth: 1,
      padding: 12, cornerRadius: 12, titleColor: '#eef1ff', bodyColor: '#c9cfee', boxPadding: 6, usePointStyle: true,
      rtl: AA.lang === 'ar', textDirection: AA.lang === 'ar' ? 'rtl' : 'ltr'
    });
  };
  ui.chart = (canvas, config) => {
    if (!ui.chartReady() || !canvas) {
      if (canvas) canvas.parentElement.innerHTML = `<div class="chart-fallback">${L('تعذّر تحميل مكتبة الرسوم البيانية. تأكد من الاتصال بالإنترنت ثم حدّث الصفحة.', 'The chart library could not load. Check your connection and refresh.')}</div>`;
      return null;
    }
    const c = new window.Chart(canvas, config);
    AA.charts.push(c);
    return c;
  };
  ui.fade = (ctx, color) => {
    const { chart } = ctx; const a = chart.chartArea;
    if (!a) return 'transparent';
    const g = chart.ctx.createLinearGradient(0, a.top, 0, a.bottom);
    g.addColorStop(0, color + '55'); g.addColorStop(1, color + '00');
    return g;
  };
})(window.AA);
