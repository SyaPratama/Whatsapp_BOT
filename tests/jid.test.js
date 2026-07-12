'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  digitsOnly,
  toPnJid,
  toLidJid,
  jidType,
  jidUser,
  normalizeForOwnerCheck,
  findPnForLid,
  resolveSenderJid
} = require('../src/utils/jid.cjs');

test('digitsOnly strips non-digit characters', () => {
  assert.equal(digitsOnly('+62 855-9138-6135'), '6285591386135');
  assert.equal(digitsOnly(''), '');
  assert.equal(digitsOnly(null), '');
  assert.equal(digitsOnly('abc123def456'), '123456');
});

test('toPnJid builds canonical @s.whatsapp.net JID', () => {
  assert.equal(toPnJid('+62 855-9138-6135'), '6285591386135@s.whatsapp.net');
  assert.equal(toPnJid('6285591386135'), '6285591386135@s.whatsapp.net');
  assert.equal(toPnJid(''), null);
  assert.equal(toPnJid('abc'), null);
});

test('toPnJid does NOT auto-convert leading 0 to 62 (caller responsibility)', () => {
  assert.equal(toPnJid('08559138613 5'), '085591386135@s.whatsapp.net');
  assert.equal(toPnJid('085591386135'), '085591386135@s.whatsapp.net');
});

test('toLidJid builds canonical @lid JID', () => {
  assert.equal(toLidJid('100708762284139'), '100708762284139@lid');
  assert.equal(toLidJid('100 708 762'), '100708762@lid');
  assert.equal(toLidJid(''), null);
});

test('jidType classifies known suffixes', () => {
  assert.equal(jidType('6285591386135@s.whatsapp.net'), 'pn');
  assert.equal(jidType('100708762284139@lid'), 'lid');
  assert.equal(jidType('120363xxx@g.us'), 'group');
  assert.equal(jidType('120363xxx@newsletter'), 'channel');
  assert.equal(jidType('xxxx@broadcast'), 'broadcast');
  assert.equal(jidType('garbage'), 'unknown');
  assert.equal(jidType(''), 'unknown');
  assert.equal(jidType(null), 'unknown');
});

test('jidUser extracts numeric user portion', () => {
  assert.equal(jidUser('6285591386135@s.whatsapp.net'), '6285591386135');
  assert.equal(jidUser('6285591386135:13@s.whatsapp.net'), '6285591386135');
  assert.equal(jidUser('6285591386135:13@s.whatsapp.net/in'), '6285591386135');
  assert.equal(jidUser('120363xxx@g.us'), '120363xxx');
  assert.equal(jidUser(''), null);
  assert.equal(jidUser(null), null);
});

test('normalizeForOwnerCheck strips device id and resource', () => {
  assert.equal(normalizeForOwnerCheck('6285591386135:13@s.whatsapp.net'), '6285591386135@s.whatsapp.net');
  assert.equal(normalizeForOwnerCheck('6285591386135@s.whatsapp.net'), '6285591386135@s.whatsapp.net');
  assert.equal(normalizeForOwnerCheck('6285591386135:13@s.whatsapp.net/in'), '6285591386135@s.whatsapp.net');
  assert.equal(normalizeForOwnerCheck('6285591386135'), '6285591386135@s.whatsapp.net');
  assert.equal(normalizeForOwnerCheck(''), '');
  assert.equal(normalizeForOwnerCheck(null), '');
  assert.equal(normalizeForOwnerCheck(undefined), '');
});

test('findPnForLid returns PN when contact store has a match', () => {
  const store = {
    contacts: new Map([
      ['6285591386135@s.whatsapp.net', { id: '6285591386135@s.whatsapp.net', lid: '100708762284139@lid' }]
    ])
  };
  assert.equal(
    findPnForLid(store, '100708762284139@lid'),
    '6285591386135@s.whatsapp.net'
  );
});

test('findPnForLid returns null when no contact matches', () => {
  const store = {
    contacts: new Map([
      ['628111111111@s.whatsapp.net', { id: '628111111111@s.whatsapp.net', lid: '111111@lid' }]
    ])
  };
  assert.equal(findPnForLid(store, '999999@lid'), null);
});

test('findPnForLid handles plain object contacts', () => {
  const store = {
    contacts: {
      '628222222222@s.whatsapp.net': { id: '628222222222@s.whatsapp.net', lid: '222222@lid' }
    }
  };
  assert.equal(findPnForLid(store, '222222@lid'), '628222222222@s.whatsapp.net');
});

test('findPnForLid returns null on missing store or non-LID input', () => {
  assert.equal(findPnForLid(null, '222@lid'), null);
  assert.equal(findPnForLid({}, '222@lid'), null);
  assert.equal(findPnForLid({ contacts: {} }, '628xxx@s.whatsapp.net'), null);
});

test('resolveSenderJid passes through non-LID JIDs unchanged', () => {
  assert.equal(
    resolveSenderJid('6285591386135@s.whatsapp.net', null),
    '6285591386135@s.whatsapp.net'
  );
  assert.equal(
    resolveSenderJid('6285591386135:13@s.whatsapp.net', null),
    '6285591386135:13@s.whatsapp.net'
  );
  assert.equal(resolveSenderJid('', null), '');
  assert.equal(resolveSenderJid(null, null), '');
});

test('resolveSenderJid resolves LID to PN when contact store has it', () => {
  const store = {
    contacts: new Map([
      ['6285591386135@s.whatsapp.net', { id: '6285591386135@s.whatsapp.net', lid: '100708762284139@lid' }]
    ])
  };
  assert.equal(
    resolveSenderJid('100708762284139@lid', store),
    '6285591386135@s.whatsapp.net'
  );
});

test('resolveSenderJid falls back to LID when store is empty (no contact yet)', () => {
  const store = { contacts: new Map() };
  assert.equal(
    resolveSenderJid('100708762284139@lid', store),
    '100708762284139@lid'
  );
});
