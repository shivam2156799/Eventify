const fs = require('fs');
const os = require('os');
const path = require('path');

const STORAGE_FILE = path.join(os.tmpdir(), 'eventify-storage.json');

let cache = null;

function readFileState() {
  if (cache) {
    return cache;
  }

  try {
    const raw = fs.readFileSync(STORAGE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    cache = parsed && typeof parsed === 'object' ? parsed : { entries: {} };
  } catch (err) {
    cache = { entries: {} };
  }

  if (!cache.entries || typeof cache.entries !== 'object') {
    cache.entries = {};
  }

  return cache;
}

function writeFileState(state) {
  cache = state;
  const tempFile = `${STORAGE_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tempFile, STORAGE_FILE);
}

function listEntries() {
  const state = readFileState();
  return Object.entries(state.entries)
    .map(([key, record]) => ({
      key,
      value: record && Object.prototype.hasOwnProperty.call(record, 'value') ? record.value : '',
      updatedAt: Number(record && record.updatedAt) || 0
    }))
    .sort((left, right) => left.key.localeCompare(right.key));
}

function upsertEntry(key, value, updatedAt) {
  const state = readFileState();
  const existing = state.entries[key];
  const incomingUpdatedAt = Number(updatedAt) || Date.now();
  const existingUpdatedAt = Number(existing && existing.updatedAt) || 0;

  if (incomingUpdatedAt < existingUpdatedAt) {
    return false;
  }

  state.entries[key] = {
    value: String(value ?? ''),
    updatedAt: incomingUpdatedAt
  };

  writeFileState(state);
  return true;
}

function deleteEntry(key, updatedAt) {
  const state = readFileState();
  const existing = state.entries[key];
  const incomingUpdatedAt = Number(updatedAt) || Date.now();
  const existingUpdatedAt = Number(existing && existing.updatedAt) || 0;

  if (existing && incomingUpdatedAt < existingUpdatedAt) {
    return false;
  }

  delete state.entries[key];
  writeFileState(state);
  return true;
}

module.exports = {
  STORAGE_FILE,
  listEntries,
  upsertEntry,
  deleteEntry
};