import fs from 'node:fs';
import { countFeatures, buildFiturText } from '../utils/countFeatures.mjs';

export async function handleMaintenanceCommand(ctx) {
  const { command, reply, sock, m, args, isOwner, isOwnerStrict, globalState, botNumber, mime, quoted } = ctx;

  switch (command) {
    case 'welcome': {
      if (!isOwner) return reply('❌ Hanya owner.');
      globalState.welcome = args[0] === 'on';
      return reply(`—Welcome ${globalState.welcome ? 'ON' : 'OFF'}`);
    }
    case 'goodbye': {
      if (!isOwner) return reply('❌ Hanya owner.');
      globalState.goodbye = args[0] === 'on';
      return reply(`—Goodbye ${globalState.goodbye ? 'ON' : 'OFF'}`);
    }
    case 'delppbot': {
      if (!isOwner) return reply('❌ Hanya owner.');
      await sock.removeProfilePicture(sock.user.id);
      return reply('Berhasil Menghapus Gambar Profil Bot');
    }
    case 'setbotpp':
    case 'setppbot': {
      if (!isOwner) return reply('❌ Hanya owner.');
      if (!quoted) return reply(`Kirim/kutip gambar dengan caption ${ctx.prefix || '.'}${command}`);
      if (!/image/.test(mime)) return reply(`Kirim/kutip gambar dengan caption ${ctx.prefix || '.'}${command}`);
      if (/webp/.test(mime)) return reply(`Kirim/kutip gambar dengan caption ${ctx.prefix || '.'}${command}`);
      const media = await sock.downloadAndSaveMediaMessage(quoted);
      try {
        await sock.updateProfilePicture(botNumber, { url: media });
        reply('Sukses mengganti pp bot!');
      } finally {
        try { fs.unlinkSync(media); } catch { /* ignore */ }
      }
      return true;
    }
    case 'fitur':
    case 'ttf':
    case 'totalfitur':
    case 'totalfit': {
      reply(buildFiturText());
      return true;
    }
    default:
      return false;
  }
}
