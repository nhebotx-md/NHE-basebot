/**
 * =========================================
 * 📌 PLUGIN: Menu Interaktif dengan ReplyEngine
 * 📌 FILE: Plugins-CJS/menu-plugin.js
 * =========================================
 */

const fs = require('fs');
const path = require('path');

const handler = async (m, Obj) => {
    const { reply, conn, createReplyEngine, global, runtime, plugins, pluginsList } = Obj;

    try {
        if (!createReplyEngine) {
            throw new Error('createReplyEngine is not provided');
        }

        const engine = createReplyEngine(conn, global);

        const sender = m.sender || "0@s.whatsapp.net";

        const ctx = {
            name: m.pushName || "User",
            number: sender.split('@')[0],
            thumb: global?.thumb
        };

        // ======================
        // 🔥 AMBIL PLUGIN DINAMIS
        // ======================
        const pluginData = plugins || global.plugins || {};
const pluginList = pluginData.list || [];
const byTag = pluginData.byTag || new Map();
console.log('PLUGIN LIST:', pluginList.length);
console.log('BYTAG SIZE:', byTag.size);
console.log('BYTAG KEYS:', [...byTag.keys()]);

        // ======================
        // 🔥 COUNT OTOMATIS
        // ======================
        const TOTAL = pluginList.length || 0;

        const menuText = `
╭──────[ *ABOUT BOT* ]──────╮
│▣ Nama-Bot : ${global?.botname || 'NHE BOT'}
│▣ Version : 2.0.0 (Dynamic)
│▣ Runtime : ${typeof runtime === 'function' ? runtime(process.uptime()) : '-'}
│▣ Feature : ${TOTAL} command
│▣ System : Auto Plugin Loader
╰─────────────────────╯

Halo ${m.pushName || "User"} 👋
Menu disusun otomatis berdasarkan plugin tags
        `.trim();

        // ======================
        // 🔹 HEADER UI
        // ======================
        await engine.sendHybrid(m, {
            text: menuText,
            footer: "Dynamic Menu System",
            buttons: [
                { buttonId: ".ping", buttonText: { displayText: "🏓 PING" } },
                { buttonId: ".owner", buttonText: { displayText: "👑 OWNER" } }
            ],
            ctx
        });

        await new Promise(r => setTimeout(r, 500));

        // ======================
        // 🔥 GENERATE MENU DINAMIS
        // ======================
        const sections = [];

        for (const [tag, list] of byTag.entries()) {

            const rows = [];

            for (const plugin of list) {
                if (!plugin.command || !plugin.command.length) continue;

                const cmd = plugin.command[0];

                rows.push({
                    title: `⚡ ${cmd}`,
                    description: plugin.help?.[0] || "No description",
                    rowId: `.${cmd}`
                });
            }

            if (rows.length) {
                sections.push({
                    title: `📂 ${tag.toUpperCase()}`,
                    rows
                });
            }
        }

        // fallback kalau kosong
        if (!sections.length) {
            sections.push({
                title: "⚠️ EMPTY",
                rows: [{
                    title: "No plugins detected",
                    description: "Check plugin loader",
                    rowId: ".menu"
                }]
            });
        }

        // ======================
        // 🔹 LIST UI DINAMIS
        // ======================
        await engine.sendListUI(m, {
            title: "📚 DYNAMIC MENU",
            body: "Semua menu berdasarkan plugin aktif:",
            footer: global?.botname || "NHE BOT",
            buttonText: "📋 LIHAT MENU",
            sections,
            ctx
        });

    } catch (err) {
        console.error('[MenuPlugin Error]', err);
        await reply('❌ Terjadi error pada menu plugin');
    }
};


// ✅ Metadata wajib
handler.command = ['menuplugin', 'menureply', 'menup'];
handler.tags = ['main', 'menu'];
handler.help = ['menuplugin'];

module.exports = handler;