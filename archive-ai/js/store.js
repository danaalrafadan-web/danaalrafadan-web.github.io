/* ARCHIVE AI — حفظ الحالة والصلاحيات وسجل النشاط
   البيانات الوصفية في localStorage، ومحتوى الملفات المرفوعة نفسها في IndexedDB
   لأن localStorage لا يتسع للملفات الكبيرة. */
(function (AA) {
  'use strict';
  const KEY = 'aa.state.v1';

  const S = AA.store = {
    state: null,
    load() {
      let raw = null;
      try { raw = localStorage.getItem(KEY); } catch (e) { /* التخزين محجوب، نعمل بالذاكرة فقط */ }
      if (raw) {
        try {
          const st = JSON.parse(raw);
          if (st && st.v === 1 && Array.isArray(st.docs)) { this.state = st; return; }
        } catch (e) { /* بيانات تالفة، نعيد البيانات التجريبية */ }
      }
      this.state = AA.seed();
      this.save();
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.state)); return true; }
      catch (e) {
        // غالبًا امتلأت المساحة بسبب نصوص الملفات المستخرجة؛ نختصرها ونحاول مرة ثانية
        this.state.docs.forEach(d => { if (d.content && d.content.length > 3000) d.content = d.content.slice(0, 3000); });
        try { localStorage.setItem(KEY, JSON.stringify(this.state)); return true; } catch (e2) {
          AA.toast('error', AA.L('تعذّر حفظ البيانات', 'Could not save data'), AA.L('مساحة التخزين في المتصفح ممتلئة أو محجوبة.', 'Browser storage is full or blocked.'));
          return false;
        }
      }
    },
    async reset() {
      await AA.idb.clear();
      this.state = AA.seed();
      this.save();
    }
  };

  AA.docs = () => S.state.docs;
  AA.doc = id => S.state.docs.find(d => d.id === id);
  AA.users = () => S.state.users;
  AA.user = id => S.state.users.find(u => u.id === id);
  AA.me = () => AA.user(S.state.me) || S.state.users[0];
  AA.userName = id => { const u = AA.user(id); return u ? (u.name[AA.lang] || u.name.ar) : AA.L('مستخدم محذوف', 'Removed user'); };

  AA.can = perm => { const p = AA.PERMS.find(x => x.id === perm); return !!p && p.roles.includes(AA.me().role); };
  AA.guard = perm => {
    if (AA.can(perm)) return true;
    const p = AA.PERMS.find(x => x.id === perm);
    AA.toast('error', AA.L('ليست لديك صلاحية', 'Permission denied'),
      AA.L(`دورك الحالي «${AA.roleName(AA.me().role)}» لا يسمح بـ${p ? p.ar : 'هذه العملية'}. غيّر المستخدم من القائمة أعلى الصفحة لتجربة دور آخر.`,
        `Your current role “${AA.roleName(AA.me().role)}” can't ${p ? p.en.toLowerCase() : 'do this'}. Switch user from the top menu to try another role.`));
    return false;
  };

  AA.log = (type, data) => {
    S.state.activity.unshift(Object.assign({ id: AA.uid('a'), type, at: new Date().toISOString(), userId: AA.me().id }, data || {}));
    if (S.state.activity.length > 2000) S.state.activity.length = 2000;
  };

  // مخزن الملفات الفعلية
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    if (!('indexedDB' in window)) return rej(new Error('IndexedDB unavailable'));
    const r = indexedDB.open('archive-ai', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('files');
    r.onsuccess = () => res(r.result);
    r.onerror = () => { dbp = null; rej(r.error); };
  }));
  const tx = (mode, fn) => open().then(db => new Promise((res, rej) => {
    const t = db.transaction('files', mode);
    const req = fn(t.objectStore('files'));
    t.oncomplete = () => res(req ? req.result : undefined);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error);
  }));
  AA.idb = {
    put: (k, v) => tx('readwrite', s => s.put(v, k)),
    get: k => tx('readonly', s => s.get(k)),
    del: k => tx('readwrite', s => s.delete(k)).catch(() => {}),
    clear: () => tx('readwrite', s => s.clear()).catch(() => {})
  };
})(window.AA);
