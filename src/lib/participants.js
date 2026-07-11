function parseParticipants(participants) {
  if (!Array.isArray(participants)) return [];
  return participants.map((p) => ({
    id: p.id || null,
    jid: p.jid || null,
    lid: p.lid || null,
    admin: p.admin === 'superadmin' ? 'superadmin' : p.admin === 'admin' ? 'admin' : null
  }));
}

module.exports = { parseParticipants };
