// Servidor de Talent Hub: sirve la app y guarda talentos, clientes y archivos en data/ (SQLite + carpeta cvs).
// Uso: node server.mjs   (configuración en .env: PORT, TH_SECRET, BACKUP_DIR; usuarios con scripts/usuario.mjs)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries((fs.existsSync(path.join(ROOT, '.env')) ? fs.readFileSync(path.join(ROOT, '.env'), 'utf8') : '')
  .split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
const PORT = Number(env.PORT) || 3200;
if (!env.TH_SECRET) { console.error('Falta TH_SECRET en .env'); process.exit(1); }

const DATA = path.join(ROOT, 'data');
const CVS = path.join(DATA, 'cvs');
fs.mkdirSync(CVS, { recursive: true });
const db = new DatabaseSync(path.join(DATA, 'talenthub.db'));
db.exec('PRAGMA journal_mode = WAL');
// Cada fila es un documento JSON: la app agrega campos sin necesidad de migraciones.
const TABLES = ['talents', 'clients'];
for (const t of TABLES) db.exec(`CREATE TABLE IF NOT EXISTS ${t} (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL)`);
// Solo pueden entrar los usuarios de esta tabla (se crean con scripts/usuario.mjs).
db.exec('CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, nombre TEXT NOT NULL, hash TEXT NOT NULL)');

const rowOf = (r) => ({ ...JSON.parse(r.data), id: r.id });
const getRow = (t, id) => { const r = db.prepare(`SELECT id, data FROM ${t} WHERE id = ?`).get(id); return r && rowOf(r); };

// ---- Usuarios: contraseña con scrypt ("sal:hash") ----
const getUser = (email) => db.prepare('SELECT email, nombre, hash FROM users WHERE email = ?').get(String(email).trim().toLowerCase());
function checkPassword(user, password) {
  if (!user) return false;
  const [salt, hash] = user.hash.split(':');
  return crypto.timingSafeEqual(crypto.scryptSync(String(password), salt, 32), Buffer.from(hash, 'hex'));
}
const hashPassword = (password) => { const salt = crypto.randomBytes(16).toString('hex'); return `${salt}:${crypto.scryptSync(password, salt, 32).toString('hex')}`; };

// ---- Sesión: cookie firmada (sobrevive a reinicios), 30 días ----
// La firma incluye el hash de la contraseña: al cambiarla, se cierran las otras sesiones de ese usuario.
const SESSION_DAYS = 30;
const sign = (s, user) => crypto.createHmac('sha256', env.TH_SECRET).update(`${s}.${user.hash}`).digest('base64url');
function makeCookie(user, secure) {
  const v = `${Buffer.from(user.email).toString('base64url')}.${Date.now() + SESSION_DAYS * 864e5}`;
  return `th_sesion=${v}.${sign(v, user)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure ? '; Secure' : ''}`;
}
function sessionOf(req) {
  const m = (req.headers.cookie || '').match(/(?:^|;\s*)th_sesion=([^.;]+)\.(\d+)\.([^;]+)/);
  if (!m || Number(m[2]) < Date.now()) return null;
  const user = getUser(Buffer.from(m[1], 'base64url').toString());
  if (!user) return null;
  const expected = sign(`${m[1]}.${m[2]}`, user);
  if (expected.length !== m[3].length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(m[3]))) return null;
  return user;
}
const isHttps = (req) => /https/.test(req.headers['cf-visitor'] || '');

// ---- Copia de seguridad diaria: base (VACUUM INTO) y archivos, se guardan las últimas 14 ----
let lastBackup = null;
function backup() {
  if (!env.BACKUP_DIR) return;
  try {
    const dir = env.BACKUP_DIR;
    fs.mkdirSync(path.join(dir, 'cvs'), { recursive: true });
    const file = path.join(dir, `talenthub-${new Date().toISOString().slice(0, 10)}.db`);
    fs.rmSync(file, { force: true });
    db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
    for (const f of fs.readdirSync(CVS)) {
      const dst = path.join(dir, 'cvs', f);
      if (!fs.existsSync(dst)) fs.copyFileSync(path.join(CVS, f), dst);
    }
    fs.readdirSync(dir).filter((f) => /^talenthub-.*\.db$/.test(f)).sort().slice(0, -14).forEach((f) => fs.rmSync(path.join(dir, f)));
    lastBackup = new Date().toISOString();
    console.log(`${lastBackup} copia de seguridad en ${file}`);
  } catch (e) { console.error('Error en la copia de seguridad:', e.message); }
}
backup();
setInterval(backup, 864e5);

// ---- HTTP ----
const STATIC = {
  '/': 'index.html', '/index.html': 'index.html', '/app.html': 'app.html', '/app.js': 'app.js',
  '/notebook-abierta.png': 'notebook-abierta.png', '/notebook-cerrada.png': 'notebook-cerrada.png',
};
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.pdf': 'application/pdf', '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
const MAX_BODY = 30 * 1024 * 1024;

const send = (res, code, body, headers = {}) => {
  const isJson = typeof body !== 'string' && !Buffer.isBuffer(body);
  res.writeHead(code, { 'Content-Type': isJson ? 'application/json' : 'text/plain; charset=utf-8', ...headers });
  res.end(isJson ? JSON.stringify(body) : body);
};
const readBody = (req) => new Promise((ok, fail) => {
  const chunks = []; let size = 0;
  req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { fail(new Error('Archivo demasiado grande')); req.destroy(); } else chunks.push(c); });
  req.on('end', () => ok(Buffer.concat(chunks)));
  req.on('error', fail);
});
const safeName = (n) => /^[\w.-]+$/.test(n) && !n.startsWith('.') ? n : null;

// ---- Límite de intentos de login: 5 fallidos en 15 min (por IP o por email) bloquean 15 min ----
const MAX_FAILS = 5;
const FAIL_WINDOW = 15 * 60e3;
const fails = new Map();
// Por el túnel todo llega desde localhost: la IP real la manda Cloudflare.
const viaTunnel = (req) => !!req.headers['cf-connecting-ip'];
const clientIp = (req) => req.headers['cf-connecting-ip'] || req.socket.remoteAddress;
const isBlocked = (keys) => keys.some((k) => { const f = fails.get(k); return f && Date.now() - f.first < FAIL_WINDOW && f.n >= MAX_FAILS; });
function addFail(keys) {
  for (const k of keys) {
    const f = fails.get(k);
    fails.set(k, f && Date.now() - f.first < FAIL_WINDOW ? { ...f, n: f.n + 1 } : { n: 1, first: Date.now() });
  }
}
setInterval(() => { for (const [k, f] of fails) if (Date.now() - f.first >= FAIL_WINDOW) fails.delete(k); }, FAIL_WINDOW);

// ---- Cabeceras de seguridad en todas las respuestas ----
const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com",
    "worker-src 'self' blob: https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://cdnjs.cloudflare.com",
    "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // Que los buscadores no la indexen: es de uso interno.
  'X-Robots-Tag': 'noindex, nofollow',
};

async function handle(req, res) {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
  const url = new URL(req.url, 'http://x');
  const p = decodeURIComponent(url.pathname);

  if (req.method === 'GET' && p === '/robots.txt') return send(res, 200, 'User-agent: *\nDisallow: /\n');

  if (req.method === 'GET' && STATIC[p]) {
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(STATIC[p])], 'Cache-Control': 'no-cache' });
    return fs.createReadStream(path.join(ROOT, STATIC[p])).pipe(res);
  }
  // Para el panel del servidor (solo desde la notebook, no por el túnel): sin datos personales.
  if (req.method === 'GET' && p === '/salud' && !viaTunnel(req)) {
    const n = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
    return send(res, 200, { ok: true, talentos: n('talents'), clientes: n('clients'), archivos: fs.readdirSync(CVS).length, ultimaCopia: lastBackup });
  }
  if (req.method === 'POST' && p === '/api/login') {
    const { email = '', password = '' } = JSON.parse((await readBody(req)).toString() || '{}');
    const keys = [`ip:${clientIp(req)}`, `email:${String(email).trim().toLowerCase()}`];
    if (isBlocked(keys)) return send(res, 429, { error: 'Demasiados intentos. Probá de nuevo en 15 minutos.' });
    const user = getUser(email);
    if (!checkPassword(user, password)) {
      addFail(keys);
      console.log(`${new Date().toISOString()} login fallido: ${String(email).slice(0, 80)} desde ${clientIp(req)}`);
      return send(res, 401, { error: 'Credenciales inválidas' });
    }
    keys.forEach((k) => fails.delete(k));
    return send(res, 200, { email: user.email, nombre: user.nombre }, { 'Set-Cookie': makeCookie(user, isHttps(req)) });
  }
  if (req.method === 'POST' && p === '/api/logout') return send(res, 200, { ok: true }, { 'Set-Cookie': 'th_sesion=; Path=/; Max-Age=0' });

  // De acá en adelante, todo requiere sesión.
  if (!p.startsWith('/api/') && !p.startsWith('/cvs/')) return send(res, 404, 'No encontrado');
  const user = sessionOf(req);
  if (!user) return send(res, 401, { error: 'Sesión vencida' });

  if (req.method === 'POST' && p === '/api/password') {
    const { actual = '', nueva = '' } = JSON.parse((await readBody(req)).toString() || '{}');
    if (!checkPassword(user, actual)) return send(res, 400, { error: 'La contraseña actual no es correcta' });
    if (String(nueva).length < 8) return send(res, 400, { error: 'La nueva contraseña debe tener al menos 8 caracteres' });
    db.prepare('UPDATE users SET hash = ? WHERE email = ?').run(hashPassword(String(nueva)), user.email);
    console.log(`${new Date().toISOString()} ${user.email} cambió su contraseña`);
    return send(res, 200, { ok: true }, { 'Set-Cookie': makeCookie(getUser(user.email), isHttps(req)) });
  }

  const cv = p.match(/^\/(?:api\/)?cvs\/([^/]+)$/);
  if (cv) {
    const name = safeName(cv[1]);
    if (!name) return send(res, 400, { error: 'Nombre inválido' });
    const file = path.join(CVS, name);
    if (req.method === 'GET') {
      if (!fs.existsSync(file)) return send(res, 404, 'No encontrado');
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(name).toLowerCase()] || 'application/octet-stream' });
      return fs.createReadStream(file).pipe(res);
    }
    if (req.method === 'PUT') {
      if (fs.existsSync(file)) return send(res, 409, { error: 'Ya existe' });
      fs.writeFileSync(file, await readBody(req));
      return send(res, 200, { path: name });
    }
    if (req.method === 'DELETE') { fs.rmSync(file, { force: true }); return send(res, 200, { ok: true }); }
  }

  const m = p.match(/^\/api\/(talents|clients)(?:\/(\d+))?$/);
  if (!m) return send(res, 404, { error: 'No encontrado' });
  const [, t, idStr] = m;
  const id = idStr && Number(idStr);

  if (req.method === 'GET' && !id) {
    const desc = url.searchParams.get('order') === 'desc';
    return send(res, 200, db.prepare(`SELECT id, data FROM ${t} ORDER BY id ${desc ? 'DESC' : 'ASC'}`).all().map(rowOf));
  }
  if (req.method === 'POST' && !id) {
    const rows = [].concat(JSON.parse((await readBody(req)).toString()));
    const ins = db.prepare(`INSERT INTO ${t} (id, data) VALUES (?, ?)`);
    const out = rows.map((r) => {
      const { id: rid, ...rest } = r;
      const info = ins.run(rid ?? null, JSON.stringify({ created_at: new Date().toISOString(), ...rest }));
      return getRow(t, Number(info.lastInsertRowid));
    });
    return send(res, 201, out);
  }
  if (req.method === 'PATCH' && id) {
    const cur = getRow(t, id);
    if (!cur) return send(res, 404, { error: 'No existe' });
    const { id: _, ...changes } = JSON.parse((await readBody(req)).toString());
    const { id: __, ...data } = { ...cur, ...changes };
    db.prepare(`UPDATE ${t} SET data = ? WHERE id = ?`).run(JSON.stringify(data), id);
    return send(res, 200, [getRow(t, id)]);
  }
  if (req.method === 'DELETE' && id) {
    db.prepare(`DELETE FROM ${t} WHERE id = ?`).run(id);
    return send(res, 200, { ok: true });
  }
  send(res, 405, { error: 'Método no permitido' });
}

http.createServer((req, res) => handle(req, res).catch((e) => {
  console.error(new Date().toISOString(), req.method, req.url, e.message);
  if (!res.headersSent) send(res, 500, { error: e.message });
})).listen(PORT, () => console.log(`${new Date().toISOString()} Talent Hub en http://localhost:${PORT}`));
