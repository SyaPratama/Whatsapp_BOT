const fs = require('fs');
const path = require('path');
const axios = require('axios');

const TEMP_DIR = path.join(process.cwd(), 'temp');

function ensureTempDir() {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

async function CatBox(filePath) {
  ensureTempDir();
  const buffer = fs.readFileSync(filePath);
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', new Blob([buffer]), path.basename(filePath));
  const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form });
  return (await res.text()).trim();
}

async function TelegraPh(filePath) {
  const buffer = fs.readFileSync(filePath);
  const form = new FormData();
  form.append('file', new Blob([buffer]), path.basename(filePath));
  const res = await fetch('https://telegra.ph/upload', { method: 'POST', body: form });
  const data = await res.json();
  return data && data[0] ? `https://telegra.ph${data[0].src}` : '';
}

async function UploadFileUgu(filePath) {
  const buffer = fs.readFileSync(filePath);
  const form = new FormData();
  form.append('files[]', new Blob([buffer]), path.basename(filePath));
  const res = await fetch('https://uguu.se/upload', { method: 'POST', body: form });
  const data = await res.json();
  return data && data.files && data.files[0] ? { url: data.files[0].url } : { url: '' };
}

async function floNime(buffer) {
  const form = new FormData();
  form.append('file', new Blob([buffer]), 'upload.jpg');
  const res = await fetch('https://flonime.my.id/api/upload', { method: 'POST', body: form });
  const data = await res.json();
  return data && data.url ? { url: data.url } : { url: '' };
}

async function uptotelegra(filePath) {
  return TelegraPh(filePath);
}

async function webp2mp4File(filePath) {
  return { output: filePath };
}

module.exports = {
  CatBox,
  TelegraPh,
  UploadFileUgu,
  floNime,
  uptotelegra,
  webp2mp4File
};
