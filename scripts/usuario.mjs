// Crea un usuario o le pone una contraseña nueva (sirve para "me olvidé la contraseña").
// Uso: node scripts/usuario.mjs <email> "<Nombre>" <contraseña>
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const [email, nombre, password] = process.argv.slice(2);
if (!email || !nombre || !password) { console.error('Uso: node scripts/usuario.mjs <email> "<Nombre>" <contraseña>'); process.exit(1); }

const db = new DatabaseSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'talenthub.db'));
db.exec('CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, nombre TEXT NOT NULL, hash TEXT NOT NULL)');
const salt = crypto.randomBytes(16).toString('hex');
const hash = `${salt}:${crypto.scryptSync(password, salt, 32).toString('hex')}`;
db.prepare('INSERT INTO users (email, nombre, hash) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET nombre = excluded.nombre, hash = excluded.hash')
  .run(email.trim().toLowerCase(), nombre, hash);
console.log(`Usuario ${email.trim().toLowerCase()} listo`);
