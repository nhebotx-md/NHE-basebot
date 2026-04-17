/**
 * =========================================
 * 📌 PLUGIN: Dadu Game (Dice) - FIXED
 * 📌 FILE: Plugins-CJS/dadu-game.js
 * =========================================
 */

const handler = async (m, Obj) => {
    const { reply, conn, createReplyEngine, global } = Obj;

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
        // 🎲 DICE LOGIC
        // ======================
        const daduEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        const hasil = Math.floor(Math.random() * 6) + 1;
        const daduEmoji = daduEmojis[hasil - 1];

        // ======================
        // 🔄 ANIMATION (SAFE)
        // ======================
        await conn.sendMessage(m.chat, {
            text: `🎲 *ROLLING DICE...* 🎲`
        }, { quoted: m });

        await new Promise(r => setTimeout(r, 1000));

        // ======================
        // 📊 RESULT
        // ======================
        const resultText = `
🎲 *DICE ROLL RESULT* 🎲

${daduEmoji} *You rolled:* ${hasil}

${hasil === 6 ? '🎉 JACKPOT! Perfect roll!' : 
  hasil >= 4 ? '👍 Good roll!' : 
  hasil >= 2 ? '😐 Not bad!' : '😅 Better luck next time!'}
        `.trim();

        // ======================
        // 🔥 OUTPUT (UI)
        // ======================
        await engine.sendHybrid(m, {
            text: resultText,
            footer: "Dice Game",
            buttons: [
                { buttonId: ".dadu", buttonText: { displayText: "🎲 ROLL AGAIN" } },
                { buttonId: ".games", buttonText: { displayText: "🎮 MORE GAMES" } }
            ],
            ctx
        });

    } catch (err) {
        console.error('[DaduGame Error]', err);
        await reply('❌ Terjadi error pada dadu game');
    }
};

// ======================
handler.command = ['dadu', 'dice', 'roll'];
handler.tags = ['games', 'fun'];
handler.help = ['dadu'];

module.exports = handler;