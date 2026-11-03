// الوضع التجريبي: على github.io ما فيه خادم Java، فهذا الملف يقوم بدوره داخل المتصفح.
// نفس مسارات Server.java ونفس شكل ردودها، ونفس قواعد Rules.java، والبيانات من database/schema.sql.
// كل شي ينحفظ في localStorage على جهاز الزائر فقط.
(function(){
  if(!location.hostname.endsWith('github.io')) return; // على خادم Java يبقى كل شي زي ما هو

  const KEY = 'att_demo';
  const PIN_1234 = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'; // SHA-256 للرمز 1234
  const ACTIONS = ['IN', 'BREAK_START', 'BREAK_END', 'OUT', 'OT_START', 'OT_END'];

  const seed = () => ({
    departments: [{id:1, name:'تقنية المعلومات'}, {id:2, name:'الموارد البشرية'}, {id:3, name:'المالية'}],
    shifts: [
      {id:1, name:'الدوام الصباحي', start:'08:00', breakTime:'11:00', breakMinutes:30, end:'15:00'},
      {id:2, name:'الدوام المسائي', start:'14:00', breakTime:'17:00', breakMinutes:30, end:'21:00'}
    ],
    employees: [
      {id:'9000', name:'مدير النظام',   deptId:2, shiftId:1, role:'ADMIN', pinHash:PIN_1234, active:true},
      {id:'1001', name:'أحمد العتيبي',  deptId:1, shiftId:1, role:'EMP',   pinHash:PIN_1234, active:true},
      {id:'1002', name:'سارة القحطاني', deptId:1, shiftId:1, role:'EMP',   pinHash:PIN_1234, active:true},
      {id:'1003', name:'خالد الشمري',   deptId:3, shiftId:2, role:'EMP',   pinHash:PIN_1234, active:true}
    ],
    attendance: [], // {empId, date, action, time, device}
    sessions: {}    // token -> {empId, role}
  });

  function load(){
    try{ const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if(d && d.employees) return d; }catch(e){}
    return seed();
  }
  function save(db){ try{ localStorage.setItem(KEY, JSON.stringify(db)); }catch(e){} }

  async function sha256(s){
    const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(h), b => b.toString(16).padStart(2, '0')).join('');
  }

  const pad = n => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
  const nowTime = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
  const minutes = t => { const p = t.split(':'); return +p[0] * 60 + +p[1]; };
  const seconds = t => { const p = t.split(':'); return +p[0] * 3600 + +p[1] * 60 + +(p[2] || 0); };

  // ---------- Rules.java ----------
  function allowed(punches, now, s){
    const last = punches.length ? punches[punches.length - 1].action : null;
    if(last === null) return ['IN'];
    if(last === 'BREAK_START') return ['BREAK_END'];
    if(last === 'OT_START') return ['OT_END'];
    if(last === 'OUT' || last === 'OT_END') return [];
    const cur = minutes(now), brk = minutes(s.breakTime), end = minutes(s.end);
    const hadBreak = punches.some(p => p.action === 'BREAK_START');
    const a = [];
    if(cur >= brk && cur < end && !hadBreak) a.push('BREAK_START');
    if(cur >= end){ a.push('OUT'); a.push('OT_START'); }
    return a;
  }
  function status(d){
    if(d.in === null) return 'ABSENT';
    if(d.out !== null || d.otEnd !== null) return 'LEFT';
    if(d.otStart !== null) return 'OVERTIME';
    if(d.breakStart !== null && d.breakEnd === null) return 'BREAK';
    return 'PRESENT';
  }
  const LABEL = {ABSENT:'غائب', LEFT:'انصرف', OVERTIME:'عمل إضافي', BREAK:'في الاستراحة', PRESENT:'حاضر'};
  const span = (a, b) => a === null || b === null ? 0 : Math.floor((seconds(b) - seconds(a)) / 60);

  // ---------- مساعدات ----------
  class HttpError extends Error { constructor(code, msg){ super(msg); this.code = code; } }

  function auth(db, token, admin){
    const s = token ? db.sessions[token] : null;
    if(!s) throw new HttpError(401, 'انتهت الجلسة، سجّل الدخول من جديد');
    if(admin && s.role !== 'ADMIN') throw new HttpError(403, 'هذه الصفحة للمدير فقط');
    return s;
  }
  const shiftOf = (db, empId) => {
    const e = db.employees.find(x => x.id === empId);
    return db.shifts.find(x => x.id === (e && e.shiftId)) || db.shifts[0];
  };
  const punchesOf = (db, empId, date) => db.attendance
    .filter(a => a.empId === empId && a.date === date)
    .sort((a, b) => seconds(a.time) - seconds(b.time));
  const deptName = (db, id) => { const d = db.departments.find(x => x.id === id); return d ? d.name : null; };

  function statusJson(db, empId){
    const sh = shiftOf(db, empId), now = nowTime(), p = punchesOf(db, empId, today());
    return {
      serverTime: now, date: today(),
      shift: {name:sh.name, start:sh.start, breakTime:sh.breakTime, breakMinutes:sh.breakMinutes, end:sh.end},
      allowed: allowed(p, now, sh),
      punches: p.map(x => ({action:x.action, time:x.time}))
    };
  }

  function employeeRows(db){
    return db.employees.slice().sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map(e => ({
      empId:e.id, name:e.name, role:e.role, dept:deptName(db, e.deptId), shiftId:e.shiftId, active:e.active
    }));
  }

  // ---------- المسارات السبعة ----------
  const routes = {
    async '/api/login'(db, q, body){
      if(!body) throw new HttpError(405, 'الطريقة غير مسموحة');
      const hash = await sha256(String(body.pin ?? ''));
      const e = db.employees.find(x => x.id === body.empId && x.pinHash === hash && x.active);
      if(!e) throw new HttpError(401, 'الرقم الوظيفي أو الرمز السري غير صحيح');
      const token = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
      db.sessions[token] = {empId:e.id, role:e.role};
      return {token, empId:e.id, name:e.name, role:e.role, dept:deptName(db, e.deptId)};
    },

    '/api/logout'(db, q, body, token){
      if(token) delete db.sessions[token];
      return {};
    },

    '/api/status'(db, q, body, token){
      return statusJson(db, auth(db, token, false).empId);
    },

    '/api/punch'(db, q, body, token){
      if(!body) throw new HttpError(405, 'الطريقة غير مسموحة');
      const s = auth(db, token, false);
      const action = body.action || '';
      if(!ACTIONS.includes(action)) throw new HttpError(400, 'إجراء غير معروف');
      const now = nowTime(), date = today();
      if(!allowed(punchesOf(db, s.empId, date), now, shiftOf(db, s.empId)).includes(action))
        throw new HttpError(409, 'هذا الإجراء غير متاح في الوقت الحالي');
      const device = String(body.device || 'WEB').slice(0, 20);
      db.attendance.push({empId:s.empId, date, action, time:now, device});
      return statusJson(db, s.empId);
    },

    '/api/admin/summary'(db, q, body, token){
      auth(db, token, true);
      const date = q.get('date') || today();
      const rows = db.employees.filter(e => e.active && e.role === 'EMP')
        .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
        .map(e => {
          const sh = db.shifts.find(x => x.id === e.shiftId);
          const p = punchesOf(db, e.id, date), t = a => { const x = p.find(y => y.action === a); return x ? x.time : null; };
          const d = {in:t('IN'), breakStart:t('BREAK_START'), breakEnd:t('BREAK_END'), out:t('OUT'), otStart:t('OT_START'), otEnd:t('OT_END')};
          const start = sh ? sh.start : '08:00', end = sh ? sh.end : '08:00', st = status(d);
          return {
            empId:e.id, name:e.name, dept:deptName(db, e.deptId), shift:start + ' - ' + end,
            in:d.in, breakStart:d.breakStart, breakEnd:d.breakEnd, out:d.otEnd !== null ? d.otEnd : d.out,
            status:st, statusLabel:LABEL[st],
            late: d.in === null ? 0 : Math.max(0, minutes(d.in) - minutes(start)),
            breakMin: span(d.breakStart, d.breakEnd), overtime: span(d.otStart, d.otEnd)
          };
        });
      return {date, rows};
    },

    '/api/admin/employees'(db, q, body, token){
      auth(db, token, true);
      if(body){
        const id = String(body.empId || '').trim(), name = String(body.name || '').trim(), pin = String(body.pin || '');
        if(!id || !name || pin.length < 4) throw new HttpError(400, 'أكمل البيانات (الرمز السري 4 أرقام على الأقل)');
        if(db.employees.some(e => e.id === id)) throw new HttpError(409, 'البيانات مسجلة مسبقاً');
        return sha256(pin).then(pinHash => {
          db.employees.push({id, name, deptId:parseInt(body.deptId || '1', 10), shiftId:parseInt(body.shiftId || '1', 10),
            role: body.role === 'ADMIN' ? 'ADMIN' : 'EMP', pinHash, active:true});
          return {rows: employeeRows(db)};
        });
      }
      return {rows: employeeRows(db)};
    },

    '/api/admin/lookups'(db, q, body, token){
      auth(db, token, true);
      return {
        departments: db.departments.map(d => ({id:d.id, name:d.name})),
        shifts: db.shifts.map(s => ({id:s.id, name:`${s.name} (${s.start} - ${s.end})`}))
      };
    }
  };

  // يرجع {status, data} بنفس رموز الخادم
  window.demoApi = async function(path, body, token){
    const url = new URL(path, location.href), route = routes[url.pathname];
    if(!route) return {status:404, data:{error:'404'}};
    const db = load();
    try{
      const data = await route(db, url.searchParams, body, token);
      save(db);
      return {status:200, data};
    }catch(e){
      if(e instanceof HttpError) return {status:e.code, data:{error:e.message}};
      return {status:500, data:{error:'خطأ في الخادم أو قاعدة البيانات'}};
    }
  };

  // سطر التجربة تحت نموذج الدخول
  const note = document.getElementById('demoNote');
  if(note) note.hidden = false;
})();
