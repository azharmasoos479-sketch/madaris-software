'use strict';
/* ============================================================
   مدارس سافٹ ویئر — Madrasa Management System (Urdu, RTL)
   ڈیٹا: localStorage (آف لائن بھی چلتا ہے) · صارفین و رولز کے ساتھ
   ============================================================ */
const DB_KEY = 'madaris_db_v1';
const SESSION_KEY = 'madaris_session';
let DB = null;
let route = 'dashboard';
const routeState = {};

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => 'Rs ' + Math.round(Number(n) || 0).toLocaleString('en-PK');
const uid = p => p + '_' + Math.random().toString(36).slice(2, 9);
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthStr = (d = new Date()) => d.toISOString().slice(0, 7);
const GRADE_SCALE = [ // Masood's grading scale (60-mark base rescaled to %)
  { min: 80, label: 'ممتاز', en: 'Excellent' },
  { min: 70, label: 'جید جداً', en: 'Very Good' },
  { min: 60, label: 'جید', en: 'Good' },
  { min: 50, label: 'مقبول', en: 'Pass' },
  { min: 0, label: 'راسب', en: 'Fail' }
];
function gradeFor(pct) { return GRADE_SCALE.find(g => pct >= g.min); }

/* ---------- users & roles ---------- */
function defaultUsers() {
  return [
    { id: 'u_admin', name: 'مولانا منتظم صاحب', email: 'admin@madaris.pk', pass: 'admin123', role: 'منتظم' },
    { id: 'u_ustad', name: 'قاری محمد الیاس', email: 'ustad@madaris.pk', pass: 'ustad123', role: 'استاد' },
    { id: 'u_hisab', name: 'محمد حسان (محاسب)', email: 'muhassib@madaris.pk', pass: 'hisab123', role: 'محاسب' }
  ];
}
function currentUser() {
  const em = localStorage.getItem(SESSION_KEY);
  return (DB.users || []).find(u => u.email === em) || (DB.users || [])[0] || null;
}
function myName() { const u = currentUser(); return u ? u.name : ''; }

/* ---------- seed ---------- */
function seed() {
  const classes = [
    { id: 'c_hifz', name: 'شعبہ حفظ — الف', stream: 'حفظ', teacherId: 't1', fee: 1500 },
    { id: 'c_nazra', name: 'شعبہ ناظرہ', stream: 'ناظرہ', teacherId: 't2', fee: 800 },
    { id: 'c_ola', name: 'درجہ اولیٰ', stream: 'درس نظامی', teacherId: 't3', fee: 1000 },
    { id: 'c_sania', name: 'درجہ ثانیہ', stream: 'درس نظامی', teacherId: 't4', fee: 1000 },
    { id: 'c_salisa', name: 'درجہ ثالثہ', stream: 'درس نظامی', teacherId: 't3', fee: 1200 }
  ];
  const staff = [
    { id: 't1', name: 'قاری محمد الیاس', role: 'استادِ حفظ', subject: 'حفظ قرآن', phone: '03451234501', salary: 45000, joinDate: '2021-03-01' },
    { id: 't2', name: 'قاری عبدالرحمن', role: 'استادِ ناظرہ', subject: 'ناظرہ و قاعدہ', phone: '03451234502', salary: 35000, joinDate: '2022-02-15' },
    { id: 't3', name: 'مولانا مفتی احمد شاہ', role: 'استادِ درس نظامی', subject: 'فقہ و اصول', phone: '03451234503', salary: 60000, joinDate: '2019-04-01' },
    { id: 't4', name: 'مولانا بلال احمد', role: 'استادِ درس نظامی', subject: 'صرف و نحو', phone: '03451234504', salary: 50000, joinDate: '2020-08-20' },
    { id: 't5', name: 'حافظ سمیع اللہ', role: 'سامع / معاون', subject: 'اسباق سماعت', phone: '03451234505', salary: 25000, joinDate: '2023-01-10' },
    { id: 't6', name: 'محمد حسان', role: 'محاسب', subject: 'حساب کتاب', phone: '03451234506', salary: 40000, joinDate: '2021-06-01' },
    { id: 't7', name: 'مولانا ناظم الدین', role: 'ناظمِ تعلیمات', subject: 'نگرانی', phone: '03451234507', salary: 55000, joinDate: '2018-03-01' },
    { id: 't8', name: 'شاہد محمود', role: 'خدمت گار', subject: '—', phone: '03451234508', salary: 25000, joinDate: '2022-09-01' }
  ];
  const firstN = ['محمد احمد', 'محمد بلال', 'عبداللہ', 'محمد عثمان', 'حسن علی', 'محمد حمزہ', 'محمد طلحہ', 'احمد رضا', 'محمد سعد', 'عمر فاروق', 'محمد انس', 'حافظ طیب', 'محمد زید', 'علی حسن', 'محمد فہد', 'محمد شاہد', 'احمد علی', 'محمد یوسف', 'محمد ابراہیم', 'حسن رضا', 'محمد دانیال', 'عبدالرحمن', 'محمد شعیب', 'محمد نعمان', 'طلحہ محمود', 'محمد حارث', 'محمد فیضان', 'اسامہ خان', 'محمد وقاص', 'محمد عدنان'];
  const fathers = ['محمد اسلم', 'عبدالستار', 'محمد رفیق', 'حاجی نور محمد', 'محمد یعقوب', 'عبدالغفور', 'محمد صدیق', 'حاجی عبدالمجید'];
  const prev = ['مدرسہ دارالعلوم کوہاٹ', 'جامعہ اشرفیہ', 'مدرسہ تعلیم القرآن', '— (پہلا داخلہ)', 'جامعہ فاروقیہ'];
  const students = [];
  for (let i = 0; i < 30; i++) {
    const cls = classes[i % classes.length];
    students.push({
      id: 's' + (i + 1), name: firstN[i], father: fathers[i % fathers.length],
      guardianPhone: '03' + (45 + (i % 4)) + String(2000000 + i * 137).slice(0, 7),
      prevMadrasa: prev[i % prev.length], classId: cls.id, roll: (i % 10) + 1,
      admissionDate: '2025-0' + (1 + (i % 6)) + '-10', status: i === 17 ? 'خارج' : 'فعال',
      monthlyFee: cls.fee
    });
  }
  const month = monthStr();
  const charges = students.filter(s => s.status === 'فعال').map(s => {
    const paidPart = [0, 0.5, 1, 1, 0][Math.floor(Math.random() * 5)];
    return { id: uid('ch'), studentId: s.id, month, total: s.monthlyFee, paid: Math.round(s.monthlyFee * paidPart), status: paidPart >= 1 ? 'ادا شدہ' : (paidPart > 0 ? 'جزوی' : 'باقی'), dueDate: month + '-10' };
  });
  const ledger = [
    { id: uid('lg'), date: todayStr(), kind: 'آمدن', category: 'عطیات', account: 'کیش', amount: 25000, desc: 'ماہانہ عطیہ — اہلِ محلہ', refNo: 1001, by: 'محمد حسان (محاسب)' },
    { id: uid('lg'), date: todayStr(), kind: 'خرچ', category: 'بجلی/گیس بل', account: 'کیش', amount: 12400, desc: 'بجلی کا بل', refNo: 1002, by: 'محمد حسان (محاسب)' },
    { id: uid('lg'), date: todayStr(), kind: 'خرچ', category: 'کھانا (لنگر)', account: 'بینک', amount: 48000, desc: 'راشن خریداری', refNo: 1003, by: 'محمد حسان (محاسب)' }
  ];
  // today's sabaq entries (sample, by different teachers → own records)
  const sabaq = [];
  const types = ['سبق', 'سبقی', 'منزل', 'ناظرہ'];
  students.filter(s => s.status === 'فعال').slice(0, 14).forEach((s, i) => {
    sabaq.push({ id: uid('sb'), date: todayStr(), studentId: s.id, type: types[i % 4], para: (i % 10) + 1, surah: 'سورۃ یٰسین', fromAyat: 1, toAyat: 12, pages: 2, mistakes: i % 3, stuck: i % 2, listenerId: i % 2 ? 't5' : 't1', quality: ['بہترین', 'اچھا', 'متوسط'][i % 3], by: i % 2 ? 'حافظ سمیع اللہ' : 'قاری محمد الیاس' });
  });
  return {
    madrasa: { name: 'جامعہ محمدیہ', city: 'کوہاٹ', address: 'مین روڈ، کوہاٹ، خیبر پختونخوا', phone: '0346 2469006', principal: 'مولانا ناظم الدین' },
    users: defaultUsers(),
    classes, staff, students, charges, ledger, sabaq,
    exams: [], results: {},
    att: {}, announcements: [
      { id: uid('an'), date: todayStr(), title: 'ماہانہ امتحان', body: 'آئندہ جمعہ کو ماہانہ امتحان ہوگا — تمام طلبہ تیاری کریں۔', target: 'تمام طلبہ', by: 'مولانا منتظم صاحب' }
    ],
    settings: { feeHeads: ['ماہانہ فیس', 'داخلہ فیس', 'امتحانی فیس'], categories: ['عطیات', 'زکاۃ', 'فیس', 'تنخواہیں', 'بجلی/گیس بل', 'کھانا (لنگر)', 'تعمیرات', 'کتب و طباعت', 'متفرق'] }
  };
}

/* ---------- persistence ---------- */
function save() { localStorage.setItem(DB_KEY, JSON.stringify(DB)); }
function load() { try { DB = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) { DB = null; } if (!DB || !DB.students) { DB = seed(); save(); } if (DB && !DB.users) { DB.users = defaultUsers(); save(); } }

/* ---------- lookups ---------- */
const studentById = id => DB.students.find(s => s.id === id);
const staffById = id => DB.staff.find(t => t.id === id);
const classById = id => DB.classes.find(c => c.id === id);
const className = id => (classById(id) || {}).name || '—';
const staffName = id => (staffById(id) || {}).name || '—';
const studentName = id => (studentById(id) || {}).name || '—';

/* ---------- auth ---------- */
function doLogin() {
  const e = $('#loginEmail').value.trim().toLowerCase(), p = $('#loginPass').value;
  const u = (DB.users || []).find(x => x.email.toLowerCase() === e && x.pass === p);
  if (u) { localStorage.setItem(SESSION_KEY, u.email); showApp(); }
  else { $('#loginErr').textContent = 'ای میل یا پاس ورڈ درست نہیں — نیچے دیے ڈیمو لاگ اِن استعمال کریں۔'; }
}
function logout() { localStorage.removeItem(SESSION_KEY); location.reload(); }
function showApp() {
  $('#loginView').classList.add('hidden'); $('#appView').classList.remove('hidden');
  const cu = currentUser();
  $('#sideSchool').textContent = DB.madrasa.name + ' — ' + DB.madrasa.city;
  if (cu) { $('#userName').textContent = cu.name; $('#userRole').textContent = cu.role; document.querySelector('.avatar').textContent = cu.name.trim().charAt(0); }
  $('#todayLabel').textContent = new Date().toLocaleDateString('ur-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  buildNav(); navigate('dashboard');
}

/* ---------- nav / router ---------- */
const NAV = [
  ['dashboard', '📊 ڈیش بورڈ'], ['students', '🎓 طلبہ'], ['staff', '👳 اساتذہ و عملہ'],
  ['attendance', '📋 حاضری'], ['hifz', '📖 حفظ و ناظرہ'], ['fees', '💰 فیس'],
  ['exams', '📝 امتحانات'], ['accounts', '📒 مالیات'], ['announce', '📢 اعلانات و الرٹس'],
  ['users', '🔐 صارفین و رولز'], ['settings', '⚙️ ترتیبات']
];
function buildNav() { $('#sideNav').innerHTML = NAV.map(([r, t]) => `<a data-r="${r}" onclick="navigate('${r}')" class="${r === route ? 'active' : ''}">${t}</a>`).join(''); }
function navigate(r) {
  route = r; document.body.classList.remove('nav-open');
  document.querySelectorAll('#sideNav a').forEach(a => a.classList.toggle('active', a.dataset.r === r));
  $('#pageTitle').textContent = (NAV.find(n => n[0] === r) || ['', r])[1];
  ({ dashboard: renderDashboard, students: renderStudents, staff: renderStaff, attendance: renderAttendance, hifz: renderHifz, fees: renderFees, exams: renderExams, accounts: renderAccounts, announce: renderAnnounce, users: renderUsers, settings: renderSettings }[r] || renderDashboard)();
}
function field(label, input, full) { return `<div class="fld${full ? ' full' : ''}"><label>${label}</label>${input}</div>`; }
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2600); }

/* ---------- modal ---------- */
function openModal(html) { $('#modalRoot').innerHTML = `<div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal">${html}</div></div>`; }
function closeModal() { $('#modalRoot').innerHTML = ''; }
function confirmBox(msg, fn) { window._confirmFn = fn; openModal(`<h3>⚠️ تصدیق کریں</h3><p>${esc(msg)}</p><div class="form-actions"><button class="btn" onclick="closeModal()">منسوخ</button><button class="btn btn-danger" onclick="window._confirmFn();closeModal()">جی ہاں، جاری رکھیں</button></div>`); }
function printHTML(title, body) { const old = document.querySelector('.print-area'); if (old) old.remove(); const d = document.createElement('div'); d.className = 'print-area'; d.innerHTML = `<h2 style="text-align:center;color:#0b5136">${esc(DB.madrasa.name)} — ${esc(DB.madrasa.city)}</h2><h3 style="text-align:center">${esc(title)}</h3><hr>${body}`; document.body.appendChild(d); setTimeout(() => { window.print(); d.remove(); }, 60); }
function download(name, text, type = 'text/csv') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + text], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); }
function csvCell(v) { v = String(v ?? ''); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }

/* ---------- dashboard ---------- */
function renderDashboard() {
  const act = DB.students.filter(s => s.status === 'فعال');
  const t = todayStr(); let present = 0, marked = 0;
  Object.entries(DB.att).filter(([k]) => k.startsWith(t)).forEach(([, m]) => Object.values(m).forEach(v => { marked++; if (v === 'حاضر') present++; }));
  const m = monthStr(); const mCharges = DB.charges.filter(c => c.month === m);
  const due = mCharges.reduce((a, c) => a + (c.total - c.paid), 0), collected = mCharges.reduce((a, c) => a + c.paid, 0);
  const todaySabaq = DB.sabaq.filter(x => x.date === t);
  const mySabaq = todaySabaq.filter(x => x.by === myName());
  $('#page').innerHTML = `
  <div class="cards">
    <div class="stat"><b>${act.length}</b><span>🎓 کل فعال طلبہ</span></div>
    <div class="stat"><b>${DB.staff.length}</b><span>👳 اساتذہ و عملہ</span></div>
    <div class="stat"><b>${marked ? Math.round(present / marked * 100) : 0}%</b><span>📋 آج کی حاضری</span></div>
    <div class="stat"><b>${todaySabaq.length}</b><span>📖 آج کے اسباق اندراج</span></div>
  </div>
  <div class="grid2">
    <div class="panel"><h3>💰 اس ماہ کی فیس</h3>
      <div class="mini"><span>وصول شدہ:</span> <b>${fmt(collected)}</b></div>
      <div class="bar" style="margin:8px 0"><i style="width:${(collected + due) ? Math.round(collected / (collected + due) * 100) : 0}%"></i></div>
      <div class="mini"><span>بقایا:</span> <b style="color:var(--red)">${fmt(due)}</b></div>
      <p class="mut small">بقایا دار طلبہ: ${mCharges.filter(c => c.paid < c.total).length}</p>
      <button class="btn btn-primary" style="margin-top:8px" onclick="navigate('fees')">فیس ماڈیول کھولیں</button></div>
    <div class="panel"><h3>📖 میرے آج کے اسباق <span class="pill blue">${esc(myName())}</span></h3>
      ${mySabaq.length ? `<table><tr><th>طالب علم</th><th>قسم</th><th>پارہ</th><th>کیفیت</th></tr>${mySabaq.map(x => `<tr><td>${esc(studentName(x.studentId))}</td><td>${esc(x.type)}</td><td>${x.para}</td><td>${esc(x.quality)}</td></tr>`).join('')}</table>`
      : '<p class="mut">آج آپ کے نام سے کوئی سبق درج نہیں ہوا۔ ہر صارف کے اسباق اس کے اپنے نام سے الگ محفوظ ہوتے ہیں۔</p>'}
      <button class="btn btn-outline" style="margin-top:8px" onclick="navigate('hifz')">نیا سبق درج کریں</button></div>
  </div>
  <div class="panel"><h3>📢 تازہ اعلانات</h3>
    ${DB.announcements.slice().reverse().slice(0, 3).map(a => `<p><b>${esc(a.title)}</b> — ${esc(a.body)} <span class="mut small">(${esc(a.date)}${a.by ? ' · ' + esc(a.by) : ''})</span></p>`).join('') || '<p class="mut">کوئی اعلان نہیں</p>'}</div>`;
}

/* ---------- students ---------- */
function renderStudents() {
  const q = (routeState.sq || '').toLowerCase(), cf = routeState.scf || '', sf = routeState.ssf || '';
  let list = DB.students.slice().sort((a, b) => (a.classId + a.roll).localeCompare(b.classId + b.roll));
  if (cf) list = list.filter(s => s.classId === cf);
  if (sf) list = list.filter(s => s.status === sf);
  if (q) list = list.filter(s => (s.name + s.father + s.guardianPhone).toLowerCase().includes(q));
  $('#page').innerHTML = `
  <div class="toolbar"><input type="search" placeholder="نام، والد یا فون سے تلاش کریں…" value="${esc(routeState.sq || '')}" oninput="routeState.sq=this.value;renderStudents()">
    <select onchange="routeState.scf=this.value;renderStudents()"><option value="">تمام درجات</option>${DB.classes.map(c => `<option value="${c.id}" ${cf === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
    <select onchange="routeState.ssf=this.value;renderStudents()"><option value="">ہر حالت</option><option ${sf === 'فعال' ? 'selected' : ''}>فعال</option><option ${sf === 'خارج' ? 'selected' : ''}>خارج</option></select>
    <span class="sp"></span>
    <button class="btn" onclick="exportStudents()">⬇ CSV</button>
    <button class="btn" onclick="printStudents()">🖨 پرنٹ</button>
    <button class="btn btn-primary" onclick="studentForm()">＋ نیا داخلہ</button></div>
  <div class="panel"><table><tr><th>رول</th><th>طالب علم</th><th>والد/سرپرست</th><th>رابطہ</th><th>درجہ / شعبہ</th><th>سابقہ مدرسہ</th><th>ماہانہ فیس</th><th>حالت</th><th></th></tr>
  ${list.map(s => `<tr><td>${s.roll}</td><td><b>${esc(s.name)}</b></td><td>${esc(s.father)}</td><td dir="ltr">${esc(s.guardianPhone)}</td><td>${esc(className(s.classId))}</td><td>${esc(s.prevMadrasa)}</td><td>${fmt(s.monthlyFee)}</td>
    <td><span class="pill ${s.status === 'فعال' ? 'green' : 'grey'}">${esc(s.status)}</span></td>
    <td><button class="btn btn-sm" onclick="studentForm('${s.id}')">ترمیم</button> <button class="btn btn-sm btn-danger" onclick="confirmBox('طالب علم ${esc(s.name)} حذف کریں؟',()=>delStudent('${s.id}'))">حذف</button></td></tr>`).join('') || '<tr><td colspan="9" class="mut">کوئی طالب علم نہیں ملا</td></tr>'}
  </table><p class="mut small" style="margin-top:8px">کل: ${list.length} طلبہ</p></div>`;
}
function studentForm(id) {
  const s = id ? studentById(id) : { name: '', father: '', guardianPhone: '', prevMadrasa: '', classId: DB.classes[0].id, roll: 1, admissionDate: todayStr(), status: 'فعال', monthlyFee: 1000 };
  openModal(`<h3>${id ? 'طالب علم میں ترمیم' : 'نیا داخلہ'}</h3>
  <form onsubmit="saveStudent(event,'${id || ''}')">
    <div class="form-grid">
      ${field('طالب علم کا نام *', `<input name="name" required value="${esc(s.name)}">`)}
      ${field('والد / سرپرست *', `<input name="father" required value="${esc(s.father)}">`)}
      ${field('سرپرست کا فون', `<input name="guardianPhone" value="${esc(s.guardianPhone)}" dir="ltr">`)}
      ${field('رول نمبر', `<input name="roll" type="number" min="0" value="${s.roll}">`)}
      ${field('درجہ / شعبہ', `<select name="classId" onchange="document.getElementById('sf_fee').value=(DB.classes.find(c=>c.id===this.value)||{}).fee||0">${DB.classes.map(c => `<option value="${c.id}" ${s.classId === c.id ? 'selected' : ''}>${esc(c.name)} (${esc(c.stream)})</option>`).join('')}</select>`)}
      ${field('ماہانہ فیس', `<input id="sf_fee" name="monthlyFee" type="number" min="0" value="${s.monthlyFee}">`)}
      ${field('سابقہ مدرسہ', `<input name="prevMadrasa" value="${esc(s.prevMadrasa)}">`)}
      ${field('تاریخِ داخلہ', `<input name="admissionDate" type="date" value="${s.admissionDate}">`)}
      ${field('حالت', `<select name="status"><option ${s.status === 'فعال' ? 'selected' : ''}>فعال</option><option ${s.status === 'خارج' ? 'selected' : ''}>خارج</option></select>`)}
    </div>
    <div class="form-actions"><button type="button" class="btn" onclick="closeModal()">منسوخ</button><button class="btn btn-primary">محفوظ کریں</button></div>
  </form>`);
}
function saveStudent(e, id) {
  e.preventDefault(); const f = new FormData(e.target);
  const data = { name: f.get('name').trim(), father: f.get('father').trim(), guardianPhone: f.get('guardianPhone').trim(), prevMadrasa: f.get('prevMadrasa').trim(), classId: f.get('classId'), roll: Number(f.get('roll')) || 0, monthlyFee: Number(f.get('monthlyFee')) || 0, admissionDate: f.get('admissionDate'), status: f.get('status') };
  if (id) Object.assign(studentById(id), data); else DB.students.push({ id: uid('s'), ...data });
  save(); closeModal(); renderStudents(); toast('طالب علم محفوظ ہو گیا');
}
function delStudent(id) { DB.students = DB.students.filter(s => s.id !== id); save(); renderStudents(); toast('حذف ہو گیا'); }
function exportStudents() { const rows = [['نام', 'والد', 'فون', 'درجہ', 'رول', 'فیس', 'حالت']].concat(DB.students.map(s => [s.name, s.father, s.guardianPhone, className(s.classId), s.roll, s.monthlyFee, s.status])); download('students.csv', rows.map(r => r.map(csvCell).join(',')).join('\n')); }
function printStudents() { printHTML('فہرستِ طلبہ', `<table border="1" cellspacing="0" cellpadding="6" width="100%"><tr><th>رول</th><th>نام</th><th>والد</th><th>درجہ</th><th>فون</th></tr>${DB.students.filter(s => s.status === 'فعال').map(s => `<tr><td>${s.roll}</td><td>${esc(s.name)}</td><td>${esc(s.father)}</td><td>${esc(className(s.classId))}</td><td>${esc(s.guardianPhone)}</td></tr>`).join('')}</table>`); }

/* ---------- staff ---------- */
function renderStaff() {
  $('#page').innerHTML = `
  <div class="toolbar"><span class="sp"></span><button class="btn btn-primary" onclick="staffForm()">＋ نیا استاد/عملہ</button></div>
  <div class="panel"><table><tr><th>نام</th><th>عہدہ</th><th>موضوع/شعبہ</th><th>فون</th><th>ماہانہ تنخواہ</th><th>تاریخِ تقرری</th><th></th></tr>
  ${DB.staff.map(t => `<tr><td><b>${esc(t.name)}</b></td><td><span class="pill blue">${esc(t.role)}</span></td><td>${esc(t.subject)}</td><td dir="ltr">${esc(t.phone)}</td><td>${fmt(t.salary)}</td><td>${esc(t.joinDate)}</td>
    <td><button class="btn btn-sm" onclick="staffForm('${t.id}')">ترمیم</button> <button class="btn btn-sm btn-danger" onclick="confirmBox('حذف کریں؟',()=>delStaff('${t.id}'))">حذف</button></td></tr>`).join('')}</table></div>`;
}
function staffForm(id) {
  const t = id ? staffById(id) : { name: '', role: 'استاد', subject: '', phone: '', salary: 30000, joinDate: todayStr() };
  openModal(`<h3>${id ? 'ترمیم' : 'نیا استاد / عملہ'}</h3><form onsubmit="saveStaff(event,'${id || ''}')">
    <div class="form-grid">
      ${field('نام *', `<input name="name" required value="${esc(t.name)}">`)}
      ${field('عہدہ', `<select name="role">${['استادِ حفظ', 'استادِ ناظرہ', 'استادِ درس نظامی', 'ناظمِ تعلیمات', 'سامع / معاون', 'محاسب', 'خدمت گار'].map(r => `<option ${t.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select>`)}
      ${field('موضوع / شعبہ', `<input name="subject" value="${esc(t.subject)}">`)}
      ${field('فون', `<input name="phone" value="${esc(t.phone)}" dir="ltr">`)}
      ${field('ماہانہ تنخواہ', `<input name="salary" type="number" min="0" value="${t.salary}">`)}
      ${field('تاریخِ تقرری', `<input name="joinDate" type="date" value="${t.joinDate}">`)}
    </div>
    <div class="form-actions"><button type="button" class="btn" onclick="closeModal()">منسوخ</button><button class="btn btn-primary">محفوظ کریں</button></div></form>`);
}
function saveStaff(e, id) { e.preventDefault(); const f = new FormData(e.target); const d = { name: f.get('name').trim(), role: f.get('role'), subject: f.get('subject').trim(), phone: f.get('phone').trim(), salary: Number(f.get('salary')) || 0, joinDate: f.get('joinDate') }; if (id) Object.assign(staffById(id), d); else DB.staff.push({ id: uid('t'), ...d }); save(); closeModal(); renderStaff(); toast('محفوظ ہو گیا'); }
function delStaff(id) { DB.staff = DB.staff.filter(t => t.id !== id); save(); renderStaff(); }

/* ---------- attendance (hourly) ---------- */
function attKey() { return `${routeState.ad || todayStr()}|${routeState.ac || DB.classes[0].id}|${routeState.ah || 'پہلا گھنٹہ'}`; }
function renderAttendance() {
  const date = routeState.ad || todayStr(), cls = routeState.ac || DB.classes[0].id, hour = routeState.ah || 'پہلا گھنٹہ';
  const key = `${date}|${cls}|${hour}`; const marks = DB.att[key] || {};
  const list = DB.students.filter(s => s.classId === cls && s.status === 'فعال').sort((a, b) => a.roll - b.roll);
  const counts = { 'حاضر': 0, 'غیر حاضر': 0, 'رخصت': 0 }; Object.values(marks).forEach(v => counts[v]++);
  $('#page').innerHTML = `
  <div class="toolbar">
    <input type="date" value="${date}" onchange="routeState.ad=this.value;renderAttendance()">
    <select onchange="routeState.ac=this.value;renderAttendance()">${DB.classes.map(c => `<option value="${c.id}" ${cls === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
    <select onchange="routeState.ah=this.value;renderAttendance()">${['پہلا گھنٹہ', 'دوسرا گھنٹہ', 'تیسرا گھنٹہ', 'چوتھا گھنٹہ', 'مکمل دن'].map(h => `<option ${hour === h ? 'selected' : ''}>${h}</option>`).join('')}</select>
    <span class="sp"></span>
    <span class="pill green">حاضر: ${counts['حاضر']}</span> <span class="pill red">غیر حاضر: ${counts['غیر حاضر']}</span> <span class="pill amber">رخصت: ${counts['رخصت']}</span>
    <button class="btn btn-primary" onclick="markAllAtt()">سب حاضر</button>
  </div>
  <div class="panel"><table><tr><th>رول</th><th>طالب علم</th><th>حاضری</th></tr>
  ${list.map(s => `<tr><td>${s.roll}</td><td><b>${esc(s.name)}</b> <span class="mut small">ولد ${esc(s.father)}</span></td>
    <td><div class="att-btns">${['حاضر', 'غیر حاضر', 'رخصت'].map(v => `<button class="${marks[s.id] === v ? (v === 'حاضر' ? 'on-h' : v === 'غیر حاضر' ? 'on-a' : 'on-l') : ''}" onclick="setAtt('${s.id}','${v}')">${v}</button>`).join('')}</div></td></tr>`).join('') || '<tr><td colspan="3" class="mut">اس درجے میں فعال طالب علم نہیں</td></tr>'}
  </table>
  <p class="mut small" style="margin-top:10px">غیر حاضر طلبہ کے سرپرستوں کو وٹس ایپ الرٹ: <a href="#" onclick="navigate('announce');return false;">اعلانات و الرٹس</a> میں فہرست تیار ملے گی۔</p></div>`;
}
function setAtt(sid, v) { const k = attKey(); DB.att[k] = DB.att[k] || {}; if (DB.att[k][sid] === v) delete DB.att[k][sid]; else DB.att[k][sid] = v; save(); renderAttendance(); }
function markAllAtt() { const k = attKey(); DB.att[k] = DB.att[k] || {}; const cls = routeState.ac || DB.classes[0].id; DB.students.filter(s => s.classId === cls && s.status === 'فعال').forEach(s => DB.att[k][s.id] = 'حاضر'); save(); renderAttendance(); toast('تمام طلبہ حاضر لگا دیے گئے'); }

/* ---------- hifz & nazra (sabaq log) ---------- */
function renderHifz() {
  const fSid = routeState.hs || '', fBy = routeState.hb || '', fType = routeState.ht || '';
  let list = DB.sabaq.slice().sort((a, b) => b.date.localeCompare(a.date));
  if (fSid) list = list.filter(x => x.studentId === fSid);
  if (fType) list = list.filter(x => x.type === fType);
  if (fBy) list = list.filter(x => x.by === fBy);
  const teachers = [...new Set(DB.sabaq.map(x => x.by).filter(Boolean))];
  $('#page').innerHTML = `
  <div class="toolbar">
    <select onchange="routeState.hs=this.value;renderHifz()"><option value="">تمام طلبہ</option>${DB.students.filter(s => s.status === 'فعال').map(s => `<option value="${s.id}" ${fSid === s.id ? 'selected' : ''}>${esc(s.name)} (${esc(className(s.classId))})</option>`).join('')}</select>
    <select onchange="routeState.ht=this.value;renderHifz()"><option value="">ہر قسم</option>${['سبق', 'سبقی', 'منزل', 'ناظرہ', 'قاعدہ'].map(t => `<option ${fType === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <select onchange="routeState.hb=this.value;renderHifz()"><option value="">تمام اساتذہ (درج کنندہ)</option>${teachers.map(t => `<option ${fBy === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
    <span class="sp"></span><button class="btn btn-primary" onclick="sabaqForm()">＋ نیا سبق درج کریں</button></div>
  <div class="panel"><h3>📖 اسباق کا ریکارڈ ${fBy ? '— استاد: ' + esc(fBy) + ' کے اپنے ریکارڈ' : ''}</h3>
  <table><tr><th>تاریخ</th><th>طالب علم</th><th>قسم</th><th>پارہ / سورت</th><th>آیات / صفحات</th><th>غلطیاں / اٹکان</th><th>سامع</th><th>کیفیت</th><th>درج کنندہ</th><th></th></tr>
  ${list.slice(0, 200).map(x => `<tr><td>${esc(x.date)}</td><td><b>${esc(studentName(x.studentId))}</b></td><td><span class="pill blue">${esc(x.type)}</span></td>
    <td>پارہ ${x.para}${x.surah ? ' · ' + esc(x.surah) : ''}</td><td>آیت ${x.fromAyat}–${x.toAyat} · ${x.pages} صفحہ</td><td>${x.mistakes} / ${x.stuck}</td>
    <td>${esc(staffName(x.listenerId))}</td><td>${esc(x.quality)}</td><td><span class="pill grey">${esc(x.by || '')}</span></td>
    <td><button class="btn btn-sm btn-danger" onclick="confirmBox('یہ اندراج حذف کریں؟',()=>delSabaq('${x.id}'))">حذف</button></td></tr>`).join('') || '<tr><td colspan="10" class="mut">کوئی اندراج نہیں</td></tr>'}
  </table><p class="mut small" style="margin-top:8px">ہر استاد کے درج کردہ اسباق اس کے نام سے محفوظ ہوتے ہیں — اوپر والے فلٹر سے کسی بھی استاد کے اپنے ریکارڈ الگ دیکھے جا سکتے ہیں۔</p></div>`;
}
function sabaqForm() {
  openModal(`<h3>📖 نیا سبق درج کریں</h3><form onsubmit="saveSabaq(event)">
    <div class="form-grid">
      ${field('طالب علم *', `<select name="studentId">${DB.students.filter(s => s.status === 'فعال').map(s => `<option value="${s.id}">${esc(s.name)} (${esc(className(s.classId))})</option>`).join('')}</select>`)}
      ${field('قسم', `<select name="type"><option>سبق</option><option>سبقی</option><option>منزل</option><option>ناظرہ</option><option>قاعدہ</option></select>`)}
      ${field('تاریخ', `<input name="date" type="date" value="${todayStr()}">`)}
      ${field('پارہ نمبر (1-30)', `<input name="para" type="number" min="1" max="30" value="1">`)}
      ${field('سورت', `<input name="surah" placeholder="مثلاً سورۃ الملک">`)}
      ${field('آیت سے / تک', `<div style="display:flex;gap:6px"><input name="fromAyat" type="number" min="0" value="1"><input name="toAyat" type="number" min="0" value="10"></div>`)}
      ${field('صفحات', `<input name="pages" type="number" min="0" step="0.5" value="2">`)}
      ${field('غلطیاں / اٹکان', `<div style="display:flex;gap:6px"><input name="mistakes" type="number" min="0" value="0"><input name="stuck" type="number" min="0" value="0"></div>`)}
      ${field('سامع (سننے والا)', `<select name="listenerId">${DB.staff.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}${DB.students.filter(s => s.status === 'فعال').slice(0, 5).map(s => `<option value="${s.id}">طالب علم: ${esc(s.name)}</option>`).join('')}</select>`)}
      ${field('کیفیت', `<select name="quality"><option>بہترین</option><option>اچھا</option><option>متوسط</option><option>کمزور</option></select>`)}
    </div>
    <div class="form-actions"><button type="button" class="btn" onclick="closeModal()">منسوخ</button><button class="btn btn-primary">درج کریں</button></div></form>`);
}
function saveSabaq(e) {
  e.preventDefault(); const f = new FormData(e.target);
  DB.sabaq.push({ id: uid('sb'), date: f.get('date'), studentId: f.get('studentId'), type: f.get('type'), para: Number(f.get('para')) || 1, surah: f.get('surah').trim(), fromAyat: Number(f.get('fromAyat')) || 0, toAyat: Number(f.get('toAyat')) || 0, pages: Number(f.get('pages')) || 0, mistakes: Number(f.get('mistakes')) || 0, stuck: Number(f.get('stuck')) || 0, listenerId: f.get('listenerId'), quality: f.get('quality'), by: myName() });
  save(); closeModal(); renderHifz(); toast('سبق آپ کے نام سے درج ہو گیا');
}
function delSabaq(id) { DB.sabaq = DB.sabaq.filter(x => x.id !== id); save(); renderHifz(); }

/* ---------- fees ---------- */
function renderFees() {
  const m = routeState.fm || monthStr();
  const charges = DB.charges.filter(c => c.month === m);
  const dues = charges.filter(c => c.paid < c.total);
  const total = charges.reduce((a, c) => a + c.total, 0), paid = charges.reduce((a, c) => a + c.paid, 0);
  $('#page').innerHTML = `
  <div class="toolbar"><input type="month" value="${m}" onchange="routeState.fm=this.value;renderFees()">
    <span class="pill green">وصول: ${fmt(paid)}</span><span class="pill red">بقایا: ${fmt(total - paid)}</span>
    <span class="sp"></span>
    <button class="btn" onclick="confirmBox('${m} کے لیے تمام فعال طلبہ کے فیس چارج بنائیں؟',()=>genCharges('${m}'))">⚙ اس ماہ کے چارج بنائیں</button>
    <button class="btn btn-primary" onclick="collectForm()">＋ فیس وصول کریں</button></div>
  <div class="panel"><h3>فیس چارجز — ${esc(m)}</h3>
  <table><tr><th>طالب علم</th><th>درجہ</th><th>کل فیس</th><th>وصول</th><th>باقی</th><th>حالت</th><th></th></tr>
  ${charges.map(c => { const s = studentById(c.studentId) || {}; return `<tr><td><b>${esc(s.name || '—')}</b></td><td>${esc(className(s.classId))}</td><td>${fmt(c.total)}</td><td>${fmt(c.paid)}</td><td><b style="color:${c.total - c.paid > 0 ? 'var(--red)' : 'inherit'}">${fmt(c.total - c.paid)}</b></td>
    <td><span class="pill ${c.status === 'ادا شدہ' ? 'green' : c.status === 'جزوی' ? 'amber' : 'red'}">${esc(c.status)}</span></td>
    <td>${c.paid < c.total ? `<button class="btn btn-sm btn-primary" onclick="collectForm('${c.id}')">وصول</button>` : ''} <button class="btn btn-sm" onclick="feeReceipt('${c.id}')">🖨 رسید</button> <button class="btn btn-sm" onclick="studentLedger('${c.studentId}')">لیجر</button></td></tr>`; }).join('') || '<tr><td colspan="7" class="mut">اس ماہ کے چارج نہیں بنے — اوپر والا بٹن دبائیں</td></tr>'}
  </table></div>
  ${dues.length ? `<div class="panel"><h3>⚠️ بقایا دار طلبہ (${dues.length})</h3><p class="mut">سرپرستوں کو وٹس ایپ یاددہانی بھیجیں:</p>
  ${dues.slice(0, 20).map(c => { const s = studentById(c.studentId) || {}; return `<p>• ${esc(s.name)} — باقی ${fmt(c.total - c.paid)} ${s.guardianPhone ? `<a target="_blank" href="https://wa.me/92${String(s.guardianPhone).replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(DB.madrasa.name + ': السلام علیکم! ' + s.name + ' کی فیس برائے ' + m + ' بقایا ہے: ' + fmt(c.total - c.paid) + '۔ مہربانی فرما کر ادا کریں۔ جزاک اللہ')}">📱 وٹس ایپ یاددہانی</a>` : ''}</p>`; }).join('')}</div>` : ''}`;
}
function genCharges(m) {
  DB.students.filter(s => s.status === 'فعال').forEach(s => { if (!DB.charges.some(c => c.studentId === s.id && c.month === m)) DB.charges.push({ id: uid('ch'), studentId: s.id, month: m, total: s.monthlyFee, paid: 0, status: 'باقی', dueDate: m + '-10' }); });
  save(); renderFees(); toast('چارج بن گئے');
}
function collectForm(chargeId) {
  const open = DB.charges.filter(c => c.paid < c.total);
  if (!open.length) { toast('کوئی بقایا چارج نہیں'); return; }
  openModal(`<h3>💰 فیس وصولی</h3><form onsubmit="saveCollect(event)">
    <div class="form-grid">
      ${field('چارج منتخب کریں', `<select name="chargeId">${open.map(c => `<option value="${c.id}" ${c.id === chargeId ? 'selected' : ''}>${esc(studentName(c.studentId))} — ${esc(c.month)} — باقی ${fmt(c.total - c.paid)}</option>`).join('')}</select>`)}
      ${field('رقم', `<input name="amount" type="number" min="1" required>`)}
      ${field('تاریخ', `<input name="date" type="date" value="${todayStr()}">`)}
      ${field('طریقہ', `<select name="account"><option>کیش</option><option>بینک</option></select>`)}
    </div>
    <div class="form-actions"><button type="button" class="btn" onclick="closeModal()">منسوخ</button><button class="btn btn-primary">وصول کریں</button></div></form>`);
}
function saveCollect(e) {
  e.preventDefault(); const f = new FormData(e.target);
  const c = DB.charges.find(x => x.id === f.get('chargeId')); if (!c) return;
  const amt = Math.min(Number(f.get('amount')) || 0, c.total - c.paid);
  c.paid += amt; c.status = c.paid >= c.total ? 'ادا شدہ' : 'جزوی';
  const ref = 1000 + DB.ledger.length + 1;
  DB.ledger.push({ id: uid('lg'), date: f.get('date'), kind: 'آمدن', category: 'فیس', account: f.get('account'), amount: amt, desc: 'فیس وصولی — ' + studentName(c.studentId) + ' (' + c.month + ')', refNo: ref, by: myName() });
  save(); closeModal(); renderFees(); toast('وصولی درج — رسید نمبر ' + ref);
}
function feeReceipt(cid) {
  const c = DB.charges.find(x => x.id === cid); const s = studentById(c.studentId) || {};
  printHTML('فیس رسید', `<table width="100%" cellpadding="8"><tr><td>طالب علم</td><td><b>${esc(s.name)}</b> ولد ${esc(s.father)}</td></tr><tr><td>درجہ</td><td>${esc(className(s.classId))}</td></tr><tr><td>ماہ</td><td>${esc(c.month)}</td></tr><tr><td>کل فیس</td><td>${fmt(c.total)}</td></tr><tr><td>وصول شدہ</td><td><b>${fmt(c.paid)}</b></td></tr><tr><td>باقی</td><td>${fmt(c.total - c.paid)}</td></tr><tr><td>وصول کنندہ</td><td>${esc(myName())}</td></tr></table><p style="text-align:center;margin-top:16px">جزاک اللہ خیراً</p>`);
}
function studentLedger(sid) {
  const s = studentById(sid); const rows = DB.charges.filter(c => c.studentId === sid).sort((a, b) => a.month.localeCompare(b.month));
  openModal(`<h3>📒 لیجر — ${esc(s.name)}</h3><table><tr><th>ماہ</th><th>کل</th><th>وصول</th><th>باقی</th><th>حالت</th></tr>
  ${rows.map(c => `<tr><td>${esc(c.month)}</td><td>${fmt(c.total)}</td><td>${fmt(c.paid)}</td><td>${fmt(c.total - c.paid)}</td><td>${esc(c.status)}</td></tr>`).join('') || '<tr><td colspan="5" class="mut">ریکارڈ نہیں</td></tr>'}
  </table><div class="form-actions"><button class="btn" onclick="closeModal()">بند کریں</button></div>`);
}

/* ---------- exams & results ---------- */
function renderExams() {
  $('#page').innerHTML = `
  <div class="toolbar"><span class="sp"></span><button class="btn btn-primary" onclick="examForm()">＋ نیا امتحان</button></div>
  ${DB.exams.map(ex => { const cls = classById(ex.classId); const ent = DB.results[ex.id] || {};
    const rows = DB.students.filter(s => s.classId === ex.classId && s.status === 'فعال').map(s => { const r = ent[s.id] || {}; const tot = ex.subjects.reduce((a, x) => a + (Number(r[x.name]) || 0), 0); const mt = ex.subjects.reduce((a, x) => a + x.total, 0); const pct = mt ? tot / mt * 100 : 0; return { s, tot, mt, pct }; }).sort((a, b) => b.tot - a.tot);
    return `<div class="panel"><h3>📝 ${esc(ex.term)} — ${esc(cls ? cls.name : '')}</h3>
    <p class="mut small">کتابیں: ${ex.subjects.map(x => esc(x.name) + ' (' + x.total + ')').join('، ')}</p>
    <table><tr><th>پوزیشن</th><th>طالب علم</th>${ex.subjects.map(x => `<th>${esc(x.name)}</th>`).join('')}<th>کل</th><th>فیصد</th><th>درجہ</th><th></th></tr>
    ${rows.map((r, i) => `<tr><td>${ent[r.s.id] ? i + 1 : '—'}</td><td><b>${esc(r.s.name)}</b></td>${ex.subjects.map(x => `<td>${ent[r.s.id] ? (ent[r.s.id][x.name] ?? 0) : '—'}</td>`).join('')}<td><b>${ent[r.s.id] ? r.tot + '/' + r.mt : '—'}</b></td><td>${ent[r.s.id] ? r.pct.toFixed(1) + '%' : '—'}</td><td>${ent[r.s.id] ? `<span class="pill ${r.pct >= 50 ? 'green' : 'red'}">${gradeFor(r.pct).label}</span>` : '—'}</td>
    <td><button class="btn btn-sm" onclick="marksForm('${ex.id}','${r.s.id}')">نمبر درج کریں</button> ${ent[r.s.id] ? `<button class="btn btn-sm" onclick="resultCard('${ex.id}','${r.s.id}')">🖨 کارڈ</button>` : ''}</td></tr>`).join('')}
    </table></div>`; }).join('') || '<div class="panel mut">ابھی کوئی امتحان نہیں — نیا امتحان بنائیں۔</div>'}`;
}
function examForm() {
  openModal(`<h3>نیا امتحان</h3><form onsubmit="saveExam(event)">
    <div class="form-grid">
      ${field('امتحان کا نام *', `<input name="term" required placeholder="مثلاً ششماہی امتحان 2026">`)}
      ${field('درجہ', `<select name="classId">${DB.classes.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>`)}
      ${field('کتابیں (ہر سطر: نام،کل نمبر)', `<textarea name="subjects" rows="6">قرآن مجید (حفظ/تلاوت)،100
حدیث،50
فقہ،50
صرف،50
نحو،50
سیرت،50</textarea>`, true)}
    </div>
    <div class="form-actions"><button type="button" class="btn" onclick="closeModal()">منسوخ</button><button class="btn btn-primary">امتحان بنائیں</button></div></form>`);
}
function saveExam(e) {
  e.preventDefault(); const f = new FormData(e.target);
  const subjects = f.get('subjects').split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [name, total] = l.split(/[،,]/); return { name: (name || '').trim(), total: Number(total) || 100 }; }).filter(x => x.name);
  DB.exams.unshift({ id: uid('ex'), term: f.get('term').trim(), classId: f.get('classId'), subjects });
  save(); closeModal(); renderExams(); toast('امتحان بن گیا');
}
function marksForm(exId, sid) {
  const ex = DB.exams.find(x => x.id === exId); const cur = (DB.results[exId] || {})[sid] || {};
  openModal(`<h3>نمبرات — ${esc(studentName(sid))}</h3><form onsubmit="saveMarks(event,'${exId}','${sid}')">
    <div class="form-grid">${ex.subjects.map(x => field(esc(x.name) + ' (کل ' + x.total + ')', `<input name="m_${esc(x.name)}" type="number" min="0" max="${x.total}" value="${cur[x.name] ?? ''}">`)).join('')}</div>
    <div class="form-actions"><button type="button" class="btn" onclick="closeModal()">منسوخ</button><button class="btn btn-primary">محفوظ کریں</button></div></form>`);
}
function saveMarks(e, exId, sid) {
  e.preventDefault(); const f = new FormData(e.target); const ex = DB.exams.find(x => x.id === exId);
  DB.results[exId] = DB.results[exId] || {}; const r = {};
  ex.subjects.forEach(x => r[x.name] = Number(f.get('m_' + x.name)) || 0);
  r._by = myName(); DB.results[exId][sid] = r;
  save(); closeModal(); renderExams(); toast('نمبرات محفوظ — درج کنندہ: ' + myName());
}
function resultCard(exId, sid) {
  const ex = DB.exams.find(x => x.id === exId); const r = (DB.results[exId] || {})[sid]; const s = studentById(sid); if (!r) return;
  const tot = ex.subjects.reduce((a, x) => a + (Number(r[x.name]) || 0), 0), mt = ex.subjects.reduce((a, x) => a + x.total, 0), pct = mt ? tot / mt * 100 : 0;
  printHTML('رزلٹ کارڈ', `<table width="100%" cellpadding="8"><tr><td>طالب علم</td><td><b>${esc(s.name)}</b> ولد ${esc(s.father)}</td><td>درجہ</td><td>${esc(className(s.classId))}</td></tr><tr><td>امتحان</td><td>${esc(ex.term)}</td><td>رول نمبر</td><td>${s.roll}</td></tr></table>
  <table border="1" cellspacing="0" cellpadding="8" width="100%" style="margin-top:12px"><tr><th>کتاب</th><th>کل نمبر</th><th>حاصل کردہ</th></tr>
  ${ex.subjects.map(x => `<tr><td>${esc(x.name)}</td><td>${x.total}</td><td>${r[x.name] ?? 0}</td></tr>`).join('')}
  <tr><td><b>مجموعہ</b></td><td><b>${mt}</b></td><td><b>${tot}</b></td></tr></table>
  <p style="margin-top:12px">فیصد: <b>${pct.toFixed(1)}%</b> · درجہ: <b>${gradeFor(pct).label} (${gradeFor(pct).en})</b></p>
  <p style="margin-top:26px">دستخطِ استاد: ________________&nbsp;&nbsp;&nbsp; دستخطِ ناظم: ________________</p>`);
}

/* ---------- accounts (finance) ---------- */
function renderAccounts() {
  const inc = DB.ledger.filter(l => l.kind === 'آمدن').reduce((a, l) => a + l.amount, 0);
  const exp = DB.ledger.filter(l => l.kind === 'خرچ').reduce((a, l) => a + l.amount, 0);
  const payDue = DB.staff.reduce((a, t) => a + t.salary, 0);
  $('#page').innerHTML = `
  <div class="cards"><div class="stat"><b>${fmt(inc)}</b><span>کل آمدن</span></div><div class="stat"><b>${fmt(exp)}</b><span>کل خرچ</span></div>
  <div class="stat"><b>${fmt(inc - exp)}</b><span>بیلنس</span></div><div class="stat"><b>${fmt(payDue)}</b><span>ماہانہ تنخواہیں (کل اسٹاف)</span></div></div>
  <div class="toolbar"><span class="sp"></span><button class="btn" onclick="exportLedger()">⬇ CSV</button><button class="btn btn-primary" onclick="ledgerForm()">＋ نیا اندراج</button></div>
  <div class="panel"><table><tr><th>رسید #</th><th>تاریخ</th><th>قسم</th><th>زمرہ</th><th>اکاؤنٹ</th><th>تفصیل</th><th>رقم</th><th>درج کنندہ</th><th></th></tr>
  ${DB.ledger.slice().sort((a, b) => b.date.localeCompare(a.date) || b.refNo - a.refNo).map(l => `<tr><td>${l.refNo}</td><td>${esc(l.date)}</td>
    <td><span class="pill ${l.kind === 'آمدن' ? 'green' : 'red'}">${esc(l.kind)}</span></td><td>${esc(l.category)}</td><td>${esc(l.account)}</td><td>${esc(l.desc)}</td>
    <td><b>${fmt(l.amount)}</b></td><td><span class="pill grey">${esc(l.by || '')}</span></td>
    <td><button class="btn btn-sm btn-danger" onclick="confirmBox('اندراج حذف کریں؟',()=>delLedger('${l.id}'))">حذف</button></td></tr>`).join('')}
  </table></div>`;
}
function ledgerForm() {
  openModal(`<h3>نیا مالی اندراج</h3><form onsubmit="saveLedger(event)">
    <div class="form-grid">
      ${field('قسم', `<select name="kind"><option>آمدن</option><option>خرچ</option></select>`)}
      ${field('زمرہ', `<select name="category">${DB.settings.categories.map(c => `<option>${esc(c)}</option>`).join('')}</select>`)}
      ${field('رقم *', `<input name="amount" type="number" min="1" required>`)}
      ${field('اکاؤنٹ', `<select name="account"><option>کیش</option><option>بینک</option></select>`)}
      ${field('تاریخ', `<input name="date" type="date" value="${todayStr()}">`)}
      ${field('تفصیل', `<input name="desc" placeholder="مثلاً بجلی کا بل / عطیہ">`)}
    </div>
    <div class="form-actions"><button type="button" class="btn" onclick="closeModal()">منسوخ</button><button class="btn btn-primary">درج کریں</button></div></form>`);
}
function saveLedger(e) { e.preventDefault(); const f = new FormData(e.target); const ref = 1000 + DB.ledger.length + 1; DB.ledger.push({ id: uid('lg'), date: f.get('date'), kind: f.get('kind'), category: f.get('category'), account: f.get('account'), amount: Number(f.get('amount')) || 0, desc: f.get('desc').trim(), refNo: ref, by: myName() }); save(); closeModal(); renderAccounts(); toast('اندراج ہو گیا — رسید نمبر ' + ref); }
function delLedger(id) { DB.ledger = DB.ledger.filter(l => l.id !== id); save(); renderAccounts(); }
function exportLedger() { const rows = [['رسید', 'تاریخ', 'قسم', 'زمرہ', 'اکاؤنٹ', 'تفصیل', 'رقم', 'درج کنندہ']].concat(DB.ledger.map(l => [l.refNo, l.date, l.kind, l.category, l.account, l.desc, l.amount, l.by || ''])); download('ledger.csv', rows.map(r => r.map(csvCell).join(',')).join('\n')); }

/* ---------- announcements + WhatsApp alerts ---------- */
function renderAnnounce() {
  const t = todayStr(); const absent = [];
  Object.entries(DB.att).filter(([k]) => k.startsWith(t + '|')).forEach(([k, marks]) => { const cls = k.split('|')[1]; Object.entries(marks).forEach(([sid, v]) => { if (v === 'غیر حاضر') { const s = studentById(sid); if (s) absent.push({ s, cls }); } }); });
  $('#page').innerHTML = `
  <div class="grid2"><div class="panel"><h3>📢 نیا اعلان</h3>
    <form onsubmit="saveAnnounce(event)"><div class="form-grid">
      ${field('عنوان', `<input name="title" required placeholder="مثلاً چھٹی کا اعلان">`)}
      ${field('کس کے لیے', `<select name="target"><option>تمام طلبہ</option><option>اساتذہ</option><option>سرپرست</option></select>`)}
      ${field('تفصیل', `<textarea name="body" rows="3" required></textarea>`, true)}
    </div><div class="form-actions"><button class="btn btn-primary">اعلان شائع کریں</button></div></form>
    ${DB.announcements.slice().reverse().map(a => `<div style="border-top:1px dashed var(--line);padding:10px 0"><b>${esc(a.title)}</b> <span class="pill blue">${esc(a.target)}</span><br>${esc(a.body)}<br><span class="mut small">${esc(a.date)} · بذریعہ ${esc(a.by || '')}</span> <button class="btn btn-sm btn-danger" onclick="confirmBox('اعلان حذف کریں؟',()=>delAnnounce('${a.id}'))">حذف</button></div>`).join('')}
  </div>
  <div class="panel"><h3>📱 آج کے غیر حاضر طلبہ — وٹس ایپ الرٹس (${absent.length})</h3>
    ${absent.length ? absent.map(({ s, cls }) => `<p>• <b>${esc(s.name)}</b> (${esc(className(cls))}) — سرپرست: ${esc(s.father)} ${s.guardianPhone ? `<a target="_blank" href="https://wa.me/92${String(s.guardianPhone).replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(DB.madrasa.name + ': السلام علیکم! آپ کا بچہ ' + s.name + ' آج (' + t + ') مدرسہ سے غیر حاضر ہے۔ — ' + DB.madrasa.name)}">📱 الرٹ بھیجیں</a>` : ''}</p>`).join('') : '<p class="mut">آج کوئی طالب علم غیر حاضر نہیں (یا حاضری ابھی نہیں لگی)۔</p>'}
    <p class="mut small">نوٹ: الرٹ بٹن دبانے سے وٹس ایپ میں تیار پیغام کھلتا ہے — بھیجنا آپ کے اپنے نمبر سے ہوگا۔</p></div></div>`;
}
function saveAnnounce(e) { e.preventDefault(); const f = new FormData(e.target); DB.announcements.push({ id: uid('an'), date: todayStr(), title: f.get('title').trim(), body: f.get('body').trim(), target: f.get('target'), by: myName() }); save(); renderAnnounce(); toast('اعلان شائع ہو گیا'); }
function delAnnounce(id) { DB.announcements = DB.announcements.filter(a => a.id !== id); save(); renderAnnounce(); }

/* ---------- users & roles ---------- */
function renderUsers() {
  const cu = currentUser();
  const acts = {}; DB.sabaq.forEach(x => { if (x.by) acts[x.by] = (acts[x.by] || 0) + 1; }); DB.ledger.forEach(l => { if (l.by) acts[l.by] = (acts[l.by] || 0) + 1; });
  $('#page').innerHTML = `<div class="panel"><h3>🔐 صارفین و رولز — ہر صارف کا اپنا لاگ اِن، اپنے ریکارڈز</h3>
  <p class="mut" style="margin-bottom:12px">جو صارف بھی بنائیں گے، وہ اپنے ای میل و پاس ورڈ سے لاگ اِن کرے گا۔ اس کے درج کردہ اسباق، وصولیاں، مالی اندراج اور اعلانات اس کے نام سے محفوظ ہوں گے اور الگ گنے/دیکھے جا سکتے ہیں۔</p>
  <table><tr><th>نام</th><th>ای میل (لاگ اِن)</th><th>رول</th><th>کل اندراج (اسباق+مالیات)</th><th></th></tr>
  ${DB.users.map(u => `<tr><td><b>${esc(u.name)}</b>${cu && u.id === cu.id ? ' <span class="pill green">آپ</span>' : ''}</td><td dir="ltr">${esc(u.email)}</td><td><span class="pill blue">${esc(u.role)}</span></td><td>${acts[u.name] || 0}</td>
  <td>${cu && u.id === cu.id ? '' : `<button class="btn btn-sm btn-danger" onclick="confirmBox('صارف ${esc(u.name)} حذف کریں؟',()=>delUser('${u.id}'))">حذف</button>`}</td></tr>`).join('')}</table>
  <form onsubmit="addUser(event)" style="margin-top:16px"><div class="form-grid">
    ${field('پورا نام', `<input id="nu_name" required placeholder="مثلاً قاری محمد اسلم">`)}
    ${field('ای میل (لاگ اِن)', `<input id="nu_email" type="email" required placeholder="name@madaris.pk">`)}
    ${field('پاس ورڈ', `<input id="nu_pass" required placeholder="پاس ورڈ مقرر کریں">`)}
    ${field('رول', `<select id="nu_role"><option>منتظم</option><option>استاد</option><option>محاسب</option><option>عملہ</option></select>`)}
  </div><div class="form-actions"><button class="btn btn-primary" type="submit">＋ صارف بنائیں</button></div></form></div>`;
}
function addUser(e) { e.preventDefault(); const email = $('#nu_email').value.trim().toLowerCase(); if (DB.users.some(u => u.email.toLowerCase() === email)) { toast('اس ای میل سے صارف پہلے سے موجود ہے'); return; } DB.users.push({ id: uid('u'), name: $('#nu_name').value.trim(), email, pass: $('#nu_pass').value, role: $('#nu_role').value }); save(); renderUsers(); toast('صارف بن گیا — اب وہ اپنے لاگ اِن سے داخل ہو سکتا ہے'); }
function delUser(id) { DB.users = DB.users.filter(u => u.id !== id); save(); renderUsers(); }

/* ---------- settings ---------- */
function renderSettings() {
  const m = DB.madrasa;
  $('#page').innerHTML = `
  <div class="grid2"><div class="panel"><h3>🏫 مدرسہ کی معلومات</h3>
    <form onsubmit="saveMadrasa(event)"><div class="form-grid">
      ${field('مدرسہ کا نام', `<input id="sm_name" value="${esc(m.name)}">`)}
      ${field('شہر', `<input id="sm_city" value="${esc(m.city)}">`)}
      ${field('پتہ', `<input id="sm_addr" value="${esc(m.address)}">`)}
      ${field('فون / وٹس ایپ', `<input id="sm_phone" value="${esc(m.phone)}" dir="ltr">`)}
      ${field('مہتمم / ناظم', `<input id="sm_prin" value="${esc(m.principal)}">`)}
    </div><div class="form-actions"><button class="btn btn-primary">محفوظ کریں</button></div></form></div>
  <div class="panel"><h3>📚 درجات و شعبے</h3>
    <table><tr><th>درجہ</th><th>شعبہ</th><th>مسئول استاد</th><th>ماہانہ فیس</th></tr>
    ${DB.classes.map(c => `<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.stream)}</td><td>${esc(staffName(c.teacherId))}</td><td>${fmt(c.fee)}</td></tr>`).join('')}</table>
    <form onsubmit="addClass(event)" style="margin-top:12px"><div class="form-grid">
      ${field('نیا درجہ', `<input id="nc_name" required placeholder="مثلاً درجہ رابعہ">`)}
      ${field('شعبہ', `<select id="nc_stream"><option>حفظ</option><option>ناظرہ</option><option>درس نظامی</option></select>`)}
      ${field('ماہانہ فیس', `<input id="nc_fee" type="number" min="0" value="1000">`)}
      ${field('مسئول استاد', `<select id="nc_teacher">${DB.staff.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select>`)}
    </div><div class="form-actions"><button class="btn btn-primary">＋ درجہ شامل کریں</button></div></form></div></div>
  <div class="panel"><h3>💾 ڈیٹا بیک اپ / منتقلی</h3>
    <p class="mut">پورا ریکارڈ JSON فائل میں اتاریں یا پرانا بیک اپ واپس چڑھائیں۔ نئے مدرسہ کے لیے رجسٹریشن پر: مدرسہ کا نام، لوگو، یوزر نیم، ای میل و وٹس ایپ نمبر درکار ہوتا ہے — ہر مدرسہ/صارف کا ڈیٹا الگ محفوظ رہتا ہے۔</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">
      <button class="btn" onclick="backupData()">⬇ بیک اپ اتاریں (JSON)</button>
      <label class="btn" style="cursor:pointer">⬆ بیک اپ چڑھائیں<input type="file" accept=".json" hidden onchange="restoreData(this)"></label>
      <button class="btn btn-danger" onclick="confirmBox('تمام ڈیٹا اصل ڈیمو پر واپس جائے گا — جاری رکھیں؟',()=>{localStorage.removeItem(DB_KEY);location.reload();})">ڈیمو ری سیٹ</button>
    </div></div>`;
}
function saveMadrasa(e) { e.preventDefault(); DB.madrasa = { name: $('#sm_name').value, city: $('#sm_city').value, address: $('#sm_addr').value, phone: $('#sm_phone').value, principal: $('#sm_prin').value }; save(); showApp(); toast('مدرسہ کی معلومات محفوظ'); }
function addClass(e) { e.preventDefault(); DB.classes.push({ id: uid('c'), name: $('#nc_name').value.trim(), stream: $('#nc_stream').value, fee: Number($('#nc_fee').value) || 0, teacherId: $('#nc_teacher').value }); save(); renderSettings(); toast('درجہ شامل ہو گیا'); }
function backupData() { download('madaris-backup-' + todayStr() + '.json', JSON.stringify(DB, null, 1), 'application/json'); }
function restoreData(input) { const file = input.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => { try { const d = JSON.parse(r.result); if (!d.students) throw 0; DB = d; if (!DB.users) DB.users = defaultUsers(); save(); toast('بیک اپ بحال ہو گیا'); showApp(); } catch (e) { toast('غلط فائل ہے'); } }; r.readAsText(file); }

/* ---------- init ---------- */
load();
if (localStorage.getItem(SESSION_KEY)) showApp();
