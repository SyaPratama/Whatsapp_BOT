import fs from 'node:fs';
import path from 'node:path';

const handler = async (m, { reply, isOwner, text, command }) => {
  if (!isOwner) return reply(mess.owner);
  if (!text || !m.quoted || !m.quoted.text) {
    return reply(`Reply kode & input nama plugin\n*contoh:* .${command} menu.mjs`);
  }
  if (!text.endsWith('.mjs')) {
    return reply('Nama plugin harus diakhiri .mjs');
  }
  const target = path.join(process.cwd(), 'src', 'plugins', 'esm', text.trim());
  fs.writeFileSync(target, m.quoted.text);
  return reply(`Berhasil menambah plugin ESM *${text}*`);
};

handler.command = ['addpe', 'addpluginesm'];
export default handler;
