/**
 * =========================================
 * PLUGIN: fin-add.js — Add Income / Expense
 * =========================================
 * Command: .finadd <income|expense> <amount> <category> [description]
 * Contoh: .finadd income 5000000 gaji "Gaji Bulan April"
 *         .finadd expense 150000 makan "Lunch di restoran"
 */

const handler = async (m, Obj) => {
    const { text, args, reply, conn, createReplyEngine, global } = Obj;

    try {
        if (!createReplyEngine) {
            throw new Error('createReplyEngine is not provided');
        }

        const engine = createReplyEngine(conn, global);
        const sender = m.sender || "0@s.whatsapp.net";
        const userId = sender.split('@')[0];

        const ctx = {
            name: m.pushName || "User",
            number: userId,
            thumb: global?.thumb
        };

        // Initialize finance system
        const { initFinanceDB, addIncome, addExpense, formatCurrency } = require('../src/domain/finance/engine');
        const { emitFinanceEvent, EVENT_TYPES, setupDefaultListeners } = require('../src/domain/finance/events');

        initFinanceDB();
        setupDefaultListeners();

        // Parse arguments
        if (args.length < 3) {
            await engine.sendHybrid(m, {
                text: `
╭───〔 FINANCE ADD 〕───╮
│
│  Format penggunaan:
│  .finadd <tipe> <jumlah> <kategori> [deskripsi]
│
│  Contoh:
│  .finadd income 5000000 gaji
│  .finadd expense 150000 makan Makan siang
│
│  Tipe: income / expense
│  Kategori umum:
│  • income: gaji, bonus, investasi, lainnya
│  • expense: makan, transport, belanja, tagihan, hiburan, kesehatan, pendidikan, lainnya
│
╰────────────────────╯`,
                footer: global?.botname || "Finance System",
                buttons: [
                    { buttonId: ".finbalance", buttonText: { displayText: "💰 SALDO" } },
                    { buttonId: ".finreport", buttonText: { displayText: "📊 LAPORAN" } }
                ],
                ctx
            });
            return;
        }

        const type = args[0].toLowerCase();
        const amount = parseFloat(args[1].replace(/[^0-9]/g, ''));
        const category = args[2].toLowerCase();
        const description = args.slice(3).join(' ') || `${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${category}`;

        // Validate type
        if (!['income', 'expense'].includes(type)) {
            await engine.send(m, {
                text: `❌ Tipe harus *income* atau *expense*\n\nContoh:\n.finadd income 5000000 gaji`,
                ctx
            });
            return;
        }

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            await engine.send(m, { text: `❌ Jumlah harus angka positif`, ctx });
            return;
        }

        let result;

        if (type === 'income') {
            result = addIncome(userId, amount, category, description, {
                chatId: m.chat,
                messageId: m.key?.id
            });

            if (!result.success) {
                await engine.send(m, { text: `❌ Error: ${result.errors.join(', ')}`, ctx });
                return;
            }

            // Emit event
            emitFinanceEvent(EVENT_TYPES.INCOME_RECEIVED, {
                userId,
                amount,
                category,
                transaction: result.transaction
            });

            await engine.sendHybrid(m, {
                text: `
╭───〔 INCOME RECORDED 〕───╮
│
│  ✅ Pemasukan tercatat!
│
│  📌 ID: ${result.transaction.id}
│  💵 Jumlah: ${formatCurrency(amount)}
│  📂 Kategori: ${category}
│  📝 Deskripsi: ${description}
│  💰 Saldo Baru: ${formatCurrency(result.newBalance)}
│  📅 Tanggal: ${new Date(result.transaction.timestamp).toLocaleString('id-ID')}
│
╰────────────────────╯`,
                footer: global?.botname || "Finance System",
                buttons: [
                    { buttonId: ".finadd income ", buttonText: { displayText: "➕ INCOME LAGI" } },
                    { buttonId: ".finbalance", buttonText: { displayText: "💰 CEK SALDO" } },
                    { buttonId: ".finreport", buttonText: { displayText: "📊 LAPORAN" } }
                ],
                ctx
            });

        } else {
            result = addExpense(userId, amount, category, description, {
                chatId: m.chat,
                messageId: m.key?.id
            });

            if (!result.success) {
                await engine.send(m, { text: `❌ Error: ${result.errors.join(', ')}`, ctx });
                return;
            }

            // Emit event
            emitFinanceEvent(EVENT_TYPES.EXPENSE_RECORDED, {
                userId,
                amount,
                category,
                transaction: result.transaction
            });

            let alertText = '';
            if (result.budgetAlerts && result.budgetAlerts.length > 0) {
                alertText = '\n│\n│  ⚠️ BUDGET ALERT:\n';
                for (const alert of result.budgetAlerts) {
                    alertText += `│  ${alert.message}\n`;
                }
            }

            await engine.sendHybrid(m, {
                text: `
╭───〔 EXPENSE RECORDED 〕───╮
│
│  ✅ Pengeluaran tercatat!
│
│  📌 ID: ${result.transaction.id}
│  💵 Jumlah: ${formatCurrency(amount)}
│  📂 Kategori: ${category}
│  📝 Deskripsi: ${description}
│  💰 Saldo Baru: ${formatCurrency(result.newBalance)}
│  📅 Tanggal: ${new Date(result.transaction.timestamp).toLocaleString('id-ID')}${alertText}
│
╰────────────────────╯`,
                footer: global?.botname || "Finance System",
                buttons: [
                    { buttonId: ".finadd expense ", buttonText: { displayText: "➖ EXPENSE LAGI" } },
                    { buttonId: ".finbalance", buttonText: { displayText: "💰 CEK SALDO" } },
                    { buttonId: ".finreport", buttonText: { displayText: "📊 LAPORAN" } }
                ],
                ctx
            });
        }

    } catch (err) {
        console.error('[fin-add error]', err);
        await reply('❌ Terjadi error saat mencatat transaksi. Coba lagi.');
    }
};

handler.command = ['finadd', 'fadd', 'catat'];
handler.tags = ['finance'];
handler.help = ['finadd <income|expense> <jumlah> <kategori> [deskripsi]'];

module.exports = handler;
