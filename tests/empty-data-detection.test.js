'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { loadOwners, loadOwnersFromFile, normalizeOwnerEntry } = require('../src/utils/owner-loader.cjs');
const { createVipStore } = require('../src/services/vipStore.js');

function withTempDir(fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-test-'));
  try {
    return fn(tmp);
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

test('owner-loader: REGRESSION — empty owner.json returns empty list, no fallback', () => {
  withTempDir((tmp) => {
    fs.mkdirSync(path.join(tmp, 'data'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'data', 'owner.json'), JSON.stringify({ owner: [] }));
    const owners = loadOwners({ cwd: tmp });
    assert.deepEqual(owners, [], 'empty owner array must NOT trigger fallback to hardcoded number');
  });
});

test('owner-loader: REGRESSION — missing owner.json returns empty list, no fallback', () => {
  withTempDir((tmp) => {
    const owners = loadOwners({ cwd: tmp, fallback: null });
    assert.deepEqual(owners, [], 'missing file must NOT trigger fallback to hardcoded number');
  });
});

test('owner-loader: REGRESSION — when fallback array is non-empty, use it ONLY if data empty', () => {
  withTempDir((tmp) => {
    fs.mkdirSync(path.join(tmp, 'data'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'data', 'owner.json'), JSON.stringify({ owner: [] }));
    const owners = loadOwners({ cwd: tmp, fallback: [{ nomor: '628111111111', nama: 'FB' }] });
    assert.equal(owners.length, 0, 'must NOT use fallback when file exists but is empty');
  });
});

test('owner-loader: REGRESSION — corrupted JSON returns empty list, no fallback', () => {
  withTempDir((tmp) => {
    fs.mkdirSync(path.join(tmp, 'data'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'data', 'owner.json'), '{ this is not valid JSON ');
    const owners = loadOwners({ cwd: tmp, fallback: [{ nomor: '628111111111', nama: 'FB' }] });
    assert.equal(owners.length, 0, 'corrupted JSON must NOT trigger fallback');
  });
});

test('owner-loader: parses valid owner list correctly', () => {
  withTempDir((tmp) => {
    fs.mkdirSync(path.join(tmp, 'data'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, 'data', 'owner.json'),
      JSON.stringify({
        owner: [
          { nomor: '628111111111', nama: 'Alice' },
          { nomor: '628222222222', nama: 'Bob' },
          { nomor: '+62 813-3333-3333', nama: 'Charlie' }
        ]
      })
    );
    const owners = loadOwners({ cwd: tmp });
    assert.equal(owners.length, 3);
    assert.deepEqual(owners[0], { nomor: '628111111111', nama: 'Alice' });
    assert.deepEqual(owners[1], { nomor: '628222222222', nama: 'Bob' });
    assert.deepEqual(owners[2], { nomor: '6281333333333', nama: 'Charlie' });
  });
});

test('owner-loader: accepts flat array format (not wrapped in {owner: []})', () => {
  withTempDir((tmp) => {
    fs.mkdirSync(path.join(tmp, 'data'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, 'data', 'owner.json'),
      JSON.stringify([{ nomor: '628999999999', nama: 'Solo' }])
    );
    const owners = loadOwners({ cwd: tmp });
    assert.equal(owners.length, 1);
    assert.equal(owners[0].nomor, '628999999999');
  });
});

test('owner-loader: accepts string entries in array', () => {
  withTempDir((tmp) => {
    fs.mkdirSync(path.join(tmp, 'data'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, 'data', 'owner.json'),
      JSON.stringify({ owner: ['6281234567890', '6280987654321'] })
    );
    const owners = loadOwners({ cwd: tmp });
    assert.equal(owners.length, 2);
    assert.equal(owners[0].nomor, '6281234567890');
    assert.equal(owners[0].nama, 'Owner');
  });
});

test('owner-loader: filters out entries with empty nomor', () => {
  withTempDir((tmp) => {
    fs.mkdirSync(path.join(tmp, 'data'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, 'data', 'owner.json'),
      JSON.stringify({ owner: [{ nomor: '', nama: 'Empty' }, { nomor: '62811', nama: 'Real' }] })
    );
    const owners = loadOwners({ cwd: tmp });
    assert.equal(owners.length, 1);
    assert.equal(owners[0].nama, 'Real');
  });
});

test('owner-loader: handles top-level object that is not { owner: [] }', () => {
  withTempDir((tmp) => {
    fs.mkdirSync(path.join(tmp, 'data'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'data', 'owner.json'), JSON.stringify({ foo: 'bar' }));
    const owners = loadOwners({ cwd: tmp, fallback: null });
    assert.deepEqual(owners, []);
  });
});

test('normalizeOwnerEntry: returns null for non-string non-object inputs', () => {
  assert.equal(normalizeOwnerEntry(123), null);
  assert.equal(normalizeOwnerEntry(true), null);
  assert.equal(normalizeOwnerEntry(null), null);
  assert.equal(normalizeOwnerEntry(undefined), null);
});

test('normalizeOwnerEntry: returns null when nomor becomes empty after digit stripping', () => {
  assert.equal(normalizeOwnerEntry({ nomor: 'abc-def', nama: 'X' }), null);
  assert.equal(normalizeOwnerEntry({ nomor: '', nama: 'X' }), null);
});

test('vip-store: REGRESSION — empty vip.json {} does NOT mark anyone as VIP', () => {
  withTempDir((tmp) => {
    fs.mkdirSync(path.join(tmp, 'data'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'data', 'vip.json'), '{}');
    const store = createVipStore(path.join(tmp, 'data', 'vip.json'));
    assert.equal(store.isVIP('6281234567890@s.whatsapp.net'), false);
    assert.equal(store.isVIP('100708762284139@lid'), false);
  });
});

test('vip-store: REGRESSION — corrupted JSON file falls back to empty cache', () => {
  withTempDir((tmp) => {
    fs.mkdirSync(path.join(tmp, 'data'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'data', 'vip.json'), '{ not json');
    const store = createVipStore(path.join(tmp, 'data', 'vip.json'));
    assert.equal(store.isVIP('6281234567890@s.whatsapp.net'), false);
    // File should be rewritten as valid {}
    const content = fs.readFileSync(path.join(tmp, 'data', 'vip.json'), 'utf8');
    assert.ok(content.length > 0, 'corrupted file should be repaired');
  });
});

test('vip-store: expired VIP is correctly reported as not VIP', () => {
  withTempDir((tmp) => {
    fs.mkdirSync(path.join(tmp, 'data'), { recursive: true });
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    fs.writeFileSync(
      path.join(tmp, 'data', 'vip.json'),
      JSON.stringify({
        '6281234567890@s.whatsapp.net': {
          added: '2024-01-01T00:00:00.000Z',
          expired: expiredDate,
          days: 1
        }
      })
    );
    const store = createVipStore(path.join(tmp, 'data', 'vip.json'));
    assert.equal(store.isVIP('6281234567890@s.whatsapp.net'), false, 'expired VIP should return false');
  });
});

test('vip-store: active VIP is correctly reported as VIP', () => {
  withTempDir((tmp) => {
    fs.mkdirSync(path.join(tmp, 'data'), { recursive: true });
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    fs.writeFileSync(
      path.join(tmp, 'data', 'vip.json'),
      JSON.stringify({
        '6281234567890@s.whatsapp.net': {
          added: '2024-01-01T00:00:00.000Z',
          expired: futureDate,
          days: 30
        }
      })
    );
    const store = createVipStore(path.join(tmp, 'data', 'vip.json'));
    assert.equal(store.isVIP('6281234567890@s.whatsapp.net'), true);
  });
});

test('vip-store: handles JSON array as file content (recover by treating as empty)', () => {
  withTempDir((tmp) => {
    fs.mkdirSync(path.join(tmp, 'data'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'data', 'vip.json'), '[]');
    const store = createVipStore(path.join(tmp, 'data', 'vip.json'));
    assert.equal(store.isVIP('6281234567890@s.whatsapp.net'), false);
  });
});

test('vip-store: handles JSON null as file content (treat as empty)', () => {
  withTempDir((tmp) => {
    fs.mkdirSync(path.join(tmp, 'data'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'data', 'vip.json'), 'null');
    const store = createVipStore(path.join(tmp, 'data', 'vip.json'));
    assert.equal(store.isVIP('6281234567890@s.whatsapp.net'), false);
  });
});

test('integration: end-to-end empty data files produce NO owner / NO VIP', () => {
  withTempDir((tmp) => {
    fs.mkdirSync(path.join(tmp, 'data'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'data', 'owner.json'), JSON.stringify({ owner: [] }));
    fs.writeFileSync(path.join(tmp, 'data', 'vip.json'), '{}');
    fs.writeFileSync(path.join(tmp, 'data', 'sewa.json'), '{}');

    const owners = loadOwners({ cwd: tmp, fallback: null });
    const vipStore = createVipStore(path.join(tmp, 'data', 'vip.json'));

    const anyOwnerDetected = owners.some((o) => o.nomor === '6285591386135') ||
                              owners.some((o) => o.nomor === '6289527933537') ||
                              owners.some((o) => o.nomor === '6287796752356');
    assert.equal(anyOwnerDetected, false, 'no hardcoded owner should be detected from empty data');

    const vipDetected = vipStore.isVIP('6285591386135@s.whatsapp.net') ||
                        vipStore.isVIP('6281234567890@s.whatsapp.net');
    assert.equal(vipDetected, false, 'no user should be detected as VIP from empty data');
  });
});
