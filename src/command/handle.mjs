/**
 * =========================================
 * 📌 FILE: src/command/handle.mjs (RECONSTRUCTED)
 * 📌 DESCRIPTION:
 * Handler untuk plugins ESM (ECMAScript Modules)
 *
 * 📁 MAPPING: Library/handle.mjs (original) → src/command/handle.mjs
 * =========================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadPlugins = async () => {
    const dir = path.join(__dirname, "../../Plugins-ESM");
    const plugins = [];
    if (!fs.existsSync(dir)) return plugins;

    for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith(".js") && !file.endsWith(".mjs")) continue;
        const filePath = path.join(dir, file);

        try {
            const imported = await import(filePath + `?v=${Date.now()}`);
            const plugin = imported.default;
            const validCommand = Array.isArray(plugin.command) || plugin.command instanceof RegExp;

            if (typeof plugin === "function" && validCommand) {
                plugins.push(plugin);
            }
        } catch (e) {
            console.error("Plugin error:", file, e);
        }
    }

    return plugins;
};

const handleMessage = async (m, commandText, Obj) => {
    const plugins = await loadPlugins();

    Obj.isOwner = Obj?.isOwner ?? false;
    Obj.isPremium = Obj?.isPremium ?? false;
    Obj.isGroup = Obj?.isGroup ?? false;
    Obj.isPrivate = !Obj.isGroup;

    for (const plugin of plugins) {
        let match = false;

        if (plugin.command instanceof RegExp) {
            match = plugin.command.test(commandText);
        } else {
            match = plugin.command.some(c => c.toLowerCase() === commandText.toLowerCase());
        }

        if (!match) continue;

        if (plugin.owner && !Obj.isOwner)
            return Obj.reply?.("❌ Owner only!");

        if (plugin.premium && !Obj.isPremium)
            return Obj.reply?.("❌ Premium only!");

        if (plugin.group && !Obj.isGroup)
            return Obj.reply?.("❌ Group only!");

        if (plugin.private && !Obj.isPrivate)
            return Obj.reply?.("❌ Private chat only!");

        try {
            await plugin(m, Obj);
        } catch (err) {
            console.error("Plugin error:", err);
        }
        break;
    }
};

export default handleMessage;
