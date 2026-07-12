const fs = require('node:fs');
const path = process.argv[2];
const content = fs.readFileSync(path, 'utf8');
const cleaned = content.replace(/\{"\$mid":\d+,"mimeType":"[^"]+","data":"[^"]*"\}/g, '');
fs.writeFileSync(path, cleaned);
console.log('Cleaned:', path, 'size:', cleaned.length);
