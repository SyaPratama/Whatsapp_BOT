import test from 'node:test';
import assert from 'node:assert/strict';
import { bootstrapGlobals, createInitialState } from '../src/bootstrap/state.mjs';
import { dispatchCommand } from '../src/handlers/index.mjs';

test('bootstrap creates explicit initial bot state', () => {
  const state = createInitialState();

  assert.equal(state.self, false);
  assert.deepEqual(state.db_lw, {});
  assert.ok(state.antilinkRegex.group instanceof RegExp);
});

test('dispatch handles ping and self commands', async () => {
  const replies = [];
  const sent = [];
  const globalState = { owner: ['628111'], namaown: 'Owner Bot', self: false, antilink: {} };

  bootstrapGlobals(globalThis, globalState);

  const pingHandled = await dispatchCommand({
    command: 'ping',
    reply: (text) => replies.push(text),
    sock: { sendMessage: async (...args) => sent.push(args) },
    m: { chat: 'room@c.us', sender: '6282@s.whatsapp.net' },
    runtime: (value) => `runtime:${value}`,
    loadVIP: () => ({}),
    isVIP: () => false,
    addVIP: () => null,
    delVIP: () => null,
    globalState,
    isOwner: true,
    isOwn: true,
    isPremium: false,
    text: '',
    args: []
  });

  assert.equal(pingHandled, true);
  assert.equal(sent.length, 2);

  const selfHandled = await dispatchCommand({
    command: 'self',
    reply: (text) => replies.push(text),
    sock: { sendMessage: async () => {} },
    m: { chat: 'room@c.us', sender: '628111@s.whatsapp.net' },
    runtime: (value) => `runtime:${value}`,
    loadVIP: () => ({}),
    isVIP: () => false,
    addVIP: () => null,
    delVIP: () => null,
    globalState,
    isOwner: true,
    isOwn: true,
    isPremium: false,
    text: '',
    args: []
  });

  assert.equal(selfHandled, true);
  assert.equal(globalState.self, true);
});

test('dispatch handles LW list entry creation', async () => {
  const replies = [];
  const globalState = { owner: ['628111'], namaown: 'Owner Bot', self: false, antilink: {}, autoList: {}, db_lw: {}, geseran: {} };

  const handled = await dispatchCommand({
    command: 'lk',
    reply: (text) => replies.push(text),
    sock: { sendMessage: async () => {} },
    m: { chat: 'group@c.us', sender: '6282@s.whatsapp.net', text: '.lk alpha 10' },
    runtime: (value) => `runtime:${value}`,
    loadVIP: () => ({}),
    isVIP: () => true,
    addVIP: () => null,
    delVIP: () => null,
    globalState,
    isOwner: false,
    isOwn: false,
    isPremium: false,
    isGroup: true,
    isAdmins: false,
    isBotAdmins: false,
    text: 'alpha 10',
    args: ['alpha', '10'],
    q: 'alpha 10',
    prefix: '.'
  });

  assert.equal(handled, true);
  assert.ok(globalState.autoList['group@c.us']);
  assert.equal(globalState.autoList['group@c.us'].K.length, 1);
  assert.equal(globalState.autoList['group@c.us'].K[0].nama, 'alpha');
  assert.ok(replies[0].includes('BERHASIL DITAMBAHKAN'));
});

test('dispatch handles addown owner mutation', async () => {
  const replies = [];
  const globalState = { owner: ['628111@s.whatsapp.net'], namaown: 'Owner Bot', self: false, antilink: {}, autoList: {}, db_lw: {}, geseran: {} };

  const handled = await dispatchCommand({
    command: 'addown',
    reply: (text) => replies.push(text),
    sock: { sendMessage: async () => {} },
    m: { chat: 'group@c.us', sender: '628111@s.whatsapp.net', mentionedJid: ['628222@s.whatsapp.net'] },
    runtime: (value) => `runtime:${value}`,
    loadVIP: () => ({}),
    isVIP: () => false,
    addVIP: () => null,
    delVIP: () => null,
    globalState,
    isOwner: true,
    isOwn: true,
    isPremium: false,
    text: '',
    args: [],
    q: '',
    prefix: '.'
  });

  assert.equal(handled, true);
  assert.ok(globalState.owner.includes('628222@s.whatsapp.net'));
  assert.ok(replies[0].includes('Berhasil menambahkan'));
});

test('sewa handler registers an entry with the new store', async () => {
  const replies = [];
  const globalState = {
    owner: ['628111'],
    sewaDb: {},
    saveSewa: () => null,
    db_lw: {},
    autoList: {},
    antilink: {},
    geseran: {}
  };
  const sent = [];
  const sock = {
    groupAcceptInvite: async () => '120363@g.us',
    sendMessage: async (...args) => sent.push(args)
  };

  const handled = await dispatchCommand({
    command: 'sewa',
    reply: (text) => replies.push(text),
    sock,
    m: { chat: 'admin@s.whatsapp.net', sender: '628111@s.whatsapp.net' },
    globalState,
    isOwner: true,
    args: ['add', 'https://chat.whatsapp.com/abc12345', '30', 'Pelanggan', 'VIP'],
    text: '',
    q: '',
    prefix: '.'
  });

  assert.equal(handled, true);
  assert.ok(globalState.sewaDb['120363@g.us']);
  assert.equal(globalState.sewaDb['120363@g.us'].days, 30);
  assert.equal(globalState.sewaDb['120363@g.us'].customer, 'Pelanggan VIP');
});

test('maintenance handler toggles welcome flag', async () => {
  const replies = [];
  const globalState = { welcome: false, goodbye: false };

  const handled = await dispatchCommand({
    command: 'welcome',
    reply: (text) => replies.push(text),
    sock: { sendMessage: async () => {} },
    m: { chat: 'group@c.us', sender: '628111@s.whatsapp.net' },
    globalState,
    isOwner: true,
    args: ['on'],
    text: 'on',
    q: 'on',
    prefix: '.',
    botNumber: '628111@s.whatsapp.net',
    mime: '',
    quoted: null
  });

  assert.equal(handled, true);
  assert.equal(globalState.welcome, true);
  assert.ok(replies[0].includes('Welcome ON'));
});

test('tools handler toggles autoread state', async () => {
  const replies = [];
  const globalState = { owner: [], autoread: false, antilink: {}, autoList: {}, db_lw: {}, geseran: {} };

  const offHandled = await dispatchCommand({
    command: 'autoread',
    reply: (text) => replies.push(text),
    sock: { sendMessage: async () => {} },
    m: { chat: 'group@c.us', sender: '628111@s.whatsapp.net' },
    globalState,
    isOwner: true,
    isOwn: true,
    isPremium: false,
    args: ['off'],
    text: 'off',
    q: 'off',
    prefix: '.'
  });

  assert.equal(offHandled, true);
  assert.equal(globalState.autoread, false);
  assert.ok(replies[0].includes('Auto Read Message: OFF'));

  const onHandled = await dispatchCommand({
    command: 'autoread',
    reply: (text) => replies.push(text),
    sock: { sendMessage: async () => {} },
    m: { chat: 'group@c.us', sender: '628111@s.whatsapp.net' },
    globalState,
    isOwner: true,
    isOwn: true,
    isPremium: false,
    args: ['on'],
    text: 'on',
    q: 'on',
    prefix: '.'
  });

  assert.equal(onHandled, true);
  assert.equal(globalState.autoread, true);
  assert.ok(replies[1].includes('Auto Read Message: ON'));
});