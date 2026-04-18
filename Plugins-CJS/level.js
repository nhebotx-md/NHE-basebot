/**
 * =========================================
 * FILE: Plugins-CJS/level.js
 * DESCRIPTION:
 * Plugin untuk menampilkan detail level dan XP user.
 * Commands: level, xp, leveling, progres
 *
 * Menampilkan:
 * - Level saat ini
 * - Total XP
 * - Progress XP (format: 45/100)
 * - Progress bar visual
 * - Persentase
 * - Estimasi XP menuju level berikutnya
 * - Reward info
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
async function levelPlugin(m, Obj) {
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
                text: `⚠️ *Level Info Tidak Tersedia*\n\n` +
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

        // --- Extract data level dari ctx ---
        const level = ctx.level || 1;
        const xp = ctx.xp || 0;
        const levelProgress = ctx.levelProgress || 0;
        const neededXp = ctx.neededXp || 100;
        const nextLevelXP = ctx.nextLevelXP || (neededXp - levelProgress);
        const percentage = ctx.percentage || 0;
        const progressBar = ctx.progressBar || '░░░░░░░░░░';
        const totalCommand = ctx.totalCommand || 0;

        // --- Hitung estimasi ---
        const xpPerCommand = 5; // Sesuai konstanta di userMiddleware
        const estimatedCommands = Math.ceil(nextLevelXP / xpPerCommand);

        // --- Rank ---
        let rankText = 'Tidak tersedia';
        try {
            if (global.db && global.db.users) {
                const sorted = Object.entries(global.db.users)
                    .filter(([_, u]) => u.registered)
                    .sort((a, b) => (b[1].xp || 0) - (a[1].xp || 0));
                const rank = sorted.findIndex(([id, _]) => id === ctx.userId) + 1;
                if (rank > 0) rankText = `#${rank}`;
            }
        } catch {
            // Ignore
        }

        // --- Build message ---
        const levelText = `
⭐ *LEVEL & XP INFO*

╭─────────────────────────
│ 👤 *User:* ${ctx.alias || m.pushName || 'User'}
│ 🎭 *Role:* ${ctx.roleDisplay || 'User'}
╰─────────────────────────

╭─────────────────────────
│ ⭐ *Level:* ${level}
│ ✨ *Total XP:* ${xp}
│ 📊 *Rank:* ${rankText}
╰─────────────────────────

╭─────────────────────────
│ 📈 *PROGRESS LEVEL ${level}*
│
│ [${progressBar}]
│ ${percentage}%
│
│ ${levelProgress}/${neededXp} XP
│
│ ⏳ *Menuju Level ${level + 1}:*
│ Butuh ${nextLevelXP} XP lagi
│
│ 📝 *Estimasi:*
│ ~${estimatedCommands} command lagi
│ (dengan +${xpPerCommand} XP/cmd)
╰─────────────────────────

╭─────────────────────────
│ 📊 *Statistik:*
│ • Total Command: ${totalCommand}
│ • XP Rate: +${xpPerCommand} XP per cmd
╰─────────────────────────

💡 *Tip:* Semakin sering menggunakan
command, semakin cepat naik level!

_Ketik *.help-level* untuk info sistem leveling_
_Ketik *.daily* untuk klaim reward harian_`;

        await engine.sendHybrid(m, {
            text: levelText,
            footer: global.botname || 'NHE BOT',
            buttons: [
                {
                    buttonId: '.myinfo',
                    buttonText: { displayText: '👤 Profil' }
                },
                {
                    buttonId: '.daily',
                    buttonText: { displayText: '🎁 Daily Reward' }
                },
                {
                    buttonId: '.leaderboard',
                    buttonText: { displayText: '🏆 Leaderboard' }
                }
            ],
            ctx: context
        });

    } catch (error) {
        console.error('[LevelPlugin] Error:', error);
        await reply('❌ Terjadi error saat mengambil info level. Coba lagi nanti.');
    }
}

// =========================================
// PLUGIN METADATA (WAJIB)
// =========================================

levelPlugin.command = ['level', 'xp', 'leveling', 'progres', 'progress'];
levelPlugin.tags = ['info', 'user', 'leveling'];
levelPlugin.help = [
    'level / xp / leveling / progres',
    'Menampilkan level saat ini, XP, progress bar, dan estimasi naik level'
];
levelPlugin.description = 'Menampilkan detail level, XP, progress, dan estimasi menuju level berikutnya';

// =========================================
// EXPORT
// =========================================
module.exports = levelPlugin;
