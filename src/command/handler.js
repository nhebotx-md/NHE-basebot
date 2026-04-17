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
let pluginRegistry = {
    list: [],
    byTag: new Map()
};
const syncPlugins = () => {
const dir = path.join(__dirname, "../../Plugins-CJS");

const files = fs.readdirSync(dir)  
    .filter(f => f.endsWith('.js'))  
    .map(f => path.join(dir, f));  

const currentPaths = new Set(files);  

// 🔥 HAPUS YANG SUDAH TIDAK ADA  
pluginRegistry.list = pluginRegistry.list.filter(p => {  
    if (!currentPaths.has(p._path)) {  
        console.log("🗑️ Auto remove (sync):", p._file);  
        return false;  
    }  
    return true;  
});  

// 🔥 REBUILD TAG  
const newMap = new Map();  

for (const plugin of pluginRegistry.list) {  
    const tags = plugin.tags || ['uncategorized'];  

    for (const tag of tags) {  
        const key = String(tag).toLowerCase();  

        if (!newMap.has(key)) newMap.set(key, []);  
        newMap.get(key).push(plugin);  
    }  
}  

pluginRegistry.byTag = newMap;

};
//helper rebuild tag//
const rebuildTagIndex = (plugins) => {
    const map = new Map();
syncPlugins();
    for (const plugin of plugins) {
        if (!plugin.tags || !plugin.tags.length) {
            const key = "uncategorized";
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(plugin);
            continue;
        }

        for (const tag of plugin.tags) {
            const key = tag.toLowerCase();
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(plugin);
        }
    }

    return map;
};

//reload single plugin
const reloadSinglePlugin = (filePath) => {
    try {
        const resolved = require.resolve(filePath);

        if (require.cache[resolved]) {
            delete require.cache[resolved];
        }

        const plugin = require(filePath);

        if (typeof plugin !== "function" || !Array.isArray(plugin.command)) {
            return null;
        }

        const tags = Array.isArray(plugin.tags)
            ? [...new Set(plugin.tags.map(t => String(t).toLowerCase().trim()))]
            : [];

        plugin.tags = tags;
        plugin.help = Array.isArray(plugin.help) ? plugin.help : [];
        plugin._file = path.basename(filePath);
        plugin._path = filePath;
        plugin._category = tags[0] || "uncategorized";

        return plugin;

    } catch (err) {
        console.error("Reload gagal:", filePath, err);
        return null;
    }
};

// upsert && remove plugin
const upsertPlugin = (plugin) => {
    pluginRegistry.list = pluginRegistry.list.filter(p => p._path !== plugin._path);
    pluginRegistry.list.push(plugin);

    // 🔥 rebuild ulang
    const newMap = new Map();

    for (const p of pluginRegistry.list) {
        const tags = p.tags || ['uncategorized'];

        for (const tag of tags) {
            const key = String(tag).toLowerCase();

            if (!newMap.has(key)) newMap.set(key, []);
            newMap.get(key).push(p);
        }
    }

    pluginRegistry.byTag = newMap;

    console.log("♻️ Plugin updated:", plugin._file);
};

const removePlugin = (filePath) => {
    // hapus dari list utama
    pluginRegistry.list = pluginRegistry.list.filter(p => p._path !== filePath);

    // 🔥 rebuild ulang byTag (INI KUNCI)
    const newMap = new Map();

    for (const plugin of pluginRegistry.list) {
        const tags = plugin.tags || ['uncategorized'];

        for (const tag of tags) {
            const key = String(tag).toLowerCase();

            if (!newMap.has(key)) newMap.set(key, []);
            newMap.get(key).push(plugin);
        }
    }

    pluginRegistry.byTag = newMap;

    console.log("🗑️ Plugin removed & registry cleaned:", filePath);
};


// watcher (core hot reload) //
const watchPlugins = (dir) => {
    const scan = (folder) => {
        fs.watch(folder, (eventType, filename) => {
            if (!filename || !filename.endsWith(".js")) return;

            const fullPath = path.join(folder, filename);

            setTimeout(() => {
                if (fs.existsSync(fullPath)) {
                    const plugin = reloadSinglePlugin(fullPath);
                    if (plugin) {
                        upsertPlugin(plugin);
                        console.log("♻️ Reload:", filename);
                    }
                } else {
                    removePlugin(fullPath);
                    console.log("🗑️ Removed:", filename);
                }
            }, 100);
        });

        const items = fs.readdirSync(folder);
        for (const item of items) {
            const full = path.join(folder, item);
            if (fs.statSync(full).isDirectory()) {
                scan(full);
            }
        }
    };

    scan(dir);
};

// intergrasi sistem plugin
const initPluginSystem = async () => {
    const plugins = await loadPlugins();

    pluginRegistry.list = plugins;
    pluginRegistry.byTag = plugins.byTag;

    const dir = path.join(__dirname, "../../Plugins-CJS");
    watchPlugins(dir);

    console.log("🔥 Hot reload aktif");

    return pluginRegistry;
};

/**
 * Fungsi untuk memuat semua plugins dari folder Plugins-CJS
 * @returns {Array} - Array plugins dengan metadata
 */
const getAllPluginFiles = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);

    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            results = results.concat(getAllPluginFiles(filePath));
        } else if (filePath.endsWith(".js")) {
            results.push(filePath);
        }
    }

    return results;
};

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

    const files = getAllPluginFiles(dir);

for (const filePath of files) {
    const file = path.basename(filePath);

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
    pluginRegistry.list = pluginsCache;
    pluginRegistry.byTag = pluginsCache.byTag;

    console.log("✅ Plugins loaded:", pluginsCache.length);
    console.log("📦 Tags:", pluginsCache.tags);
}

// 🔥 START WATCHER SEKALI SAJA
if (!global.__pluginWatcherStarted) {
    const dir = path.join(__dirname, "../../Plugins-CJS");
    watchPlugins(dir);
    global.__pluginWatcherStarted = true;
    console.log("🔥 Hot reload aktif");
}
    Obj.plugins = {
    list: pluginRegistry.list,
    byTag: pluginRegistry.byTag
};

global.plugins = Obj.plugins;

global.plugins = Obj.plugins;
pluginsCache = pluginRegistry.list;

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

    const plugins = pluginRegistry.list;

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
