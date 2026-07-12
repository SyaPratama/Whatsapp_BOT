const moment = require('moment-timezone');
const { getContentType, proto } = require('@whiskeysockets/baileys');

function tanggal(date = new Date()) {
  return moment(date).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss');
}

function getTime() {
  return moment().tz('Asia/Jakarta').format('HH:mm:ss');
}

function isUrl(text) {
  return typeof text === 'string' && /^https?:\/\//i.test(text);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clockString(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

function runtime(seconds) {
  return clockString(seconds * 1000);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  return res.json();
}

async function getBuffer(url) {
  const res = await fetch(url);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}


function format(num) {
  return Number(num || 0).toLocaleString('id-ID');
}

function parseMention(text) {
  if (typeof text !== 'string') return [];
  return [...text.matchAll(/@(\d{5,})/g)].map((m) => `${m[1]}@s.whatsapp.net`);
}

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}


function smsg(conn, m, store) {
  if (!m) return m;
  const M = proto.WebMessageInfo;

  // ── Helper: decode JID synchronously (decodeJid may be sync or async in mocks)
  function resolveJid(jid) {
    if (!jid) return '';
    const clean = jid.split(':')[0].split('@')[0];
    const server = jid.includes('@') ? jid.split('@')[1] : 's.whatsapp.net';
    return `${clean}@${server}`;
  }

  // ── Key fields (only populate if not already set)
  if (m.key) {
    if (!m.id)       m.id       = m.key.id;
    if (!m.chat)     m.chat     = m.key.remoteJid;
    if (m.fromMe === undefined) m.fromMe = m.key.fromMe;
    if (m.isGroup === undefined) m.isGroup = m.chat?.endsWith('@g.us') ?? false;

    // sender: prefer already-set value, fallback to sync resolve
    if (!m.sender) {
      m.sender = resolveJid(
        m.fromMe && conn.user?.id || m.participant || m.key.participant || m.chat || ''
      );
    }
    // Resolve LID JID to phone JID using contact store if available
    if (m.sender && m.sender.endsWith('@lid') && store?.contacts) {
      const contactsVal = store.contacts.values ? Array.from(store.contacts.values()) : Object.values(store.contacts);
      const contact = contactsVal.find(c => c.lid === m.sender);
      if (contact && contact.id && contact.id.endsWith('@s.whatsapp.net')) {
        m.sender = contact.id;
      }
    }
    if (m.isGroup && !m.participant) {
      m.participant = resolveJid(m.key.participant) || '';
    }
    if (!m.isBaileys) {
      m.isBaileys = m.id?.startsWith('BAE5') && m.id.length === 16;
    }
  }

  // ── Message content
  if (m.message) {
    m.mtype = m.mtype || getContentType(m.message);
    m.msg   = m.msg || (m.mtype === 'viewOnceMessage'
      ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)]
      : m.message[m.mtype]);

    // body: prefer already-set value
    if (!m.body) {
      let interactiveBody = '';
      if (m.mtype === 'interactiveResponseMessage' && m.msg?.nativeFlowResponseMessage?.paramsJson) {
        try {
          const parsed = JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson);
          interactiveBody = parsed.id || '';
        } catch {}
      }
      m.body = m.message.conversation
        || m.msg?.caption
        || m.msg?.text
        || (m.mtype === 'listResponseMessage' && m.msg?.singleSelectReply?.selectedRowId)
        || (m.mtype === 'buttonsResponseMessage' && m.msg?.selectedButtonId)
        || interactiveBody
        || (m.mtype === 'viewOnceMessage' && m.msg?.caption)
        || m.text
        || '';
    }

    const quotedRaw = m.msg?.contextInfo ? m.msg.contextInfo.quotedMessage : null;
    m.mentionedJid  = m.msg?.contextInfo ? m.msg.contextInfo.mentionedJid : [];

    if (quotedRaw && !m.quoted) {
      let type = Object.keys(quotedRaw)[0];
      let quotedMsg = quotedRaw[type];
      if (['productMessage'].includes(type)) {
        type = Object.keys(quotedMsg)[0];
        quotedMsg = quotedMsg[type];
      }
      if (typeof quotedMsg === 'string') quotedMsg = { text: quotedMsg };
      m.quoted = quotedMsg;
      m.quoted.mtype = type;
      m.quoted.id    = m.msg.contextInfo.stanzaId;
      m.quoted.chat  = m.msg.contextInfo.remoteJid || m.chat;
      m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false;
      m.quoted.sender  = resolveJid(m.msg.contextInfo.participant);
      const botJid = resolveJid(conn.user?.id);
      const botLid = conn.authState?.creds?.me?.lid ? resolveJid(conn.authState.creds.me.lid) : '';
      m.quoted.fromMe  = m.quoted.sender === botJid || (botLid && m.quoted.sender === botLid);
      m.quoted.text    = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || '';
      m.quoted.mentionedJid = m.msg.contextInfo.mentionedJid || [];

      m.getQuotedObj = m.getQuotedMessage = async () => {
        if (!m.quoted.id) return false;
        const q = await store?.loadMessage?.(m.chat, m.quoted.id);
        return q ? smsg(conn, q, store) : null;
      };

      const vM = m.quoted.fakeObj = M.fromObject({
        key: { remoteJid: m.quoted.chat, fromMe: m.quoted.fromMe, id: m.quoted.id },
        message: quotedRaw,
        ...(m.isGroup ? { participant: m.quoted.sender } : {})
      });

      m.quoted.delete   = () => conn.sendMessage(m.quoted.chat, { delete: vM.key });
      m.quoted.download = () => conn.downloadAndSaveMediaMessage?.(m.quoted.fakeObj);
    }
  }

  // ── Convenience fields (never overwrite)
  if (!m.body) m.body = m.text || '';
  if (!m.text) m.text = m.body;

  if (m.msg?.url && !m.download) {
    m.download = () => conn.downloadAndSaveMediaMessage?.(m);
  }

  if (!m.reply) {
    m.reply = (text, chatId = m.chat, options = {}) =>
      conn.sendMessage(chatId, { text, mentions: m.mentionedJid || [] }, { quoted: m, ...options });
  }

  if (!m.copy) {
    m.copy = () => smsg(conn, M.fromObject(M.toObject(m)), store);
  }

  return m;
}

module.exports = {
  smsg,
  tanggal,
  getTime,
  isUrl,
  sleep,
  clockString,
  runtime,
  fetchJson,
  getBuffer,
  format,
  parseMention,
  getRandom
};
