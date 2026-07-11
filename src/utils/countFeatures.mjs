import fs from 'node:fs';
import path from 'node:path';

const HANDLERS_DIR = path.join(process.cwd(), 'src', 'handlers');
const PLUGINS_ESM_DIR = path.join(process.cwd(), 'src', 'plugins', 'esm');
const PLUGINS_CJS_DIR = path.join(process.cwd(), 'src', 'plugins', 'cjs');

/**
 * Hitung jumlah case statement di satu file.
 * @param {string} filePath - Path absolut ke file
 * @returns {number}
 */
function countCaseInFile(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  const data = fs.readFileSync(filePath, 'utf8');
  const matches = data.match(/case\s+['"`][^'"`]+['"`]\s*:/g);
  return matches ? matches.length : 0;
}

/**
 * Hitung jumlah file plugin (.js / .mjs) di sebuah directory.
 * File yang diawali underscore (_) diabaikan (misal _pluginmanager.mjs).
 * @param {string} dir - Path absolut ke directory
 * @returns {number}
 */
function countPluginFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((file) => {
    if (file.startsWith('_')) return false;
    return file.endsWith('.js') || file.endsWith('.mjs');
  }).length;
}

/**
 * Hitung total fitur dari semua handler + plugin.
 * @returns {{ handlers: number, esm: number, cjs: number, total: number }}
 */
export function countFeatures() {
  let handlers = 0;

  if (fs.existsSync(HANDLERS_DIR)) {
    const files = fs.readdirSync(HANDLERS_DIR).filter((f) => {
      if (f.startsWith('_') || f.startsWith('index')) return false;
      return f.endsWith('.mjs') || f.endsWith('.js');
    });
    for (const file of files) {
      handlers += countCaseInFile(path.join(HANDLERS_DIR, file));
    }
  }

  const esm = countPluginFiles(PLUGINS_ESM_DIR);
  const cjs = countPluginFiles(PLUGINS_CJS_DIR);
  const total = handlers + esm + cjs;

  return { handlers, esm, cjs, total };
}

/**
 * Format ringkasan fitur sebagai teks.
 * @returns {string}
 */
export function buildFiturText() {
  const { handlers, esm, cjs, total } = countFeatures();
  return `HANDLER : ${handlers}\nESM     : ${esm}\nCJS     : ${cjs}\n\nTOTAL FITUR : ${total}`;
}
