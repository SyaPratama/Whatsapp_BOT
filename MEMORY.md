# Memory — Baileys Documentation

Catatan penting sebelum mengubah kode terkait koneksi WhatsApp.

## Sumber otoritatif

- WhiskeySockets/Baileys (canonical, actively maintained):
  - Repo: https://github.com/WhiskeySockets/Baileys
  - README: https://github.com/WhiskeySockets/Baileys/blob/main/README.md
  - API reference (generated from source): https://whiskeysockets.github.io/Baileys/
  - Pairing code docs: https://github.com/WhiskeySockets/Baileys/blob/main/README.md#pairing-code

- Socketon (fork yang dipakai repo ini, npm alias `npm:socketon@latest`):
  - Paket ini adalah fork dari Baileys. API surface sebagian besar identik dengan WhiskeySockets/Baileys.
  - Cek `node_modules/@whiskeysockets/baileys/lib/Socket/socket.js` untuk signature aktual `requestPairingCode` dan event handler.

## Pola yang dipakai repo ini (WAJIB dijaga)

1. **Auth via pairing code (default)** — lihat `global.usePairingCode` di [config.js](config.js). Memanggil `sock.requestPairingCode(pairingNumber)` saat `connection === 'connecting'`.
2. **Tidak memakai `useMultiFileAuthState` untuk production** (Baileys docs: hanya untuk dev). Untuk prod, ganti dengan DB-backed auth state. Di repo ini, `useMultiFileAuthState('./session')` dipakai sesuai struktur Blueprint project.
3. **Signal key-store** HARUS lewat `makeCacheableSignalKeyStore(state.keys, logger)`.
4. **msgRetryCounterCache** long-lived (TTL 1 jam) untuk mencegah decrypt-retry loops.
5. **cachedGroupMetadata** TTL 5 menit, maxKeys 200, dibungkus [src/core/ttl-cache.cjs](src/core/ttl-cache.cjs).
6. **Outbound queue** dengan min delay 1.5s/JID + max 30 msg/menit global — [src/core/outbound-queue.cjs](src/core/outbound-queue.cjs).
7. **Reconnect** exponential backoff 5/10/20/40/60s, max 5 attempt; unrecoverable reasons: `loggedOut` dan `badSession`.
8. **Logger** opsional pino. Jika `pino` terinstal dan `BAILEYS_USE_PINO !== 'false'`, logger pino dipakai. Selalu `redact` untuk `auth.creds`, `creds`, `keys`, `creds.pairingCode`.

## Anti-banned checklist (Code Standards, Baileys docs)

- `markOnlineOnConnect: false`
- `syncFullHistory: false`
- `generateHighQualityLinkPreview: false`
- `retryRequestDelayMs: 350` (built-in backoff)
- Browser fingerprint: Android/iOS/Linux/macOS sesuai [config.js](config.js) `global.platform`. **Jangan pakai Windows** untuk jangka panjang.
- Outbound: 1.5s/JID + 30 msg/menit global.

## Variabel environment

| Var | Default | Fungsi |
| --- | --- | --- |
| `BAILEYS_LOG_LEVEL` | `silent` | Level logger pino |
| `BAILEYS_USE_PINO` | `true` | `false` untuk force no-op logger |

## Catatan migrasi dari v6 ke v7

- `usePairingCode` v6 → `sock.requestPairingCode(phoneNumber)` di v7+
- `useMultiFileAuthState` masih dipakai, tapi Baileys docs menyarankan custom DB-backed state untuk production
- `Browsers.ubuntu('Chrome')` (v6) → `Browsers('Chrome')` (v7+, function-based) — repo ini sudah pakai signature v7