'use strict';

// ─── Prefix detection ──────────────────────────────────────────────────────────
function detectPrefix(body) {
  const prefixRegex = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><`™©®Δ^βα~¦|/\\©^]/;
  return prefixRegex.test(body) ? body.match(prefixRegex)[0] : null;
}

// ─── Build full context per Baileys docs ───────────────────────────────────────
async function buildContext({ sock, m, globalState, deps }) {
  const body  = m.body || '';
  const from  = m.chat;
  const isGroup   = m.isGroup;
  const isPrivate = !isGroup && from?.endsWith('@s.whatsapp.net');

  const prefix  = detectPrefix(body);
  const isCmd   = prefix !== null && body.startsWith(prefix);
  const command = isCmd ? body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase() : '';
  const args    = body.trim().split(/\s+/).slice(isCmd ? 1 : 0);
  const text    = args.join(' ');

  const quoted = m.quoted || m;
  const mime   = (quoted.msg || quoted).mimetype || '';

  const botNumber   = await Promise.resolve(sock.decodeJid(sock.user.id));
  const ownerList   = (globalState.owner || []).map((v) => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
  const kontributor = deps.contributors || [];
  const isOwner     = [botNumber, ...kontributor, ...ownerList].includes(m.sender);
  const isPremium   = (deps.premium || []).includes(m.sender);

  let groupMetadata = {};
  if (isGroup) {
    groupMetadata = await sock.groupMetadata(from).catch(() => ({}));
  }

  const participants = isGroup
    ? (groupMetadata.participants || []).map((p) => ({
        id:    p.id    || null,
        jid:   p.jid   || null,
        lid:   p.lid   || null,
        admin: p.admin === 'superadmin' ? 'superadmin' : p.admin === 'admin' ? 'admin' : null
      }))
    : [];

  const groupAdmins  = participants.filter((p) => p.admin).map((p) => p.jid || p.id);
  const isBotAdmins  = isGroup ? groupAdmins.includes(botNumber) : false;
  const isAdmins     = isGroup ? groupAdmins.includes(m.sender)  : false;
  const isGroupOwner = isGroup ? (participants.find((p) => p.admin === 'superadmin')?.jid || '') === m.sender : false;

  const reply = (textValue) => sock.sendMessage(from, { text: textValue }, { quoted: m });

  return {
    sock,
    m,
    conn: sock,
    store: sock.store,
    q: text,
    text,
    args,
    command,
    prefix,
    usedPrefix: prefix,
    isCmd,
    isOwner,
    isOwn: isOwner,
    isPremium,
    isGroup,
    isPrivate,
    isAdmins,
    isBotAdmins,
    isGroupOwner,
    isVIP:          (jid) => (typeof deps.isVIP === 'function' ? deps.isVIP(jid) : false),
    globalState,
    runtime:        deps.runtime,
    loadVIP:        deps.loadVIP,
    addVIP:         deps.addVIP,
    delVIP:         deps.delVIP,
    CatBox:         deps.CatBox,
    TelegraPh:      deps.TelegraPh,
    UploadFileUgu:  deps.UploadFileUgu,
    floNime:        deps.floNime,
    ytdl:           deps.ytdl,
    yts:            deps.yts,
    thumbnail:      deps.thumbnail,
    Case:           deps.Case,
    scanPlayers:    deps.scanPlayers,
    getFee:         deps.getFee,
    botNumber,
    quoted,
    mime,
    body,
    participants,
    groupMetadata,
    groupAdmins,
    sender:       m.sender,
    senderNumber: (typeof m.sender === 'string' ? m.sender.split('@')[0] : '') || '',
    from,
    reply
  };
}

// ─── Owner guard ───────────────────────────────────────────────────────────────
async function isOwnerCheck(sock, m, deps) {
  const botNumber = await Promise.resolve(sock.decodeJid(sock.user.id));
  const ownerList = (deps.globalState?.owner || []).map((v) => `${v.replace(/[^0-9]/g, '')}@s.whatsapp.net`);
  return [botNumber, ...ownerList, ...(deps.contributors || [])].includes(m.sender);
}

// ─── Main entry point ─────────────────────────────────────────────────────────
async function processMessage(sock, m, deps) {
  const { smsg } = require('./utils/message.js');

  // Serialize message via smsg — aligns m.body, m.sender, m.chat, m.quoted etc.
  // per Baileys documentation pattern
  m = smsg(sock, m, sock.store);
  if (!m || !m.message) return;

  const globalState = deps.globalState;

  if (globalState.autoread) {
    try { sock.readMessages([m.key]); } catch { /* ignore */ }
  }

  if (globalState.self && !(await isOwnerCheck(sock, m, deps))) return;

  // Dynamic import ESM handlers
  const { dispatchCommand } = await import('./handlers/index.mjs');
  const { processClaim }    = await import('./handlers/geseran.mjs');

  const ctx = await buildContext({ sock, m, globalState, deps });
  const handled = await dispatchCommand(ctx);
  if (!handled) {
    await processClaim(
      globalState,
      { ...m, isGroup: ctx.isGroup, chat: m.chat, sender: m.sender },
      ctx.body
    );
  }
}

// ─── Factory for main.js ──────────────────────────────────────────────────────
function createProcessMessage(deps) {
  const { createInitialState } = require('./bootstrap/state.cjs');
  const globalState = deps.globalState || createInitialState();
  return async (sock, m) => processMessage(sock, m, { ...deps, globalState });
}

module.exports = { createProcessMessage, processMessage };
