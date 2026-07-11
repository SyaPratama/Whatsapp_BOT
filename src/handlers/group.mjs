function normalizeParticipantId(participant) {
  return participant.id || participant.jid;
}

export async function handleGroupCommand(ctx) {
  const { command, reply, sock, m, isGroup, isAdmins, isOwner, isBotAdmins, q, args, participants, globalState } = ctx;

  switch (command) {
    case 'demote':
    case 'promote': {
      if (!isGroup) return reply('❌ Fitur hanya untuk grup.');
      if (!isAdmins && !isOwner) return reply('❌ Hanya admin grup.');
      if (!isBotAdmins) return reply('❌ Bot harus menjadi admin grup.');

      const target = m.mentionedJid?.[0] || m.quoted?.sender || `${q.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
      const action = command === 'demote' ? 'demote' : 'promote';
      await sock.groupParticipantsUpdate(m.chat, [target], action);
      await sock.sendMessage(m.chat, { text: `Sukses ${action} @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
      return true;
    }

    case 'kick': {
      if (!isGroup) return reply('❌ Fitur hanya untuk grup.');
      if (!isAdmins && !isOwner) return reply('Khusus Admin!!');
      if (!isBotAdmins) return reply('_Bot Harus Menjadi Admin Terlebih Dahulu_');

      const users = m.mentionedJid?.[0] || m.quoted?.sender || `${q.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
      await sock.groupParticipantsUpdate(m.chat, [users], 'remove');
      return reply('*[ Done ]*');
    }

    case 'hidetag':
    case 'h': {
      if (!isGroup) return reply('❌ Fitur hanya untuk grup.');
      if (!isAdmins && !isOwner) return reply('❌ Hanya admin grup.');
      if (!isBotAdmins) return reply('❌ Bot harus menjadi admin grup.');

      if (m.quoted) {
        await sock.sendMessage(m.chat, {
          forward: m.quoted.fakeObj,
          mentions: participants.map(normalizeParticipantId)
        });
      } else {
        await sock.sendMessage(m.chat, {
          text: q || '',
          mentions: participants.map(normalizeParticipantId)
        }, { quoted: m });
      }
      return true;
    }

    case 'linkgc': {
      if (!isGroup) return reply('❌ Fitur hanya untuk grup.');
      if (!isAdmins && !isOwner) return reply('❌ Hanya admin grup.');
      if (!isBotAdmins) return reply('❌ Bot harus menjadi admin grup.');

      const urlGrup = `https://chat.whatsapp.com/${await sock.groupInviteCode(m.chat)}`;
      await sock.sendMessage(m.chat, { text: urlGrup, matchedText: urlGrup }, { quoted: m });
      return true;
    }

    case 'resetlinkgc': {
      if (!isGroup) return reply('❌ Fitur hanya untuk grup.');
      if (!isAdmins && !isOwner) return reply('❌ Hanya admin grup.');
      if (!isBotAdmins) return reply('❌ Bot harus menjadi admin grup.');

      await sock.groupRevokeInvite(m.chat);
      reply('Berhasil mereset link grup ✅');
      return true;
    }

    case 'buka':
    case 'open': {
      if (!isGroup) return reply('❌ Fitur ini hanya dapat digunakan di dalam grup.');
      if (!isAdmins && !isOwner) return reply('❌ Hanya admin grup yang bisa membuka grup.');
      if (!isBotAdmins) return reply('❌ Bot harus menjadi admin grup terlebih dahulu.');

      await sock.groupSettingUpdate(m.chat, 'not_announcement');
      reply('✅ *Grup telah dibuka!* Semua anggota sekarang bisa mengirim pesan.');
      return true;
    }

    case 'tutup':
    case 'close': {
      if (!isGroup) return reply('❌ Fitur ini hanya dapat digunakan di dalam grup.');
      if (!isAdmins && !isOwner) return reply('❌ Hanya admin grup yang bisa menutup grup.');
      if (!isBotAdmins) return reply('❌ Bot harus menjadi admin grup terlebih dahulu.');

      await sock.groupSettingUpdate(m.chat, 'announcement');
      reply('🔒 *Grup telah ditutup!* Hanya admin yang bisa mengirim pesan.');
      return true;
    }

    case 'o': {
      if (!isGroup) return reply('❌ Fitur hanya untuk grup.');
      if (!isAdmins && !isOwner) return reply('❌ Hanya admin grup yang bisa menggunakan perintah ini.');
      if (!isBotAdmins) return reply('❌ Bot harus menjadi admin grup untuk tag semua anggota.');

      const mentions = participants.map(normalizeParticipantId);
      await sock.sendMessage(m.chat, { text: q || '*𝐎𝐏𝐄𝐍 𝐀𝐋𝐋 𝐒𝐄𝐁𝐔𝐓 𝐆𝐂*', mentions }, { quoted: m });
      return true;
    }

    case 'antilink': {
      if (!isGroup) return reply('❌ Fitur hanya untuk grup.');
      if (!isAdmins && !isOwner) return reply('❌ Hanya admin grup.');
      if (!args[0]) return reply('📌 .antilink group on/off\n.antilink channel on/off\n.antilink all on/off');

      const sub = args[0].toLowerCase();
      const action = args[1]?.toLowerCase();
      if (!action || !['on', 'off'].includes(action)) return reply('❌ Pilihan: on / off');

      if (!globalState.antilink) globalState.antilink = {};
      if (!globalState.antilink[m.chat]) globalState.antilink[m.chat] = { group: false, channel: false, all: false };

      const key = sub === 'link' ? 'all' : sub;
      if (['group', 'channel', 'all'].includes(key)) {
        globalState.antilink[m.chat][key] = action === 'on';
        reply(`✅ Anti-link ${sub} sekarang ${action === 'on' ? 'AKTIF' : 'NONAKTIF'}`);
        return true;
      }

      reply('❌ Sub perintah tidak dikenal. Gunakan: group, channel, all');
      return true;
    }

    case 'testlink': {
      if (!isOwner) return reply('❌ Hanya owner.');
      const setting = globalState.antilink?.[m.chat] || {};
      reply(`📊 *Status Anti-Link Grup Ini*\n\n▪️ Group Link : ${setting.group ? '✅ AKTIF' : '❌ NONAKTIF'}\n▪️ Channel Link: ${setting.channel ? '✅ AKTIF' : '❌ NONAKTIF'}\n▪️ All Link : ${setting.all ? '✅ AKTIF' : '❌ NONAKTIF'}`);
      return true;
    }

    default:
      return false;
  }
}