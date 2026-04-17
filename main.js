/**
 * =========================================
 * 📌 FILE: main.js (RECONSTRUCTED)
 * 📌 DESCRIPTION:
 * Entry point utama untuk koneksi bot WhatsApp
 * Versi Clean Architecture - Rebuild from scratch
 *
 * Berisi:
 * - Inisialisasi koneksi WhatsApp menggunakan Baileys
 * - Autentikasi dengan pairing code
 * - Event handlers (messages, connection, calls)
 * - Media download & send utilities
 * - Group participants handler
 *
 * 📁 MAPPING: main.js (original) → main.js (reconstructed)
 * =========================================
 */

// =========================================
// 📌 CLEAR CONSOLE & INITIAL SETUP
// =========================================
console.clear();

// =========================================
// 📌 IMPORT / REQUIRE
// =========================================

// Load konfigurasi global terlebih dahulu
require('./src/config/config');


// Import package.json untuk metadata
const { description, version, name, main } = require("./package.json");

// Import fungsi-fungsi dari Baileys library
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    makeCacheableSignalKeyStore,
    makeInMemoryStore,
    jidDecode,
    proto,
    getAggregateVotesInPollMessage
} = require("@itsukichan/baileys");

// Import library tambahan
const versi = version;
const chalk = require('chalk');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const FileType = require('file-type');
const readline = require("readline");
const PhoneNumber = require('awesome-phonenumber');
const path = require('path');

// Import utility functions dari src/utils/message.js
const { 
    smsg, 
    isUrl, 
    generateMessageTag, 
    getBuffer, 
    getSizeMedia, 
    fetchJson, 
    sleep 
} = require('./src/utils/message');

// Import core modules
const EventEmitter = require('./src/event/EventEmitter');
const ConnectionHandler = require('./src/core/ConnectionHandler');

// =========================================
// 📌 GLOBAL VARIABLES / CONFIG
// =========================================

// Flag untuk menggunakan pairing code (true) atau QR code (false)
const usePairingCode = true;

// =========================================
// 📌 UTILITIES / HELPER FUNCTIONS
// =========================================

/**
 * Fungsi helper untuk membaca input dari terminal/command line
 * @param {string} query - Pertanyaan yang ditampilkan ke user
 * @returns {Promise<string>} - Input dari user
 */
function question(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}

/**
 * Fungsi untuk validasi user berdasarkan nomor telepon
 * @param {string} phoneNumber - Nomor telepon yang akan divalidasi
 * @returns {Promise<boolean>} - true jika terdaftar, false jika tidak
 */
async function validateUser(phoneNumber) {
    const database = await fetchDatabase(databaseURL);
    return database.includes(phoneNumber);
}

// =========================================
// 📌 CORE LOGIC / MAIN FUNCTIONS
// =========================================

/**
 * Fungsi utama untuk menghubungkan bot ke WhatsApp
 * Menggunakan Baileys library dengan multi-file auth state
 */
async function connectToWhatsApp() {
    
    // =========================================
    // AUTH STATE SETUP
    // =========================================
    const { state, saveCreds } = await useMultiFileAuthState("./session");
    
    // =========================================
    // WHATSAPP SOCKET CREATION
    // =========================================
    const WhosTANG = makeWASocket({
        printQRInTerminal: !usePairingCode,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        generateHighQualityLinkPreview: true,
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(
                message.buttonsMessage ||
                message.templateMessage ||
                message.listMessage
            );
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {},
                            },
                            ...message,
                        },
                    },
                };
            }
            return message;
        },
        version: [99963, 950125916, 0],
        logger: pino({
            level: 'silent'
        }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino().child({
                level: 'silent',
                stream: 'store'
            })),
        }
    });

    // =========================================
    // PAIRING CODE SETUP
    // =========================================
    if (!WhosTANG.authState.creds.registered) {
        const phoneNumber = await question(chalk.blue(`Enter Your Number\nYour Number: `));
        const code = await WhosTANG.requestPairingCode(phoneNumber, "KYZOOYMD");
        console.log(chalk.green(`\nCode: ${code}`));
    }

    // =========================================
    // IN-MEMORY STORE SETUP
    // =========================================
    const store = makeInMemoryStore({
        logger: pino({ level: 'silent' }).child({ stream: 'store' })
    });
    
    store.bind(WhosTANG.ev);

    // =========================================
    // 📌 SETUP SOCKET METHODS
    // =========================================

    /**
     * Decode JID (WhatsApp ID) dari berbagai format
     */
    WhosTANG.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        } else return jid;
    };

    /**
     * Get file dari berbagai sumber (buffer, URL, path)
     */
    WhosTANG.getFile = async (PATH, save) => {
        let res;
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
        let type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' };
        filename = path.join(__filename, '../' + new Date * 1 + '.' + type.ext);
        if (data && save) fs.promises.writeFile(filename, data);
        return { res, filename, size: await getSizeMedia(data), ...type, data };
    };

    /**
     * Download media dari pesan WhatsApp
     */
    WhosTANG.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(message, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    };

    // =========================================
    // 📌 FEATURE HELPERS
    // =========================================

    WhosTANG.sendText = (jid, text, quoted = '', options) => WhosTANG.sendMessage(jid, { text, ...options }, { quoted });

    WhosTANG.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        const { writeExifImg, imageToWebp } = require('./src/lib/exif');
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer = options && (options.packname || options.author) ? await writeExifImg(buff, options) : await imageToWebp(buff);
        await WhosTANG.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    WhosTANG.sendButton = (jid, text, buttons = [], quoted = null) => {
        return WhosTANG.sendMessage(jid, { text, buttons, headerType: 1 }, { quoted });
    };

    WhosTANG.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        const { writeExifVid, videoToWebp } = require('./src/lib/exif');
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer = options && (options.packname || options.author) ? await writeExifVid(buff, options) : await videoToWebp(buff);
        await WhosTANG.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    WhosTANG.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message;
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(quoted, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        let type = await FileType.fromBuffer(buffer);
        let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
        await fs.writeFileSync(trueFileName, buffer);
        return trueFileName;
    };

    WhosTANG.sendContact = async (jid, kon, quoted = '', opts = {}) => {
        let list = [];
        for (let i of kon) {
            list.push({
                displayName: global.namaown || 'KyzooYamada',
                vcard: `BEGIN:VCARD
VERSION:3.0
N:;;;; 
FN:${global.namaown || 'Kyzo yamada'}
TEL;type=Ponsel;waid=${i}:${i}
X-WA-BIZ-NAME:${global.namaown || 'rizky'}
X-WA-BIZ-DESCRIPTION:Owner ${name}
END:VCARD`
            });
        }
        await WhosTANG.sendMessage(
            jid,
            {
                contacts: {
                    displayName: `${list.length} Kontak Bisnis`,
                    contacts: list
                },
                contextInfo: {
                    externalAdReply: {
                        title: name,
                        body: `Version • ${versi}`,
                        thumbnailUrl: global.thumbnail,
                        sourceUrl: "",
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        showAdAttribution: false
                    }
                },
                ...opts
            },
            { quoted }
        );
    };

    WhosTANG.sendMedia = async (jid, path, caption = '', quoted = '', options = {}) => {
        let { mime, data } = await WhosTANG.getFile(path, true);
        let messageType = mime.split('/')[0];
        let messageContent = {};
        
        if (messageType === 'image') {
            messageContent = { image: data, caption: caption, ...options };
        } else if (messageType === 'video') {
            messageContent = { video: data, caption: caption, ...options };
        } else if (messageType === 'audio') {
            messageContent = { audio: data, ptt: options.ptt || false, ...options };
        } else {
            messageContent = { document: data, mimetype: mime, fileName: options.fileName || 'file' };
        }
        await WhosTANG.sendMessage(jid, messageContent, { quoted });
    };

    WhosTANG.sendPoll = async (jid, question, options) => {
        const pollMessage = {
            pollCreationMessage: {
                name: question,
                options: options.map(option => ({ optionName: option })),
                selectableCount: 1,
            },
        };
        await WhosTANG.sendMessage(jid, pollMessage);
    };

    // =========================================
    // 📌 EVENT HANDLERS REGISTRATION
    // =========================================

    // Set public mode
    WhosTANG.public = true;

    // Import dan register semua event handlers
    const MessageHandler = require('./src/handler/MessageHandler');
    const ConnectionHandler = require('./src/handler/ConnectionHandler');
    const GroupHandler = require('./src/handler/GroupHandler');

    // Register message handler
    MessageHandler(WhosTANG, store);

    // Register connection handler
    ConnectionHandler(WhosTANG, { connectToWhatsApp });

    // Register group handler
    GroupHandler(WhosTANG);

    // =========================================
    // 📌 ERROR HANDLER
    // =========================================
    WhosTANG.ev.on('error', (err) => {
        console.error(chalk.red("Error: "), err.message || err);
    });

    // =========================================
    // 📌 CREDS UPDATE HANDLER
    // =========================================
    WhosTANG.ev.on('creds.update', saveCreds);
}

// =========================================
// 📌 START APPLICATION
// =========================================
connectToWhatsApp();
