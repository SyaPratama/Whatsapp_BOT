/**
 * @fileoverview File entry point utama untuk menjalankan WhatsApp bot.
 * Melakukan inisialisasi koneksi, pairing code, dan penanganan lifecycle bot.
 */

const _origWarn = console.warn;
console.warn = (...args) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('Closing open session') || msg.includes('Closing session')) return;
  _origWarn.apply(console, args);
};

require('./config');
const path = require('node:path');
const readline = require('node:readline');
const fs = require('node:fs');
const { createSocketManager } = require('./src/core/socket.cjs');
const { bootstrapRuntime } = require('./src/bootstrap/runtime.cjs');
const { createProcessMessage } = require('./src/pipeline.cjs');
const qrcodeTerminal = require('qrcode-terminal');

/**
 * Membersihkan dan memformat input nomor telepon ke standar internasional (62xxx).
 * @param {string} input - Nomor telepon mentah dari input
 * @returns {string} Nomor telepon terformat bersih
 */
function normalizePhoneNumber(input) {
  let num = String(input || '').trim().replace(/[\s\-().]/g, '');
  if (num.startsWith('+')) num = num.slice(1);
  if (num.startsWith('0')) num = '62' + num.slice(1);
  return num;
}

/**
 * Memvalidasi apakah nomor telepon memiliki panjang digit yang valid.
 * @param {string} num - Nomor telepon hasil normalisasi
 * @returns {boolean} True jika panjang digit valid
 */
function isValidPhoneNumber(num) {
  return /^\d{10,15}$/.test(num);
}

/**
 * Membuka prompt CLI untuk meminta nomor telepon untuk pairing jika belum ada sesi.
 * @returns {Promise<string>} Promise yang menghasilkan nomor telepon terformat
 */
function askPhoneNumber() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    function prompt() {
      rl.question('\n[bot] Masukkan nomor WhatsApp (contoh: 08123456789 atau 628123456789):\n> ', (answer) => {
        const normalized = normalizePhoneNumber(answer);
        if (!isValidPhoneNumber(normalized)) {
          console.log('[bot] ❌ Format nomor tidak valid. Coba lagi.');
          prompt();
        } else {
          console.log(`[bot] ✅ Nomor digunakan: ${normalized}`);
          rl.close();
          resolve(normalized);
        }
      });
    }

    prompt();
  });
}

/**
 * Menampilkan pairing code WhatsApp di terminal dalam format terpisah.
 * @param {string} code - Kode pairing dari Baileys
 */
function printPairing(code) {
  console.log('\n========================================');
  console.log('  WHATSAPP PAIRING CODE');
  console.log('  ' + code);
  console.log('========================================');
  console.log('Buka WhatsApp > Linked Devices > Link a Device > Link with phone number');
  console.log('Masukkan kode di atas.\n');
}

/**
 * Menghasilkan dan mencetak QR Code di terminal jika tidak menggunakan pairing code.
 * @param {string} qr - String QR Code dari Baileys
 */
function printQr(qr) {
  if (global.usePairingCode === true) return;
  if (!qr) return;
  console.log('\n[bot] Silakan scan QR code di bawah dengan WhatsApp Anda:');
  qrcodeTerminal.generate(qr, { small: true });
  console.log('[bot] Buka WhatsApp > Linked Devices > Link a Device\n');
}

/**
 * Menangani graceful shutdown dengan mendengarkan sinyal terminasi sistem.
 */
function attachShutdown() {
  const handler = () => {
    console.log('\n[bot] shutting down');
    process.exit(0);
  };
  process.once('SIGINT', handler);
  process.once('SIGTERM', handler);
}

/**
 * Fungsi utama untuk memuat state, memproses koneksi soket, dan mendaftarkan event handler.
 */
async function main() {
  attachShutdown();
  const runtime = bootstrapRuntime();
  const processMessage = createProcessMessage(runtime);

  let pairingNumber = '';
  const usePairingCode = global.usePairingCode === true;

  if (usePairingCode) {
    const sessionDir = path.join(process.cwd(), 'session');
    const credsPath = path.join(sessionDir, 'creds.json');

    let alreadyRegistered = false;
    let registeredNumber = '';
    try {
      const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
      alreadyRegistered = creds.registered === true;
      if (creds.me && creds.me.id) {
        registeredNumber = normalizePhoneNumber(creds.me.id.split(':')[0].split('@')[0]);
      }
    } catch {
    }

    const configNumber = normalizePhoneNumber(global.pairingNumber || '');

    if (alreadyRegistered) {
      console.log('[bot] Sesi aktif ditemukan, langsung terhubung...');
      pairingNumber = registeredNumber || configNumber;
    } else {
      if (isValidPhoneNumber(configNumber)) {
        pairingNumber = configNumber;
        console.log(`[bot] Menggunakan nomor dari config: ${pairingNumber}`);
      } else {
        pairingNumber = await askPhoneNumber();
      }
    }
  }

  const manager = createSocketManager({
    sessionDir: path.join(process.cwd(), 'session'),
    usePairingCode,
    pairingNumber,
    pairingPhoneCode: String(global.pairingPhoneCode || ''),
    platform: String(global.platform || 'android'),
    onPairingCode: printPairing,
    onQr: printQr,
    onConnectionUpdate: (update) => {
      if (update.connection === 'connecting') console.log('[bot] connecting...');
      if (update.connection === 'open') console.log('[bot] ✅ connected');
      if (update.connection === 'close') {
        const code = update.lastDisconnect?.error?.output?.statusCode;
        const silentCodes = new Set([515, 408, 428, 503]);
        if (code && silentCodes.has(code)) {
          console.log(`[bot] reconnecting... (${code})`);
        } else if (code === 440) {
          console.log('[bot] ⚠️ sesi digantikan device lain. Pastikan tidak ada bot lain yang jalan.');
        } else if (code === 401) {
          console.log('[bot] ❌ logged out — sesi dihapus, restart...');
        } else if (code) {
          console.error(`[bot] ❌ disconnected: ${code} — ${update.lastDisconnect.error.message}`);
        } else {
          console.log('[bot] reconnecting...');
        }
      }
    },
    onMessage: async (sock, message) => {
      await processMessage(sock, message);
    }
  });

  await manager.start();

  process.on('uncaughtException', (error) => {
    console.error('[bot] uncaught:', error.message);
  });
}

main().catch((error) => {
  console.error('[bot] fatal:', error.message);
  process.exit(1);
});