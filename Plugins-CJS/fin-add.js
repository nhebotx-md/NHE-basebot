const handler = async (m, Obj) => {
    const { args, reply, conn, createReplyEngine, global, ctx } = Obj;

    try {
        if (!createReplyEngine) {
            throw new Error('[fin-add] createReplyEngine not provided');
        }

        const engineRaw = createReplyEngine(conn, global);



const engine = {
    send: engineRaw.send.bind(engineRaw),
    sendHybrid: engineRaw.sendHybrid.bind(engineRaw),
    sendListUI: engineRaw.sendListUI.bind(engineRaw),
    sendFlow: engineRaw.sendFlow.bind(engineRaw),
};
console.log('[ENGINE DEBUG]', Object.keys(engineRaw));
const safeCall = (fn, ...args) => {
    if (typeof fn !== 'function') {
        console.warn('[SAFE CALL] invalid function');
        return;
    }
    return fn(...args);
};

        // ================================
        // VALIDASI CONTEXT (WAJIB)
        // ================================
        if (!ctx || !ctx.user) {
            await reply('⚠️ Silakan register terlebih dahulu dengan mengetik .register');
            return;
        }

        if (!ctx.userId) {
            console.error('[fin-add] ctx.userId missing:', ctx);
            await reply('❌ Sistem gagal membaca identitas user');
            return;
        }

        const userId = ctx.userId;
        const number = ctx.number;

        // ================================
        // LOCAL CONTEXT UNTUK UI
        // ================================
        const ctx_local = {
            name: m.pushName || ctx.alias || 'User',
            number,
            thumb: global?.thumb
        };

        // ================================
        // IMPORT ENGINE (LAZY LOAD)
        // ================================
        const { addTransaction, formatRupiah } = require('../src/domain/finance/engine');

        // ================================
        // VALIDASI ARGUMENT
        // ================================
        if (!args || args.length < 3) {
            return engine.sendHybrid(m, {
                text: `
╭───〔 FINANCE ADD 〕───╮
│
│  Format:
│  .finadd <income|expense> <jumlah> <catatan>
│
│  Contoh:
│  .finadd income 10000 makan siang
│  .finadd expense 5000 kopi
│
╰────────────────────╯`,
                footer: global?.botname || 'Finance System',
                buttons: [
                    { buttonId: '.finbalance', buttonText: { displayText: '💰 SALDO' } },
                    { buttonId: '.finhistory', buttonText: { displayText: '📊 RIWAYAT' } }
                ],
                ctx: ctx_local
            });
        }

        // ================================
        // PARSE INPUT
        // ================================
        const type = args[0]?.toLowerCase();
        const amount = parseFloat(args[1]?.replace(/[^0-9]/g, ''));
        const note = args.slice(2).join(' ').trim();

        // ================================
        // VALIDASI BISNIS
        // ================================
        if (!['income', 'expense'].includes(type)) {
            return engine.send(m, {
                text: '❌ Tipe harus *income* atau *expense*',
                ctx: ctx_local
            });
        }

        if (isNaN(amount) || amount <= 0) {
            return engine.send(m, {
                text: '❌ Jumlah harus angka positif',
                ctx: ctx_local
            });
        }

        if (!note) {
            return engine.send(m, {
                text: '❌ Catatan tidak boleh kosong',
                ctx: ctx_local
            });
        }

        // ================================
        // EXECUTE ENGINE
        // ================================
        const result = await addTransaction(userId, {
            type,
            amount,
            note,
            category: type === 'income' ? 'Pemasukan' : 'Pengeluaran'
        });

        if (!result || !result.success) {
            console.error('[fin-add] Engine error:', result);
            return engine.send(m, {
                text: `❌ Error: ${result?.error || 'Unknown error'}`,
                ctx: ctx_local
            });
        }

        // ================================
        // OUTPUT SUCCESS
        // ================================
        const title = type === 'income' ? 'PEMASUKAN' : 'PENGELUARAN';
        const emoji = type === 'income' ? '💰' : '💸';

        return engine.sendHybrid(m, {
            text: `
╭───〔 ${title} TERCATAT 〕───╮
│
│  ${emoji} Transaksi Berhasil
│
│  💵 ${formatRupiah(amount)}
│  📝 ${note}
│
│  💳 Saldo: ${formatRupiah(result.balance)}
│  📅 ${new Date(result.transaction.createdAt).toLocaleString('id-ID')}
│
╰────────────────────╯`,
            footer: global?.botname || 'Finance System',
            buttons: [
                { buttonId: `.finadd ${type} `, buttonText: { displayText: `➕ ${title}` } },
                { buttonId: '.finbalance', buttonText: { displayText: '💰 SALDO' } },
                { buttonId: '.finhistory', buttonText: { displayText: '📊 RIWAYAT' } }
            ],
            ctx: ctx_local
        });

    } catch (err) {
        console.error('[fin-add fatal]', err);
        await reply('❌ Terjadi error saat mencatat transaksi');
    }
};

handler.command = ['finadd', 'fadd', 'catat'];
handler.tags = ['finance'];
handler.help = ['finadd <income|expense> <jumlah> <catatan>'];

module.exports = handler;