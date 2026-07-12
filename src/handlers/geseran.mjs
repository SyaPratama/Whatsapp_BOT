function startGeseran(globalState, { adminId, chatId, targetCount, amount }) {
  if (globalState.geseran[chatId]) return false;
  const timeoutId = setTimeout(async () => {
    if (globalState.geseran[chatId]) {
      await finishGeseran(globalState, { chatId, adminId, isTimeout: true });
    }
  }, 5 * 60 * 1000);
  globalState.geseran[chatId] = {
    adminId,
    targetCount,
    amount,
    claimed: [],
    claimedSenders: [],
    status: 'active',
    timeoutId
  };
  return true;
}

async function finishGeseran(globalState, { chatId, adminId, isTimeout = false }) {
  const session = globalState.geseran[chatId];
  if (!session) return;
  const { targetCount, amount, claimed, claimedSenders } = session;
  const db = globalState.db_lw[adminId];
  if (!db) {
    await globalState.sock?.sendMessage(chatId, { text: '❌ Sesi LW admin tidak ditemukan. Geseran dibatalkan.' });
    delete globalState.geseran[chatId];
    return;
  }
  const successList = [];
  for (let i = 0; i < claimed.length; i += 1) {
    const nick = claimed[i];
    const senderJid = claimedSenders[i];
    const playerKey = nick.toLowerCase();
    if (!db.players[playerKey]) db.players[playerKey] = { saldo: 0, ws: 0 };
    db.players[playerKey].saldo += amount;
    successList.push(`${nick} (${senderJid.split('@')[0]})`);
  }
  let text = `✅ *GESERAN SELESAI* ${isTimeout ? '(waktu habis)' : ''}\n`;
  text += `🎯 Target: ${targetCount} orang | 💰 ${amount} saldo/orang\n`;
  text += `📋 Berhasil claim (${successList.length}):\n`;
  text += successList.map((s) => `• ${s}`).join('\n') || 'Tidak ada';
  text += '\n\n_Saldo sudah ditambahkan ke LW._';
  await globalState.sock?.sendMessage(chatId, { text });
  await globalState.sock?.sendMessage(adminId, { text: `✅ Geseran selesai. ${claimed.length} orang × ${amount} = ${claimed.length * amount} saldo ditambahkan ke LW Anda.` }).catch(() => null);
  delete globalState.geseran[chatId];
}

async function handleClaim(globalState, msg, chatId, sender, body) {
  if (msg.key.fromMe) return false;
  const session = globalState.geseran[chatId];
  if (!session || session.status !== 'active') return false;
  const nickname = body.trim();
  if (nickname.length === 0) return false;
  if (session.claimedSenders && session.claimedSenders.includes(sender)) {
    return true;
  }
  const alreadyNick = session.claimed.some((n) => n.toLowerCase() === nickname.toLowerCase());
  if (alreadyNick) return true;
  session.claimed.push(nickname);
  if (!session.claimedSenders) session.claimedSenders = [];
  session.claimedSenders.push(sender);
  if (session.claimed.length >= session.targetCount) {
    clearTimeout(session.timeoutId);
    await finishGeseran(globalState, { chatId, adminId: session.adminId, isTimeout: false });
  }
  return true;
}

export async function handleGeseranCommand(ctx) {
  const { command, reply, m, q, args, isGroup, isAdmins, isOwner, globalState, sock } = ctx;
  const userId = m.sender;

  switch (command) {
    case 'geseran':
    case 'bagi':
    case 'claim': {
      if (!isGroup) return reply('❌ Fitur hanya untuk grup.');
      if (!isAdmins && !isOwner) return reply('❌ Hanya admin grup.');
      if (!globalState.db_lw[userId]) return reply('❌ Anda belum buka sesi LW. Ketik .openlw dulu.');
      const parts = q.trim().split(/\s+/);
      if (parts.length < 2) return reply('Format: .geseran <jumlah_orang> <jumlah_saldo>\nContoh: .geseran 20 1');
      const targetCount = parseInt(parts[0], 10);
      const amount = parseInt(parts[1], 10);
      if (Number.isNaN(targetCount) || targetCount <= 0) return reply('Jumlah orang harus positif.');
      if (Number.isNaN(amount) || amount <= 0) return reply('Jumlah saldo harus positif.');
      globalState.sock = sock;
      const ok = startGeseran(globalState, { adminId: userId, chatId: m.chat, targetCount, amount });
      if (!ok) return reply('⚠️ Masih ada sesi geseran aktif. Gunakan .stopgeseran');
      return reply(`🎉 *GESERAN DIMULAI* 🎉\n\n🎯 Target: ${targetCount} orang\n💰 Saldo: ${amount} per orang\n📢 Kirim *nickname* (tanpa prefix) untuk claim.\n⏰ Waktu: 5 menit\n*Bot akan diam, notifikasi hanya saat selesai.*\n*Satu nomor WA hanya bisa satu nickname!*`);
    }
    case 'stopgeseran':
    case 'hentikangeseran':
    case 'tutupgeseran': {
      if (!isGroup) return reply('❌ Hanya untuk grup.');
      if (!isAdmins && !isOwner) return reply('❌ Hanya admin.');
      if (!globalState.geseran[m.chat]) return reply('Tidak ada sesi geseran aktif.');
      clearTimeout(globalState.geseran[m.chat].timeoutId);
      await finishGeseran(globalState, { chatId: m.chat, adminId: globalState.geseran[m.chat].adminId, isTimeout: true });
      return true;
    }
    default:
      return false;
  }
}

export async function processClaim(globalState, m, body) {
  globalState.sock = globalState.sock || m?.sock;
  if (!m?.isGroup || !globalState.geseran?.[m.chat]) return false;
  return handleClaim(globalState, m, m.chat, m.sender, body);
}
