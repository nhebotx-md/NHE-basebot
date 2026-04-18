/**
 * =========================================
 * FILE: Plugins-CJS/debug-user.js
 * DESCRIPTION:
 * Plugin untuk menampilkan raw ctx dan user data.
 * Commands: debuguser, debugctx, rawuser, inspect
 *
 * Fungsi:
 * - Menampilkan raw ctx object untuk debugging
 * - Menampilkan struktur user data lengkap
 * - Menampilkan global.db summary
 * - HANYA bisa diakses oleh OWNER
 *
 * SECURITY:
 * - Dilindungi dengan ctx.isOwner check
 * - Jika bukan owner, akses ditolak
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
async function debugUserPlugin(m, Obj) {
    const { reply, conn, createReplyEngine, global, text } = Obj;

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

        // --- OWNER ONLY CHECK ---
        if (!ctx.isOwner) {
            return await engine.send(m, {
                text: `❌ *AKSES DITOLAK*\n\n` +
                      `Command ini hanya untuk *Owner* bot.\n\n` +
                      `Role kamu: ${ctx.roleDisplay || 'User'}`,
                ctx: context
            });
        }

        // --- Parse args untuk mode debug ---
        const args = (text || '').trim().split(/\s+/).filter(Boolean);
        const mode = args[0] || 'ctx'; // ctx | user | db | help

        // --- Mode: help ---
        if (mode === 'help') {
            return await engine.send(m, {
                text: `
🔧 *DEBUG USER - HELP*

┌─〔 MODE DEBUG 〕
│
│ *.debuguser ctx* - Lihat raw ctx
│ *.debuguser user* - Lihat raw user data
│ *.debuguser db* - Lihat database summary
│ *.debuguser jid <nomor>* - Cari user by JID
│
└─〔 USAGE 〕
│
│ Gunakan untuk debugging
│ middleware dan user data.
│
└─────────────────────
`,
                ctx: context
            });
        }

        // --- Mode: ctx (default) ---
        if (mode === 'ctx') {
            const rawCtx = {
                userId: ctx.userId,
                isOwner: ctx.isOwner,
                isAdmin: ctx.isAdmin,
                isPremium: ctx.isPremium,
                isUser: ctx.isUser,
                role: ctx.role,
                roleDisplay: ctx.roleDisplay,
                rolePriority: ctx.rolePriority,
                level: ctx.level,
                xp: ctx.xp,
                levelProgress: ctx.levelProgress,
                nextLevelXP: ctx.nextLevelXP,
                neededXp: ctx.neededXp,
                percentage: ctx.percentage,
                progressBar: ctx.progressBar,
                totalCommand: ctx.totalCommand,
                lastActive: ctx.lastActive,
                createdAt: ctx.createdAt,
                regDate: ctx.regDate,
                alias: ctx.alias,
                isRegistered: ctx.isRegistered,
                regCode: ctx.regCode
            };

            const ctxText = `
🛠️ *DEBUG: RAW CTX*

\`\`\`json
${JSON.stringify(rawCtx, null, 2)}
\`\`\`

✅ *Ctx Status:* ${ctx ? 'AVAILABLE' : 'NULL'}
📊 *hasRole('admin'):* ${ctx.hasRole ? ctx.hasRole('admin') : 'N/A'}
`;

            return await engine.send(m, {
                text: ctxText,
                ctx: context
            });
        }

        // --- Mode: user ---
        if (mode === 'user') {
            const userData = ctx.user || {};

            // Sanitasi data sensitif jika ada
            const sanitizedUser = { ...userData };

            const userText = `
🛠️ *DEBUG: RAW USER DATA*

\`\`\`json
${JSON.stringify(sanitizedUser, null, 2)}
\`\`\`

✅ *User Status:* ${ctx.isRegistered ? 'REGISTERED' : 'UNREGISTERED'}
🔗 *User JID:* ${ctx.userId || 'N/A'}
`;

            return await engine.send(m, {
                text: userText,
                ctx: context
            });
        }

        // --- Mode: db ---
        if (mode === 'db') {
            let dbSummary = {};

            try {
                if (global.db) {
                    const users = global.db.users || {};
                    const userEntries = Object.entries(users);

                    dbSummary = {
                        totalUsers: userEntries.length,
                        registeredUsers: userEntries.filter(([_, u]) => u.registered).length,
                        unregisteredUsers: userEntries.filter(([_, u]) => !u.registered).length,
                        totalXP: userEntries.reduce((sum, [_, u]) => sum + (u.xp || 0), 0),
                        avgXP: userEntries.length > 0
                            ? Math.floor(userEntries.reduce((sum, [_, u]) => sum + (u.xp || 0), 0) / userEntries.length)
                            : 0,
                        hasSettings: !!global.db.settings,
                        hasSessions: !!global.db.sessions,
                        lastUpdated: global.db.settings?.lastUpdated
                            ? new Date(global.db.settings.lastUpdated).toLocaleString('id-ID')
                            : 'N/A'
                    };
                } else {
                    dbSummary = { error: 'global.db not available' };
                }
            } catch (err) {
                dbSummary = { error: err.message };
            }

            const dbText = `
🛠️ *DEBUG: DATABASE SUMMARY*

\`\`\`json
${JSON.stringify(dbSummary, null, 2)}
\`\`\`

📁 *DB Path:* ./data/database.json
`;

            return await engine.send(m, {
                text: dbText,
                ctx: context
            });
        }

        // --- Mode: jid <nomor> ---
        if (mode === 'jid' && args[1]) {
            const targetJid = args[1].includes('@')
                ? args[1]
                : `${args[1]}@s.whatsapp.net`;

            const targetUser = global.db?.users?.[targetJid] || null;

            if (!targetUser) {
                return await engine.send(m, {
                    text: `❌ *User tidak ditemukan*\n\nJID: ${targetJid}`,
                    ctx: context
                });
            }

            const jidText = `
🛠️ *DEBUG: USER BY JID*

Target: ${targetJid}

\`\`\`json
${JSON.stringify(targetUser, null, 2)}
\`\`\`
`;

            return await engine.send(m, {
                text: jidText,
                ctx: context
            });
        }

        // --- Default: invalid mode ---
        return await engine.send(m, {
            text: `⚠️ *Mode tidak valid: "${mode}"*\n\n` +
                  `Gunakan *.debuguser help* untuk melihat mode yang tersedia.`,
            ctx: context
        });

    } catch (error) {
        console.error('[DebugUserPlugin] Error:', error);
        await reply('❌ Terjadi error saat debugging. Coba lagi nanti.');
    }
}

// =========================================
// PLUGIN METADATA (WAJIB)
// =========================================

debugUserPlugin.command = ['debuguser', 'debugctx', 'rawuser', 'inspect'];
debugUserPlugin.tags = ['dev', 'owner', 'debug'];
debugUserPlugin.help = [
    'debuguser / debugctx / rawuser / inspect',
    '(OWNER ONLY) Menampilkan raw ctx dan user data untuk debugging'
];
debugUserPlugin.description = 'Debug tool untuk melihat raw middleware context (OWNER ONLY)';

// =========================================
// EXPORT
// =========================================
module.exports = debugUserPlugin;
