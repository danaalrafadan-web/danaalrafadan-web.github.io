/* ARCHIVE AI — محرك البحث والتحليل المحلي
   كل شيء هنا خوارزميات نصية بسيطة تعمل داخل المتصفح:
   توحيد الحروف العربية، تجذيع خفيف، ترتيب بالأوزان، تلخيص استخلاصي.
   لا يوجد نموذج ذكاء اصطناعي حقيقي، والواجهة توضح ذلك للمستخدم. */
(function (AA) {
  'use strict';

  const DIAC = /[ً-ٰٟـ]/g;
  const norm = AA.norm = s => String(s || '').toLowerCase()
    .replace(DIAC, '')
    .replace(/[إأآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');

  const STOP = new Set([
    'من', 'الى', 'إلى', 'على', 'في', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'الذين', 'ان', 'أن', 'إن', 'او', 'أو', 'ام', 'ثم', 'كما', 'كان', 'كانت', 'يكون', 'تكون', 'قد', 'لقد', 'لا', 'لم', 'لن', 'ما', 'ماذا', 'متى', 'اين', 'كيف', 'هل', 'كل', 'بعض', 'غير', 'بين', 'حتى', 'عند', 'عندما', 'بعد', 'قبل', 'حول', 'خلال', 'ضمن', 'لدى', 'منذ', 'اذا', 'إذا', 'اي', 'أي', 'هو', 'هي', 'هم', 'نحن', 'انا', 'أنا', 'انت', 'وقد', 'وفي', 'ومن', 'كذلك', 'ايضا', 'أيضا', 'جدا', 'فقط', 'ذات', 'اما', 'أما', 'وهو', 'وهي', 'له', 'لها', 'لهم', 'به', 'بها', 'فيه', 'فيها', 'عليه', 'منها', 'منه', 'عنها', 'يتم', 'تم', 'يمكن', 'عبر', 'مثل', 'اخرى', 'أخرى', 'إذ', 'اذ', 'بدل', 'ومع', 'لذلك', 'تبقى', 'يعد', 'تعد', 'الا', 'إلا', 'وال', 'بل', 'لكن', 'وقت',
    'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'by', 'at', 'from', 'as', 'that', 'this', 'these', 'those', 'it', 'its', 'into', 'about', 'what', 'which', 'who', 'how', 'than', 'then', 'there', 'their', 'they', 'them', 'has', 'have', 'had', 'not', 'but', 'can', 'will', 'more', 'most', 'also', 'each', 'per', 'any', 'all', 'our', 'we', 'you', 'your', 'when', 'only', 'now', 'many', 'much', 'over', 'such', 'so', 'do', 'does'
  ].map(norm));

  // كلمات السؤال في المحادثة لا تفيد في المطابقة
  const ASK = new Set(['ابحث', 'اعرض', 'اعطني', 'عطني', 'اريد', 'ابي', 'ابغى', 'وش', 'ايش', 'يوجد', 'توجد', 'هناك', 'ملفات', 'ملف', 'مستند', 'مستندات', 'وثيقه', 'وثائق', 'لخص', 'ملخص', 'اذكر', 'كم', 'عدد', 'احدث', 'اخر', 'جديد', 'لدينا', 'عندنا', 'الموجوده', 'عن', 'بخصوص', 'show', 'find', 'list', 'give', 'me', 'please', 'documents', 'document', 'files', 'file', 'latest', 'recent', 'newest', 'summarize', 'summarise', 'summary', 'count', 'number', 'tell', 'related', 'regarding', 'any', 'do', 'we', 'i'].map(norm));

  // تجذيع خفيف: يحذف أشهر السوابق واللواحق ويحافظ على ثلاثة أحرف على الأقل
  const stem = AA.stem = w => {
    if (/[a-z]/.test(w)) {
      if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
      if (w.length > 4 && w.endsWith('ing')) return w.slice(0, -3);
      if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
      return w;
    }
    for (const p of ['وال', 'بال', 'كال', 'فال', 'لل', 'ال']) if (w.startsWith(p) && w.length - p.length >= 3) { w = w.slice(p.length); break; }
    for (const s of ['ات', 'ون', 'ين', 'يه', 'ه', 'ي']) if (w.endsWith(s) && w.length - s.length >= 3) { w = w.slice(0, -s.length); break; }
    return w;
  };

  const WORD = /[\p{L}\p{N}]+/gu;
  const words = s => norm(s).match(WORD) || [];
  const terms = (s, extraStop) => {
    const out = [];
    for (const w of words(s)) {
      if (w.length < 2 || STOP.has(w) || (extraStop && extraStop.has(w))) continue;
      const t = stem(w);
      if (!out.includes(t)) out.push(t);
    }
    return out;
  };
  AA.terms = terms;

  // قاموس مرادفات عربي-إنجليزي صغير يوسّع البحث بين اللغتين
  const PAIRS = [['تقرير', 'report'], ['تسويق', 'marketing'], ['حمله', 'campaign'], ['ذكاء', 'intelligence'], ['اصطناعي', 'artificial'], ['بودكاست', 'podcast'], ['ميزانيه', 'budget'], ['فيديو', 'video'], ['بيانات', 'data'], ['جمهور', 'audience'], ['اخبار', 'news'], ['خبر', 'news'], ['موظفين', 'employee'], ['تدريب', 'training'], ['عقد', 'contract'], ['اتفاقيه', 'agreement'], ['سياسه', 'policy'], ['دراسه', 'research'], ['استطلاع', 'survey'], ['محتوى', 'content'], ['رقمي', 'digital'], ['ايرادات', 'revenue'], ['خصوصيه', 'privacy'], ['هويه', 'identity'], ['نشره', 'newsletter'], ['رعايه', 'sponsorship'], ['سحابه', 'cloud'], ['ارشيف', 'archive'], ['تحقق', 'verification'], ['اعلام', 'media'], ['تفاعل', 'engagement'], ['تكاليف', 'cost'], ['ترخيص', 'licensing'], ['عاجل', 'breaking'], ['اسلوب', 'style'], ['اداء', 'performance'], ['تحليل', 'analytics']];
  const SYN = {};
  PAIRS.forEach(([a, b]) => {
    const x = stem(norm(a)), y = stem(norm(b));
    (SYN[x] = SYN[x] || []).push(y);
    (SYN[y] = SYN[y] || []).push(x);
  });

  const catTerms = {};
  const catOf = id => catTerms[id] || (catTerms[id] = (() => { const c = AA.cat(id); return terms(c.ar + ' ' + c.en); })());

  // نقاط التطابق: تطابق كامل أعلى من تطابق البادئة
  const hit = (list, t) => {
    let exact = 0, pre = 0;
    for (const w of list) { if (w === t) exact++; else if (t.length >= 3 && (w.startsWith(t) || (w.length >= 4 && t.startsWith(w)))) pre++; }
    return { exact, pre };
  };

  function indexDoc(d) {
    return {
      title: terms(d.title),
      kw: terms(d.keywords.join(' ')),
      cat: catOf(d.cat),
      sum: terms(d.summary + ' ' + (d.desc || '')),
      body: d.content ? terms(d.content.slice(0, 12000)) : [],
      ntitle: norm(d.title),
      nsum: norm(d.summary)
    };
  }

  function scoreDoc(ix, qTerms, phrase) {
    let score = 0;
    const matched = [];
    for (const { t, w, o } of qTerms) {
      let s = 0;
      const a = hit(ix.title, t); s += a.exact * 6 + a.pre * 4;
      const b = hit(ix.kw, t); s += b.exact * 5 + b.pre * 3;
      const c = hit(ix.cat, t); s += c.exact * 4 + c.pre * 2;
      const d = hit(ix.sum, t); s += Math.min(d.exact * 2 + d.pre, 5);
      if (ix.body.length) { const e = hit(ix.body, t); s += Math.min(e.exact + e.pre * .5, 3); }
      // المرادف يغطي الكلمة الأصلية التي جاء منها
      if (s > 0) { score += s * w; const k = o || t; if (!matched.includes(k)) matched.push(k); }
    }
    if (phrase && phrase.length > 3) {
      if (ix.ntitle.includes(phrase)) score += 8;
      else if (ix.nsum.includes(phrase)) score += 3;
    }
    const primary = qTerms.filter(q => q.w === 1).length;
    if (primary) score += 5 * (matched.length / primary);
    return { score: matched.length ? score : 0, matched };
  }

  /* filters: { cat, type, lang, date (أيام), fav } — يرجع النتائج مرتبة مع نسبة ارتباط نسبية */
  function run(query, filters, docs) {
    const t0 = performance.now();
    filters = filters || {};
    docs = docs || AA.docs();
    const base = terms(query, filters.ask ? ASK : null);
    const expanded = [];
    const qTerms = base.map(t => ({ t, w: 1 }));
    base.forEach(t => (SYN[t] || []).forEach(s => { if (!base.includes(s) && !expanded.includes(s)) { expanded.push(s); qTerms.push({ t: s, w: .6, o: t }); } }));
    const cutoff = filters.date ? Date.now() - Number(filters.date) * 86400000 : 0;

    const pool = docs.filter(d =>
      (!filters.cat || d.cat === filters.cat) &&
      (!filters.type || d.type === filters.type) &&
      (!filters.lang || d.lang === filters.lang) &&
      (!filters.fav || d.fav) &&
      (!cutoff || new Date(d.date).getTime() >= cutoff));

    let results;
    if (!base.length) {
      results = pool.map(doc => ({ doc, score: 0, pct: 0, matched: [] }));
    } else {
      const phrase = norm(query).trim();
      results = pool.map(doc => Object.assign({ doc }, scoreDoc(indexDoc(doc), qTerms, phrase))).filter(r => r.score > 0);
      results.sort((a, b) => b.score - a.score);
      const top = results.length ? results[0].score : 1;
      // النسبة مقارنة بأقوى نتيجة، مضروبة في نسبة الكلمات التي تطابقت فيها
      results.forEach(r => { r.pct = Math.max(8, Math.round(100 * (r.score / top) * (.55 + .45 * r.matched.length / base.length))); });
    }
    return { results, terms: base, expanded, ms: performance.now() - t0 };
  }
  AA.search = { run };

  // تمييز الكلمات المطابقة مع تحمّل اختلاف الهمزات والتاء المربوطة والتشكيل
  const VAR = { 'ا': '[اأإآٱ]', 'ه': '[هة]', 'ي': '[يىئ]', 'و': '[وؤ]' };
  const termRe = t => t.split('').map(c => (VAR[c] || c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) + '[\\u064B-\\u065F\\u0640]*').join('');
  AA.highlight = (text, ts) => {
    const safe = AA.esc(text);
    const list = (ts || []).filter(t => t.length >= 2);
    if (!list.length) return safe;
    const re = new RegExp('(' + list.sort((a, b) => b.length - a.length).map(termRe).join('|') + ')', 'gi');
    return safe.split(/(&[#a-z0-9]+;)/i).map(p => (p.startsWith('&') && p.endsWith(';') ? p : p.replace(re, '<mark>$1</mark>'))).join('');
  };
  AA.isHit = (text, ts) => { const tt = terms(text); return (ts || []).some(t => tt.some(w => w === t || (t.length >= 3 && w.startsWith(t)))); };

  /* ---------- التحليل والتلخيص ---------- */
  AA.detectLang = text => {
    const ar = (text.match(/[؀-ۿ]/g) || []).length;
    const la = (text.match(/[A-Za-z]/g) || []).length;
    return ar >= la ? 'ar' : 'en';
  };

  function keywordFreq(text) {
    const freq = {}, surface = {};
    const raw = String(text).match(WORD) || [];
    let prev = null;
    const bi = {};
    for (const r of raw) {
      const n = norm(r);
      if (n.length < 3 || STOP.has(n) || /^\d+$/.test(n)) { prev = null; continue; }
      const s = stem(n);
      freq[s] = (freq[s] || 0) + 1;
      const sf = surface[s] || (surface[s] = {});
      const low = r.toLowerCase();
      sf[low] = (sf[low] || 0) + 1;
      if (prev) { const k = prev.s + ' ' + s; bi[k] = bi[k] || { n: 0, txt: prev.r + ' ' + low }; bi[k].n++; }
      prev = { s, r: low };
    }
    const best = s => Object.entries(surface[s]).sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0];
    return { freq, best, bi };
  }

  AA.extractKeywords = (text, n) => {
    const { freq, best, bi } = keywordFreq(text);
    const list = Object.entries(freq).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).map(([s, c]) => ({ word: best(s), count: c, stem: s }));
    const pairs = Object.values(bi).filter(b => b.n >= 2).sort((a, b) => b.n - a.n).slice(0, 2).map(b => ({ word: b.txt, count: b.n, stem: b.txt }));
    return pairs.concat(list).slice(0, n || 8);
  };

  AA.classify = text => {
    const { freq } = keywordFreq(text);
    const keys = Object.keys(freq);
    const scores = AA.CATS.filter(c => c.kw.length).map(c => {
      let s = 0;
      c.kw.forEach(k => { const t = stem(norm(k)); keys.forEach(w => { if (w === t || (t.length >= 3 && w.startsWith(t))) s += freq[w]; }); });
      return { id: c.id, score: s };
    }).sort((a, b) => b.score - a.score);
    const total = scores.reduce((a, b) => a + b.score, 0);
    if (!total) return { id: 'other', confidence: 0, scores };
    return { id: scores[0].id, confidence: Math.round(100 * scores[0].score / total), scores };
  };

  AA.summarize = (text, n) => {
    const sentences = String(text).replace(/\s+/g, ' ').split(/(?<=[.!?؟。])\s+|\n+/).map(s => s.trim()).filter(s => s.length > 15);
    if (sentences.length <= (n || 3)) return sentences.join(' ') || String(text).trim().slice(0, 400);
    const { freq } = keywordFreq(text);
    const max = Math.max(...Object.values(freq), 1);
    const scored = sentences.map((s, i) => {
      const ts = terms(s);
      const sum = ts.reduce((a, t) => a + (freq[t] || 0) / max, 0);
      return { s, i, score: sum / Math.sqrt(ts.length + 1) + (i === 0 ? .35 : 0) };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, n || 3).sort((a, b) => a.i - b.i).map(x => x.s).join(' ');
  };

  AA.analyze = text => {
    const clean = String(text || '').trim();
    const wordsCount = (clean.match(WORD) || []).length;
    const sentences = clean.split(/(?<=[.!?؟])\s+|\n+/).filter(s => s.trim().length > 3).length;
    const keywords = AA.extractKeywords(clean, 8);
    const cls = AA.classify(clean);
    return {
      lang: AA.detectLang(clean),
      words: wordsCount,
      sentences,
      minutes: Math.max(1, Math.round(wordsCount / 200)),
      keywords,
      cat: cls.id,
      confidence: cls.confidence,
      scores: cls.scores,
      summary: AA.summarize(clean, 3),
      topic: keywords.slice(0, 3).map(k => k.word)
    };
  };

  /* ---------- استخراج النص من الملفات المرفوعة ---------- */
  const LIB = {
    zip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    pdfWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  };
  const decode = s => { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; };
  const xmlText = (xml, para) => decode(xml.replace(para, '\n').replace(/<w:tab\/>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/\n\s*/g, '\n').trim();

  AA.extractText = async (buf, type) => {
    if (type === 'pdf') {
      await AA.loadScript(LIB.pdf);
      const lib = window.pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc = LIB.pdfWorker;
      const pdf = await lib.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
      const out = [];
      for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
        const page = await pdf.getPage(i);
        const c = await page.getTextContent();
        out.push(c.items.map(it => it.str).join(' '));
      }
      return out.join('\n').replace(/[ \t]+/g, ' ').trim();
    }
    await AA.loadScript(LIB.zip);
    const zip = await window.JSZip.loadAsync(buf);
    if (type === 'docx') {
      const f = zip.file('word/document.xml');
      return f ? xmlText(await f.async('string'), /<\/w:p>/g) : '';
    }
    if (type === 'pptx') {
      const slides = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));
      const out = [];
      for (const s of slides) out.push(xmlText(await zip.file(s).async('string'), /<\/a:p>/g));
      return out.join('\n');
    }
    if (type === 'xlsx') {
      const f = zip.file('xl/sharedStrings.xml');
      const wb = zip.file('xl/workbook.xml');
      const names = wb ? ((await wb.async('string')).match(/name="([^"]+)"/g) || []).map(m => decode(m.slice(6, -1))) : [];
      const strings = f ? ((await f.async('string')).match(/<t[^>]*>[^<]*<\/t>/g) || []).map(t => decode(t.replace(/<[^>]+>/g, ''))) : [];
      return names.concat(strings).join('\n');
    }
    return '';
  };
})(window.AA);
