/**
 * =========================================
 * FILE: Plugins-CJS/profile-card.js
 * DESCRIPTION:
 * Plugin untuk menampilkan profil user dalam format UI yang lebih rapi.
 * Commands: profilecard, profcard, kartu, kartuprofil
 *
 * Versi UI lebih rapi dari myinfo dengan:
 * - Format card-style yang lebih compact
 * - Hybrid message (button + text)
 * - Visual hierarchy yang lebih baik
 * - Emoji indicators untuk setiap section
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
async function profileCardPlugin(m, Obj) {
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
                text: `⚠️ *Profile Card Tidak Tersedia*\n\n` +
                      `Kamu belum terdaftar.\n` +
                      `Ketik *.register* untuk mendaftar.`,
                footer: global.botname || 'NHE BOT',
                buttons: [
                    {
                        buttonId: '.register',
                        buttonText: { displayText: '📝 Daftar Sekarang' }
                    }
                ],
                ctx: context
            });
        }

        // --- Extract data dari ctx ---
        const pushName = ctx.alias || m.pushName || 'User';
        const phoneNumber = ctx.userId ? ctx.userId.split('@')[0] : 'Unknown';
        const role = ctx.roleDisplay || '👤 User';
        const roleIcon = ctx.isOwner ? '👑' : ctx.isAdmin ? '👮' : ctx.isPremium ? '💎' : '👤';
        const level = ctx.level || 1;
        const xp = ctx.xp || 0;
        const percentage = ctx.percentage || 0;
        const progressBar = ctx.progressBar || '░░░░░░░░░░';
        const totalCommand = ctx.totalCommand || 0;
        const regCode = ctx.regCode || '-';
        const regDate = ctx.regDate || 'Tidak diketahui';
        const nextLevelXP = ctx.nextLevelXP || 0;

        // Format last active
        const lastActive = ctx.lastActive
            ? new Date(ctx.lastActive).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'Belum aktif';

        // --- Hitung Rank ---
        let rankText = '-';
        try {
            if (global.db && global.db.users) {
                const sorted = Object.entries(global.db.users)
                    .filter(([_, u]) => u.registered)
                    .sort((a, b) => (b[1].xp || 0) - (a[1].xp || 0));
                const rank = sorted.findIndex(([id, _]) => id === ctx.userId) + 1;
                const total = sorted.length;
                if (rank > 0) rankText = `#${rank}/${total}`;
            }
        } catch {
            // Ignore
        }

        // --- Build Profile Card ---
        // Compact card-style format
        const cardText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃    🪪 *PROFILE CARD*     ┃
╰━━━━━━━━━━━━━━━━━━━━━╯

┌──〔 👤 IDENTITAS 〕──┐
│
│  ${roleIcon} *${pushName}*
│  📱 +${phoneNumber}
│  🔖 \`${regCode}\`
│  📅 ${regDate}
│
├──〔 🎭 ROLE 〕──┤
│
│  ${role}
│  🏷️ Priority: ${ctx.rolePriority || 1}/4
│
├──〔 ⭐ LEVEL 〕──┤
│
│  🎯 Level ${level}
│  ✨ ${xp} XP
│
│  [${progressBar}] ${percentage}%
│  ${nextLevelXP} XP lagi ke Lv.${level + 1}
│
├──〔 📊 STATS 〕──┤
│
│  📈 Rank: ${rankText}
│  ⌨️ Command: ${totalCommand}
│  🕐 Aktif: ${lastActive}
│
└────────────────────┘

_Ketik *.myinfo* untuk versi lengkap_`;

        await engine.sendHybrid(m, {
            text: cardText,
            footer: global.botname || 'NHE BOT',
            buttons: [
                {
                    buttonId: '.myinfo',
                    buttonText: { displayText: '📋 Profil Lengkap' }
                },
                {
                    buttonId: '.level',
                    buttonText: { displayText: '⭐ Level Detail' }
                },
                {
                    buttonId: '.stats',
                    buttonText: { displayText: '📊 Statistik' }
                }
            ],
            ctx: context
        });

    } catch (error) {
        console.error('[ProfileCardPlugin] Error:', error);
        await reply('❌ Terjadi error saat mengambil profile card. Coba lagi nanti.');
    }
}

// =========================================
// PLUGIN METADATA (WAJIB)
// =========================================

profileCardPlugin.command = ['profilecard', 'profcard', 'kartu', 'kartuprofil'];
profileCardPlugin.tags = ['info', 'user'];
profileCardPlugin.help = [
    'profilecard / profcard / kartu / kartuprofil',
    'Menampilkan profil dalam format card UI yang rapi'
];
profileCardPlugin.description = 'Versi UI lebih rapi dari myinfo dengan format card-style';

// =========================================
// EXPORT
// =========================================
module.exports = profileCardPlugin;
