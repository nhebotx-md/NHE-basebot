/**
 * =========================================
 * 📌 PLUGIN: Games & Fun dengan Interactive UI
 * 📌 FILE: Plugins-CJS/games-plugin.js
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
        // 🔹 FLOW CONFIG (SAFE)
        // ======================
        const flowConfig = {
            title: "Select Game",
            sections: [
                {
                    title: "🎯 TEBAK-TEBAKAN",
                    rows: [
                        {
                            title: "❓ Tebak Tebakan",
                            description: "Tebak-tebakan lucu",
                            id: ".tebakgame"
                        },
                        {
                            title: "🧩 Teka-teki",
                            description: "Pecahkan teka-teki",
                            id: ".tekateki"
                        }
                    ]
                },
                {
                    title: "🎲 RANDOM",
                    rows: [
                        {
                            title: "🎲 Dadu",
                            description: "Lempar dadu virtual",
                            id: ".dadu"
                        },
                        {
                            title: "🪙 Coin Flip",
                            description: "Lempar koin",
                            id: ".coin"
                        },
                        {
                            title: "🎱 Magic 8-Ball",
                            description: "Tanya pada bola ajaib",
                            id: ".8ball"
                        }
                    ]
                },
                {
                    title: "✏️ TULISAN",
                    rows: [
                        {
                            title: "🔠 Acak Huruf",
                            description: "Susun kata dari huruf acak",
                            id: ".susunkata"
                        },
                        {
                            title: "💭 Quotes",
                            description: "Random quotes inspiratif",
                            id: ".quotes"
                        }
                    ]
                }
            ]
        };

        // ======================
        // 🔹 VALIDASI FLOW
        // ======================
        if (!Array.isArray(flowConfig.sections)) {
            throw new Error('Flow config invalid');
        }

        // ======================
        // 🔹 SEND FLOW UI
        // ======================
        await engine.sendFlow(m, {
            text: `🎮 *GAMES & FUN MENU* 🎮\n\nHalo ${m.pushName || "User"}! Pilih game yang ingin dimainkan:`,
            footer: "Games System",
            buttonText: "🎮 PILIH GAME",
            flow: flowConfig,
            ctx
        });

    } catch (err) {
        console.error('[GamesPlugin Error]', err);
        await reply('❌ Terjadi error pada games plugin');
    }
};

// ✅ Metadata wajib
handler.command = ['games', 'game', 'fun'];
handler.tags = ['games', 'fun'];
handler.help = ['games'];

module.exports = handler;