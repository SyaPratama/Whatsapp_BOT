const fs = require('fs');
const path = require('path');

const handler = async (m, { reply, isOwner, text, command, usedPrefix }) => {
  if (!isOwner) return reply(mess.owner);
  if (!text || !m.quoted || !m.quoted.text) {
    return reply(`Reply kode & input nama plugin\n*contoh:* ${usedPrefix || '.'}${command} menu.js`);
  }
  if (!text.endsWith('.js')) {
    return reply(`Nama plugin harus diakhiri .js\n*contoh:* ${usedPrefix || '.'}${command} menu.js`);
  }
  const target = path.join(process.cwd(), 'src', 'plugins', 'cjs', text.trim());
  fs.writeFileSync(target, m.quoted.text);
  return reply(`Berhasil menambah plugin *${text}*`);
};

handler.command = ['addp', 'addplugin', 'addplugins'];
module.exports = handler;
