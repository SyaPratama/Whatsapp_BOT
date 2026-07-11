import fs from 'node:fs';
import path from 'node:path';

function safeUnlink(target) {
  try { fs.unlinkSync(target); } catch { /* ignore */ }
}

export async function handleToolsCommand(ctx) {
  const {
    command,
    reply,
    sock,
    m,
    q,
    args,
    text,
    isOwner,
    isGroup,
    isBotAdmins,
    globalState,
    CatBox,
    TelegraPh,
    UploadFileUgu,
    floNime,
    thumbnail,
    Case,
    isVIP,
    scanPlayers
  } = ctx;

  switch (command) {
    case 'autoread': {
      if (!isOwner) return reply('❌ Hanya owner.');
      const action = (args[0] || '').toLowerCase();
      if (action === 'on') {
        globalState.autoread = true;
        return reply('✅ Auto Read Message: ON');
      }
      if (action === 'off') {
        globalState.autoread = false;
        return reply('❌ Auto Read Message: OFF');
      }
      return reply(`*Auto Read Status:* ${globalState.autoread ? 'ON' : 'OFF'}\n\nContoh:\n.autoread on\n.autoread off`);
    }

    case 'hd':
    case 'tohd':
    case 'Enhanced':
    case 'remini': {
      if (!m.quoted) return reply('Fotonya mana?');
      const mime = (m.quoted.msg || m.quoted).mimetype || '';
      if (!/image/.test(mime)) return reply(`Send/Reply Foto dengan caption ${ctx.prefix || '.'}${command}`);
      reply('Enhancing foto, tunggu sebentar...');
      try {
        if (!CatBox) return reply('❌ CatBox uploader belum tersedia.');
        const mediaPath = await sock.downloadAndSaveMediaMessage(m.quoted);
        const uploaded = await CatBox(mediaPath);
        await sock.sendMessage(m.chat, {
          image: { url: `https://api.deline.web.id/tools/hd?url=${uploaded}` },
          caption: 'sukses meningkatkan kualitas foto'
        }, { quoted: m });
        safeUnlink(mediaPath);
      } catch (error) {
        console.log(error);
        reply('Terjadi error');
      }
      return true;
    }

    case 'tourl': {
      if (!m.quoted) return reply('Reply media (foto/video/file) yang mau di upload!');
      const mime = m.quoted.mimetype || '';
      if (!mime) return reply('Media tidak valid!');
      reply('⏳ Uploading ke semua platform...');
      const tempFile = `./temp_${Date.now()}`;
      try {
        const media = await m.quoted.download();
        fs.writeFileSync(tempFile, media);
        const results = await Promise.allSettled([
          CatBox ? CatBox(tempFile).catch(() => null) : Promise.resolve(null),
          TelegraPh ? TelegraPh(tempFile).catch(() => null) : Promise.resolve(null),
          UploadFileUgu ? UploadFileUgu(tempFile).catch(() => null) : Promise.resolve(null),
          floNime ? floNime(media).catch(() => null) : Promise.resolve(null)
        ]);
        const [catbox, tele, uguu, flonime] = results.map((entry) => (entry.status === 'fulfilled' ? entry.value : null));
        let hasil = '🌐 *UPLOAD TO URL*\n\n';
        hasil += catbox ? `📦 Catbox:\n${catbox}\n\n` : '📦 Catbox: ERROR\n\n';
        hasil += tele ? `📰 Telegraph:\n${tele}\n\n` : '📰 Telegraph: ERROR\n\n';
        hasil += uguu ? `☁️ Uguu:\n${uguu.url || uguu}\n\n` : '☁️ Uguu: ERROR\n\n';
        hasil += flonime?.url ? `🎨 Flonime:\n${flonime.url}\n\n` : '🎨 Flonime: ERROR\n\n';
        reply(hasil);
      } catch (error) {
        console.log(error);
        reply('Upload gagal ❌');
      } finally {
        safeUnlink(tempFile);
      }
      return true;
    }

    case 'case2plugin': {
      const input = args.join(' ') || (m.quoted && m.quoted.text);
      if (!input) return reply('Kirim code case atau reply case!');
      const nameMatch = input.match(/case\s+["'](.+?)["']:/);
      const cmd = nameMatch ? nameMatch[1] : 'cmd';
      const body = input.replace(/case\s+["'](.+?)["']:\s*/g, '').replace(/break/g, '').trim();
      await reply(`✅ *CASE → HANDLER CJS*\n\n\`\`\`js\nconst handler = async (m, { text, args, reply, sock }) => {\n${body}\n}\nhandler.help = ['${cmd}']\nhandler.tags = ['tools']\nhandler.command = ["${cmd}"]\nmodule.exports = handler\n\`\`\``);
      return true;
    }

    case 'cjs2esm': {
      const input = args.join(' ') || (m.quoted && m.quoted.text);
      if (!input) return reply('Kirim kode CJS atau reply file JS!');
      const convertCJS = (code) => code
        .replace(/const\s+(\w+)\s*=\s*require\(['"](.+?)['"]\)/g, "import $1 from '$2'")
        .replace(/module\.exports\s*=\s*/g, 'export default ')
        .replace(/exports\.(\w+)\s*=\s*/g, 'export const $1 = ');
      await reply(`✅ *CJS → ESM Converted*\n\n\`\`\`js\n${convertCJS(input)}\n\`\`\``);
      return true;
    }

    case 'buyscript':
    case 'belisc':
    case 'hargasc': {
      if (!m.text.startsWith(ctx.prefix || '.')) return true;
      const thumb = thumbnail || globalState.thumbnail;
      const ownerNumber = globalState.owner?.[0] || '6289518188217';
      const caption = `🜲 *𝐁𝐔𝐘 𝐒𝐂𝐑𝐈𝐏𝐓 𝐊𝐁 𝐅𝐈𝐄𝐑𝐋𝐘𝐘 𝐕4* 🜲\n\n💰 *𝐇𝐀𝐑𝐆𝐀:* 𝐑𝐩𝟓𝟎.𝟎𝟎𝟎\n✅ *𝐅𝐑𝐄𝐄 🇺🇵𝐃𝐀𝐓𝐄* (seumur hidup)\n✅ *𝐅🇺🇱𝐋 𝐒🇨🇷🇮🇵𝐓 𝐊𝐁 𝐕4*\n✅ *𝐅🇮𝐓🇺𝐑 𝐋𝐄𝐍𝐆𝐊𝐀🇵*\n\n📞 wa.me/${ownerNumber}`;
      await sock.sendMessage(m.chat, {
        image: { url: thumb },
        caption,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          externalAdReply: {
            title: '𝐁🇺𝐲 𝐒🇨🇷🇮🇵𝐓 𝐊𝐁 𝐕𝟑',
            body: 'Hanya 50k + Free Panel!',
            thumbnailUrl: thumb,
            sourceUrl: `https://wa.me/${ownerNumber}`,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: m });
      return true;
    }

    case 'script':
    case 'sc':
    case 'infosc': {
      await sock.sendMessage(m.chat, { text: '💎 𝐒𝐂 𝐊𝐁 𝐅𝐈𝐄𝐑𝐋𝐘𝐘 𝐕𝟒\n• Reguler : Rp50.000\n• Reseller : Rp125.000\n\nHubungi owner untuk order.' }, { quoted: m });
      return true;
    }

    case 'setpp': {
      if (!m.isGroup) return reply('❌ Fitur ini hanya bisa digunakan di grup.');
      if (!isBotAdmins) return reply('❌ Bot harus menjadi admin grup.');
      const source = m.quoted ? m.quoted : m;
      const mime = (source.msg || source).mimetype || '';
      if (!/image/.test(mime)) return reply('❌ Reply foto yang ingin dijadikan PP grup!');
      const media = await source.download();
      try {
        await sock.updateProfilePicture(m.chat, media);
        await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        reply('✅ Berhasil mengubah foto profil grup.');
      } catch (error) {
        console.error(error);
        reply('❌ Gagal mengubah foto profil. Pastikan gambar tidak rusak.');
      }
      return true;
    }

    case 'addcase':
    case 'delcase':
    case 'listcase': {
      if (!isOwner) return reply('❌ Hanya owner.');
      if (!Case) return reply('Library/system belum tersedia.');
      try {
        if (command === 'addcase') {
          if (!text) return reply('case "namacase":{ ... }');
          Case.add(text);
          return reply('✅ Case berhasil ditambahkan.');
        }
        if (command === 'delcase') {
          if (!text) return reply('namaCase');
          Case.delete(text);
          return reply(`✅ Case "${text}" berhasil dihapus.`);
        }
        return reply('📜 List Case:\n\n' + Case.list());
      } catch (error) {
        return reply(error.message);
      }
    }

    case 'getcase':
    case 'gc': {
      if (!isOwner) return reply('❌ Hanya owner.');
      if (!q) return reply('Masukkan nama case.\nContoh: .getcase list');
      const filePath = path.join(process.cwd(), 'KyzoYMD.js');
      if (!fs.existsSync(filePath)) return reply('❌ File KyzoYMD.js tidak ditemukan.');
      const content = fs.readFileSync(filePath, 'utf8');
      const caseName = q.trim();
      const regex = new RegExp(`(case\\s+['"]${caseName}['"]\\s*:\\s*[\\s\\S]*?)(?=\\n\\s*case\\s+|\\n\\s*default\\s*:|$)`, 'i');
      const match = content.match(regex);
      if (!match) {
        await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return reply(`❌ Case "${caseName}" tidak ditemukan.`);
      }
      await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
      await sock.sendMessage(m.chat, { text: `\`\`\`javascript\n${match[1].trim()}\n\`\`\`` }, { quoted: m });
      return true;
    }

    case 'list': {
      if (!m.text.startsWith(ctx.prefix || '.')) return true;
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      const list = globalState.autoList?.[m.chat];
      if (!list || (list.K.length === 0 && list.B.length === 0)) return reply('Belum ada list. Gunakan .lk Nama Nominal');
      const listK = list.K.map((p) => `${p.nama} ${p.nominal}${p.mark}`).join('\n');
      const listB = list.B.map((p) => `${p.nama} ${p.nominal}${p.mark}`).join('\n');
      reply(`K:\n${listK || '(kosong)'}\n\nB:\n${listB || '(kosong)'}`);
      return true;
    }

    case 'pp': {
      if (!m.isGroup) return reply('Fitur ini cuma bisa dipake di grup, King!');
      try {
        const ppUrl = await sock.profilePictureUrl(m.chat, 'image').catch(() => 'https://i.ibb.co/vzG72QG/avatar-contact.jpg');
        const caption = `⚡ *PP GROUP AKTIF* ⚡\n\n_Cekidot, ini QR grup kita._\n_Jangan cacicu kalau ga main!_ 👊`;
        await sock.sendMessage(m.chat, { image: { url: ppUrl }, caption }, { quoted: m });
      } catch (error) {
        reply('❌ *Gagal ambil PP Group!*');
      }
      return true;
    }

    case 'c': {
      if (!isOwner && !isVIP(m.sender)) return reply('❌ Fitur khusus VIP.');
      if (!m.quoted) return reply('📌 Reply list taruhan.');
      const parsed = scanPlayers(m.quoted.text);
      const totalK = parsed.k.reduce((sum, item) => sum + item.nominal, 0);
      const totalB = parsed.b.reduce((sum, item) => sum + item.nominal, 0);
      const allPlayers = [...parsed.k, ...parsed.b];
      const listLF = allPlayers.filter((p) => p.mark && p.mark.toLowerCase() === 'lf');
      const listTitik = allPlayers.filter((p) => p.mark && p.mark === '.');
      const strLF = listLF.length ? listLF.map((p) => ` ✩ ${p.nama} ${p.nominal}lf`).join('\n') : ' —';
      const strTitik = listTitik.length ? listTitik.map((p) => ` ✩ ${p.nama} ${p.nominal}.`).join('\n') : ' —';
      let output = `𓉳 *CEK SALDO PLAYER* 𓉳\n\n*LF / HUTANG :*\n${strLF}\n\n*BELUM TF :*\n${strTitik}\n\n━━━━━━━━━━━━\n*K* : ${parsed.k.map((p) => p.nominal).join(', ') || '0'} = ${totalK}\n*B* : ${parsed.b.map((p) => p.nominal).join(', ') || '0'} = ${totalB}`;
      await reply(output);
      const selisih = Math.abs(totalK - totalB);
      const pesan2 = totalK !== totalB
        ? `𓉳 *${totalK < totalB ? 'K' : 'B'} - ${selisih} OPEN ALL / ECER*`
        : listTitik.length
          ? `☕︎ *WAIT! ADA YANG BELUM TF:*\n${listTitik.map((p) => ` ✩ ${p.nama}`).join('\n')}\n\n*TF DULU BIAR DIROLL!* 🔥`
          : `✅ *SEMUA AMAN! GAS ROLL!* 🎲`;
      await reply(pesan2);
      return true;
    }

    default:
      return false;
  }
}
