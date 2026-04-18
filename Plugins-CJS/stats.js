/**
 * =========================================
 * FILE: Plugins-CJS/stats.js
 * DESCRIPTION:
 * Plugin untuk menampilkan statistik user.
 * Commands: stats, statistik, stat, mystats
 *
 * Menampilkan:
 * - Total command yang digunakan
 * - Last active timestamp
 * - XP gain total
 * - XP gain hari ini (estimasi)
 * - Command rate (rata-rata)
 * - Aktivitas ringkasan
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
async function statsPlugin(m, Obj) {
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

        // --- Jika user belum register ---
        if (!ctx.isRegistered) {
            return await engine.sendHybrid(m, {
                text: `⚠️ *Statistik Tidak Tersedia*\n\n` +
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

        // --- Extract statistik dari ctx ---
        const totalCommand = ctx.totalCommand || 0;
        const lastActive = ctx.lastActive || 0;
        const xp = ctx.xp || 0;
        const level = ctx.level || 1;
        const createdAt = ctx.createdAt || 0;

        // --- Hitung statistik tambahan ---
        const now = Date.now();

        // Umur akun (hari sejak register)
        const accountAgeMs = createdAt > 0 ? now - createdAt : 0;
        const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

        // Waktu sejak last active
        const timeSinceActiveMs = lastActive > 0 ? now - lastActive : 0;
        const timeSinceActiveMin = Math.floor(timeSinceActiveMs / (1000 * 60));
        const timeSinceActiveHour = Math.floor(timeSinceActiveMs / (1000 * 60 * 60));

        let lastActiveText;
        if (timeSinceActiveMin < 1) lastActiveText = 'Baru saja';
        else if (timeSinceActiveMin < 60) lastActiveText = `${timeSinceActiveMin} menit yang lalu`;
        else if (timeSinceActiveHour < 24) lastActiveText = `${timeSinceActiveHour} jam yang lalu`;
        else lastActiveText = `${Math.floor(timeSinceActiveHour / 24)} hari yang lalu`;

        // XP Gain per command (rata-rata)
        const xpPerCommand = totalCommand > 0 ? (xp / totalCommand).toFixed(1) : '0';

        // Estimasi command per hari
        const commandsPerDay = accountAgeDays > 0
            ? (totalCommand / accountAgeDays).toFixed(1)
            : totalCommand.toString();

        // Format last active detail
        const lastActiveDetail = lastActive > 0
            ? new Date(lastActive).toLocaleString('id-ID')
            : 'Belum pernah';

        // Format register date
        const regDate = createdAt > 0
            ? new Date(createdAt).toLocaleDateString('id-ID')
            : 'Tidak diketahui';

        // --- Build Stats Message ---
        const statsText = `
📊 *USER STATISTICS*

╭─────────────────────────
│ 👤 *User:* ${ctx.alias || m.pushName || 'User'}
│ 📱 *Nomor:* ${ctx.userId ? ctx.userId.split('@')[0] : 'Unknown'}
╰─────────────────────────

╭─────────────────────────
│ 📈 *AKTIVITAS*
│
│ • Total Command: ${totalCommand}
│ • Total XP: ${xp}
│ • Level: ${level}
│ • XP/Command: ${xpPerCommand}
│ • Command/Hari: ${commandsPerDay}
╰─────────────────────────

╭─────────────────────────
│ 🕐 *WAKTU*
│
│ • Last Active: ${lastActiveText}
│ • Detail: ${lastActiveDetail}
│ • Register: ${regDate}
│ • Umur Akun: ${accountAgeDays} hari
╰─────────────────────────

╭─────────────────────────
│ 💡 *INFO*
│
│ Setiap command memberikan
│ +5 XP secara otomatis.
│ Semakin sering menggunakan
│ bot, semakin tinggi levelmu!
╰─────────────────────────

_Ketik *.level* untuk detail level_
_Ketik *.leaderboard* untuk ranking_`;

        await engine.sendHybrid(m, {
            text: statsText,
            footer: global.botname || 'NHE BOT',
            buttons: [
                {
                    buttonId: '.level',
                    buttonText: { displayText: '⭐ Level' }
                },
                {
                    buttonId: '.leaderboard',
                    buttonText: { displayText: '🏆 Leaderboard' }
                },
                {
                    buttonId: '.myinfo',
                    buttonText: { displayText: '👤 Profil' }
                }
            ],
            ctx: context
        });

    } catch (error) {
        console.error('[StatsPlugin] Error:', error);
        await reply('❌ Terjadi error saat mengambil statistik. Coba lagi nanti.');
    }
}

// =========================================
// PLUGIN METADATA (WAJIB)
// =========================================

statsPlugin.command = ['stats', 'statistik', 'stat', 'mystats'];
statsPlugin.tags = ['info', 'user'];
statsPlugin.help = [
    'stats / statistik / stat / mystats',
    'Menampilkan statistik user: total command, last active, XP gain'
];
statsPlugin.description = 'Menampilkan statistik lengkap user termasuk total command, last active, dan XP gain';

// =========================================
// EXPORT
// =========================================
module.exports = statsPlugin;
