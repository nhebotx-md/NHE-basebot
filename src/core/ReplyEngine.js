// =========================================
// 🚀 REPLY ENGINE FINAL (CLEAN FIXED VERSION)
// =========================================

const {
    generateWAMessageFromContent,
    proto
} = require("@itsukichan/baileys");

const fetch = require("node-fetch");
const fs = require("fs");

class ReplyEngine {
    constructor({ conn, globalConfig }) {
        this.conn = conn;
        this.config = globalConfig || {};

        // 🔥 SAFE BIND ALL METHODS (ANTI this LOST)
        this.send = this.send.bind(this);
        this.sendHybrid = this.sendHybrid.bind(this);
        this.sendListUI = this.sendListUI.bind(this);
        this.sendFlow = this.sendFlow.bind(this);
        this.sendWelcomeCombo = this.sendWelcomeCombo.bind(this);
        this.sendHybridListCombo = this.sendHybridListCombo.bind(this);
        this.buildContext = this.buildContext.bind(this);
        this.buildContextInfo = this.buildContextInfo.bind(this);

        this.safeTypes = ['fkontak', 'ftext', 'fvn', 'fimg'];
    }

    safe(v, d) {
        return v !== undefined && v !== null ? v : d;
    }

    getBaseKey() {
        return {
            participant: "0@s.whatsapp.net",
            remoteJid: "status@broadcast"
        };
    }

    // ======================
    // 🔥 THUMB SAFE
    // ======================
    async resolveThumb(input) {
        try {
            if (!input) return Buffer.alloc(0);

            if (Buffer.isBuffer(input)) return input;

            if (typeof input === 'string') {

                if (input.startsWith('http')) {
                    const res = await fetch(input);
                    const buff = await res.arrayBuffer();
                    return Buffer.from(buff);
                }

                if (fs.existsSync(input)) {
                    return fs.readFileSync(input);
                }

                if (/^[A-Za-z0-9+/=]+$/.test(input)) {
                    return Buffer.from(input, 'base64');
                }
            }

            return Buffer.alloc(0);
        } catch {
            return Buffer.alloc(0);
        }
    }

    // ======================
    // 🔥 CONTEXT BUILDER (FIXED SAFE)
    // ======================
    async buildContext({ name, number, thumb, sender }) {
        return {
            name: this.safe(this.config.namaowner, name || "Unknown"),
            number: this.safe(number, "0"),
            thumb: await this.resolveThumb(thumb || this.config.thumb),
            sender: sender || "0@s.whatsapp.net"
        };
    }

    // ======================
    // 🔥 CONTEXT INFO
    // ======================
    buildContextInfo(m, options = {}) {
        return {
            mentionedJid: [m.sender || "0@s.whatsapp.net"],
            forwardingScore: 999,
            isForwarded: true,
            externalAdReply: {
                title: options.title || this.config.botname,
                body: options.body || "ShoNhe Engine",
                thumbnailUrl: this.config.thumb,
                sourceUrl: "https://github.com",
                mediaType: 1,
                renderLargerThumbnail: true
            }
        };
    }

    // ======================
    // 🔥 FAKE MESSAGE BUILDER
    // ======================
    buildFake(type, ctx, options = {}) {
        const baseKey = this.getBaseKey();

        const builders = {
            fkontak: () => ({
                key: baseKey,
                message: {
                    contactMessage: {
                        displayName: ctx.name,
                        vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${ctx.name}\nTEL;waid=${ctx.number}:${ctx.number}\nEND:VCARD`,
                        jpegThumbnail: ctx.thumb
                    }
                }
            }),

            fimg: () => ({
                key: baseKey,
                message: {
                    imageMessage: {
                        caption: options.caption || "Fake Image",
                        jpegThumbnail: ctx.thumb
                    }
                }
            }),

            ftext: () => ({
                key: baseKey,
                message: {
                    extendedTextMessage: {
                        text: options.text || "Fake Text"
                    }
                }
            })
        };

        return builders[type] ? builders[type]() : builders.ftext();
    }

    // ======================
    // 🔥 BASIC SEND
    // ======================
    async send(m, { text = "", ctx = {} }) {
        try {
            const context = await this.buildContext({
                name: ctx.name,
                number: ctx.number,
                thumb: ctx.thumb,
                sender: m.sender || "0@s.whatsapp.net"
            });

            const fake = this.buildFake('fkontak', context);

            return await this.conn.sendMessage(m.chat, { text }, { quoted: fake });

        } catch (err) {
            console.error("[Send Error]", err);
            return false;
        }
    }

    // ======================
    // 🔥 HYBRID SEND (FIXED CRITICAL)
    // ======================
    async sendHybrid(m, config = {}) {
        try {
            const ctx = await this.buildContext({
                name: config.ctx?.name || m.pushName || "User",
                number: config.ctx?.number || m.sender,
                thumb: config.ctx?.thumb || this.config.thumb,
                sender: m.sender || "0@s.whatsapp.net"
            });

            if (!ctx) {
                throw new Error('[ReplyEngine] buildContext failed');
            }

            const fake = this.buildFake('fkontak', ctx);

            return await this.conn.sendMessage(m.chat, {
                text: config.text || "",
                footer: config.footer || "",
                buttons: config.buttons || [],
                headerType: 1,
                contextInfo: this.buildContextInfo(m, config)
            }, { quoted: fake });

        } catch (err) {
            console.error("[Hybrid Error]", err);
            return false;
        }
    }

    // ======================
    // 🔥 LIST UI
    // ======================
    async sendListUI(m, config = {}) {
        try {
            const ctx = await this.buildContext({
                name: config.ctx?.name || m.pushName || "User",
                number: config.ctx?.number || m.sender,
                thumb: config.ctx?.thumb || this.config.thumb,
                sender: m.sender || "0@s.whatsapp.net"
            });

            const fake = this.buildFake('fkontak', ctx);

            return await this.conn.sendMessage(m.chat, {
                text: config.text || "",
                footer: config.footer || "ShoNhe Engine",
                title: config.title || "MENU",
                buttonText: config.buttonText || "OPEN MENU",
                sections: config.sections || [],
                contextInfo: this.buildContextInfo(m, config)
            }, { quoted: fake });

        } catch (err) {
            console.error("[ListUI Error]", err);
            return false;
        }
    }

    // ======================
    // 🔥 FLOW UI
    // ======================
    async sendFlow(m, config = {}) {
        try {
            const ctx = await this.buildContext({
                name: config.ctx?.name || m.pushName || "User",
                number: config.ctx?.number || m.sender,
                thumb: config.ctx?.thumb || this.config.thumb,
                sender: m.sender || "0@s.whatsapp.net"
            });

            const fake = this.buildFake('fkontak', ctx);

            const msg = generateWAMessageFromContent(m.chat,
                proto.Message.fromObject({
                    viewOnceMessage: {
                        message: {
                            buttonsMessage: {
                                text: config.text || "Flow Menu",
                                footer: config.footer || this.config.botname,
                                buttons: [
                                    {
                                        buttonId: 'action',
                                        buttonText: { displayText: config.buttonText || 'OPEN' },
                                        type: 4,
                                        nativeFlowInfo: {
                                            name: 'single_select',
                                            paramsJson: JSON.stringify(config.flow || {})
                                        }
                                    }
                                ],
                                headerType: 1
                            }
                        }
                    }
                }), { quoted: fake });

            await this.conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
            return true;

        } catch (err) {
            console.error("[Flow Error]", err);
            return false;
        }
    }

    // ======================
    // 🔥 WELCOME COMBO
    // ======================
    async sendWelcomeCombo(m, config = {}) {
        try {
            const ctx = await this.buildContext({
                name: config.ctx?.name || m.pushName || "User",
                number: config.ctx?.number || m.sender,
                thumb: config.ctx?.thumb || this.config.thumb,
                sender: m.sender || "0@s.whatsapp.net"
            });

            const fake = this.buildFake('fkontak', ctx);

            let imageBuffer = config.image
                ? await this.resolveThumb(config.image)
                : null;

            const message = {
                caption: config.caption,
                footer: config.footer || this.config.botname,
                buttons: config.buttons || [],
                headerType: imageBuffer ? 4 : 1,
                viewOnce: true,
                contextInfo: this.buildContextInfo(m, config)
            };

            if (imageBuffer && imageBuffer.length > 0) {
                message.image = imageBuffer;
            } else {
                message.text = config.caption;
            }

            return await this.conn.sendMessage(m.chat, message, { quoted: fake });

        } catch (err) {
            console.error("[WelcomeCombo Error]", err);
            return false;
        }
    }

    // ======================
    // 🔥 HYBRID LIST COMBO
    // ======================
    async sendHybridListCombo(m, config = {}) {
        try {
            const ctx = await this.buildContext({
                name: config.ctx?.name || m.pushName || "User",
                number: config.ctx?.number || m.sender,
                thumb: config.ctx?.thumb || this.config.thumb,
                sender: m.sender || "0@s.whatsapp.net"
            });

            const fake = this.buildFake('fkontak', ctx);

            let imageBuffer = config.image
                ? await this.resolveThumb(config.image)
                : null;

            const payload = {
                caption: config.caption,
                footer: config.footer || this.config.botname,
                buttons: config.buttons || [],
                headerType: imageBuffer ? 4 : 1,
                viewOnce: true,
                contextInfo: this.buildContextInfo(m, config)
            };

            if (imageBuffer && imageBuffer.length > 0) {
                payload.image = imageBuffer;
            } else {
                payload.text = config.caption;
            }

            await this.conn.sendMessage(m.chat, payload, { quoted: fake });

            return true;

        } catch (err) {
            console.error("[HybridListCombo Error]", err);
            return false;
        }
    }

    async editMessage(m, key, text) {
        try {
            return await this.conn.sendMessage(m.chat, { text, edit: key });
        } catch {
            return false;
        }
    }

    async sendStatus(text) {
        try {
            return await this.conn.sendMessage("status@broadcast", { text }, { broadcast: true });
        } catch {
            return false;
        }
    }
}

module.exports = {
    createReplyEngine: (conn, globalConfig = global) =>
        new ReplyEngine({ conn, globalConfig })
};