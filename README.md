# NHE BaseBot — WhatsApp Bot Framework

> **Production-Grade WhatsApp Bot Framework** dengan Clean Architecture, Dual Module System (CJS/ESM), Context Injection Middleware, dan Domain-Driven Finance Module.
> 
> Versi: `1.2.0` | Engine: `ShoNhe System` | Node.js: `>=18.0.0`

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NHE BASEBOT ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐     │
│  │   WhatsApp   │────▶│   Baileys    │────▶│   events (messages.upsert)│     │
│  │   Server     │     │   Library    │     │   connection.update       │     │
│  └──────────────┘     └──────────────┘     └──────────────────────────┘     │
│                                                       │                      │
│                                                       ▼                      │
│  ╔═══════════════════════════════════════════════════════════════════════╗   │
│  ║                         MAIN.JS (Entry Point)                        ║   │
│  ║  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  ║   │
│  ║  │  Auth State │  │  WA Socket  │  │  Pairing    │  │  In-Memory │  ║   │
│  ║  │  (session/) │  │  (WhosTANG) │  │  Code       │  │  Store     │  ║   │
│  ║  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  ║   │
│  ╚═══════════════════════════════════════════════════════════════════════╝   │
│                                    │                                         │
│                                    ▼                                         │
│  ╔═══════════════════════════════════════════════════════════════════════╗   │
│  ║                      src/handler/MessageHandler.js                    ║   │
│  ║              Event Router → Middleware → Command Handler              ║   │
│  ╚═══════════════════════════════════════════════════════════════════════╝   │
│                                    │                                         │
│                    ┌───────────────┼───────────────┐                         │
│                    ▼               ▼               ▼                         │
│  ┌─────────────────────┐ ┌─────────────────┐ ┌──────────────────┐           │
│  │  src/middleware/    │ │  src/core/      │ │  src/command/    │           │
│  │  userMiddleware.js  │ │  WhosTANG.js    │ │  handler.js      │           │
│  │  (Context Builder)  │ │  (Router+Cases) │ │  (Plugin Loader) │           │
│  └─────────────────────┘ └─────────────────┘ └──────────────────┘           │
│           │                      │                      │                    │
│           ▼                      ▼                      ▼                    │
│  ┌─────────────────────┐ ┌─────────────────┐ ┌──────────────────┐           │
│  │  ctx injection      │ │  Built-in Cases │ │  Plugins-CJS/    │           │
│  │  (isOwner, level,   │ │  (menu, ping,   │ │  Plugins-ESM/    │           │
│  │   xp, role, wallet) │ │  profile, etc)  │ │  External Plugins│           │
│  └─────────────────────┘ └─────────────────┘ └──────────────────┘           │
│           │                      │                      │                    │
│           └───────────────┬──────┘                      │                    │
│                           ▼                             │                    │
│  ╔═══════════════════════════════════════════════════════════════════════╗   │
│  ║                       src/core/ReplyEngine.js                        ║   │
│  ║   send() │ sendHybrid() │ sendListUI() │ sendFlow() │ buildContext  ║   │
│  ╚═══════════════════════════════════════════════════════════════════════╝   │
│                                    │                                         │
│                                    ▼                                         │
│  ╔═══════════════════════════════════════════════════════════════════════╗   │
│  ║                    src/domain/finance/ (MongoDB)                     ║   │
│  ║   engine.js → wallet.js → ledger.js → analytics.js → budget.js      ║   │
│  ╚═══════════════════════════════════════════════════════════════════════╝   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    src/models/ (Mongoose ODM)                       │    │
│  │         FinanceUser.js              FinanceLedger.js              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Layer Separation

| Layer | Path | Responsibility |
|-------|------|---------------|
| **Entry Point** | `main.js` | Socket creation, auth, event binding |
| **Handler** | `src/handler/` | Event routing, message serialization |
| **Middleware** | `src/middleware/` | Context injection, auth gate, leveling |
| **Core** | `src/core/` | Command router, reply engine, connection mgmt |
| **Command** | `src/command/` | Plugin loader (CJS/ESM dual system) |
| **Domain** | `src/domain/` | Business logic isolation (finance, etc) |
| **Database** | `src/models/` | Mongoose schemas & persistence |
| **Plugin** | `Plugins-CJS/`, `Plugins-ESM/` | User-defined command extensions |

---

## 2. Folder Structure (Detailed)

```
NHE-basebot/
│
├── main.js                          # Entry point — WA socket init, event binding
├── package.json                     # Dependencies & metadata
├── .gitignore
├── .env                             # MONGODB_URI, environment variables
│
├── session/                         # Baileys auth state (multi-file)
├── data/                            # JSON data files
│   ├── owner.json                   # Owner list
│   ├── premium.json                 # Premium users
│   └── replyMode.json               # User reply mode preferences
│
├── Plugins-CJS/                     # CommonJS plugins (.js)
│   ├── plugin.js                    # Base plugin template
│   ├── menu-plugin.js               # Menu command
│   ├── fin-balance.js               # Finance: balance check
│   ├── fin-add.js                   # Finance: add transaction
│   ├── games-plugin.js              # Game commands
│   └── ...                          # (30+ plugin files)
│
├── Plugins-ESM/                     # ESM plugins (.mjs)
│   └── plugin.mjs                   # ESM plugin template
│
├── Tang/image/                      # Static assets
│
└── src/
    ├── config/
    │   └── config.js                # Global config, owner, prefix, thumb
    │
    ├── core/
    │   ├── WhosTANG.js              # Main command handler (router + cases)
    │   ├── ReplyEngine.js           # Reply abstraction (button/text/hybrid)
    │   └── ConnectionHandler.js     # Connection state handler
    │
    ├── handler/
    │   ├── MessageHandler.js        # messages.upsert → middleware → router
    │   ├── ConnectionHandler.js     # connection.update handler
    │   └── GroupHandler.js          # group-participants handler
    │
    ├── command/
    │   ├── handler.js               # CJS plugin loader + hot-reload
    │   └── handle.mjs               # ESM plugin loader
    │
    ├── middleware/
    │   ├── userMiddleware.js        # Global middleware orchestrator
    │   ├── contextBuilder.js        # Context object (ctx) builder
    │   ├── registerGate.js          # Registration gate (anti-spam)
    │   ├── levelSystem.js           # XP & level calculation
    │   ├── roleResolver.js          # Role resolution (owner/premium/admin)
    │   └── databaseSync.js          # DB persistence sync
    │
    ├── domain/
    │   └── finance/
    │       ├── index.js             # Facade — unified finance API
    │       ├── engine.js            # Core: ensureUser, addTransaction, getBalance
    │       ├── ledger.js            # Query: getUserTransactions, validateEntry
    │       ├── wallet.js            # Calculation: calculateBalance, getNetFlow
    │       ├── analytics.js         # Analytics & reporting
    │       ├── budget.js            # Budget management
    │       ├── events.js            # Finance events
    │       └── goals.js             # Financial goals
    │
    ├── models/
    │   ├── FinanceUser.js           # Mongoose: User schema
    │   └── FinanceLedger.js         # Mongoose: Transaction ledger schema
    │
    ├── lib/
    │   ├── buttonHelper.js          # Button message builder
    │   ├── replyMode.js             # Reply mode (button/text) manager
    │   ├── replyAdaptive.js         # Adaptive reply selector
    │   ├── participants.js          # Group participants manager
    │   ├── uploader.js              # File upload utilities
    │   ├── savetube.js              # YouTube downloader
    │   ├── system.js                # Case management
    │   ├── fakequoted.js            # Fake quoted reply
    │   ├── exif.js                  # Sticker EXIF processing
    │   └── myfunction.js            # Utility functions
    │
    └── utils/
        └── message.js              # Message serialization (smsg)
```

---

## 3. Core System Explanation

### 3.1 Entry Point (`main.js`)

```javascript
// Execution flow pada startup:
// 1. Load config → require('./src/config/config')
// 2. Load .env → process.env.MONGODB_URI
// 3. Init finance domain → require('./src/domain/finance').initialize()
// 4. Create auth state → useMultiFileAuthState("./session")
// 5. Create socket → makeWASocket({ ...config })
// 6. Bind store → makeInMemoryStore().bind(WhosTANG.ev)
// 7. Register handlers:
//    - ConnectionHandler → connection.update
//    - MessageHandler → messages.upsert
//    - GroupHandler → group-participants.update
//    - CallHandler → call events
```

Socket instance (`WhosTANG`) di-inject dengan utility methods:
- `sendMessage(jid, content, options)` — Kirim pesan
- `decodeJid(jid)` — Decode WhatsApp JID
- `downloadAndSaveMediaMessage(msg)` — Download media
- `public` — Mode public/private

### 3.2 WhosTANG — Message Router & Command Handler

File `src/core/WhosTANG.js` (3229 LOC) adalah **jantung sistem** yang menangani:

**A. Command Parsing**
```javascript
// Alur ekstraksi command:
const prefixRegex = new RegExp(`^[${global.prefa.join('')}]`, 'i');
const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : '';
const isCmd = body?.startsWith(prefix);
const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
const args = (body || '').trim().split(/ +/).slice(1);
const text = args.join(" ");
```

**B. Permission Resolution**
```javascript
const isOwner = [botNumber, ...kontributor, ...global.owner].includes(m.sender);
const isPremium = premium.includes(m.sender);
const isAdmins = groupAdmins.includes(m.sender);
const isBotAdmins = groupAdmins.includes(botNumber);
```

**C. Switch-Case Routing**
```javascript
switch(command) {
  case "menu":    // Menu display dengan ReplyEngine
  case "profile": // Profile dengan ctx injection
  case "ping":    // Latency check
  // ... 30+ built-in cases
  default:
    // Fallback ke plugin system (CJS/ESM)
    await loadPlugins(WhosTANG, m, { ...context });
}
```

**D. ESM-to-CJS Converter**
```javascript
// Dual module support — mengkonversi ESM syntax ke CJS saat runtime
function convertEsmToCjs(code) {
  // Convert: import x from 'y' → const x = require('y')
  // Convert: export default → module.exports
  // Convert: export const → exports.x = x
  // Fallback ke @babel/plugin-transform-modules-commonjs
}
```

### 3.3 ReplyEngine — Abstraction Layer

```javascript
const engine = createReplyEngine(conn, global);

// 4 mode pengiriman:
await engine.send(m, { text, ctx });           // Context-aware text
await engine.sendHybrid(m, { text, buttons });  // Button + text
await engine.sendListUI(m, { title, rows });    // List menu
await engine.sendFlow(m, { steps });            // Multi-step flow
```

---

## 4. Plugin System Standard

### 4.1 Format Plugin CJS (Wajib)

```javascript
/**
 * =========================================
 * Plugin CJS — Struktur Wajib
 * =========================================
 */
const handler = async (m, Obj) => {
  // Destructure utilities dari Obj (dependency injection)
  const { text, args, reply, conn, createReplyEngine, global, ctx } = Obj;
  
  // Validasi engine
  if (!createReplyEngine) throw new Error('createReplyEngine required');
  const engine = createReplyEngine(conn, global);
  
  // Akses context (injected dari middleware)
  const userLevel = ctx?.level || 1;
  const isOwner = ctx?.isOwner || false;
  
  // Logika plugin
  // ...
  
  // Kirim reply menggunakan engine
  await engine.send(m, { 
    text: 'Hello World',
    ctx: { name: m.pushName, number: m.sender.split('@')[0] }
  });
};

// Metadata (WAJIB)
handler.help = ['hello <nama>'];
handler.tags = ['fun'];
handler.command = ['hello', 'hi'];
handler.customPrefix = /^(hello|hi)$/i;  // Optional: regex prefix
handler.owner = false;   // Hanya owner?
handler.premium = false; // Hanya premium?
handler.group = false;   // Hanya di group?
handler.private = false; // Hanya di private?
handler.admin = false;   // Hanya admin group?
handler.botAdmin = false;// Bot harus admin?

module.exports = handler;
```

### 4.2 Format Plugin ESM

```javascript
/**
 * =========================================
 * Plugin ESM — Auto-convert ke CJS saat runtime
 * =========================================
 */
export default async (m, Obj) => {
  const { reply, conn, ctx } = Obj;
  // ... sama seperti CJS
};

export const help = ['hello <nama>'];
export const tags = ['fun'];
export const command = ['hello'];
```

### 4.3 Aturan Penulisan Plugin

| Aturan | Deskripsi | Severity |
|--------|-----------|----------|
| **Jangan akses MongoDB langsung** | Gunakan `src/domain/finance/` API | CRITICAL |
| **Jangan mutasi global.db** | Data user di-manage oleh middleware | CRITICAL |
| **Gunakan `ctx` untuk data user** | `ctx.level`, `ctx.isOwner`, `ctx.xp` | REQUIRED |
| **Gunakan `ReplyEngine` untuk kirim pesan** | Jangan `conn.sendMessage` langsung | RECOMMENDED |
| **Export metadata (help, tags, command)** | Untuk auto-generate menu | REQUIRED |
| **Gunakan try-catch** | Hindari crash plugin | REQUIRED |
| **Validasi input** | Cek `text`, `args`, `quoted` sebelum pakai | REQUIRED |
| **Jangan blocking** | Gunakan `async/await` dengan bijak | RECOMMENDED |

---

## 5. Domain System — Finance Module

### 5.1 Architecture Pattern: Repository → Service → UseCase

```
┌────────────────────────────────────────────────────────────┐
│                     FINANCE DOMAIN                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │  Repository  │───▶│   Service    │───▶│    Facade    │ │
│  │  (Mongoose)  │    │  (Business)  │    │    (API)     │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                   │                   │          │
│  FinanceUser.js      engine.js            index.js        │
│  FinanceLedger.js    wallet.js              │              │
│                      ledger.js              ▼              │
│                      analytics.js      Plugins (via ctx)   │
│                      budget.js                             │
│                      goals.js                              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 5.2 Mongoose Models

**FinanceUser** (`src/models/FinanceUser.js`):
```javascript
{
  userId: String,        // WhatsApp number (ctx.user.number)
  name: String,
  balance: Number,       // Current balance
  createdAt: Date,
  updatedAt: Date
}
```

**FinanceLedger** (`src/models/FinanceLedger.js`):
```javascript
{
  userId: String,        // Reference to FinanceUser
  type: 'income' | 'expense',
  amount: Number,
  category: String,      // 'food', 'transport', 'salary', etc
  description: String,
  date: Date,
  balanceAfter: Number   // Snapshot balance after transaction
}
```

### 5.3 Domain API Usage (Dari Plugin)

```javascript
const handler = async (m, Obj) => {
  const { ctx, reply, conn } = Obj;
  const finance = require('../src/domain/finance');
  
  // 1. Ensure user exists (auto-init)
  await finance.engine.ensureUser(ctx.user.number, ctx.name);
  
  // 2. Add transaction
  await finance.engine.addTransaction(ctx.user.number, {
    type: 'expense',
    amount: 50000,
    category: 'food',
    description: 'Makan siang'
  });
  
  // 3. Get balance
  const balance = await finance.engine.getBalance(ctx.user.number);
  
  // 4. Get transaction history (via ledger)
  const history = await finance.ledger.getUserTransactions(ctx.user.number, { limit: 10 });
  
  // 5. Get wallet summary
  const summary = await finance.wallet.getWalletSummary(ctx.user.number);
  // { totalIncome, totalExpense, netFlow, balance, transactionCount }
};
```

---

## 6. Middleware System — Context Injection

### 6.1 Middleware Chain Flow

```
User Message
    │
    ▼
┌─────────────────────────────────────┐
│  src/handler/MessageHandler.js      │
│  — Deserialize message (smsg)       │
│  — Call userMiddleware()            │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  src/middleware/userMiddleware.js   │
│                                     │
│  1. ensureUserExists(userId)        │
│     └─▶ Cek global.db.users        │
│     └─▶ Buat entry baru jika belum  │
│                                     │
│  2. enforceGate(userId)             │
│     └─▶ Cek sudah register?         │
│     └─▶ Jika belum → BLOCK + kirim  │
│         tombol register (1x)        │
│                                     │
│  3. addXP(userId, XP_PER_COMMAND)   │
│     └─▶ Hitung XP baru              │
│     └─▶ Recalculate level           │
│                                     │
│  4. buildContext({ user, userId })  │
│     └─▶ resolveRoles()              │
│     └─▶ calculateLevel()            │
│     └─▶ Format level progress       │
│                                     │
│  5. Return: { ctx, blocked }        │
└─────────────────────────────────────┘
    │
    ▼ (ctx injected ke WhosTANG + Plugins)
┌─────────────────────────────────────┐
│  Plugin/Case Execution              │
│  — Akses: ctx.isOwner               │
│  — Akses: ctx.level, ctx.xp         │
│  — Akses: ctx.roleDisplay           │
│  — Akses: ctx.user                  │
└─────────────────────────────────────┘
```

### 6.2 Context Object Structure

```javascript
const ctx = {
  // User Identity
  user: { name, number, jid, registeredAt },
  userId: "628123456789@s.whatsapp.net",
  
  // Permission Flags
  isOwner: false,
  isAdmin: false,
  isPremium: false,
  isUser: true,
  
  // Role Display
  role: "user",              // 'owner' | 'premium' | 'user' | 'unregistered'
  roleDisplay: "👤 User",    // Formatted string
  
  // Level System
  level: 5,
  xp: 1250,
  levelProgress: 65,         // Percentage to next level
  nextLevelXP: 200,          // XP needed for next level
  levelUp: false,            // Just leveled up?
  
  // Finance (lazy-loaded)
  // Akses via domain API, bukan langsung dari ctx
};
```

---

## 7. Database Layer

### 7.1 MongoDB + Mongoose Integration

```javascript
// main.js — Inisialisasi pada startup
const { initialize } = require('./src/domain/finance');
initialize(); // Connect ke MongoDB via Mongoose
```

**Environment Variable:**
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/nhebot
```

### 7.2 Data Access Rules

| Layer | Boleh Mengakses | Contoh |
|-------|----------------|--------|
| **Plugin** | `src/domain/finance/index.js` API | `finance.engine.getBalance(id)` |
| **Domain** | `src/models/` (Mongoose) | `FinanceUser.findOne()`, `FinanceLedger.create()` |
| **Middleware** | `global.db` (JSON persistence) | `global.db.users[userId]` |
| **Core** | Semua layer | Router, ReplyEngine |

**Anti-pattern yang DILARANG:**
```javascript
// ❌ SALAH — Plugin mengakses Mongoose langsung
const FinanceUser = require('../src/models/FinanceUser');
await FinanceUser.findOne({ userId }); // JANGAN!

// ✅ BENAR — Gunakan domain API
const finance = require('../src/domain/finance');
await finance.engine.getBalance(userId);
```

### 7.3 Persistence Strategy

| Data | Storage | Method |
|------|---------|--------|
| Finance transactions | MongoDB | Mongoose ODM |
| Finance user profiles | MongoDB | Mongoose ODM |
| Bot owners | `data/owner.json` | fs.writeFileSync |
| Premium users | `data/premium.json` | fs.writeFileSync |
| User preferences | `data/replyMode.json` | fs.writeFileSync |
| Session/auth | `session/` | Baileys multi-file auth |

---

## 8. Flow Execution Diagram

### Complete Message Lifecycle

```
STEP 1: INCOMING MESSAGE
┌─────────────────────────────────────────┐
│  WhatsApp Server → Baileys WebSocket   │
│  Event: messages.upsert                │
└─────────────────────────────────────────┘
                   │
                   ▼
STEP 2: MESSAGE SERIALIZATION
┌─────────────────────────────────────────┐
│  src/utils/message.js — smsg()         │
│  — Normalize message format             │
│  — Extract body, sender, timestamp      │
│  — Handle ephemeral messages            │
└─────────────────────────────────────────┘
                   │
                   ▼
STEP 3: MIDDLEWARE EXECUTION
┌─────────────────────────────────────────┐
│  src/middleware/userMiddleware.js      │
│  — Check global.db.users               │
│  — Run registerGate (block if new)     │
│  — Add XP, recalculate level           │
│  — buildContext() → ctx object         │
│  — Return: { ctx, blocked }            │
└─────────────────────────────────────────┘
                   │
              blocked?
              /      \
            YES       NO
            │          │
            ▼          ▼
    Send register    Continue to Step 4
    button & stop
                   │
                   ▼
STEP 4: COMMAND ROUTING
┌─────────────────────────────────────────┐
│  src/core/WhosTANG.js                  │
│  — Extract prefix + command            │
│  — switch(command) { ... }             │
│  — Match built-in cases                │
│  — OR: Load from plugins               │
└─────────────────────────────────────────┘
                   │
              match case?
              /          \
            YES           NO
            │              │
            ▼              ▼
    Execute case     Load plugin via
    handler          src/command/handler.js
                   │
                   ▼
STEP 5: PLUGIN EXECUTION
┌─────────────────────────────────────────┐
│  src/command/handler.js                │
│  — Scan Plugins-CJS/ & Plugins-ESM/    │
│  — Match: plugin.command.includes(cmd) │
│  — Check: plugin.owner, .premium, etc  │
│  — ESM? → convertEsmToCjs()            │
│  — Inject Obj = { m, ctx, reply, ... } │
│  — Execute: plugin(m, Obj)             │
└─────────────────────────────────────────┘
                   │
                   ▼
STEP 6: DOMAIN ACCESS (jika perlu)
┌─────────────────────────────────────────┐
│  src/domain/finance/                   │
│  — engine.ensureUser()                 │
│  — engine.addTransaction()             │
│  — ledger.getUserTransactions()        │
│  — wallet.getWalletSummary()           │
└─────────────────────────────────────────┘
                   │
                   ▼
STEP 7: RESPONSE
┌─────────────────────────────────────────┐
│  src/core/ReplyEngine.js               │
│  — engine.send() / sendHybrid()        │
│  — Build context info (fake quoted)    │
│  — Send via conn.sendMessage()         │
└─────────────────────────────────────────┘
                   │
                   ▼
STEP 8: CONTEXT UPDATE
┌─────────────────────────────────────────┐
│  src/middleware/contextBuilder.js      │
│  — updateContextAfterCommand()         │
│  — Sync ke database.json               │
│  — Increment totalCommand              │
└─────────────────────────────────────────┘
```

---

## 9. Best Practices

### 9.1 Clean Architecture Rules

1. **Dependency Rule**: Plugin bergantung pada Domain, bukan sebaliknya. Domain tidak boleh mengimpor apa pun dari Plugin layer.

2. **Context Isolation**: Semua data user diakses melalui `ctx`. Jangan mengakses `global.db` langsung dari plugin.

3. **Database Abstraction**: Plugin menggunakan Domain API. Domain menggunakan Mongoose Models. Models mengakses MongoDB.

4. **Single Responsibility**: Setiap plugin menangani satu command group. Setiap domain module menangani satu business capability.

5. **Interface Segregation**: Plugin menerima `Obj` dengan utilities yang diperlukan, bukan seluruh socket instance.

### 9.2 Anti-Pattern yang Harus Dihindari

| Anti-Pattern | Dampak | Solusi |
|-------------|--------|--------|
| `require('../src/models/...')` dari plugin | Coupling langsung ke DB layer | Gunakan `src/domain/finance/` API |
| Mutasi `global.db.users` dari plugin | Race condition, data corruption | Gunakan middleware methods |
| `conn.sendMessage()` langsung | Tidak konsisten, bypass ReplyEngine | Gunakan `engine.send()` |
| Synchronous fs operation berat | Event loop blocking | Gunakan `fs.promises` atau offload |
| Plugin tanpa error handling | Crash seluruh bot | Wrap dengan try-catch |
| Circular dependency antar plugin | Memory leak, init failure | Gunakan event bus atau facade |
| Global state tanpa sync | Data loss saat restart | Gunakan `databaseSync.js` |

---

## 10. Scalability Design

### 10.1 Horizontal Plugin Scaling

```
Plugins-CJS/
├── 01-system/           # Core commands (menu, help, ping)
│   ├── menu.js
│   └── help.js
├── 02-finance/          # Finance commands
│   ├── balance.js
│   ├── add-transaction.js
│   └── report.js
├── 03-games/            # Game commands
│   └── *.js
├── 04-group/            # Group management
│   └── *.js
└── 99-custom/           # User custom plugins
    └── *.js
```

Plugin loader secara otomatis:
- Scan semua subfolder
- Build tag index untuk filtering
- Hot-reload saat file berubah
- Auto-unload saat file dihapus

### 10.2 Domain Expansion Pattern

Untuk menambah domain baru (misal: `todo`, `reminder`):

```javascript
// src/domain/todo/index.js
const repository = require('./repository');
const service = require('./service');

module.exports = {
  initialize: async () => { /* init */ },
  service: {
    createTask: service.createTask,
    listTasks: service.listTasks,
    completeTask: service.completeTask
  }
};
```

```javascript
// main.js — Register new domain
const { initialize: initTodo } = require('./src/domain/todo');
initTodo();
```

### 10.3 Middleware Extension

Tambah middleware baru dengan pattern:

```javascript
// src/middleware/customMiddleware.js
module.exports = async (userId, ctx) => {
  // Pre-processing logic
  // Return: { ctx: enrichedCtx, blocked: boolean }
};
```

Register di `userMiddleware.js` orchestrator.

### 10.4 Multi-Bot Deployment

```javascript
// cluster.js — Multi-instance deployment
const cluster = require('cluster');
const os = require('os');

if (cluster.isPrimary) {
  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork({ BOT_INSTANCE: i });
  }
} else {
  require('./main.js'); // Each instance has separate session/
}
```

---

## Appendix: Technology Stack

| Kategori | Library | Purpose |
|----------|---------|---------|
| **WhatsApp** | `@itsukichan/baileys` | WhatsApp Web API |
| **Database** | `mongoose` | MongoDB ODM |
| **Auth** | `dotenv` | Environment variables |
| **Media** | `fluent-ffmpeg`, `jimp` | Audio/image processing |
| **Network** | `axios`, `node-fetch` | HTTP requests |
| **Utility** | `chalk`, `moment-timezone` | Formatting & timezone |
| **Compiler** | `@babel/core` | ESM→CJS transpilation |

---

## Appendix: Environment Variables

```bash
# Required
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database

# Optional
NODE_ENV=production
BOT_NAME=NHE Bot
OWNER_NUMBER=62881027174423
```

---

## License

MIT © NHE Bot
