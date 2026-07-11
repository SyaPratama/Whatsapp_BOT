function buildOwnerText(globalState) {
  return `👑 *OWNER BOT*\n\n► Nama: ${globalState.namaown || 'Owner'}\n► WhatsApp: wa.me/${globalState.owner?.[0] || ''}\n\n_Hubungi untuk pembelian script atau sewa bot._`;
}

export async function handleSystemCommand(ctx) {
  const { command, reply, sock, m, isOwner, isOwn, isPremium, args, text, globalState, runtime, loadVIP, isVIP, addVIP, delVIP } = ctx;

  switch (command) {
    case 'owner':
    case 'own':
    case 'dev':
    case 'developerbot': {
      const ownerJid = `${globalState.owner?.[0] || ''}@s.whatsapp.net`;
      const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${globalState.namaown || 'Owner'}\nORG:Owner Bot;\nTEL;type=CELL;type=VOICE;waid=${globalState.owner?.[0] || ''}:${globalState.owner?.[0] || ''}\nEND:VCARD`;

      await sock.sendMessage(m.chat, {
        contacts: {
          displayName: `${globalState.namaown || 'Owner'}`,
          contacts: [{ vcard }]
        }
      }, { quoted: m });

      await sock.sendMessage(m.chat, { text: buildOwnerText(globalState), mentions: [m.sender] }, { quoted: m });
      return true;
    }

    case 'rt':
    case 'runtime':
    case 'uptime': {
      reply(`_${runtime(process.uptime())}_`);
      return true;
    }

    case 'ping':
    case 'speed':
    case 'pings': {
      const start = Date.now();
      await sock.sendMessage(m.chat, { text: '🏓 Testing speed...' }, { quoted: m });
      const ping = Date.now() - start;
      const txt = `⚡ *BOT SPEED TEST*\n\n🏓 Ping: ${ping} ms\n🕒 Uptime: ${runtime(process.uptime())}\n🚀 Node: ${process.version}\n🖥️ Platform: ${process.platform}`;
      await sock.sendMessage(m.chat, { text: txt }, { quoted: m });
      return true;
    }

    case 'addvip': {
      if (!isOwner) return reply('❌ Hanya owner.');
      const parts = text.trim().split(/\s+/);
      if (parts.length < 2) return reply('Format: .addvip 628xxxxxx 30\nContoh: .addvip 6281234567890 7');
      const number = parts[0].replace(/[^0-9]/g, '');
      const days = parseInt(parts[1], 10);
      if (!number) return reply('Nomor tidak valid.');
      if (Number.isNaN(days) || days <= 0) return reply('Jumlah hari harus angka positif.');
      addVIP(`${number}@s.whatsapp.net`, days);
      reply(`✅ VIP ditambahkan untuk +${number} selama ${days} hari.`);
      return true;
    }

    case 'delvip': {
      if (!isOwner) return reply('❌ Hanya owner.');
      const number = text.replace(/[^0-9]/g, '');
      if (!number) return reply('Masukkan nomor yang akan dihapus VIP.\nContoh: .delvip 6281234567890');
      delVIP(`${number}@s.whatsapp.net`);
      reply(`✅ VIP untuk +${number} dihapus.`);
      return true;
    }

    case 'listvip': {
      if (!isOwner) return reply('❌ Hanya owner.');
      const data = loadVIP();
      const now = Date.now();
      const active = [];
      const expired = [];

      for (const [jid, info] of Object.entries(data)) {
        const remaining = Math.ceil((new Date(info.expired).getTime() - now) / 86400000);
        const item = `• @${jid.split('@')[0]} | ${info.days} hari | ${remaining} hari lagi`;
        if (remaining > 0) active.push(item);
        else expired.push(`• @${jid.split('@')[0]} | ⚠️ EXPIRED`);
      }

      const list = `╔═════ *LIST VIP* ═════╗\n\n🟢 *AKTIF (${active.length})*\n${active.length ? active.join('\n') : 'Kosong'}\n\n🔴 *EXPIRED (${expired.length})*\n${expired.length ? expired.join('\n') : 'Kosong'}\n\n╚═════════════════════╝`;
      await sock.sendMessage(m.chat, { text: list, mentions: Object.keys(data) }, { quoted: m });
      return true;
    }

    case 'self': {
      if (!isOwner) return reply('❌ Hanya owner yang bisa mengubah mode ini.');
      globalState.self = true;
      reply('🤖 Bot mode SELF berhasil diaktifkan.');
      return true;
    }

    case 'public': {
      if (!isOwner) return reply('❌ Hanya owner.');
      globalState.self = false;
      reply('🤖 Bot mode PUBLIC berhasil diaktifkan.');
      return true;
    }

    default:
      return false;
  }
}