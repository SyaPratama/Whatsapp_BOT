/**
 * @fileoverview Handler untuk manajemen sewa bot WhatsApp berbasis user.
 */

import fs from 'node:fs';
import path from 'node:path';

const SEWA_DB_PATH = path.join(process.cwd(), 'data', 'sewa.json');
const PRICE_PER_DAY = Math.ceil(10380 / 7);

/**
 * Memuat database sewa dari file lokal.
 * @returns {Object} Data sewa user
 */
function loadSewaDb() {
  try {
    return JSON.parse(fs.readFileSync(SEWA_DB_PATH, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Menyimpan database sewa ke file lokal.
 * @param {Object} db - Data sewa yang akan disimpan
 */
function saveSewaDb(db) {
  const dir = path.dirname(SEWA_DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SEWA_DB_PATH, JSON.stringify(db, null, 2));
}

/**
 * Menyimpan state sewa global ke database file.
 * @param {Object} globalState - State aplikasi global
 */
function persist(globalState) {
  saveSewaDb(globalState.sewaDb || {});
}

/**
 * Memformat angka ke format Rupiah dengan huruf kapital (RP).
 * @param {number} num - Angka yang akan diformat
 * @returns {string} String Rupiah terformat (misal: RP 10.380)
 */
function formatRupiah(num) {
  return 'RP ' + num.toLocaleString('id-ID');
}

/**
 * Membuat Order ID unik untuk transaksi sewa.
 * @param {number} days - Jumlah hari sewa
 * @returns {string} Order ID terformat
 */
function generateOrderId(days) {
  const randomID = Math.floor(10000000 + Math.random() * 90000000);
  const timestamp = Date.now();
  return `SEWA-${randomID}-${days}D-${timestamp}`;
}

/**
 * Menambahkan atau memperpanjang masa sewa user.
 * @param {Object} globalState - State aplikasi global
 * @param {Object} params - Parameter fungsi
 * @param {string} params.userJid - WhatsApp JID user
 * @param {number} params.days - Jumlah hari sewa yang dibeli
 * @param {string} params.addedBy - JID pengirim/owner yang menambahkan
 * @returns {Object} Detail hasil penambahan sewa
 */
function addSewa(globalState, { userJid, days, addedBy, customer }) {
  const db = loadSewaDb();
  globalState.sewaDb = db;
  const existing = db[userJid];
  let baseDate = new Date();

  if (existing) {
    const oldExp = new Date(existing.expired);
    if (oldExp > baseDate) {
      baseDate = oldExp;
    }
  }

  const expired = new Date(baseDate.getTime() + days * 86400000);
  const totalDays = existing ? (existing.days + days) : days;

  db[userJid] = {
    added: existing?.added || Date.now(),
    expired: expired.toISOString(),
    days: totalDays,
    paket: `${days} HARI`,
    lastTopup: Date.now(),
    lastTopupDays: days,
    addedBy: addedBy || 'owner',
    customer: customer || existing?.customer || '',
    warned: false
  };
  saveSewaDb(db);
  return { userJid, expired, totalDays, isExtend: !!existing };
}

/**
 * Menghapus masa sewa user dari database.
 * @param {Object} globalState - State aplikasi global
 * @param {string} userJid - WhatsApp JID user
 * @returns {boolean} True jika berhasil dihapus, false jika tidak ditemukan
 */
function removeSewa(globalState, userJid) {
  const db = loadSewaDb();
  globalState.sewaDb = db;
  if (!db[userJid]) return false;
  delete db[userJid];
  saveSewaDb(db);
  return true;
}

/**
 * Mendapatkan daftar seluruh user yang memiliki status sewa.
 * @param {Object} globalState - State aplikasi global
 * @returns {Array} Array pasangan [userJid, dataSewa]
 */
function listSewa(globalState) {
  const db = loadSewaDb();
  globalState.sewaDb = db;
  return Object.entries(db);
}

/**
 * Mendapatkan informasi detail sewa milik user tertentu.
 * @param {Object} globalState - State aplikasi global
 * @param {string} userJid - WhatsApp JID user
 * @returns {Object|null} Objek data sewa atau null jika tidak ada
 */
function getSewaInfo(globalState, userJid) {
  const db = loadSewaDb();
  globalState.sewaDb = db;
  return db[userJid] || null;
}

/**
 * Memeriksa apakah masa sewa user masih aktif.
 * @param {Object} globalState - State aplikasi global
 * @param {string} userJid - WhatsApp JID user
 * @returns {boolean} True jika aktif, false jika tidak aktif/tidak ada
 */
function isSewaActive(globalState, userJid) {
  const data = getSewaInfo(globalState, userJid);
  if (!data) return false;
  return new Date(data.expired) > new Date();
}

/**
 * Handler utama untuk memproses command sewa bot (.sewa, .sewabot, .ceksewa, .cek).
 * @param {Object} ctx - Context pesan dari pipeline
 * @returns {Promise<boolean>} Status apakah command berhasil diproses
 */
export async function handleSewaCommand(ctx) {
  const { command, reply, sock, m, q, args, isOwner, globalState } = ctx;
  const sub = (args[0] || '').toLowerCase();

  switch (command) {
    case 'sewa':
    case 'sewabot':
    case 'order':
    case 'pesanbot':
    case 'infosewa': {
      if (!isOwner && ['add', 'remove', 'list'].includes(sub)) {
        return reply('❌ FITUR INI KHUSUS OWNER.');
      }

      if (isOwner && ['add', 'remove', 'list'].includes(sub)) {
        if (sub === 'add') {
          const mentioned = m.mentionedJid || [];
          let targetJid = mentioned[0] || args[1];
          const daysArg = mentioned.length ? args[1] : args[2];
          const days = parseInt(daysArg, 10);
          const customer = (args.slice(mentioned.length ? 2 : 3).join(' ') || '').trim();

          if (!targetJid || Number.isNaN(days) || days < 1) {
            return reply(`FORMAT: .${command} add @user <hari>\nCONTOH: .${command} add @628xxx 7`);
          }

          if (typeof targetJid === 'string' && /^https?:\/\//i.test(targetJid)) {
            try {
              targetJid = await sock.groupAcceptInvite(targetJid);
            } catch (err) {
              return reply('Gagal join grup dari invite link.');
            }
          }

          const result = addSewa(globalState, {
            userJid: targetJid,
            days,
            addedBy: m.sender,
            customer
          });

          const harga = PRICE_PER_DAY * days;
          const label = result.isExtend ? 'PERPANJANGAN SEWA' : 'SEWA BOT DITAMBAHKAN';

          return reply(`✅ *${label}*

👤 USER    : @${targetJid.split('@')[0]}
📦 PAKET   : +${days} HARI
💰 HARGA   : ${formatRupiah(harga)}
📅 EXPIRED : ${result.expired.toLocaleDateString('id-ID')}
📊 TOTAL   : ${result.totalDays} HARI

_AKSES PRO SUDAH AKTIF._`);
        }

        if (sub === 'remove') {
          const mentioned = m.mentionedJid || [];
          const targetJid = mentioned[0] || args[1];
          if (!targetJid) return reply(`FORMAT: .${command} remove @user`);
          if (!removeSewa(globalState, targetJid)) return reply('❌ USER TIDAK TERDAFTAR SEWA.');
          return reply(`✅ SEWA @${targetJid.split('@')[0]} DIHAPUS.`);
        }

        if (sub === 'list') {
          const entries = listSewa(globalState);
          if (entries.length === 0) return reply('📋 TIDAK ADA USER SEWA AKTIF.');

          let text = '📋 *DAFTAR SEWA BOT*\n\n';
          for (const [jid, data] of entries) {
            const exp = new Date(data.expired);
            const remaining = Math.ceil((exp - Date.now()) / 86400000);
            const status = remaining > 0 ? `✅ ${remaining} HARI LAGI` : '⛔ EXPIRED';
            text += `• @${jid.split('@')[0]}\n  EXPIRED : ${exp.toLocaleDateString('id-ID')} (${status})\n\n`;
          }
          return reply(text);
        }
      }

      const hari = parseInt(args[0], 10);
      if (!args[0]) {
        return reply(`🧾 *INFO SEWA BOT*

💰 HARGA  : *${formatRupiah(PRICE_PER_DAY)}/HARI*
📦 MINIMAL: *1 HARI*

CONTOH HARGA:
 • 1 HARI  = ${formatRupiah(PRICE_PER_DAY * 1)}
 • 3 HARI  = ${formatRupiah(PRICE_PER_DAY * 3)}
 • 7 HARI  = ${formatRupiah(PRICE_PER_DAY * 7)}
 • 14 HARI = ${formatRupiah(PRICE_PER_DAY * 14)}
 • 30 HARI = ${formatRupiah(PRICE_PER_DAY * 30)}

CARA ORDER:
.${command} <jumlah_hari>
CONTOH: .${command} 7`);
      }

      const allowedPackages = new Set([1, 3, 7, 14, 30]);
      if (!allowedPackages.has(hari)) {
        return reply('❌ PAKET TIDAK ADA. SILAKAN PILIH PAKET YANG TERSEDIA (1, 3, 7, 14, 30 HARI).');
      }

      const totalHarga = PRICE_PER_DAY * hari;
      const orderId = generateOrderId(hari);
      const paketLabel = `${hari} HARI`;

      const invoiceText = `🧾 *INVOICE SEWA BOT*

👤 @${m.sender.split('@')[0]}
PAKET    : *${paketLabel}*
TOTAL    : *${formatRupiah(totalHarga)}*
ORDER ID : \`${orderId}\`

SCAN QR DI ATAS UNTUK BAYAR VIA QRIS.
⏳ QR BERLAKU *3 MENIT*.

_AKSES PRO AKTIF OTOMATIS SETELAH PEMBAYARAN TERVERIFIKASI._`;

      const qrisUrl = global.qris || global.thumbnail || global.thumb || 'https://athars.space/uploads/ea2d207f.png';

      try {
        await sock.sendMessage(m.chat, {
          image: { url: qrisUrl },
          caption: invoiceText,
          contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true
          }
        }, { quoted: m });
      } catch (err) {
        console.error('❌ Gagal kirim QRIS:', err.message);
        reply(invoiceText);
      }
      return true;
    }

    case 'ceksewa':
    case 'cek':
    case 'statussewa':
    case 'sewaaktif': {
      globalState.sewaDb = loadSewaDb();

      if (!isOwner && (m.mentionedJid?.length || args[0])) {
        return reply('❌ HANYA OWNER YANG BISA CEK USER LAIN.');
      }

      if (isOwner && (m.mentionedJid?.length || args[0])) {
        const targetJid = m.mentionedJid?.[0] || args[0];
        const data = getSewaInfo(globalState, targetJid);
        if (!data) return reply(`❌ @${targetJid.split('@')[0]} TIDAK TERDAFTAR SEWA.`);
        const exp = new Date(data.expired);
        const remaining = Math.ceil((exp - Date.now()) / 86400000);
        const status = remaining > 0 ? '✅ AKTIF' : '⛔ EXPIRED';
        const displayedPaket = data.paket || `${data.days} HARI`;
        return reply(`📋 *STATUS SEWA*

👤 USER    : @${targetJid.split('@')[0]}
📦 PAKET   : ${displayedPaket}
📅 EXPIRED : ${exp.toLocaleDateString('id-ID')}
⏳ SISA    : ${remaining > 0 ? remaining + ' HARI LAGI' : 'EXPIRED'}
🔰 STATUS  : ${status}`);
      }

      const data = getSewaInfo(globalState, m.sender);
      if (!data) {
        return reply(`❌ *KAMU BELUM PUNYA AKSES PRO*

KETIK *.sewa <hari>* UNTUK ORDER.
CONTOH: .sewa 7`);
      }

      const exp = new Date(data.expired);
      const remaining = Math.ceil((exp - Date.now()) / 86400000);
      const status = remaining > 0 ? '✅ AKTIF' : '⛔ EXPIRED';
      const addedDate = new Date(data.added);
      const displayedPaket = data.paket || `${data.days} HARI`;

      return reply(`📋 *STATUS SEWA BOT*

👤 USER    : @${m.sender.split('@')[0]}
📦 PAKET   : ${displayedPaket}
📅 MULAI   : ${addedDate.toLocaleDateString('id-ID')}
📅 EXPIRED : ${exp.toLocaleDateString('id-ID')}
⏳ SISA    : ${remaining > 0 ? remaining + ' HARI LAGI' : '⛔ SUDAH EXPIRED'}
🔰 STATUS  : ${status}

${remaining <= 0 ? '_Perpanjang sewa dengan .sewa <hari>_' : '_Terima kasih sudah berlangganan!_'}`);
    }

    default:
      return false;
  }
}

export { isSewaActive, getSewaInfo, loadSewaDb };

/**
 * Membuat scheduler pengecekan masa sewa user secara berkala.
 * @param {Object} globalState - State aplikasi global
 * @returns {Function} Fungsi pengecekan berkala
 */
export function createSewaScheduler(globalState) {
  return async function cekSewaExpiry(sock) {
    globalState.sewaDb = loadSewaDb();
    const entries = listSewa(globalState);
    const now = Date.now();
    const oneDay = 86400000;
    for (const [userJid, data] of entries) {
      const expired = new Date(data.expired).getTime();
      const remaining = expired - now;
      try {
        if (remaining <= oneDay && remaining > 0 && !data.warned) {
          data.warned = true;
          persist(globalState);
          const daysLeft = Math.ceil(remaining / oneDay);
          await sock.sendMessage(userJid, { text: `⚠️ *PERINGATAN SEWA BOT*\n\nAKSES PRO KAMU HABIS DALAM *${daysLeft} HARI*.\nPERPANJANG DENGAN *.sewa <hari>*` });
        }
        if (now >= expired) {
          await sock.sendMessage(userJid, { text: '⏰ *AKSES PRO KAMU SUDAH HABIS.*\n\nPERPANJANG DENGAN *.sewa <hari>*' });
          removeSewa(globalState, userJid);
        }
      } catch {
      }
    }
  };
}
