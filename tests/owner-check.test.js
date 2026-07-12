'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeForOwnerCheck,
  resolveSenderJid
} = require('../src/utils/jid.cjs');

function buildOwnerList(rawOwnerNumbers) {
  return rawOwnerNumbers.map((v) => normalizeForOwnerCheck(`${v}@s.whatsapp.net`));
}

function isOwner({ cleanSender, ownerList, botNumber, kontributor = [] }) {
  const allowed = [
    ...ownerList,
    normalizeForOwnerCheck(botNumber),
    ...kontributor.map(normalizeForOwnerCheck)
  ];
  return allowed.includes(cleanSender);
}

test('REGRESSION: owner is recognized when m.sender is a LID and contact store resolves it', () => {
  const store = {
    contacts: new Map([
      ['6287796752356@s.whatsapp.net', { id: '6287796752356@s.whatsapp.net', lid: '100708762284139@lid' }]
    ])
  };
  const ownerList = buildOwnerList(['6287796752356']);
  const cleanSender = normalizeForOwnerCheck(resolveSenderJid('100708762284139@lid', store));
  const result = isOwner({ cleanSender, ownerList, botNumber: '628111111111@s.whatsapp.net' });
  assert.equal(result, true, 'Owner 6287796752356 should be recognized even when sender arrives as LID');
});

test('REGRESSION: bot number is recognized when arrived as LID with device id', () => {
  const botLid = '999888777666@lid';
  const botLidWithDevice = '999888777666:13@lid';
  const clean1 = normalizeForOwnerCheck(botLid);
  const clean2 = normalizeForOwnerCheck(botLidWithDevice);
  assert.equal(clean1, '999888777666@lid');
  assert.equal(clean2, '999888777666@lid');
  const allowed = [normalizeForOwnerCheck('628111111111@s.whatsapp.net'), clean1];
  assert.equal(allowed.includes(clean2), true);
});

test('REGRESSION: non-owner LID sender is rejected even after resolve attempt', () => {
  const store = {
    contacts: new Map([
      ['628999999999@s.whatsapp.net', { id: '628999999999@s.whatsapp.net', lid: '777777@lid' }]
    ])
  };
  const ownerList = buildOwnerList(['6287796752356']);
  const cleanSender = normalizeForOwnerCheck(resolveSenderJid('777777@lid', store));
  const result = isOwner({ cleanSender, ownerList, botNumber: '628111111111@s.whatsapp.net' });
  assert.equal(result, false, 'Non-owner (resolved LID) must NOT be recognized as owner');
});

test('REGRESSION: owner with device id appended to PN JID is still recognized', () => {
  const ownerList = buildOwnerList(['6287796752356']);
  const cleanSender = normalizeForOwnerCheck('6287796752356:13@s.whatsapp.net');
  const result = isOwner({ cleanSender, ownerList, botNumber: '628111111111@s.whatsapp.net' });
  assert.equal(result, true, 'Owner with device id (:13) must still be recognized');
});

test('REGRESSION: owner PN with /resource suffix is still recognized', () => {
  const ownerList = buildOwnerList(['6287796752356']);
  const cleanSender = normalizeForOwnerCheck('6287796752356@s.whatsapp.net/phone');
  const result = isOwner({ cleanSender, ownerList, botNumber: '628111111111@s.whatsapp.net' });
  assert.equal(result, true, 'Owner with /phone resource must still be recognized');
});
