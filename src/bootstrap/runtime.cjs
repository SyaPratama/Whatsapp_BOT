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
  const PREMIUM_PATH = path.join(process.cwd(), 'data', 'premium.json');

  const ownerList = readJsonFile(OWNER_PATH, globalState.owner);
  const premiumFile = readJsonFile(PREMIUM_PATH, { premium: [] });
  const premium = Array.isArray(premiumFile) ? premiumFile : (premiumFile.premium || []);

  return {
    globalState,
    contributors: [],
    premium,
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