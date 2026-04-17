/**
 * =========================================
 * 📌 PLUGIN: Fake Quoted Demo (FIXED)
 * 📌 FILE: Plugins-CJS/fakequote-demo-plugin.js
 * =========================================
 */

const { q, fakeQuoted } = require('../src/lib/fakeQuoted');
const handler = async (m, Obj) => {
    const { reply, conn, createReplyEngine, global, text } = Obj;

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
        // 🔹 ALL TYPE (FULL SUPPORT)
        // ======================
        const fakeTypes = [
            'fkontak', 'fvn', 'fgif',
            'fimg', 'fdoc', 'forder',
            'floc', 'ftext', 'fproduct'
        ];

        const args = typeof text === 'string'
            ? text.split('|').map(v => v.trim())
            : [];

        const selectedType = args[0]?.toLowerCase() || 'random';
        const customText = args[1] || 'Ini adalah fake quoted message!';

        let typeToUse;

        if (selectedType === 'random') {
            typeToUse = fakeTypes[Math.floor(Math.random() * fakeTypes.length)];
        } else if (fakeTypes.includes(selectedType)) {
            typeToUse = selectedType;
        } else {
            // ======================
            // 🔹 LIST UI
            // ======================
            return await engine.sendListUI(m, {
                title: "📌 FAKE QUOTED DEMO",
                body: `
Pilih tipe fake quoted yang ingin dicoba:

Tersedia:
${fakeTypes.map(t => `▸ ${t}`).join('\n')}

📋 Cara pakai:
*.fakequotedemo [type] | [text]*

📌 Contoh:
*.fakequotedemo fkontak | Halo!*
                `.trim(),
                footer: "Fake Quoted Demo",
                buttonText: "📋 PILIH TIPE",
                sections: [
                    {
                        title: "FAKE TYPES",
                        rows: fakeTypes.map(t => ({
                            title: t.toUpperCase(),
                            description: `Demo fake ${t}`,
                            rowId: `.fakequotedemo ${t} | ${customText}`
                        }))
                    }
                ],
                ctx
            });
        }

        // ======================
        // 🔥 PAKAI fakeQuoted.js (INI FIX UTAMA)
        // ======================
        const fake = await q(m, typeToUse, {
            text: customText,
            caption: customText,
            title: customText
        });

        // ======================
        // 🔹 SEND
        // ======================
        await conn.sendMessage(m.chat, {
            text: `🎭 *FAKE QUOTED DEMO*\n\n📌 *Type:* ${typeToUse}\n💬 *Message:* ${customText}`
        }, {
            quoted: fake
        });

        // ======================
        // 🔹 UI RESULT
        // ======================
        await engine.sendHybrid(m, {
            text: `
✅ *Fake Quoted Berhasil Dikirim!*

📌 *Type:* ${typeToUse}
💬 *Text:* ${customText}

🎭 Fake quoted membuat pesan terlihat
seolah-olah dibalas dari pesan lain.
            `.trim(),
            footer: "Fake Quoted Demo",
            buttons: [
                { buttonId: ".fakequotedemo random", buttonText: { displayText: "🎲 RANDOM" } },
                { buttonId: ".fakequotedemo", buttonText: { displayText: "📋 PILIH TIPE" } }
            ],
            ctx
        });

    } catch (err) {
        console.error('[FakeQuotedDemo Error]', err);
        await reply('❌ Terjadi error pada fake quoted demo');
    }
};

// ======================
handler.command = ['fakequotedemo', 'fqdemo', 'fkdemo'];
handler.tags = ['tools', 'demo'];
handler.help = ['fakequotedemo'];

module.exports = handler;