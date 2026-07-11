const handler = async (m, { reply, isOwner, sock }) => {
  if (!isOwner) return reply(mess.owner);
  const buffer = Buffer.from('backup-placeholder', 'utf8');
  await sock.sendMessage(m.chat, {
    document: buffer,
    fileName: `owner-backup-${Date.now()}.txt`,
    mimetype: 'text/plain'
  }, { quoted: m });
};

handler.command = ['ownerbackup'];
export default handler;
