const path = require('node:path');
const antilinkRegex = {
  group: /chat\.whatsapp\.com\/(?:invite|join)/i,
  channel: /whatsapp\.com\/channel\/[A-Za-z0-9]+/i,
  telegram: /t\.me\/[A-Za-z0-9_]+/i,
  all: /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+\/[^\s]*/i
};
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
module.exports = { DATA_DIR, antilinkRegex };
