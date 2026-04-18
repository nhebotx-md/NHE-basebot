/**
 * =========================================
 * FILE: Plugins-CJS/myinfo.js
 * DESCRIPTION:
 * Plugin untuk menampilkan profil user.
 * Commands: myinfo, cekprof, profile, me
 *
 * Menampilkan:
 * - Nama & Nomor
 * - Status Register
 * - Role
 * - Level & XP
 * - Progress Level (text bar)
 * - Total Command
 * - Tanggal Register
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
async function myinfoPlugin(m, Obj) {
    const { reply, conn } = Obj;

    try {
        // Ambil context dari middleware injection
        const ctx = m.ctx || {};
        const user = ctx.user || {};

        // Jika user belum register
        if (!ctx.isRegistered) {
            return reply(
                `⚠️ *Profil Tidak Tersedia*\n\n` +
                `Kamu belum terdaftar.\n` +
                `Ketik *.register* untuk mendaftar dan melihat profilmu.`,
                { title: 'Profil', body: 'Belum Terdaftar' }
            );
        }

        // Extract data dari context
        const pushName = ctx.alias || m.pushName || 'User';
        const phoneNumber = ctx.userId ? ctx.userId.split('@')[0] : 'Unknown';
        const regStatus = ctx.isRegistered ? '✅ SUDAH' : '❌ BELUM';
        const role = ctx.roleDisplay || '👤 User';
        const level = ctx.level || 1;
        const xp = ctx.xp || 0;
        const levelProgress = ctx.levelProgress || 0;
        const neededXp = ctx.neededXp || 100;
        const nextLevelXP = ctx.nextLevelXP || (neededXp - levelProgress);
        const percentage = ctx.percentage || 0;
        const progressBar = ctx.progressBar || '░░░░░░░░░░';
        const totalCommand = ctx.totalCommand || 0;
        const regCode = ctx.regCode || '-';

        // Format tanggal register
        const regDate = ctx.regDate || 'Tidak diketahui';

        // Format last active
        const lastActive = ctx.lastActive
            ? new Date(ctx.lastActive).toLocaleString('id-ID')
            : 'Belum pernah';

        // Hitung rank jika ada leaderboard
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
            // Ignore rank error
        }

        // Build profile message
        const profileText = `
📊 *USER PROFILE*

╭─────────────────────────
│ 👤 *Nama:* ${pushName}
│ 📱 *Nomor:* ${phoneNumber}
│ 🔖 *Kode:* \`${regCode}\`
│ 📝 *Status:* ${regStatus}
╰─────────────────────────

╭─────────────────────────
│ 🎭 *Role:* ${role}
│ ⭐ *Level:* ${level}
│ ✨ *XP:* ${xp}
│
│ 📈 *Progress Level*
│ [${progressBar}] ${percentage}%
│ ${levelProgress}/${neededXp} XP
│
│ ⏳ *Menuju Lv.${level + 1}:*
│ ${nextLevelXP} XP lagi
╰─────────────────────────

╭─────────────────────────
│ 📊 *Statistik:*
│ • Total Command: ${totalCommand}
│ • Rank: ${rankText}
│
│ 📅 *Register:*
│ ${regDate}
│
│ 🕐 *Last Active:*
│ ${lastActive}
╰─────────────────────────

_Ketik *.menu* untuk melihat fitur_`;

        // Kirim profil dengan external ad reply
        await reply(profileText, {
            title: `👤 Profil - ${pushName}`,
            body: `Level ${level} | ${role}`,
            thumbnailUrl: global.thumbnail || 'https://files.catbox.moe/5x2b8n.jpg'
        });

    } catch (error) {
        console.error('[MyInfoPlugin] Error:', error);
        await reply('❌ Terjadi error saat mengambil profil. Coba lagi nanti.');
    }
}

// =========================================
// PLUGIN METADATA (WAJIB)
// =========================================

// Command triggers
myinfoPlugin.command = ['myinfo', 'cekprof', 'profile', 'me', 'infoku'];

// Plugin tags untuk kategorisasi
myinfoPlugin.tags = ['info', 'user'];

// Help text untuk menu
myinfoPlugin.help = [
    'myinfo / cekprof / profile / me',
    'Menampilkan profil user lengkap dengan statistik'
];

// Plugin description
myinfoPlugin.description = 'Menampilkan profil user termasuk level, XP, role, dan statistik';

// =========================================
// EXPORT
// =========================================
module.exports = myinfoPlugin;
