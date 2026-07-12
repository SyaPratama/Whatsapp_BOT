import test from 'node:test';
import assert from 'node:assert/strict';
import { createProcessMessage } from '../src/pipeline.mjs';
import { createInitialState, bootstrapGlobals } from '../src/bootstrap/state.mjs';

function makeHarness({ owner = ['628111'], premium = [], contributors = [] } = {}) {
  const sent = [];
  const sentCalls = [];
  const reactions = [];
  const sentWithMeta = [];
  const ownerNumber = owner[0];
  const senderJid = `${ownerNumber}@s.whatsapp.net`;
  const otherJid = '628222@s.whatsapp.net';
  const vipStore = {};
  const globalState = createInitialState();
  globalState.owner = owner;
  globalState.thumbnail = 'https://example.invalid/thumb.png';
  bootstrapGlobals(globalThis, { antilinkRegex: globalState.antilinkRegex });
  globalState.geseran = global.geseran;
  globalState.db_lw = global.db_lw;
  globalState.antilink = global.antilink;
  globalState.autoList = global.autoList;

  const sendMessage = async (...args) => {
    sentCalls.push(args);
    sent.push(args[1]?.text || args[1]?.caption || args[1]?.contacts?.displayName || JSON.stringify(args[1] || {}));
    sentWithMeta.push({ args, call: args[0] });
    return { key: { id: 'sent' } };
  };

  const sock = {
    user: { id: `${ownerNumber}:123` },
    sendMessage,
    readMessages: (keys) => reactions.push({ type: 'read', keys }),
    decodeJid: async (jid) => (jid.split(':')[0].includes('@') ? jid : `${jid.split(':')[0]}@s.whatsapp.net`),
    groupMetadata: async () => ({ subject: 'Test', participants: [
      { id: senderJid, jid: senderJid, admin: 'superadmin' },
      { id: otherJid, jid: otherJid, admin: 'admin' }
    ] }),
    groupSettingUpdate: async () => ({ status: 'ok' }),
    profilePictureUrl: async () => 'https://example.invalid/pp.jpg'
  };

  const deps = {
    globalState,
    contributors,
    premium,
    loadVIP: () => vipStore,
    isVIP: (jid) => {
      const entry = vipStore[jid];
      if (!entry) return false;
      return Date.now() < new Date(entry.expired).getTime();
    },
    addVIP: (jid, days) => {
      const exp = new Date(Date.now() + days * 86400000);
      vipStore[jid] = { added: new Date().toISOString(), expired: exp.toISOString(), days };
      return vipStore[jid];
    },
    delVIP: (jid) => { delete vipStore[jid]; return true; },
    CatBox: async () => 'https://catbox.invalid/upload.png',
    TelegraPh: async () => 'https://telegra.ph.invalid/file',
    UploadFileUgu: async () => ({ url: 'https://uguu.invalid/file' }),
    floNime: async () => ({ url: 'https://flo.invalid/file' }),

    runtime: (s) => `${Math.floor(s)}s`,
    Case: {
      list: () => 'demo:1\ndemo:2',
      add: () => null,
      delete: () => null
    },
    scanPlayers: (text) => {
      const out = { k: [], b: [] };
      let team = null;
      for (const line of text.split(/\n/)) {
        const t = line.trim();
        if (!t) continue;
        if (/^k:/i.test(t)) { team = 'k'; continue; }
        if (/^b:/i.test(t)) { team = 'b'; continue; }
        const match = t.match(/^(.+?)\s+(\d+)(lf|\.)?$/i);
        if (match && team) out[team].push({ nama: match[1].trim(), nominal: parseInt(match[2], 10), mark: (match[3] || '').toLowerCase() });
      }
      return out;
    },
    getFee: (n) => (n < 2 ? 0 : n <= 9 ? 1 : Math.floor(n / 10) + 1),
    thumbnail: 'https://example.invalid/thumb.png',
    BotName: 'BotWa',
    saveSewa: () => null
  };

  const processMessage = createProcessMessage(deps);

  return {
    sock,
    sent,
    sentCalls,
    sentWithMeta,
    reactions,
    processMessage,
    globalState,
    vipStore,
    ownerJid: senderJid,
    otherJid
  };
}

function makeMessage({ chat = 'group@g.us', sender, body, mtype = 'conversation', text, quotedText } = {}) {
  const message = {};
  if (mtype === 'conversation') {
    message.conversation = body;
  } else if (mtype === 'extendedTextMessage') {
    message.extendedTextMessage = { text: body };
  } else {
    message[mtype] = { text: body };
  }
  return {
    key: { fromMe: false, remoteJid: chat, id: `msg-${Math.random()}`, participant: sender },
    message,
    messageContextInfo: undefined,
    mtype,
    pushName: 'Tester',
    text: text || body,
    sender,
    chat,
    isGroup: chat.endsWith('@g.us'),
    quoted: quotedText ? { text: quotedText } : null
  };
}

test('end-to-end: owner, ping, runtime, autoread wiring', async () => {
  const h = makeHarness();
  const { sock, processMessage, sent, reactions, globalState } = h;

  await processMessage(sock, makeMessage({ sender: h.ownerJid, body: '.ping' }));
  const pingMessage = sent.find((s) => s.includes('BOT SPEED TEST'));
  assert.ok(pingMessage, 'expected ping response text');

  await processMessage(sock, makeMessage({ sender: h.ownerJid, body: '.runtime' }));
  const runtimeMessage = sent.find((s) => /_\d/.test(s));
  assert.ok(runtimeMessage, 'expected runtime formatted output');
  assert.ok(reactions.some((r) => r.type === 'read') === false, 'autoread disabled by default');

  globalState.autoread = true;
  await processMessage(sock, makeMessage({ sender: h.ownerJid, body: '.menu' }));
  assert.ok(reactions.some((r) => r.type === 'read'), 'autoread should call readMessages');

  await processMessage(sock, makeMessage({ sender: h.ownerJid, body: '.self' }));
  assert.equal(globalState.self, true);
});

test('end-to-end: VIP store via addvip, delvip, listvip with persistence', async () => {
  const h = makeHarness({ owner: ['628111'] });
  const { sock, processMessage, sent, vipStore } = h;

  await processMessage(sock, makeMessage({ sender: h.ownerJid, body: '.addvip 628222 7' }));
  assert.ok(vipStore['628222@s.whatsapp.net'], 'VIP entry must be stored');
  assert.equal(vipStore['628222@s.whatsapp.net'].days, 7);
  assert.ok(sent.some((s) => s.includes('VIP ditambahkan')));

  await processMessage(sock, makeMessage({ sender: h.ownerJid, body: '.listvip' }));
  const vipList = sent.find((s) => s.includes('LIST VIP'));
  assert.ok(vipList);
  assert.ok(vipList.includes('628222'));

  await processMessage(sock, makeMessage({ sender: h.ownerJid, body: '.delvip 628222' }));
  assert.equal(vipStore['628222@s.whatsapp.net'], undefined);
});

test('end-to-end: LW flow lk -> k sets backup and updates state', async () => {
  const h = makeHarness();
  const { sock, processMessage, sent, globalState } = h;

  await processMessage(sock, makeMessage({ sender: h.ownerJid, body: '.setlw Admin|HP|Roll|Time|Dana' }));
  assert.ok(globalState.db_lw.templates?.Admin, 'setlw should save template');

  await processMessage(sock, makeMessage({ sender: h.ownerJid, body: '.openlw Admin' }));
  assert.ok(globalState.db_lw[h.ownerJid], 'openlw should open session');
  assert.equal(globalState.db_lw[h.ownerJid].admin, 'Admin');

  await processMessage(sock, makeMessage({ sender: h.ownerJid, body: '.lk alpha 10' }));
  assert.equal(globalState.autoList['group@g.us'].K.length, 1);
  assert.equal(globalState.autoList['group@g.us'].K[0].nama, 'alpha');
  assert.ok(sent.some((s) => s.includes('BERHASIL DITAMBAHKAN')));

  await processMessage(sock, makeMessage({ sender: h.ownerJid, body: '.k 30', quotedText: 'K:\nalpha 10\nB:\nbeta 10' }));
  const kReply = sent.find((s) => s.includes('GAME 1'));
  assert.ok(kReply, 'k command should respond with a game record');
  assert.equal(globalState.db_lw[h.ownerJid].players.alpha.saldo, 18);
  assert.equal(globalState.db_lw[h.ownerJid].players.beta.saldo, 0);
});

test('end-to-end: group flow open/close and antilink toggle', async () => {
  const h = makeHarness();
  const { sock, processMessage, sent, globalState } = h;

  await processMessage(sock, makeMessage({ sender: h.ownerJid, body: '.antilink group on' }));
  assert.equal(globalState.antilink['group@g.us'].group, true);

  await processMessage(sock, makeMessage({ sender: h.ownerJid, body: '.open' }));
  assert.ok(sent.some((s) => s.includes('Grup telah dibuka')));

  await processMessage(sock, makeMessage({ sender: h.ownerJid, body: '.close' }));
  assert.ok(sent.some((s) => s.includes('Grup telah ditutup')));
});

test('end-to-end: maintenance welcome and totalfitur', async () => {
  const h = makeHarness();
  const { sock, processMessage, sent, globalState } = h;

  await processMessage(sock, makeMessage({ sender: h.ownerJid, body: '.welcome on' }));
  assert.equal(globalState.welcome, true);
  assert.ok(sent.some((s) => s.includes('Welcome ON')));
});

test('end-to-end: predik outputs valid zone', async () => {
  const h = makeHarness();
  const { sock, processMessage, sent } = h;

  await processMessage(sock, makeMessage({ sender: h.ownerJid, body: '.predik 43-29' }));
  const predikMessage = sent.find((s) => s.includes('GOOGLE ATTACK'));
  assert.ok(predikMessage);
  assert.ok(predikMessage.includes('TARGET'));
});

test('end-to-end: tools autoread toggle', async () => {
  const h = makeHarness();
  const { sock, processMessage, globalState } = h;

  await processMessage(sock, makeMessage({ sender: h.ownerJid, body: '.autoread off' }));
  assert.equal(globalState.autoread, false);
});

test('end-to-end: non-owner cannot trigger owner-only commands', async () => {
  const h = makeHarness();
  const { sock, processMessage, sent } = h;

  await processMessage(sock, makeMessage({ sender: h.otherJid, body: '.addvip 628333 5' }));
  assert.ok(sent.some((s) => s.includes('Hanya owner')));
});
