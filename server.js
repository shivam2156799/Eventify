const path = require('path');
const fs = require('fs');
const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const WEB_DIR = path.join(ROOT_DIR, 'Eventify 18');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_PATH = path.join(DATA_DIR, 'eventify.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS storage (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at INTEGER NOT NULL
  );
`);

const upsertStmt = db.prepare(`
  INSERT INTO storage (key, value, updated_at)
  VALUES (?, ?, ?)
  ON CONFLICT(key) DO UPDATE SET
    value = excluded.value,
    updated_at = excluded.updated_at
  WHERE excluded.updated_at >= storage.updated_at
`);

const deleteStmt = db.prepare(`
  DELETE FROM storage
  WHERE key = ? AND ? >= updated_at
`);

const selectAllStmt = db.prepare('SELECT key, value, updated_at FROM storage');

app.use(express.json({ limit: '2mb' }));
app.use(express.static(WEB_DIR));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, db: DB_PATH });
});

app.get('/api/storage/all', (req, res) => {
  const rows = selectAllStmt.all();
  res.json({
    entries: rows.map((row) => ({
      key: row.key,
      value: row.value,
      updatedAt: row.updated_at
    }))
  });
});

app.put('/api/storage/:key', (req, res) => {
  const key = String(req.params.key || '').trim();
  if (!key) {
    return res.status(400).json({ error: 'Missing key' });
  }

  const value = typeof req.body.value === 'string' ? req.body.value : '';
  const updatedAt = Number(req.body.updatedAt) || Date.now();
  upsertStmt.run(key, value, updatedAt);
  res.json({ ok: true, key, updatedAt });
});

app.delete('/api/storage/:key', (req, res) => {
  const key = String(req.params.key || '').trim();
  if (!key) {
    return res.status(400).json({ error: 'Missing key' });
  }

  const updatedAt = Number(req.body && req.body.updatedAt) || Date.now();
  deleteStmt.run(key, updatedAt);
  res.json({ ok: true, key, updatedAt });
});

app.use((req, res) => {
  res.sendFile(path.join(WEB_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Eventify server running at http://localhost:${PORT}`);
});
