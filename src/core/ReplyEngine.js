// =========================================
// 🚀 REPLY ENGINE FINAL (COMBO UI + LIST + WELCOME + FLOW)
// =========================================

const {
    generateWAMessageFromContent,
    proto
} = require("@itsukichan/baileys");

class ReplyEngine {
    constructor({ conn, globalConfig }) {
        this.conn = conn;
        this.config = globalConfig || {};
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
    // 🔥 THUMB SAFE (ANTI ERROR)
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

                if (/^[A-Za-z0-9+/=]+$/.test(input)) {
                    return Buffer.from(input, 'base64');
                }
            }

            return Buffer.alloc(0);
        } catch {
            return Buffer.alloc(0);
        }
    }

    async buildContext({ name, number, thumb, sender }) {
        return {
            name: this.safe(this.config.namaowner, name || "Unknown"),
            number: this.safe(number, "0"),
            thumb: await this.resolveThumb(thumb || this.config.thumb),
            sender: sender || "0@s.whatsapp.net"
        };
    }

    // ======================
    // 🔥 FAKE BUILDER
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

    resolveMode(userMode) {
        switch (userMode) {
            case 'button': return 'fimg';
            case 'text': return 'ftext';
            default: return 'fkontak';
        }
    }

    // ======================
    // 🔥 CONTEXT BOOST (PREVIEW)
    // ======================
    buildContextInfo(m, options = {}) {
        return {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            externalAdReply: {
                title: options.title || this.config.botname,
                body: options.body || "ShoNhe Engine",
                thumbnailUrl: this.config.thumbnail,
                sourceUrl: "https://github.com",
                mediaType: 1,
                renderLargerThumbnail: true
            }
        };
    }

    formatUI({ title, body, footer }) {
        return `╭───〔 ${title || "PANEL"} 〕───⬣
${body || ""}
╰────────────⬣
${footer || ""}`;
    }

    // ======================
    // BASIC
    // ======================
    async send(m, { text = "", ctx = {} }) {
        try {
            const context = await this.buildContext({
                name: ctx.name,
                number: ctx.number,
                thumb: ctx.thumb,
                sender: m.sender
            });

            const fake = this.buildFake('fkontak', context);

            return this.conn.sendMessage(m.chat, { text }, { quoted: fake });

        } catch (err) {
            console.error("[Send Error]", err);
        }
    }

    // ======================
    // 🔥 HYBRID BUTTON
    // ======================
    async sendHybrid(m, config = {}) {
        try {
            const ctx = await this.buildContext({
                name: config.ctx?.name,
                number: config.ctx?.number,
                thumb: config.ctx?.thumb,
                sender: m.sender
            });

            const fake = this.buildFake('fkontak', ctx);

            return this.conn.sendMessage(m.chat, {
                text: config.text,
                footer: config.footer || "",
                buttons: config.buttons || [],
                headerType: 1,
                contextInfo: this.buildContextInfo(m, config)
            }, { quoted: fake });

        } catch (err) {
            console.error("[Hybrid Error]", err);
        }
    }

    // ======================
    // 🔥 LIST UI
    // ======================
    async sendListUI(m, config = {}) {
        try {
            const ctx = await this.buildContext({
                name: config.ctx?.name,
                number: config.ctx?.number,
                thumb: config.ctx?.thumb,
                sender: m.sender
            });

            const fake = this.buildFake('fkontak', ctx);

            return this.conn.sendMessage(m.chat, {
                text: this.formatUI(config),
                footer: config.footer || "ShoNhe Engine",
                title: config.title || "MENU",
                buttonText: config.buttonText || "OPEN MENU",
                sections: config.sections || [],
                contextInfo: this.buildContextInfo(m, config)
            }, { quoted: fake });

        } catch (err) {
            console.error("[ListUI Error]", err);
        }
    }

    // ======================
    // 🔥 FLOW UI (LEVEL TINGGI)
    // ======================
    async sendFlow(m, config = {}) {
        try {
            const ctx = await this.buildContext({
                name: config.ctx?.name,
                number: config.ctx?.number,
                thumb: config.ctx?.thumb,
                sender: m.sender
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

        } catch (err) {
            console.error("[Flow Error]", err);
        }
    }

    // ======================
    // 🔥 WELCOME COMBO
    // ======================
    async sendWelcomeCombo(m, config = {}) {
        try {
            let imageBuffer = null;

            if (config.image) {
                try {
                    const res = await fetch(config.image);
                    imageBuffer = Buffer.from(await res.arrayBuffer());
                } catch {
                    imageBuffer = null;
                }
            }

            const ctx = await this.buildContext({
                name: config.ctx?.name,
                number: config.ctx?.number,
                thumb: config.ctx?.thumb,
                sender: m.sender
            });

            const fake = this.buildFake('fkontak', ctx);

            const message = {
                caption: config.caption,
                footer: config.footer || this.config.botname,
                buttons: config.buttons || [],
                headerType: 4,
                viewOnce: true,
                contextInfo: this.buildContextInfo(m, config)
            };

            if (imageBuffer) {
                message.image = imageBuffer;
            } else {
                message.text = config.caption;
            }

            return await this.conn.sendMessage(m.chat, message, { quoted: fake });

        } catch (err) {
            console.error("[WelcomeCombo Error]", err);
        }
    }

    // ======================
    // 🔥 HYBRID LIST COMBO (FIX YANG KAMU MAU)
    // ======================
    async sendHybridListCombo(m, config = {}) {
        try {

            const ctx = await this.buildContext({
                name: config.ctx?.name,
                number: config.ctx?.number,
                thumb: config.ctx?.thumb,
                sender: m.sender
            });

            const fake = this.buildFake('fkontak', ctx);

            let imageBuffer = null;

            if (config.image) {
                try {
                    imageBuffer = await this.resolveThumb(config.image);
                } catch {
                    imageBuffer = null;
                }
            }

            // 1. WELCOME
            const welcomePayload = {
                caption: config.caption,
                footer: config.footer || this.config.botname,
                buttons: config.buttons || [],
                headerType: imageBuffer ? 4 : 1,
                viewOnce: true,
                contextInfo: this.buildContextInfo(m, config)
            };

            if (imageBuffer) welcomePayload.image = imageBuffer;
            else welcomePayload.text = config.caption;

            await this.conn.sendMessage(m.chat, welcomePayload, { quoted: fake });

            // 2. TRANSITION
            await this.conn.sendMessage(m.chat, {
                text: "⚡ Loading menu system...",
                contextInfo: this.buildContextInfo(m, config)
            }, { quoted: fake });

            // 3. LIST UI
            await this.conn.sendMessage(m.chat, {
                text: this.formatUI({
                    title: config.list?.title || "MENU",
                    body: config.list?.body || "",
                    footer: config.footer || this.config.botname
                }),
                footer: config.footer || this.config.botname,
                title: config.list?.title || "MENU",
                buttonText: config.list?.buttonText || "OPEN MENU",
                sections: config.list?.sections || [],
                contextInfo: this.buildContextInfo(m, config)
            }, { quoted: fake });

            return true;

        } catch (err) {
            console.error("[HybridListCombo Error]", err);
            return false;
        }
    }

    async editMessage(m, key, text) {
        return this.conn.sendMessage(m.chat, { text, edit: key });
    }

    async sendStatus(text) {
        return this.conn.sendMessage("status@broadcast", { text }, { broadcast: true });
    }
}

module.exports = {
    createReplyEngine: (conn, globalConfig = global) =>
        new ReplyEngine({ conn, globalConfig })
};