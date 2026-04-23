const { deleteEntry, upsertEntry } = require('../../lib/storage-store');
const { parseRequestBody, sendJson, sendText } = require('../../lib/http');

function getKey(req) {
  const url = new URL(req.url, 'http://localhost');
  const pathKey = url.pathname.split('/').pop() || '';
  return decodeURIComponent(pathKey).trim();
}

module.exports = async function storageByKey(req, res) {
  const key = getKey(req);

  if (!key) {
    return sendJson(res, 400, { error: 'Missing key' });
  }

  if (req.method === 'PUT') {
    const body = await parseRequestBody(req);
    const value = typeof body.value === 'string' ? body.value : '';
    const updatedAt = Number(body.updatedAt) || Date.now();

    upsertEntry(key, value, updatedAt);
    return sendJson(res, 200, { ok: true, key, updatedAt });
  }

  if (req.method === 'DELETE') {
    const body = await parseRequestBody(req);
    const updatedAt = Number(body.updatedAt) || Date.now();

    deleteEntry(key, updatedAt);
    return sendJson(res, 200, { ok: true, key, updatedAt });
  }

  return sendText(res, 405, 'Method Not Allowed');
};