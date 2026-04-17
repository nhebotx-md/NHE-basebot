/**
 * =========================================
 * 📌 FILE: src/config/config.js (FIXED + STABLE + UI ENGINE)
 * =========================================
 */

const fs = require('fs');

// =========================================
// 📌 GLOBAL CONFIG (TIDAK DIUBAH)
// =========================================
global.owner = ['62881027174423'];
global.owner = "62881027174423"
global.numberown = "62881027174423"
global.numberbot = "6282142783884"

global.namabot = "ShoNhe";
global.botname = "ShoNhe";

global.namaowner = "Tangx";
global.namaown = "TangxAja";

global.prefa = ['','!','.',',','🐤','🗿'];

global.thumbnail = "https://i.ibb.co/997h3mWM/sho-Nhe.jpg";

global.welcome = true;
global.goodbye = true;

global.thumb = "https://i.ibb.co/997h3mWM/sho-Nhe.jpg";

global.self = false;
global.autoread = false;

global.mess = {
    owner: "Maaf hanya untuk owner bot",
    prem: "Maaf hanya untuk pengguna premium",
    admin: "Maaf hanya untuk admin group",
    botadmin: "Maaf bot harus dijadikan admin",
    group: "Maaf hanya dapat digunakan di dalam group",
    private: "Silahkan gunakan fitur di private chat",
};



// =========================================
// 📌 FILE WATCHER
// =========================================
let file = require.resolve(__filename);

fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log('\x1b[0;32m'+__filename+' updated!\x1b[0m');
    delete require.cache[file];
    require(file);
});

// =========================================
// 📌 EXPORT
// =========================================
module.exports = {
    owner: global.owner,
    namabot: global.namabot,
    botname: global.botname,
    namaowner: global.namaowner,
    namaown: global.namaown,
    prefa: global.prefa,
    thumbnail: global.thumbnail,
    welcome: global.welcome,
    goodbye: global.goodbye,
    thumb: global.thumb,
    self: global.self,
    autoread: global.autoread,
    mess: global.mess
};