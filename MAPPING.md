# 📋 Mapping Dokumentasi - Original → Rebuild

Dokumentasi lengkap pemetaan file dan perubahan dari repository original ke versi rebuild.

## 📁 Struktur Folder Perbandingan

### Original Structure
```
basebot/
├── main.js                    # Entry point (monolithic)
├── WhosTANG.js                # Main handler (1900+ lines)
├── config.js                  # Global config
├── package.json               # Dependencies
│
├── Library/                   # Library folder
│   ├── handler.js             # Plugin loader
│   ├── handle.mjs             # ESM plugin loader
│   ├── participants.js        # Group participants
│   ├── exif.js                # Sticker processing
│   ├── uploader.js            # File uploader
│   ├── savetube.js            # YouTube downloader
│   ├── replyMode.js           # Reply mode manager
│   ├── replyAdaptive.js       # Adaptive reply
│   ├── buttonHelper.js        # Button helper
│   ├── system.js              # Case management
│   └── myfunction.js          # Utility functions
│
├── System/                    # System folder
│   └── message.js             # Message serialization
│
├── Plugins-CJS/               # CJS plugins
│   └── plugin.js              # Example plugin
│
├── Plugins-ESM/               # ESM plugins (empty)
│
├── data/                      # Data folder
│   ├── owner.json             # Owner list
│   └── premium.json           # Premium users
│
└── Tang/image/                # Assets folder
```

### Rebuild Structure
```
basebot-rebuild/
├── main.js                    # Entry point (refactored)
├── package.json               # Updated dependencies
├── README.md                  # Documentation
│
├── src/                       # Source code
│   ├── core/                  # Core modules
│   │   ├── WhosTANG.js        # Main handler (refactored)
│   │   └── ConnectionHandler.js # Connection handler
│   │
│   ├── config/                # Configuration
│   │   └── config.js          # Global config (refactored)
│   │
│   ├── handler/               # Event handlers
│   │   ├── MessageHandler.js  # Message handler
│   │   ├── ConnectionHandler.js # Connection handler
│   │   └── GroupHandler.js    # Group handler
│   │
│   ├── command/               # Command handlers
│   │   ├── handler.js         # CJS plugin loader
│   │   └── handle.mjs         # ESM plugin loader
│   │
│   ├── lib/                   # Libraries
│   │   ├── participants.js    # Group participants
│   │   ├── exif.js            # Sticker processing
│   │   ├── uploader.js        # File uploader
│   │   ├── savetube.js        # YouTube downloader
│   │   ├── replyMode.js       # Reply mode manager
│   │   ├── replyAdaptive.js   # Adaptive reply
│   │   ├── buttonHelper.js    # Button helper
│   │   ├── system.js          # Case management
│   │   └── myfunction.js      # Utility functions
│   │
│   ├── utils/                 # Utilities
│   │   └── message.js         # Message serialization
│   │
│   └── event/                 # Event system
│       └── EventEmitter.js    # Event emitter
│
├── Plugins-CJS/               # CJS plugins
│   └── plugin.js              # Updated example
│
├── Plugins-ESM/               # ESM plugins
│   └── plugin.mjs             # New example
│
├── data/                      # Data folder
│   ├── owner.json             # Owner list
│   ├── premium.json           # Premium users
│   └── replyMode.json         # Reply mode data
│
└── Tang/image/                # Assets folder
```

## 📄 File Mapping Detail

### 1. Entry Point
| Original | Rebuild | Perubahan |
|----------|---------|-----------|
| `main.js` | `main.js` | ✅ Refactored dengan clean architecture |

**Perubahan:**
- Pisahkan event handlers ke folder `src/handler/`
- Pisahkan connection logic ke `src/core/ConnectionHandler.js`
- Tambahkan proper error handling
- Tambahkan file watcher untuk auto-reload

### 2. Main Handler
| Original | Rebuild | Perubahan |
|----------|---------|-----------|
| `WhosTANG.js` | `src/core/WhosTANG.js` | ✅ Refactored |

**Perubahan:**
- Struktur lebih modular
- Pisahkan case handlers dengan komentar section
- Tambahkan dokumentasi inline
- Pisahkan utilities ke `src/lib/myfunction.js`

### 3. Configuration
| Original | Rebuild | Perubahan |
|----------|---------|-----------|
| `config.js` | `src/config/config.js` | ✅ Refactored |

**Perubahan:**
- Struktur lebih terorganisir
- Tambahkan section comments
- Tambahkan export module

### 4. Plugin Loaders
| Original | Rebuild | Perubahan |
|----------|---------|-----------|
| `Library/handler.js` | `src/command/handler.js` | ✅ Refactored |
| `Library/handle.mjs` | `src/command/handle.mjs` | ✅ Refactored |

**Perubahan:**
- Pisahkan ke folder `src/command/`
- Tambahkan proper error handling
- Update untuk integrasi dengan reply mode

### 5. Event Handlers
| Original | Rebuild | Perubahan |
|----------|---------|-----------|
| (inline in main.js) | `src/handler/MessageHandler.js` | ✅ New file |
| (inline in main.js) | `src/handler/ConnectionHandler.js` | ✅ New file |
| `Library/participants.js` | `src/handler/GroupHandler.js` | ✅ Refactored |

**Perubahan:**
- Pisahkan event handlers dari main.js
- Struktur lebih modular
- Lebih mudah untuk maintenance

### 6. Libraries
| Original | Rebuild | Perubahan |
|----------|---------|-----------|
| `Library/participants.js` | `src/lib/participants.js` | ✅ Refactored |
| `Library/exif.js` | `src/lib/exif.js` | ✅ Refactored |
| `Library/uploader.js` | `src/lib/uploader.js` | ✅ Refactored |
| `Library/savetube.js` | `src/lib/savetube.js` | ✅ Refactored |
| `Library/replyMode.js` | `src/lib/replyMode.js` | ✅ Refactored |
| `Library/replyAdaptive.js` | `src/lib/replyAdaptive.js` | ✅ Refactored |
| `Library/buttonHelper.js` | `src/lib/buttonHelper.js` | ✅ Refactored |
| `Library/system.js` | `src/lib/system.js` | ✅ Refactored |
| `Library/myfunction.js` | `src/lib/myfunction.js` | ✅ Refactored |

**Perubahan:**
- Semua library dipindahkan ke `src/lib/`
- Tambahkan dokumentasi inline
- Struktur lebih terorganisir

### 7. Utilities
| Original | Rebuild | Perubahan |
|----------|---------|-----------|
| `System/message.js` | `src/utils/message.js` | ✅ Refactored |

**Perubahan:**
- Dipindahkan ke folder `src/utils/`
- Tambahkan dokumentasi inline

### 8. Plugins
| Original | Rebuild | Perubahan |
|----------|---------|-----------|
| `Plugins-CJS/plugin.js` | `Plugins-CJS/plugin.js` | ✅ Updated |
| (none) | `Plugins-ESM/plugin.mjs` | ✅ New file |

**Perubahan:**
- Update plugin example dengan struktur yang lebih baik
- Tambahkan ESM plugin example

### 9. Data Files
| Original | Rebuild | Perubahan |
|----------|---------|-----------|
| `data/owner.json` | `data/owner.json` | ✅ Same |
| `data/premium.json` | `data/premium.json` | ✅ Same |
| (none) | `data/replyMode.json` | ✅ New file |

**Perubahan:**
- Tambahkan `replyMode.json` untuk menyimpan preferensi reply mode user

## 🔄 Perubahan Logika

### 1. Reply Mode System
**Original:** Tidak ada sistem reply mode terpisah

**Rebuild:**
- Sistem reply mode terpisah di `src/lib/replyMode.js`
- User bisa memilih mode: button atau text
- Data disimpan di `data/replyMode.json`
- Adaptive reply handler di `src/lib/replyAdaptive.js`

### 2. Event Handling
**Original:** Semua event handlers inline di `main.js`

**Rebuild:**
- `MessageHandler.js` - Handle `messages.upsert`
- `ConnectionHandler.js` - Handle `connection.update`
- `GroupHandler.js` - Handle `group-participants.update`

### 3. Plugin System
**Original:** CJS dan ESM plugin loaders di folder `Library/`

**Rebuild:**
- `src/command/handler.js` - CJS plugin loader
- `src/command/handle.mjs` - ESM plugin loader
- Lebih terorganisir dan mudah maintenance

### 4. Configuration
**Original:** Config di root folder

**Rebuild:**
- Config dipindahkan ke `src/config/`
- Struktur lebih modular

## 📊 Ringkasan Perubahan

### File Baru
1. `src/handler/MessageHandler.js`
2. `src/handler/ConnectionHandler.js`
3. `src/handler/GroupHandler.js`
4. `src/core/ConnectionHandler.js`
5. `src/event/EventEmitter.js`
6. `Plugins-ESM/plugin.mjs`
7. `data/replyMode.json`
8. `README.md`
9. `MAPPING.md`

### File Refactored
1. `main.js`
2. `src/core/WhosTANG.js`
3. `src/config/config.js`
4. `src/command/handler.js`
5. `src/command/handle.mjs`
6. `src/lib/participants.js`
7. `src/lib/exif.js`
8. `src/lib/uploader.js`
9. `src/lib/savetube.js`
10. `src/lib/replyMode.js`
11. `src/lib/replyAdaptive.js`
12. `src/lib/buttonHelper.js`
13. `src/lib/system.js`
14. `src/lib/myfunction.js`
15. `src/utils/message.js`
16. `Plugins-CJS/plugin.js`
17. `package.json`

### File Tidak Berubah
1. `data/owner.json`
2. `data/premium.json`

## ✅ Keuntungan Rebuild

1. **Clean Architecture** - Struktur folder lebih terorganisir
2. **Modular** - Setiap module punya tanggung jawab sendiri
3. **Maintainable** - Lebih mudah untuk maintenance dan update
4. **Scalable** - Mudah untuk menambahkan fitur baru
5. **Documented** - Setiap file punya dokumentasi inline
6. **Reply Mode System** - User bisa memilih mode reply
7. **Event Handling** - Event handlers terpisah dan terorganisir

## 📝 Catatan

- Semua logika original **100% dipertahankan**
- Tidak ada fitur yang dihapus
- Hanya struktur folder dan organisasi kode yang diubah
- Semua dependencies sama dengan original
