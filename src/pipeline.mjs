import { dispatchCommand } from './handlers/index.mjs';
import { processClaim } from './handlers/geseran.mjs';
import { createInitialState } from './bootstrap/state.mjs';
import { smsg } from './utils/message.js';

// ─── Prefix detection ──────────────────────────────────────────────────────────
function detectPrefix(body) {
  // Semua prefix yang valid
  const prefixRegex = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><`™©®Δ^βα~¦|/\\©^]/;
  return prefixRegex.test(body) ? body.match(prefixRegex)[0] : null;
}

// ─── Build full context per Baileys docs ───────────────────────────────────────
async function buildContext({ sock, m, globalState, deps }) {
  // m already serialized by smsg — use its properties directly
  const body  = m.body || '';
  const from  = m.chat;
  const isGroup   = m.isGroup;
  const isPrivate = !isGroup && from?.endsWith('@s.whatsapp.net');

  const prefix  = detectPrefix(body);
  const isCmd   = prefix !== null && body.startsWith(prefix);
  const command = isCmd ? body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase() : '';
  const args    = body.trim().split(/\s+/).slice(isCmd ? 1 : 0);
  const text    = args.join(' ');

  // quoted already resolved by smsg
  const quoted = m.quoted || m;
  const mime   = (quoted.msg || quoted).mimetype || '';

  // Bot number via decodeJid (added to sock in socket.cjs)
  const botNumber   = await Promise.resolve(sock.decodeJid(sock.user.id));
  const ownerList   = (globalState.owner || []).map((v) => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
  const kontributor = deps.contributors || [];
  const isOwner     = [botNumber, ...kontributor, ...ownerList].includes(m.sender);
  const isPremium   = (deps.premium || []).includes(m.sender);

  // Group metadata — uses cached version if available
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
    conn: sock,        // alias for legacy handler compatibility
    store: sock.store, // alias for legacy handler compatibility
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

// ─── Main entry point per Baileys docs: messages.upsert ───────────────────────
export async function processMessage(sock, m, deps) {
  // Serialize message using smsg — attaches body, sender, chat, quoted, etc.
  // per Baileys documentation pattern
  m = smsg(sock, m, sock.store);
  if (!m || !m.message) return; // Ignore empty / system messages

  const globalState = deps.globalState;

  // autoread per Baileys docs: sock.readMessages([m.key])
  if (globalState.autoread) {
    try { sock.readMessages([m.key]); } catch { /* ignore */ }
  }

  // self mode: only process messages from owner
  if (globalState.self && !(await isOwnerCheck(sock, m, deps))) return;

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
export function createProcessMessage(deps) {
  const globalState = deps.globalState || createInitialState();
  return async (sock, m) => processMessage(sock, m, { ...deps, globalState });
}
