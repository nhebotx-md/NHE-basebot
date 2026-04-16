/**
 * =========================================
 * 📌 FILE: src/lib/buttonHelper.js (RECONSTRUCTED)
 * 📌 DESCRIPTION:
 * Helper module untuk membuat dan mengirim tombol interaktif
 * menggunakan format modern itsukichan Baileys
 *
 * 📁 MAPPING: Library/buttonHelper.js (original) → src/lib/buttonHelper.js
 * =========================================
 */

/**
 * Factory function untuk membuat berbagai jenis tombol interaktif
 * @param {Object} m - Message object dari WhatsApp
 * @param {Object} Obj - Object berisi conn (connection) dan q (quoted helper)
 * @returns {Object} - Object berisi sendFlow, sendInteractive, dan flow presets
 */
const buildButton = (m, Obj) => {
    
    const { conn, q } = Obj;

    /**
     * Menggunakan format modern interactiveButtons
     */
    const sendInteractive = async (text, interactiveButtons = [], opt = {}) => {
        const {
            type = 'fkontak',
            title = global.botname || "NHE BOT",
            body = "Interactive Menu",
            thumbnailUrl = "https://files.catbox.moe/5x2b8n.jpg",
            sourceUrl = "https://wa.me/62881027174423",
            footer = "© NHE SYSTEM"
        } = opt;

        const msg = {
            text,
            footer,
            interactiveButtons,
            headerType: 1,
            contextInfo: {
                externalAdReply: {
                    title,
                    body,
                    thumbnailUrl,
                    sourceUrl,
                    renderLargerThumbnail: true
                }
            }
        };

        return await conn.sendMessage(
            m.chat,
            msg,
            { quoted: q(type) }
        );
    };

    // Flow presets
    const flow = {};

    flow.quickReply = (displayText, id) => ([{
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
            display_text: displayText,
            id: id || displayText.toLowerCase().replace(/\s/g, '')
        })
    }]);

    flow.singleSelect = (title, sections = [], highlightLabel = "") => ([{
        name: "single_select",
        buttonParamsJson: JSON.stringify({
            title: title || "Pilih Menu",
            sections: sections.length ? sections : [{
                title: "Main Menu",
                rows: []
            }],
            ...(highlightLabel && { highlight_label: highlightLabel })
        })
    }]);

    flow.ctaUrl = (displayText, url) => ([{
        name: "cta_url",
        buttonParamsJson: JSON.stringify({
            display_text: displayText,
            url: url,
            merchant_url: url
        })
    }]);

    flow.ctaCall = (displayText, phone) => ([{
        name: "cta_call",
        buttonParamsJson: JSON.stringify({
            display_text: displayText,
            id: phone
        })
    }]);

    flow.menu = () => flow.singleSelect(
        "Select Menu",
        [{
            title: "Main Menu",
            rows: [
                { title: "📦 Panel", description: "Buka Panel", id: ".panel" },
                { title: "🤖 AI", description: "AI Assistant", id: ".ai" },
                { title: "🎮 Game", description: "Game Menu", id: ".game" }
            ]
        }]
    );

    flow.fullMenu = (botname = global.botname || "NHE BOT") => flow.singleSelect(
        "📂 All Menu",
        [
            {
                title: "Populer 🔥",
                rows: [
                    {
                        title: "🛒 STORE",
                        description: "Menu Store & Jualan",
                        id: ".storemenu"
                    }
                ]
            },
            {
                title: botname,
                rows: [
                    { title: "💻 PANEL", description: "Panel Management", id: ".panel" },
                    { title: "⬇️ DOWNLOAD", description: "Download Menu", id: ".downloadmenu" },
                    { title: "🔮 AI MENU", description: "AI Tools", id: ".aimenu" }
                ]
            }
        ]
    );

    flow.hybridMenu = (botname) => ([
        ...flow.quickReply("📋 Menu Utama", ".menu"),
        ...flow.quickReply("🔍 Cari", ".search"),
        ...flow.singleSelect(
            "📂 Full Menu",
            [
                {
                    title: "Populer 🔥",
                    rows: [{ title: "🛒 STORE", description: "Menu Store", id: ".storemenu" }]
                },
                {
                    title: botname || "NHE BOT",
                    rows: [
                        { title: "💻 PANEL", description: "Panel", id: ".panel" },
                        { title: "⬇️ DOWNLOAD", description: "Download", id: ".downloadmenu" },
                        { title: "🔮 AI", description: "AI Menu", id: ".aimenu" }
                    ]
                }
            ]
        ),
        ...flow.ctaUrl("🌐 Website", "https://example.com"),
        ...flow.ctaCall("📞 Hubungi Owner", "62881027174423")
    ]);

    return {
        sendFlow: sendInteractive,
        sendInteractive,
        flow
    };
};

module.exports = buildButton;
