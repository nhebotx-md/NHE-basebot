/**
 * =========================================
 * 📌 FILE: src/core/WhosTANG.js (RECONSTRUCTED)
 * 📌 DESCRIPTION:
 * File utama handler command bot WhatsApp
 * Versi Clean Architecture - Rebuild from scratch
 *
 * Berisi:
 * - Routing command (switch-case)
 * - Feature handlers (menu, download, group, owner, dll)
 * - Reply mode management
 * - Plugin integration
 * - Eval & shell commands
 *
 * 📁 MAPPING: WhosTANG.js (original) → src/core/WhosTANG.js
 * =========================================
 */

// =========================================
// 📌 CLEAR CONSOLE & INITIAL SETUP
// =========================================
console.clear();

// =========================================
// 📌 IMPORT / REQUIRE
// =========================================
require('../config/config');

const { description, version, name, main } = require("../../package.json");

const { 
    default: baileys, 
    downloadContentFromMessage, 
    proto, 
    generateWAMessage, 
    getContentType, 
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    GroupSettingChange,
    areJidsSameUser,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    makeWaSocket,
    makeInMemoryStore,
    useSingleFileAuthState,
    BufferJSON,
    WAFlag,
    ChatModification,
    ReconnectMode,
    ProxyAgent,
    isBaileys,
    DisconnectReason,
    getStream,
    templateMessage
} = require("@itsukichan/baileys");

const fs = require('fs');
const util = require('util');
const chalk = require('chalk');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment-timezone');
const { spawn, exec } = require('child_process');
const babel = require('@babel/core');
const yts = require('yt-search');

// =========================================
// 📌 REPLY MODE MODULE - IMPORT
// =========================================
const { 
    getUserReplyMode, 
    setUserReplyMode, 
    isUserExists,
    getReplyModeStats,
    initReplyMode 
} = require('../lib/replyMode');

initReplyMode();

// =========================================
// 📌 MESSAGE UTILITIES - IMPORT
// =========================================
const { 
    smsg, 
    tanggal, 
    getTime, 
    isUrl, 
    sleep, 
    clockString, 
    runtime, 
    fetchJson, 
    getBuffer, 
    jsonformat, 
    format, 
    parseMention, 
    getRandom, 
    getGroupAdm, 
    generateProfilePicture 
} = require('../utils/message');

// =========================================
// 📌 CONFIG FILES & LIBRARIES
// =========================================
const { CatBox, TelegraPh, UploadFileUgu, webp2mp4File, floNime, uptotelegra } = require('../lib/uploader');
const SaveTube = require('../lib/savetube');
const ytdl = new SaveTube();
const Case = require("../lib/system");

// =========================================
// 📌 CONSTANTS - FILE PATHS
// =========================================
const OWNER_PATH = './data/owner.json';
const PREMIUM_PATH = './data/premium.json';

// =========================================
// 📌 GLOBAL VARIABLES / CONFIG
// =========================================
global.userReplyModes = {};
global.pendingReplyModeSelection = new Set();

// =========================================
// 📌 CORE LOGIC / MAIN FUNCTIONS
// =========================================

/**
 * Handler utama untuk semua pesan masuk
 * @param {Object} WhosTANG - WhatsApp socket instance
 * @param {Object} m - Serialized message object
 * @param {Object} chatUpdate - Chat update event object
 * @param {Object} store - In-memory store
 */
module.exports = WhosTANG = async (WhosTANG, m, chatUpdate, store) => {
    try {
        // =========================================
        // MESSAGE TYPE DETECTION
        // =========================================
        let body = '';
        
        const messageTypes = {
            conversation: m.message?.conversation || '[Conversation]',
            imageMessage: m.message?.imageMessage?.caption || '[Image]',
            videoMessage: m.message?.videoMessage?.caption || '[Video]',
            audioMessage: m.message?.audioMessage?.caption || '[Audio]',
            stickerMessage: m.message?.stickerMessage?.caption || '[Sticker]',
            documentMessage: m.message?.documentMessage?.fileName || '[Document]',
            contactMessage: '[Contact]',
            locationMessage: m.message?.locationMessage?.name || '[Location]',
            liveLocationMessage: '[Live Location]',
            extendedTextMessage: m.message?.extendedTextMessage?.text || '[Extended Text]',
            buttonsResponseMessage: m.message?.buttonsResponseMessage?.selectedButtonId || '[Button Response]',
            listResponseMessage: m.message?.listResponseMessage?.singleSelectReply?.selectedRowId || '[List Response]',
            templateButtonReplyMessage: m.message?.templateButtonReplyMessage?.selectedId || '[Template Button Reply]',
            interactiveResponseMessage: '[Interactive Response]',
            pollCreationMessage: '[Poll Creation]',
            reactionMessage: m.message?.reactionMessage?.text || '[Reaction]',
            ephemeralMessage: '[Ephemeral]',
            viewOnceMessage: '[View Once]',
            productMessage: m.message?.productMessage?.product?.name || '[Product]'
        };

        if (m.mtype && messageTypes[m.mtype]) {
            body = messageTypes[m.mtype];
        } else if (m.message?.messageContextInfo) {
            body = m.message.buttonsResponseMessage?.selectedButtonId || 
                   m.message.listResponseMessage?.singleSelectReply?.selectedRowId || 
                   m.text || 
                   '[Message Context]';
        } else {
            body = '[Unknown Type]';
        }

        // =========================================
        // SENDER & CHAT INFO
        // =========================================
        const sender = m.key.fromMe 
            ? WhosTANG.user.id.split(":")[0] + "0@s.whatsapp.net" || WhosTANG.user.id
            : m.key.participant || m.key.remoteJid;
        const senderNumber = sender.split('@')[0];
        const budy = (typeof m.text === 'string' ? m.text : '');
        const prefa = ["", "!", ".", ",", "🐤", "🗿"];

        // =========================================
        // PREFIX DETECTION
        // =========================================
        const prefixRegex = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><`™©®Δ^βα~¦|/\©^]/;
        const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : ``;
        const from = m.key.remoteJid;
        const isGroup = from.endsWith("@g.us");
        const isPrivate = from.endsWith("@s.whatsapp.net");

        // =========================================
        // LOAD DATA FILES
        // =========================================
        const premium = JSON.parse(fs.readFileSync("./data/premium.json"));
        const kontributor = JSON.parse(fs.readFileSync('./data/owner.json'));
        const botNumber = await WhosTANG.decodeJid(WhosTANG.user.id);
        
        // =========================================
        // PERMISSION CHECKS
        // =========================================
        const isOwner = [botNumber, ...kontributor, ...global.owner]
            .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
            .includes(m.sender);
        const buffer64base = "62881027174423@s.whatsapp.net";
        const isCmd = body?.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
        const cmd = prefix + command;
        const args = (body || '').trim().split(/ +/).slice(1);
        const pushname = m.pushName || "No Name";
        const WhosTANGdev = (m && m.sender && [botNumber, ...global.owner]
            .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
            .includes(m.sender)) || false;
        const isPremium = premium.includes(m.sender);
        const text = args.join(" ");
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';
        const qmsg = (quoted.msg || quoted);
        const isMedia = /image|video|sticker|audio/.test(mime);

        // =========================================
        // GROUP METADATA
        // =========================================
        const groupMetadata = m?.isGroup 
            ? await WhosTANG.groupMetadata(m.chat).catch(() => ({})) 
            : {};
        const groupName = m?.isGroup ? groupMetadata.subject || '' : '';
        const participants = m?.isGroup 
            ? groupMetadata.participants?.map(p => {
                let admin = null;
                if (p.admin === 'superadmin') admin = 'superadmin';
                else if (p.admin === 'admin') admin = 'admin';
                return {
                    id: p.id || null,
                    jid: p.jid || null,
                    lid: p.lid || null,
                    admin,
                    full: p
                };
            }) || []
            : [];
        const groupOwner = m?.isGroup 
            ? participants.find(p => p.admin === 'superadmin')?.jid || '' 
            : '';
        const groupAdmins = participants
            .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
            .map(p => p.jid || p.id);
        const isBotAdmins = m?.isGroup ? groupAdmins.includes(botNumber) : false;
        const isAdmins = m?.isGroup ? groupAdmins.includes(m.sender) : false;
        const isGroupOwner = m?.isGroup ? groupOwner === m.sender : false;
        const senderLid = (() => {
            const p = participants.find(p => p.jid === m.sender);
            return p?.lid || null;
        })();

        // =========================================
        // 📌 REPLY MODE HELPER FUNCTIONS
        // =========================================
        const isNewUser = (userId) => {
            return !isUserExists(userId);
        };

        const sendReplyModeSelection = async (userId, chatId) => {
            const selectionText = `🤖 *Selamat Datang di ${global.botname || 'NHE BOT'}!*

Halo @${userId.split('@')[0]}! 👋

Sebelum kita mulai, pilih mode reply yang kamu suka:

📋 *Mode Button* - Reply dengan tombol interaktif (modern, stylish)
📝 *Mode Text* - Reply dengan text biasa (simple, cepat)

Pilih sesuai preferensi kamu ya! 😊`;

            const buttons = [
                {
                    buttonId: 'replymode_button',
                    buttonText: { displayText: '📋 Mode Button' },
                    type: 1
                },
                {
                    buttonId: 'replymode_text',
                    buttonText: { displayText: '📝 Mode Text' },
                    type: 1
                }
            ];

            try {
                await WhosTANG.sendMessage(chatId, {
                    text: selectionText,
                    buttons: buttons,
                    headerType: 1,
                    mentions: [userId],
                    contextInfo: {
                        mentionedJid: [userId],
                        externalAdReply: {
                            title: "Pilih Mode Reply",
                            body: "Button atau Text?",
                            thumbnailUrl: "https://files.catbox.moe/5x2b8n.jpg",
                            sourceUrl: "https://wa.me/62881027174423",
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: m });
                
                global.pendingReplyModeSelection.add(userId);
                return true;
            } catch (err) {
                console.error('❌ Error sending reply mode selection:', err);
                setUserReplyMode(userId, 'text');
                return false;
            }
        };

        const handleReplyModeResponse = async (response, userId) => {
            if (!global.pendingReplyModeSelection.has(userId)) return false;
            
            let selectedMode = null;
            
            if (response === 'replymode_button' || response.includes('button')) {
                selectedMode = 'button';
            } else if (response === 'replymode_text' || response.includes('text')) {
                selectedMode = 'text';
            }
            
            if (selectedMode) {
                setUserReplyMode(userId, selectedMode);
                global.pendingReplyModeSelection.delete(userId);
                
                const confirmText = selectedMode === 'button' 
                    ? `✅ *Mode Button Aktif!*\n\nSekarang semua reply akan menggunakan tombol interaktif.\n\nKetik *.menu* untuk melihat fitur bot!`
                    : `✅ *Mode Text Aktif!*\n\nSekarang semua reply akan menggunakan text biasa.\n\nKetik *.menu* untuk melihat fitur bot!`;
                
                await WhosTANG.sendMessage(m.chat, { 
                    text: confirmText,
                    mentions: [userId]
                }, { quoted: m });
                
                return true;
            }
            
            return false;
        };

        const getUserMode = (userId) => {
            const userData = getUserReplyMode(userId);
            return userData?.mode || 'text';
        };

        const smartReply = async (text, options = {}) => {
            const userMode = getUserMode(m.sender);
            
            if (userMode === 'button' && !options.forceText) {
                try {
                    return await WhosTANG.sendMessage(m.chat, {
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
            
            return await WhosTANG.sendMessage(m.chat, {
                text: text,
                mentions: options.mentions || []
            }, { quoted: options.quoted || m });
        };

        // =========================================
        // CHECK REPLY MODE BUTTON RESPONSE
        // =========================================
        const buttonResponse = m.message?.buttonsResponseMessage?.selectedButtonId || 
                               m.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
        
        if (buttonResponse) {
            if (await handleReplyModeResponse(buttonResponse, m.sender)) {
                return;
            }
        }

        // =========================================
        // CHECK NEW USER BEFORE PROCESSING COMMAND
        // =========================================
        if (isCmd && isNewUser(m.sender) && !global.pendingReplyModeSelection.has(m.sender)) {
            const skipCommands = ['menu', 'start', 'help', 'owner', 'ping'];
            if (!skipCommands.includes(command)) {
                await sendReplyModeSelection(m.sender, m.chat);
                return;
            }
        }

        // =========================================
        // BASIC REPLY FUNCTION (for compatibility)
        // =========================================
        const reply = (teks) => {
            return smartReply(teks);
        };

        // =========================================
        // IMPORT ADDITIONAL FUNCTIONS
        // =========================================
        const {
            formatSize,
            randomKarakter
        } = require('../lib/myfunction');

        // =========================================
        // TIME & DATE SETUP
        // =========================================
        const time = moment().tz("Asia/Jakarta").format("HH:mm:ss");
        let ucapanWaktu = "🌆𝐒𝐞𝐥𝐚𝐦𝐚𝐭 𝐒𝐮𝐛𝐮𝐡";
        
        if (time >= "19:00:00" && time < "23:59:59") {
            ucapanWaktu = "🌃𝐒𝐞𝐥𝐚𝐦𝐚𝐭 𝐌𝐚𝐥𝐚𝐦";
        } else if (time >= "15:00:00" && time < "19:00:00") {
            ucapanWaktu = "🌄𝐒𝐞𝐥𝐚𝐦𝐚𝐭 𝐒𝐨𝐫𝐞";
        } else if (time >= "11:00:00" && time < "15:00:00") {
            ucapanWaktu = "🏞️𝐒𝐞𝐥𝐚𝐦𝐚𝐭 𝐒𝐢𝐚𝐧𝐠";
        } else if (time >= "06:00:00" && time < "11:00:00") {
            ucapanWaktu = "🏙️𝐒𝐞𝐥𝐚𝐦𝐚𝐭 𝐏𝐚𝐠𝐢";
        }

        const todayDateWIB = new Date().toLocaleDateString('id-ID', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // =========================================
        // ESM TO CJS CONVERTER FUNCTION
        // =========================================
        function convertEsmToCjs(code) {
            let out = code;

            out = out.replace(
                /import\s+([A-Za-z0-9_$]+)\s+from\s+(['"`][^'"`]+['"`]);?/g,
                (m, def, mod) => `const ${def} = require(${mod});`
            );

            out = out.replace(
                /import\s+\{\s*([^}]+)\s*\}\s+from\s+(['"`][^'"`]+['"`]);?/g,
                (m, list, mod) => {
                    const mapped = list
                        .split(',')
                        .map(s => s.trim().replace(/\s+as\s+/i, ': '))
                        .join(', ');
                    return `const { ${mapped} } = require(${mod});`;
                }
            );

            out = out.replace(
                /import\s+\*\s+as\s+([A-Za-z0-9_$]+)\s+from\s+(['"`][^'"`]+['"`]);?/g,
                (m, name, mod) => `const ${name} = require(${mod});`
            );

            out = out.replace(/import\s+(['"`][^'"`]+['"`]);?/g, (m, mod) => `require(${mod});`);

            out = out.replace(/export\s+default\s+function\s+([A-Za-z0-9_$]*)/g, (m, name) => {
                if (name) return `function ${name}`;
                return 'module.exports = function';
            });

            out = out.replace(/export\s+default\s+class\s+([A-Za-z0-9_$]*)/g, (m, name) => {
                if (name) return `class ${name}`;
                return 'module.exports = class';
            });

            out = out.replace(/export\s+default\s+/g, 'module.exports = ');

            out = out.replace(/export\s+(const|let|var)\s+([A-Za-z0-9_$]+)\s*=/g, (m, kind, name) => {
                return `${kind} ${name} =`;
            });

            const exportVars = [];
            const varRegex = /(?:^|\n)\s*(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=/g;
            let match;
            const originalExportVarRegex = /export\s+(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=/g;
            while ((match = originalExportVarRegex.exec(code))) {
                exportVars.push(match[1]);
            }
            if (exportVars.length) {
                const exportLines = exportVars.map(n => `exports.${n} = ${n};`).join('\n');
                out += '\n\n' + exportLines + '\n';
            }

            out = out.replace(/export\s*\{\s*([^}]+)\s*\}\s*;?/g, (m, list) => {
                return list
                    .split(',')
                    .map(item => {
                        const part = item.trim();
                        const asMatch = part.match(/^([A-Za-z0-9_$]+)\s+as\s+([A-Za-z0-9_$]+)$/i);
                        if (asMatch) return `exports.${asMatch[2]} = ${asMatch[1]};`;
                        return `exports.${part} = ${part};`;
                    })
                    .join('\n');
            });

            out = out.replace(/export\s+\*\s+from\s+(['"`][^'"`]+['"`]);?/g, (m, mod) => {
                return `Object.assign(exports, require(${mod}));`;
            });

            out = out.replace(/export\s+function\s+([A-Za-z0-9_$]+)\s*\(/g, (m, name) => {
                return `function ${name}(`;
            });
            
            const exportedFuncs = [];
            const funcRegex = /export\s+function\s+([A-Za-z0-9_$]+)\s*\(/g;
            while ((match = funcRegex.exec(code))) exportedFuncs.push(match[1]);
            if (exportedFuncs.length) {
                out += '\n\n' + exportedFuncs.map(n => `exports.${n} = ${n};`).join('\n') + '\n';
            }
            out = out.replace(/\n{3,}/g, '\n\n');

            return out;
        }

        // =========================================
        // BABEL CONVERTER FUNCTION
        // =========================================
        async function convertWithBabel(sourceCode) {
            const result = await babel.transformAsync(sourceCode, {
                plugins: ['@babel/plugin-transform-modules-commonjs'],
                sourceType: 'module',
                configFile: false,
                babelrc: false,
            });
            return result.code;
        }

        // =========================================
        // RUNTIME & UTILITIES
        // =========================================
        const RunTime = `_${runtime(process.uptime())}_`;
        
        const pickRandom = (arr) => {
            return arr[Math.floor(Math.random() * arr.length)];
        };

        // =========================================
        // CONSOLE LOGGING
        // =========================================
        if (m.message) {
            const glitchText = (text) => {
                return chalk.hex('#00ffff').bold(text) + chalk.hex('#ff00ff')('_');
            };

            console.log(chalk.bgHex('#0a0a0a').hex('#00ff00')('┌───────────────── 🄼🄴🅂🅂🄰🄶🄴 ─────────────────┐'));
            console.log(chalk.bgHex('#0a0a0a').hex('#ff00ff')(`   ⚡ ${glitchText('INCOMING TRANSMISSION')}`));
            console.log(chalk.bgHex('#0a0a0a').hex('#00ffff')('├─────────────────────────────────────────────┤'));
            
            const entries = [
                ['🕐', 'TIMESTAMP', new Date().toLocaleString()],
                ['📡', 'CONTENT', m.body || m.mtype],
                ['👤', 'USER', pushname],
                ['🔢', 'JID', senderNumber],
                ...(isGroup ? [
                    ['👥', 'GROUP', groupName],
                    ['🔗', 'GROUP_ID', m.chat]
                ] : [])
            ];

            entries.forEach(([icon, label, value]) => {
                console.log(
                    chalk.bgHex('#0a0a0a').hex('#ffff00')(`   ${icon} `) +
                    chalk.bgHex('#0a0a0a').hex('#00ff00')(`${label}:`) +
                    chalk.bgHex('#0a0a0a').hex('#ffffff')(` ${value}`)
                );
            });
            
            console.log(chalk.bgHex('#0a0a0a').hex('#00ff00')('└─────────────────────────────────────────────┘\n'));
        }

        // =========================================
        // ALIASES & HELPERS
        // =========================================
        const usedPrefix = prefix;
        const CMD = isCmd;
        const conn = WhosTANG;
        const sock = WhosTANG;
        const isOwn = isOwner;
        const isPrem = isPremium;

        // =========================================
        // GLOBAL FAKE QUOTED SETUP
        // =========================================
        const thumbPath = './Tang/image/owner.jpg';
        const thumbBuffer = fs.existsSync(thumbPath)
            ? fs.readFileSync(thumbPath)
            : null;

        global.fakeQuoted = (m, options = {}) => {
            const thumb = thumbBuffer;
            const sender = m.sender || '0@s.whatsapp.net';
            const number = sender?.split("@")[0] || "0";
            const name = m.pushName || "User";

            const baseKey = {
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast"
            };

            return {
                fkontak: {
                    key: baseKey,
                    message: {
                        contactMessage: {
                            displayName: global.namaowner || name,
                            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${global.namaowner || name}\nTEL;waid=${number}:${number}\nEND:VCARD`,
                            jpegThumbnail: thumb
                        }
                    }
                },

                fvn: {
                    key: baseKey,
                    message: {
                        audioMessage: {
                            mimetype: "audio/ogg; codecs=opus",
                            seconds: 999999,
                            ptt: true
                        }
                    }
                },

                fgif: {
                    key: baseKey,
                    message: {
                        videoMessage: {
                            caption: options.caption || "Powered by Bot",
                            gifPlayback: true,
                            jpegThumbnail: thumb
                        }
                    }
                },

                fimg: {
                    key: baseKey,
                    message: {
                        imageMessage: {
                            caption: options.caption || "Fake Image",
                            jpegThumbnail: thumb
                        }
                    }
                },

                fdoc: {
                    key: baseKey,
                    message: {
                        documentMessage: {
                            title: options.title || "Fake Document",
                            fileName: options.fileName || "file.pdf",
                            mimetype: "application/pdf",
                            jpegThumbnail: thumb
                        }
                    }
                },

                forder: {
                    key: baseKey,
                    message: {
                        orderMessage: {
                            itemCount: 1,
                            status: 1,
                            surface: 1,
                            message: options.message || "Fake Order",
                            orderTitle: options.title || "Order",
                            thumbnail: thumb,
                            sellerJid: sender
                        }
                    }
                },

                floc: {
                    key: baseKey,
                    message: {
                        locationMessage: {
                            name: options.name || "Fake Location",
                            jpegThumbnail: thumb
                        }
                    }
                },

                ftext: {
                    key: baseKey,
                    message: {
                        extendedTextMessage: {
                            text: options.text || "Fake Text Message"
                        }
                    }
                },

                fproduct: {
                    key: baseKey,
                    message: {
                        productMessage: {
                            product: {
                                productImage: { jpegThumbnail: thumb },
                                title: options.title || "Fake Product",
                                description: options.desc || "Description",
                                currencyCode: "IDR",
                                priceAmount1000: "10000000"
                            },
                            businessOwnerJid: sender
                        }
                    }
                },

                random: function () {
                    const allowed = ['fkontak','fvn','fgif','fimg','fdoc','forder','floc','ftext','fproduct'];
                    const pick = allowed[Math.floor(Math.random() * allowed.length)];
                    return this[pick];
                }
            };
        };

        global.q = (m, type = 'fkontak', opt = {}) => {
            const data = global.fakeQuoted(m, opt);
            return data[type] || data.fkontak;
        };

        // =========================================
        // SELF MODE CHECK
        // =========================================
        if (global.self && !isOwn) return;

        // =========================================
        // LOAD PLUGINS WITH REPLY MODE SUPPORT
        // =========================================
        const loadPluginsCommand = require("../command/handler");
        const handleData = { 
            WhosTANG, 
            text, 
            args, 
            isOwn, 
            isPrem, 
            isCmd, 
            command, 
            reply, 
            smartReply,
            conn, 
            sock, 
            quoted, 
            fetchJson, 
            randomKarakter, 
            formatSize, 
            sleep, 
            smsg, 
            isOwner, 
            isPremium, 
            isCmd, 
            prefix, 
            usedPrefix,
            getUserMode,
            m
        };

        if (isCmd) {
            await loadPluginsCommand(m, command, handleData);
        }

        // =========================================
        // LOAD ESM PLUGINS
        // =========================================
        if (isCmd) {
            const { default: handleMessage } = await import("../command/handle.mjs");
            await handleMessage(m, command, handleData);
        }

        // =========================================
        // AUTO READ MESSAGES
        // =========================================
        if (global.autoread) {
            sock.readMessages([m.key]);
        }

        // =========================================
        // FEATURE COUNTER FUNCTIONS
        // =========================================
        function countCase(filePath) {
            if (!fs.existsSync(filePath)) return 0;
            const data = fs.readFileSync(filePath, "utf8");
            const match = data.match(/case\s+['"`][^'"`]+['"`]\s*:/g);
            return match ? match.length : 0;
        }

        function countFiles(dir) {
            if (!fs.existsSync(dir)) return 0;
            return fs.readdirSync(dir).filter(f =>
                f.endsWith(".js") || f.endsWith(".mjs")
            ).length;
        }

        function totalFitur() {
            const CASE = countCase("./src/core/WhosTANG.js");
            const ESM = countFiles("./Plugins-ESM");
            const CJS = countFiles("./Plugins-CJS");
            const TOTAL = CASE + ESM + CJS;

            return `CASE : ${CASE}
ESM  : ${ESM}
CJS  : ${CJS}

TOTAL FITUR : ${TOTAL}`;
        }

        // =========================================
        // 📌 COMMAND HANDLER - SWITCH CASE
        // =========================================
        switch (command) {

            // =========================================
            // 📌 REPLY MODE COMMANDS
            // =========================================
            case 'replymode':
            case 'setreply': {
                const currentMode = getUserMode(m.sender);
                if (!text) {
                    return smartReply(`📋 *Reply Mode Settings*

Mode saat ini: *${currentMode.toUpperCase()}*

Pilih mode reply:
• *.setreply button* - Mode tombol interaktif
• *.setreply text* - Mode text biasa

📊 Statistik: ${JSON.stringify(getReplyModeStats())}`);
                }
                
                const newMode = text.toLowerCase().trim();
                if (newMode === 'button' || newMode === 'text') {
                    setUserReplyMode(m.sender, newMode);
                    return smartReply(`✅ *Mode Reply Diubah!*

Mode sekarang: *${newMode.toUpperCase()}*\n\nSemua reply akan menggunakan mode ini.`);
                } else {
                    return reply('❌ Mode tidak valid! Pilih: button atau text');
                }
            }
            break;

            case 'checkmode': {
                const mode = getUserMode(m.sender);
                const stats = getReplyModeStats();
                return smartReply(`📋 *Reply Mode Info*

👤 Mode kamu: *${mode.toUpperCase()}*
📊 Total user: ${stats.total}
📋 Mode button: ${stats.button}
📝 Mode text: ${stats.text}`);
            }
            break;

            // =========================================
            // 📌 OWNER COMMANDS
            // =========================================
            case "developerbot":
            case "owner": 
            case "own": 
            case "dev": {
                await sock.sendContact(m.chat, [global.owner], null);
                sock.sendMessage(m.chat, {
                    text: `Hai @${m.sender.split("@")[0]} ini adalah owner aku`,
                    contextInfo: { mentionedJid: [m.sender] }
                }, { quoted: m });
            }
            break;

            // =========================================
            // 📌 INFO COMMANDS
            // =========================================
            case 'fitur': 
            case 'ttf': 
            case 'totalfitur': {
                const CASE = countCase("./src/core/WhosTANG.js");
                const ESM = countFiles("./Plugins-ESM");
                const CJS = countFiles("./Plugins-CJS");
                const TOTAL = CASE + ESM + CJS;
                const tekss = `
CASE : ${CASE}
ESM  : ${ESM}
CJS  : ${CJS}

TOTAL FITUR : ${TOTAL}
`;
                reply(tekss);
            }
            break;

            case "rt": 
            case "runtime": 
            case "uptime": {
                reply(RunTime);
            }
            break;

            case "ping":
            case "speed":
            case "pings": {
                let start = Date.now();
                
                await sock.sendMessage(m.chat, { 
                    text: "🏓 Testing speed..." 
                }, { quoted: m });

                let end = Date.now();
                let ping = end - start;
                let uptime = process.uptime();
                let up = runtime(uptime);

                let txt = `
⚡ *BOT SPEED TEST*

🏓 Ping: ${ping} ms
🕒 Uptime: ${up}
🚀 Node: ${process.version}
🖥️ Platform: ${process.platform}
                `.trim();

                await sock.sendMessage(m.chat, { text: txt }, { quoted: m });
            }
            break;

            // =========================================
            // 📌 MENU COMMAND
            // =========================================
            case "menu": {
                const CASE = countCase("./src/core/WhosTANG.js");
                const ESM = countFiles("./Plugins-ESM");
                const CJS = countFiles("./Plugins-CJS");
                const TOTAL = CASE + ESM + CJS;
                const userMode = getUserMode(m.sender);
                
                const menuv = `
╭──────[ *ABOUT BOT* ]──────╮
│▣ Nama-Bot : ${global.botname}
│▣ Version : 1.2
│▣ Runtime : ${runtime(process.uptime())}
│▣ Feature : ${TOTAL} command
│▣ Type : CJS & ESM (Plugins)
│▣ Reply Mode : ${userMode.toUpperCase()}
╰─────────────────────╯

╭──────[ MAIN ]──────╮
│ ↝ .menu
│ ↝ .ping
│ ↝ .runtime
│ ↝ .totalfitur
│ ↝ .owner
│ ↝ .replymode
│ ↝ .checkmode
╰────────────────────╯

╭──────[ OWNER ]──────╮
│ ↝ .goodbye on/off
│ ↝ .welcome on/off
│ ↝ .setppbot
│ ↝ .delppbot
│ ↝ .autoread
│ ↝ .self / .public
│ ↝ .backup
│ ↝ .plugin
│ ↝ .addplugin
│ ↝ .delplugin
│ ↝ .listplugin
│ ↝ .getplugin
│ ↝ .addcase
│ ↝ .delcase
│ ↝ .listcase
│ ↝ .getcase
│ ↝ =>
│ ↝ >
│ ↝ $
╰────────────────────╯

╭──────[ GROUP ]──────╮
│ ↝ .promote
│ ↝ .demote
│ ↝ .open
│ ↝ .close
│ ↝ .tagall
│ ↝ .hidetag
│ ↝ .linkgc
│ ↝ .resetlinkgc
│ ↝ .kick
╰────────────────────╯

╭──────[ TOOLS ]──────╮
│ ↝ .case2plugin
│ ↝ .esm2cjs
│ ↝ .cjs2esm
│ ↝ .tourl
│ ↝ .remini
╰────────────────────╯

╭──────[ SEARCH ]──────╮
│ ↝ .spotifyplay
│ ↝ .pin
│ ↝ .play
│ ↝ .ytsearch
╰────────────────────╯

╭──────[ DOWNLOAD ]──────╮
│ ↝ .douyin
│ ↝ .capcut
│ ↝ .threads
│ ↝ .kuaishou
│ ↝ .qq
│ ↝ .espn
│ ↝ .pinterest
│ ↝ .imdb
│ ↝ .imgur
│ ↝ .ifunny
│ ↝ .izlesene
│ ↝ .reddit
│ ↝ .youtube
│ ↝ .twitter
│ ↝ .vimeo
│ ↝ .snapchat
│ ↝ .bilibili
│ ↝ .dailymotion
│ ↝ .sharechat
│ ↝ .likee
│ ↝ .linkedin
│ ↝ .tumblr
│ ↝ .hipi
│ ↝ .telegram
│ ↝ .getstickerpack
│ ↝ .bitchute
│ ↝ .febspot
│ ↝ .9gag
│ ↝ .oke.ru
│ ↝ .rumble
│ ↝ .streamable
│ ↝ .ted
│ ↝ .sohutv
│ ↝ .pornbox
│ ↝ .xvideos
│ ↝ .xnxx
│ ↝ .xiaohongshu
│ ↝ .ixigua
│ ↝ .weibo
│ ↝ .miaopai
│ ↝ .meipai
│ ↝ .xiaoying
│ ↝ .nationalvideo
│ ↝ .yingke
│ ↝ .sina
│ ↝ .bluesky
│ ↝ .soundcloud
│ ↝ .mixcloud
│ ↝ .spotify
│ ↝ .zingmp3
│ ↝ .bandcamp
│ ↝ .download
│ ↝ .tiktok
│ ↝ .instagram
│ ↝ .facebook
│ ↝ .aio
│ ↝ .ytmp3
│ ↝ .ytmp4
╰────────────────────╯
`;
                WhosTANG.sendMessage(m.chat, {
                    text: menuv,
                    mentions: [m.sender],
                    contextInfo: {
                        mentionedJid: [m.sender],
                        externalAdReply: {
                            title: `${global.botname}`,
                            body: `version • 1.2`,
                            thumbnailUrl: global.thumbnail,
                            renderLargerThumbnail: true,
                            mediaType: 1,
                            previewType: 1,
                            sourceUrl: ""
                        }
                    }
                }, { quoted: m });
            }
            break;

            // =========================================
            // 📌 OWNER SETTINGS COMMANDS
            // =========================================
            case 'welcome':
                if (!isOwner) return reply(mess.owner);
                global.welcome = args[0] === 'on';
                reply('—Welcome ' + (global.welcome ? 'ON' : 'OFF'));
            break;

            case 'goodbye':
                if (!isOwner) return reply(mess.owner);
                global.goodbye = args[0] === 'on';
                reply('—Goodbye ' + (global.goodbye ? 'ON' : 'OFF'));
            break;

            case 'delppbot': {
                if (!isOwner) return reply(mess.owner);
                await sock.removeProfilePicture(sock.user.id);
                reply(`Berhasil Menghapus Gambar Profil Bot`);
            }
            break;

            case 'setbotpp':
            case 'setppbot': {
                if (!isOwner) return reply(mess.owner);
                if (!quoted) return reply(`Kirim/kutip gambar dengan caption ${cmd}`);
                if (!/image/.test(mime)) return reply(`Kirim/kutip gambar dengan caption ${cmd}`);
                if (/webp/.test(mime)) return reply(`Kirim/kutip gambar dengan caption ${cmd}`);
                let media = await sock.downloadAndSaveMediaMessage(quoted);
                await sock.updateProfilePicture(botNumber, {
                    url: media
                }).then(() => fs.unlinkSync(media)).catch((err) => fs.unlinkSync(media));
                reply('Sukses mengganti pp bot!');
            }
            break;

            case 'autoread': {
                if (!isOwner) return reply(mess.owner);

                if (args[0] === 'on') {
                    global.autoread = true;
                    reply('✅ Auto Read Message: ON');
                } else if (args[0] === 'off') {
                    global.autoread = false;
                    reply('❌ Auto Read Message: OFF');
                } else {
                    reply(`*Auto Read Status:* ${global.autoread ? 'ON' : 'OFF'}

Contoh:
.autoread on
.autoread off`);
                }
            }
            break;

            case "self":
                if (!isOwner) return reply(mess.owner);
                global.self = true;
                reply("🤖 Bot mode SELF (hanya owner)");
            break;

            case "public":
                if (!isOwner) return reply(mess.owner);
                global.self = false;
                reply("🌍 Bot mode PUBLIC (semua user)");
            break;

            // =========================================
            // 📌 CASE MANAGEMENT COMMANDS
            // =========================================
            case "getcase": { 
                if (!isOwn) return reply(mess.owner);
                if (!text) return reply("namaCase");
                let hasil = Case.get(text);
                reply(hasil);
            }
            break;

            case "addcase": {
                if (!isOwn) return reply(mess.owner);
                if (!text) return reply(`case "namacase":{ ... }`);
                try {
                    Case.add(text);
                    reply("✅ Case berhasil ditambahkan.");
                } catch (e) {
                    reply(e.message);
                }
            }
            break;

            case "delcase": {
                if (!isOwn) return reply(mess.owner);
                if (!text) return reply("namaCase");
                try {
                    Case.delete(text);
                    reply(`✅ Case "${text}" berhasil dihapus.`);
                } catch (e) {
                    reply(e.message);
                }
            }
            break;

            case "listcase": {
                if (!isOwn) return reply(mess.owner);
                try {
                    reply("📜 List Case:\n\n" + Case.list());
                } catch (e) {
                    reply(e.message);
                }
            }
            break;

            // =========================================
            // 📌 OWNER MANAGEMENT COMMANDS
            // =========================================
            case "addowner":
            case "addown": {
                if (!isOwner) return reply(mess.owner);
                if (!m.quoted && !text) return reply("Contoh: .addowner 6285xxxx");
                let raw = m.quoted 
                    ? m.quoted.sender.split("@")[0] 
                    : text;
                let number = raw.replace(/\D/g, "");
                if (number.startsWith("0")) {
                    number = "62" + number.slice(1);
                }
                if (number.length < 6) return reply("Nomor tidak valid!");

                const jid = number + "@s.whatsapp.net";
                if (global.owner.includes(jid)) return reply(`Nomor ${number} sudah menjadi owner!`);
                if (jid === botNumber) return reply(`Tidak bisa menambahkan bot sebagai owner!`);
                global.owner.push(jid);
                fs.writeFileSync("./data/owner.json", JSON.stringify(global.owner, null, 2));

                reply(`Owner berhasil ditambah: ${number} ✅`);
            }
            break;

            case "listowner": 
            case "listown": {
                if (!isOwner) return reply(mess.owner);
                if (global.owner.length < 1) return reply("Tidak ada owner tambahan");
                let teks = `\n *#- List all owner tambahan*\n`;
                for (let i of global.owner) {
                    teks += `\n* ${i.split("@")[0]}
* *Tag :* @${i.split("@")[0]}\n`;
                }
                sock.sendMessage(m.chat, { text: teks, mentions: global.owner }, { quoted: m });
            }
            break;

            case "delowner": 
            case "delown": {
                if (!isOwner) return reply(mess.owner);
                if (!m.quoted && !text) return reply("6285###");
                const input = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
                const input2 = input.split("@")[0];
                if (input2 === global.owner[0] || input == botNumber) return reply(`Tidak bisa menghapus owner utama!`);
                if (!global.owner.includes(input)) return reply(`Nomor ${input2} bukan owner bot!`);
                let posi = global.owner.indexOf(input);
                await global.owner.splice(posi, 1);
                await fs.writeFileSync("./data/owner.json", JSON.stringify(global.owner, null, 2));
                reply(`Berhasil menghapus owner ✅`);
            }
            break;

            // =========================================
            // 📌 TOOLS COMMANDS
            // =========================================
            case 'hd':
            case 'tohd':
            case 'Enhanced':
            case 'remini': {
                if (!quoted) return reply('Fotonya mana?');
                if (!/image/.test(mime)) return reply(`Send/Reply Foto dengan caption ${cmd}`);
                reply('Enhancing foto, tunggu sebentar...');

                try {
                    let media = await sock.downloadAndSaveMediaMessage(quoted);
                    let kyzoo = await CatBox(media);
                    let result = "https://api.deline.web.id/tools/hd?url=" + kyzoo;

                    await sock.sendMessage(
                        m.chat,
                        {
                            image: { url: result },
                            caption: "sukses meningkatkan kualitas foto"
                        },
                        { quoted: m }
                    );
                } catch (e) {
                    console.log(e);
                    reply('Terjadi error');
                }
            }
            break;

            case 'tourl': {
                if (!quoted) return reply('Reply media (foto/video/file) yang mau di upload!');
                let mime = quoted.mimetype || '';
                if (!mime) return reply('Media tidak valid!');

                reply('⏳ Uploading ke semua platform...');

                let media = await quoted.download();
                let filePath = `./temp_${Date.now()}`;

                fs.writeFileSync(filePath, media);

                try {
                    let catbox = await CatBox(filePath).catch(e => null);
                    let tele = await TelegraPh(filePath).catch(e => null);
                    let uguu = await UploadFileUgu(filePath).catch(e => null);
                    let flonime = await floNime(media).catch(e => null);

                    let hasil = `🌐 *UPLOAD TO URL*\n\n`;
                    hasil += catbox ? `📦 Catbox:\n${catbox}\n\n` : `📦 Catbox: ERROR\n\n`;
                    hasil += tele ? `📰 Telegraph:\n${tele}\n\n` : `📰 Telegraph: ERROR\n\n`;
                    hasil += uguu ? `☁️ Uguu:\n${uguu.url || uguu}\n\n` : `☁️ Uguu: ERROR\n\n`;
                    hasil += flonime?.url ? `🎨 Flonime:\n${flonime.url}\n\n` : `🎨 Flonime: ERROR\n\n`;

                    reply(hasil);
                } catch (e) {
                    console.log(e);
                    reply('Upload gagal ❌');
                } finally {
                    fs.unlinkSync(filePath);
                }
            }
            break;

            case "case2plugin": {
                let text = args.join(" ") || (quoted && quoted.text);
                if (!text) return reply("Kirim code case atau reply case!");

                function convertCaseToHandler(code) {
                    let nameMatch = code.match(/case\s+["'](.+?)["']:/);
                    let cmd = nameMatch ? nameMatch[1] : "cmd";

                    let body = code
                        .replace(/case\s+["'](.+?)["']:\s*/g, "")
                        .replace(/break/g, "")
                        .trim();

                    return `
const handler = async (m, { text, args, reply, sock }) => {
${body}
}

handler.help = ['${cmd}']
handler.tags = ['tools']
handler.command = ["${cmd}"]

module.exports = handler
`;
                }

                let result = convertCaseToHandler(text);
                await reply(`✅ *CASE → HANDLER CJS*\n\n\`\`\`js\n${result}\n\`\`\``);
            }
            break;

            case "cjs2esm": {
                let text = args.join(" ") || (quoted && quoted.text);
                if (!text) return reply("Kirim kode CJS atau reply file JS!\n\nContoh:\n.cjs2esm const fs = require('fs')");

                function convertCJS(code) {
                    let result = code;

                    result = result.replace(
                        /const\s+(\w+)\s*=\s*require\(['"](.+?)['"]\)/g,
                        "import $1 from '$2'"
                    );

                    result = result.replace(
                        /module\.exports\s*=\s*/g,
                        "export default "
                    );

                    result = result.replace(
                        /exports\.(\w+)\s*=\s*/g,
                        "export const $1 = "
                    );

                    return result;
                }

                let esmCode = convertCJS(text);
                await reply(`✅ *CJS → ESM Converted*\n\n\`\`\`js\n${esmCode}\n\`\`\``);
            }
            break;

            case "esm2cjs": {
                const q = m.quoted ? m.quoted : m;
                const text = (q.msg && (q.msg.text || q.msg.caption)) || q.text || '';
                if (!text) return reply('Kirim/quote kode ESM yang ingin di-convert.');

                try {
                    const useBabel = false;
                    let converted;

                    if (useBabel) {
                        const babel = require('@babel/core');
                        const res = await babel.transformAsync(text, {
                            plugins: ['@babel/plugin-transform-modules-commonjs'],
                            sourceType: 'module',
                            configFile: false,
                            babelrc: false,
                        });
                        converted = res.code;
                    } else {
                        converted = convertEsmToCjs(text);
                    }

                    const buffer = Buffer.from(converted, 'utf8');
                    await sock.sendMessage(m.chat, {
                        document: buffer,
                        fileName: 'converted.cjs',
                        mimetype: 'text/javascript'
                    }, { quoted: m });

                } catch (err) {
                    console.error(err);
                    reply('Gagal convert: ' + err.message);
                }
                break;
            }

            // =========================================
            // 📌 SEARCH COMMANDS
            // =========================================
            case 'ytplay':
            case 'song':
            case 'play': {
                if (!text) return reply('Contoh:\n.play Alan Walker Faded');

                const yts = require('yt-search');
                const search = await yts(text);
                if (!search.videos.length) return reply('Video tidak ditemukan');

                const video = search.videos[0];
                reply(`🎵 ${video.title}\n⏳ Downloading...`);

                const res = await ytdl.download(video.url, 'mp3');
                if (!res.status) return reply(res.msg || res.error);

                await sock.sendMessage(m.chat, {
                    audio: { url: res.dl },
                    mimetype: 'audio/mpeg',
                    fileName: `${res.title}.mp3`,
                    contextInfo: {
                        externalAdReply: {
                            title: res.title,
                            body: video.author.name,
                            thumbnailUrl: res.thumb,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: m });
            }
            break;

            case "ytsearch":
            case "youtubesearch":
            case "yts": {
                if (!text) return reply("Contoh: .yts kucing");

                const res = await yts(text);
                const videos = res.videos.slice(0, 5);
                if (!videos.length) return reply("Video tidak ditemukan");

                let rows = [];

                for (let v of videos) {
                    rows.push(
                        {
                            title: v.title,
                            description: '🎵 Download MP3',
                            id: `.ytmp3 ${v.url}`
                        },
                        {
                            title: v.title,
                            description: '🎬 Download MP4',
                            id: `.ytmp4 ${v.url}`
                        }
                    );
                }

                await sock.sendMessage(m.chat, {
                    image: { url: videos[0].thumbnail },
                    caption: `🔎 *YouTube Search*\n\nQuery: *${text}*\n\nPilih format download di menu 👇`,
                    footer: name,
                    viewOnce: true,
                    buttons: [
                        {
                            buttonId: 'ytsearch_menu',
                            type: 4,
                            buttonText: { displayText: '📥 PILIH VIDEO' },
                            nativeFlowInfo: {
                                name: 'single_select',
                                paramsJson: JSON.stringify({
                                    title: '🎬 YouTube Downloader',
                                    description: `Hasil pencarian: ${text}`,
                                    sections: [
                                        {
                                            title: 'Hasil Video',
                                            rows
                                        }
                                    ]
                                })
                            }
                        }
                    ]
                }, { quoted: m });
            }
            break;

            // =========================================
            // 📌 GROUP COMMANDS
            // =========================================
            case "demote":
            case "promote": {
                if (!isGroup) return reply(mess.group);
                if (!isAdmins && !isOwner) return reply(mess.admin);
                if (!isBotAdmins) return reply(mess.botadmin);

                if (m.quoted || text) {
                    var action;
                    let target = m.mentionedJid[0] 
                        ? m.mentionedJid[0] 
                        : m.quoted 
                            ? m.quoted.sender 
                            : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                    if (/demote/.test(command)) action = "Demote";
                    if (/promote/.test(command)) action = "Promote";
                    await sock.groupParticipantsUpdate(m.chat, [target], action.toLowerCase()).then(async () => {
                        await sock.sendMessage(m.chat, {
                            text: `Sukses ${action.toLowerCase()} @${target.split("@")[0]}`,
                            mentions: [target]
                        }, { quoted: m });
                    });
                } else {
                    return reply("@tag/6285###");
                }
            }
            break;

            case "closegc": 
            case "close": 
            case "opengc": 
            case "open": {
                if (!isGroup) return reply(mess.group);
                if (!isAdmins && !isOwner) return reply(mess.admin);
                if (!isBotAdmins) return reply(mess.botadmin);
                if (/open|opengc/.test(command)) {
                    if (groupMetadata.announce == false) return;
                    await sock.groupSettingUpdate(m.chat, 'not_announcement');
                } else if (/closegc|close/.test(command)) {
                    if (groupMetadata.announce == true) return;
                    sock.groupSettingUpdate(m.chat, 'announcement');
                }
            }
            break;

            case 'tagall': {
                if (!isGroup) return reply(mess.group);
                if (!isAdmins && !isOwner) return reply(mess.admin);
                if (!isBotAdmins) return reply(mess.botadmin);
                const textMessage = args.join(" ") || "nothing";
                let teks = `—tagall message :\n> *${textMessage}*\n\n`;
                const groupMetadata = await sock.groupMetadata(m.chat);
                const participants = groupMetadata.participants;
                for (let mem of participants) {
                    teks += `@${mem.id.split("@")[0]}\n`;
                }
                sock.sendMessage(m.chat, {
                    text: teks,
                    mentions: participants.map((a) => a.id)
                }, { quoted: m });
            }
            break;

            case "h":
            case "hidetag": {
                if (!isGroup) return reply(mess.group);
                if (!isAdmins && !isOwner) return reply(mess.admin);
                if (!isBotAdmins) return reply(mess.botadmin);
                if (m.quoted) {
                    sock.sendMessage(m.chat, {
                        forward: m.quoted.fakeObj,
                        mentions: participants.map(a => a.id)
                    });
                }
                if (!m.quoted) {
                    sock.sendMessage(m.chat, {
                        text: text ? text : '',
                        mentions: participants.map(a => a.id)
                    }, { quoted: m });
                }
            }
            break;

            case 'kick': {
                if (!m.isGroup) return reply(mess.group);
                if (!isAdmins && !isOwner) return reply('Khusus Admin!!');
                if (!isBotAdmins) return reply('_Bot Harus Menjadi Admin Terlebih Dahulu_');
                let users = m.mentionedJid[0] 
                    ? m.mentionedJid[0] 
                    : m.quoted 
                        ? m.quoted.sender 
                        : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                await conn.groupParticipantsUpdate(m.chat, [users], 'remove');
                await reply(`*[ Done ]*`);
            }
            break;

            case "linkgc": {
                if (!isGroup) return reply(mess.group);
                if (!isAdmins && !isOwner) return reply(mess.admin);
                if (!isBotAdmins) return reply(mess.botadmin);

                const urlGrup = "https://chat.whatsapp.com/" + await sock.groupInviteCode(m.chat);
                var teks = `
${urlGrup}
`;
                await sock.sendMessage(m.chat, { text: teks, matchedText: `${urlGrup}` }, { quoted: m });
            }
            break;

            case "resetlinkgc": {
                if (!isGroup) return reply(mess.group);
                if (!isAdmins && !isOwner) return reply(mess.admin);
                if (!isBotAdmins) return reply(mess.botadmin);

                await sock.groupRevokeInvite(m.chat);
                reply("Berhasil mereset link grup ✅");
            }
            break;

            // =========================================
            // 📌 DOWNLOAD COMMANDS
            // =========================================
            case 'ytmp4': {
                if (!text) return reply('Contoh:\n.ytmp4 link | 720');

                let [link, quality] = text.split('|').map(v => v.trim());
                quality = quality || '360';

                reply(`⏳ Processing MP4 ${quality}p...`);

                const res = await ytdl.download(link, quality);
                if (!res.status) return reply(res.msg || res.error);

                await sock.sendMessage(m.chat, {
                    video: { url: res.dl },
                    caption: `🎬 ${res.title}\n📺 ${quality}p\n⏱ ${res.duration}`,
                    contextInfo: {
                        externalAdReply: {
                            title: res.title,
                            body: `${quality}p`,
                            thumbnailUrl: res.thumb,
                            mediaType: 2,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: m });
            }
            break;

            // =========================================
            // 📌 SOCIAL MEDIA DOWNLOADER (AIO)
            // =========================================
            case 'douyin':
            case 'capcut':
            case 'threads':
            case 'kuaishou':
            case 'qq':
            case 'espn':
            case 'pinterest':
            case 'imdb':
            case 'imgur':
            case 'ifunny':
            case 'izlesene':
            case 'reddit':
            case 'youtube':
            case 'twitter':
            case 'vimeo':
            case 'snapchat':
            case 'bilibili':
            case 'dailymotion':
            case 'sharechat':
            case 'likee':
            case 'linkedin':
            case 'tumblr':
            case 'hipi':
            case 'telegram':
            case 'getstickerpack':
            case 'bitchute':
            case 'febspot':
            case '9gag':
            case 'oke.ru':
            case 'rumble':
            case 'streamable':
            case 'ted':
            case 'sohutv':
            case 'pornbox':
            case 'xvideos':
            case 'xnxx':
            case 'xiaohongshu':
            case 'ixigua':
            case 'weibo':
            case 'miaopai':
            case 'meipai':
            case 'xiaoying':
            case 'national video':
            case 'yingke':
            case 'sina':
            case 'bluesky':
            case 'soundcloud':
            case 'mixcloud':
            case 'spotify':
            case 'zingmp3':
            case 'bandcamp':
            case 'download':
            case 'tiktok':
            case 'instagram':
            case 'facebook':
            case "aio": {
                if (!text) return reply('link Sosmed?');
                try {
                    async function fetchInitialPage(initialUrl) {
                        try {
                            const axios = require('axios');
                            const cheerio = require('cheerio');
                            const headers = {
                                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
                                'Referer': initialUrl,
                            };
                            const response = await axios.get(initialUrl, { headers });
                            const $ = cheerio.load(response.data);
                            const csrfToken = $('meta[name="csrf-token"]').attr('content');
                            if (!csrfToken) throw new Error('Gagal nemu token keamanan, coba lagi!');
                            let cookies = '';
                            if (response.headers['set-cookie']) {
                                cookies = response.headers['set-cookie'].join('; ');
                            }
                            return { csrfToken, cookies };
                        } catch (error) {
                            throw new Error(`Gagal ambil halaman awal: ${error.message}`);
                        }
                    }

                    async function postDownloadRequest(downloadUrl, userUrl, csrfToken, cookies) {
                        try {
                            const axios = require('axios');
                            const headers = {
                                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
                                'Referer': 'https://on4t.com/online-video-downloader',
                                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                                'Accept': '*/*',
                                'X-Requested-With': 'XMLHttpRequest',
                                'Cookie': cookies
                            };
                            const postData = new URLSearchParams();
                            postData.append('_token', csrfToken);
                            postData.append('link[]', userUrl);
                            const response = await axios.post(downloadUrl, postData.toString(), { headers });
                            if (response.data?.result?.length) {
                                return response.data.result.map(item => ({
                                    title: item.title,
                                    thumb: item.image,
                                    url: item.video_file_url || item.videoimg_file_url
                                }));
                            } else {
                                throw new Error('Respons dari server gak sesuai harapan, coba link lain!');
                            }
                        } catch (error) {
                            throw new Error(`Gagal proses permintaan download: ${error.message}`);
                        }
                    }

                    async function sendMediaAutoType(url, title) {
                        try {
                            const axios = require('axios');
                            const { fromBuffer } = require('file-type');
                            const res = await axios.get(url, { responseType: 'arraybuffer' });
                            const buff = Buffer.from(res.data);
                            const fileInfo = await fromBuffer(buff);
                            if (!fileInfo) return reply(`Gagal deteksi tipe file: ${title}`);
                            let mime = fileInfo.mime;
                            let ext = fileInfo.ext;
                            if (mime.startsWith('video/')) {
                                await sock.sendMessage(m.chat, { video: buff, caption: title }, { quoted: m });
                            } else if (mime.startsWith('audio/')) {
                                await sock.sendMessage(m.chat, { audio: buff, mimetype: mime }, { quoted: m });
                            } else if (mime.startsWith('image/')) {
                                await sock.sendMessage(m.chat, { image: buff, caption: title }, { quoted: m });
                            } else {
                                await sock.sendMessage(m.chat, {
                                    document: buff,
                                    fileName: `${title}.${ext}`,
                                    mimetype: mime
                                }, { quoted: m });
                            }
                        } catch (err) {
                            reply(`Gagal kirim media: ${err.message}`);
                        }
                    }

                    const initialUrl = 'https://on4t.com/online-video-downloader';
                    const downloadUrl = 'https://on4t.com/all-video-download';
                    const { csrfToken, cookies } = await fetchInitialPage(initialUrl);
                    const results = await postDownloadRequest(downloadUrl, text, csrfToken, cookies);
                    for (let i = 0; i < results.length; i++) {
                        await sendMediaAutoType(results[i].url, results[i].title);
                    }
                    await sock.sendMessage(m.chat, { react: { text: '💕', key: m.key } });
                } catch (err) {
                    await sock.sendMessage(m.chat, { react: { text: '😳', key: m.key } });
                    reply(err.message);
                }
                break;
            }

            // =========================================
            // 📌 DEFAULT - EVAL & SHELL COMMANDS
            // =========================================
            default: 
                if (budy.startsWith('=>') && isOwn) {
                    try {
                        const code = budy.slice(2);
                        const result = await eval(`(async () => { return ${code} })()`);
                        const formattedResult = util.format(result);
                        await m.reply(formattedResult);
                    } catch (error) {
                        await m.reply(`❌ Error:\n${error.message}`);
                    }
                }
                
                else if (budy.startsWith('>') && isOwn) {
                    try {
                        const code = budy.slice(1);
                        let evaled = await eval(code);
                        if (typeof evaled !== 'string') {
                            evaled = util.inspect(evaled, { depth: 1 });
                        }
                        await m.reply(evaled);
                    } catch (error) {
                        await m.reply(`❌ Error:\n${error.message}`);
                    }
                }
                
                else if (budy.startsWith('$') && isOwn) {
                    exec(budy.slice(1), (error, stdout, stderr) => {
                        if (error) {
                            return m.reply(`❌ Error:\n${error.message}`);
                        }
                        if (stderr) {
                            return m.reply(`⚠️ stderr:\n${stderr}`);
                        }
                        if (stdout) {
                            return m.reply(`📤 stdout:\n${stdout}`);
                        }
                        return m.reply('✅ Command executed (no output)');
                    });
                }
                break;
        }

    } catch (error) {
        console.error(chalk.red.bold('Error in message handler:'), error);
        
        if (m && m.chat) {
            try {
                await WhosTANG.sendMessage("0@s.whatsapp.net", {
                    text: `❌ Error occurred:\n${error.message}\n\nPlease contact the bot owner if this persists.`
                }, { quoted: m });
            } catch (sendError) {
                console.error('Failed to send error message:', sendError);
            }
        }
    }
};

// =========================================
// 📌 FILE WATCHER - AUTO RELOAD
// =========================================
const currentFile = __filename;
fs.watchFile(currentFile, () => {
    fs.unwatchFile(currentFile);
    console.log(chalk.green(`✓ ${path.basename(currentFile)} updated! Reloading...`));
    delete require.cache[require.resolve(currentFile)];
});
