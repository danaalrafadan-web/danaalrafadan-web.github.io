/* ARCHIVE AI — الأساسيات المشتركة: اللغة، التنسيق، الأيقونات، أدوات صغيرة */
window.AA = window.AA || {};
(function (AA) {
  'use strict';

  // التخزين المحلي قد يكون محجوبًا (نافذة خاصة مثلًا)، فكل قراءة وكتابة داخل try
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  AA.pref = { get, set };

  AA.pages = {};
  AA.lang = get('aa.lang') === 'en' ? 'en' : 'ar';
  AA.L = (ar, en) => (AA.lang === 'ar' ? ar : en);
  AA.setLang = l => {
    AA.lang = l;
    set('aa.lang', l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  };

  AA.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  AA.uid = p => (p || 'id') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ميلادي وأرقام لاتينية في الواجهة العربية حتى تبقى الأرقام واضحة في الجداول
  AA.locale = () => (AA.lang === 'ar' ? 'ar-u-ca-gregory-nu-latn' : 'en-GB');
  AA.fmtDate = (iso, o) => new Intl.DateTimeFormat(AA.locale(), o || { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
  AA.fmtDateTime = iso => new Intl.DateTimeFormat(AA.locale(), { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  AA.fmtTime = iso => new Intl.DateTimeFormat(AA.locale(), { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  AA.fmtNum = n => new Intl.NumberFormat(AA.locale()).format(n);
  AA.fmtSize = b => {
    if (b < 1024) return b + ' B';
    const u = ['KB', 'MB', 'GB'];
    let i = -1;
    do { b /= 1024; i++; } while (b >= 1024 && i < 2);
    return (b >= 100 ? Math.round(b) : b.toFixed(1)) + ' ' + u[i];
  };
  AA.timeAgo = iso => {
    const diff = (new Date(iso) - Date.now()) / 1000;
    const rtf = new Intl.RelativeTimeFormat(AA.lang === 'ar' ? 'ar-u-nu-latn' : 'en', { numeric: 'auto' });
    const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [u, s] of units) if (Math.abs(diff) >= s) return rtf.format(Math.round(diff / s), u);
    return AA.L('الآن', 'just now');
  };
  AA.daysAgo = d => new Date(Date.now() - d * 86400000).toISOString();
  AA.dayKey = iso => { const d = new Date(iso); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  AA.today = () => AA.dayKey(new Date().toISOString());

  // صيغ العدد في العربية: مستند واحد، مستندان، 3 مستندات، 11 مستندًا
  AA.docsCount = n => AA.lang === 'ar'
    ? (n === 1 ? 'مستند واحد' : n === 2 ? 'مستندان' : AA.fmtNum(n) + (n % 100 >= 3 && n % 100 <= 10 ? ' مستندات' : n === 0 ? ' مستندات' : ' مستندًا'))
    : AA.fmtNum(n) + (n === 1 ? ' document' : ' documents');

  AA.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  AA.download = (filename, content, mime) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  // تحميل مكتبة خارجية عند الحاجة فقط (استخراج نصوص PDF وملفات Office)
  const scripts = {};
  AA.loadScript = src => scripts[src] || (scripts[src] = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = res;
    s.onerror = () => { delete scripts[src]; rej(new Error('load failed: ' + src)); };
    document.head.appendChild(s);
  }));

  // أيقونات خطية بنفس أسلوب lucide، مرسومة داخليًا حتى لا يعتمد الموقع على مكتبة أيقونات
  const I = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    search: '<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    sparkles: '<path d="M11 3.5 12.9 8.6 18 10.5 12.9 12.4 11 17.5 9.1 12.4 4 10.5 9.1 8.6Z"/><path d="M19 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    star: '<path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.65 1.13 6.57L12 17.56l-5.9 3.1 1.13-6.57-4.78-4.65 6.6-.96Z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z"/><path d="M14 2v6h6"/>',
    files: '<path d="M15.5 2H8.6a1.6 1.6 0 0 0-1.6 1.6v12.8A1.6 1.6 0 0 0 8.6 18h9.8a1.6 1.6 0 0 0 1.6-1.6V6.5Z"/><path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8"/><path d="M15 2v5h5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54Z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
    shieldCheck: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
    pie: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10Z"/>',
    tag: '<path d="M12 2H2v10l9.29 9.29a2.41 2.41 0 0 0 3.42 0l6.58-6.58a2.41 2.41 0 0 0 0-3.42Z"/><path d="M7 7h.01"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',
    bot: '<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h.01M16 16h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    trendDown: '<path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    newspaper: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8Z"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9Z"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
    power: '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>',
    report: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z"/><path d="M14 2v6h6"/><path d="M8 18v-3M12 18v-6M16 18v-4"/>',
    table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    languages: '<path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>',
    quote: '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2.02-2-2H4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .01-1 1.03V20c0 1 0 1 1 1Z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.76-2.02-2-2h-4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1Z"/>',
    wand: '<path d="m15 4-1 1M21 10l-1 1M19 4l-1 1M17.5 2v2M22 6.5h-2M3 21 14.5 9.5M16 8l-1.5-1.5L13 8l1.5 1.5Z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    logo: ''
  };
  AA.icon = (name, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${I[name] || ''}</svg>`;

  // شعار المنصة: طبقات أرشيف بتدرج بنفسجي-سماوي، ولكل نسخة معرّف تدرج مستقل
  let logoN = 0;
  AA.logoMark = () => {
    const id = 'aalg' + (++logoN);
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c4b5fd"/><stop offset=".5" stop-color="#6366f1"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs><path d="M24 5 43 14.5 24 24 5 14.5Z" fill="url(#${id})"/><path d="M5 23l19 9.5L43 23" fill="none" stroke="url(#${id})" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/><path d="M5 31.5 24 41l19-9.5" fill="none" stroke="url(#${id})" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" opacity=".45"/></svg>`;
  };
})(window.AA);
