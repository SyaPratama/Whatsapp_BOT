const fs = require('node:fs');

function makeInMemoryStore({ logger } = {}) {
  const chats = new Map();
  const contacts = new Map();
  const messages = new Map(); // Map<jid, Map<id, message>>

  function bind(ev) {
    ev.on('chats.set', ({ chats: newChats }) => {
      for (const chat of newChats) {
        chats.set(chat.id, { ...chats.get(chat.id), ...chat });
      }
    });
    ev.on('chats.upsert', (newChats) => {
      for (const chat of newChats) {
        chats.set(chat.id, { ...chats.get(chat.id), ...chat });
      }
    });
    ev.on('chats.update', (updates) => {
      for (const update of updates) {
        if (chats.has(update.id)) {
          chats.set(update.id, { ...chats.get(update.id), ...update });
        }
      }
    });

    ev.on('contacts.set', ({ contacts: newContacts }) => {
      for (const contact of newContacts) {
        contacts.set(contact.id, { ...contacts.get(contact.id), ...contact });
      }
    });
    ev.on('contacts.upsert', (newContacts) => {
      for (const contact of newContacts) {
        contacts.set(contact.id, { ...contacts.get(contact.id), ...contact });
      }
    });
    ev.on('contacts.update', (updates) => {
      for (const update of updates) {
        if (contacts.has(update.id)) {
          contacts.set(update.id, { ...contacts.get(update.id), ...update });
        }
      }
    });

    ev.on('messages.upsert', ({ messages: newMessages }) => {
      for (const msg of newMessages) {
        const jid = msg.key.remoteJid;
        if (!jid) continue;
        if (!messages.has(jid)) {
          messages.set(jid, new Map());
        }
        messages.get(jid).set(msg.key.id, msg);
      }
    });
    ev.on('messages.update', (updates) => {
      for (const { key, update } of updates) {
        const jid = key.remoteJid;
        if (!jid || !messages.has(jid)) continue;
        const msg = messages.get(jid).get(key.id);
        if (msg) {
          Object.assign(msg, update);
        }
      }
    });
  }

  function loadMessage(jid, id) {
    if (!messages.has(jid)) return undefined;
    return messages.get(jid).get(id);
  }

  function readFromFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) return;
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (data.chats) {
        for (const [k, v] of Object.entries(data.chats)) chats.set(k, v);
      }
      if (data.contacts) {
        for (const [k, v] of Object.entries(data.contacts)) contacts.set(k, v);
      }
      if (data.messages) {
        for (const [jid, list] of Object.entries(data.messages)) {
          const map = new Map();
          for (const [id, msg] of Object.entries(list)) {
            map.set(id, msg);
          }
          messages.set(jid, map);
        }
      }
    } catch (err) {
      if (logger) logger.error({ err: err.message }, 'Failed to read store file');
    }
  }

  function writeToFile(filePath) {
    try {
      const data = {
        chats: Object.fromEntries(chats.entries()),
        contacts: Object.fromEntries(contacts.entries()),
        messages: {}
      };
      for (const [jid, map] of messages.entries()) {
        data.messages[jid] = Object.fromEntries(map.entries());
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      if (logger) logger.error({ err: err.message }, 'Failed to write store file');
    }
  }

  return {
    chats,
    contacts,
    messages,
    bind,
    loadMessage,
    readFromFile,
    writeToFile
  };
}

module.exports = { makeInMemoryStore };
