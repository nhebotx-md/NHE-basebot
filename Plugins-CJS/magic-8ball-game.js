/**
 * =========================================
 * 📌 PLUGIN: Magic 8-Ball Game
 * 📌 FILE: Plugins-CJS/magic-8ball-game.js
 * =========================================
 */

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
        // 🔹 TANPA PERTANYAAN
        // ======================
        if (!text) {
            return await engine.sendHybrid(m, {
                text: `
🎱 *MAGIC 8-BALL* 🎱

Tanyakan sesuatu pada bola ajaib!

📋 *Cara pakai:*
▸ *.8ball Apakah saya beruntung hari ini?*
▸ *.8ball Should I go out today?*
▸ *.8ball Akan sukses?*

🎱 Bola ajaib akan menjawab pertanyaanmu!
                `.trim(),
                footer: "Magic 8-Ball",
                buttons: [
                    { buttonId: ".8ball Apakah saya beruntung?", buttonText: { displayText: "🎱 CONTOH" } }
                ],
                ctx
            });
        }

        // ======================
        // 🔹 DATA JAWABAN
        // ======================
        const jawaban = [
            { text: "🎱 *It is certain.*", type: "positive" },
            { text: "🎱 *It is decidedly so.*", type: "positive" },
            { text: "🎱 *Without a doubt.*", type: "positive" },
            { text: "🎱 *Yes definitely.*", type: "positive" },
            { text: "🎱 *You may rely on it.*", type: "positive" },
            { text: "🎱 *As I see it, yes.*", type: "positive" },
            { text: "🎱 *Most likely.*", type: "positive" },
            { text: "🎱 *Outlook good.*", type: "positive" },
            { text: "🎱 *Yes.*", type: "positive" },
            { text: "🎱 *Signs point to yes.*", type: "positive" },
            { text: "🎱 *Reply hazy, try again.*", type: "neutral" },
            { text: "🎱 *Ask again later.*", type: "neutral" },
            { text: "🎱 *Better not tell you now.*", type: "neutral" },
            { text: "🎱 *Cannot predict now.*", type: "neutral" },
            { text: "🎱 *Concentrate and ask again.*", type: "neutral" },
            { text: "🎱 *Don't count on it.*", type: "negative" },
            { text: "🎱 *My reply is no.*", type: "negative" },
            { text: "🎱 *My sources say no.*", type: "negative" },
            { text: "🎱 *Outlook not so good.*", type: "negative" },
            { text: "🎱 *Very doubtful.*", type: "negative" }
        ];

        // 🔥 HARDEN
        if (!Array.isArray(jawaban) || jawaban.length === 0) {
            throw new Error('Jawaban data kosong');
        }

        const randomJawaban =
            jawaban[Math.floor(Math.random() * jawaban.length)];

        // ======================
        // 🔹 ANIMASI (SAFE)
        // ======================
        try {
            await conn.sendMessage(m.chat, {
                text: `🎱 *SHAKING THE BALL...* 🎱`
            }, { quoted: m });
        } catch {}

        await new Promise(r => setTimeout(r, 2000));

        // ======================
        // 🔹 RESULT
        // ======================
        const resultText = `
🎱 *MAGIC 8-BALL* 🎱

❓ *Question:*
${text}

${randomJawaban.text}
        `.trim();

        await engine.sendHybrid(m, {
            text: resultText,
            footer: "Magic 8-Ball",
            buttons: [
                { buttonId: ".8ball", buttonText: { displayText: "🎱 ASK AGAIN" } },
                { buttonId: ".games", buttonText: { displayText: "🎮 MORE GAMES" } }
            ],
            ctx
        });

    } catch (err) {
        console.error('[Magic8Ball Error]', err);
        await reply('❌ Terjadi error pada magic 8-ball');
    }
};

// ✅ Metadata wajib
handler.command = ['8ball', 'magicball', 'ask'];
handler.tags = ['games', 'fun'];
handler.help = ['8ball'];

module.exports = handler;