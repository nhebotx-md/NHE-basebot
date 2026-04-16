/**
 * =========================================
 * 📌 FILE: src/command/handler.js (RECONSTRUCTED)
 * 📌 DESCRIPTION:
 * Handler utama untuk memuat dan mengeksekusi plugins
 * dengan support reply mode (button/text)
 *
 * 📁 MAPPING: Library/handler.js (original) → src/command/handler.js
 * =========================================
 */

const fs = require("fs");
const path = require("path");
const buildButton = require("../lib/buttonHelper");
const { getUserReplyMode } = require('../lib/replyMode');
const { replyAdaptive, sendSimpleText, sendWithExternalAd, getUserMode } = require('../lib/replyAdaptive');

// Cache untuk plugins
let pluginsCache = null;

/**
 * Fungsi untuk memuat semua plugins dari folder Plugins-CJS
 * @returns {Array} - Array plugins dengan metadata
 */
const loadPlugins = async () => {
    const dir = path.join(__dirname, "../../Plugins-CJS");
    const plugins = [];
    const pluginsByTag = new Map();

    const normalizeTags = (tags) => {
        if (!Array.isArray(tags)) return [];
        return [...new Set(
            tags
                .map(t => String(t || "").trim().toLowerCase())
                .filter(Boolean)
        )];
    };

    const addToTagIndex = (tag, plugin) => {
        const key = String(tag || "").trim().toLowerCase();
        if (!key) return;
        if (!pluginsByTag.has(key)) pluginsByTag.set(key, []);
        pluginsByTag.get(key).push(plugin);
    };

    if (!fs.existsSync(dir)) {
        console.warn("Folder 'Plugins-CJS' tidak ditemukan.");
        plugins.byTag = pluginsByTag;
        return plugins;
    }

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        if (!filePath.endsWith(".js")) continue;

        try {
            const resolved = require.resolve(filePath);
            if (require.cache[resolved]) {
                delete require.cache[resolved];
            }
            const plugin = require(filePath);
            if (typeof plugin === "function" && Array.isArray(plugin.command)) {
                const tags = normalizeTags(plugin.tags);
                plugin.tags = tags;
                plugin.help = Array.isArray(plugin.help) ? plugin.help : [];
                plugin._file = file;
                plugin._path = filePath;
                plugin._category = tags[0] || "uncategorized";
                plugins.push(plugin);
                if (tags.length) {
                    tags.forEach(tag => addToTagIndex(tag, plugin));
                } else {
                    addToTagIndex("uncategorized", plugin);
                }
            } else {
                console.warn(`Plugin '${file}' tidak valid`);
            }
        } catch (err) {
            console.error(`❌ Gagal load plugin: ${file}`, err);
        }
    }

    plugins.byTag = pluginsByTag;
    plugins.getByTag = (tag) => pluginsByTag.get(String(tag || "").toLowerCase()) || [];
    plugins.tags = [...pluginsByTag.keys()];

    return plugins;
};

/**
 * Handler utama untuk memproses pesan dan mengeksekusi plugins
 * @param {Object} m - Message object
 * @param {string} commandText - Command yang dijalankan user
 * @param {Object} Obj - Object berisi conn dan utilities
 */
const handleMessage = async (m, commandText, Obj = {}) => {
    if (!Obj || typeof Obj !== "object") Obj = {};
    Obj.conn = Obj.conn || global.conn || m?.conn;
    if (!Obj.conn) {
        console.error("❌ conn tidak ditemukan!");
        return;
    }

    if (!pluginsCache) {
        pluginsCache = await loadPlugins();
        console.log("✅ Plugins loaded:", pluginsCache.length);
        console.log("📦 Tags:", pluginsCache.tags);
    }
    Obj.plugins = pluginsCache;
    global.plugins = pluginsCache;

    const smartReply = async (text, options = {}) => {
        const userMode = getUserMode(m.sender);
        
        if (userMode === 'button' && !options.forceText) {
            try {
                return await Obj.conn.sendMessage(m.chat, {
                    text: text,
                    mentions: options.mentions || [],
                    contextInfo: {
                        mentionedJid: options.mentions || [],
                        externalAdReply: {
                            title: options.title || global.botname || "NHE BOT",
                            body: options.body || "Verified System",
                            thumbnailUrl: options.thumbnailUrl || "https://files.catbox.moe/5x2b8n.jpg",
                            sourceUrl: options.sourceUrl || "https://wa.me/62881027174423",
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: options.quoted || m });
            } catch (err) {
                console.error('❌ Button reply failed, falling back to text:', err);
            }
        }
        
        return await Obj.conn.sendMessage(m.chat, {
            text: text,
            mentions: options.mentions || []
        }, { quoted: options.quoted || m });
    };

    Obj.smartReply = smartReply;
    Obj.getUserMode = getUserMode;
    Obj.replyAdaptive = (content) => replyAdaptive(m, Obj, content);
    Obj.sendSimpleText = (text, options) => sendSimpleText(m, Obj, text, options);
    Obj.sendWithExternalAd = (text, options) => sendWithExternalAd(m, Obj, text, options);

    Obj.q = (type = 'fkontak', opt = {}) => {
        const allowed = [
            'fkontak','fgif','fimg','fdoc',
            'fvn','ftext','floc','forder','fproduct'
        ];
        if (!allowed.includes(type)) type = 'fkontak';
        return global.q(m, type, opt);
    };

    Obj.fakeQuoted = (opt = {}) => global.fakeQuoted(m, opt);

    Obj.sendUI = async (text, opt = {}) => {
        const {
            type = 'fkontak',
            title = global.botname || "NHE BOT",
            body = "Verified System",
            thumbnailUrl = "https://files.catbox.moe/6n4pkg.jpg",
            sourceUrl = "https://wa.me/62881027174423",
            showAd = true,
            read = true,
            typing = true,
            delay = 600
        } = opt;

        try {
            if (read && m.key) {
                try { await Obj.conn.readMessages([m.key]); } catch {}
            }
            if (typing) {
                try { await Obj.conn.sendPresenceUpdate('composing', m.chat); } catch {}
                await new Promise(r => setTimeout(r, delay));
            }
            const msg = {
                text,
                contextInfo: showAd ? {
                    externalAdReply: {
                        title,
                        body,
                        mediaType: 1,
                        previewType: 0,
                        renderLargerThumbnail: true,
                        thumbnailUrl,
                        sourceUrl
                    }
                } : {}
            };
            return await Obj.conn.sendMessage(m.chat, msg, {
                quoted: Obj.q(type)
            });
        } catch (err) {
            console.error("❌ UI Engine Error:", err);
            return Obj.conn.sendMessage(m.chat, {
                text: "⚠️ UI gagal\n" + (err.message || "")
            }, {
                quoted: Obj.q('fkontak')
            });
        }
    };

    Obj.ui = {
        system: async (text, opt = {}) => {
            return Obj.conn.sendMessage(m.chat, {
                text,
                contextInfo: {
                    externalAdReply: {
                        title: opt.title || "NHE SYSTEM ✔️",
                        body: opt.body || "System Notification",
                        thumbnailUrl: opt.thumb || "https://files.catbox.moe/5x2b8n.jpg",
                        sourceUrl: opt.url || "https://example.com",
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: Obj.q('fkontak') });
        },

        broadcast: async (text) => {
            return Obj.conn.sendMessage(m.chat, { text }, {
                quoted: {
                    key: {
                        participant: "0@s.whatsapp.net",
                        remoteJid: "status@broadcast",
                        fromMe: false
                    },
                    message: { conversation: "Broadcast Message" }
                }
            });
        },

        forwarded: async (text) => {
            return Obj.conn.sendMessage(m.chat, {
                text,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true
                }
            }, { quoted: Obj.q('ftext') });
        },

        ai: async (text) => {
            return Obj.sendUI(text, {
                title: "NHE AI ✔️",
                body: "Smart Assistant",
                type: "ftext"
            });
        },

        alert: async (text) => {
            return Obj.conn.sendMessage(m.chat, {
                text: `⚠️ ${text}`,
                contextInfo: {
                    externalAdReply: {
                        title: "SYSTEM ALERT ⚠️",
                        body: "Warning",
                        thumbnailUrl: "https://files.catbox.moe/5x2b8n.jpg",
                        sourceUrl: "https://example.com",
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: Obj.q('fkontak') });
        },

        tag: async (text) => {
            return Obj.conn.sendMessage(m.chat, {
                text: `@${m.sender.split("@")[0]} ${text}`,
                mentions: [m.sender]
            }, { quoted: Obj.q('fkontak') });
        },

        random: async (text) => {
            const modes = ['system', 'forwarded', 'ai'];
            const pick = modes[Math.floor(Math.random() * modes.length)];
            return Obj.ui[pick](text);
        }
    };

    Obj.ui.panel = async (title = "NHE DASHBOARD") => {
        await Obj.conn.sendPresenceUpdate('composing', m.chat);
        await new Promise(r => setTimeout(r, 600));
        await Obj.conn.sendMessage(m.chat, {
            text: "```Loading system...```"
        }, { quoted: Obj.q('ftext') });
        await new Promise(r => setTimeout(r, 800));
        await Obj.conn.sendMessage(m.chat, {
            text: `╭───〔 ${title} 〕───⬣`,
            contextInfo: {
                externalAdReply: {
                    title: "NHE SYSTEM ✔️",
                    body: "Interactive Panel",
                    thumbnailUrl: "https://files.catbox.moe/5x2b8n.jpg",
                    sourceUrl: "https://wa.me/62881027174423",
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: Obj.q('fkontak') });
    };

    try {
        Obj.button = buildButton(m, Obj);
    } catch (err) {
        console.error("❌ ButtonHelper error:", err);
        Obj.button = {};
    }

    const plugins = pluginsCache;

    for (const plugin of plugins) {
        if (
            plugin.command
                .map(c => c.toLowerCase())
                .includes(commandText.toLowerCase())
        ) {
            try {
                await plugin(m, Obj);
            } catch (err) {
                console.error(`❌ Error plugin '${commandText}':`, err);
                await Obj.conn.sendMessage(m.chat, {
                    text: "❌ Terjadi error saat menjalankan command"
                }, {
                    quoted: Obj.q('fkontak')
                });
            }
            break;
        }
    }
};

module.exports = handleMessage;
