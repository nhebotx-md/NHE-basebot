/**
 * =========================================
 * FINANCE USER MODEL — Mongoose Schema
 * =========================================
 * Model untuk user finance di MongoDB.
 * - userId: unique identifier (nomor WhatsApp dari ctx.user.number)
 * - createdAt: tanggal pembuatan
 * - updatedAt: tanggal update terakhir
 */

const mongoose = require('mongoose');

// =========================================
// SCHEMA DEFINITION
// =========================================

const FinanceUserSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'userId is required'],
        unique: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'finance_users',
    versionKey: false
});

// =========================================
// INDEXES
// =========================================

// Index pada userId untuk query cepat (sudah unique di atas)


// =========================================
// PRE-SAVE HOOK
// =========================================

FinanceUserSchema.pre('save', function (next) {
    try {
        if (typeof next !== 'function') return;
        next();
    } catch (err) {
        next(err);
    }
});

// =========================================
// MODEL
// =========================================

const FinanceUser = mongoose.model('FinanceUser', FinanceUserSchema);

// =========================================
// EXPORT
// =========================================
module.exports = FinanceUser;
