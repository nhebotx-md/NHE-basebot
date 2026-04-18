/**
 * =========================================
 * PLUGIN: fin-report.js — Financial Report
 * =========================================
 * Command: .finreport [period]
 * Menampilkan laporan keuangan detail dengan analitik
 *
 * INTEGRASI: Menggunakan ctx.user.number dari middleware
 * sebagai userId untuk sistem finance.
 */

const handler = async (m, Obj) => {
    const { text, args, reply, conn, createReplyEngine, global, ctx } = Obj;

    try {
        if (!createReplyEngine) {
            throw new Error('createReplyEngine is not provided');
        }

        const engine = createReplyEngine(conn, global);

        // 🔧 INTEGRASI MIDDLEWARE: Gunakan ctx dari middleware
        if (!ctx || !ctx.user) {
            await reply('⚠️ Silakan register terlebih dahulu dengan mengetik .register');
            return;
        }

        const userId = ctx.user.number;

        // Build local ctx untuk ReplyEngine
        const ctx_local = {
            name: m.pushName || ctx.alias || 'User',
            number: userId,
            thumb: global?.thumb
        };

        // Parse period argument
        let period = 'month';
        if (args[0]) {
            const p = args[0].toLowerCase();
            if (['today', 'day', 'hari'].includes(p)) period = 'today';
            else if (['week', 'minggu'].includes(p)) period = 'week';
            else if (['month', 'bulan'].includes(p)) period = 'month';
            else if (['year', 'tahun'].includes(p)) period = 'year';
        }

        const periodLabels = {
            today: 'Hari Ini',
            week: 'Minggu Ini',
            month: 'Bulan Ini',
            year: 'Tahun Ini'
        };

        // Initialize dan generate report
        const { initFinanceDB, formatCurrency } = require('../src/domain/finance/engine');
        const { analytics } = require('../src/domain/finance/engine');
        initFinanceDB();

        const report = analytics.generateFullReport(userId, { period });

        // Build category breakdown text
        let categoryText = '';
        if (report.periodReport.categoryBreakdown && Object.keys(report.periodReport.categoryBreakdown).length > 0) {
            for (const [cat, data] of Object.entries(report.periodReport.categoryBreakdown)) {
                categoryText += `│  • ${cat}: ${formatCurrency(data.income)} in / ${formatCurrency(data.expense)} out\n`;
            }
        } else {
            categoryText = '│  (Tidak ada transaksi)\n';
        }

        // Build top spending text
        let topSpendText = '';
        if (report.topSpending && report.topSpending.length > 0) {
            for (const item of report.topSpending) {
                topSpendText += `│  ${item.percentage}% ${item.category}: ${formatCurrency(item.amount)}\n`;
            }
        }

        // Build anomalies text
        let anomalyText = '';
        if (report.anomalies && report.anomalies.anomalies && report.anomalies.anomalies.length > 0) {
            anomalyText = '\n├───〔 ⚠️ ANOMALI DETECTED 〕───\n';
            for (const a of report.anomalies.anomalies) {
                anomalyText += `│  🔴 ${a.transaction.category}: ${formatCurrency(a.transaction.amount)} (z-score: ${a.zScore})\n`;
            }
        }

        // Health indicator
        const healthEmoji = {
            excellent: '✅',
            good: '🟢',
            fair: '🟡',
            warning: '🟠',
            critical: '🔴'
        };

        await engine.sendHybrid(m, {
            text: `
╭───〔 📊 FINANCIAL REPORT 〕───╮
│
│  👤 ${ctx_local.name} | 📅 ${periodLabels[period]}
│  🏥 Kesehatan Keuangan: ${healthEmoji[report.financialHealth.status] || '➖'} ${report.financialHealth.score}/100
│
├───〔 RINGKASAN 〕───
│  💵 Saldo: ${formatCurrency(report.balanceSummary.currentBalance)}
│  📥 Pemasukan: ${formatCurrency(report.periodReport.summary.income)}
│  📤 Pengeluaran: ${formatCurrency(report.periodReport.summary.expense)}
│  📊 Net: ${report.periodReport.summary.net >= 0 ? '+' : ''}${formatCurrency(report.periodReport.summary.net)}
│  📋 Total Transaksi: ${report.periodReport.summary.transactionCount}
│  💰 Rata-rata Harian: ${formatCurrency(report.periodReport.averageDailySpend)}
│  📈 Savings Rate: ${report.savingsRate}%
│
├───〔 KATEGORI 〕───
${categoryText}${topSpendText ? `
├───〔 🔥 TOP SPENDING 〕───
${topSpendText}` : ''}${anomalyText}
│
╰────────────────────╯`,
            footer: global?.botname || 'Finance System',
            buttons: [
                { buttonId: '.finbalance', buttonText: { displayText: '💰 SALDO' } },
                { buttonId: '.finreport today', buttonText: { displayText: '📅 HARI INI' } },
                { buttonId: '.finreport week', buttonText: { displayText: '📅 MINGGU INI' } },
                { buttonId: '.fingoal', buttonText: { displayText: '🎯 GOALS' } }
            ],
            ctx: ctx_local
        });

        // If monthly report, also send comparison chart info
        if (period === 'month' && report.monthlyComparison && report.monthlyComparison.length >= 2) {
            let comparisonText = '\n├───〔 📈 PERBANDINGAN BULANAN 〕───\n';
            for (const mc of report.monthlyComparison) {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                const arrow = mc.net >= 0 ? '🟢' : '🔴';
                comparisonText += `│  ${arrow} ${monthNames[mc.month - 1]} ${mc.year}: ${formatCurrency(mc.income)} in / ${formatCurrency(mc.expense)} out\n`;
            }

            await engine.send(m, {
                text: `╭───〔 📈 TREN 3 BULAN 〕───╮${comparisonText}╰────────────────────╯`,
                ctx: ctx_local
            });
        }

    } catch (err) {
        console.error('[fin-report error]', err);
        await reply('❌ Terjadi error saat membuat laporan.');
    }
};

handler.command = ['finreport', 'freport', 'laporan'];
handler.tags = ['finance'];
handler.help = ['finreport [today/week/month/year] — Laporan keuangan detail'];

module.exports = handler;
