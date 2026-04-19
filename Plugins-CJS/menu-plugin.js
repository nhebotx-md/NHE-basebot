const handler = async (m, Obj) => {
    const { conn, createReplyEngine, global, plugins } = Obj;

    try {

        if (!createReplyEngine) {
            throw new Error('createReplyEngine not provided');
        }

        // =========================
        // 🔥 ENGINE WRAPPER (STANDARD)
        // =========================
        const engineRaw = createReplyEngine(conn, global);
        
        

        const engine = {
            send: engineRaw.send.bind(engineRaw),
            sendHybrid: engineRaw.sendHybrid.bind(engineRaw),
            sendListUI: engineRaw.sendListUI.bind(engineRaw),
            sendFlow: engineRaw.sendFlow.bind(engineRaw),
        };

        // =========================
        // 🔥 SAFE CONTEXT BUILDER
        // =========================
        const ctx = {
            name: m.pushName || "User",
            number: (m.sender || "").split("@")[0],
            thumb: global?.thumb || null
        };

        // =========================
        // 🔥 PLUGIN REGISTRY SAFE LOAD
        // =========================
        const pluginData = plugins || global.plugins || {};
        const byTag = pluginData.byTag instanceof Map ? pluginData.byTag : new Map();

        if (byTag.size === 0) {
            return engine.sendHybrid(m, {
                text: "⚠ Menu tidak bisa dimuat (plugin kosong)",
                footer: global?.botname || "NHE BOT",
                ctx
            });
        }

        // =========================
        // 🔥 MENU BUILDER ENGINE
        // =========================
        const sections = [];

        for (const [tag, list] of byTag.entries()) {

            const rows = [];

            for (const plugin of list || []) {

                if (!plugin?.command?.length) continue;

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

        // =========================
        // 🔥 FALLBACK SAFE MODE
        // =========================
        if (!sections.length) {
            sections.push({
                title: "SYSTEM",
                rows: [{
                    title: "No Plugins Found",
                    description: "Registry empty or not loaded",
                    rowId: ".menu"
                }]
            });
        }

        // =========================
        // 🔥 FINAL RENDER
        // =========================
        console.log("ENGINE:", typeof engine.sendListUI);
        console.log("SENDLISTUI TYPE:", engine.sendListUI.toString().slice(0, 200));
        console.log("SECTIONS DUMP:", JSON.stringify(sections, null, 2));
        if (typeof engine.sendListUI !== "function") {
    return m.reply("❌ sendListUI bukan function (engine rusak)");
}
await conn.sendMessage(m.chat, {
    text: "ENGINE TEST OK"
}, { quoted: m });
await conn.sendMessage(m.chat, {
    text: "MENU",
    footer: "BOT",
    title: "TEST",
    buttonText: "OPEN",
    sections: []
}, { quoted: m });
console.log("RAW SECTIONS:", JSON.stringify(sections, null, 2));
        sendListUI: async (m, {
    text,
    title,
    footer,
    buttonText,
    sections,
    ctx
}) => {

    const msg = {
        text: text || title || "MENU",
        footer: footer || "",
        title: undefined,
        buttonText: buttonText || "OPEN MENU",
        sections: sections
    };

    return await engineRaw.sendMessage(m.chat, msg, {
        quoted: m
    });
}

    } catch (err) {
        console.error('[menup error]', err);
        return m.reply("❌ Menu system error");
    }
};

handler.command = ['menup'];
handler.tags = ['main'];
handler.help = ['menup'];

module.exports = handler;