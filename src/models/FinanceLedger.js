/**
 * =========================================
 * FINANCE LEDGER MODEL — Mongoose Schema
 * =========================================
 * Model untuk ledger transaksi di MongoDB.
 * - Ledger bersifat APPEND-ONLY (immutable)
 * - Tidak boleh ada edit/delete setelah insert
 * - Semua balance dihitung via aggregation (derived)
 */

const mongoose = require('mongoose');

// =========================================
// SCHEMA DEFINITION
// =========================================

const FinanceLedgerSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'userId is required'],
        index: true,
        trim: true
    },
    type: {
        type: String,
        required: [true, 'type is required'],
        enum: {
            values: ['income', 'expense'],
            message: 'type must be either "income" or "expense"'
        }
    },
    amount: {
        type: Number,
        required: [true, 'amount is required'],
        min: [0, 'amount cannot be negative']
    },
    note: {
        type: String,
        default: '',
        trim: true,
        maxlength: [500, 'note cannot exceed 500 characters']
    },
    category: {
        type: String,
        default: 'Lainnya',
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true // Ledger immutable — tidak boleh diubah
    }
}, {
    // Otomatis manage createdAt dan updatedAt
    timestamps: { createdAt: 'createdAt', updatedAt: false }, // No updatedAt karena immutable
    // Collection name di MongoDB
    collection: 'finance_ledgers',
    // Minimalkan field _v
    versionKey: false
});

// =========================================
// INDEXES (Performance Optimization)
// =========================================

// Compound index untuk query user + type
FinanceLedgerSchema.index({ userId: 1, type: 1 });

// Index untuk date range queries
FinanceLedgerSchema.index({ userId: 1, createdAt: -1 });

// Index untuk category queries
FinanceLedgerSchema.index({ userId: 1, category: 1 });

// =========================================
// PRE-SAVE VALIDATION
// =========================================

FinanceLedgerSchema.pre('save', function(next) {
    // Pastikan userId selalu string bersih
    if (this.userId) {
        this.userId = this.userId.toString().trim();
    }

    // Pastikan amount selalu positive number
    if (this.amount !== undefined) {
        this.amount = Math.abs(parseFloat(this.amount));
        if (isNaN(this.amount) || this.amount <= 0) {
            return next(new Error('amount must be a positive number'));
        }
    }

    next();
});

// =========================================
// STATIC METHODS (Query Helpers)
// =========================================

/**
 * Get transactions by userId dengan optional filters
 */
FinanceLedgerSchema.statics.getByUser = function(userId, options = {}) {
    const query = { userId };

    if (options.type) {
        query.type = options.type;
    }
    if (options.category) {
        query.category = options.category;
    }
    if (options.startDate || options.endDate) {
        query.createdAt = {};
        if (options.startDate) query.createdAt.$gte = new Date(options.startDate);
        if (options.endDate) query.createdAt.$lte = new Date(options.endDate);
    }

    let q = this.find(query).sort({ createdAt: -1 });

    if (options.limit) {
        q = q.limit(options.limit);
    }

    return q.lean().exec();
};

/**
 * Aggregate balance: income - expense
 */
FinanceLedgerSchema.statics.getBalance = async function(userId) {
    const result = await this.aggregate([
        { $match: { userId } },
        {
            $group: {
                _id: null,
                totalIncome: {
                    $sum: {
                        $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
                    }
                },
                totalExpense: {
                    $sum: {
                        $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
                    }
                }
            }
        }
    ]).exec();

    if (!result || result.length === 0) {
        return { balance: 0, totalIncome: 0, totalExpense: 0 };
    }

    const { totalIncome, totalExpense } = result[0];
    return {
        balance: totalIncome - totalExpense,
        totalIncome,
        totalExpense
    };
};

/**
 * Get summary by category untuk user tertentu
 */
FinanceLedgerSchema.statics.getCategorySummary = async function(userId, options = {}) {
    const matchStage = { userId };

    if (options.startDate || options.endDate) {
        matchStage.createdAt = {};
        if (options.startDate) matchStage.createdAt.$gte = new Date(options.startDate);
        if (options.endDate) matchStage.createdAt.$lte = new Date(options.endDate);
    }

    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: { category: '$category', type: '$type' },
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: '$_id.category',
                income: {
                    $sum: {
                        $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0]
                    }
                },
                expense: {
                    $sum: {
                        $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0]
                    }
                },
                count: { $sum: '$count' }
            }
        },
        { $sort: { _id: 1 } }
    ]).exec();
};

// =========================================
// MODEL
// =========================================

const FinanceLedger = mongoose.model('FinanceLedger', FinanceLedgerSchema);

// =========================================
// EXPORT
// =========================================
module.exports = FinanceLedger;
