/* ARCHIVE AI — القواميس الثابتة والبيانات التجريبية
   كل المستندات والأسماء هنا خيالية ومكتوبة لأغراض العرض فقط،
   ولا تمثّل أي ملفات أو معلومات داخلية لأي جهة. */
(function (AA) {
  'use strict';

  // التصنيفات: الكلمات في kw تستخدمها خوارزمية التصنيف التلقائي (engine.js)
  AA.CATS = [
    { id: 'news', ar: 'أخبار', en: 'News', color: '#3b82f6', icon: 'newspaper', kw: ['خبر', 'اخبار', 'عاجل', 'تغطيه', 'مراسل', 'صحفي', 'تصريحات', 'news', 'breaking', 'coverage', 'reporter', 'press', 'headline'] },
    { id: 'reports', ar: 'تقارير', en: 'Reports', color: '#8b5cf6', icon: 'report', kw: ['تقرير', 'تقارير', 'ربعي', 'سنوي', 'اداء', 'قياس', 'مؤشرات', 'report', 'quarterly', 'annual', 'performance', 'metrics', 'kpi'] },
    { id: 'articles', ar: 'مقالات', en: 'Articles', color: '#22d3ee', icon: 'book', kw: ['مقال', 'راي', 'عمود', 'تحرير', 'كتابه', 'اسلوب', 'ورشه', 'article', 'opinion', 'column', 'editorial', 'essay', 'style', 'writing'] },
    { id: 'research', ar: 'دراسات وأبحاث', en: 'Research', color: '#6366f1', icon: 'target', kw: ['دراسه', 'بحث', 'استطلاع', 'عينه', 'تحليل', 'نتائج', 'research', 'study', 'survey', 'benchmark', 'evaluation', 'analysis', 'findings'] },
    { id: 'finance', ar: 'مالية', en: 'Finance', color: '#10b981', icon: 'chart', kw: ['ميزانيه', 'مالي', 'ايرادات', 'تكاليف', 'مصروفات', 'اسعار', 'budget', 'revenue', 'finance', 'cost', 'costs', 'pricing', 'expenses', 'financial'] },
    { id: 'marketing', ar: 'تسويق', en: 'Marketing', color: '#ec4899', icon: 'zap', kw: ['تسويق', 'حمله', 'جمهور', 'علامه', 'هويه', 'رعايه', 'اعلان', 'marketing', 'campaign', 'audience', 'brand', 'sponsorship', 'advertising', 'growth'] },
    { id: 'tech', ar: 'تقنية', en: 'Technology', color: '#0ea5e9', icon: 'database', kw: ['تقنيه', 'ذكاء', 'اصطناعي', 'بيانات', 'نظام', 'سحابه', 'رقمنه', 'منصه', 'tech', 'ai', 'artificial', 'data', 'cloud', 'platform', 'software', 'digital', 'nlp'] },
    { id: 'hr', ar: 'موارد بشرية', en: 'HR', color: '#f59e0b', icon: 'users', kw: ['موظف', 'موظفين', 'تدريب', 'توظيف', 'سياسه', 'عمل', 'تهيئه', 'hr', 'employee', 'training', 'hiring', 'onboarding', 'wellbeing', 'staff'] },
    { id: 'legal', ar: 'قانونية', en: 'Legal', color: '#f43f5e', icon: 'shield', kw: ['عقد', 'اتفاقيه', 'حقوق', 'ترخيص', 'خصوصيه', 'نظامي', 'التزامات', 'contract', 'agreement', 'license', 'licensing', 'rights', 'privacy', 'compliance', 'legal'] },
    { id: 'other', ar: 'عام', en: 'General', color: '#94a3b8', icon: 'layers', kw: [] }
  ];
  AA.cat = id => AA.CATS.find(c => c.id === id) || AA.CATS[AA.CATS.length - 1];
  AA.catName = id => { const c = AA.cat(id); return AA.lang === 'ar' ? c.ar : c.en; };

  AA.TYPES = {
    pdf: { label: 'PDF', name: ['مستند PDF', 'PDF document'], mime: 'application/pdf' },
    docx: { label: 'DOCX', name: ['مستند Word', 'Word document'], mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    xlsx: { label: 'XLSX', name: ['جدول Excel', 'Excel sheet'], mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    pptx: { label: 'PPTX', name: ['عرض PowerPoint', 'PowerPoint deck'], mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }
  };
  AA.typeName = t => (AA.TYPES[t] ? AA.TYPES[t].name[AA.lang === 'ar' ? 0 : 1] : t);

  AA.ROLES = {
    admin: { ar: 'مدير النظام', en: 'System Admin', a: '#a78bfa', b: '#6366f1', icon: 'shieldCheck',
      desc: ['تحكم كامل بالأرشيف والمستخدمين والصلاحيات وسجل النشاط.', 'Full control over the archive, users, permissions and the activity log.'] },
    employee: { ar: 'موظف', en: 'Employee', a: '#38bdf8', b: '#2563eb', icon: 'users',
      desc: ['يرفع الملفات ويعدّل بياناتها ويبحث ويحلّل المحتوى.', 'Uploads files, edits their metadata, searches and analyses content.'] },
    viewer: { ar: 'قراءة فقط', en: 'Read-only', a: '#94a3b8', b: '#475569', icon: 'eye',
      desc: ['يطّلع على المستندات ويبحث فيها وينزّلها دون تعديل.', 'Can browse, search and download documents without changes.'] }
  };
  AA.roleName = r => (AA.ROLES[r] ? AA.ROLES[r][AA.lang] : r);

  AA.PERMS = [
    { id: 'view', ar: 'عرض المستندات', en: 'View documents', roles: ['admin', 'employee', 'viewer'] },
    { id: 'search', ar: 'البحث الذكي والمساعد', en: 'Smart search & assistant', roles: ['admin', 'employee', 'viewer'] },
    { id: 'download', ar: 'تنزيل الملفات', en: 'Download files', roles: ['admin', 'employee', 'viewer'] },
    { id: 'upload', ar: 'رفع ملفات جديدة', en: 'Upload new files', roles: ['admin', 'employee'] },
    { id: 'edit', ar: 'تعديل بيانات الملفات', en: 'Edit file metadata', roles: ['admin', 'employee'] },
    { id: 'analyze', ar: 'التحليل وتنزيل التقارير', en: 'Insights & reports', roles: ['admin', 'employee'] },
    { id: 'activity', ar: 'عرض سجل النشاط', en: 'View activity log', roles: ['admin', 'employee'] },
    { id: 'delete', ar: 'حذف الملفات', en: 'Delete files', roles: ['admin'] },
    { id: 'users', ar: 'إدارة المستخدمين', en: 'Manage users', roles: ['admin'] }
  ];

  AA.STATUS = {
    active: ['نشط', 'Active'],
    inactive: ['غير نشط', 'Inactive'],
    pending: ['بانتظار التفعيل', 'Pending']
  };
  AA.statusName = s => (AA.STATUS[s] ? AA.STATUS[s][AA.lang === 'ar' ? 0 : 1] : s);

  // [المعرّف، الاسم بالعربي، بالإنجليزي، البريد التجريبي، الدور، الحالة، منذ كم يوم سُجّل]
  const USERS = [
    ['u1', 'نورة القحطاني', 'Noura Alqahtani', 'noura.q@example.com', 'admin', 'active', 420],
    ['u2', 'فيصل العتيبي', 'Faisal Alotaibi', 'faisal.o@example.com', 'employee', 'active', 300],
    ['u3', 'سارة ميتشل', 'Sarah Mitchell', 'sarah.m@example.com', 'employee', 'active', 260],
    ['u4', 'عبدالله الشهري', 'Abdullah Alshehri', 'abdullah.s@example.com', 'employee', 'active', 210],
    ['u6', 'عمر حداد', 'Omar Haddad', 'omar.h@example.com', 'employee', 'active', 180],
    ['u5', 'ريم الدوسري', 'Reem Aldosari', 'reem.d@example.com', 'viewer', 'active', 120],
    ['u7', 'لمى الحربي', 'Lama Alharbi', 'lama.h@example.com', 'viewer', 'inactive', 75],
    ['u8', 'دانيال بروكس', 'Daniel Brooks', 'daniel.b@example.com', 'viewer', 'pending', 6]
  ];

  // [العنوان، اللغة، النوع، التصنيف، منذ كم يوم، الحجم KB، المُضيف، الملخص، الكلمات المفتاحية، مفضّل]
  const DOCS = [
    ['تقرير اتجاهات الإعلام الرقمي 2026', 'ar', 'pdf', 'reports', 2, 4820, 'u2', 'يرصد التقرير أبرز التحولات في استهلاك المحتوى الرقمي في المنطقة، ومنها نمو الفيديو القصير والبودكاست، وتزايد الاعتماد على المنصات الاجتماعية مصدرًا أول للأخبار لدى الفئات الشابة، مع توصيات لتطوير المحتوى متعدد المنصات.', 'الإعلام الرقمي،الفيديو القصير،البودكاست،المنصات الاجتماعية،الجمهور', 1],
    ['Editorial Style Guide v3', 'en', 'docx', 'articles', 5, 1240, 'u3', 'Defines the house tone of voice, headline rules, Arabic–English transliteration standards, number and date formats, and citation practices to keep editorial output consistent across all desks.', 'style guide,headlines,transliteration,citation,editorial standards', 0],
    ['خطة الحملة التسويقية للربع الرابع', 'ar', 'pptx', 'marketing', 1, 8650, 'u4', 'عرض تقديمي يوضح أهداف الحملة التسويقية للربع الرابع، والشرائح المستهدفة، وتوزيع الميزانية على القنوات الرقمية، ومؤشرات قياس الأداء المقترحة لكل قناة.', 'حملة تسويقية،الربع الرابع،الجمهور المستهدف،مؤشرات الأداء،القنوات الرقمية', 0],
    ['Q3 Audience Analytics Report', 'en', 'xlsx', 'reports', 8, 2310, 'u6', 'Quarterly breakdown of page views, unique visitors, session duration and traffic sources, with a comparison against Q2 showing a 14% rise in mobile readership and stronger newsletter referrals.', 'audience,analytics,page views,mobile,traffic sources,quarterly', 1],
    ['دراسة سلوك القراء الشباب على الهواتف', 'ar', 'pdf', 'research', 12, 3560, 'u2', 'دراسة ميدانية على عينة من القراء بين 18 و30 عامًا، تحلل أوقات القراءة المفضلة وأنواع المحتوى الأكثر تفاعلًا، وتبيّن أن المقالات القصيرة المدعومة بالصور تحقق أعلى معدلات إكمال.', 'سلوك القراء،الشباب،الهواتف الذكية،معدل الإكمال،دراسة ميدانية', 0],
    ['AI in Newsrooms: Opportunities and Risks', 'en', 'pdf', 'tech', 3, 2980, 'u3', 'Reviews how newsrooms use artificial intelligence for transcription, translation, tagging and summarisation, and sets out risks around accuracy, bias and transparency with a proposed human-in-the-loop review policy.', 'artificial intelligence,newsroom,automation,ethics,transcription,summarisation', 1],
    ['سياسة العمل عن بُعد', 'ar', 'docx', 'hr', 40, 420, 'u1', 'توضح السياسة شروط الأهلية للعمل عن بعد، وساعات التواصل الأساسية، ومتطلبات أمن المعلومات عند الاتصال من خارج المكتب، وآلية طلب الموافقة من المدير المباشر.', 'العمل عن بعد،سياسة الموظفين،أمن المعلومات،ساعات العمل', 0],
    ['Content Licensing Agreement Template', 'en', 'docx', 'legal', 60, 610, 'u1', 'Standard template for licensing editorial content to third parties, covering usage rights, territory, duration, attribution requirements, fees and termination clauses.', 'licensing,agreement,usage rights,attribution,contract template', 0],
    ['الميزانية التشغيلية 2026', 'ar', 'xlsx', 'finance', 90, 1880, 'u1', 'جدول تفصيلي للمصروفات التشغيلية المتوقعة لعام 2026 موزعة على الأقسام، يتضمن تكاليف الإنتاج والتقنية والتسويق، مع مقارنة بالإنفاق الفعلي للعام السابق.', 'الميزانية،المصروفات التشغيلية،التكاليف،التخطيط المالي', 0],
    ['مقال رأي: مستقبل الصحافة الاستقصائية', 'ar', 'docx', 'articles', 6, 180, 'u4', 'مقال يناقش التحديات التي تواجه الصحافة الاستقصائية في العصر الرقمي، من كلفة الإنتاج إلى سرعة دورة الأخبار، ويقترح نماذج تمويل وشراكات تحافظ على جودة التحقيقات.', 'الصحافة الاستقصائية،مقال رأي،التحقيقات،نماذج التمويل', 0],
    ['Podcast Growth Strategy 2026', 'en', 'pptx', 'marketing', 15, 6420, 'u6', 'Presentation outlining the podcast portfolio roadmap: new show formats, distribution partnerships, listener acquisition targets and sponsorship packaging for the coming year.', 'podcast,growth strategy,listeners,sponsorship,distribution', 0],
    ['تغطية القمة الاقتصادية - ملف الأخبار', 'ar', 'pdf', 'news', 4, 5210, 'u2', 'ملف يجمع التغطية الإخبارية للقمة الاقتصادية، يشمل أبرز التصريحات والجلسات والأرقام المعلنة، مع جدول بالمواد المنشورة وروابط المقاطع المصورة.', 'القمة الاقتصادية،تغطية إخبارية،تصريحات،الاقتصاد', 0],
    ['Breaking News Workflow Handbook', 'en', 'pdf', 'news', 25, 1530, 'u3', 'Step-by-step handbook for handling breaking news: verification checkpoints, approval chain, push-notification rules and correction procedures to balance speed with accuracy.', 'breaking news,workflow,verification,push notifications,corrections', 1],
    ['دليل التحقق من الأخبار والمصادر', 'ar', 'pdf', 'news', 33, 2240, 'u4', 'دليل عملي لأدوات وأساليب التحقق من صحة الأخبار والصور ومقاطع الفيديو، يتضمن قوائم فحص للمصادر المفتوحة وأمثلة على الأخبار المضللة الشائعة.', 'التحقق من الأخبار،المصادر المفتوحة،الأخبار المضللة،قائمة فحص', 0],
    ['Revenue Diversification Analysis', 'en', 'xlsx', 'finance', 48, 2760, 'u6', 'Models revenue streams across advertising, subscriptions, events and licensing over three years, and highlights subscriptions as the fastest growing line in the base scenario.', 'revenue,diversification,subscriptions,advertising,financial model', 0],
    ['برنامج تدريب الموظفين الجدد', 'ar', 'pptx', 'hr', 20, 7340, 'u1', 'عرض تعريفي للموظفين الجدد يشرح الهيكل التنظيمي، وأنظمة العمل الداخلية، وقواعد السلوك المهني، وخطة التدريب خلال أول تسعين يومًا.', 'تدريب،الموظفين الجدد،التهيئة،خطة 90 يومًا', 0],
    ['Data Governance Framework', 'en', 'docx', 'tech', 70, 980, 'u3', 'Sets the roles, data classification levels, retention periods and access-control principles for managing editorial and audience data responsibly.', 'data governance,classification,retention,access control,privacy', 0],
    ['تقرير الأداء السنوي للمنصات الرقمية 2025', 'ar', 'pdf', 'reports', 150, 6120, 'u2', 'تقرير سنوي يقيس أداء المواقع والتطبيقات والحسابات الاجتماعية خلال 2025، ويحلل نمو المتابعين ومعدلات التفاعل وأكثر المواد قراءة، مع مقارنة بالأهداف المعتمدة.', 'الأداء السنوي،المنصات الرقمية،التفاعل،المتابعون', 0],
    ['Social Media Engagement Benchmark', 'en', 'xlsx', 'research', 18, 1420, 'u6', 'Benchmarks engagement rate, share of voice and posting frequency across major social platforms, showing short-form video generating roughly three times the engagement of static posts.', 'social media,engagement,benchmark,short-form video,platforms', 0],
    ['اتفاقية شراكة محتوى مع جهة أكاديمية', 'ar', 'docx', 'legal', 110, 540, 'u1', 'مسودة اتفاقية لتبادل المحتوى البحثي مع جهة أكاديمية، تحدد حقوق النشر وآلية الإشارة إلى المصدر ومدة الاتفاقية والتزامات الطرفين.', 'اتفاقية شراكة،حقوق النشر،جهة أكاديمية،تبادل المحتوى', 0],
    ['Video Production Cost Breakdown', 'en', 'xlsx', 'finance', 29, 1160, 'u4', 'Itemised costs for studio, crew, equipment, editing and distribution per video format, with suggested savings from shared studio scheduling.', 'video production,costs,budget,studio,editing', 0],
    ['استطلاع رضا الجمهور عن المحتوى الثقافي', 'ar', 'xlsx', 'research', 9, 980, 'u2', 'نتائج استطلاع شمل أكثر من ألفي مشارك حول المحتوى الثقافي والفني، تُظهر ارتفاع الطلب على الوثائقيات القصيرة واللقاءات مع المبدعين المحليين.', 'استطلاع،رضا الجمهور،المحتوى الثقافي،الوثائقيات', 0],
    ['Cloud Migration Roadmap', 'en', 'pptx', 'tech', 55, 5480, 'u3', 'Phased plan for moving content management and archive storage to cloud infrastructure, including timeline, cost estimates, security controls and rollback strategy.', 'cloud,migration,infrastructure,roadmap,security', 0],
    ['مقال: كيف تغيّر الخوارزميات صناعة الخبر', 'ar', 'docx', 'articles', 14, 210, 'u4', 'مقال تحليلي يشرح أثر خوارزميات التوصية ومحركات البحث في انتشار الأخبار، وكيف يوازن المحررون بين متطلبات الوصول وقيمة الخبر الصحفية.', 'الخوارزميات،صناعة الخبر،محركات البحث،التوصيات', 1],
    ['Brand Identity Refresh Guidelines', 'en', 'pdf', 'marketing', 80, 9830, 'u6', 'Visual identity guidelines covering logo usage, colour palette, typography in Arabic and English, and templates for social media and presentations.', 'brand identity,guidelines,typography,colour palette,templates', 0],
    ['تقرير التغطية الرياضية الموسمية', 'ar', 'pdf', 'news', 130, 3870, 'u2', 'ملخص التغطية الرياضية للموسم يشمل عدد المواد المنشورة والبث المباشر وأكثر المباريات متابعة، مع ملاحظات لتحسين التغطية في الموسم القادم.', 'التغطية الرياضية،البث المباشر،الموسم الرياضي', 0],
    ['Newsletter Performance Monthly Report', 'en', 'pdf', 'reports', 11, 890, 'u6', 'Monthly newsletter metrics including open rate, click-through rate and subscriber growth, with A/B test results showing that personalised subject lines lift opens by 9%.', 'newsletter,open rate,subscribers,a/b testing,email', 0],
    ['سياسة الخصوصية وحماية البيانات الشخصية', 'ar', 'pdf', 'legal', 200, 760, 'u1', 'توضح السياسة أنواع البيانات الشخصية التي تجمعها المنصات الرقمية، وأغراض استخدامها، ومدة الاحتفاظ بها، وحقوق المستخدمين في الوصول والتصحيح والحذف.', 'الخصوصية،حماية البيانات،البيانات الشخصية،حقوق المستخدمين', 0],
    ['Arabic NLP Tools Evaluation', 'en', 'pdf', 'research', 37, 2050, 'u3', 'Compares open-source Arabic natural language processing tools for tokenisation, named-entity recognition and dialect detection, scoring each on accuracy and speed.', 'arabic nlp,natural language processing,named entities,dialects,evaluation', 0],
    ['خطة التحول الرقمي للأرشيف', 'ar', 'pptx', 'tech', 7, 4410, 'u1', 'خطة مرحلية لرقمنة الأرشيف الورقي والمرئي، وتوحيد التصنيف، وبناء محرك بحث داخلي، مع جدول زمني ومؤشرات نجاح لكل مرحلة.', 'التحول الرقمي،الأرشيف،الرقمنة،محرك بحث،التصنيف', 1],
    ['Employee Wellbeing Survey Results', 'en', 'xlsx', 'hr', 95, 1310, 'u6', 'Aggregated, anonymised results of the annual wellbeing survey covering workload, flexibility and growth opportunities, with action items for each department.', 'employee wellbeing,survey,workload,flexibility', 0],
    ['ملخص ورشة صناعة المحتوى المرئي', 'ar', 'docx', 'articles', 22, 350, 'u4', 'ملخص لأبرز ما طُرح في ورشة صناعة المحتوى المرئي، من كتابة السيناريو القصير إلى التصوير بالهاتف والمونتاج السريع ونصائح لزيادة التفاعل.', 'المحتوى المرئي،ورشة عمل،السيناريو،المونتاج،التصوير بالهاتف', 0],
    ['Sponsorship Rate Card 2026', 'en', 'pdf', 'marketing', 170, 1720, 'u6', 'Rate card listing sponsorship packages for podcasts, newsletters, video series and events, with audience reach figures and package inclusions.', 'sponsorship,rate card,advertising packages,podcast,events', 0],
    ['تقرير قياس الأداء الربعي للمحتوى', 'ar', 'xlsx', 'reports', 45, 1650, 'u2', 'يقارن التقرير أداء أقسام المحتوى خلال الربع الثالث من حيث عدد المواد ومتوسط زمن القراءة ونسب المشاركة، ويحدد أفضل عشر مواد أداءً.', 'قياس الأداء،الربع الثالث،زمن القراءة،أقسام المحتوى', 0]
  ];

  const QUERIES = ['الذكاء الاصطناعي', 'تقرير الجمهور', 'podcast', 'الميزانية', 'سياسة العمل عن بعد', 'breaking news', 'التحقق من الأخبار', 'brand guidelines', 'الفيديو القصير', 'revenue', 'تدريب الموظفين', 'data governance', 'الخصوصية', 'newsletter', 'التحول الرقمي', 'حملة تسويقية', 'audience analytics', 'الصحافة الاستقصائية', 'cloud migration', 'استطلاع'];

  // مولّد أرقام شبه عشوائية ثابت، حتى تكون البيانات التجريبية نفسها في كل مرة
  function rng(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  AA.seed = function () {
    const rand = rng(20261104);
    const pick = arr => arr[Math.floor(rand() * arr.length)];
    const at = days => new Date(Date.now() - days * 86400000 - Math.floor(rand() * 9 + 1) * 3600000).toISOString();

    const users = USERS.map(([id, ar, en, email, role, status, joined]) => ({ id, name: { ar, en }, email, role, status, joined: AA.daysAgo(joined) }));
    const docs = DOCS.map(([title, lang, type, cat, ago, kb, author, summary, kw, fav], i) => ({
      id: 'd' + (i + 1),
      title, lang, type, cat,
      size: kb * 1024 + Math.floor(rand() * 1000),
      date: at(ago),
      author, summary,
      desc: '',
      keywords: kw.split(lang === 'ar' ? '،' : ',').map(s => s.trim()).filter(Boolean),
      fav: !!fav,
      views: Math.floor(rand() * 180 + 12),
      downloads: Math.floor(rand() * 60 + 3),
      seed: true
    }));
    docs[0].desc = 'نسخة معتمدة للعرض في اجتماع التخطيط الشهري.';
    docs[5].desc = 'Shared with the editorial technology working group.';

    const active = users.filter(u => u.status === 'active').map(u => u.id);
    const editors = users.filter(u => u.role !== 'viewer').map(u => u.id);
    const activity = [];
    const ev = (type, userId, iso, extra) => activity.push(Object.assign({ id: 'a' + activity.length, type, userId, at: iso }, extra));

    docs.forEach(d => ev('upload', d.author, d.date, { docId: d.id, title: d.title }));
    users.slice(5).forEach(u => ev('user', 'u1', u.joined, { detail: 'created', target: u.name.ar + ' | ' + u.name.en }));
    // البحث والتنزيل أكثر في الأسابيع الأخيرة، لذلك نرفع العشوائي لأس أكبر من واحد
    for (let i = 0; i < 96; i++) {
      const q = pick(QUERIES);
      ev('search', pick(active), at(Math.floor(Math.pow(rand(), 1.5) * 180)), { q, results: 0 });
    }
    for (let i = 0; i < 64; i++) {
      const d = pick(docs);
      const days = Math.floor(Math.pow(rand(), 1.4) * 170);
      if (new Date(d.date) < new Date(Date.now() - days * 86400000)) ev('download', pick(active), at(days), { docId: d.id, title: d.title });
    }
    for (let i = 0; i < 22; i++) {
      const d = pick(docs);
      const days = Math.floor(rand() * 60);
      if (new Date(d.date) < new Date(Date.now() - days * 86400000)) ev('edit', pick(editors), at(days), { docId: d.id, title: d.title, detail: pick(['keywords', 'desc', 'cat', 'title']) });
    }
    docs.filter(d => d.fav).forEach(d => ev('favorite', 'u1', new Date(new Date(d.date).getTime() + 7200000).toISOString(), { docId: d.id, title: d.title }));
    ev('report', 'u2', at(3), {});
    ev('report', 'u1', at(19), {});

    activity.sort((a, b) => new Date(b.at) - new Date(a.at));
    activity.forEach((a, i) => { a.id = 'a' + (activity.length - i); });

    const state = { v: 1, docs, users, activity, me: 'u1', notifSeen: AA.daysAgo(2) };
    // عدد النتائج لكل بحث تجريبي يُحسب من محرك البحث نفسه حتى يطابق ما يراه المستخدم
    const counts = {};
    activity.forEach(a => {
      if (a.type !== 'search') return;
      if (!(a.q in counts)) counts[a.q] = AA.search.run(a.q, {}, docs).results.length;
      a.results = counts[a.q];
    });
    return state;
  };

  // نصوص جاهزة لتجربة المحلل في صفحة التحليل الذكي (نصوص مكتوبة للعرض)
  AA.SAMPLES = {
    ar: 'شهدت صناعة الإعلام خلال السنوات الأخيرة تحولًا واسعًا نحو المنصات الرقمية، إذ أصبح الجمهور يعتمد على الهواتف الذكية في متابعة الأخبار والمحتوى المرئي. وتشير الدراسات إلى أن الفيديو القصير يحقق أعلى معدلات التفاعل مقارنة بالمقالات الطويلة. كما تتجه المؤسسات الإعلامية إلى توظيف الذكاء الاصطناعي في أرشفة المحتوى وتصنيفه وتسريع البحث فيه. ويتيح الأرشيف الرقمي المنظم للمحررين الوصول إلى المواد السابقة خلال ثوانٍ بدل ساعات. ومع ذلك تبقى جودة البيانات وتوحيد التصنيف من أهم التحديات أمام التحول الرقمي للأرشيف. لذلك يوصي الخبراء ببناء سياسة واضحة للبيانات وتدريب الموظفين على أدوات البحث والتحليل الحديثة.',
    en: 'Newsrooms are rethinking how they store and retrieve their archives. A well-organised digital archive lets editors find past coverage in seconds, which improves accuracy and context in breaking news. Many media organisations now use automated tagging and classification to keep thousands of documents searchable. However, automation only works when metadata is consistent and data governance rules are clear. Audience research also shows that readers value background explainers linked to archived stories. Teams that invest in training and clear workflows see faster production and fewer corrections. The next step for most archives is combining keyword search with smarter relevance ranking.'
  };
})(window.AA);
