export function digitsOnly(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

export function toPnJid(value) {
  const digits = digitsOnly(value);
  if (!digits) return null;
  return `${digits}@s.whatsapp.net`;
}

export function toLidJid(value) {
  const digits = digitsOnly(value);
  if (!digits) return null;
  return `${digits}@lid`;
}

export function jidType(value) {
  if (typeof value !== 'string' || !value) return 'unknown';
  if (value.endsWith('@s.whatsapp.net')) return 'pn';
  if (value.endsWith('@lid')) return 'lid';
  if (value.endsWith('@g.us')) return 'group';
  if (value.endsWith('@newsletter')) return 'channel';
  if (value.endsWith('@broadcast')) return 'broadcast';
  return 'unknown';
}

export function jidUser(value) {
  if (typeof value !== 'string' || !value) return null;
  const at = value.indexOf('@');
  if (at === -1) return value;
  return value.slice(0, at).split(':')[0].split('/')[0];
}

export function normalizeForOwnerCheck(value) {
  if (typeof value !== 'string' || !value) return '';
  const at = value.indexOf('@');
  let prefix;
  let suffix;
  if (at === -1) {
    prefix = value.split(':')[0].split('/')[0];
    suffix = '@s.whatsapp.net';
  } else {
    prefix = value.slice(0, at).split(':')[0].split('/')[0];
    suffix = value.slice(at).split('/')[0];
  }
  return `${prefix}${suffix}`;
}

export function findPnForLid(store, lidJid) {
  if (!lidJid || typeof lidJid !== 'string' || !lidJid.endsWith('@lid')) return null;
  if (!store || !store.contacts) return null;

  const contacts = store.contacts.values ? Array.from(store.contacts.values()) : Object.values(store.contacts);
  const match = contacts.find((c) => c && c.lid === lidJid);
  if (match && typeof match.id === 'string' && match.id.endsWith('@s.whatsapp.net')) {
    return match.id;
  }
  return null;
}

export function resolveSenderJid(senderJid, store) {
  if (!senderJid) return '';
  if (!senderJid.endsWith('@lid')) {
    return senderJid;
  }
  const pn = findPnForLid(store, senderJid);
  if (pn) return pn;
  return senderJid;
}
