const fs = require('fs');
const path = require('path');

const handler = async (m, { reply, isOwner, text, command, sock }) => {
  if (!isOwner) return reply(mess.owner);
  if (!text) return reply(`Masukkan nama plugin\n*contoh:* .${command} menu.js`);
  const safe = text.trim().replace(/[^a-zA-Z0-9_.-]/g, '');
  if (!safe.endsWith('.js')) return reply('Nama plugin harus diakhiri .js');
  const target = path.join(process.cwd(), 'src', 'plugins', 'cjs', safe);
  if (!fs.existsSync(target)) return reply(`Plugin *${safe}* tidak ditemukan.`);
  const content = fs.readFileSync(target, 'utf8');
  await sock.sendMessage(m.chat, { text: `\`\`\`javascript\n${content}\n\`\`\`` }, { quoted: m });
};

handler.command = ['getp', 'getplugin'];
module.exports = handler;
