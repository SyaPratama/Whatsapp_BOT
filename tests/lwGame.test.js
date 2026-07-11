const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getFee,
  prosesTransaksiOtomatis,
  scanPlayers,
  prosesTransaksi,
  hitungTotal
} = require('../src/services/lwGame');

test('parses teams and totals player stakes', () => {
  const parsed = scanPlayers('K:\nKing Vin 50lf\nB:\nNash 15.');

  assert.equal(parsed.k.length, 1);
  assert.equal(parsed.b.length, 1);
  assert.equal(parsed.k[0].nama, 'King Vin');
  assert.equal(hitungTotal(parsed.k), 50);
});

test('processes transaction winners and legacy settlement', () => {
  const db = { players: {} };
  const players = {
    k: [{ nama: 'Alpha', nominal: 10, mark: '' }],
    b: [{ nama: 'Beta', nominal: 5, mark: '' }]
  };

  prosesTransaksi(db, players, '2-0');

  assert.equal(db.players.alpha, 20);

  const autoDb = {
    players: {},
    miskin: [{ nama: 'Alpha', nominal: '8' }]
  };

  prosesTransaksiOtomatis(autoDb, 'Alpha', 5, 'lf');

  assert.equal(autoDb.miskin.length, 1);
  assert.equal(autoDb.miskin[0].nominal, '4lf');
  assert.equal(autoDb.players.Alpha, undefined);
});

test('calculates fee for small and large stakes', () => {
  assert.equal(getFee(1), 0);
  assert.equal(getFee(9), 1);
  assert.equal(getFee(20), 3);
});