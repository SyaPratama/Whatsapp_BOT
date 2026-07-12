const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('../config/botPaths');

const DEFAULT_VIP_FILE = path.join(DATA_DIR, 'vip.json');

function createVipStore(filePath = DEFAULT_VIP_FILE) {
  let cache = {};

  function ensureDirectory() {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  function loadVIP() {
    ensureDirectory();

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const trimmed = raw.trim();
      if (!trimmed) {
        cache = {};
        return cache;
      }
      const parsed = JSON.parse(trimmed);
      cache = (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch (error) {
      cache = {};
      fs.writeFileSync(filePath, JSON.stringify(cache, null, 2));
    }

    return cache;
  }

  function saveVIP() {
    ensureDirectory();
    fs.writeFileSync(filePath, JSON.stringify(cache, null, 2));
    return cache;
  }

  function normalizeJid(jid) {
    if (typeof jid !== 'string') return '';
    const clean = jid.split(':')[0].split('@')[0].replace(/[^0-9]/g, '');
    if (jid.endsWith('@lid')) {
      return `${clean}@lid`;
    }
    return `${clean}@s.whatsapp.net`;
  }

  function isVIP(jid) {
    const cleaned = normalizeJid(jid);
    const data = loadVIP();
    const entry = data[cleaned];
    if (!entry) return false;

    return Date.now() < new Date(entry.expired).getTime();
  }

  function addVIP(jid, days) {
    loadVIP();
    const cleaned = normalizeJid(jid);

    const durationDays = Number(days) || 0;
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() + durationDays);

    cache[cleaned] = {
      added: new Date().toISOString(),
      expired: expiredDate.toISOString(),
      days: durationDays
    };

    saveVIP();
    return cache[cleaned];
  }

  function delVIP(jid) {
    loadVIP();
    const cleaned = normalizeJid(jid);
    delete cache[cleaned];
    saveVIP();
    return true;
  }

  function listVIP() {
    return loadVIP();
  }

  return {
    filePath,
    loadVIP,
    saveVIP,
    isVIP,
    addVIP,
    delVIP,
    listVIP
  };
}

const defaultStore = createVipStore();

module.exports = {
  createVipStore,
  ...defaultStore
};