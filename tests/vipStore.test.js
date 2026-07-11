const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createVipStore } = require('../src/services/vipStore');

function createTempFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'botwa-vip-'));
  return path.join(dir, 'vip.json');
}

test('loads, writes, and checks active VIP members', () => {
  const store = createVipStore(createTempFile());

  const entry = store.addVIP('628123@s.whatsapp.net', 7);

  assert.equal(entry.days, 7);
  assert.equal(store.isVIP('628123@s.whatsapp.net'), true);

  const data = JSON.parse(fs.readFileSync(store.filePath, 'utf8'));
  assert.ok(data['628123@s.whatsapp.net']);
});

test('recovers from invalid JSON and removes VIP entries', () => {
  const filePath = createTempFile();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, '{not valid json');

  const store = createVipStore(filePath);

  assert.equal(store.loadVIP()['anything'], undefined);

  store.addVIP('628999@s.whatsapp.net', 1);
  assert.equal(store.delVIP('628999@s.whatsapp.net'), true);
  assert.equal(store.isVIP('628999@s.whatsapp.net'), false);
});