'use strict';
/**
 * Madaris Software — zero-dependency Node.js backend.
 * Serves the static site (landing + app) and a JSON REST API.
 * Data is persisted to server/data.json (created on first run).
 *
 * Run:  node server/server.js        (or: npm start)
 * Open: http://localhost:8080
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(__dirname, 'data.json');

const COLLECTIONS = ['students', 'staff', 'challans', 'exams', 'ledger', 'leads', 'announcements', 'behaviour', 'payroll'];

function blankDb() {
  return {
    school: { name: 'The City Grammar School', city: 'Kohat', phone: '0922 510000', email: 'info@school.pk', address: 'Main Road, Kohat, KPK' },
    classes: [
      { id: 'c1', name: 'Class 1', fee: 3000 }, { id: 'c2', name: 'Class 2', fee: 3000 },
      { id: 'c5', name: 'Class 5', fee: 3500 }, { id: 'c8', name: 'Class 8', fee: 4500 },
      { id: 'c10', name: 'Class 10', fee: 5500 }
    ],
    subjects: ['English', 'Urdu', 'Mathematics', 'Science', 'Islamiyat', 'Computer'],
    students: [], staff: [], attendance: {}, challans: [], exams: [], marks: {},
    ledger: [], payroll: [], leads: [], behaviour: [], announcements: [], timetable: {}
  };
}
function loadDb() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch (e) { const db = blankDb(); saveDb(db); return db; }
}
function saveDb(db) { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }
let DB = loadDb();

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.md': 'text/plain' };
function sendJson(res, code, obj) { const body = JSON.stringify(obj); res.writeHead(code, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }); res.end(body); }
function readBody(req) {
  return new Promise(resolve => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 5e6) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { resolve({}); } });
  });
}
const idOf = () => crypto.randomBytes(6).toString('hex');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const parts = url.pathname.split('/').filter(Boolean);

  /* ---------- API ---------- */
  if (parts[0] === 'api') {
    // POST /api/login  {email, password} -> {token}   (demo auth — replace before production)
    if (parts[1] === 'login' && req.method === 'POST') {
      const b = await readBody(req);
      if (b.email === 'admin@school.pk' && b.password === 'admin123') return sendJson(res, 200, { token: 'demo-' + idOf(), user: { email: b.email, role: 'admin' } });
      return sendJson(res, 401, { error: 'Invalid credentials' });
    }
    // GET /api/db  -> whole database (used by the app when switching off localStorage mode)
    if (parts[1] === 'db' && req.method === 'GET') return sendJson(res, 200, DB);
    if (parts[1] === 'db' && req.method === 'PUT') { DB = await readBody(req); saveDb(DB); return sendJson(res, 200, { ok: true }); }
    // GET/PUT /api/attendance/:date
    if (parts[1] === 'attendance') {
      const date = parts[2];
      if (req.method === 'GET') return sendJson(res, 200, DB.attendance[date] || {});
      if (req.method === 'PUT') { DB.attendance[date] = await readBody(req); saveDb(DB); return sendJson(res, 200, { ok: true }); }
    }
    // Generic CRUD: /api/:collection[/:id]
    const coll = parts[1];
    if (COLLECTIONS.includes(coll)) {
      const id = parts[2];
      if (req.method === 'GET' && !id) return sendJson(res, 200, DB[coll]);
      if (req.method === 'GET' && id) { const it = DB[coll].find(x => x.id === id); return it ? sendJson(res, 200, it) : sendJson(res, 404, { error: 'Not found' }); }
      if (req.method === 'POST') { const b = await readBody(req); b.id = b.id || idOf(); DB[coll].push(b); saveDb(DB); return sendJson(res, 201, b); }
      if (req.method === 'PUT' && id) { const i = DB[coll].findIndex(x => x.id === id); if (i < 0) return sendJson(res, 404, { error: 'Not found' }); DB[coll][i] = { ...DB[coll][i], ...(await readBody(req)), id }; saveDb(DB); return sendJson(res, 200, DB[coll][i]); }
      if (req.method === 'DELETE' && id) { DB[coll] = DB[coll].filter(x => x.id !== id); saveDb(DB); return sendJson(res, 200, { ok: true }); }
    }
    return sendJson(res, 404, { error: 'Unknown API route' });
  }

  /* ---------- static files ---------- */
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  let filePath = path.join(ROOT, rel);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => console.log('Madaris Software running at http://localhost:' + PORT + '  (demo login: admin@school.pk / admin123)'));
