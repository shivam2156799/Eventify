const { sendJson, sendText } = require('../lib/http');
const { STORAGE_FILE } = require('../lib/storage-store');

module.exports = function health(req, res) {
  if (req.method !== 'GET') {
    return sendText(res, 405, 'Method Not Allowed');
  }

  return sendJson(res, 200, {
    ok: true,
    storage: 'tmp-file',
    file: STORAGE_FILE
  });
};