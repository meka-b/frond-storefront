import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store database in project root /data directory
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'frond.sqlite');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high concurrency & performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Initialize schema
const possibleSchemaPaths = [
  path.resolve(process.cwd(), 'server', 'db', 'schema.sql'),
  path.resolve(__dirname, 'schema.sql'),
  path.resolve(__dirname, '..', '..', 'server', 'db', 'schema.sql')
];
const schemaPath = possibleSchemaPaths.find(p => fs.existsSync(p));
if (schemaPath) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSql);
}

export default db;
