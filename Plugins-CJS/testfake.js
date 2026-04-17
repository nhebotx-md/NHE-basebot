module.exports = {
    help: ['tfplug'],
    tags: ['tools'],
    command: ['testfake'],
    
    run: async (m, { reply, q, fakeQuoted }) => {
        reply(`✅ *PLUGIN CJS BERHASIL!*

Fake quoted otomatis aktif di plugin ini.

Kamu bisa pakai:
• reply()          → otomatis
• reply(teks, { fakeType: 'fgif' })
• q(m, 'fproduct') → manual quoted`);
    }
};