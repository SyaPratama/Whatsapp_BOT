import fs from 'node:fs';
import path from 'node:path';
import { countFeatures } from '../utils/countFeatures.mjs';

function buildPredikText(input, globalState) {
  const numbers = input.match(/\d+/g);
  if (!numbers || numbers.length < 2) return 'Format salah. Contoh: .predik 43-29';

  const awal = parseInt(numbers[0], 10);
  const akhir = parseInt(numbers[1], 10);
  if (awal < 9 || awal > 54 || akhir < 9 || akhir > 54) return 'Angka harus antara 9-54 (9 Dadu) Bos!';

  const trend = akhir - awal;
  const titikTengah = 31.5;
  const history = globalState.history9d || [];
  history.push({ awal, akhir, trend, time: Date.now() });
  if (history.length > 50) history.shift();
  globalState.history9d = history;

  let prediksi;
  let confidence;
  let rawTop3 = [];

  if (trend < -10) {
    prediksi = 'BESAR';
    confidence = 94.2;
    rawTop3 = [33, 35, 38];
  } else if (trend > 10) {
    prediksi = 'KECIL';
    confidence = 94.2;
    rawTop3 = [22, 25, 28];
  } else if (akhir <= 18) {
    prediksi = 'BESAR';
    confidence = 91.5;
    rawTop3 = [32, 34, 36];
  } else if (akhir >= 45) {
    prediksi = 'KECIL';
    confidence = 91.5;
    rawTop3 = [27, 29, 31];
  } else {
    const a = 1664525;
    const c = 1013904223;
    const mRng = 2 ** 32;
    const seed = (a * akhir + c) % mRng;
    const guess = (seed % 46) + 9;
    prediksi = guess > titikTengah ? 'BESAR' : 'KECIL';
    rawTop3 = [Math.round(guess), Math.round(guess) + 2, Math.round(guess) - 2];
    confidence = 86.8;
  }

  let finalTop3 = rawTop3.map((n) => {
    if (prediksi === 'BESAR' && n <= 31) return n + 10;
    if (prediksi === 'KECIL' && n >= 32) return n - 10;
    return n;
  });

  finalTop3 = [...new Set(finalTop3)]
    .map((n) => Math.min(54, Math.max(9, n)))
    .sort((a, b) => a - b)
    .slice(0, 3);

  const icon = prediksi === 'BESAR' ? '🔴' : '🔵';
  const rangeStr = finalTop3.join(', ');
  const statusTrend = trend < 0 ? 'DOWNTREND 📉' : trend > 0 ? 'UPTREND 📈' : 'STAGNANT ↔️';

  return `⚔️ *Zoee - GOOGLE ATTACK v3.5* ⚔️\n────────────────────────\n♛ *TRACE:* ${awal} ➔ ${akhir}\n🌐 *ENGINE:* Fierlyy  RNG 9-Dadu\n🜲 *TARGET:* ${prediksi} [ ${rangeStr} ] ${icon}\n🔥 *CONFIDENCE:* ${confidence.toFixed(1)}%\n📊 *STATUS:* ${statusTrend}\n────────────────────────\n*SISTEM SUDAH TERKALIBRASI GOOGLE 2026.* 🚬\n*NOTE: Prediksi sinkronisasi zona K/B aktif.*`;
}

export async function handleMiscCommand(ctx) {
  const { command, reply, sock, m, q, args, text, isGroup, isOwner, isOwn, isVIP, quoted, mime, globalState, runtime } = ctx;

  switch (command) {
    case 'menu': {
      const { total: TOTAL } = countFeatures();
      const uptimeString = runtime(process.uptime());
      const mode = globalState.self ? 'Self' : 'Public';
      const userCount = Object.keys(globalState.db_lw || {}).length || 0;
      const W = 36;
      const top = '\u2501'.repeat(W);
      const mid = '\u2500'.repeat(W);
      const sections = [
        { title: 'UTAMA', items: [
          ['.openlw', 'buka sesi LW'],
          ['.resetlw', 'hapus sesi LW'],
          ['.k / .b', 'taruhan (fee 10%)'],
          ['.wk / .wb', 'taruhan perak (fee)'],
          ['.cbl', 'cek balance K vs B'],
          ['.lw', 'rekap lengkap'],
          ['.wd', 'semua saldo player'],
          ['.chasil', 'laporan total fee admin'],
          ['.fee', 'hitung fee per tim'],
          ['.back', 'restore backup']
        ] },
        { title: 'SALDO', items: [
          ['.depo', 'tambah saldo'],
          ['.delsaldo', 'kurangi saldo'],
          ['.editsaldo', 'ubah saldo manual'],
          ['.geser', 'transfer saldo'],
          ['.bulatkan', 'bulatkan kelipatan 100'],
          ['.dslf', 'kurangi hutang LF'],
          ['.tslf', 'tambah hutang LF'],
          ['.lunas', 'hapus hutang'],
          ['.hapus', 'hapus nama']
        ] },
        { title: 'LIST', items: [
          ['.lk / .lb', 'tambah ke tim K/B'],
          ['.list', 'lihat list'],
          ['.resetlist', 'kosongkan list'],
          ['.c', 'cek TF & saldo'],
          ['.r', 'rekap total & status'],
          ['.tlk/.klk/.hlk', 'edit tim K'],
          ['.tlb/.klb/.hlb', 'edit tim B']
        ] },
        { title: 'GESERAN', items: [
          ['.geseran', 'mulai bagi saldo'],
          ['.stopgeseran', 'hentikan sesi']
        ] },
        { title: 'UTILITY', items: [
          ['.pay', 'instruksi QRIS'],
          ['.setpp', 'set PP grup'],
          ['.predik', 'prediksi dadu 9D'],
          ['.busuk', 'respon lose'],
          ['.o', 'tag all'],
          ['.hidetag', 'hidden tag'],
          ['.getcase', 'ambil source case']
        ] }
      ];
      const ver = global.version || '1.0';
      const labelW = 16;
      const valueW = W - labelW - 1;
      const row = (label, value) => {
        const l = ' ' + label.padEnd(labelW, ' ');
        const v = ' ' + String(value).padEnd(valueW, ' ');
        return l + v + ' ';
      };
      const head = (txt) => ' ' + txt.padEnd(W - 2, ' ') + ' ';
      const center = (txt) => {
        const pad = Math.max(0, Math.floor((W - txt.length) / 2));
        return ' '.repeat(pad) + txt + ' '.repeat(W - txt.length - pad);
      };
      const renderSection = (s) => {
        const head1 = ' ' + s.title.padEnd(W - 2, ' ') + ' ';
        const head2 = mid;
        const body = s.items.map(([cmd, desc]) => {
          const c = ' ' + cmd.padEnd(14, ' ');
          const d = ' ' + desc;
          return c + d;
        }).join('\n');
        return head1 + '\n' + head2 + '\n' + body;
      };
      const header =
        top + '\n' +
        head('KB BOT v' + ver) + '\n' +
        mid + '\n' +
        row('Version', ver) + '\n' +
        row('Runtime', uptimeString) + '\n' +
        row('Mode', mode) + '\n' +
        row('Features', TOTAL) + '\n' +
        row('Users', userCount) + '\n' +
        mid + '\n' +
        center('DAFTAR PERINTAH') + '\n' +
        mid;
      const body = sections.map(renderSection).join('\n' + mid + '\n');
      const footer = '\n' + top;
      reply(header + '\n\n' + body + footer);
      return true;
    }

    case 'tes':
    case 'robot':
    case 'xlyy':
    case 'p': {
      if (!m.text.startsWith(ctx.prefix)) return true;
      reply(`*KYY SYSTEM | ONLINE KYY*\n\nYo *${m.pushName || 'No Name'}*! 𝕊𝕦\nBot *KYY NIKA V1* ON 𝔼𝕒\n\n◈ᐯ *GAS SEWA BOT KYY?*\nHubungi Zoee:\n◈ᐅ *Owner:* .owner\n◈ᐅ *WA:* 6289527933537\n\n◈ᐊ *SAT-SET & ANTI EROR* ◈ᐃ`);
      return true;
    }

    case 'busuk': {
      if (!quoted || !quoted.text?.includes('UNDERGROUND SYSTEM')) return reply('Reply chat hasil prediksinya dulu, Bos!');
      const kata = [
        'SISTEM LAGI EROR, BANDOT LAGI LICIN! 𝕊𝕒',
        'POLA BERUBAH, TETEP TENANG, RESET STRATEGI!',
        'DIBAYAR DI NEXT GAME, JANGAN PANIK!',
        'BANDOT LAGI GANTI ALGORITMA, SIKAT LAGI NANTI!'
      ];
      const pick = kata[Math.floor(Math.random() * kata.length)];
      reply(`*BUSUK/LOSE!*\n\n"${pick}"\n_Sistem akan kalibrasi ulang pola._`);
      return true;
    }

    case 'predik': {
      reply(buildPredikText(m.text || q || '', globalState));
      return true;
    }

    case 'pay':
    case 'qr': {
      if (!isGroup) return reply('Perintah ini hanya untuk grup.');
      let ppUrl;
      try {
        ppUrl = await sock.profilePictureUrl(m.chat, 'image');
      } catch {
        ppUrl = 'https://i.ibb.co/vzG72QG/avatar-contact.jpg';
      }
      let caption = `*INSTRUKSI PEMBAYARAN QRIS*\n\nSilakan lakukan pembayaran via *QRIS* berikut:\n- Scan kode QRIS yang telah disediakan.\n- Gunakan aplikasi mobile banking atau e-wallet.\n\n_Setelah pembayaran, kirimkan bukti ke admin grup._\nTerima kasih.`;
      await sock.sendMessage(m.chat, {
        image: { url: ppUrl },
        caption,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true
        }
      }, { quoted: m });
      return true;
    }

    case 'addown': {
      if (!isOwner) return reply('Hanya owner utama yang bisa menambah owner!');
      const mentioned = m.mentionedJid?.[0] || m.quoted?.sender || null;
      if (!mentioned) return reply('Tag nomor atau reply pesan orang yang ingin dijadikan owner!');
      if (!globalState.owner.includes(mentioned)) {
        globalState.owner.push(mentioned);
        reply(`Berhasil menambahkan @${mentioned.split('@')[0]} sebagai owner.`);
      } else {
        reply('User tersebut sudah terdaftar sebagai owner.');
      }
      return true;
    }

    case 'delowner': {
      if (!isOwner) return true;
      const who = m.quoted ? m.quoted.sender : m.text.split(' ')[1] ? `${m.text.split(' ')[1].replace(/[^0-9]/g, '')}@s.whatsapp.net` : null;
      if (!who) return reply('Tag orangnya!');
      if (!globalState.owner.includes(who)) return reply('Dia emang bukan owner.');
      globalState.owner = globalState.owner.filter((id) => id !== who);
      reply(`Nomor ${who.split('@')[0]} dihapus dari daftar owner.`);
      return true;
    }

    case 'listowner':
    case 'listown': {
      if (!isOwner) return reply('Hanya owner.');
      if (!globalState.owner || globalState.owner.length < 1) return reply('Tidak ada owner tambahan');
      let teks = `\n *#- List all owner tambahan*\n`;
      for (const item of globalState.owner) {
        teks += `\n* ${item.split('@')[0]}\n* *Tag :* @${item.split('@')[0]}\n`;
      }
      await sock.sendMessage(m.chat, { text: teks, mentions: globalState.owner }, { quoted: m });
      return true;
    }

    case 'cekvip': {
      if (!isOwner && !isOwn) return reply('Hanya owner.');
      const data = ctx.loadVIP();
      const now = Date.now();
      const target = m.mentionedJid?.[0] ? m.mentionedJid[0] : (args[0] ? `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net` : m.sender);
      if (!data[target]) return reply(target === m.sender ? 'Anda bukan user VIP.' : 'User tersebut bukan VIP.');
      const info = data[target];
      const remaining = Math.ceil((new Date(info.expired).getTime() - now) / 86400000);
      const statusVIP = `============================ *STATUS VIP* ============================\n\nUser  : @${target.split('@')[0]}\nTotal : ${info.days} hari\nSisa  : ${remaining > 0 ? remaining + ' hari lagi' : 'EXPIRED'}\n\n=====================================================================`;
      await sock.sendMessage(m.chat, { text: statusVIP, mentions: [target] }, { quoted: m });
      return true;
    }

    case 'd':
    case 'del':
    case 'delete': {
      if (!quoted) return reply('Reply pesan yang ingin dihapus!');
      if (!isOwner && !isVIP(m.sender)) return reply('Fitur khusus VIP.');
      await sock.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: m.quoted.fromMe,
          id: m.quoted.id,
          participant: m.quoted.sender
        }
      });
      await sock.sendMessage(m.chat, { react: { text: 'OK', key: m.key } });
      return true;
    }

    default:
      return false;
  }
}