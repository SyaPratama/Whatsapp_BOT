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
      const mode = globalState.self ? 'SELF' : 'PUBLIC';
      const ver = global.version || '1.0';

      const headerText = `╭─────────────────────╮\n│  🤖  *KB BOT v${ver}*  │\n╰─────────────────────╯\n\n📊 *STATUS*\n┣ 🕒 Runtime  : ${uptimeString}\n┣ 🌐 Mode     : ${mode}\n┣ ⚡ Fitur    : ${TOTAL}\n╰────────────────────`;

      const listMessage = {
        text: headerText,
        footer: '📌 Pilih kategori untuk melihat perintah',
        title: '🤖 KB BOT MENU',
        buttonText: '📋 LIHAT MENU',
        sections: [
          {
            title: '🎶 UTAMA — Sistem Taruhan',
            rows: [
              { title: '.openlw', rowId: 'cmd_openlw', description: 'Buka sesi taruhan baru' },
              { title: '.resetlw', rowId: 'cmd_resetlw', description: 'Reset/hapus sesi LW' },
              { title: '.k / .b', rowId: 'cmd_kb', description: 'Input taruhan K atau B (fee 10%)' },
              { title: '.wk / .wb', rowId: 'cmd_wkwb', description: 'Input taruhan perak (fee bertingkat)' },
              { title: '.cbl', rowId: 'cmd_cbl', description: 'Cek balance K vs B' },
              { title: '.lw', rowId: 'cmd_lw', description: 'Rekap lengkap semua taruhan' },
              { title: '.wd', rowId: 'cmd_wd', description: 'Lihat semua saldo player' },
              { title: '.chasil', rowId: 'cmd_chasil', description: 'Laporan total fee admin' },
              { title: '.fee', rowId: 'cmd_fee', description: 'Hitung fee per tim' },
              { title: '.back', rowId: 'cmd_back', description: 'Restore backup data' }
            ]
          },
          {
            title: '🍨 SALDO & HUTANG',
            rows: [
              { title: '.depo', rowId: 'cmd_depo', description: 'Tambah saldo player' },
              { title: '.delsaldo', rowId: 'cmd_delsaldo', description: 'Kurangi saldo player' },
              { title: '.editsaldo', rowId: 'cmd_editsaldo', description: 'Ubah saldo secara manual' },
              { title: '.geser', rowId: 'cmd_geser', description: 'Transfer saldo antar player' },
              { title: '.bulatkan', rowId: 'cmd_bulatkan', description: 'Bulatkan saldo kelipatan 100' },
              { title: '.dslf / .tslf', rowId: 'cmd_slf', description: 'Kurangi / tambah hutang LF' },
              { title: '.lunas', rowId: 'cmd_lunas', description: 'Hapus hutang dari list' },
              { title: '.hapus', rowId: 'cmd_hapus', description: 'Hapus nama dari database' }
            ]
          },
          {
            title: '🎈 AUTO LIST & REKAP',
            rows: [
              { title: '.lk / .lb', rowId: 'cmd_lklb', description: 'Tambah player ke tim K atau B' },
              { title: '.list', rowId: 'cmd_list', description: 'Lihat list taruhan tersimpan' },
              { title: '.resetlist', rowId: 'cmd_resetlist', description: 'Kosongkan list taruhan' },
              { title: '.c', rowId: 'cmd_c', description: 'Cek TF & saldo player' },
              { title: '.r', rowId: 'cmd_r', description: 'Rekap total & status' },
              { title: '.tlk / .klk / .hlk', rowId: 'cmd_editk', description: 'Edit tim K (tambah/kurang/hapus)' },
              { title: '.tlb / .klb / .hlb', rowId: 'cmd_editb', description: 'Edit tim B (tambah/kurang/hapus)' }
            ]
          },
          {
            title: '🎠 GESERAN',
            rows: [
              { title: '.geseran <jml> <saldo>', rowId: 'cmd_geseran', description: 'Mulai sesi bagi saldo otomatis' },
              { title: '.stopgeseran', rowId: 'cmd_stopgeseran', description: 'Hentikan sesi geseran' }
            ]
          },
          {
            title: '🧸 UTILITY',
            rows: [
              { title: '.sewa <hari>', rowId: 'cmd_sewa', description: 'Order / info harga sewa bot' },
              { title: '.cek', rowId: 'cmd_cek', description: 'Cek status sewa aktifmu' },
              { title: '.predik', rowId: 'cmd_predik', description: 'Prediksi angka dadu 9D' },
              { title: '.pay', rowId: 'cmd_pay', description: 'Tampilkan info pembayaran QRIS' },
              { title: '.setpp', rowId: 'cmd_setpp', description: 'Set foto profil grup' },
              { title: '.o', rowId: 'cmd_o', description: 'Tag semua anggota grup' },
              { title: '.tourl', rowId: 'cmd_tourl', description: 'Upload media ke URL publik' },
              { title: '.ping', rowId: 'cmd_ping', description: 'Cek kecepatan respons bot' }
            ]
          },
          {
            title: '🍬 OWNER & ADMIN',
            rows: [
              { title: '.addvip / .delvip', rowId: 'cmd_vip', description: 'Kelola akses VIP user' },
              { title: '.self / .public', rowId: 'cmd_mode', description: 'Ubah mode bot' },
              { title: '.kick', rowId: 'cmd_kick', description: 'Keluarkan anggota dari grup' },
              { title: '.tagall / .hidetag', rowId: 'cmd_tag', description: 'Tag semua (biasa/tersembunyi)' },
              { title: '.del', rowId: 'cmd_del', description: 'Hapus pesan' },
              { title: '.setlw', rowId: 'cmd_setlw', description: 'Simpan template LW' },
              { title: '.totalfitur', rowId: 'cmd_totalfitur', description: 'Lihat jumlah total fitur bot' }
            ]
          }
        ],
        listType: 1
      };

      try {
        await sock.sendMessage(m.chat, { listMessage }, { quoted: m });
      } catch {
        // Fallback: plain text menu jika listMessage tidak didukung klien
        const lines = ['```', `KB BOT v${ver}`, `Runtime : ${uptimeString}`, `Mode    : ${mode}`, `Fitur   : ${TOTAL}`, '```', ''];
        for (const sec of listMessage.sections) {
          lines.push(`*${sec.title}*`);
          for (const row of sec.rows) {
            lines.push(`  ${row.title} — ${row.description}`);
          }
          lines.push('');
        }
        reply(lines.join('\n'));
      }
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