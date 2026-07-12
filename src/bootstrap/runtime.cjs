const fs = require('node:fs');
const path = require('node:path');

const pkg = require('./../../package.json');
const { bootstrapGlobals, createInitialState } = require('./state.cjs');
const { runtime } = require('./../utils/message');
const { loadVIP, isVIP, addVIP, delVIP } = require('./../services/vipStore.cjs');
const { getFee, scanPlayers } = require('./../services/lwGame.cjs');
const { antilinkRegex } = require('./../config/botPaths.cjs');
const { loadOwners } = require('./../utils/owner-loader.cjs');

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

  const owners = loadOwners({ cwd: process.cwd() });
  globalState.owner = owners.map((o) => o.nomor);
  globalState.ownerData = owners;
  globalState.namaown = owners[0]?.nama || pkg.name;

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