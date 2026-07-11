const fs = require('fs');
const path = require('path');

const handler = async (m, { reply, isOwner, command }) => {
  if (!isOwner) return reply(mess.owner);
  const dir = path.join(process.cwd(), 'src', 'plugins', 'cjs');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.js')) : [];
  if (files.length === 0) return reply('Tidak ada plugin CJS.');
  return reply(`📦 *Plugin CJS:*\n\n${files.map((f) => `• ${f}`).join('\n')}`);
};

handler.command = ['listp', 'listplugin'];
module.exports = handler;
