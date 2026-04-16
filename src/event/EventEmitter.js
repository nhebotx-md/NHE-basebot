/**
 * =========================================
 * 📌 FILE: src/event/EventEmitter.js (RECONSTRUCTED)
 * 📌 DESCRIPTION:
 * Event emitter untuk bot WhatsApp
 * Mengelola event subscription dan emission
 *
 * 📁 MAPPING: (new file) → src/event/EventEmitter.js
 * =========================================
 */

const EventEmitter = require('events');

class BotEventEmitter extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(20);
    }

    emitEvent(eventName, ...args) {
        return this.emit(eventName, ...args);
    }

    onEvent(eventName, listener) {
        return this.on(eventName, listener);
    }

    onceEvent(eventName, listener) {
        return this.once(eventName, listener);
    }

    offEvent(eventName, listener) {
        return this.off(eventName, listener);
    }
}

const botEvents = new BotEventEmitter();

module.exports = {
    BotEventEmitter,
    botEvents
};
