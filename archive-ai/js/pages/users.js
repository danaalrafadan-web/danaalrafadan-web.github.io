/* ARCHIVE AI — إدارة المستخدمين والصلاحيات */
(function (AA) {
  'use strict';
  const { L, esc, icon, ui } = AA;
  const st = { q: '', role: '', status: '' };
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function rows() {
    const q = AA.norm(st.q.trim());
    return AA.users().filter(u => (!st.role || u.role === st.role) && (!st.status || u.status === st.status) &&
      (!q || AA.norm(u.name.ar + ' ' + u.name.en + ' ' + u.email).includes(q)));
  }

  function drawTable(root) {
    const me = AA.me();
    const list = rows();
    root.querySelector('#u-body').innerHTML = list.length ? list.map(u => `<tr>
      <td class="main-cell"><div class="u-cell">${ui.avatar(u)}<div><b>${esc(AA.userName(u.id))}${u.id === me.id ? `<span class="me-tag">${L('أنت', 'You')}</span>` : ''}</b><small dir="ltr">${esc(u.email)}</small></div></div></td>
      <td data-l="${L('الدور', 'Role')}"><span class="chip">${icon(AA.ROLES[u.role].icon)} ${esc(AA.roleName(u.role))}</span></td>
      <td data-l="${L('تاريخ التسجيل', 'Joined')}">${AA.fmtDate(u.joined)}</td>
      <td data-l="${L('الحالة', 'Status')}"><span class="status ${u.status}">${esc(AA.statusName(u.status))}</span></td>
      <td><div class="t-actions">
        <button class="mini-btn" data-u="edit" data-id="${u.id}" title="${L('تعديل', 'Edit')}" aria-label="${L('تعديل', 'Edit')}">${icon('edit')}</button>
        <button class="mini-btn" data-u="toggle" data-id="${u.id}" title="${u.status === 'active' ? L('إيقاف الحساب', 'Deactivate') : L('تفعيل الحساب', 'Activate')}" aria-label="${u.status === 'active' ? L('إيقاف الحساب', 'Deactivate') : L('تفعيل الحساب', 'Activate')}">${icon('power')}</button>
        <button class="mini-btn danger" data-u="delete" data-id="${u.id}" title="${L('حذف', 'Delete')}" aria-label="${L('حذف', 'Delete')}">${icon('trash')}</button>
      </div></td></tr>`).join('') : `<tr><td colspan="5">${ui.empty('users', L('لا يوجد مستخدمون مطابقون', 'No matching users'), '')}</td></tr>`;
    root.querySelector('#u-count').textContent = L(`${list.length} مستخدم`, `${list.length} users`);
  }

  function form(u) {
    const isNew = !u;
    u = u || { name: { ar: '', en: '' }, email: '', role: 'employee', status: 'active' };
    const m = ui.modal({
      title: isNew ? L('إضافة مستخدم', 'Add user') : L('تعديل المستخدم', 'Edit user'), icon: isNew ? 'userPlus' : 'edit',
      body: `<form class="form-grid" id="u-form" novalidate>
        <label class="field"><span>${L('الاسم بالعربية', 'Name (Arabic)')}</span><input class="input" name="ar" value="${esc(u.name.ar)}" maxlength="60"><small class="err-text"></small></label>
        <label class="field"><span>${L('الاسم بالإنجليزية', 'Name (English)')}</span><input class="input" name="en" value="${esc(u.name.en)}" maxlength="60" dir="ltr"></label>
        <label class="field full"><span>${L('البريد الإلكتروني التجريبي', 'Demo email')}</span><input class="input" name="email" type="email" value="${esc(u.email)}" dir="ltr" placeholder="name@example.com"><small class="err-text"></small></label>
        <label class="field"><span>${L('الدور الوظيفي', 'Role')}</span><select class="select" name="role">${Object.keys(AA.ROLES).map(r => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${esc(AA.roleName(r))}</option>`).join('')}</select></label>
        <label class="field"><span>${L('حالة الحساب', 'Status')}</span><select class="select" name="status">${Object.keys(AA.STATUS).map(s => `<option value="${s}" ${u.status === s ? 'selected' : ''}>${esc(AA.statusName(s))}</option>`).join('')}</select></label>
        <div class="notice full" style="font-size:12.5px">${icon('info')}<div>${L('استخدم بريدًا تجريبيًا فقط (مثل @example.com). لا تُرسل أي رسائل، والبيانات تبقى في متصفحك.', 'Use demo emails only (e.g. @example.com). No emails are sent; data stays in your browser.')}</div></div>
      </form>`,
      foot: `<button class="btn ghost" data-close>${L('إلغاء', 'Cancel')}</button><button class="btn primary" id="u-save">${icon('check')} ${isNew ? L('إضافة', 'Add') : L('حفظ', 'Save')}</button>`
    });
    const f = m.el.querySelector('#u-form');
    const err = (inp, msg) => { inp.classList.add('invalid'); const e = inp.parentElement.querySelector('.err-text'); if (e) e.textContent = msg; };
    const save = () => {
      f.querySelectorAll('.invalid').forEach(x => x.classList.remove('invalid'));
      f.querySelectorAll('.err-text').forEach(x => { x.textContent = ''; });
      const ar = f.ar.value.trim(), en = f.en.value.trim(), email = f.email.value.trim().toLowerCase();
      let bad = false;
      if (!ar && !en) { err(f.ar, L('أدخل الاسم بإحدى اللغتين على الأقل.', 'Enter a name in at least one language.')); bad = true; }
      if (!EMAIL.test(email)) { err(f.email, L('صيغة البريد غير صحيحة.', 'Invalid email format.')); bad = true; }
      else if (AA.users().some(x => x.email === email && x.id !== u.id)) { err(f.email, L('هذا البريد مستخدم لحساب آخر.', 'This email is already used.')); bad = true; }
      if (!isNew && u.id === AA.me().id && (f.role.value !== 'admin' || f.status.value !== 'active') && u.role === 'admin' && AA.users().filter(x => x.role === 'admin' && x.status === 'active').length === 1) {
        AA.toast('error', L('لا يمكن الحفظ', 'Cannot save'), L('يجب أن يبقى مدير نظام نشط واحد على الأقل.', 'At least one active admin must remain.')); return;
      }
      if (bad) return AA.toast('error', L('تحقق من البيانات', 'Check the form'), L('بعض الحقول تحتاج تصحيحًا.', 'Some fields need fixing.'));
      const data = { name: { ar: ar || en, en: en || ar }, email, role: f.role.value, status: f.status.value };
      if (isNew) {
        const nu = Object.assign({ id: AA.uid('u'), joined: new Date().toISOString() }, data);
        AA.store.state.users.push(nu);
        AA.log('user', { detail: 'created', target: nu.name.ar + ' | ' + nu.name.en });
        AA.toast('success', L('تمت إضافة المستخدم', 'User added'), AA.userName(nu.id));
      } else {
        Object.assign(u, data);
        AA.log('user', { detail: 'updated', target: u.name.ar + ' | ' + u.name.en });
        AA.toast('success', L('تم تحديث بيانات المستخدم', 'User updated'), AA.userName(u.id));
      }
      AA.store.save();
      m.close();
      AA.refresh();
    };
    f.addEventListener('input', e => { if (e.target.classList.contains('invalid')) { e.target.classList.remove('invalid'); const er = e.target.parentElement.querySelector('.err-text'); if (er) er.textContent = ''; } });
    m.el.querySelector('#u-save').addEventListener('click', save);
    f.addEventListener('submit', e => { e.preventDefault(); save(); });
  }

  const lastAdmin = u => u.role === 'admin' && AA.users().filter(x => x.role === 'admin' && x.status === 'active' && x.id !== u.id).length === 0;

  AA.pages.users = {
    title: () => L('المستخدمون', 'Users'),
    render() {
      const users = AA.users();
      const cnt = f => users.filter(f).length;
      const kpi = (ic, a, b, n, lbl) => `<div class="kpi glass"><span class="stat-ic" style="--a:${a};--b:${b}">${icon(ic)}</span><div><b data-count="${n}">0</b><small>${lbl}</small></div></div>`;
      return `
      <div class="page-head">
        <div><span class="eyebrow">${L('الحوكمة', 'Governance')}</span><h1>${L('المستخدمون والصلاحيات', 'Users & permissions')}</h1>
          <p>${L('إدارة حسابات الفريق وأدوارهم. جرّب أي دور من قائمة الحساب أعلى الصفحة لترى كيف تتغير الصلاحيات في كل الصفحات.', 'Manage team accounts and roles. Try any role from the account menu at the top to see permissions change across pages.')}</p></div>
        <div class="actions"><button class="btn primary" id="add-user">${icon('userPlus')} ${L('إضافة مستخدم', 'Add user')}</button></div>
      </div>
      <section class="kpis">
        ${kpi('users', '#a78bfa', '#6366f1', users.length, L('إجمالي المستخدمين', 'Total users'))}
        ${kpi('check', '#34d399', '#059669', cnt(u => u.status === 'active'), L('حسابات نشطة', 'Active accounts'))}
        ${kpi('shieldCheck', '#f472b6', '#9333ea', cnt(u => u.role === 'admin'), L('مديرو النظام', 'Admins'))}
        ${kpi('clock', '#fbbf24', '#d97706', cnt(u => u.status === 'pending'), L('بانتظار التفعيل', 'Pending'))}
      </section>
      <section class="roles">${Object.entries(AA.ROLES).map(([id, r]) => `
        <article class="role-card glass spot">
          <div class="rc-top"><span class="stat-ic" style="--a:${r.a};--b:${r.b}">${icon(r.icon)}</span><div><h3>${esc(r[AA.lang])}</h3></div><span class="role-count">${cnt(u => u.role === id)} ${L('مستخدم', 'users')}</span></div>
          <p>${esc(r.desc[AA.lang === 'ar' ? 0 : 1])}</p>
          <ul>${AA.PERMS.map(p => `<li class="${p.roles.includes(id) ? '' : 'no'}">${icon(p.roles.includes(id) ? 'check' : 'x')}${esc(p[AA.lang])}</li>`).join('')}</ul>
        </article>`).join('')}
      </section>
      <article class="glass">
        <div class="card" style="padding-bottom:6px"><div class="card-head" style="margin-bottom:6px"><span class="card-title-ic">${icon('shield')}</span><div><h3>${L('مصفوفة الصلاحيات', 'Permission matrix')}</h3><div class="sub">${L('ما يستطيع كل دور فعله داخل المنصة', 'What each role can do in the platform')}</div></div></div></div>
        <div class="table-wrap"><table class="table matrix"><thead><tr><th>${L('الصلاحية', 'Permission')}</th>${Object.keys(AA.ROLES).map(r => `<th>${esc(AA.roleName(r))}</th>`).join('')}</tr></thead>
        <tbody>${AA.PERMS.map(p => `<tr><td>${esc(p[AA.lang])}</td>${Object.keys(AA.ROLES).map(r => `<td>${p.roles.includes(r) ? `<span class="yes" aria-label="${L('مسموح', 'Allowed')}">${icon('check')}</span>` : `<span class="no-ic" aria-label="${L('غير مسموح', 'Not allowed')}">${icon('x')}</span>`}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      </article>
      <article class="glass">
        <div class="card" style="padding-bottom:10px"><div class="toolbar">
          <div class="input-ic">${icon('search')}<input class="input" id="u-q" type="search" value="${esc(st.q)}" placeholder="${L('ابحث بالاسم أو البريد…', 'Search name or email…')}" aria-label="${L('بحث المستخدمين', 'Search users')}"></div>
          <select class="select" id="u-role" aria-label="${L('الدور', 'Role')}"><option value="">${L('كل الأدوار', 'All roles')}</option>${Object.keys(AA.ROLES).map(r => `<option value="${r}" ${st.role === r ? 'selected' : ''}>${esc(AA.roleName(r))}</option>`).join('')}</select>
          <select class="select" id="u-status" aria-label="${L('الحالة', 'Status')}"><option value="">${L('كل الحالات', 'All statuses')}</option>${Object.keys(AA.STATUS).map(s => `<option value="${s}" ${st.status === s ? 'selected' : ''}>${esc(AA.statusName(s))}</option>`).join('')}</select>
          <span class="dim" id="u-count" style="font-size:13px"></span>
        </div></div>
        <div class="table-wrap"><table class="table cards"><thead><tr><th>${L('المستخدم', 'User')}</th><th>${L('الدور الوظيفي', 'Role')}</th><th>${L('تاريخ التسجيل', 'Joined')}</th><th>${L('حالة الحساب', 'Status')}</th><th><span class="sr-only">${L('إجراءات', 'Actions')}</span></th></tr></thead><tbody id="u-body"></tbody></table></div>
      </article>`;
    },
    mount(root) {
      drawTable(root);
      root.querySelector('#add-user').addEventListener('click', () => { if (AA.guard('users')) form(null); });
      root.querySelector('#u-q').addEventListener('input', AA.debounce(e => { st.q = e.target.value; drawTable(root); }, 150));
      root.querySelector('#u-role').addEventListener('change', e => { st.role = e.target.value; drawTable(root); });
      root.querySelector('#u-status').addEventListener('change', e => { st.status = e.target.value; drawTable(root); });
      root.querySelector('#u-body').addEventListener('click', async e => {
        const b = e.target.closest('[data-u]'); if (!b) return;
        const u = AA.user(b.dataset.id); if (!u || !AA.guard('users')) return;
        const me = AA.me();
        if (b.dataset.u === 'edit') return form(u);
        if (b.dataset.u === 'toggle') {
          if (u.id === me.id) return AA.toast('error', L('غير مسموح', 'Not allowed'), L('لا يمكنك إيقاف حسابك الحالي.', 'You can’t deactivate your own account.'));
          if (u.status === 'active' && lastAdmin(u)) return AA.toast('error', L('غير مسموح', 'Not allowed'), L('يجب أن يبقى مدير نظام نشط واحد على الأقل.', 'At least one active admin must remain.'));
          u.status = u.status === 'active' ? 'inactive' : 'active';
          AA.log('user', { detail: u.status === 'active' ? 'activated' : 'deactivated', target: u.name.ar + ' | ' + u.name.en });
          AA.store.save();
          AA.toast('success', u.status === 'active' ? L('تم تفعيل الحساب', 'Account activated') : L('تم إيقاف الحساب', 'Account deactivated'), AA.userName(u.id));
          return drawTable(root);
        }
        if (b.dataset.u === 'delete') {
          if (u.id === me.id) return AA.toast('error', L('غير مسموح', 'Not allowed'), L('لا يمكنك حذف حسابك الحالي.', 'You can’t delete your own account.'));
          if (lastAdmin(u)) return AA.toast('error', L('غير مسموح', 'Not allowed'), L('يجب أن يبقى مدير نظام نشط واحد على الأقل.', 'At least one active admin must remain.'));
          const ok = await ui.confirm({ danger: true, title: L('حذف المستخدم؟', 'Delete user?'), message: L(`سيُحذف حساب «${esc(AA.userName(u.id))}». تبقى ملفاته في الأرشيف.`, `“${esc(AA.userName(u.id))}” will be removed. Their files stay in the archive.`), ok: L('حذف', 'Delete') });
          if (!ok) return;
          const name = u.name.ar + ' | ' + u.name.en;
          AA.store.state.users = AA.users().filter(x => x.id !== u.id);
          AA.log('user', { detail: 'deleted', target: name });
          AA.store.save();
          AA.toast('success', L('تم حذف المستخدم', 'User deleted'), AA.lang === 'ar' ? u.name.ar : u.name.en);
          AA.refresh();
        }
      });
    }
  };
})(window.AA);
