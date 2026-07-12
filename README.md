
````markdown
# Bot Whatsapp Zoee

Bot WhatsApp berbasis **Node.js** yang dibangun di atas [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) (v7 RC). Dirancang untuk berjalan di **Windows, Linux, Android (Termux), dan iOS (iSH/a-Shell)** dengan autentikasi default menggunakan **Pairing Code** (Android fingerprint).

> **Catatan**: Baileys adalah pustaka *unofficial*. Gunakan secara bijak dan patuhi [Terms of Service WhatsApp](https://www.whatsapp.com/legal/terms-of-service). Hindari spam/blast pesan tanpa izin.

---

## Daftar Isi

- [Fitur](#fitur)
- [Persyaratan](#persyaratan)
- [Instalasi](#instalasi)
- [Instalasi di Termux (Android)](#instalasi-di-termux-android)
- [Konfigurasi](#konfigurasi)
- [Menjalankan Bot](#menjalankan-bot)
- [Autentikasi](#autentikasi)
- [Struktur Project](#struktur-project)
- [Data & Hak Akses](#data--hak-akses)
- [Anti-Banned Checklist](#anti-banned-checklist)
- [Troubleshooting](#troubleshooting)
- [Scripts](#scripts)
- [Testing](#testing)
- [Lisensi](#lisensi)

---

## Fitur

- **Pairing Code** sebagai metode login default (lebih cepat dari QR).
- **Multi-platform**: Windows, Linux, Android (Termux), iOS (iSH / a-Shell).
- **Manajemen group**: `promote`, `demote`, `kick`, `add`, `antilink`, `welcome/goodbye`.
- **Sistem sewa & VIP** berbasis file JSON.
- **Plugin system** (CJS + ESM) — muat/unduh plugin lewat perintah chat.
- **Outbound queue** dengan rate-limit (1.5s/JID + 30 msg/menit) untuk menghindari banned.
- **Group metadata cache** TTL 5 menit, **msg-retry cache** 1 jam.
- **Reconnect otomatis** dengan exponential backoff (5/10/20/40/60 detik, max 5 attempt).
- **Logger pino** opsional dengan redaksi otomatis untuk kredensial.

---

## Persyaratan

- **Node.js** >= 18 ([download](https://nodejs.org/))
- **npm** (sudah termasuk saat install Node.js)
- Koneksi internet stabil
- Nomor WhatsApp aktif (untuk pairing pertama kali)

### Platform yang didukung

| OS        | Cara                                                                |
| --------- | ------------------------------------------------------------------- |
| Windows   | Install Node.js lalu `npm start` di PowerShell/CMD                  |
| Linux     | Install via `nvm`/apt, lalu `npm start`                             |
| Android   | Gunakan **Termux** (>= 0.118), install `nodejs` via `pkg`          |
| iOS       | Gunakan **iSH** atau **a-Shell**, install Node.js                   |

---

## Instalasi

1. **Clone repository**

   ```bash
   git clone https://github.com/SyaPratama/Whatsapp_BOT.git
   cd Whatsapp_BOT
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **(Opsional) Edit konfigurasi** — lihat [Konfigurasi](#konfigurasi).

4. **Jalankan bot**

   ```bash
   npm start
   ```

---

## Instalasi di Termux (Android)

Panduan lengkap untuk menjalankan bot di **HP Android** via Termux.

### 1. Install Termux

1. Buka [F-Droid](https://f-droid.org/) atau [GitHub releases Termux](https://github.com/termux/termux-app/releases).
2. **Jangan** install dari Play Store (sudah outdated).
3. Download APK versi terbaru (`>= 0.118`) lalu install.
4. Buka Termux, tunggu proses inisialisasi pertama kali selesai.

### 2. Update & Upgrade Repo

```bash
pkg update -y && pkg upgrade -y
```

### 3. Install Git

```bash
pkg install git -y
```

Verifikasi:

```bash
git --version
```

### 4. Install Node.js (LTS)

Termux sudah menyediakan package `nodejs` (build resmi, bukan dari nvm):

```bash
pkg install nodejs -y
```

Verifikasi versi (pastikan **>= 18**):

```bash
node --version
npm --version
```

> Jika versi Node.js < 18, install manual via `nvm`:
>
> ```bash
> pkg install curl -y
> curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
> source ~/.bashrc
> nvm install --lts
> nvm use --lts
> ```

### 5. Install Dependency Pendukung (opsional tapi disarankan)

```bash
pkg install python make clang libffi openssl -y
```

> Diperlukan untuk native module seperti `jimp`, `canvas`, dan `file-type` saat build.

### 6. Izinkan Akses Storage (untuk baca/tulis file)

```bash
termux-setup-storage
```

Akan muncul popup Android — izinkan akses storage.

### 7. Clone Repository

```bash
cd ~
git clone https://github.com/SyaPratama/Whatsapp_BOT.git
cd Whatsapp_BOT
```

### 8. Install Dependency NPM

```bash
npm install
```

> **Tips**: jika `npm install` gagal di module tertentu (umumnya `jimp` atau `canvas`), jalankan:
>
> ```bash
> pkg install python make clang libffi openssl -y
> npm config set python $(which python)
> npm install --build-from-source
> ```

### 9. (Opsional) Edit Konfigurasi

```bash
nano config.js
```

> Simpan: `Ctrl+O` → `Enter` → keluar: `Ctrl+X`.

### 10. Jalankan Bot

```bash
npm start
```

Bot akan meminta nomor WhatsApp untuk pairing. Masukkan nomor, lalu masukkan **pairing code** di WhatsApp HP kamu (Linked Devices → Link with phone number).

### 11. Jalankan di Background (agar tidak mati saat Termux ditutup)

Gunakan [`tmux`](https://github.com/tmux/tmux) (disarankan) atau `nohup`:

**Cara 1 — tmux (disarankan):**

```bash
pkg install tmux -y

tmux new -s botwa
npm start
```

> Keluar dari session tanpa mematikan bot: `Ctrl+B` lalu tekan `D`.
> Kembali ke session: `tmux attach -t botwa`.

**Cara 2 — nohup:**

```bash
nohup npm start > bot.log 2>&1 &
```

> Lihat log: `tail -f bot.log`.
> Hentikan bot: `pkill -f "node main.js"`.

### 12. Mencegah Termux Mati Otomatis

- Buka **Settings Android** → **Apps** → **Termux** → **Battery** → set ke **Unrestricted**.
- Di Termux, jalankan:
  ```bash
  termux-wake-lock
  ```
- Atau gunakan plugin **Termux:Boot** + **Termux:Tasker** agar bot auto-start saat HP nyala.

### Catatan Penting Termux

- Jangan **swipe-kill** Termux dari recent apps (bot akan mati).
- Hindari **battery saver mode** — Android akan membunuh proses background.
- Jika sering dapat **"session not found"**, hapus `session/creds.json` lalu pairing ulang.

---

## Konfigurasi

Semua konfigurasi global ada di [config.js](config.js). Edit sebelum menjalankan bot.

### Identitas & Owner

```js
global.owner       = ['6285591386135']   // Nomor owner (format 62xxx)
global.namaown     = 'Tama'              // Nama owner
global.prefa       = ['', '!', '.', ','] // Prefix perintah (kosong = tanpa prefix)
global.version     = '1.0'               // Versi bot
```

### Pairing

```js
global.usePairingCode   = true           // true = pairing code, false = QR
global.pairingNumber    = ''             // Kosongkan untuk input via CLI
global.pairingPhoneCode = ''             // Custom phone code (opsional)
global.platform         = 'wa_business'  // Fingerprint: wa_business, android, ios, dll
```

### Tampilan

```js
global.thumbnail = 'https://...'         // Thumbnail default
global.thumb     = 'https://...'         // Thumbnail cadangan
global.idch      = '120363...@newsletter' // ID channel untuk broadcast
global.qris      = 'https://...'         // QRIS untuk pembayaran
```

### Welcome / Goodbye

```js
global.welcome = false   // true untuk aktifkan welcome message
global.goodbye = false   // true untuk aktifkan goodbye message
```

### Antilink Regex

```js
global.antilinkRegex = {
  group:    /chat\.whatsapp\.com\/(?:invite|join)/i,
  channel:  /whatsapp\.com\/channel\/[A-Za-z0-9]+/i,
  telegram: /t\.me\/[A-Za-z0-9_]+/i,
  all:      /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+\/[^\s]*/i
}
```

---

## Menjalankan Bot

```bash
npm start
```

Saat pertama kali dijalankan, bot akan meminta **nomor WhatsApp** untuk pairing (jika `pairingNumber` kosong). Masukkan nomor dalam format `08xxx` atau `628xxx`. Setelah itu akan muncul **pairing code** — masukkan kode tersebut di WhatsApp Anda.

**Alur pairing:**

1. Buka WhatsApp di HP
2. Ketuk **⋮** (menu) → **Linked Devices** → **Link a Device**
3. Pilih **Link with phone number**
4. Masukkan pairing code yang muncul di terminal

Sesi tersimpan di folder `session/`. Jalankan ulang bot tanpa perlu pairing ulang.

---

## Autentikasi

Bot mendukung **2 metode autentikasi**:

| Metode        | Default | Cocok untuk                              |
| ------------- | :-----: | ---------------------------------------- |
| Pairing Code  | ✅ Ya   | Server headless, VPS, Termux             |
| QR Code       | ❌ Tidak | Lokal dengan tampilan GUI terminal      |

Untuk menggunakan QR, ubah di `config.js`:

```js
global.usePairingCode = false
```

---

## Struktur Project

```
BotWa/
├── main.js                  # Entry point (pairing, lifecycle, event handler)
├── config.js                # Konfigurasi global
├── package.json
├── session/                 # Sesi & kredensial Baileys (auto-generated)
├── data/
│   ├── owner.json           # Daftar owner
│   ├── sewa.json            # Daftar penyewa bot (per group)
│   └── vip.json             # Daftar pengguna VIP + masa aktif
├── src/
│   ├── pipeline.cjs         # Pipeline pesan (CJS)
│   ├── pipeline.mjs         # Pipeline pesan (ESM)
│   ├── bootstrap/           # Bootstrap runtime
│   ├── config/              # Konfigurasi terstruktur
│   ├── core/                # Socket, auth, TTL cache, outbound queue
│   ├── handlers/            # Event handler (group, system, misc, tools, dll)
│   ├── lib/                 # Library internal
│   ├── plugins/             # Plugin CJS & ESM
│   ├── services/            # Business logic per domain
│   └── utils/               # Helper murni (formatting, backoff, id, dll)
├── tests/                   # Unit test (node:test)
└── resources/               # Aset statis
```

---

## Data & Hak Akses

Bot membaca data dari folder `data/`. Semua file JSON di-load saat bot start.

### `data/owner.json`

```json
{
  "owner": [
    { "nomor": "6287796752356", "nama": "Zoee" },
    { "nomor": "6285591386135", "nama": "Tama" }
  ]
}
```

> `global.owner` di `config.js` di-override oleh file ini saat bot boot.

### `data/vip.json`

```json
{
  "6285591386135@s.whatsapp.net": {
    "added":   "2026-07-12T11:48:03.148Z",
    "expired": "2027-01-08T11:48:03.148Z",
    "days": 180
  }
}
```

### `data/sewa.json`

Daftar group yang menyewa bot dan masa aktif sewanya (format sama dengan `vip.json`).

---

## Anti-Banned Checklist

Bot ini sudah mengikuti praktik anti-banned yang direkomendasikan Baileys:

- ✅ `markOnlineOnConnect: false`
- ✅ `syncFullHistory: false`
- ✅ `generateHighQualityLinkPreview: false`
- ✅ `retryRequestDelayMs: 350`
- ✅ **Outbound queue**: min 1.5s/JID + max 30 pesan/menit global
- ✅ Browser fingerprint Android (`wa_business`) — **jangan pakai Windows fingerprint** untuk jangka panjang
- ✅ `msgRetryCounterCache` long-lived (TTL 1 jam, tidak di-reset saat reconnect)
- ✅ `cachedGroupMetadata` TTL 5 menit, max 200 keys

### Variabel Environment

| Var                 | Default  | Fungsi                              |
| ------------------- | -------- | ----------------------------------- |
| `BAILEYS_LOG_LEVEL` | `silent` | Level logger pino                   |
| `BAILEYS_USE_PINO`  | `true`   | `false` untuk pakai no-op logger    |

---

## Troubleshooting

### ❌ "Pairing code tidak muncul"

- Pastikan `global.usePairingCode = true`
- Cek apakah `pairingNumber` di `config.js` valid (format `628xxx`)
- Hapus `session/creds.json` lalu jalankan ulang

### ❌ "Status 401 — Logged Out"

Sesi sudah logout dari WhatsApp. Hapus `session/creds.json` dan pairing ulang.

### ❌ "Status 440 — Connection Replaced"

Device lain login dengan akun yang sama. Hentikan bot lain / logout dari device lain.

### ❌ "No session found to decrypt message"

- Signal key-store belum tersinkron. Tunggu beberapa menit lalu coba lagi.
- Pastikan tidak ada **2 proses** yang memakai folder `session/` yang sama secara bersamaan.

### ❌ Bot disconnect terus-menerus

- Cek apakah `pairingNumber` masih aktif
- Perbarui Baileys: `npm update @whiskeysockets/baileys`
- Pastikan waktu sistem server akurat (selisih waktu bisa bikin handshake gagal)

### ❌ Decrypt error / pesan tidak masuk

- Jangan restart bot terlalu sering. Tunggu minimal 30 detik antar restart.
- Pastikan tidak ada proses bot duplikat yang berjalan.

---

## Scripts

```bash
npm start        # Jalankan bot
npm run dev      # Alias untuk npm start
npm test         # Jalankan unit test (node:test)
```

---

## Testing

Project ini menggunakan **`node:test`** (built-in Node.js) + `node:assert` — tanpa dependency tambahan.

```bash
npm test
```

Test mencakup happy-path, edge case, dan failure path untuk modul-modul kritis di `src/utils/`, `src/cache/`, dan `src/queue/`.

---

## Kontribusi

Pull request dan issue sangat diterima. Untuk perubahan besar, mohon buka issue terlebih dahulu untuk diskusi.

---

## Lisensi

MIT © [Rasya Putra Pratama](https://github.com/SyaPratama)

---

## Disclaimer

Project ini **bukan** produk resmi WhatsApp/Meta. Penggunaan library Baileys yang melanggar WhatsApp Terms of Service (spam, blast, stalkerware, dll) **bukan tanggung jawab author**.
```