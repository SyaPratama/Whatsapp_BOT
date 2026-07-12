const fs = require('node:fs');
const path = require('node:path');

const pkg = require('./../../package.json');
const { bootstrapGlobals, createInitialState } = require('./state.cjs');
const { runtime } = require('./../utils/message');
const { loadVIP, isVIP, addVIP, delVIP } = require('./../services/vipStore.cjs');
const { getFee, scanPlayers } = require('./../services/lwGame.cjs');
const { antilinkRegex } = require('./../config/botPaths.cjs');

function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function bootstrapRuntime() {
  const globalState = createInitialState();
  bootstrapGlobals(global, { antilinkRegex });
  globalState.geseran = global.geseran;
  globalState.db_lw = global.db_lw;
  globalState.antilink = global.antilink;
  globalState.autoList = global.autoList;
  globalState.owner = global.owner || ['6289527933537'];
  globalState.namaown = global.namaown || pkg.name;

  const OWNER_PATH = path.join(process.cwd(), 'data', 'owner.json');

  const ownerData = readJsonFile(OWNER_PATH, { owner: [{ nomor: '6285591386135', nama: 'Tama' }] });
  let rawOwners = [];
  if (Array.isArray(ownerData)) {
    rawOwners = ownerData;
  } else if (ownerData && Array.isArray(ownerData.owner)) {
    rawOwners = ownerData.owner;
  }

  const owners = rawOwners.map((o) => {
    if (typeof o === 'string') {
      return { nomor: o.replace(/[^0-9]/g, ''), nama: o === '6285591386135' ? 'Tama' : 'Owner' };
    }
    if (o && typeof o === 'object') {
      return { nomor: (o.nomor || '').replace(/[^0-9]/g, ''), nama: o.nama || 'Owner' };
    }
    return null;
  }).filter(Boolean);

  globalState.owner = owners.map((o) => o.nomor);
  globalState.ownerData = owners;
  globalState.namaown = owners[0]?.nama || 'Owner';

  return {
    globalState,
    contributors: [],
    loadVIP,
    isVIP,
    addVIP,
    delVIP,
    CatBox: null,
    TelegraPh: null,
    UploadFileUgu: null,
    floNime: null,

    runtime,
    Case: null,
    scanPlayers,
    getFee,
    thumbnail: global.thumbnail,
    BotName: pkg.name,
    saveSewa: () => null
  };
}

module.exports = { bootstrapRuntime };