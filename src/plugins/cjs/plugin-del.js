const fs = require('fs');
const path = require('path');

const handler = async (m, { reply, isOwner, text, command }) => {
  if (!isOwner) return reply(mess.owner);
  if (!text) return reply(`Masukkan nama plugin\n*contoh:* .${command} menu.js`);
  const safe = text.trim().replace(/[^a-zA-Z0-9_.-]/g, '');
  if (!safe.endsWith('.js')) return reply('Nama plugin harus diakhiri .js');
  const target = path.join(process.cwd(), 'src', 'plugins', 'cjs', safe);
  if (!fs.existsSync(target)) return reply(`Plugin *${safe}* tidak ditemukan.`);
  fs.unlinkSync(target);
  return reply(`Berhasil menghapus plugin *${safe}*`);
};

handler.command = ['delp', 'delplugin', 'delplugins'];
module.exports = handler;
