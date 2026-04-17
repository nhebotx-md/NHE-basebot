# NHE BaseBot - Clean Architecture Rebuild

Base WhatsApp Bot dengan struktur modular dan clean architecture.

## 📁 Struktur Folder

```
basebot-rebuild/
├── main.js                    # Entry point utama
├── package.json               # Dependencies dan metadata
├── README.md                  # Dokumentasi
│
├── src/                       # Source code utama
│   ├── core/                  # Core modules
│   │   └── WhosTANG.js        # Main command handler
│   │
│   ├── config/                # Konfigurasi
│   │   └── config.js          # Global config & variables
│   │
│   ├── handler/               # Event handlers
│   │   ├── MessageHandler.js  # messages.upsert handler
│   │   ├── ConnectionHandler.js # connection.update handler
│   │   └── GroupHandler.js    # group-participants handler
│   │
│   ├── command/               # Command handlers
│   │   ├── handler.js         # CJS plugin loader
│   │   └── handle.mjs         # ESM plugin loader
│   │
│   ├── lib/                   # Library modules
│   │   ├── participants.js    # Group participants manager
│   │   ├── exif.js            # Sticker processing
│   │   ├── uploader.js        # File upload utilities
│   │   ├── savetube.js        # YouTube downloader
│   │   ├── replyMode.js       # Reply mode manager
│   │   ├── replyAdaptive.js   # Adaptive reply handler
│   │   ├── buttonHelper.js    # Button helper
│   │   ├── system.js          # Case management
│   │   └── myfunction.js      # Utility functions
│   │
│   └── utils/                 # Utilities
│       └── message.js         # Message serialization
│
├── data/                      # Data files
│   ├── owner.json             # Owner list
│   ├── premium.json           # Premium users
│   └── replyMode.json         # User reply mode preferences
│
├── Plugins-CJS/               # CJS plugins
│   └── plugin.js              # Example CJS plugin
│
├── Plugins-ESM/               # ESM plugins
│   └── plugin.mjs             # Example ESM plugin
│
├── Tang/image/                # Assets folder
└── session/                   # Auth session folder
```

## 🚀 Instalasi

```bash
# Clone repository
git clone https://github.com/nhebotx-md/basebot.git

# Masuk folder
cd basebot

# Install dependencies
npm install

# Jalankan bot
npm start
```

## 📖 Fitur

### Commands
- **Menu**: `.menu` - Menampilkan menu utama
- **Owner**: `.owner` - Menampilkan kontak owner
- **Ping**: `.ping` - Test kecepatan bot
- **Runtime**: `.runtime` - Uptime bot
- **Total Fitur**: `.totalfitur` - Jumlah total fitur

### Reply Mode
- `.replymode button` - Set mode tombol interaktif
- `.replymode text` - Set mode text biasa
- `.checkmode` - Cek mode reply saat ini

### Group Commands
- `.promote @user` - Promote member jadi admin
- `.demote @user` - Demote admin
- `.open` - Buka group
- `.close` - Tutup group
- `.tagall [pesan]` - Tag semua member
- `.hidetag [pesan]` - Hidetag semua member
- `.kick @user` - Kick member
- `.linkgc` - Get group link
- `.resetlinkgc` - Reset group link

### Download Commands
- `.ytmp3 <url>` - Download audio YouTube
- `.ytmp4 <url>` - Download video YouTube
- `.tiktok <url>` - Download TikTok
- `.instagram <url>` - Download Instagram
- `.facebook <url>` - Download Facebook
- `.aio <url>` - All-in-one downloader

### Tools Commands
- `.tourl` - Upload media ke URL
- `.remini` - Enhance image quality
- `.case2plugin` - Convert case ke plugin
- `.cjs2esm` - Convert CJS ke ESM
- `.esm2cjs` - Convert ESM ke CJS

### Owner Commands
- `.self` - Mode self (owner only)
- `.public` - Mode public
- `.welcome on/off` - Toggle welcome
- `.goodbye on/off` - Toggle goodbye
- `.addowner <nomor>` - Tambah owner
- `.delowner <nomor>` - Hapus owner
- `.addcase <code>` - Tambah case
- `.delcase <nama>` - Hapus case
- `.listcase` - List semua case
- `.getcase <nama>` - Get case code
- `.addplugin <code>` - Tambah plugin
- `.delplugin <nama>` - Hapus plugin
- `.listplugin` - List plugins
- `.getplugin <nama>` - Get plugin code

### Eval Commands (Owner Only)
- `=> <code>` - Eval async expression
- `> <code>` - Eval sync expression
- `$ <command>` - Execute shell command

## 🔧 Konfigurasi

Edit file `src/config/config.js` untuk mengubah:
- Owner number
- Bot name
- Prefix
- Welcome/goodbye settings
- Thumbnail URL

## 📝 Membuat Plugin

### Plugin CJS
```javascript
const handler = async (m, Obj) => {
    const { text, reply } = Obj;
    await reply(`Hello ${text}!`);
};

handler.command = ["hello", "hi"];
handler.tags = ["fun"];
handler.help = ["hello"];

module.exports = handler;
```

### Plugin ESM
```javascript
const handler = async (m, Obj) => {
    const { text, reply } = Obj;
    await reply(`Hello ${text}!`);
};

handler.command = ["hello", "hi"];
handler.tags = ["fun"];
handler.help = ["hello"];

export default handler;
```

## 📋 Mapping File Original → Rebuild

| Original | Rebuild |
|----------|---------|
| `main.js` | `main.js` (refactored) |
| `WhosTANG.js` | `src/core/WhosTANG.js` (refactored) |
| `config.js` | `src/config/config.js` |
| `Library/handler.js` | `src/command/handler.js` |
| `Library/handle.mjs` | `src/command/handle.mjs` |
| `Library/participants.js` | `src/lib/participants.js` |
| `Library/exif.js` | `src/lib/exif.js` |
| `Library/uploader.js` | `src/lib/uploader.js` |
| `Library/savetube.js` | `src/lib/savetube.js` |
| `Library/replyMode.js` | `src/lib/replyMode.js` |
| `Library/replyAdaptive.js` | `src/lib/replyAdaptive.js` |
| `Library/buttonHelper.js` | `src/lib/buttonHelper.js` |
| `Library/system.js` | `src/lib/system.js` |
| `Library/myfunction.js` | `src/lib/myfunction.js` |
| `System/message.js` | `src/utils/message.js` |
| `Plugins-CJS/plugin.js` | `Plugins-CJS/plugin.js` (updated) |
| `Plugins-ESM/` | `Plugins-ESM/plugin.mjs` (new) |

## 📄 Lisensi

MIT License
