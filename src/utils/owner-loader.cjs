'use strict';

const fs = require('node:fs');
const path = require('node:path');

function normalizeOwnerEntry(entry) {
  if (typeof entry === 'string') {
    return { nomor: entry.replace(/[^0-9]/g, ''), nama: 'Owner' };
  }
  if (entry && typeof entry === 'object') {
    const nomor = String(entry.nomor || '').replace(/[^0-9]/g, '');
    if (!nomor) return null;
    return { nomor, nama: entry.nama || 'Owner' };
  }
  return null;
}

function loadOwnersFromFile(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  let list;
  if (Array.isArray(parsed)) {
    list = parsed;
  } else if (parsed && Array.isArray(parsed.owner)) {
    list = parsed.owner;
  } else {
    return [];
  }
  return list.map(normalizeOwnerEntry).filter((o) => o && o.nomor.length > 0);
}

function loadOwners({ cwd = process.cwd(), fallback = null } = {}) {
  const ownerPath = path.join(cwd, 'data', 'owner.json');
  const fileExists = fs.existsSync(ownerPath);
  if (!fileExists) {
    if (Array.isArray(fallback) && fallback.length > 0) {
      return fallback
        .map((entry) => (typeof entry === 'string' ? { nomor: entry, nama: 'Owner' } : entry))
        .filter((o) => o && o.nomor);
    }
    return [];
  }
  return loadOwnersFromFile(ownerPath);
}

module.exports = {
  loadOwnersFromFile,
  loadOwners,
  normalizeOwnerEntry
};
