/* ARCHIVE AI — إدارة وأرشفة الملفات (رفع فعلي، تصنيف، تعديل، حذف، تنزيل) */
(function (AA) {
  'use strict';
  const { L, esc, icon, ui } = AA;

  const st = { q: '', cat: '', type: '', sort: 'date-desc', view: AA.pref.get('aa.fview') === 'grid' ? 'grid' : 'table', uploadCat: 'auto', limit: 12 };
  const MAX = 25 * 1024 * 1024;
  const EXT = ['pdf', 'docx', 'xlsx', 'pptx'];

  function list() {
    const q = AA.norm(st.q.trim());
    const out = AA.docs().filter(d =>
      (!st.cat || d.cat === st.cat) && (!st.type || d.type === st.type) &&
      (!q || AA.norm(d.title + ' ' + (d.fileName || '') + ' ' + d.keywords.join(' ') + ' ' + (d.desc || '')).includes(q)));
    const [k, dir] = st.sort.split('-');
    const f = { date: d => new Date(d.date).getTime(), name: d => d.title, size: d => d.size }[k];
    out.sort((a, b) => { const x = f(a), y = f(b); const r = typeof x === 'string' ? x.localeCompare(y, AA.lang) : x - y; return dir === 'desc' ? -r : r; });
    return out;
  }

  const actions = d => `<div class="t-actions">
    <button class="mini-btn ${d.fav ? 'on' : ''}" data-act="fav" data-id="${d.id}" aria-label="${L('المفضلة', 'Favourite')}" title="${L('المفضلة', 'Favourite')}">${icon('star', d.fav ? 'fill' : '')}</button>
    <button class="mini-btn" data-act="doc-download" data-id="${d.id}" aria-label="${L('تنزيل', 'Download')}" title="${L('تنزيل', 'Download')}">${icon('download')}</button>
    <button class="mini-btn" data-act="doc-edit" data-id="${d.id}" aria-label="${L('تعديل', 'Edit')}" title="${L('تعديل', 'Edit')}">${icon('edit')}</button>
    <button class="mini-btn danger" data-act="doc-delete" data-id="${d.id}" aria-label="${L('حذف', 'Delete')}" title="${L('حذف', 'Delete')}">${icon('trash')}</button>
  </div>`;

  function drawList(root) {
    const all = list();
    const rows = all.slice(0, st.limit);
    const box = root.querySelector('#files-list');
    root.querySelector('#f-count').textContent = L(`${AA.fmtNum(all.length)} ملف`, `${AA.fmtNum(all.length)} files`);
    if (!all.length) {
      box.innerHTML = `<div class="glass">${ui.empty('folder', L('لا توجد ملفات مطابقة', 'No matching files'), L('غيّر الفلاتر أو ارفع ملفات جديدة.', 'Change the filters or upload new files.'))}</div>`;
      return;
    }
    if (st.view === 'grid') {
      box.innerHTML = `<div class="file-grid">${rows.map(d => `
        <article class="f-card glass spot" data-act="doc-open" data-id="${d.id}" tabindex="0" role="button">
          <div class="top">${ui.ftype(d.type)}${actions(d)}</div>
          <h4>${esc(d.title)}${ui.isNew(d) ? `<span class="new-tag">${L('جديد', 'NEW')}</span>` : ''}</h4>
          <p>${esc(d.desc || d.summary)}</p>
          <div class="foot">${ui.catChip(d.cat)}<span class="num">${AA.fmtSize(d.size)}</span></div>
        </article>`).join('')}</div>`;
    } else {
      box.innerHTML = `<div class="glass table-wrap"><table class="table cards">
        <thead><tr><th>${L('الملف', 'File')}</th><th>${L('النوع', 'Type')}</th><th>${L('التصنيف', 'Category')}</th><th>${L('الحجم', 'Size')}</th><th>${L('تاريخ الإضافة', 'Added')}</th><th>${L('أضافه', 'Added by')}</th><th><span class="sr-only">${L('إجراءات', 'Actions')}</span></th></tr></thead>
        <tbody>${rows.map(d => `<tr>
          <td class="main-cell"><div class="f-name" data-act="doc-open" data-id="${d.id}" tabindex="0" role="button">${ui.ftype(d.type, 'sm')}<span style="min-width:0"><b>${esc(d.title)}${ui.isNew(d) ? `<span class="new-tag">${L('جديد', 'NEW')}</span>` : ''}</b><small>${esc(d.desc || d.keywords.join(L('، ', ', ')))}</small></span></div></td>
          <td data-l="${L('النوع', 'Type')}"><span class="num">${AA.TYPES[d.type].label}</span></td>
          <td data-l="${L('التصنيف', 'Category')}">${ui.catChip(d.cat)}${d.autoCat ? ` <span class="dim" style="font-size:11px" title="${L('صُنّف تلقائيًا', 'Auto-classified')}">${icon('wand')}</span>` : ''}</td>
          <td data-l="${L('الحجم', 'Size')}"><span class="num">${AA.fmtSize(d.size)}</span></td>
          <td data-l="${L('تاريخ الإضافة', 'Added')}">${AA.fmtDate(d.date)}</td>
          <td data-l="${L('أضافه', 'Added by')}">${esc(AA.userName(d.author))}</td>
          <td>${actions(d)}</td></tr>`).join('')}</tbody></table></div>`;
    }
    if (all.length > rows.length) box.insertAdjacentHTML('beforeend', `<div class="more-wrap"><button class="btn" id="more">${L(`عرض المزيد (${all.length - rows.length})`, `Show more (${all.length - rows.length})`)}</button></div>`);
  }

  /* ---------- الرفع ---------- */
  const readBuf = (file, onProgress) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onprogress = e => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    r.onload = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.readAsArrayBuffer(file);
  });

  async function uploadOne(root, file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const q = document.createElement('div');
    q.className = 'q-item';
    q.innerHTML = `${ui.ftype(EXT.includes(ext) ? ext : 'pdf', 'sm')}<div style="min-width:0"><b>${esc(file.name)}</b><small><span class="num">${AA.fmtSize(file.size)}</span> · <span class="stage"></span></small><div class="q-bar"><i></i></div></div><span class="q-state"></span>`;
    root.querySelector('#queue').prepend(q);
    const bar = q.querySelector('.q-bar i'), stage = q.querySelector('.stage'), state = q.querySelector('.q-state');
    const set = (p, s) => { bar.style.width = Math.round(p * 100) + '%'; stage.textContent = s; state.textContent = Math.round(p * 100) + '%'; };
    const fail = msg => { q.classList.add('fail'); stage.textContent = msg; state.textContent = L('فشل', 'Failed'); AA.toast('error', L('تعذّر رفع الملف', 'Upload failed'), file.name + ' — ' + msg); };

    if (!EXT.includes(ext)) return fail(L('نوع غير مدعوم. المسموح: PDF وDOCX وXLSX وPPTX', 'Unsupported type. Allowed: PDF, DOCX, XLSX, PPTX'));
    if (file.size > MAX) return fail(L('الحجم أكبر من 25 ميجابايت', 'Larger than 25 MB'));
    if (!file.size) return fail(L('الملف فارغ', 'The file is empty'));

    try {
      set(0, L('قراءة الملف…', 'Reading file…'));
      const buf = await readBuf(file, p => set(p * .4, L('قراءة الملف…', 'Reading file…')));
      set(.45, L('استخراج النص…', 'Extracting text…'));
      let text = '', extractNote = '';
      try { text = (await AA.extractText(buf, ext)) || ''; }
      catch (e) { extractNote = e.message && e.message.startsWith('load failed') ? L('لم تُحمّل مكتبة الاستخراج (تحقق من الإنترنت)', 'Extraction library did not load (check connection)') : L('تعذّر قراءة نص الملف', 'Could not read the file text'); }
      text = text.replace(/\s+\n/g, '\n').trim();

      set(.75, L('التحليل والتصنيف…', 'Analysing & classifying…'));
      const base = file.name.replace(/\.[^.]+$/, '');
      const titleWords = base.replace(/[_\-.]+/g, ' ').trim();
      const a = AA.analyze(titleWords + '. ' + text);
      const auto = st.uploadCat === 'auto';
      const doc = {
        id: AA.uid('d'),
        title: titleWords || base,
        fileName: file.name,
        lang: text.length > 40 ? AA.detectLang(text) : AA.detectLang(titleWords),
        type: ext,
        cat: auto ? a.cat : st.uploadCat,
        autoCat: auto,
        confidence: auto ? a.confidence : null,
        size: file.size,
        date: new Date().toISOString(),
        author: AA.me().id,
        summary: text.length > 80 ? AA.summarize(text, 3) : L('لم يُستخرج نص كافٍ من هذا الملف لإنشاء ملخص. يمكنك كتابة ملخص ووصف من زر التعديل.', 'Not enough text could be extracted to build a summary. You can add one from Edit.'),
        desc: '',
        keywords: a.keywords.slice(0, 6).map(k => k.word),
        fav: false, views: 0, downloads: 0,
        uploaded: true,
        content: text.slice(0, 15000)
      };
      await AA.idb.put(doc.id, new Blob([buf], { type: AA.TYPES[ext].mime }));
      set(.95, L('الحفظ في الأرشيف…', 'Saving to archive…'));
      AA.store.state.docs.unshift(doc);
      AA.log('upload', { docId: doc.id, title: doc.title });
      AA.store.save();
      set(1, extractNote || (text ? L(`اكتمل · استُخرج ${AA.fmtNum(a.words)} كلمة`, `Done · ${AA.fmtNum(a.words)} words extracted`) : L('اكتمل دون نص قابل للاستخراج', 'Done, no extractable text')));
      q.classList.add('done');
      state.innerHTML = icon('check');
      AA.toast('success', L('تم رفع الملف وأرشفته', 'File uploaded & archived'),
        auto ? L(`صُنّف تلقائيًا ضمن «${AA.catName(doc.cat)}»${a.confidence ? ` بثقة ${a.confidence}%` : ''}.`, `Auto-classified as “${AA.catName(doc.cat)}”${a.confidence ? ` (${a.confidence}% confidence)` : ''}.`) : L(`أضيف إلى «${AA.catName(doc.cat)}».`, `Added to “${AA.catName(doc.cat)}”.`),
        { action: { label: L('مراجعة البيانات', 'Review details'), fn: () => AA.actions.edit(doc.id) } });
      if (extractNote) AA.toast('warning', L('رُفع الملف بدون استخراج نص', 'Uploaded without text extraction'), extractNote);
      return doc;
    } catch (e) {
      fail(L('خطأ أثناء الحفظ في المتصفح', 'Error while saving in the browser'));
    }
  }

  async function handle(root, files) {
    if (!AA.guard('upload')) return;
    files = Array.from(files || []);
    if (!files.length) return;
    let ok = 0;
    for (const f of files) if (await uploadOne(root, f)) ok++;
    if (ok) {
      st.sort = 'date-desc';
      root.querySelector('#f-sort').value = st.sort;
      drawList(root);
      AA.renderChrome();
    }
  }

  AA.pages.files = {
    title: () => L('إدارة الملفات', 'Files'),
    render(p) {
      if (p.cat) st.cat = p.cat;
      const canUp = AA.can('upload');
      return `
      <div class="page-head">
        <div><span class="eyebrow">${L('الأرشفة', 'Archiving')}</span><h1>${L('إدارة الملفات', 'File management')}</h1>
          <p>${L('ارفع ملفات PDF وWord وExcel وPowerPoint، وسيستخرج النظام نصها ويقترح التصنيف والكلمات المفتاحية والملخص تلقائيًا. يمكنك التعديل في أي وقت.', 'Upload PDF, Word, Excel and PowerPoint files. The system extracts their text and suggests a category, keywords and a summary. You can edit them any time.')}</p></div>
        <div class="actions">
          <button class="btn" id="export">${icon('table')} ${L('تصدير القائمة CSV', 'Export CSV')}</button>
          <button class="btn primary" id="pick">${icon('upload')} ${L('رفع ملفات', 'Upload files')}</button>
        </div>
      </div>

      <section class="dropzone glass ${canUp ? '' : 'locked'}" id="dz" aria-label="${L('منطقة رفع الملفات', 'Upload area')}">
        <div class="dz-ic">${icon(canUp ? 'upload' : 'lock')}</div>
        <div>
          <h3>${canUp ? L('اسحب الملفات وأفلتها هنا', 'Drag & drop files here') : L('الرفع غير متاح لدورك الحالي', 'Uploading isn’t available for your role')}</h3>
          <p>${canUp ? L('أو اختر من جهازك. الصيغ المدعومة: PDF، DOCX، XLSX، PPTX — حتى 25 ميجابايت للملف. الملفات تبقى داخل متصفحك فقط.', 'or choose from your device. Supported: PDF, DOCX, XLSX, PPTX — up to 25 MB each. Files stay in your browser only.') : L('دور «قراءة فقط» يسمح بالعرض والبحث والتنزيل. بدّل المستخدم من القائمة العلوية لتجربة الرفع.', 'The read-only role can view, search and download. Switch user from the top menu to try uploading.')}</p>
          <div class="chips" style="margin-top:12px">${EXT.map(e => ui.ftype(e, 'sm')).join('')}</div>
        </div>
        <div class="dz-side">
          <label class="field"><span>${L('التصنيف عند الرفع', 'Category on upload')}</span>
            <select class="select" id="up-cat" ${canUp ? '' : 'disabled'}><option value="auto">✦ ${L('تلقائي (حسب محتوى الملف)', 'Automatic (from content)')}</option>${AA.CATS.map(c => `<option value="${c.id}" ${st.uploadCat === c.id ? 'selected' : ''}>${esc(AA.lang === 'ar' ? c.ar : c.en)}</option>`).join('')}</select></label>
          <button class="btn primary" id="pick2">${icon('folder')} ${L('اختيار ملفات', 'Choose files')}</button>
        </div>
      </section>
      <div class="queue" id="queue"></div>

      <div class="toolbar">
        <div class="input-ic">${icon('search')}<input class="input" id="f-q" type="search" value="${esc(st.q)}" placeholder="${L('ابحث بالاسم أو الكلمة المفتاحية…', 'Filter by name or keyword…')}" aria-label="${L('تصفية الملفات', 'Filter files')}"></div>
        <select class="select" id="f-cat" aria-label="${L('التصنيف', 'Category')}"><option value="">${L('كل التصنيفات', 'All categories')}</option>${AA.CATS.map(c => `<option value="${c.id}" ${st.cat === c.id ? 'selected' : ''}>${esc(AA.lang === 'ar' ? c.ar : c.en)}</option>`).join('')}</select>
        <select class="select" id="f-type" aria-label="${L('النوع', 'Type')}"><option value="">${L('كل الأنواع', 'All types')}</option>${EXT.map(t => `<option value="${t}" ${st.type === t ? 'selected' : ''}>${AA.TYPES[t].label}</option>`).join('')}</select>
        <select class="select" id="f-sort" aria-label="${L('الترتيب', 'Sort')}">
          <option value="date-desc">${L('الأحدث أولًا', 'Newest first')}</option><option value="date-asc">${L('الأقدم أولًا', 'Oldest first')}</option>
          <option value="name-asc">${L('الاسم (أ-ي)', 'Name (A–Z)')}</option><option value="size-desc">${L('الأكبر حجمًا', 'Largest')}</option><option value="size-asc">${L('الأصغر حجمًا', 'Smallest')}</option>
        </select>
        <div class="seg" id="f-view"><button class="${st.view === 'table' ? 'on' : ''}" data-v="table" aria-label="${L('عرض جدول', 'Table view')}">${icon('list')}</button><button class="${st.view === 'grid' ? 'on' : ''}" data-v="grid" aria-label="${L('عرض بطاقات', 'Grid view')}">${icon('grid')}</button></div>
        <span class="dim" id="f-count" style="font-size:13px"></span>
      </div>
      <div id="files-list"></div>`;
    },
    mount(root, p) {
      const input = document.getElementById('file-input');
      const pick = () => { if (!AA.guard('upload')) return; input.value = ''; input.click(); };
      input.onchange = () => handle(root, input.files);
      root.querySelector('#pick').addEventListener('click', pick);
      root.querySelector('#pick2').addEventListener('click', pick);
      root.querySelector('#up-cat').value = st.uploadCat;
      root.querySelector('#up-cat').addEventListener('change', e => { st.uploadCat = e.target.value; });

      const dz = root.querySelector('#dz');
      let depth = 0;
      dz.addEventListener('dragenter', e => { e.preventDefault(); depth++; dz.classList.add('drag'); });
      dz.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
      dz.addEventListener('dragleave', () => { if (--depth <= 0) { depth = 0; dz.classList.remove('drag'); } });
      dz.addEventListener('drop', e => { e.preventDefault(); depth = 0; dz.classList.remove('drag'); handle(root, e.dataTransfer.files); });

      const redraw = () => { st.limit = 12; drawList(root); };
      root.querySelector('#f-q').addEventListener('input', AA.debounce(e => { st.q = e.target.value; redraw(); }, 150));
      root.querySelector('#f-cat').addEventListener('change', e => { st.cat = e.target.value; redraw(); });
      root.querySelector('#f-type').addEventListener('change', e => { st.type = e.target.value; redraw(); });
      root.querySelector('#f-sort').value = st.sort;
      root.querySelector('#f-sort').addEventListener('change', e => { st.sort = e.target.value; redraw(); });
      root.querySelector('#f-view').addEventListener('click', e => {
        const b = e.target.closest('button[data-v]'); if (!b) return;
        st.view = b.dataset.v; AA.pref.set('aa.fview', st.view);
        root.querySelectorAll('#f-view button').forEach(x => x.classList.toggle('on', x === b));
        drawList(root);
      });
      root.addEventListener('click', e => { if (e.target.closest('#more')) { st.limit += 12; drawList(root); } });
      root.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[role="button"][data-act]')) e.target.click(); });
      root.querySelector('#export').addEventListener('click', () => {
        const rows = list();
        ui.csv(`archive-ai-files-${AA.today()}.csv`, [[L('العنوان', 'Title'), L('النوع', 'Type'), L('التصنيف', 'Category'), L('اللغة', 'Language'), L('الحجم (KB)', 'Size (KB)'), L('تاريخ الإضافة', 'Added'), L('أضافه', 'Added by'), L('الكلمات المفتاحية', 'Keywords'), L('الملخص', 'Summary')]]
          .concat(rows.map(d => [d.title, d.type.toUpperCase(), AA.catName(d.cat), ui.langLabel(d.lang), Math.round(d.size / 1024), AA.fmtDate(d.date), AA.userName(d.author), d.keywords.join(' | '), d.summary])));
        AA.toast('success', L('تم تصدير القائمة', 'List exported'), L(`${rows.length} ملف في ملف CSV`, `${rows.length} files in a CSV file`));
      });
      drawList(root);
      if (p.upload === '1') { AA.setParams({}); setTimeout(pick, 300); }
    }
  };
})(window.AA);
