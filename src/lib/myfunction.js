const { smsg, fetchJson, sleep, getBuffer, isUrl, format, getRandom, parseMention } = require('../utils/message');

function formatSize(bytes) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

function randomKarakter(length = 8) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}

module.exports = {
  smsg,
  fetchJson,
  sleep,
  getBuffer,
  isUrl,
  format,
  getRandom,
  parseMention,
  formatSize,
  randomKarakter
};
