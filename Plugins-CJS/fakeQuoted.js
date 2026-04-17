module.exports = {
    help: ['fakequote', 'fkplug'],
    tags: ['fun'],
    command: ['fakequote', 'fkplug'],

    run: async (m, { reply, q }) => {
        try {
            // default template
            const templates = {
                fkontak: {
                    text: 'Halo owner! 👋',
                    opt: {
                        name: 'NHE BOT',
                        number: '6281234567890'
                    }
                },
                fgif: {
                    text: 'Gif mode aktif 🚀',
                    opt: {
                        caption: 'NHE BOT',
                        gifPlayback: true
                    }
                },
                fdoc: {
                    text: 'Dokumen rahasia 📄',
                    opt: {
                        title: 'Rahasia.txt',
                        fileName: 'NHE-Secret.txt',
                        mimetype: 'application/pdf'
                    }
                }
            };

            // parsing input user
            let type = 'random';
            let text = 'Fake message';

            if (q) {
                const args = q.split('|').map(v => v.trim());
                type = args[0] || 'random';
                text = args[1] || text;
            }

            // validasi type
            let selected;

            if (type === 'random') {
                const keys = Object.keys(templates);
                const randKey = keys[Math.floor(Math.random() * keys.length)];
                selected = { type: randKey, ...templates[randKey] };
            } else if (templates[type]) {
                selected = { type, ...templates[type] };
            } else {
                return reply(`❌ Fake type tidak valid!\n\nTersedia:\n${Object.keys(templates).join(', ')}`);
            }

            // override text jika user input
            const finalText = text || selected.text;

            // kirim fake message
            return reply(finalText, {
                fakeType: selected.type,
                fakeOpt: selected.opt || {}
            });

        } catch (err) {
            console.error(err);
            reply('❌ Terjadi error pada plugin fakequote');
        }
    }
};