/**
 * =========================================
 * 📌 EXAMPLE PLUGIN: Menggunakan Middleware Context
 * =========================================
 *
 * Plugin ini mendemonstrasikan cara menggunakan ctx dari Global Middleware.
 * Semua plugin sekarang bisa mengakses:
 *
 *   Obj.ctx.user         - Data user lengkap
 *   Obj.ctx.isOwner      - Boolean apakah owner
 *   Obj.ctx.isAdmin      - Boolean apakah admin
 *   Obj.ctx.isPremium    - Boolean apakah premium
 *   Obj.ctx.level        - Level user
 *   Obj.ctx.xp           - XP user
 *   Obj.priorityRole     - Role tertinggi user ('owner'|'admin'|'premium'|'user')
 *
 * Atau langsung:
 *   Obj.isOwner, Obj.isAdmin, Obj.isPremium, Obj.userLevel, Obj.userXP
 *
 * PRIORITY ROLE: OWNER > ADMIN > PREMIUM > USER
 * =========================================
 */

const handler = async (m, Obj) => {
    // =========================================
    // 📌 Akses dependencies dari Obj
    // =========================================
    const {
        text,
        args,
        reply,
        conn,
        createReplyEngine,
        global,
        plugins,

        // 🔥 Middleware Context (BARU)
        ctx,
        isOwner,
        isAdmin,
        isPremium,
        userLevel,
        userXP,
        priorityRole,
        levelUp
    } = Obj;

    // =========================================
    // 📌 Gunakan Reply Engine
    // =========================================
    const engine = createReplyEngine(conn, global);

    // Build context untuk reply engine
    const context = {
        name: m.pushName || "User",
        number: (m.sender || "0@s.whatsapp.net").split('@')[0],
        thumb: global.thumb
    };

    // =========================================
    // 📌 Contoh: Command .myinfo
    // =========================================
    if (text === 'info' || !text) {
        const infoText = `
👤 *MY INFO*

┌─〔 USER DATA 〕
│
│ 📱 Nomor: *${ctx?.senderNumber || '-'}*
│ 👤 Alias: *${ctx?.alias || 'User'}*
│ 🆔 Kode: *${ctx?.regCode || '-'}*
│
├─〔 ROLE 〕
│
│ ${isOwner ? '👑 Owner: ✅' : '👑 Owner: ❌'}
│ ${isAdmin ? '🛡️ Admin: ✅' : '🛡️ Admin: ❌'}
│ ${isPremium ? '💎 Premium: ✅' : '💎 Premium: ❌'}
│ 🏷️ Priority: *${priorityRole?.toUpperCase() || 'USER'}*
│
├─〔 LEVELING 〕
│
│ 📊 Level: *${userLevel || 1}*
│ ⭐ XP: *${userXP || 0}*
│ 📈 Progress: *${ctx?.xpProgress?.toFixed(1) || 0}%*
│ 🎯 Next Level: *${ctx?.xpToNextLevel || 100}* XP
│
└─────────────────────

_Global Middleware System © NHE Bot_
        `.trim();

        return await engine.send(m, {
            text: infoText,
            ctx: context
        });
    }

    // =========================================
    // 📌 Contoh: Role-based access control
    // =========================================
    if (text === 'adminonly') {
        // Cek apakah user adalah admin atau lebih tinggi
        if (!isAdmin && !isOwner) {
            return await engine.send(m, {
                text: `❌ *AKSES DITOLAK!*\n\nFitur ini hanya untuk *Admin* dan *Owner*.\n\nRole kamu: *${priorityRole?.toUpperCase() || 'USER'}*`,
                ctx: context
            });
        }

        return await engine.send(m, {
            text: `✅ *ADMIN PANEL*\n\nSelamat datang di panel admin!\nRole kamu: *${priorityRole?.toUpperCase()}*`,
            ctx: context
        });
    }

    // =========================================
    // 📌 Contoh: Owner-only command
    // =========================================
    if (text === 'ownerpanel') {
        if (!isOwner) {
            return await engine.send(m, {
                text: `❌ *OWNER ONLY!*\n\nFitur ini hanya untuk *Owner* bot.`,
                ctx: context
            });
        }

        return await engine.send(m, {
            text: `👑 *OWNER PANEL*\n\n✅ Welcome Owner!\n📊 Total Users: *${global.db?.users ? Object.keys(global.db.users).length : 0}*\n⚡ Engine: *Active*`,
            ctx: context
        });
    }

    // =========================================
    // 📌 Contoh: Premium-only feature
    // =========================================
    if (text === 'premium') {
        if (!isPremium && !isOwner) {
            return await engine.send(m, {
                text: `💎 *PREMIUM ONLY!*\n\nFitur ini hanya untuk user *Premium*.\n\nHubungi owner untuk upgrade!`,
                ctx: context
            });
        }

        return await engine.send(m, {
            text: `💎 *PREMIUM FEATURE*\n\n✅ Welcome Premium User!\n🎉 Nikmati semua fitur eksklusif!`,
            ctx: context
        });
    }

    // =========================================
    // 📌 Default response
    // =========================================
    return await engine.send(m, {
        text: `
📖 *CARA PENGGUNAAN:*

• *.myinfo info* - Lihat info user
• *.myinfo adminonly* - Cek akses admin
• *.myinfo ownerpanel* - Panel owner
• *.myinfo premium* - Fitur premium

Role kamu: *${priorityRole?.toUpperCase() || 'USER'}*
        `.trim(),
        ctx: context
    });
};

// =========================================
// 📌 PLUGIN METADATA
// =========================================
handler.help = ['myinfo'];
handler.tags = ['info', 'middleware-demo'];
handler.command = ["myinfo", "mi"];

module.exports = handler;
