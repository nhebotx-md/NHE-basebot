const handler = async (m, Obj) => {
    const { args, reply, conn, createReplyEngine, global, ctx } = Obj;

    try {
        if (!createReplyEngine) {
            throw new Error('createReplyEngine is not provided');
        }

        const engine = createReplyEngine(conn, global);

        // =========================
        // VALIDASI MIDDLEWARE
        // =========================
        if (!ctx || !ctx.user || !ctx.userId) {
            await reply('⚠️ Silakan register terlebih dahulu dengan mengetik .register');
            return;
        }

        const userId = ctx.userId;
        const isOwner = ctx.isOwner === false;

        const ctx_local = {
            name: m.pushName || ctx.alias || 'User',
            number: userId,
            thumb: global?.thumb
        };

        // =========================
        // OWNER ONLY
        // =========================
        if (!isOwner) {
            await engine.send(m, {
                text: `
╭───〔 ❌ ACCESS DENIED 〕───╮
│
│  Perintah ini hanya untuk OWNER.
│
╰────────────────────╯`,
                ctx: ctx_local
            });
            return;
        }

        // =========================
        // TARGET PARSING
        // =========================
        let targetId = userId;
        let targetName = ctx.alias || 'User';

        if (args[0] && args[0] !== 'confirm') {
            const mention = args[0].replace(/[^0-9]/g, '');
            if (mention) {
                targetId = mention;
                targetName = mention;
            }
        }

        // =========================
        // CONFIRMATION GATE
        // =========================
        if (args[0] !== 'confirm') {
            await engine.sendHybrid(m, {
                text: `
╭───〔 ⚠️ FINANCE RESET 〕───╮
│
│  ⚠️ PERINGATAN DESTRUKTIF
│
│  Target: ${targetName}
│
│  Aksi ini akan menghapus:
│  • Semua transaksi (ledger)
│  • Data user finance
│
│  ⚠️ TIDAK BISA DIKEMBALIKAN
│
│  Ketik:
│  .finreset confirm
│
╰────────────────────╯`,
                footer: global?.botname || 'Finance System',
                buttons: [
                    { buttonId: '.finreset confirm', buttonText: { displayText: '⚠️ KONFIRMASI' } }
                ],
                ctx: ctx_local
            });
            return;
        }

        // =========================
        // EXECUTION (MONGOOSE)
        // =========================
        const { connectMongo } = require('../src/lib/mongo');
        const FinanceLedger = require('../src/models/FinanceLedger');
        const FinanceUser = require('../src/models/FinanceUser');

        await connectMongo();

        // Hitung sebelum delete
        const txCount = await FinanceLedger.countDocuments({ userId: targetId });

        // DELETE ledger
        await FinanceLedger.deleteMany({ userId: targetId });

        // OPTIONAL: reset user (biar fresh)
        await FinanceUser.deleteOne({ userId: targetId });

        // =========================
        // RESULT
        // =========================
        await engine.sendHybrid(m, {
            text: `
╭───〔 ✅ RESET BERHASIL 〕───╮
│
│  👤 Target: ${targetName}
│
│  Data dihapus:
│  • ${txCount} transaksi
│  • User finance di-reset
│
│  Sistem akan auto-create ulang
│  saat user transaksi lagi.
│
╰────────────────────╯`,
            footer: global?.botname || 'Finance System',
            ctx: ctx_local
        });

        console.log(`[fin-reset] ${userId} reset data ${targetId}`);

    } catch (err) {
        console.error('[fin-reset error]', err);
        await reply('❌ Gagal reset data finance.');
    }
};

handler.command = ['finreset', 'freset'];
handler.tags = ['finance', 'owner'];
handler.help = ['finreset confirm — Reset data finance (OWNER ONLY)'];

module.exports = handler;