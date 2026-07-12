import fs from 'node:fs';
import path from 'node:path';
import { countFeatures } from '../utils/countFeatures.mjs';
import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';
import buttonHelper from '@ryuu-reinzz/button-helper';

const { sendInteractiveMessage } = buttonHelper;

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

      const headerText = `KB BOT v${ver}\n\nRuntime : ${uptimeString}\nMode    : ${mode}\nFitur   : ${TOTAL}`;

      const sections = [
        {
          title: '🎶 UTAMA — Sistem Taruhan',
          rows: [
            { title: '.openlw [template]', rowId: '.openlw', description: 'Buka sesi taruhan baru dengan template' },
            { title: '.resetlw', rowId: '.resetlw', description: 'Reset/hapus sesi LW aktif' },
            { title: '.k [hasil] / .b [hasil]', rowId: '.k', description: 'Input hasil K atau B (fee 10%)' },
            { title: '.wk/.wb [hasil]', rowId: '.wk', description: 'Input hasil perak (fee bertingkat)' },
            { title: '.cbl', rowId: '.cbl', description: 'Cek balance K vs B saat ini' },
            { title: '.lw', rowId: '.lw', description: 'Rekap lengkap semua taruhan' },
            { title: '.wd', rowId: '.wd', description: 'Lihat semua saldo player' },
            { title: '.chasil', rowId: '.chasil', description: 'Laporan total fee admin' },
            { title: '.fee', rowId: '.fee', description: 'Hitung fee per tim' },
            { title: '.back', rowId: '.back', description: 'Restore backup data sesi LW' }
          ]
        },
        {
          title: '🍨 SALDO & HUTANG',
          rows: [
            { title: '.depo [nama] [nominal]', rowId: '.depo', description: 'Tambah saldo player' },
            { title: '.delsaldo [nama] [nom]', rowId: '.delsaldo', description: 'Kurangi saldo player' },
            { title: '.editsaldo [nama] [nom]', rowId: '.editsaldo', description: 'Ubah saldo secara manual' },
            { title: '.geser [n1] [n2] [nom]', rowId: '.geser', description: 'Transfer saldo antar player' },
            { title: '.bulatkan [nama]', rowId: '.bulatkan', description: 'Bulatkan saldo kelipatan 100' },
            { title: '.dslf/.tslf [nama] [nom]', rowId: '.dslf', description: 'Kurangi / tambah hutang LF' },
            { title: '.lunas [nama]', rowId: '.lunas', description: 'Hapus hutang dari list' },
            { title: '.hapus [nama]', rowId: '.hapus', description: 'Hapus nama dari database' }
          ]
        },
        {
          title: '🎈 AUTO LIST & REKAP',
          rows: [
            { title: '.lk/.lb [nama]', rowId: '.lk', description: 'Tambah player ke tim K atau B' },
            { title: '.list', rowId: '.list', description: 'Lihat list taruhan tersimpan' },
            { title: '.resetlist', rowId: '.resetlist', description: 'Kosongkan list taruhan' },
            { title: '.c [nama]', rowId: '.c', description: 'Cek TF & saldo player' },
            { title: '.r', rowId: '.r', description: 'Rekap total & status list' },
            { title: '.tlk/.klk [nama] [nom]', rowId: '.tlk', description: 'Edit tim K (tambah/kurang/hapus)' },
            { title: '.tlb/.klb [nama] [nom]', rowId: '.tlb', description: 'Edit tim B (tambah/kurang/hapus)' }
          ]
        },
        {
          title: '🎠 GESERAN',
          rows: [
            { title: '.geseran [jml] [nom]', rowId: '.geseran', description: 'Mulai sesi bagi saldo otomatis' },
            { title: '.stopgeseran', rowId: '.stopgeseran', description: 'Hentikan sesi geseran' }
          ]
        },
        {
          title: '🧸 UTILITY',
          rows: [
            { title: '.sewa [hari] [nomor]', rowId: '.sewa', description: 'Order / info harga sewa bot' },
            { title: '.cek', rowId: '.cek', description: 'Cek status sewa aktifmu' },
            { title: '.predik', rowId: '.predik', description: 'Prediksi angka dadu 9D' },
            { title: '.pay', rowId: '.pay', description: 'Tampilkan info pembayaran QRIS' },
            { title: '.setpp', rowId: '.setpp', description: 'Set foto profil grup (reply foto)' },
            { title: '.o [pesan]', rowId: '.o', description: 'Tag semua anggota grup' },
            { title: '.tourl', rowId: '.tourl', description: 'Upload media ke URL (reply media)' },
            { title: '.ping', rowId: '.ping', description: 'Cek kecepatan respons bot' }
          ]
        },
        {
          title: '🍬 OWNER & ADMIN',
          rows: [
            { title: '.addvip/.delvip [@tag]', rowId: '.addvip', description: 'Kelola akses VIP user' },
            { title: '.addown/.delowner [@tag]', rowId: '.addown', description: 'Kelola owner bot (superadmin)' },
            { title: '.listowner', rowId: '.listowner', description: 'List all owner tambahan' },
            { title: '.cekowner', rowId: '.cekowner', description: 'Cek daftar semua owner bot' },
            { title: '.self / .public', rowId: '.self', description: 'Ubah mode bot' },
            { title: '.kick [@tag]', rowId: '.kick', description: 'Keluarkan anggota dari grup' },
            { title: '.tagall/.hidetag [psn]', rowId: '.tagall', description: 'Tag semua (biasa/tersembunyi)' },
            { title: '.del', rowId: '.del', description: 'Hapus pesan bot (reply pesan)' },
            { title: '.setlw [adm|hp|roll|...]', rowId: '.setlw', description: 'Simpan template LW' },
            { title: '.totalfitur', rowId: '.totalfitur', description: 'Lihat jumlah total fitur bot' }
          ]
        }
      ];

      // ── Fallback plain text (selalu siap) ────────────────────────────────
      const plainFallback = () => {
        const lines = [`*🤖 KB BOT v${ver}*`, `Runtime : ${uptimeString}`, `Mode    : ${mode}`, `Fitur   : ${TOTAL}`, ''];
        for (const sec of sections) {
          lines.push(`*${sec.title}*`);
          for (const row of sec.rows) lines.push(`  ${row.title} — ${row.description}`);
          lines.push('');
        }
        reply(lines.join('\n'));
      };

      // ── Interactive List Message (menggunakan @ryuu-reinzz/button-helper) ───
      try {
        const menuSections = sections.map(sec => ({
          title: String(sec.title || '').slice(0, 24),
          rows: sec.rows.map(row => ({
            title: String(row.title || '').slice(0, 24),
            description: String(row.description || '').slice(0, 70),
            id: row.rowId
          }))
        }));

        await sendInteractiveMessage(sock, m.chat, {
          text: headerText,
          title: `🤖 KB BOT v${ver}`,
          footer: '📌 PILIH KATEGORI UNTUK MELIHAT PERINTAH',
          interactiveButtons: [
            {
              name: 'single_select',
              buttonParamsJson: JSON.stringify({
                title: '📋 LIHAT MENU',
                sections: menuSections
              })
            }
          ]
        }, { quoted: m });
        console.log('[menu] ✅ listMessage terkirim via button-helper');
      } catch (err) {
        console.error('[menu] ❌ listMessage error:', err.message);
        plainFallback();
      }
      return true;
    }




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
      const cleanSender = m.sender ? (m.sender.split(':')[0].split('@')[0] + '@s.whatsapp.net') : '';
      const botNumber = await Promise.resolve(sock.decodeJid(sock.user.id));
      const superOwnerJid = `${(globalState.owner?.[0] || '').replace(/[^0-9]/g, '')}@s.whatsapp.net`;
      const isSuperOwner = [botNumber, superOwnerJid].includes(cleanSender);

      if (!isSuperOwner) return reply('❌ Hanya owner utama (superadmin) yang bisa menambah owner!');
      
      const quotedSender = m.quoted?.sender;
      const cleanQuoted = quotedSender ? sock.decodeJid(quotedSender) : null;
      const botLid = sock.authState?.creds?.me?.lid ? sock.decodeJid(sock.authState.creds.me.lid) : null;
      const isQuotedFromBot = m.quoted?.fromMe 
        || (cleanQuoted === botNumber) 
        || (botLid && cleanQuoted === botLid);
      
      const mentioned = m.mentionedJid?.[0] || (m.quoted && !isQuotedFromBot ? m.quoted.sender : null);
      
      if (!mentioned || mentioned.replace(/[^0-9]/g, '').length < 5) {
        return reply('❌ Format parameter tidak sesuai! Silakan tag nomor target atau reply pesan orangnya.');
      }
      const cleanNum = mentioned.replace(/[^0-9]/g, '');
      const cleanText = text.replace(/@[0-9]+/g, '').trim();
      const name = cleanText || 'Owner';

      if (!globalState.owner.includes(cleanNum)) {
        globalState.owner.push(cleanNum);
        if (!globalState.ownerData) globalState.ownerData = [];
        globalState.ownerData.push({ nomor: cleanNum, nama: name });
        try {
          fs.writeFileSync(path.join(process.cwd(), 'data', 'owner.json'), JSON.stringify({
            owner: globalState.ownerData
          }, null, 2));
        } catch (e) {
          console.error('Gagal menulis owner.json:', e.message);
        }
        reply(`Berhasil menambahkan @${cleanNum} dengan nama "${name}" sebagai owner.`);
      } else {
        reply('User tersebut sudah terdaftar sebagai owner.');
      }
      return true;
    }

    case 'delowner': {
      const cleanSender = m.sender ? (m.sender.split(':')[0].split('@')[0] + '@s.whatsapp.net') : '';
      const botNumber = await Promise.resolve(sock.decodeJid(sock.user.id));
      const superOwnerJid = `${(globalState.owner?.[0] || '').replace(/[^0-9]/g, '')}@s.whatsapp.net`;
      const isSuperOwner = [botNumber, superOwnerJid].includes(cleanSender);

      if (!isSuperOwner) return reply('❌ Hanya owner utama (superadmin) yang bisa menghapus owner!');
      
      const quotedSender = m.quoted?.sender;
      const cleanQuoted = quotedSender ? sock.decodeJid(quotedSender) : null;
      const botLid = sock.authState?.creds?.me?.lid ? sock.decodeJid(sock.authState.creds.me.lid) : null;
      const isQuotedFromBot = m.quoted?.fromMe 
        || (cleanQuoted === botNumber) 
        || (botLid && cleanQuoted === botLid);
      
      const who = (m.quoted && !isQuotedFromBot) ? m.quoted.sender : m.text.split(' ')[1] ? `${m.text.split(' ')[1].replace(/[^0-9]/g, '')}@s.whatsapp.net` : null;
      
      if (!who || who.replace(/[^0-9]/g, '').length < 5) {
        return reply('❌ Format parameter tidak sesuai! Silakan tag nomor target atau reply pesan orangnya.');
      }
      const cleanNum = who.replace(/[^0-9]/g, '');
      if (!globalState.owner.includes(cleanNum)) return reply('Dia emang bukan owner.');
      globalState.owner = globalState.owner.filter((id) => id !== cleanNum);
      if (globalState.ownerData) {
        globalState.ownerData = globalState.ownerData.filter((o) => o.nomor !== cleanNum);
      }
      try {
        fs.writeFileSync(path.join(process.cwd(), 'data', 'owner.json'), JSON.stringify({
          owner: globalState.ownerData || []
        }, null, 2));
      } catch (e) {
        console.error('Gagal menulis owner.json:', e.message);
      }
      reply(`Nomor ${cleanNum} dihapus dari daftar owner.`);
      return true;
    }

    case 'listowner':
    case 'listown': {
      if (!isOwner) return reply('Hanya owner.');
      if (!globalState.ownerData || globalState.ownerData.length < 1) return reply('Tidak ada owner tambahan');
      let teks = `\n *#- List all owner*\n`;
      for (const item of globalState.ownerData) {
        teks += `\n* Nama: ${item.nama}\n* Nomor: ${item.nomor}\n* *Tag :* @${item.nomor}\n`;
      }
      const ownerJids = globalState.ownerData.map((v) => `${v.nomor.replace(/[^0-9]/g, '')}@s.whatsapp.net`);
      await sock.sendMessage(m.chat, { text: teks, mentions: ownerJids }, { quoted: m });
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