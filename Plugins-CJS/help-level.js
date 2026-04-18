/**
 * =========================================
 * FILE: Plugins-CJS/help-level.js
 * DESCRIPTION:
 * Plugin untuk menjelaskan sistem leveling bot.
 * Commands: helplevel, levelhelp, caralevel, levelinfo
 *
 * Menjelaskan:
 * - Cara mendapatkan XP
 * - Cara naik level
 * - Benefit setiap level
 * - Formula leveling
 * - Tips dan trik
 *
 * BASE PLUGIN STANDARD (CJS)
 * =========================================
 */

// =========================================
// CONSTANTS
// =========================================
const XP_PER_COMMAND = 5;     // XP per command (sesuai middleware)
const XP_PER_LEVEL = 100;     // XP needed per level (sesuai levelSystem)

// =========================================
// PLUGIN DEFINITION
// =========================================

/**
 * Main plugin function
 * @param {Object} m - Message object (dengan ctx dari middleware)
 * @param {Object} Obj - Handle data object
 */
async function helpLevelPlugin(m, Obj) {
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

        // --- Cek registrasi (info help tetap tampil untuk semua) ---
        const isRegistered = ctx.isRegistered || false;

        // --- Data user (jika sudah register) ---
        const userLevel = ctx.level || 1;
        const userXp = ctx.xp || 0;
        const userNextXp = ctx.nextLevelXP || 0;

        // --- Benefit per tier level ---
        const benefits = [
            { min: 1,  max: 4,  title: '🌱 Pemula', desc: 'Akses command dasar dan fitur umum.' },
            { min: 5,  max: 9,  title: '🌿 Petualang', desc: 'Akses command grup dan fitur media.' },
            { min: 10, max: 19, title: '🌳 Penjelajah', desc: 'Akses download command dan tools.' },
            { min: 20, max: 29, title: '⚔️ Pejuang', desc: 'Akses game commands dan fitur premium-like.' },
            { min: 30, max: 49, title: '🏆 Master', desc: 'Akses semua command user + badge khusus.' },
            { min: 50, max: 99, title: '👑 Legend', desc: 'Akses eksklusif dan prioritas support.' },
            { min: 100, max: 999, title: '🌟 Mythic', desc: 'Status tertinggi, semua akses terbuka.' }
        ];

        // Cari benefit user saat ini
        const currentBenefit = benefits.find(b => userLevel >= b.min && userLevel <= b.max)
            || benefits[0];

        // Cari next benefit
        const nextBenefit = benefits.find(b => b.min > userLevel);

        // --- Build Help Message ---
        const helpText = `
📚 *PANDUAN SISTEM LEVELING*

╭─────────────────────────
│ *FORMULA LEVEL*
│
│ • 100 XP = Naik 1 Level
│ • Setiap Command = +${XP_PER_COMMAND} XP
│ • Level = floor(XP / 100) + 1
╰─────────────────────────

╭─────────────────────────
│ *CARA DAPAT XP*
│
│ ✅ Gunakan command bot
│    (+${XP_PER_COMMAND} XP per command)
│ ✅ Klaim *.daily* setiap hari
│    (+50 XP base + bonus level)
│ ✅ Aktif setiap hari
│    (semakin sering = semakin cepat)
╰─────────────────────────

╭─────────────────────────
│ *STATUS KAMU*
│
│ ⭐ Level: ${userLevel}
│ ✨ XP: ${userXp}
│ 🎯 Tier: ${currentBenefit.title}
│
│ ${userNextXp > 0 ? `⏳ Butuh ${userNextXp} XP lagi untuk naik level` : '🔥 Siap naik level!'}
╰─────────────────────────

╭─────────────────────────
│ *BENEFIT TIER*
│
│ ${currentBenefit.title}
│ ${currentBenefit.desc}
${nextBenefit ? `│
│ 🔓 *Next Tier:*
│ ${nextBenefit.title}
│ (Lv.${nextBenefit.min})
│ ${nextBenefit.desc}` : ''}
╰─────────────────────────

╭─────────────────────────
│ *SEMUA TIER*
│
│ 🌱 Pemula    (Lv.1-4)
│ 🌿 Petualang  (Lv.5-9)
│ 🌳 Penjelajah (Lv.10-19)
│ ⚔️ Pejuang    (Lv.20-29)
│ 🏆 Master     (Lv.30-49)
│ 👑 Legend     (Lv.50-99)
│ 🌟 Mythic     (Lv.100+)
╰─────────────────────────

╭─────────────────────────
│ *CONTOH PERHITUNGAN*
│
│ XP: 250
│ Level: floor(250/100)+1
│       = 2 + 1 = 3
│
│ Progress Lv.3:
│ 250 % 100 = 50/100 XP
╰─────────────────────────

💡 *Tips:*
• Gunakan command sehari-hari
• Jangan lupa klaim *.daily*
• Semakin tinggi level = bonus daily lebih besar

_Ketik *.level* untuk cek progressmu_
_Ketik *.daily* untuk klaim reward_
_Ketik *.leaderboard* untuk lihat ranking_`;

        await engine.sendHybrid(m, {
            text: helpText,
            footer: global.botname || 'NHE BOT',
            buttons: [
                {
                    buttonId: '.level',
                    buttonText: { displayText: '⭐ Cek Level' }
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
        console.error('[HelpLevelPlugin] Error:', error);
        await reply('❌ Terjadi error saat menampilkan panduan. Coba lagi nanti.');
    }
}

// =========================================
// PLUGIN METADATA (WAJIB)
// =========================================

helpLevelPlugin.command = ['helplevel', 'levelhelp', 'caralevel', 'levelinfo'];
helpLevelPlugin.tags = ['info', 'leveling', 'help'];
helpLevelPlugin.help = [
    'helplevel / levelhelp / caralevel / levelinfo',
    'Menjelaskan sistem leveling: cara dapat XP, naik level, dan benefit'
];
helpLevelPlugin.description = 'Panduan lengkap sistem leveling bot';

// =========================================
// EXPORT
// =========================================
module.exports = helpLevelPlugin;
