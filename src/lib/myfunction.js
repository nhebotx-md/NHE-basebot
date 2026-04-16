/**
 * =========================================
 * 📌 FILE: src/lib/myfunction.js (RECONSTRUCTED)
 * 📌 DESCRIPTION:
 * Kumpulan utility functions untuk bot WhatsApp
 *
 * 📁 MAPPING: Library/myfunction.js (original) → src/lib/myfunction.js
 * =========================================
 */

const { 
    extractMessageContent, 
    jidNormalizedUser, 
    proto, 
    delay, 
    getContentType, 
    areJidsSameUser, 
    generateWAMessage 
} = require("@itsukichan/baileys");

const chalk = require('chalk');
const fs = require('fs');
const Crypto = require('crypto');
const axios = require('axios');
const moment = require('moment-timezone');
const { sizeFormatter } = require('human-readable');
const util = require('util');
const { defaultMaxListeners } = require('stream');
const { read, MIME_JPEG, RESIZE_BILINEAR, AUTO } = require('jimp');
const Jimp = require('jimp');

const unixTimestampSeconds = (date = new Date()) => Math.floor(date.getTime() / 1000);
exports.unixTimestampSeconds = unixTimestampSeconds;

exports.resize = async (image, width, height) => {
    let oyy = await Jimp.read(image);
    let kiyomasa = await oyy.resize(width, height).getBufferAsync(Jimp.MIME_JPEG);
    return kiyomasa;
};

exports.generateMessageTag = (epoch) => {
    let tag = (0, exports.unixTimestampSeconds)().toString();
    if (epoch)
        tag += '.--' + epoch;
    return tag;
};

exports.processTime = (timestamp, now) => {
    return moment.duration(now - moment(timestamp * 1000)).asSeconds();
};

exports.getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
};

exports.getBuffer = async (url, options) => {
    try {
        options ? options : {};
        const res = await axios({
            method: "get",
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        });
        return res.data;
    } catch (err) {
        return err;
    }
};

exports.formatSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
};

exports.fetchJson = async (url, options) => {
    try {
        options ? options : {};
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        });
        return res.data;
    } catch (err) {
        return err;
    }
};

exports.runtime = function(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
};

exports.clockString = (ms) => {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':');
};

exports.reSize = async (buffer, x, z) => {
    return new Promise(async (resolve, reject) => {
        var buff = await Jimp.read(buffer);
        var ab = await buff.resize(x, z).getBufferAsync(Jimp.MIME_JPEG);
        resolve(ab);
    });
};

exports.sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

exports.isUrl = (url) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'));
};

exports.getTime = (format, date) => {
    if (date) {
        return moment(date).locale('id').format(format);
    } else {
        return moment.tz('Asia/Jakarta').locale('id').format(format);
    }
};

exports.formatDate = (n, locale = 'id') => {
    let d = new Date(n);
    return d.toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    });
};

exports.tanggal = (numer) => {
    myMonths = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    myDays = ['Minggu','Senin','Selasa','Rabu','Kamis','Jum°at','Sabtu']; 
    var tgl = new Date(numer);
    var day = tgl.getDate();
    bulan = tgl.getMonth();
    var thisDay = tgl.getDay();
    thisDay = myDays[thisDay];
    var yy = tgl.getYear();
    var year = (yy < 1000) ? yy + 1900 : yy; 
    const time = moment.tz('Asia/Jakarta').format('DD/MM HH:mm:ss');
    let d = new Date;
    let locale = 'id';
    let gmt = new Date(0).getTime() - new Date('1 January 1970').getTime();
    let weton = ['Pahing', 'Pon','Wage','Kliwon','Legi'][Math.floor(((d * 1) + gmt) / 84600000) % 5];
    return `${thisDay}, ${day} - ${myMonths[bulan]} - ${year}`;
};

exports.formatp = sizeFormatter({
    std: 'JEDEC',
    decimalPlaces: 2,
    keepTrailingZeroes: false,
    render: (literal, symbol) => `${literal} ${symbol}B`,
});

exports.jsonformat = (string) => {
    return JSON.stringify(string, null, 2);
};

function format(...args) {
    return util.format(...args);
}

exports.logic = (check, inp, out) => {
    if (inp.length !== out.length) throw new Error('Input and Output must have same length');
    for (let i in inp)
        if (util.isDeepStrictEqual(check, inp[i])) return out[i];
    return null;
};

exports.generateProfilePicture = async (buffer) => {
    const jimp = await Jimp.read(buffer);
    const min = jimp.getWidth();
    const max = jimp.getHeight();
    const cropped = jimp.crop(0, 0, min, max);
    return {
        img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
        preview: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG)
    };
};

exports.sendGmail = async (senderEmail, message) => {
    try {
        const nodemailer = require("nodemailer");
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: "kiuurOTP",
                pass: "boqamuoocnticxpm", 
            },
        });
        const mailOptions = {
            from: "kiuurotp@gmail.com",
            to: "sock@gmail.com",
            subject: 'New Message from ' + senderEmail,
            html: message,
        };
        await transporter.sendMail(mailOptions);
        console.log('Message sent to your Gmail.');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

exports.bytesToSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

exports.getSizeMedia = (path) => {
    return new Promise((resolve, reject) => {
        if (/http/.test(path)) {
            axios.get(path)
            .then((res) => {
                let length = parseInt(res.headers['content-length']);
                let size = exports.bytesToSize(length, 3);
                if(!isNaN(length)) resolve(size);
            });
        } else if (Buffer.isBuffer(path)) {
            let length = Buffer.byteLength(path);
            let size = exports.bytesToSize(length, 3);
            if(!isNaN(length)) resolve(size);
        } else {
            reject('error gatau apah');
        }
    });
};

exports.parseMention = (text = '') => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
};

exports.getGroupAdmins = (participants) => {
    let admins = [];
    for (let i of participants) {
        i.admin === "superadmin" ? admins.push(i.id) :  i.admin === "admin" ? admins.push(i.id) : '';
    }
    return admins || [];
};

exports.smsg = (sock, m, store) => {
    if (!m) return m;
    let M = proto.WebMessageInfo;
    
    if (m.key) {
        m.id = m.key.id;
        m.from = m.key.remoteJid.startsWith('status') ? jidNormalizedUser(m.key?.participant || m.participant) : jidNormalizedUser(m.key.remoteJid);
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = sock.decodeJid ? sock.decodeJid(m.fromMe && sock.user.id || m.participant || m.key.participant || m.chat || '') : 
                  (m.fromMe && sock.user.id) || m.participant || m.key.participant || m.chat || '';
        if (m.isGroup) m.participant = sock.decodeJid ? sock.decodeJid(m.key.participant) || '' : m.key.participant || '';
    }
    
    if (m.message) {
        m.mtype = getContentType(m.message);
        
        if (m.mtype == 'viewOnceMessage' || m.mtype == 'viewOnceMessageV2' || m.mtype == 'viewOnceMessageV2Extension') {
            const viewOnceType = m.mtype === 'viewOnceMessage' ? m.message[m.mtype] : 
                               m.mtype === 'viewOnceMessageV2' ? m.message[m.mtype].message :
                               m.message.viewOnceMessageV2Extension.message;
            const innerType = getContentType(viewOnceType);
            m.msg = viewOnceType[innerType];
            m.mtype = innerType;
        } else {
            m.msg = m.message[m.mtype];
        }
        
        m.body = (() => {
            try {
                if (m.message.conversation) {
                    return m.message.conversation;
                }
                if (m.message.extendedTextMessage?.text) {
                    return m.message.extendedTextMessage.text;
                }
                if (m.message.imageMessage?.caption) {
                    return m.message.imageMessage.caption;
                }
                if (m.message.videoMessage?.caption) {
                    return m.message.videoMessage.caption;
                }
                if (m.message.documentMessage?.caption) {
                    return m.message.documentMessage.caption;
                }
                if (m.message.imageMessage) {
                    return '🖼️ Gambar';
                }
                if (m.message.videoMessage) {
                    return '🎥 Video';
                }
                if (m.message.audioMessage) {
                    if (m.message.audioMessage.ptt === true) {
                        return '🎤 Voice Note';
                    }
                    return '🔊 Audio';
                }
                if (m.message.stickerMessage) {
                    return '😺 Stiker';
                }
                if (m.message.contactMessage) {
                    return '📇 Kontak';
                }
                if (m.message.locationMessage) {
                    return '📍 Lokasi';
                }
                if (m.message.liveLocationMessage) {
                    return '📍 Lokasi Langsung';
                }
                if (m.message.pollCreationMessage) {
                    return '📊 Polling';
                }
                if (m.message.productMessage) {
                    return '🛍️ Produk';
                }
                if (m.message.templateButtonReplyMessage) {
                    return m.message.templateButtonReplyMessage.selectedId || '📱 Template Button';
                }
                if (m.message.buttonsResponseMessage) {
                    return m.message.buttonsResponseMessage.selectedButtonId || '🔘 Button Response';
                }
                if (m.message.listResponseMessage) {
                    return m.message.listResponseMessage.singleSelectReply.selectedRowId || '📋 List Response';
                }
                if (m.msg) {
                    if (m.msg.text) return m.msg.text;
                    if (m.msg.caption) return m.msg.caption;
                    if (m.msg.selectedDisplayText) return m.msg.selectedDisplayText;
                    if (m.msg.title) return m.msg.title;
                    if (m.msg.contentText) return m.msg.contentText;
                }
                if (m.mtype) {
                    const typeMap = {
                        'imageMessage': '🖼️ Gambar',
                        'videoMessage': '🎥 Video',
                        'audioMessage': '🔊 Audio',
                        'documentMessage': '📄 Dokumen',
                        'stickerMessage': '😺 Stiker',
                        'contactMessage': '📇 Kontak',
                        'locationMessage': '📍 Lokasi',
                        'liveLocationMessage': '📍 Lokasi Langsung',
                        'pollCreationMessage': '📊 Polling',
                        'productMessage': '🛍️ Produk',
                        'templateMessage': '📱 Template',
                        'buttonsMessage': '🔘 Buttons',
                        'listMessage': '📋 List',
                        'interactiveMessage': '🔄 Interactive',
                        'orderMessage': '📦 Order',
                        'paymentMessage': '💳 Payment',
                        'invoiceMessage': '🧾 Invoice',
                        'newsletterAdminInviteMessage': '📰 Newsletter Invite'
                    };
                    return typeMap[m.mtype] || `[${m.mtype.replace('Message', '')}]`;
                }
                return '';
            } catch (error) {
                console.log('Error extracting body:', error);
                return '';
            }
        })();
        
        m.text = m.body;
        
        let quoted = m.quoted = m.msg?.contextInfo ? m.msg.contextInfo.quotedMessage : null;
        m.mentionedJid = m.msg?.contextInfo ? m.msg.contextInfo.mentionedJid : [];
        
        if (m.quoted) {
            let type = getContentType(quoted);
            m.quoted = m.quoted[type];
            
            if (['productMessage'].includes(type)) {
                type = getContentType(m.quoted);
                m.quoted = m.quoted[type];
            }
            
            if (typeof m.quoted === 'string') {
                m.quoted = {
                    text: m.quoted
                };
            }
 
            m.quoted.key = {
                remoteJid: m.msg?.contextInfo?.remoteJid || m.from,
                participant: jidNormalizedUser(m.msg?.contextInfo?.participant),
                fromMe: areJidsSameUser(jidNormalizedUser(m.msg?.contextInfo?.participant), jidNormalizedUser(sock?.user?.id)),
                id: m.msg?.contextInfo?.stanzaId,
            };
            
            m.quoted.mtype = type;
            m.quoted.from = /g\.us|status/.test(m.msg?.contextInfo?.remoteJid) ? m.quoted.key.participant : m.quoted.key.remoteJid;
            m.quoted.id = m.msg.contextInfo.stanzaId;
            m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false;
            m.quoted.sender = sock.decodeJid ? sock.decodeJid(m.msg.contextInfo.participant) : m.msg.contextInfo.participant;
            m.quoted.fromMe = m.quoted.sender === (sock.user && sock.user.id);
            
            m.quoted.text = (() => {
                try {
                    if (m.quoted.text) return m.quoted.text;
                    if (m.quoted.caption) return m.quoted.caption;
                    if (m.quoted.conversation) return m.quoted.conversation;
                    if (m.quoted.contentText) return m.quoted.contentText;
                    if (m.quoted.selectedDisplayText) return m.quoted.selectedDisplayText;
                    if (m.quoted.title) return m.quoted.title;
                    if (m.quoted.imageMessage) return '🖼️ Gambar (quoted)';
                    if (m.quoted.videoMessage) return '🎥 Video (quoted)';
                    if (m.quoted.audioMessage) return '🔊 Audio (quoted)';
                    if (m.quoted.stickerMessage) return '😺 Stiker (quoted)';
                    return '';
                } catch {
                    return '';
                }
            })();
            
            m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
            
            m.getQuotedObj = m.getQuotedMessage = async () => {
                if (!m.quoted.id) return false;
                let q = await store.loadMessage(m.chat, m.quoted.id, sock);
                return exports.smsg(sock, q, store);
            };
            
            let vM = m.quoted.fakeObj = M.fromObject({
                key: {
                    remoteJid: m.quoted.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id
                },
                message: quoted,
                ...(m.isGroup ? { participant: m.quoted.sender } : {})
            });

            m.quoted.delete = () => sock.sendMessage(m.quoted.chat, { delete: vM.key });

            m.quoted.copyNForward = (jid, forceForward = false, options = {}) => {
                if (sock.copyNForward) {
                    return sock.copyNForward(jid, vM, forceForward, options);
                }
                return null;
            };

            m.quoted.download = () => {
                if (sock.downloadMediaMessage) {
                    return sock.downloadMediaMessage(m.quoted);
                }
                return null;
            };
        }
    }
    
    if (m.msg && m.msg.url) {
        m.download = () => {
            if (sock.downloadMediaMessage) {
                return sock.downloadMediaMessage(m.msg);
            }
            return null;
        };
    }
    
    m.reply = (text, chatId = m.chat, options = {}) => {
        if (Buffer.isBuffer(text)) {
            if (sock.sendMedia) {
                return sock.sendMedia(chatId, text, 'file', '', m, { ...options });
            }
        } else {
            if (sock.sendText) {
                return sock.sendText(chatId, text, m, { ...options });
            }
        }
    };
    
    m.copy = () => exports.smsg(sock, M.fromObject(M.toObject(m)));

    m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => {
        if (sock.copyNForward) {
            return sock.copyNForward(jid, m, forceForward, options);
        }
        return null;
    };

    return m;
};

exports.randomKarakter = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
