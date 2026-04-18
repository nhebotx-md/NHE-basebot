/**
 * =========================================
 * FILE: Plugins-CJS/register.js (CRITICAL PLUGIN)
 * DESCRIPTION:
 * Plugin registrasi user - Entry point aktivasi.
 * Dipanggil oleh registerGate saat user mengirim keyword register.
 *
 * FUNGSI:
 * - Menerima dan memproses pendaftaran user
 * - Generate kode register unik
 * - Set user.registered = true, user.regCode, user.createdAt
 * - Update database.json (via middleware forceSave)
 *
 * OUTPUT:
 * - Registrasi berhasil: Nama, Nomor, Kode, Level, XP, Role, Tanggal
 * - Sudah terdaftar: Info profil singkat
 *
 * BASE PLUGIN STANDARD (CJS)
 * =========================================
 */

// =========================================
// PLUGIN DEFINITION
// =========================================

/**
 * Main plugin function
 * @param {Object} m - Message object (dengan ctx dari middleware)
 * @param {Object} Obj - Handle data object
 */
async function registerPlugin(m, Obj) {
    const { reply, conn, createReplyEngine, global } = Obj;

    try {
        // Ambil context dari middleware injection
        const ctx = m.ctx || {};
        const user = ctx.user || {};

        // Inisialisasi engine
        const engine = createReplyEngine(conn, global);

        // Build context untuk engine
        const context = {
            name: m.pushName || 'User',
            number: (m.sender || '0@s.whatsapp.net').split('@')[0],
            thumb: global.thumb
        };

        // --- CASE: User sudah terdaftar ---
        if (ctx.isRegistered) {
            const alreadyRegisteredText = `
✅ *Kamu Sudah Terdaftar!*

╭─────────────────────────
│ 👤 *Nama:* ${ctx.alias || m.pushName || 'User'}
│ 📱 *Nomor:* ${ctx.userId ? ctx.userId.split('@')[0] : 'Unknown'}
│ 🔖 *Kode:* \`${ctx.regCode || '-'}\`
│ ⭐ *Level:* ${ctx.level || 1}
│ ✨ *XP:* ${ctx.xp || 0}
│ 🎭 *Role:* ${ctx.roleDisplay || 'User'}
╰─────────────────────────

📅 *Tanggal Daftar:* ${ctx.regDate || 'Tidak diketahui'}

Ketik *.myinfo* untuk melihat profil lengkap.`;

            return await engine.sendHybrid(m, {
                text: alreadyRegisteredText,
                footer: global.botname || 'NHE BOT',
                buttons: [
                    {
                        buttonId: '.myinfo',
                        buttonText: { displayText: '👤 Profil Saya' }
                    },
                    {
                        buttonId: '.menu',
                        buttonText: { displayText: '📚 Menu' }
                    }
                ],
                ctx: context
            });
        }

        // --- CASE: User belum terdaftar → Proses Registrasi ---
        // Data user sudah di-create oleh userMiddleware
        // Kita perlu mengaktifkan registrasi

        const phoneNumber = ctx.userId ? ctx.userId.split('@')[0] : 'Unknown';
        const pushName = m.pushName || 'User';

        // Generate registration code
        const last4 = phoneNumber.slice(-4);
        const timestamp4 = Date.now().toString().slice(-4);
        const regCode = `REG-${last4}-${timestamp4}`;

        // Update user data (middleware sudah pastikan user exists)
        if (user && typeof user === 'object') {
            user.registered = true;
            user.regCode = regCode;
            user.createdAt = Date.now();
            user.registerPromptSent = true;
            user.alias = pushName;
            user.level = 1;
            user.xp = 0;
            user.totalCommand = 0;
            user.role = {
                owner: false,
                admin: false,
                premium: false
            };
            user.firstSeen = true;
            user.firstInteractionAt = Date.now();

            // Trigger save ke database.json via global.db
            // Middleware akan handle sync
            if (global.db && global.db.users) {
                global.db.users[ctx.userId] = user;
            }

            // Force save ke database.json
            try {
                const { forceSave } = require('../src/middleware/databaseSync');
                forceSave();
            } catch (e) {
                // Jika module tidak tersedia, tetap lanjut
                console.log('[Register] forceSave via module failed, data tetap di memory');
            }
        }

        // Format tanggal
        const dateStr = new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Build success message
        const successText = `
📌 *REGISTRASI BERHASIL* ✅

╭─────────────────────────
│ 👤 *Nama:* ${pushName}
│ 📱 *Nomor:* ${phoneNumber}
│ 🔖 *Kode:* \`${regCode}\`
│ ⭐ *Level:* 1
│ ✨ *XP:* 0
│ 🎭 *Role:* User
│ 📅 *Tanggal:* ${dateStr}
╰─────────────────────────

Selamat datang, *${pushName}*! 🎉

Ketik *.menu* untuk melihat fitur yang tersedia.
Ketik *.myinfo* atau *.cekprof* untuk melihat profilmu.
Ketik *.help* untuk bantuan.`;

        return await engine.sendHybrid(m, {
            text: successText,
            footer: global.botname || 'NHE BOT',
            buttons: [
                {
                    buttonId: '.myinfo',
                    buttonText: { displayText: '👤 Profil Saya' }
                },
                {
                    buttonId: '.menu',
                    buttonText: { displayText: '📚 Menu Utama' }
                },
                {
                    buttonId: '.help',
                    buttonText: { displayText: '❓ Bantuan' }
                }
            ],
            ctx: context
        });

    } catch (error) {
        console.error('[RegisterPlugin] Error:', error);
        await reply('❌ Terjadi error saat registrasi. Coba lagi nanti.');
    }
}

// =========================================
// PLUGIN METADATA (WAJIB)
// =========================================

// Command triggers
registerPlugin.command = ['register', 'daftar', 'reg', 'start'];

// Plugin tags untuk kategorisasi
registerPlugin.tags = ['main', 'user'];

// Help text untuk menu
registerPlugin.help = [
    'register / daftar / reg',
    'Mendaftar ke sistem bot untuk mengakses semua fitur'
];

// Plugin description
registerPlugin.description = 'Plugin registrasi user - Entry point aktivasi akun';

// =========================================
// EXPORT
// =========================================
module.exports = registerPlugin;
