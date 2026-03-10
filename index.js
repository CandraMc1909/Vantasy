// scrip by = candramc1909
// dibuat hari/tg/bl/th : Rabu-12-01-2026 
// awner : 083801785598
// scripbot for wa grup minecraft Vantasy

//————————————————————————————————————————————————————————————————————————————————————————————————————————//
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetch, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const lastRandomPic = {};
const claimData = {}; // Untuk cooldown claim token
const voucherData = {}; // Untuk cooldown claim voucher
const harianData = {}; // Untuk cooldown harian 
const COOLDOWN_SFW = 15 * 60 * 1000;
const COOLDOWN_Echi = 15 * 60 * 1000;
const COOLDOWN_WAIFU = 1 * 60 * 1000;
const COOLDOWN_Hanime = 20 * 60 * 1000;
const COOLDOWN_Hentai = 20 * 60 * 1000;


async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('session');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
    browser: ['Chrome', 'Windows', '10']
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) require('qrcode-terminal').generate(qr, { small: true });
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('Google ✓');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;
    if (msg.key.fromMe) return;
    const from = msg.key.remoteJid;
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '')
      .toLowerCase()
      .trim();
      
      
      
    // Head scrip bot //
    
    async function getProfilePicture(sock, jid) {
      try {
        return await sock.profilePictureUrl(jid, 'image');
      } catch {
        return null; // jika user tidak punya PP / private
      }
    }
    
    // Ambil foto welcome random
    function getRandomWelcomeImage() {
      const folder = path.join(__dirname, 'welcome');
      if (!fs.existsSync(folder)) return null;
    
      const files = fs.readdirSync(folder)
        .filter(f => /\.(jpg|jpeg|png)$/i.test(f));
    
      if (files.length === 0) return null;
    
      return path.join(folder, files[Math.floor(Math.random() * files.length)]);
    }
    // jihj
    
    sock.ev.on('group-participants.update', async (anu) => {
      if (anu.action !== 'add') return;
    
      const groupId = anu.id;
    
      for (const user of anu.participants) {
    
        // ❌ Abaikan bot
        if (user.includes('whatsapp.net') && user === sock.user.id) continue;
    
        const ppUser = await getProfilePicture(sock, user);
        const welcomeImg = getRandomWelcomeImage();
    
        const captionWelcome =
    `👋 *SELAMAT DATANG DI GRUP VANTASY SMP!*
    @${user.split('@')[0]}
    
    ✨ Semoga betah
    📌 Baca deskripsi grup
    🤝 Jaga sopan santun`;
    
        // 1️⃣ Kirim FOTO SAMBUTAN KHUSUS
        if (welcomeImg) {
          await sock.sendMessage(groupId, {
            image: fs.readFileSync(welcomeImg),
            caption: captionWelcome,
            mentions: [user]
          });
        } else {
          await sock.sendMessage(groupId, {
            text: captionWelcome,
            mentions: [user]
          });
        }
    
        // 2️⃣ Kirim FOTO PROFIL USER (jika ada)
        if (ppUser) {
          await sock.sendMessage(groupId, {
            image: { url: ppUser },
            caption: `📸 Foto profil @${user.split('@')[0]}`,
            mentions: [user]
          });
        }
      }
    });



    // Fungsi umum untuk claim dari file txt
    // End Fungsi umum claim token //
    //————————————————————————————————————————————————————————————————————————————————————————————————————————//
    //————————————————————————————————————————————————————————————————————————————————————————————————————————//
    // Inisialisasi global cooldown
    if (!global.cooldowns) {
      global.cooldowns = new Map();
    }
    
    // --- FUNGSI KONVERSI MS KE WAKTU ---
    function msToTime(duration) {
      let seconds = Math.floor((duration / 1000) % 60);
      let minutes = Math.floor((duration / (1000 * 60)) % 60);
      let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    
      let res = [];
      if (hours > 0) res.push(`${hours} jam`);
      if (minutes > 0) res.push(`${minutes} menit`);
      if (seconds > 0) res.push(`${seconds} detik`);
    
      return res.join(', ') || '0 detik';
    }

    
    async function sendRandomFromFolder(from, folderName, jsonName, template, menuKey, cooldownTime) {
      const now = Date.now();
      const cooldownId = `${from}_${menuKey}`;
      const lastUsed = global.cooldowns.get(cooldownId) || 0;
    
      // --- CEK COOLDOWN ---
      if (now < lastUsed + cooldownTime) {
        const timeLeft = (lastUsed + cooldownTime) - now;
        return sock.sendMessage(from, {
          text: `⏳ *Cooldown Aktif!*\n\nMenu: *${menuKey}*\nSisa waktu:\n*${msToTime(timeLeft)}*`
        });
      }
    
      const folderPath = path.join(__dirname, folderName);
      const dbPath = path.join(__dirname, 'data', `${jsonName}.json`);
    
      if (!fs.existsSync(folderPath)) return;
    
      const files = fs.readdirSync(folderPath)
        .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    
      if (files.length === 0) {
        return sock.sendMessage(from, { text: 'Folder kosong.' });
      }
    
      const randomFile = files[Math.floor(Math.random() * files.length)];
      const filePath = path.join(folderPath, randomFile);
    
      let db = {};
      if (fs.existsSync(dbPath)) {
        db = JSON.parse(fs.readFileSync(dbPath));
      }
    
      const meta = db[randomFile] || {
        nama: '',
        sumber: '',
        creator: '',
        genre: '',
        url: '',
        id: '',
        bintang: '',
        warning: ''
      };
    
      const caption = template
        .replace('{file}', randomFile)
        .replace('{nama}', meta.nama)
        .replace('{sumber}', meta.sumber)
        .replace('{warning}', meta.warning)
        .replace('{bintang}',meta.bintang)
        .replace('{creator}', meta.creator)
        .replace('{genre}', meta.genre)
        .replace('{url}', meta.url)
        .replace('{id}', meta.id);
    
      await sock.sendMessage(from, {
        image: fs.readFileSync(filePath),
        caption
      });
    
      // --- SIMPAN COOLDOWN PER MENU ---
      global.cooldowns.set(cooldownId, now);
    }

    // Command Waifu
    if (
      text === '/generate my_bini' ||
      text === '/generate my_kisah' ||
      text === '/generate my_istri' ||
      text === '/generate waifu' ||
      text === '/my_bini' ||
      text === '/my bini' ||
      text === '/my_kisah' ||
      text === '/my kisah' ||
      text === '/my_istri' ||
      text === '/my istri' ||
      text === '/waifu'
    ) {
    await sendRandomFromFolder(
    from,
    'database/Waifu',
    'Waifu',
    `   *{genre}*\n *˚₊·˚₊· ͟͟͞͞➳❥* VantasySmp\n*☆═━┈◈ ╰ v26.1.24 ╯ ◈┈━═☆*\n*│*\n*╰ ㊂ ▸▸ _RANDOM WAIFU_ ◂◂*\n*│* ┊\n*│* ┊▸ ✦ _Nama : {nama}_\n*│* ┊▸ ✦ Sumber : {sumber}\n*│* ┊▸ ✦ creator : {creator}\n*│* ┊▸ ✦ Url : {url}\n*│* ╰∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙\n*│* {id}\n*╰ ㊂ ▸▸ _Google_ ◂◂*\n\n\n   {warning}`,
    'WAIFU',
     COOLDOWN_WAIFU
      );
    }
    // command Echi
    if (
        text === '/generate echi' ||
        text === '/generate Echi' ||
        text === '/echi' ||
        text === '/Echi'
    ) {
    await sendRandomFromFolder(
    from,
    'database/SFW',
    'SFW',
    `   *{genre}*\n *˚₊·˚₊· ͟͟͞͞➳❥* VantasySmp\n*☆═━┈◈ ╰ v26.1.24 ╯ ◈┈━═☆*\n*│*\n*╰ ㊂ ▸▸ _RANDOM ECHI_ ◂◂*\n*│* ┊\n*│* ┊▸ ✦ _Nama : {nama}_\n*│* ┊▸ ✦ Sumber : {sumber}\n*│* ┊▸ ✦ creator : {creator}\n*│* ┊▸ ✦ Url : {url}\n*│* ╰∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙\n*│* {id}\n*│* {bintang}\n*╰ ㊂ ▸▸ _Google_ ◂◂*\n\n\nNb: karena ada unsur² sensitif lebih baik gunakan di chat pribadi`,
    'ECHI',
     COOLDOWN_Echi
      );
    }
    // Command SFW
    if (
        text === '/generate sfw' ||
        text === '/generate nsfw' ||
        text === '/nsfw' ||
        text === '/sfw'
    ) {
    await sendRandomFromFolder(
    from,
    'database/SFW',
    'SFW',
    `   *{genre}*\n *˚₊·˚₊· ͟͟͞͞➳❥* VantasySmp\n*☆═━┈◈ ╰ v26.1.24 ╯ ◈┈━═☆*\n*│*\n*╰ ㊂ ▸▸ _RANDOM SFW_ ◂◂*\n*│* ┊\n*│* ┊▸ ✦ _Nama : {nama}_\n*│* ┊▸ ✦ Sumber : {sumber}\n*│* ┊▸ ✦ creator : {creator}\n*│* ┊▸ ✦ Url : {url}\n*│* ╰∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙\n*│* {id}\n*│* {bintang}\n*╰ ㊂ ▸▸ _Google_ ◂◂*\n\n\nNb: karena ada unsur² sensitif lebih baik gunakan di chat pribadi`,
    'SFW',
     COOLDOWN_SFW
      );
    }
    // contoh Command
    if (
        text === '/generate hanime' ||
        text === 'generate hanime' ||
        text === '/hanime' ||
        text === 'hanime'
    ) {
    await sendRandomFromFolder(
    from,
    'database/hanime',
    'hanime',
    `   *{genre}*\n *˚₊·˚₊· ͟͟͞͞➳❥* VantasySmp\n*☆═━┈◈ ╰ v26.1.24 ╯ ◈┈━═☆*\n*│*\n*╰ ㊂ ▸▸ _RANDOM HANIME_ ◂◂*\n*│* ┊\n*│* ┊▸ ✦ _Nama : {nama}_\n*│* ┊▸ ✦ Sumber : {sumber}\n*│* ┊▸ ✦ creator : {creator}\n*│* ┊▸ ✦ Url : {url}\n*│* ╰∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙\n*│* {id}\n*│* {bintang}\n*╰ ㊂ ▸▸ _Google_ ◂◂*\n\n\nNb: karena ada unsur² sensitif lebih baik gunakan di chat pribadi`,
    'Hanime',
     COOLDOWN_Hanime
      );
    }
    if (
        text === '/generate hentai' ||
        text === 'generate hentai' ||
        text === '/hentai' ||
        text === 'hentai'
    ) {
    await sendRandomFromFolder(
    from,
    'database/Hentai',
    'Hentai',
    `   *{genre}*\n *˚₊·˚₊· ͟͟͞͞➳❥* VantasySmp\n*☆═━┈◈ ╰ v26.1.24 ╯ ◈┈━═☆*\n*│*\n*╰ ㊂ ▸▸ _RANDOM HENTAY_ ◂◂*\n*│* ┊\n*│* ┊▸ ✦ _Nama : {nama}_\n*│* ┊▸ ✦ Sumber : {sumber}\n*│* ┊▸ ✦ creator : {creator}\n*│* ┊▸ ✦ Url : {url}\n*│* ╰∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙\n*│* {id}\n*│* {bintang}\n*╰ ㊂ ▸▸ _Google_ ◂◂*\n\n\nNb: karena ada unsur² sensitif lebih baik gunakan di chat pribadi`,
    'Hentai',
     COOLDOWN_Hentai
      );
    }
    // 1. Pastikan import/require ada di paling atas!
    // 2. Fungsi pembantu waktu
    function msToTime(duration) {
      let seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    
      let res = [];
      if (hours > 0) res.push(`${hours} jam`);
      if (minutes > 0) res.push(`${minutes} menit`);
      if (seconds > 0) res.push(`${seconds} detik`);
      return res.join(', ') || '0 detik';
    }
    
    // 3. Fungsi handleClaim
    async function handleClaim(fileName, typeName, dataStore, cooldownTime, successMessage) {
      try {
        const now = Date.now();
        const lastUsed = dataStore[from] || 0;
    
        if (now < lastUsed + cooldownTime) {
          const timeLeft = (lastUsed + cooldownTime) - now;
          return sock.sendMessage(from, { 
            text: `⏳ Kamu sudah mengambil ini! Tunggu sebentar lagi selama:\n\n*${msToTime(timeLeft)}*` 
          });
        }
    
        // Error tadi muncul di sini karena 'fs' belum siap
        if (!fs.existsSync(fileName)) {
          await sock.sendMessage(from, { text: `File ${fileName} tidak ditemukan!` });
          return;
        }
    
        const items = fs.readFileSync(fileName, 'utf-8')
          .split('\n')
          .map(t => t.trim())
          .filter(t => t.length > 0);
    
        if (items.length === 0) {
          await sock.sendMessage(from, { text: 'Stok kosong bro…………' });
          return;
        }
    
        const item = items.shift();
        fs.writeFileSync(fileName, items.join('\n'));
        
        dataStore[from] = now;
        await sock.sendMessage(from, { text: successMessage.replace('{item}', item) });
    
      } catch (err) {
        // Pesan error yang kamu dapatkan tadi tertangkap di sini
        await sock.sendMessage(from, { text: 'Terjadi error saat proses claim:\n' + err.message });
      }
    }
    // end comman
    // end seson
    async function sendFile(sock, from, filePath, mimeType, fileName) {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        await sock.sendMessage(from, {
          document: fileBuffer,
          mimetype: mimeType,
          fileName: fileName
        });
      } catch (err) {
        await sock.sendMessage(from, { text: 'Terjadi error saat mengirim file:\n' + err.message });
      }
    }
    // End Umum mengirim file //
    //————————————————————————————————————————————————————————————————————————————————————————————————————————//
    // Fungsi untuk mengirim file secara random
    async function sendRandomFile(sock, from, folderPath, mimeType) {
      try {
        const files = fs.readdirSync(folderPath);
        const randomFile = files[Math.floor(Math.random() * files.length)];
        const filePath = `${folderPath}/${randomFile}`;
        await sendFile(sock, from, filePath, mimeType, randomFile);
      } catch (err) {
        await sock.sendMessage(from, { text: 'Terjadi error saat mengirim file:\n' + err.message });
      }
    }
    // End Fungsi Umum RANDOM kirim File, PDF, dan Video //
    //————————————————————————————————————————————————————————————————————————————————————————————————————————//
    // End function menu//
    
    // --- PENGGUNAAN COMMAND ---
    
    if (
        text === '/give @p token_basic' ||
        text === '/give @p token basic'
    ) {
      const successMsg = `*˚₊·˚₊· ͟͟͞͞➳❥* VantasySmp\n*☆═━┈◈ ╰ v26.1.24 ╯ ◈┈━═☆* \n*│* \n*╰ ㊂ ▸▸ _TOKEN BASIC_ ◂◂*\n*│* ┊\n*│* ┊▸ ✦Token anda : {item}.xyz\n*│* ┊▸ ✦Cara Pakai : cara-pakai.com\n*│* ╰∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙ ∙ ∙ ∙ ∙ \n*│*\n*╰ ㊂ ▸▸ _Google_ ◂◂*\nNb: token ini rawan di curi jadi hati²`;
      await handleClaim('database/token.txt', 'Token', claimData, 86400000, successMsg);
    }
    
    if (
        text === '/give @p token_elite' ||
        text === '/give @p token elite'
    ) {
      const successMsg = `*˚₊·˚₊· ͟͟͞͞➳❥* VantasySmp\n*☆═━┈◈ ╰ v26.1.24 ╯ ◈┈━═☆* \n*│* \n*╰ ㊂ ▸▸ _TOKEN ELITE_ ◂◂*\n*│* ┊\n*│* ┊▸ ✦Token anda : {item}.xyz\n*│* ┊▸ ✦Cara Pakai : cara-pakai.com\n*│* ╰∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙ ∙ ∙ ∙ ∙ \n*│*\n*╰ ㊂ ▸▸ _Google_ ◂◂*\nNb: token ini rawan di curi jadi hati²`;
      await handleClaim('database/vocer.txt', 'Voucher', voucherData, 86400000, successMsg);
    }
    
    if (
        text === '/give @p token_epik' ||
        text === '/give @p token epik'
    ) {
      const successMsg = `*˚₊·˚₊· ͟͟͞͞➳❥* VantasySmp\n*☆═━┈◈ ╰ v26.1.24 ╯ ◈┈━═☆* \n*│* \n*╰ ㊂ ▸▸ _TOKEN EPIK_ ◂◂*\n*│* ┊\n*│* ┊▸ ✦Token anda : {item}.xyz\n*│* ┊▸ ✦Cara Pakai : cara-pakai.com\n*│* ╰∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙ ∙ ∙ ∙ ∙ \n*│*\n*╰ ㊂ ▸▸ _Google_ ◂◂*\nNb: token ini rawan di curi jadi hati²`;
      await handleClaim('database/harian.txt', 'harian', harianData, 86400000, successMsg);
    }

    // End Fungsi Umum claim token //
    //————————————————————————————————————————————————————————————————————————————————————————————————————————//
    // Command untuk mengirim file PDF, JSON, TXT, HTML, dan MP4
    if (
        text === '!kirim_pdf' ||
        text === '.kirim_pdf'
    ) {
      const filePath = 'path/to/file.pdf';
      await sendFile(sock, from, filePath, 'application/pdf', 'file.pdf');
    }
    
    // Command untuk mengirim file TXT
    if (
        text === '!kirim_txt' ||
        text === '.kirim_txt'
    ) {
      const filePath = 'database/token.txt';
      await sendFile(sock, from, filePath, 'text/plain', 'file.txt');
    }
    
    // Command untuk mengirim file JSON
    if (
        text === '!kirim_json' ||
        text === '.kirim_json'
    ) {
      const filePath = 'path/to/file.json';
      await sendFile(sock, from, filePath, 'application/json', 'file.json');
    }
    
    // Command untuk mengirim file HTML
    if (
        text === '!kirim_html' ||
        text === '.kirim_html'
    ) {
      const filePath = 'path/to/file.html';
      await sendFile(sock, from, filePath, 'text/html', 'file.html');
    }
    
    // Command untuk mengirim file MP4
    if (
        text === '!vio_mp4' ||
        text === '.vio_mp4'
    ) {
      const filePath = 'src/video/video1.mp4';
      await sendFile(sock, from, filePath, 'video/mp4', 'file.mp4');
    }
    if (
        text === '!vio1_mp4' ||
        text === '.vio1_mp4'
    ) {
      const filePath = 'src/video/video2.mp4';
      await sendFile(sock, from, filePath, 'video/mp4', 'file.mp4');
    }
    if (
        text === '!vio2_mp4' ||
        text === '.vio2_mp4'
    ) {
      const filePath = 'src/video/video3.mp4';
      await sendFile(sock, from, filePath, 'video/mp4', 'file.mp4');
    }
    //End Command untuk mengirim file PDF, JSON, TXT, HTML, dan MP4//
    //————————————————————————————————————————————————————————————————————————————————————————————————————————//
    //Fungsi Umum untuk mengirim random PDF, HTML, MP4
    // Command untuk mengirim file PDF secara random
    if (
        text === '!pdf' ||
        text === '.pdf'
    ) {
      const folderPath = 'src/pdf';
      await sendRandomFile(sock, from, folderPath, 'application/pdf');
    }
    if (
        text === '!isi' ||
        text === '.isi'
    ) {
      const folderPath = 'database';
      await sendRandomFile(sock, from, folderPath, 'text/plain');
    }
    // Command untuk mengirim file HTML secara random
    if (
        text === '!ser' ||
        text === '.ser'
    ) {
      const folderPath = 'src/html';
      await sendRandomFile(sock, from, folderPath, 'text/html');
    }
    
    // Command untuk mengirim file MP4 secara random
    if (
        text === '!mp4' ||
        text === '.mp4' ||
        text === '/mp4'
    ) {
      const folderPath = 'src/video';
      await sendRandomFile(sock, from, folderPath, 'video/mp4');
    }
    // End Command untuk mengirim file PDF secara random//
    //————————————————————————————————————————————————————————————————————————————————————————————————————————//
    // Command menu
    else if (
      text === '!menu' ||
      text === '.menu' 
    ) {
      await sock.sendMessage(from, { text: ` *˚₊·˚₊· ͟͟͞͞➳❥* VantasySmp\n*☆═━┈◈ ╰ v26.1.24 ╯ ◈┈━═☆* \n*│* \n*╰ ㊂ ▸▸ _INFORMASI MENU_ ◂◂*\n*│* ┊\n*│* ┊▸ ✦ _.comand_help_\n*│* ┊▸ ✦ _.bio_\n*│* ┊▸ ✦ _.donet_\n*│* ╰∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙ ∙ ∙ ∙ ∙ \n*│*\n*╰ ㊂ ▸▸ _Google_ ◂◂*` });
    }
    
    else if (
      text === '!donasi' ||
      text === '.donasi' ||
      text === 'donasi' ||
      text === '.donet' ||
      text === '!donet' ||
      text === 'donet'
    ) {
      await sock.sendMessage(from, { text: ` *˚₊·˚₊· ͟͟͞͞➳❥* VantasySmp\n*☆═━┈◈ ╰ v26.1.24 ╯ ◈┈━═☆* \n*│* \n*╰ ㊂ ▸▸ _INFORMASI Donasi_ ◂◂*\n*│* ┊\n*│* ┊▸ ✦ _QR : https://qu.ax/7peeD_\n*│* ┊▸ ✦ _BSI: 7246574167_\n*│* ┊▸ ✦ _Dana: 083801785598_\n*│* ┊▸ ✦ _Saweria:saweria.co/CandraMc_\n*│* ┊▸ ✦ _Bank Jago: 508045848851_\n*│* ╰∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙ ∙ ∙ ∙ ∙ \n*│*\n*╰ ㊂ ▸▸ _Google_ ◂◂*` });
    }
    
    else if (
      text === '!bio' ||
      text === '.bio' ||
      text === 'bio' ||
      text === '!me' ||
      text === '.me' ||
      text === 'me'
    ) {
      await sock.sendMessage(from, { text: ` *˚₊·˚₊· ͟͟͞͞➳❥* VantasySmp\n*☆═━┈◈ ╰ v26.1.24 ╯ ◈┈━═☆* \n*│* \n*╰ ㊂ ▸▸ _INFORMASI BIO ADMIN_ ◂◂*\n*│* ┊\n*│* ┊▸ ✦ » Nama : Candra\n*│* ┊▸ ✦ » Asal : Sumbar\n*│* ┊▸ ✦ » Kota :Padang\n*╰ ㊂ ▸▸ _INFORMASI SOSMET ADMIN_ ◂◂*\n*│* ┊▸ ✦ _» Twtter : bit.ly/467y9Wq_\n*│* ┊▸ ✦ _» Discrod : bit.ly/SurvivalSmp_\n*│* ┊▸ ✦ _» Tictok : _\n*│* ┊▸ ✦ _» Facebok : _\n*│* ┊▸ ✦ _let » Web : _\n*│* ┊▸ ✦ _•» LynkId : lynk.id/candramc1909_\n*│* ┊▸ ✦ _» forum : bit.ly/Login-whitelist_\n*│* ╰∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙ ∙ ∙ ∙ ∙ \n*│*\n*╰ ㊂ ▸▸ _Google_ ◂◂*` });
    }
    
    
    // menu command
    else if (
      text === '.comand_help' ||
      text === '.comand help' ||
      text === '.cmd_help'
    ) {
      await sock.sendMessage(from, { text: ` *˚₊·˚₊· ͟͟͞͞➳❥* VantasySmp\n*☆═━┈◈ ╰ v26.1.24 ╯ ◈┈━═☆* \n*│* \n*╰ ㊂ ▸▸ _COMAND MENU_ ◂◂*\n*│* ┊\n*│* ┊▸ ✦ _/give_\n*│* ┊▸ ✦ _/generate_\n*│* ┊▸ ✦ _/server_info_\n*│* ┊▸ ✦ _/seed_\n*│* ┊▸ ✦ _/login_\n*│* ╰∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙ ∙ ∙ ∙ ∙ \n*│*\n*╰ ㊂ ▸▸ _Google_ ◂◂*\n    ketik */help_list* jika masi ada yg belum paham dg tag mcd nya` });
    }
    
    // comand help list
    else if (
      text === '/help_list' ||
      text === '/helplist'
    ) {
      await sock.sendMessage(from, { text: ` *˚₊·˚₊· ͟͟͞͞➳❥* VantasySmp\n*☆═━┈◈ ╰ v26.1.24 ╯ ◈┈━═☆* \n*│* \n*╰ ㊂ ▸▸ _HELP LIST_ ◂◂*\n*│* ┊\n*│* ┊▸ ✦ _/give_help_\n*│* ┊▸ ✦ _/generate_help_\n*│* ┊▸ ✦ _/comand_help_\n*│* ┊▸ ✦ _coming soon_\n*│* ╰∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙ ∙ ∙ ∙ ∙ \n*│*\n*╰ ㊂ ▸▸ _Google_ ◂◂*` });
    }
    
    // comand give menu 
    else if (
      text === '/give_help' ||
      text === '/givehelp'
    ) {
      await sock.sendMessage(from, { text: ` *˚₊·˚₊· ͟͟͞͞➳❥* VantasySmp\n*☆═━┈◈ ╰ v26.1.24 ╯ ◈┈━═☆* \n*│* \n*╰ ㊂ ▸▸ _GIVE MENU_ ◂◂*\n*│* ┊\n*│* ┊▸ ✦ _/give @p token_basic_\n*│* ┊▸ ✦ _/give @p token_elit_\n*│* ┊▸ ✦ _/give @p token_epik_\n*│* ┊▸ ✦ _coming soon_\n*│* ╰∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙ ∙ ∙ ∙ ∙ \n*│*\n*╰ ㊂ ▸▸ _Google_ ◂◂*` });
    }
    
    // comand generet menu 
    else if (
      text === '/generate_help' ||
      text === '/generate help' ||
      text === '/generatehelp'
    ) {
      await sock.sendMessage(from, { text: ` *˚₊·˚₊· ͟͟͞͞➳❥* VantasySmp\n*☆═━┈◈ ╰ v26.1.24 ╯ ◈┈━═☆* \n*│* \n*╰ ㊂ ▸▸ _GENERATE MENU_ ◂◂*\n*│* ┊\n*│* ┊▸ ✦ _/generate my_bini_\n*│* ┊▸ ✦ _/generate my_kisah_\n*│* ┊▸ ✦ _/generate my_istri_\n*│* ┊▸ ✦ _/generate waifu_\n*│* ┊▸ ✦ _/generate [  🔒  ]_\n*│* ┊▸ ✦ _/generate [  🔒  ]_\n*│* ┊▸ ✦ _/generate [  🔒  ]_\n*│* ┊▸ ✦ _/generate [  🔒  ]_\n*│* ┊▸ ✦ _/generate [  🔒  ]_\n*│* ┊▸ ✦ _/generate [  🔒  ]_\n*│* ╰∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙ ∙ ∙ ∙ ∙ \n*│* hay pergunakan comand ini dg baik\n*╰ ㊂ ▸▸ _Google_ ◂◂*` });
    }
    
    // comand seed menu 
    else if (
      text === '/seed' ||
      text === 'seed'
    ) {
      await sock.sendMessage(from, { text:` *˚₊·˚₊· ͟͟͞͞➳❥* VantasySmp\n*☆═━┈◈ ╰ v26.1.24 ╯ ◈┈━═☆* \n*│* \n*╰ ㊂ ▸▸ _Seed Menu_ ◂◂*\n*│* ┊\n*│* ┊▸ ✦ _Seed serve wolrd » 110603260120_\n*│* ╰∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙ ∙ ∙ ∙ ∙ \n*│*\n*╰ ㊂ ▸▸ _Google_ ◂◂*\n\n\n    puncak keserakahan player adalah ketika seed server terepos :v` });
    }
    
    // comand server info menu 
    else if (
      text === '/server_info' ||
      text === '/server info' ||
      text === '/serverinfo'
    ) {
      await sock.sendMessage(from, { text: ` *˚₊·˚₊· ͟͟͞͞➳❥* VantasySmp\n*☆═━┈◈ ╰ v26.1.24 ╯ ◈┈━═☆* \n*│* \n*╰ ㊂ ▸▸ _Server Info_ ◂◂*\n*│* ┊\n*│* ┊▸ ✦ _ip adress » mc.vantasy.xys_\n*│* ┊▸ ✦ _proxy » 30003_\n*│* ╰∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙ ∙ ∙ ∙ ∙ \n*│*\n*╰ ㊂ ▸▸ _Google_ ◂◂*` });
    }
    
    else if (
      text === '/login'
    ) {
      await sock.sendMessage(from, { text: ` *˚₊·˚₊· ͟͟͞͞➳❥* VantasySmp\n*☆═━┈◈ ╰ v26.1.24 ╯ ◈┈━═☆* \n*│* \n*╰ ㊂ ▸▸ _Login Menu_ ◂◂*\n*│* ┊\n*│* ┊▸ ✦ _link » bit.ly/Login-whitelist_\n*│* ╰∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙ ∙ ∙ ∙ ∙ \n*│*\n*╰ ㊂ ▸▸ _Google_ ◂◂*\n    telah diberlakukan daftar whitelist lewat Google forum link tertera di atas` });
    }
    
    
  });
}

startBot();
