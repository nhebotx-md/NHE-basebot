/**
 * =========================================
 * FILE: Plugins-CJS/leaderboard.js
 * DESCRIPTION:
 * Plugin untuk menampilkan leaderboard/ranking user.
 * Commands: leaderboard, lb, top, ranking, peringkat
 *
 * Fungsi:
 * - Ambil data global.db.users
 * - Filter hanya user yang sudah register
 * - Sort berdasarkan XP/level tertinggi
 * - Tampilkan top 10 user
 * - Highlight posisi user saat ini
 *
 * SEMUA DATA diambil dari global.db.users.
 * Plugin ini hanya CONSUMER data.
 *
 * BASE PLUGIN STANDARD (CJS)
 * =========================================
 */

// =========================================
// CONSTANTS
// =========================================
const TOP_LIMIT = 10; // Jumlah top user yang ditampilkan

// =========================================
// PLUGIN DEFINITION
// =========================================

/**
 * Main plugin function
 * @param {Object} m - Message object (dengan ctx dari middleware)
 * @param {Object} Obj - Handle data object
 */
async function leaderboardPlugin(m, Obj) {
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

        // --- Cek apakah ada data user ---
        if (!global.db || !global.db.users) {
            return await engine.send(m, {
                text: `⚠️ *Leaderboard tidak tersedia*\n\nBelum ada data user.`,
                ctx: context
            });
        }

        // --- Ambil dan sort data user ---
        // Gunakan formula yang sama dengan levelSystem: level = floor(xp / 100) + 1
        const calcLevel = (xp) => Math.floor((xp || 0) / 100) + 1;

        const allUsers = Object.entries(global.db.users)
            .filter(([_, data]) => data.registered) // Hanya user terdaftar
            .map(([userId, data]) => ({
                userId,
                alias: data.alias || 'User',
                xp: data.xp || 0,
                level: calcLevel(data.xp || 0),
                totalCommand: data.totalCommand || 0,
                role: data.role || { owner: false, admin: false, premium: false }
            }))
            .sort((a, b) => b.xp - a.xp); // Sort by XP descending

        if (allUsers.length === 0) {
            return await engine.send(m, {
                text: `📊 *LEADERBOARD*\n\nBelum ada user yang terdaftar.`,
                ctx: context
            });
        }

        // --- Hitung rank user saat ini ---
        const currentUserRank = allUsers.findIndex(u => u.userId === ctx.userId) + 1;

        // --- Build leaderboard text ---
        const medalMap = {
            1: '🥇',
            2: '🥈',
            3: '🥉'
        };

        let leaderboardText = `
🏆 *LEADERBOARD - TOP ${Math.min(TOP_LIMIT, allUsers.length)}*

╭─────────────────────────
│ 📊 Total User: ${allUsers.length}
│ 🎯 Sort by: XP Tertinggi
╰─────────────────────────

`;

        // Generate list top user
        const topUsers = allUsers.slice(0, TOP_LIMIT);
        topUsers.forEach((user, index) => {
            const rank = index + 1;
            const medal = medalMap[rank] || ` ${rank}.`;
            const number = user.userId.split('@')[0];
            const isCurrentUser = user.userId === ctx.userId;

            leaderboardText += `${medal} ${isCurrentUser ? '👉 ' : ''}${user.alias}\n`;
            leaderboardText += `    ⭐ Lv.${user.level} | ✨ ${user.xp} XP | 📱 ${number}\n\n`;
        });

        // --- Tambahkan info posisi user saat ini ---
        if (ctx.isRegistered && currentUserRank > 0) {
            const currentUser = allUsers.find(u => u.userId === ctx.userId);
            if (currentUser && currentUserRank > TOP_LIMIT) {
                leaderboardText += `...\n\n`;
                leaderboardText += `👉 *Posisimu:* #${currentUserRank}\n`;
                leaderboardText += `    ⭐ Lv.${currentUser.level} | ✨ ${currentUser.xp} XP\n`;
            } else if (currentUserRank > 0 && currentUserRank <= TOP_LIMIT) {
                leaderboardText += `\n✅ *Kamu berada di posisi #${currentUserRank}!*\n`;
            }
        } else if (!ctx.isRegistered) {
            leaderboardText += `\n⚠️ *Kamu belum terdaftar.*\n`;
            leaderboardText += `Ketik *.register* untuk ikut leaderboard!\n`;
        }

        leaderboardText += `\n_Ketik *.level* untuk cek progressmu_`;

        await engine.sendHybrid(m, {
            text: leaderboardText,
            footer: global.botname || 'NHE BOT',
            buttons: [
                {
                    buttonId: '.level',
                    buttonText: { displayText: '⭐ Level' }
                },
                {
                    buttonId: '.daily',
                    buttonText: { displayText: '🎁 Daily' }
                },
                {
                    buttonId: '.myinfo',
                    buttonText: { displayText: '👤 Profil' }
                }
            ],
            ctx: context
        });

    } catch (error) {
        console.error('[LeaderboardPlugin] Error:', error);
        await reply('❌ Terjadi error saat mengambil leaderboard. Coba lagi nanti.');
    }
}

// =========================================
// PLUGIN METADATA (WAJIB)
// =========================================

leaderboardPlugin.command = ['leaderboard', 'lb', 'top', 'ranking', 'peringkat'];
leaderboardPlugin.tags = ['info', 'user', 'leveling'];
leaderboardPlugin.help = [
    'leaderboard / lb / top / ranking / peringkat',
    'Menampilkan top user berdasarkan XP/level tertinggi'
];
leaderboardPlugin.description = 'Menampilkan leaderboard global berdasarkan XP dan level user';

// =========================================
// EXPORT
// =========================================
module.exports = leaderboardPlugin;
