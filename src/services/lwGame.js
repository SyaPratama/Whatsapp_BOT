function getFee(nominal) {
  if (nominal < 2) return 0;
  if (nominal <= 9) return 1;

  return Math.floor(nominal / 10) + 1;
}

function prosesTransaksiOtomatis(db, nama, nominalPasang, mark) {
  const fee = getFee(nominalPasang);
  const menangBersih = mark === 'lf' ? nominalPasang - fee : nominalPasang * 2 - fee;
  const peserta = db.miskin || [];
  const idxMiskin = peserta.findIndex((p) => p.nama.toLowerCase() === nama.toLowerCase());

  if (idxMiskin !== -1) {
    const nominalHutang = parseInt(peserta[idxMiskin].nominal, 10);

    if (menangBersih > nominalHutang) {
      const sisaKeSaldo = menangBersih - nominalHutang;
      db.players[nama] = (db.players[nama] || 0) + sisaKeSaldo;
      peserta.splice(idxMiskin, 1);
    } else if (menangBersih === nominalHutang) {
      peserta.splice(idxMiskin, 1);
    } else {
      peserta[idxMiskin].nominal = `${nominalHutang - menangBersih}lf`;
    }

    db.miskin = peserta;
    return db;
  }

  db.players[nama] = (db.players[nama] || 0) + menangBersih;
  return db;
}

function scanPlayers(teks) {
  const players = { k: [], b: [] };
  const lines = String(teks || '').split(/\n/);
  let currentTeam = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (/^k\s*[:：]/i.test(line)) {
      currentTeam = 'k';
      continue;
    }

    if (/^b\s*[:：]/i.test(line)) {
      currentTeam = 'b';
      continue;
    }

    if (!currentTeam) continue;

    const match = line.match(/^(.+?)\s+(\d+)(lf|\.)?$/i);
    if (!match) continue;

    const nama = match[1].trim();
    const nominal = parseInt(match[2], 10);
    const mark = (match[3] || '').toLowerCase();

    if (Number.isNaN(nominal)) continue;

    const obj = { nama, nominal, mark };
    if (currentTeam === 'k') players.k.push(obj);
    if (currentTeam === 'b') players.b.push(obj);
  }

  return players;
}

function prosesTransaksi(db, players, skor) {
  db.players = db.players || {};

  if (skor && skor.includes('-')) {
    const [skorK, skorB] = skor.split('-').map(Number);
    const pemenang = skorK > skorB ? players.k : players.b;

    for (const p of pemenang) {
      const key = p.nama.toLowerCase();
      db.players[key] = (db.players[key] || 0) + p.nominal * 2;
    }

    return db;
  }

  for (const p of players.k) {
    const key = p.nama.toLowerCase();
    const fee = 1;
    db.players[key] = (db.players[key] || 0) + (p.nominal - fee);
  }

  return db;
}

function hitungTotal(list) {
  return list.reduce((total, p) => total + p.nominal, 0);
}

module.exports = {
  getFee,
  prosesTransaksiOtomatis,
  scanPlayers,
  prosesTransaksi,
  hitungTotal
};