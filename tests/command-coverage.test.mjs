import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dispatchCommand } from '../src/handlers/index.mjs';

const BLUEPRINT_PATH = 'd:\\bot\\KyzoYMD.js';
const IGNORED = new Set([
  'nama',
  // Downloader commands removed by user request:
  'song', 'play', 'ytmp4', 'douyin', 'capcut', 'threads', 'kuaishou', 'qq', 'espn',
  'pinterest', 'imdb', 'imgur', 'ifunny', 'izlesene', 'reddit', 'youtube', 'twitter',
  'vimeo', 'snapchat', 'bilibili', 'dailymotion', 'sharechat', 'likee', 'linkedin',
  'tumblr', 'hipi', 'telegram', 'getstickerpack', 'bitchute', 'febspot', '9gag',
  'oke.ru', 'rumble', 'streamable', 'ted', 'sohutv', 'pornbox', 'xvideos', 'xnxx',
  'xiaohongshu', 'ixigua', 'weibo', 'miaopai', 'meipai', 'xiaoying', 'national video',
  'yingke', 'sina', 'bluesky', 'soundcloud', 'mixcloud', 'spotify', 'zingmp3',
  'bandcamp', 'download', 'tiktok', 'instagram', 'facebook', 'aio', 'yts', 'youtubesearch', 'ytsearch'
]);

function collectBlueprintCommands() {
  const source = readFileSync(BLUEPRINT_PATH, 'utf8');
  const commands = new Set();
  const regex = /case\s+'([^']+)'\s*:/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    commands.add(match[1]);
  }
  return [...commands].filter((c) => !IGNORED.has(c)).sort();
}

function makeHarness() {
  const sent = [];
  const owner = '628111';
  const senderJid = `${owner}@s.whatsapp.net`;
  const sock = {
    user: { id: `${owner}:123` },
    sendMessage: async (...args) => sent.push(args[1]?.text || JSON.stringify(args[1] || {})),
    groupMetadata: async () => ({ subject: 'T', participants: [{ id: senderJid, jid: senderJid, admin: 'superadmin' }] }),
    groupSettingUpdate: async () => ({ status: 'ok' }),
    groupParticipantsUpdate: async () => [{ status: 'ok' }],
    groupInviteCode: async () => 'INVITECODE',
    groupRevokeInvite: async () => ({ status: 'ok' }),
    profilePictureUrl: async () => 'https://example.invalid/pp.jpg',
    removeProfilePicture: async () => ({ status: 'ok' }),
    updateProfilePicture: async () => ({ status: 'ok' }),
    downloadAndSaveMediaMessage: async () => './media.jpg',
    readMessages: async () => null,
    decodeJid: async (jid) => `${jid.split(':')[0]}@s.whatsapp.net`
  };
  const globalState = {
    owner: [owner],
    geseran: {},
    db_lw: {},
    antilink: {},
    autoList: {},
    history9d: [],
    self: false,
    autoread: false
  };
  return { sent, sock, senderJid, globalState };
}

function makeContext(command) {
  const { sent, sock, senderJid, globalState } = makeHarness();
  return {
    command,
    reply: (text) => sent.push(text),
    sock,
    m: {
      chat: 'group@g.us',
      sender: senderJid,
      text: `.${command}`,
      pushName: 'Tester',
      mtype: 'conversation',
      quoted: null,
      key: { fromMe: false, remoteJid: 'group@g.us', id: `msg-${command}`, participant: senderJid }
    },
    isOwner: true,
    isOwn: true,
    isPremium: true,
    isGroup: true,
    isAdmins: true,
    isBotAdmins: true,
    isPrivate: false,
    isVIP: () => true,
    args: [],
    text: '',
    q: '',
    prefix: '.',
    botNumber: senderJid,
    mime: '',
    quoted: null,
    body: `.${command}`,
    participants: [],
    sender: senderJid,
    globalState,
    runtime: (s) => `${s}s`,
    loadVIP: () => ({}),
    addVIP: () => null,
    delVIP: () => null,
    CatBox: async () => '',
    TelegraPh: async () => '',
    UploadFileUgu: async () => ({ url: '' }),
    floNime: async () => ({ url: '' }),

    thumbnail: '',
    Case: { list: () => '', add: () => null, delete: () => null },
    scanPlayers: () => ({ k: [], b: [] }),
    getFee: () => 0
  };
}

const commands = collectBlueprintCommands();
test(`blueprint command set: ${commands.length} commands`, () => {
  assert.ok(commands.length > 50, `expected >50 commands, got ${commands.length}`);
});

for (const command of commands) {
  test(`dispatch handles blueprint command: ${command}`, async () => {
    const ctx = makeContext(command);
    const handled = await dispatchCommand(ctx);
    assert.equal(handled, true, `command "${command}" not handled by any dispatcher handler`);
  });
}
