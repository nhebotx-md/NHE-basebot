/**
 * =========================================
 * FILE: Plugins-CJS/role.js
 * DESCRIPTION:
 * Plugin untuk menampilkan role user.
 * Commands: role, myrole, peran, cekrole
 *
 * Menampilkan:
 * - Role saat ini (owner / admin / premium / user)
 * - Priority level
 * - Hak akses yang dimiliki
 * - Info role lainnya
 *
 * SEMUA DATA diambil dari ctx (middleware injection).
 * Plugin ini hanya CONSUMER data.
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
async function rolePlugin(m, Obj) {
    const { reply, conn, createReplyEngine, global } = Obj;

    try {
        // Ambil context dari middleware injection
        const ctx = m.ctx || {};

        // Inisialisasi engine
        const engine = createReplyEngine(conn, global);

        // Build context untuk engine
        const context = {
            name: m.pushName || 'User',
            number: (m.sender || '0@s.whatsapp.net').split('@')[0],
            thumb: global.thumb
        };

        // --- Jika user belum register ---
        if (!ctx.isRegistered) {
            return await engine.sendHybrid(m, {
                text: `⚠️ *Role Info Tidak Tersedia*\n\n` +
                      `Kamu belum terdaftar.\n` +
                      `Ketik *.register* untuk mendaftar.`,
                footer: global.botname || 'NHE BOT',
                buttons: [
                    {
                        buttonId: '.register',
                        buttonText: { displayText: '📝 Daftar' }
                    }
                ],
                ctx: context
            });
        }

        // --- Extract role data dari ctx ---
        const role = ctx.role || 'user';
        const roleDisplay = ctx.roleDisplay || '👤 User';
        const rolePriority = ctx.rolePriority || 1;
        const isOwner = ctx.isOwner || false;
        const isAdmin = ctx.isAdmin || false;
        const isPremium = ctx.isPremium || false;
        const isUser = ctx.isUser !== false;

        // --- Deskripsi hak akses per role ---
        const roleDescriptions = {
            owner: {
                icon: '👑',
                title: 'OWNER',
                desc: 'Pemilik bot dengan akses penuh ke semua sistem.',
                access: [
                    '✅ Akses ke semua command',
                    '✅ Panel admin & owner',
                    '✅ Manajemen user (add/remove)',
                    '✅ Manajemen premium',
                    '✅ Debug & sistem tools',
                    '✅ Broadcast message',
                    '✅ Konfigurasi bot'
                ]
            },
            admin: {
                icon: '👮',
                title: 'ADMIN',
                desc: 'Administrator bot dengan hak akses terbatas.',
                access: [
                    '✅ Akses ke semua command user',
                    '✅ Panel admin',
                    '✅ Manajemen group',
                    '✅ Kick/ban user',
                    '✅ Setting group',
                    '❌ Owner-only commands',
                    '❌ Konfigurasi bot'
                ]
            },
            premium: {
                icon: '💎',
                title: 'PREMIUM',
                desc: 'User premium dengan akses ke fitur eksklusif.',
                access: [
                    '✅ Akses ke semua command user',
                    '✅ Fitur premium',
                    '✅ Limit lebih tinggi',
                    '✅ Prioritas response',
                    '❌ Admin commands',
                    '❌ Owner-only commands',
                    '❌ Konfigurasi bot'
                ]
            },
            user: {
                icon: '👤',
                title: 'USER',
                desc: 'User standar dengan akses ke fitur dasar.',
                access: [
                    '✅ Akses fitur dasar',
                    '✅ Sistem leveling',
                    '✅ Command umum',
                    '❌ Fitur premium',
                    '❌ Admin commands',
                    '❌ Owner-only commands',
                    '❌ Konfigurasi bot'
                ]
            }
        };

        const roleInfo = roleDescriptions[role] || roleDescriptions.user;

        // --- Build message ---
        const accessList = roleInfo.access.map(a => `│ ${a}`).join('\n');

        const roleText = `
🎭 *ROLE INFO*

╭─────────────────────────
│ 👤 *User:* ${ctx.alias || m.pushName || 'User'}
│ 📱 *Nomor:* ${ctx.userId ? ctx.userId.split('@')[0] : 'Unknown'}
╰─────────────────────────

╭─────────────────────────
│ ${roleInfo.icon} *Role:* ${roleInfo.title}
│ 🔢 *Priority:* ${rolePriority}/4
╰─────────────────────────

╭─────────────────────────
│ 📝 *Deskripsi:*
│ ${roleInfo.desc}
╰─────────────────────────

╭─────────────────────────
│ 🔐 *Hak Akses:*
${accessList}
╰─────────────────────────

╭─────────────────────────
│ 🔄 *Role Hierarchy:*
│ 👑 Owner (4) > 👮 Admin (3)
│ > 💎 Premium (2) > 👤 User (1)
╰─────────────────────────

_Ketik *.myinfo* untuk profil lengkap_`;

        await engine.sendHybrid(m, {
            text: roleText,
            footer: global.botname || 'NHE BOT',
            buttons: [
                {
                    buttonId: '.myinfo',
                    buttonText: { displayText: '👤 Profil' }
                },
                {
                    buttonId: '.level',
                    buttonText: { displayText: '⭐ Level' }
                }
            ],
            ctx: context
        });

    } catch (error) {
        console.error('[RolePlugin] Error:', error);
        await reply('❌ Terjadi error saat mengambil info role. Coba lagi nanti.');
    }
}

// =========================================
// PLUGIN METADATA (WAJIB)
// =========================================

rolePlugin.command = ['role', 'myrole', 'peran', 'cekrole'];
rolePlugin.tags = ['info', 'user'];
rolePlugin.help = [
    'role / myrole / peran / cekrole',
    'Menampilkan role user: owner, admin, premium, atau user'
];
rolePlugin.description = 'Menampilkan role user beserta hak akses yang dimiliki';

// =========================================
// EXPORT
// =========================================
module.exports = rolePlugin;
