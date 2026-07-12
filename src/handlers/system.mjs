function buildOwnerText(globalState) {
  let text = `👑 *DAFTAR OWNER BOT*\n\n► Nama: ${globalState.namaown || 'Owner'}\n`;
  if (globalState.owner && globalState.owner.length > 0) {
    globalState.owner.forEach((item, index) => {
      text += `► WhatsApp ${index + 1}: wa.me/${item.replace(/[^0-9]/g, '')}\n`;
    });
  }
  text += `\n_Hubungi salah satu owner di atas untuk pembelian script atau sewa bot._`;
  return text;
}

export async function handleSystemCommand(ctx) {
  const { command, reply, sock, m, isOwner, isOwn, args, text, globalState, runtime, loadVIP, isVIP, addVIP, delVIP, botNumber } = ctx;

  switch (command) {
    case 'owner':
    case 'own':
    case 'dev':
    case 'developerbot':
    case 'pembuat': {
      const contacts = (globalState.owner || []).map((item, index) => {
        const num = item.replace(/[^0-9]/g, '');
        const name = index === 0 ? (globalState.namaown || 'Owner Utama') : `Owner Tambahan ${index}`;
        return {
          vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nORG:Owner Bot;\nTEL;type=CELL;type=VOICE;waid=${num}:${num}\nEND:VCARD`
        };
      });

      if (contacts.length > 0) {
        await sock.sendMessage(m.chat, {
          contacts: {
            displayName: `${globalState.namaown || 'Owner'} List`,
            contacts
          }
        }, { quoted: m });
      }

      const ownerJids = (globalState.owner || []).map((v) => `${v.replace(/[^0-9]/g, '')}@s.whatsapp.net`);
      await sock.sendMessage(m.chat, { text: buildOwnerText(globalState), mentions: [m.sender, ...ownerJids] }, { quoted: m });
      return true;
    }

    case 'cekowner':
    case 'checkowner':
    case 'cekown':
    case 'co':
    case 'listowner':
    case 'daftarowner': {
      if (!globalState.owner || globalState.owner.length < 1) {
        return reply('Belum ada owner yang terdaftar.');
      }
      let teks = `👑 *DAFTAR OWNER BOT*\n\n`;
      teks += `► Owner Utama: @${globalState.owner[0].split('@')[0]}\n`;
      if (globalState.owner.length > 1) {
        teks += `► Owner Tambahan:\n`;
        for (let i = 1; i < globalState.owner.length; i++) {
          const item = globalState.owner[i];
          teks += `  - @${item.split('@')[0]}\n`;
        }
      }
      teks += `\n_Hubungi owner untuk keperluan sewa bot atau pembelian script._`;
      const ownerJids = globalState.owner.map((v) => `${v.replace(/[^0-9]/g, '')}@s.whatsapp.net`);
      await sock.sendMessage(m.chat, { text: teks, mentions: ownerJids }, { quoted: m });
      return true;
    }

    case 'rt':
    case 'runtime':
    case 'uptime':
    case 'botrun': {
      reply(`_${runtime(process.uptime())}_`);
      return true;
    }

    case 'ping':
    case 'speed':
    case 'pings':
    case 'tes': {
      const start = Date.now();
      await sock.sendMessage(m.chat, { text: '🏓 Testing speed...' }, { quoted: m });
      const ping = Date.now() - start;
      const txt = `⚡ *BOT SPEED TEST*\n\n🏓 Ping: ${ping} ms\n🕒 Uptime: ${runtime(process.uptime())}\n🚀 Node: ${process.version}\n🖥️ Platform: ${process.platform}`;
      await sock.sendMessage(m.chat, { text: txt }, { quoted: m });
      return true;
    }

    case 'addvip':
    case 'vipadd':
    case 'tambahvip': {
      if (!isOwner) return reply('❌ Hanya owner.');
      
      const quotedSender = m.quoted?.sender;
      const cleanQuoted = quotedSender ? sock.decodeJid(quotedSender) : null;
      const botLid = sock.authState?.creds?.me?.lid ? sock.decodeJid(sock.authState.creds.me.lid) : null;
      const isQuotedFromBot = m.quoted?.fromMe 
        || (cleanQuoted === botNumber) 
        || (botLid && cleanQuoted === botLid);
      
      let targetJid = m.mentionedJid?.[0] || (m.quoted && !isQuotedFromBot ? m.quoted.sender : null);
      
      const parts = text.trim().split(/\s+/);
      let days = parseInt(parts[parts.length - 1], 10);
      
      if (!targetJid && parts[0]) {
        const cleanNum = parts[0].replace(/[^0-9]/g, '');
        if (cleanNum.length >= 5) {
          targetJid = `${cleanNum}@s.whatsapp.net`;
        }
      }

      if (!targetJid || Number.isNaN(days) || days <= 0) {
        return reply('❌ Format tidak sesuai!\n*Gunakan:* .addvip [nomor/tag/reply] [hari]\n*Contoh:* .addvip 6281234567890 30');
      }
      
      const targetNum = targetJid.split('@')[0];
      addVIP(targetJid, days);
      reply(`✅ VIP ditambahkan untuk +${targetNum} selama ${days} hari.`);
      return true;
    }

    case 'delvip':
    case 'vipdel':
    case 'hapusvip':
    case 'removevip': {
      if (!isOwner) return reply('❌ Hanya owner.');
      
      const quotedSender = m.quoted?.sender;
      const cleanQuoted = quotedSender ? sock.decodeJid(quotedSender) : null;
      const botLid = sock.authState?.creds?.me?.lid ? sock.decodeJid(sock.authState.creds.me.lid) : null;
      const isQuotedFromBot = m.quoted?.fromMe 
        || (cleanQuoted === botNumber) 
        || (botLid && cleanQuoted === botLid);
      
      let targetJid = m.mentionedJid?.[0] || (m.quoted && !isQuotedFromBot ? m.quoted.sender : null);
      
      const parts = text.trim().split(/\s+/);
      if (!targetJid && parts[0]) {
        const cleanNum = parts[0].replace(/[^0-9]/g, '');
        if (cleanNum.length >= 5) {
          targetJid = `${cleanNum}@s.whatsapp.net`;
        }
      }

      if (!targetJid) {
        return reply('❌ Format tidak sesuai!\n*Gunakan:* .delvip [nomor/tag/reply]\n*Contoh:* .delvip 6281234567890');
      }
      
      const targetNum = targetJid.split('@')[0];
      delVIP(targetJid);
      reply(`✅ VIP untuk +${targetNum} dihapus.`);
      return true;
    }

    case 'listvip':
    case 'viplist':
    case 'daftarvip': {
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

    case 'self':
    case 'mode-self': {
      if (!isOwner) return reply('❌ Hanya owner yang bisa mengubah mode ini.');
      globalState.self = true;
      reply('🤖 Bot mode SELF berhasil diaktifkan.');
      return true;
    }

    case 'public':
    case 'mode-public': {
      if (!isOwner) return reply('❌ Hanya owner.');
      globalState.self = false;
      reply('🤖 Bot mode PUBLIC berhasil diaktifkan.');
      return true;
    }

    default:
      return false;
  }
}