function createTtlCache({ ttlSeconds = 300, maxKeys = 200 } = {}) {
  const store = new Map();
  const ttlMs = ttlSeconds * 1000;

  function isExpired(entry) {
    return Date.now() - entry.at > ttlMs;
  }

  function evictExpired() {
    for (const [key, entry] of store) {
      if (isExpired(entry)) store.delete(key);
    }
  }

  function boundSize() {
    if (maxKeys <= 0) return;
    while (store.size > maxKeys) {
      const oldest = store.keys().next().value;
      if (!oldest) break;
      store.delete(oldest);
    }
  }

  function get(key) {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (isExpired(entry)) {
      store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  function set(key, value) {
    evictExpired();
    store.set(key, { value, at: Date.now() });
    boundSize();
    return value;
  }

  function del(key) {
    store.delete(key);
  }

  function flushAll() {
    store.clear();
  }

  function size() {
    return store.size;
  }

  return { get, set, del, flushAll, size };
}

module.exports = { createTtlCache };
