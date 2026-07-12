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

  const fs = require('node:fs');
  const path = require('node:path');
  const loadOwnersFresh = () => {
    const ownerPath = path.join(process.cwd(), 'data', 'owner.json');
    try {
      const raw = JSON.parse(fs.readFileSync(ownerPath, 'utf8'));
      const list = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.owner)) ? raw.owner : [];
      const formatted = list.map(o => {
        if (typeof o === 'string') return { nomor: o.replace(/[^0-9]/g, ''), nama: o === '6285591386135' ? 'Tama' : 'Owner' };
        return { nomor: String(o.nomor || '').replace(/[^0-9]/g, ''), nama: o.nama || 'Owner' };
      }).filter(o => o.nomor);
      return formatted.length > 0 ? formatted : [{ nomor: '6285591386135', nama: 'Tama' }];
    } catch {
      return [{ nomor: '6285591386135', nama: 'Tama' }];
    }
  };

  const owners = loadOwnersFresh();
  globalState.ownerData = owners;
  globalState.owner = owners.map(o => o.nomor);
  globalState.namaown = owners[0]?.nama || 'Owner';

  const botNumber   = await Promise.resolve(sock.decodeJid(sock.user.id));
  const ownerList   = globalState.owner.map((v) => v + '@s.whatsapp.net');
  const kontributor = deps.contributors || [];
  let cleanSender = m.sender ? (m.sender.split(':')[0].split('@')[0] + '@s.whatsapp.net') : '';
  if (m.sender && m.sender.endsWith('@lid') && sock.store?.contacts) {
    const contactsList = sock.store.contacts.values ? Array.from(sock.store.contacts.values()) : Object.values(sock.store.contacts);
    const contact = contactsList.find((c) => c.lid === m.sender);
    console.log('[DEBUG RESOLVER]', {
      sender: m.sender,
      contactsCount: contactsList.length,
      found: !!contact,
      contactId: contact?.id,
      contactLid: contact?.lid
    });
    if (contact && contact.id && contact.id.endsWith('@s.whatsapp.net')) {
      cleanSender = contact.id;
    }
  }
  const isOwner     = [botNumber, ...kontributor, ...ownerList].includes(cleanSender);

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
    isGroup,
    isPrivate,
    isAdmins,
    isBotAdmins,
    isGroupOwner,
    isVIP:          (jid) => {
      if (typeof deps.isVIP !== 'function') return false;
      let target = jid || '';
      if (jid && jid.endsWith('@lid') && sock.store?.contacts) {
        const contactsList = sock.store.contacts.values ? Array.from(sock.store.contacts.values()) : Object.values(sock.store.contacts);
        const contact = contactsList.find((c) => c.lid === jid);
        if (contact && contact.id && contact.id.endsWith('@s.whatsapp.net')) {
          target = contact.id;
        }
      }
      return deps.isVIP(target);
    },
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
  let cleanSender = m.sender ? (m.sender.split(':')[0].split('@')[0] + '@s.whatsapp.net') : '';
  if (m.sender && m.sender.endsWith('@lid') && sock.store?.contacts) {
    const contactsList = sock.store.contacts.values ? Array.from(sock.store.contacts.values()) : Object.values(sock.store.contacts);
    const contact = contactsList.find((c) => c.lid === m.sender);
    if (contact && contact.id && contact.id.endsWith('@s.whatsapp.net')) {
      cleanSender = contact.id;
    }
  }
  return [botNumber, ...ownerList, ...(deps.contributors || [])].includes(cleanSender);
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
  
  const defaultPlaceholders = [
    '[template]', '[hasil]', '[nama]', '[nom]', '[nominal]', 
    '[n1]', '[n2]', '[jml]', '[hari]', '[nomor]', 
    '[@tag]', '[psn]', '[adm|hp|roll|...]'
  ];
  const bodyLower = (ctx.body || '').toLowerCase();
  const hasPlaceholder = defaultPlaceholders.some(p => bodyLower.includes(p));

  if (ctx.isCmd && hasPlaceholder) {
    return ctx.reply('⚠️ *PERINGATAN:* Harap ganti parameter di dalam kurung seperti *[nama]* atau *[nominal]* dengan nilai asli Anda!\n\n*Contoh:* jika menu tertulis \`.depo [nama] [nominal]\`, ketiklah \`.depo budi 50000\`');
  }
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
