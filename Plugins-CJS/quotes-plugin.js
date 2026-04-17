/**
 * =========================================
 * 📌 PLUGIN: Quotes Generator dengan UI
 * 📌 FILE: Plugins-CJS/quotes-plugin.js
 * =========================================
 */

const handler = async (m, Obj) => {
    const { reply, conn, createReplyEngine, global, text } = Obj;

    try {
        // Guard injection
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
        // 🔹 KATEGORI
        // ======================
        const kategori = text?.toLowerCase().trim();

        const quotesData = {
            motivasi: [
                { text: "Jangan menyerah, karena kesuksesan mungkin sudah dekat.", author: "Unknown" },
                { text: "Setiap hari adalah kesempatan baru untuk menjadi lebih baik.", author: "Unknown" },
                { text: "Kerja keras mengalahkan bakat ketika bakat tidak bekerja keras.", author: "Tim Notke" },
                { text: "Jadilah perubahan yang ingin kamu lihat di dunia.", author: "Mahatma Gandhi" },
                { text: "Kegagalan adalah awal dari kesuksesan.", author: "Unknown" }
            ],
            cinta: [
                { text: "Cinta sejati adalah ketika dua jiwa saling melengkapi.", author: "Unknown" },
                { text: "Jarak hanya menguji seberapa kuat cinta sejati.", author: "Unknown" },
                { text: "Cinta tidak perlu dipahami, cuma perlu dirasakan.", author: "Unknown" },
                { text: "Ketika cinta datang, logika pergi.", author: "Unknown" }
            ],
            lucu: [
                { text: "Saya tidak malas, saya sedang mode hemat energi.", author: "Unknown" },
                { text: "Diet itu berat, makanya saya makan dulu.", author: "Unknown" },
                { text: "Jangan terlalu serius, hidup ini cuma sementara.", author: "Unknown" },
                { text: "Saya rajin, rajin tidur.", author: "Unknown" }
            ],
            bijak: [
                { text: "Ilmu tanpa amal adalah batu, amal tanpa ilmu adalah kecelakaan.", author: "Imam Syafi'i" },
                { text: "Jika kamu tidak sanggup menahan lelahnya belajar, maka kamu harus sanggup menahan perihnya kebodohan.", author: "Imam Syafi'i" },
                { text: "Keberhasilan adalah kemampuan untuk melewati dan mengatasi dari satu kegagalan ke kegagalan berikutnya tanpa kehilangan semangat.", author: "Winston Churchill" }
            ],
            random: [
                { text: "Hidup ini singkat, jadikan setiap momen berarti.", author: "Unknown" },
                { text: "Jangan takut gagal, takutlah untuk tidak mencoba.", author: "Unknown" },
                { text: "Impian tidak menjadi kenyataan melalui sihir, butuh keringat dan tekad.", author: "Colin Powell" },
                { text: "Waktu adalah uang, tapi uang tidak bisa membeli waktu.", author: "Unknown" }
            ]
        };

        // ======================
        // 🔹 SELECT QUOTES
        // ======================
        let selectedQuotes;

        if (quotesData[kategori]) {
            selectedQuotes = quotesData[kategori];
        } else {
            selectedQuotes = Object.values(quotesData).flat();
        }

        // 🔥 HARDEN (ANTI EMPTY ARRAY)
        if (!selectedQuotes || selectedQuotes.length === 0) {
            throw new Error('Quotes data is empty');
        }

        const randomQuote =
            selectedQuotes[Math.floor(Math.random() * selectedQuotes.length)];

        const resultText = `
📜 *QUOTE OF THE DAY* 📜

❝ ${randomQuote.text} ❞

— *${randomQuote.author}*
        `.trim();

        // ======================
        // 🔹 OUTPUT UI
        // ======================
        await engine.sendHybrid(m, {
            text: resultText,
            footer: "Quotes System",
            buttons: [
                { buttonId: ".quotesplugin", buttonText: { displayText: "🔄 QUOTE LAIN" } },
                { buttonId: ".quotesplugin motivasi", buttonText: { displayText: "💪 MOTIVASI" } },
                { buttonId: ".quotesplugin lucu", buttonText: { displayText: "😂 LUCU" } }
            ],
            ctx
        });

    } catch (err) {
        console.error('[QuotesPlugin Error]', err);
        await reply('❌ Terjadi error pada quotes plugin');
    }
};

// ✅ Metadata wajib
handler.command = ['quotesplugin', 'qp', 'qplugin'];
handler.tags = ['fun', 'quotes'];
handler.help = ['quotesplugin'];

module.exports = handler;