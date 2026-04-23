const { listEntries } = require('../../lib/storage-store');
const { sendJson, sendText } = require('../../lib/http');

module.exports = function storageAll(req, res) {
  if (req.method !== 'GET') {
    return sendText(res, 405, 'Method Not Allowed');
  }

  return sendJson(res, 200, {
    entries: listEntries()
  });
};