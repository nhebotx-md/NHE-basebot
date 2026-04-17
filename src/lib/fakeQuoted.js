// =========================================
// 📌 FAKE QUOTED LIBRARY (Global)
// =========================================
const fs = require('fs');

const thumbPath = './Tang/image/owner.jpg';
const thumbBuffer = fs.existsSync(thumbPath) ? fs.readFileSync(thumbPath) : null;

const fakeQuoted = (m, options = {}) => {
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

const q = (m, type = 'fkontak', opt = {}) => {
    const data = fakeQuoted(m, opt);
    
    if (type === 'random') {
        return data.random();           // ← INI YANG DIPERBAIKI
    }
    
    return data[type] || data.fkontak;
};

module.exports = { fakeQuoted, q };