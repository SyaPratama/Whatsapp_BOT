import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadPlugins() {
  const directory = path.join(__dirname, '..', 'plugins', 'esm');
  const plugins = [];
  if (!fs.existsSync(directory)) return plugins;
  for (const file of fs.readdirSync(directory)) {
    if (!file.endsWith('.mjs') && !file.endsWith('.js')) continue;
    const filePath = path.join(directory, file);
    try {
      const imported = await import(`${filePath}?v=${Date.now()}`);
      const plugin = imported.default;
      const validCommand = Array.isArray(plugin.command) || plugin.command instanceof RegExp;
      if (typeof plugin === 'function' && validCommand) {
        plugins.push(plugin);
      }
    } catch (error) {
      console.error('Plugin error:', file, error.message);
    }
  }
  return plugins;
}

async function handleMessage(m, commandText, Obj) {
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
      match = plugin.command.some((c) => c.toLowerCase() === String(commandText || '').toLowerCase());
    }
    if (match) {
      try {
        await plugin(m, Obj);
        return true;
      } catch (error) {
        console.error('Plugin execution error:', error);
      }
    }
  }
  return false;
}

export default handleMessage;
