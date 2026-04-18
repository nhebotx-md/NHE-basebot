/**
 * =========================================
 * MONGO CONNECTION — Singleton Module
 * =========================================
 * Singleton connection untuk MongoDB menggunakan Mongoose.
 * - Menggunakan process.env.MONGODB_URI
 * - Handle reconnect otomatis
 * - Connection pooling
 * - Safe untuk multiple import/require
 */

const mongoose = require('mongoose');

// =========================================
// STATE
// =========================================
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL_MS = 5000;

// =========================================
// CORE: Connect Function
// =========================================

/**
 * Connect ke MongoDB dengan singleton pattern
 * - Hanya membuat 1 connection per lifecycle
 * - Handle reconnect jika connection putus
 * - Menggunakan process.env.MONGODB_URI
 */
async function connectMongo() {
    if (isConnected && mongoose.connection.readyState === 1) {
        console.log('[MongoDB] Already connected (reusing existing connection)');
        return mongoose.connection;
    }

    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error(
            '[MongoDB] MONGODB_URI tidak ditemukan di environment variables.\n' +
            'Tambahkan MONGODB_URI di file .env atau environment system.'
        );
    }

    try {
        console.log('[MongoDB] Connecting to MongoDB...');

        await mongoose.connect(uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false, // Disable buffering saat disconnected
        });

        isConnected = true;
        reconnectAttempts = 0;

        console.log('[MongoDB] Connected successfully');

        // Setup event listeners untuk connection monitoring
        mongoose.connection.on('error', (err) => {
            console.error('[MongoDB] Connection error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            isConnected = false;
            console.warn('[MongoDB] Connection disconnected');
            handleReconnect();
        });

        mongoose.connection.on('reconnected', () => {
            isConnected = true;
            reconnectAttempts = 0;
            console.log('[MongoDB] Reconnected successfully');
        });

        return mongoose.connection;

    } catch (error) {
        isConnected = false;
        console.error('[MongoDB] Connection failed:', error.message);
        handleReconnect();
        throw error;
    }
}



// =========================================
// RECONNECT HANDLER
// =========================================

function handleReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error(`[MongoDB] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
        return;
    }

    reconnectAttempts++;
    console.log(`[MongoDB] Attempting reconnect ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${RECONNECT_INTERVAL_MS}ms...`);

    setTimeout(() => {
        connectMongo().catch((err) => {
            console.error('[MongoDB] Reconnect failed:', err.message);
        });
    }, RECONNECT_INTERVAL_MS);
}

// =========================================
// UTILITY: Get Connection State
// =========================================

function getConnectionState() {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
        99: 'uninitialized'
    };

    return {
        state: states[mongoose.connection.readyState] || 'unknown',
        readyState: mongoose.connection.readyState,
        isConnected: mongoose.connection.readyState === 1,
        reconnectAttempts
    };
}

// =========================================
// UTILITY: Disconnect (for cleanup/testing)
// =========================================

async function disconnectMongo() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        isConnected = false;
        console.log('[MongoDB] Disconnected');
    }
}

// =========================================
// EXPORT
// =========================================
module.exports = {
    connectMongo,
    disconnectMongo,
    getConnectionState,
    mongoose
};
