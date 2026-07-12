const fs = require('fs')

global.owner = ['6287796752356']
global.namaown = 'Zoee'
global.prefa = ['', '!', '.', ',']
global.thumbnail = 'https://athars.space/uploads/3fad0629.jpeg'
global.idch = '120363407591116463@newsletter'
global.qris = 'https://athars.space/uploads/92748410.jpeg'
global.version = '1.0'

global.welcome = false
global.goodbye = false

global.thumb = 'https://athars.space/uploads/3fad0629.jpeg'

global.usePairingCode = true
global.pairingNumber = ''
global.pairingPhoneCode = ''
global.platform = 'wa_business'

global.antilinkRegex = {
    group: /chat\.whatsapp\.com\/(?:invite|join)/i,
    channel: /whatsapp\.com\/channel\/[A-Za-z0-9]+/i,
    telegram: /t\.me\/[A-Za-z0-9_]+/i,
    all: /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+\/[^\s]*/i
}

global.mess = {
  owner: 'Maaf hanya untuk owner bot',
  prem: 'Maaf hanya untuk pengguna premium, premium keti .owner aja',
  admin: 'Maaf hanya untuk admin group',
  botadmin: 'Maaf bot harus dijadikan admin',
  group: 'Maaf hanya dapat digunakan di dalam group',
  private: 'Silahkan gunakan fitur di private chat'
}

const file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})