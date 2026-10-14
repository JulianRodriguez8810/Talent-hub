// Copia talentos, clientes y archivos de Supabase a data/ (se usa una vez, al mudar el proyecto).
// Uso: SUPABASE_KEY=<clave anon> node scripts/migrar-supabase.mjs   (con el servidor detenido; no hace nada si la base ya tiene datos)
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const SUPABASE_URL = 'https://nbyvtpiiyconbjqduyms.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;
if (!SUPABASE_KEY) { console.error('Falta SUPABASE_KEY'); process.exit(1); }
const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const CVS = path.join(DATA, 'cvs');
fs.mkdirSync(CVS, { recursive: true });
const db = new DatabaseSync(path.join(DATA, 'talenthub.db'));

const get = async (url, opts) => { const r = await fetch(url, { headers, ...opts }); if (!r.ok) throw new Error(`${r.status} ${url}`); return r; };
const LOCAL_CV = (u) => (typeof u === 'string' && u.includes('/storage/v1/object/public/cvs/') ? `/cvs/${u.split('/').pop()}` : u);

for (const t of ['talents', 'clients']) {
  db.exec(`CREATE TABLE IF NOT EXISTS ${t} (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL)`);
  if (db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n) { console.error(`La tabla ${t} ya tiene datos: no se migra.`); process.exit(1); }
  const rows = await (await get(`${SUPABASE_URL}/rest/v1/${t}?select=*&order=id`)).json();
  const ins = db.prepare(`INSERT INTO ${t} (id, data) VALUES (?, ?)`);
  for (const { id, ...rest } of rows) {
    // Enlaces a archivos de Supabase Storage pasan a apuntar al servidor propio.
    if (rest.cv_url) rest.cv_url = LOCAL_CV(rest.cv_url);
    if (Array.isArray(rest.archivos)) rest.archivos = rest.archivos.map((f) => ({ ...f, url: LOCAL_CV(f.url) }));
    ins.run(id, JSON.stringify(rest));
  }
  console.log(`${t}: ${rows.length}`);
}

const files = await (await get(`${SUPABASE_URL}/storage/v1/object/list/cvs`, {
  method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix: '', limit: 10000 }),
})).json();
for (const f of files) {
  const buf = Buffer.from(await (await get(`${SUPABASE_URL}/storage/v1/object/public/cvs/${encodeURIComponent(f.name)}`)).arrayBuffer());
  fs.writeFileSync(path.join(CVS, f.name), buf);
}
console.log(`archivos: ${files.length}`);
