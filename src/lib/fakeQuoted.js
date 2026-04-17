// =========================================
// 📌 FAKE QUOTED LIBRARY (GLOBAL FIXED)
// =========================================

const fs = require('fs');

// default thumb global
global.thumb = global.thumb || "https://i.ibb.co/997h3mWM/sho-Nhe.jpg";

// ======================
// 🔥 RESOLVE THUMB (SYNC + ASYNC SAFE)
// ======================
const resolveThumb = async (input) => {
    try {
        if (!input) return Buffer.alloc(0);

        if (Buffer.isBuffer(input)) return input;

        if (typeof input === 'string') {
            // URL
            if (input.startsWith('http')) {
                const res = await fetch(input);
                const buff = await res.arrayBuffer();
                return Buffer.from(buff);
            }

            // BASE64
            if (/^[A-Za-z0-9+/=]+$/.test(input)) {
                return Buffer.from(input, 'base64');
            }

            // FILE PATH
            if (fs.existsSync(input)) {
                return fs.readFileSync(input);
            }
        }

        return Buffer.alloc(0);
    } catch {
        return Buffer.alloc(0);
    }
};

// ======================
// 🔥 CORE BUILDER
// ======================
const buildFake = async (m, type = 'fkontak', options = {}) => {
    const sender = m.sender || '0@s.whatsapp.net';
    const number = sender.split("@")[0] || "0";
    const name = m.pushName || "User";

    const thumb = await resolveThumb(options.thumb || global.thumb);

    const baseKey = {
        participant: "0@s.whatsapp.net",
        remoteJid: "status@broadcast"
    };

    const builders = {

        fkontak: () => ({
            key: baseKey,
            message: {
                contactMessage: {
                    displayName: options.name || global.namaowner || name,
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${options.name || global.namaowner || name}\nTEL;waid=${number}:${number}\nEND:VCARD`,
                    jpegThumbnail: thumb
                }
            }
        }),

        fvn: () => ({
            key: baseKey,
            message: {
                audioMessage: {
                    mimetype: "audio/ogg; codecs=opus",
                    seconds: 10,
                    ptt: true
                }
            }
        }),

        fgif: () => ({
            key: baseKey,
            message: {
                videoMessage: {
                    caption: options.caption || "Fake GIF",
                    gifPlayback: true,
                    jpegThumbnail: thumb
                }
            }
        }),

        fimg: () => ({
            key: baseKey,
            message: {
                imageMessage: {
                    caption: options.caption || "Fake Image",
                    jpegThumbnail: thumb
                }
            }
        }),

        fdoc: () => ({
            key: baseKey,
            message: {
                documentMessage: {
                    title: options.title || "Fake Document",
                    fileName: options.fileName || "file.pdf",
                    mimetype: "application/pdf",
                    jpegThumbnail: thumb
                }
            }
        }),

        forder: () => ({
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
        }),

        floc: () => ({
            key: baseKey,
            message: {
                locationMessage: {
                    name: options.name || "Fake Location",
                    jpegThumbnail: thumb
                }
            }
        }),

        ftext: () => ({
            key: baseKey,
            message: {
                extendedTextMessage: {
                    text: options.text || "Fake Text Message"
                }
            }
        }),

        fproduct: () => ({
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
        })
    };

    if (type === 'random') {
        const keys = Object.keys(builders);
        const pick = keys[Math.floor(Math.random() * keys.length)];
        return builders[pick]();
    }

    return builders[type] ? builders[type]() : builders.fkontak();
};

// ======================
// 🔥 SHORTCUT (LIKE OLD q)
// ======================
const q = async (m, type = 'fkontak', opt = {}) => {
    return await buildFake(m, type, opt);
};

// ======================
module.exports = {
    buildFake,
    q
};