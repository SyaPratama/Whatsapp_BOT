function getFeePerak(nominal) {
  if (nominal >= 100000) return 11000 + Math.floor((nominal - 100000) / 100000) * 10000;
  if (nominal >= 90000) return 10000;
  if (nominal >= 80000) return 9000;
  if (nominal >= 70000) return 8000;
  if (nominal >= 60000) return 7000;
  if (nominal >= 50000) return 6000;
  if (nominal >= 40000) return 5000;
  if (nominal >= 30000) return 4000;
  if (nominal >= 20000) return 3000;
  if (nominal >= 10000) return 2000;
  if (nominal >= 2000) return 1000;
  if (nominal >= 1000) return 500;
  if (nominal >= 901) return 400;
  if (nominal >= 801) return 350;
  if (nominal >= 701) return 300;
  if (nominal >= 601) return 250;
  if (nominal >= 501) return 200;
  if (nominal >= 401) return 150;
  if (nominal >= 301) return 120;
  if (nominal >= 201) return 100;
  if (nominal >= 100) return 50;
  return 0;
}

function ensureDb(globalState, userId) {
  if (!globalState.db_lw[userId]) return null;
  const db = globalState.db_lw[userId];
  db.players = db.players || {};
  db.miskin = db.miskin || [];
  db.games = db.games || [];
  return db;
}

function ensureAutoList(globalState, chatId) {
  if (!globalState.autoList) globalState.autoList = {};
  if (!globalState.autoList[chatId]) globalState.autoList[chatId] = { K: [], B: [] };
  return globalState.autoList[chatId];
}

function buildLwSummary(db) {
  const totalDPR = Object.values(db.players).reduce((sum, player) => sum + (player.saldo || 0), 0);
  const totalRakyat = db.miskin.reduce((sum, item) => sum + (parseInt(item.nominal, 10) || 0), 0);
  const sortedPlayers = Object.entries(db.players)
    .filter(([, value]) => value.saldo > 0)
    .sort((a, b) => b[1].saldo - a[1].saldo);

  const today = new Date();
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][today.getDay()];

  let text = `🥷 *ADMIN : ${db.admin}*\n`;
  text += `📱 *DEVIC : ${db.dev}*\n`;
  text += `🎲 *ROLL : ${db.roll}*\n`;
  text += `⌚ *TIME : ${db.waktu}*\n`;
  text += `💰 *DANA : ${db.dana}*\n\n`;
  text += `${hari}, ${today.toLocaleDateString('id-ID')}\n`;
  db.games.forEach((res, index) => {
    text += `GAME ${index + 1} : ${res}\n`;
  });
  text += `\nSALDO: *(${totalDPR})*\n`;
  sortedPlayers.forEach(([name, data], index) => {
    const crown = index === 0 ? ' 👑' : '';
    text += `${name.toUpperCase()} ${data.saldo}${crown}\n`;
  });
  text += `\nMINUS: *(-${totalRakyat})*\n`;
  db.miskin.forEach((item) => {
    text += `${item.nama.toUpperCase()} ${item.nominal}\n`;
  });
  return text;
}

function buildSimpleLwText(db) {
  const totalDPR = Object.values(db.players).reduce((sum, player) => sum + (player.saldo || 0), 0);
  const totalRakyat = db.miskin.reduce((sum, item) => sum + (parseInt(item.nominal, 10) || 0), 0);
  const sortedPlayers = Object.entries(db.players)
    .filter(([, value]) => value.saldo > 0)
    .sort((a, b) => b[1].saldo - a[1].saldo);
  let text = `🏦 *RINCIAN SALDO KAS (WD)*\n\n💰 *TOTAL DPR : ${totalDPR}*\n`;
  sortedPlayers.forEach(([name, data], index) => {
    text += `• ${name.toUpperCase()} : ${data.saldo}${index === 0 ? ' 👑' : ''}\n`;
  });
  text += `\n📉 *TOTAL RAKYAT : -${totalRakyat}*\n`;
  db.miskin.forEach((item) => {
    text += `• ${item.nama.toUpperCase()} : ${item.nominal}\n`;
  });
  return text;
}

export async function handleLwCommand(ctx) {
  const {
    command,
    reply,
    sock,
    m,
    q,
    text,
    args,
    isOwner,
    isVIP,
    isGroup,
    isAdmins,
    isBotAdmins,
    globalState,
    scanPlayers,
    getFee,
    hitungTotal,
    startTime,
    runtime,
    loadVIP
  } = ctx;

  const userId = m.sender;

  switch (command) {
    case 'lk':
    case 'listk':
    case 'lb':
    case 'listb': {
      if (!m.text.startsWith(ctx.prefix)) return true;
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');

      const list = ensureAutoList(globalState, m.chat);
      const parts = q.trim().split(/\s+/);
      if (parts.length < 2) return reply('🜲 *Format:* .lk Nama Nominal\n► *Contoh:* .lk okta 132\n► *LF:* .lk fierlyy 50lf');

      const nama = parts[0];
      const nominalRaw = parts[1];
      const nominal = parseInt(nominalRaw, 10);
      const isLF = nominalRaw.toLowerCase().includes('lf');
      if (Number.isNaN(nominal) || nominal <= 0) return reply('🜲 *Nominal harus angka!*');

      const team = ['lk', 'listk'].includes(command) ? 'K' : 'B';
      list[team].push({ nama, nominal, mark: isLF ? 'lf' : '' });
      reply(`✔ *BERHASIL DITAMBAHKAN* 🜲\n► Team: *${team}*\n► Nama: *${nama}*\n► Nominal: *${nominal}${isLF ? 'lf' : ''}*`);
      return true;
    }

    case 'resetlist':
    case 'clearlist':
    case 'hapuslist': {
      if (!m.text.startsWith(ctx.prefix)) return true;
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      globalState.autoList[m.chat] = { K: [], B: [] };
      reply('✅ List dikosongkan.');
      return true;
    }

    case 'tlk':
    case 'tambahk':
    case 'klk':
    case 'kurangk':
    case 'hlk':
    case 'hapusk':
    case 'tlb':
    case 'tambahb':
    case 'klb':
    case 'kurangb':
    case 'hlb':
    case 'hapusb': {
      if (!m.text.startsWith(ctx.prefix)) return true;
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      const list = ensureAutoList(globalState, m.chat);
      const team = ['tlk', 'tambahk', 'klk', 'kurangk', 'hlk', 'hapusk'].includes(command) ? 'K' : 'B';
      const parts = q.trim().split(/\s+/);
      if (['hlk', 'hlb', 'hapusk', 'hapusb'].includes(command)) {
        const nama = q.trim();
        if (!nama) return reply(`🜲 *Format:* .${command} Nama\n► *Contoh:* .${command} fierlyy`);
        const idx = list[team].findIndex((item) => item.nama.toLowerCase() === nama.toLowerCase());
        if (idx === -1) return reply(`❌ Nama *${nama}* tidak ditemukan di Team ${team}.`);
        const removed = list[team][idx];
        list[team].splice(idx, 1);
        return reply(`✔ *BERHASIL DIHAPUS* 🜲\n► Team: ${team}\n► Nama: ${removed.nama}\n► Nominal: ${removed.nominal}`);
      }
      if (parts.length < 2) return reply(`🜲 *Format:* .${command} Nama Nominal\n► *Contoh:* .${command} fierlyy 20`);
      const nama = parts[0];
      const delta = parseInt(parts[1], 10);
      if (Number.isNaN(delta) || delta <= 0) return reply('Nominal harus angka positif!');
      const idx = list[team].findIndex((item) => item.nama.toLowerCase() === nama.toLowerCase());
      if (idx === -1) return reply(`❌ Nama *${nama}* tidak ditemukan di Team ${team}.`);
      if (command.startsWith('t')) {
        list[team][idx].nominal += delta;
        return reply(`✔ *BERHASIL DITAMBAHKAN* 🜲\n► Team: ${team}\n► Nama: ${list[team][idx].nama}\n► Nominal lama: ${list[team][idx].nominal - delta} → *${list[team][idx].nominal}*`);
      }
      const current = list[team][idx].nominal;
      if (delta > current) return reply(`❌ Nominal terlalu besar! Sisa nominal *${nama}* hanya ${current}.`);
      const next = current - delta;
      if (next === 0) {
        list[team].splice(idx, 1);
        return reply(`✔ *BERHASIL DIHAPUS* 🜲\n► Team: ${team}\n► Nama: ${nama}\n► Karena nominal habis (${current} - ${delta} = 0)`);
      }
      list[team][idx].nominal = next;
      return reply(`✔ *BERHASIL DIKURANGI* 🜲\n► Team: ${team}\n► Nama: ${nama}\n► Nominal: ${current} → *${next}* (berkurang ${delta})`);
    }

    case 'lw':
    case 'rekap':
    case 'status': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      const db = ensureDb(globalState, userId);
      if (!db) return reply('Anda belum buka sesi LW. Ketik .openlw dulu.');
      reply(buildLwSummary(db));
      return true;
    }

    case 'wd':
    case 'players':
    case 'saldo': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      const db = ensureDb(globalState, userId);
      if (!db) return reply('Buka sesi LW dulu!');
      reply(buildSimpleLwText(db));
      return true;
    }

    case 'back':
    case 'batal':
    case 'undo': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      const db = ensureDb(globalState, userId);
      if (!db) return reply('Buka sesi LW dulu!');
      if (!db.backup) return reply('Tidak ada data backup.');
      db.players = JSON.parse(JSON.stringify(db.backup.players));
      db.miskin = JSON.parse(JSON.stringify(db.backup.miskin));
      db.games = JSON.parse(JSON.stringify(db.backup.games));
      delete db.backup;
      reply(buildLwSummary(db).replace(/^\| 🥷 \*ADMIN/gm, '⏪ *BACK BERHASIL*\n\n| 🥷 ADMIN'));
      return true;
    }

    case 'delsaldo':
    case 'potongsaldo':
    case 'kurangisaldo': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      const db = ensureDb(globalState, userId);
      if (!db) return reply('Buka sesi LW dulu.');
      const parts = q.trim().split(/\s+/);
      if (parts.length < 2) return reply('Format: .delsaldo Nama Jumlah');
      const nama = parts[0].toLowerCase();
      const jumlah = parseInt(parts[1], 10);
      if (Number.isNaN(jumlah) || jumlah <= 0) return reply('Jumlah harus angka positif!');
      const playerKey = Object.keys(db.players).find((key) => key.toLowerCase() === nama);
      if (!playerKey) return reply(`Player ${nama} tidak ditemukan.`);
      if (db.players[playerKey].saldo < jumlah) return reply('Saldo tidak cukup.');
      db.players[playerKey].saldo -= jumlah;
      if (db.players[playerKey].saldo === 0) delete db.players[playerKey];
      return reply(`✅ Saldo ${playerKey} berkurang ${jumlah}.`);
    }

    case 'geser':
    case 'transfer':
    case 'tf': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      const db = ensureDb(globalState, userId);
      if (!db) return reply('Buka sesi LW dulu.');
      const [pengirim, kataHubung, penerima, nominal] = q.split(' ');
      if (!pengirim || !penerima || !nominal || kataHubung.toLowerCase() !== 'to') return reply('Format: .geser pengirim to penerima nominal');
      const amount = parseInt(nominal, 10);
      if (Number.isNaN(amount) || amount <= 0) return reply('Nominal harus positif.');
      const fromKey = Object.keys(db.players).find((key) => key.toLowerCase() === pengirim.toLowerCase());
      const toKey = Object.keys(db.players).find((key) => key.toLowerCase() === penerima.toLowerCase());
      if (!fromKey) return reply(`Pengirim ${pengirim} tidak ditemukan.`);
      if (db.players[fromKey].saldo < amount) return reply(`Saldo ${fromKey} tidak cukup.`);
      db.backup = JSON.parse(JSON.stringify(db));
      db.players[fromKey].saldo -= amount;
      if (db.players[fromKey].saldo === 0) delete db.players[fromKey];
      if (!toKey) db.players[penerima.toLowerCase()] = { saldo: 0, ws: 0 };
      db.players[toKey || penerima.toLowerCase()].saldo += amount;
      return reply(`✅ Transfer ${amount} dari ${fromKey} ke ${toKey || penerima.toLowerCase()} berhasil.`);
    }

    case 'editsaldo':
    case 'ubahsaldo':
    case 'setsaldo': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      const db = ensureDb(globalState, userId);
      if (!db) return reply('Buka sesi LW dulu.');
      const parts = q.trim().split(/\s+/);
      if (parts.length < 2) return reply('Format: .editsaldo Nama +10 / -5 / 100');
      const nama = parts[0].toLowerCase();
      const nilai = parts[1];
      let playerKey = Object.keys(db.players).find((key) => key.toLowerCase() === nama);
      if (!playerKey && !nilai.startsWith('+') && !nilai.startsWith('-') && nilai !== '0') {
        db.players[nama] = { saldo: 0, ws: 0 };
        playerKey = nama;
      } else if (!playerKey && (nilai.startsWith('+') || nilai.startsWith('-'))) {
        return reply(`Player ${nama} tidak ditemukan.`);
      }
      const saldoLama = playerKey ? db.players[playerKey].saldo : 0;
      let saldoBaru;
      if (nilai.startsWith('+')) saldoBaru = saldoLama + parseInt(nilai.slice(1), 10);
      else if (nilai.startsWith('-')) saldoBaru = saldoLama - parseInt(nilai.slice(1), 10);
      else saldoBaru = parseInt(nilai, 10);
      if (Number.isNaN(saldoBaru)) return reply('Jumlah tidak valid.');
      if (saldoBaru < 0) return reply('Saldo tidak boleh negatif.');
      if (saldoBaru === 0) {
        if (playerKey) delete db.players[playerKey];
        return reply(`✅ Saldo ${nama.toUpperCase()} dihapus (0).`);
      }
      if (!db.players[playerKey || nama]) db.players[playerKey || nama] = { saldo: 0, ws: 0 };
      db.players[playerKey || nama].saldo = saldoBaru;
      return reply(`✅ Saldo ${(playerKey || nama).toUpperCase()} diubah: ${saldoLama} → ${saldoBaru}`);
    }

    case 'bulatkan':
    case 'bulat':
    case 'floor': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      const db = ensureDb(globalState, userId);
      if (!db) return reply('Buka sesi LW dulu.');
      let adaPerubahan = false;
      for (const [, data] of Object.entries(db.players)) {
        const saldoLama = data.saldo;
        if (saldoLama > 0) {
          const saldoBaru = Math.floor(saldoLama / 100) * 100;
          if (saldoBaru !== saldoLama) {
            data.saldo = saldoBaru;
            adaPerubahan = true;
          }
        }
      }
      if (!adaPerubahan) return reply('✅ Semua saldo sudah kelipatan 100.');
      reply(buildLwSummary(db));
      return true;
    }

    case 'tslf':
    case 'tambahslf':
    case 'tambahhutang': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      const db = ensureDb(globalState, userId);
      if (!db) return reply('Buka sesi LW dulu.');
      const parts = q.trim().split(/\s+/);
      if (parts.length < 2) return reply('Format: .tslf Nama Jumlah');
      const nama = parts[0];
      const jumlah = parseInt(parts[1], 10);
      if (Number.isNaN(jumlah) || jumlah <= 0) return reply('Jumlah harus positif.');
      const idx = db.miskin.findIndex((item) => item.nama.toLowerCase() === nama.toLowerCase());
      if (idx === -1) {
        db.miskin.push({ nama, nominal: `${jumlah}lf` });
        return reply(`✅ Hutang baru untuk ${nama.toUpperCase()} : ${jumlah}lf`);
      }
      const hutangLama = parseInt(db.miskin[idx].nominal, 10);
      const hutangBaru = hutangLama + jumlah;
      db.miskin[idx].nominal = `${hutangBaru}lf`;
      return reply(`✅ Hutang ${nama.toUpperCase()} +${jumlah}lf, total: ${hutangBaru}lf`);
    }

    case 'dslf':
    case 'kurangihutang': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      const db = ensureDb(globalState, userId);
      if (!db) return reply('Buka sesi LW dulu.');
      const parts = q.trim().split(/\s+/);
      if (parts.length < 2) return reply('Format: .dslf Nama Jumlah');
      const nama = parts[0].toLowerCase();
      const jumlah = parseInt(parts[1], 10);
      if (Number.isNaN(jumlah) || jumlah <= 0) return reply('Jumlah harus positif.');
      const idx = db.miskin.findIndex((item) => item.nama.toLowerCase() === nama);
      if (idx === -1) return reply(`Nama ${nama} tidak ditemukan dalam hutang.`);
      const hutangAngka = parseInt(db.miskin[idx].nominal, 10);
      if (jumlah > hutangAngka) return reply(`Jumlah melebihi hutang (${hutangAngka}).`);
      const hutangBaru = hutangAngka - jumlah;
      if (hutangBaru <= 0) {
        db.miskin.splice(idx, 1);
        return reply(`✅ Hutang ${nama.toUpperCase()} lunas total!`);
      }
      db.miskin[idx].nominal = `${hutangBaru}lf`;
      return reply(`✅ Hutang ${nama.toUpperCase()} berkurang ${jumlah}, sisa: ${hutangBaru}lf`);
    }

    case 'lunas':
    case 'lunashutang':
    case 'lunasin': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      const db = ensureDb(globalState, userId);
      if (!db) return reply('Buka sesi LW dulu.');
      const nama = q.trim().toLowerCase();
      if (!nama) return reply('Contoh: .lunas nama');
      const idx = db.miskin.findIndex((item) => item.nama.toLowerCase() === nama);
      if (idx === -1) return reply(`Nama ${nama} tidak ada di hutang.`);
      db.miskin.splice(idx, 1);
      return reply(`✅ ${nama.toUpperCase()} lunas dan dihapus dari daftar hutang.`);
    }

    case 'hapus':
    case 'hapusplayer':
    case 'kickplayer': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      const db = ensureDb(globalState, userId);
      if (!db) return reply('Buka sesi LW dulu.');
      const nama = q.trim().toLowerCase();
      if (!nama) return reply('Contoh: .hapus nama');
      let found = false;
      if (db.players[nama]) {
        delete db.players[nama];
        found = true;
      }
      const idx = db.miskin.findIndex((item) => item.nama.toLowerCase() === nama);
      if (idx !== -1) {
        db.miskin.splice(idx, 1);
        found = true;
      }
      return reply(found ? `✅ Data ${nama.toUpperCase()} dihapus.` : `❌ ${nama.toUpperCase()} tidak ditemukan.`);
    }

    case 'cbl':
    case 'cekbal':
    case 'balance': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      if (!m.quoted) return reply('Reply list taruhan!');
      const parsed = scanPlayers(m.quoted.text);
      const totalK = parsed.k.reduce((sum, item) => sum + item.nominal, 0);
      const totalB = parsed.b.reduce((sum, item) => sum + item.nominal, 0);
      const listK = parsed.k.map((item) => `• ${item.nama.toUpperCase()} ${item.nominal}${item.mark ? item.mark.toLowerCase() : ''}`).join('\n') || '-';
      const listB = parsed.b.map((item) => `• ${item.nama.toUpperCase()} ${item.nominal}${item.mark ? item.mark.toLowerCase() : ''}`).join('\n') || '-';
      const selisih = Math.abs(totalK - totalB);
      const status = totalK === totalB ? '*BALANCE / RATA!*' : totalK > totalB ? `*TEAM B KURANG ${selisih}*` : `*TEAM K KURANG ${selisih}*`;
      let msg = `♕ *TEAM K [ ${totalK} ]*\n${listK}\n\n♚ *TEAM B [ ${totalB} ]*\n${listB}\n\n${status}`;
      await reply(msg);
      if (totalK !== totalB) {
        const timKurang = totalK > totalB ? 'B' : 'K';
        await sock.sendMessage(m.chat, { text: `*KING ${timKurang} -${selisih} CUANNN BANGET*` }, { quoted: m });
      } else {
        await sock.sendMessage(m.chat, { text: `*RATA! GAS ROLL!* 🎲` }, { quoted: m });
      }
      return true;
    }

    case 'r':
    case 'rekaplist':
    case 'rekapantrian': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      if (!m.quoted) return reply('Reply list taruhan!');
      const parsed = scanPlayers(m.quoted.text);
      const totalK = parsed.k.reduce((sum, item) => sum + item.nominal, 0);
      const totalB = parsed.b.reduce((sum, item) => sum + item.nominal, 0);
      const angkaK = parsed.k.map((item) => item.nominal).join(', ');
      const angkaB = parsed.b.map((item) => item.nominal).join(', ');
      await reply(`✵≛◎𓉳☠︎ *REKAP TARUHAN* ☠︎𓉳◎≛✵\n\n🔵 *TEAM K* (${totalK})\n${angkaK || '-'}\n\n🔴 *TEAM B* (${totalB})\n${angkaB || '-'}`);
      const selisih = Math.abs(totalK - totalB);
      const pesan2 = totalK === totalB
        ? `✅ *SEMUA AMAN! GAS ROLL!* 🎲`
        : `⚠️ *SALDO BELUM IMBANG! ${(totalK > totalB ? 'TEAM B' : 'TEAM K')} KURANG ${selisih}*`;
      await reply(`✵≛◎𓉳☠︎ *STATUS* ☠︎𓉳◎≛✵\n\n${pesan2}`);
      return true;
    }

    case 'listkb':
    case 'ceklist':
    case 'showlist':
    case 'list': {
      if (!isOwner && !isVIP(m.sender)) return reply('Fitur ini khusus user VIP king!');
      if (!globalState.db_lw[m.chat]) return reply('Buka sesi LW dulu dengan .openlw');
      reply('K:\n\n\nB:\n\n\n');
      return true;
    }

    case 'setlw':
    case 'templatelw': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      if (!q) return reply('Format: .setlw Admin|Hp|Roll|Waktu|Dana');
      const info = q.split('|');
      if (info.length < 5) return reply('❌ Format harus 5 bagian: Admin|Hp|Roll|Waktu|Dana');
      if (!globalState.db_lw.templates) globalState.db_lw.templates = {};
      const namaAdm = info[0].trim();
      globalState.db_lw.templates[namaAdm] = {
        admin: info[0].trim(),
        dev: info[1].trim(),
        roll: info[2].trim(),
        waktu: info[3].trim(),
        dana: info[4].trim()
      };
      return reply(`✅ Template LW untuk *${namaAdm}* berhasil disimpan!`);
    }

    case 'openlw':
    case 'bukalw':
    case 'mulailw': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      if (!q) return reply('Gunakan: .openlw [Nama Template]');
      const template = globalState.db_lw.templates ? globalState.db_lw.templates[q.trim()] : null;
      if (!template) return reply('❌ Template tidak ditemukan! Buat dulu dengan .setlw Admin|Hp|Roll|Waktu|Dana');
      globalState.db_lw[userId] = {
        admin: template.admin,
        dev: template.dev,
        roll: template.roll,
        waktu: template.waktu,
        dana: template.dana,
        players: {},
        miskin: [],
        games: [],
        backup: {}
      };
      return reply(`✅ *SESI LW DIBUKA DENGAN TEMPLATE ${template.admin}*\n\n👤 Admin : ${template.admin}\n📱 Device : ${template.dev}\n🎲 Roll : ${template.roll}\n⌚ Waktu : ${template.waktu}\n💰 Dana : ${template.dana}`);
    }

    case 'depo':
    case 'deposit':
    case 'tambahsaldo': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      const db = ensureDb(globalState, userId);
      if (!db) return reply('Anda belum buka sesi LW.');
      const parts = q.split(' ');
      const namaP = parts[0]?.toLowerCase();
      const nominalDepo = parseInt(parts[1], 10);
      if (!namaP || Number.isNaN(nominalDepo)) return reply('Contoh: .depo nama 10');
      if (!db.players[namaP]) db.players[namaP] = { saldo: 0, ws: 0 };
      const idxM = db.miskin.findIndex((item) => item.nama.toLowerCase() === namaP);
      let saldoAkhir = db.players[namaP].saldo;
      if (idxM !== -1) {
        const hutang = parseInt(db.miskin[idxM].nominal, 10);
        if (nominalDepo >= hutang) {
          const sisa = nominalDepo - hutang;
          db.players[namaP].saldo += sisa;
          db.miskin.splice(idxM, 1);
        } else {
          db.miskin[idxM].nominal = `${hutang - nominalDepo}lf`;
        }
        saldoAkhir = db.players[namaP].saldo;
      } else {
        db.players[namaP].saldo += nominalDepo;
        saldoAkhir = db.players[namaP].saldo;
      }
      return reply(`⋆˚࿔ꕥ*ᴅᴇᴘᴏꜱɪᴛ* ༅ᬊ\n☘ ᴘᴇᴍᴀɪɴ: *${namaP.toUpperCase()}*\n☘ ᴅᴇᴘᴏꜱɪᴛ: *+${nominalDepo}*\n☘ ꜱᴀʟᴅᴏ: *${saldoAkhir}*\n๛ _ᴋᴇᴛɪᴋ .ʟᴡ ᴜɴᴛᴜᴋ ᴍᴇʟɪʜᴀᴛ ᴘᴇʀᴜʙᴀʜ𝐚𝐧_`);
    }

    case 'chasil':
    case 'hasil':
    case 'cekhasil':
    case 'feeadmin': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      const db = ensureDb(globalState, userId);
      if (!db) return reply('❌ Sesi LW tidak ditemukan. Ketik .openlw dulu.');
      let totalFee = 0;
      if (db.games && Array.isArray(db.games)) {
        for (const game of db.games) {
          const match = game.match(/\/\/\s*(\d+)/);
          if (match) totalFee += parseInt(match[1], 10);
        }
      }
      const totalDPR = Object.values(db.players).reduce((sum, item) => sum + (item.saldo || 0), 0);
      const totalRakyat = db.miskin.reduce((sum, item) => sum + (parseInt(item.nominal, 10) || 0), 0);
      const today = new Date();
      const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][today.getDay()];
      const tanggal = `${hari}, ${today.toLocaleDateString('id-ID')}`;
      let msg = `𓉳 *LAPORAN HASIL ADMIN* 𓉳\n\n`;
      msg += `┌─────────────────────────────┐\n`;
      msg += `│ 👤 Admin : ${db.admin}\n`;
      msg += `│ 📅 Tanggal : ${tanggal}\n`;
      msg += `│ 🎲 Roll : ${db.roll}\n`;
      msg += `│ 💰 Dana : ${db.dana}\n`;
      msg += `└─────────────────────────────┘\n\n`;
      msg += `💰 *TOTAL FEE TERKUMPUL*\n ➥ *${totalFee.toLocaleString('id-ID')}*\n\n`;
      msg += `📊 *STATUS SALDO*\n DPR : ${totalDPR}\n Rakyat : ${totalRakyat}\n\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━\n_Tetap semangat, admin! 🚀_\n_Ketik .lw untuk detail lengkap_`;
      return reply(msg);
    }

    case 'fee':
    case 'cekfee':
    case 'hitungfee': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      if (!m.quoted) return reply('📌 Reply list taruhan.');
      const db = ensureDb(globalState, userId);
      if (!db) return reply('❌ Buka sesi LW dulu.');
      const parsed = scanPlayers(m.quoted.text);
      if (parsed.k.length === 0 && parsed.b.length === 0) return reply('❌ Tidak ada data.');
      let hasil = `*✂ FEE PER TIM* \n\n`;
      let totalFeeK = 0;
      if (parsed.k.length) {
        const lines = [];
        for (const player of parsed.k) {
          const fee = getFee(player.nominal);
          totalFeeK += fee;
          const hasilBersih = player.mark?.toLowerCase() === 'lf' ? (player.nominal - fee) : ((player.nominal * 2) - fee);
          lines.push(`*${player.nama}* ${player.nominal} → ${hasilBersih} ${player.mark?.toLowerCase() === 'lf' ? 'lf' : ''}`.trim());
        }
        hasil += `*𓉳 KECIL*\n${lines.join('\n')}\n── *fee : ${totalFeeK}*\n\n`;
      }
      let totalFeeB = 0;
      if (parsed.b.length) {
        const lines = [];
        for (const player of parsed.b) {
          const fee = getFee(player.nominal);
          totalFeeB += fee;
          const hasilBersih = player.mark?.toLowerCase() === 'lf' ? (player.nominal - fee) : ((player.nominal * 2) - fee);
          lines.push(`*${player.nama}* ${player.nominal} → ${hasilBersih} ${player.mark?.toLowerCase() === 'lf' ? 'lf' : ''}`.trim());
        }
        hasil += `*𓉳 BESAR*\n${lines.join('\n')}\n── *fee : ${totalFeeB}*`;
      }
      return reply(hasil);
    }

    case 'k':
    case 'kiri':
    case 'b':
    case 'kanan': {
      if (!m.text.startsWith(ctx.prefix)) return true;
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      const db = ensureDb(globalState, userId);
      if (!db) return reply('❌ Anda belum buka sesi LW. Ketik .openlw dulu!');
      if (!m.quoted) return reply('❌ Reply list taruhan!');
      db.backup = JSON.parse(JSON.stringify(db));
      const parsed = scanPlayers(m.quoted.text);
      if (parsed.k.length === 0 && parsed.b.length === 0) return reply('❌ Tidak ada data di list.');
      const parts = m.text.slice(ctx.prefix.length).trim().split(/\s+/);
      const skor = parts[1] && parts[1].includes('-') ? parts[1] : null;
      const angkaDadu = !skor ? (parts[1] ? parts[1].replace(/[^0-9]/g, '') : '') : '';
      const teksTambahan = parts.slice(skor ? 1 : 2).join(' ');
      const side = ['k', 'kiri'].includes(command) ? 'K' : 'B';
      let totalNominalMenang = 0;
      let totalFee = 0;
      const gameSession = [...parsed.k, ...parsed.b].map((player) => {
        const name = player.nama.toLowerCase();
        if (!db.players[name]) db.players[name] = { saldo: 0, ws: 0 };
        return {
          nama: name,
          oriName: player.nama,
          nominal: player.nominal,
          isLF: player.mark && player.mark.toLowerCase() === 'lf',
          saldoLama: db.players[name].saldo,
          team: parsed.k.includes(player) ? 'K' : 'B',
          fee: 0
        };
      });

      const allInGame = [...parsed.k, ...parsed.b].map((player) => player.nama.toLowerCase());
      Object.keys(db.players).forEach((key) => {
        if (!allInGame.includes(key) && db.players[key]) db.players[key].ws = 0;
      });

      for (const player of gameSession) {
        const winTeam = skor ? (skor.split('-').map(Number)[0] > skor.split('-').map(Number)[1] ? 'K' : 'B') : side;
        const isWin = player.team === winTeam;
        if (!isWin) {
          db.players[player.nama].ws = 0;
          if (player.isLF) {
            const hutangBaru = Math.max(0, player.nominal - player.saldoLama);
            db.players[player.nama].saldo = 0;
            const idxM = db.miskin.findIndex((item) => item.nama.toLowerCase() === player.nama);
            if (idxM !== -1) {
              const hutangLama = parseInt(db.miskin[idxM].nominal, 10);
              db.miskin[idxM].nominal = `${hutangLama + hutangBaru}lf`;
            } else {
              db.miskin.push({ nama: player.oriName, nominal: `${hutangBaru}lf` });
            }
          } else {
            const sisa = db.players[player.nama].saldo - player.nominal;
            db.players[player.nama].saldo = sisa < 0 ? 0 : sisa;
          }
        } else {
          const fee = getFee(player.nominal);
          player.fee = fee;
          totalNominalMenang += player.nominal;
          totalFee += fee;
          db.players[player.nama].ws = (db.players[player.nama].ws || 0) + 1;
          if (player.isLF) {
            const hasilBersih = player.nominal - fee;
            const idxM = db.miskin.findIndex((item) => item.nama.toLowerCase() === player.nama);
            if (idxM !== -1) {
              const hutang = parseInt(db.miskin[idxM].nominal, 10);
              if (hasilBersih >= hutang) {
                db.players[player.nama].saldo += (hasilBersih - hutang);
                db.miskin.splice(idxM, 1);
              } else {
                db.miskin[idxM].nominal = `${hutang - hasilBersih}lf`;
              }
            } else {
              db.players[player.nama].saldo += hasilBersih;
            }
          } else {
            let sisa = db.players[player.nama].saldo - player.nominal;
            if (sisa < 0) sisa = 0;
            db.players[player.nama].saldo = (player.nominal * 2 - fee) + sisa;
          }
        }
      }

      let gameRecord = skor ? `${side} ${skor} (${totalNominalMenang}) ${totalFee}` : `${side}${angkaDadu} (${totalNominalMenang}) ${totalFee}`;
      if (teksTambahan) gameRecord += ` ${teksTambahan}`;
      db.games.push(gameRecord);
      reply(buildLwSummary(db) + `\n_Ketik .back jika ada kesalahan input_`);
      return true;
    }

    case 'wk':
    case 'wsk':
    case 'wb':
    case 'wsb': {
      if (!m.text.startsWith(ctx.prefix)) return true;
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      const db = ensureDb(globalState, userId);
      if (!db) return reply('❌ Anda belum buka sesi LW. Ketik .openlw dulu!');
      if (!m.quoted) return reply('❌ Reply list taruhan!');
      db.backup = JSON.parse(JSON.stringify(db));
      const parsed = scanPlayers(m.quoted.text);
      if (parsed.k.length === 0 && parsed.b.length === 0) return reply('❌ Tidak ada data di list.');
      const parts = m.text.slice(ctx.prefix.length).trim().split(/\s+/);
      const skor = parts[1] && parts[1].includes('-') ? parts[1] : null;
      const angkaDadu = !skor ? (parts[1] ? parts[1].replace(/[^0-9]/g, '') : '') : '';
      const teksTambahan = parts.slice(skor ? 1 : 2).join(' ');
      const side = ['wk', 'wsk'].includes(command) ? 'K' : 'B';
      let totalNominalMenang = 0;
      let totalFee = 0;
      const gameSession = [...parsed.k, ...parsed.b].map((player) => {
        const name = player.nama.toLowerCase();
        if (!db.players[name]) db.players[name] = { saldo: 0, ws: 0 };
        return {
          nama: name,
          oriName: player.nama,
          nominal: player.nominal,
          isLF: player.mark && player.mark.toLowerCase() === 'lf',
          saldoLama: db.players[name].saldo,
          team: parsed.k.includes(player) ? 'K' : 'B',
          fee: 0
        };
      });

      const allInGame = [...parsed.k, ...parsed.b].map((player) => player.nama.toLowerCase());
      Object.keys(db.players).forEach((key) => {
        if (!allInGame.includes(key) && db.players[key]) db.players[key].ws = 0;
      });

      for (const player of gameSession) {
        const winTeam = skor ? (skor.split('-').map(Number)[0] > skor.split('-').map(Number)[1] ? 'K' : 'B') : side;
        const isWin = player.team === winTeam;
        if (!isWin) {
          db.players[player.nama].ws = 0;
          if (player.isLF) {
            const hutangBaru = Math.max(0, player.nominal - player.saldoLama);
            db.players[player.nama].saldo = 0;
            const idxM = db.miskin.findIndex((item) => item.nama.toLowerCase() === player.nama);
            if (idxM !== -1) {
              const hutangLama = parseInt(db.miskin[idxM].nominal, 10);
              db.miskin[idxM].nominal = `${hutangLama + hutangBaru}lf`;
            } else {
              db.miskin.push({ nama: player.oriName, nominal: `${hutangBaru}lf` });
            }
          } else {
            const sisa = db.players[player.nama].saldo - player.nominal;
            db.players[player.nama].saldo = sisa < 0 ? 0 : sisa;
          }
        } else {
          const fee = getFeePerak(player.nominal);
          player.fee = fee;
          totalNominalMenang += player.nominal;
          totalFee += fee;
          db.players[player.nama].ws = (db.players[player.nama].ws || 0) + 1;
          if (player.isLF) {
            const hasilBersih = player.nominal - fee;
            const idxM = db.miskin.findIndex((item) => item.nama.toLowerCase() === player.nama);
            if (idxM !== -1) {
              const hutang = parseInt(db.miskin[idxM].nominal, 10);
              if (hasilBersih >= hutang) {
                db.players[player.nama].saldo += (hasilBersih - hutang);
                db.miskin.splice(idxM, 1);
              } else {
                db.miskin[idxM].nominal = `${hutang - hasilBersih}lf`;
              }
            } else {
              db.players[player.nama].saldo += hasilBersih;
            }
          } else {
            let sisa = db.players[player.nama].saldo - player.nominal;
            if (sisa < 0) sisa = 0;
            db.players[player.nama].saldo = (player.nominal * 2 - fee) + sisa;
          }
        }
      }

      let gameRecord = skor ? `${side} ${skor} (${totalNominalMenang}) // ${totalFee}` : `${side}${angkaDadu} (${totalNominalMenang}) // ${totalFee}`;
      if (teksTambahan) gameRecord += ` // ${teksTambahan}`;
      db.games.push(gameRecord);
      reply(buildLwSummary(db) + `\n_Ketik .back jika ada kesalahan input_`);
      return true;
    }

    case 'resetlw':
    case 'closelw':
    case 'hapuslw': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      if (!globalState.db_lw[userId]) return reply('Anda belum membuka sesi LW. Ketik .openlw dulu.');
      delete globalState.db_lw[userId];
      reply('⚠️ *SESI LW ANDA DITUTUP!*\nSemua data LW untuk akun Anda telah dihapus.');
      return true;
    }

    case 'dellw':
    case 'deletelw': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      if (!q) return reply("Format: .dellw [Nama Admin]");
      
      if (globalState.db_lw.templates && globalState.db_lw.templates[q.trim()]) {
        delete globalState.db_lw.templates[q.trim()];
        reply(`✅ Template *${q.trim()}* berhasil dihapus.`);
      } else {
        reply("❌ Template tidak ditemukan.");
      }
      return true;
    }

    default:
      return false;
  }
}