const fs = require('fs');
const path = require('path');

async function loadPlugins() {
  const directory = path.join(__dirname, '..', 'plugins', 'cjs');
  const plugins = [];
  if (!fs.existsSync(directory)) return plugins;
  for (const file of fs.readdirSync(directory)) {
    if (!file.endsWith('.js')) continue;
    const filePath = path.join(directory, file);
    try {
      delete require.cache[require.resolve(filePath)];
      const plugin = require(filePath);
      if (typeof plugin === 'function' && Array.isArray(plugin.command)) {
        plugins.push(plugin);
      }
    } catch (error) {
      console.error(`Plugin error: ${file}`, error.message);
    }
  }
  return plugins;
}

async function handleMessage(m, commandText, Obj) {
  const plugins = await loadPlugins();
  for (const plugin of plugins) {
    const commands = plugin.command.map((c) => c.toLowerCase());
    if (commands.includes(String(commandText || '').toLowerCase())) {
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

module.exports = handleMessage;
