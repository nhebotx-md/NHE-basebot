/**
 * =========================================
 * FILE: Plugins-CJS/daily.js
 * DESCRIPTION:
 * Plugin untuk klaim reward harian (daily reward).
 * Commands: daily, claim, harian, reward
 *
 * Fungsi:
 * - Memberikan XP bonus harian ke user
 * - Cooldown 24 jam berdasarkan timestamp di database
 * - Simpan lastDaily timestamp ke database.json
 * - XP reward bertambah sedikit berdasarkan level
 *
 * DATABASE:
 * - Menggunakan global.db.users[userId].lastDaily untuk cooldown
 * - Menggunakan global.db.users[userId].xp untuk menambah XP
 * - Middleware akan handle forceSave ke database.json
 *
 * BASE PLUGIN STANDARD (CJS)
 * =========================================
 */

// =========================================
// CONSTANTS
// =========================================
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 jam dalam milidetik
const BASE_XP_REWARD = 50;               // XP dasar reward
const XP_PER_LEVEL_BONUS = 5;            // Bonus XP per level user

// =========================================
// PLUGIN DEFINITION
// =========================================

/**
 * Main plugin function
 * @param {Object} m - Message object (dengan ctx dari middleware)
 * @param {Object} Obj - Handle data object
 */
async function dailyPlugin(m, Obj) {
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
                text: `⚠️ *Daily Reward Tidak Tersedia*\n\n` +
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

        // --- Cek Cooldown ---
        const now = Date.now();
        const lastDaily = user.lastDaily || 0;
        const timeElapsed = now - lastDaily;
        const timeRemaining = COOLDOWN_MS - timeElapsed;

        if (timeElapsed < COOLDOWN_MS) {
            // Cooldown masih aktif
            const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
            const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
            const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);

            const cooldownText = `
⏳ *DAILY REWARD - COOLDOWN*

Kamu sudah mengklaim reward hari ini!

╭─────────────────────────
│ ⏱️ *Sisa Waktu:*
│ ${hours}j ${minutes}m ${seconds}d
│
│ 🕐 *Next Claim:*
│ ${new Date(lastDaily + COOLDOWN_MS).toLocaleString('id-ID')}
╰─────────────────────────

💡 *Tip:* Mainkan game dan gunakan
command untuk mendapatkan XP!`;

            return await engine.sendHybrid(m, {
                text: cooldownText,
                footer: global.botname || 'NHE BOT',
                buttons: [
                    {
                        buttonId: '.level',
                        buttonText: { displayText: '⭐ Level' }
                    },
                    {
                        buttonId: '.leaderboard',
                        buttonText: { displayText: '🏆 Leaderboard' }
                    }
                ],
                ctx: context
            });
        }

        // --- Hitung Reward ---
        const level = ctx.level || 1;
        const levelBonus = (level - 1) * XP_PER_LEVEL_BONUS;
        const totalReward = BASE_XP_REWARD + levelBonus;

        // --- Tambah XP ke user ---
        const oldXp = user.xp || 0;
        const oldLevel = ctx.level || 1;
        user.xp = oldXp + totalReward;
        user.lastDaily = now;

        // Level akan dihitung ulang oleh middleware secara otomatis
        // Kita estimasi level baru untuk notifikasi
        const estimatedNewLevel = Math.floor(user.xp / 100) + 1;
        user.level = estimatedNewLevel;

        // Cek level up
        const leveledUp = estimatedNewLevel > oldLevel;

        // Sync ke database (via global.db)
        if (global.db && global.db.users && ctx.userId) {
            global.db.users[ctx.userId] = user;
        }

        // Force save ke database.json
        try {
            const { forceSave } = require('../src/middleware/databaseSync');
            forceSave();
        } catch (e) {
            console.log('[Daily] forceSave via module failed');
        }

        // --- Build Success Message ---
        const rewardText = `
🎁 *DAILY REWARD CLAIMED* ✅

╭─────────────────────────
│ 👤 *User:* ${ctx.alias || m.pushName || 'User'}
│ ⭐ *Level:* ${oldLevel}${leveledUp ? ` → ${newLevel}` : ''}
╰─────────────────────────

╭─────────────────────────
│ 💰 *Reward XP:* +${totalReward}
│    Base: ${BASE_XP_REWARD}
│    Level Bonus: +${levelBonus}
│
│ ✨ *Total XP:* ${oldXp} → ${user.xp}
│
│ 📊 *Next Claim:*
│ ${new Date(now + COOLDOWN_MS).toLocaleString('id-ID')}
╰─────────────────────────
${leveledUp ? `\n🎉 *LEVEL UP!* ${oldLevel} → ${newLevel}\n` : ''}
💡 *Tip:* Klaim lagi besok untuk
reward yang lebih besar!`;

        await engine.sendHybrid(m, {
            text: rewardText,
            footer: global.botname || 'NHE BOT',
            buttons: [
                {
                    buttonId: '.level',
                    buttonText: { displayText: '⭐ Level' }
                },
                {
                    buttonId: '.myinfo',
                    buttonText: { displayText: '👤 Profil' }
                }
            ],
            ctx: context
        });

    } catch (error) {
        console.error('[DailyPlugin] Error:', error);
        await reply('❌ Terjadi error saat mengklaim daily reward. Coba lagi nanti.');
    }
}

// =========================================
// PLUGIN METADATA (WAJIB)
// =========================================

dailyPlugin.command = ['daily', 'claim', 'harian', 'reward'];
dailyPlugin.tags = ['user', 'leveling', 'economy'];
dailyPlugin.help = [
    'daily / claim / harian / reward',
    'Klaim reward XP harian dengan cooldown 24 jam'
];
dailyPlugin.description = 'Sistem reward harian dengan cooldown 24 jam dan bonus berdasarkan level';

// =========================================
// EXPORT
// =========================================
module.exports = dailyPlugin;
