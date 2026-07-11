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
      cache = raw.trim() ? JSON.parse(raw) : {};
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

  function isVIP(jid) {
    const data = loadVIP();
    const entry = data[jid];
    if (!entry) return false;

    return Date.now() < new Date(entry.expired).getTime();
  }

  function addVIP(jid, days) {
    loadVIP();

    const durationDays = Number(days) || 0;
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() + durationDays);

    cache[jid] = {
      added: new Date().toISOString(),
      expired: expiredDate.toISOString(),
      days: durationDays
    };

    saveVIP();
    return cache[jid];
  }

  function delVIP(jid) {
    loadVIP();
    delete cache[jid];
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