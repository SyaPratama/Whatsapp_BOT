const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_TTL_MS = 60 * 60 * 1000;

function createWaVersionCache({ ttlMs = DEFAULT_TTL_MS, fetcher } = {}) {
  const cachePath = path.join(process.cwd(), 'session', '.wa-version-cache.json');
  let cached = null;
  let loadedAt = 0;

  function loadFromDisk() {
    try {
      const raw = fs.readFileSync(cachePath, 'utf8');
      const data = JSON.parse(raw);
      if (data && typeof data.version === 'number' && typeof data.fetchedAt === 'number') {
        cached = data.version;
        loadedAt = data.fetchedAt;
      }
    } catch {
      cached = null;
      loadedAt = 0;
    }
  }

  function persist() {
    try {
      fs.mkdirSync(path.dirname(cachePath), { recursive: true });
      fs.writeFileSync(cachePath, JSON.stringify({ version: cached, fetchedAt: loadedAt }, null, 2));
    } catch {
      /* cache is best-effort; never fail boot because of it */
    }
  }

  function isFresh() {
    return cached !== null && Date.now() - loadedAt < ttlMs;
  }

  async function get(fetchLatest) {
    if (isFresh()) return cached;
    const fn = fetcher || fetchLatest;
    if (typeof fn !== 'function') return null;
    const result = await fn();
    cached = (result && result.version) || null;
    loadedAt = Date.now();
    persist();
    return cached;
  }

  loadFromDisk();

  return {
    get,
    clear() {
      cached = null;
      loadedAt = 0;
      try { fs.unlinkSync(cachePath); } catch { /* ignore */ }
    },
    get cached() { return cached; }
  };
}

module.exports = { createWaVersionCache };
