const DEFAULT_MIN_DELAY_MS = 1500;
const DEFAULT_GLOBAL_MAX_PER_MIN = 30;
const DEFAULT_WINDOW_MS = 60 * 1000;

function createOutboundQueue({
  minDelayMs = DEFAULT_MIN_DELAY_MS,
  globalMaxPerWindow = DEFAULT_GLOBAL_MAX_PER_MIN,
  windowMs = DEFAULT_WINDOW_MS,
  sendFn,
  logger = () => {}
} = {}) {
  if (typeof sendFn !== 'function') {
    throw new Error('createOutboundQueue requires a sendFn');
  }
  const lastSendByJid = new Map();
  const globalTimestamps = [];
  const queue = [];
  let running = false;
  let stopped = false;

  function now() { return Date.now(); }

  function cleanupWindow() {
    const cutoff = now() - windowMs;
    while (globalTimestamps.length > 0 && globalTimestamps[0] < cutoff) {
      globalTimestamps.shift();
    }
  }

  function canSendGlobal() {
    cleanupWindow();
    return globalTimestamps.length < globalMaxPerWindow;
  }

  function canSendToJid(jid) {
    const last = lastSendByJid.get(jid);
    if (!last) return true;
    return now() - last >= minDelayMs;
  }

  function delayForJid(jid) {
    const last = lastSendByJid.get(jid);
    if (!last) return 0;
    return Math.max(0, minDelayMs - (now() - last));
  }

  function enqueue(jid, payload, options = {}) {
    if (stopped) return false;
    queue.push({ jid, payload, options, enqueuedAt: now() });
    process();
    return true;
  }

  async function process() {
    if (running || stopped) return;
    running = true;
    try {
      while (queue.length > 0) {
        const next = queue.shift();
        if (!canSendGlobal()) {
          queue.unshift(next);
          await sleep(1000);
          continue;
        }
        const jidDelay = delayForJid(next.jid);
        if (jidDelay > 0) {
          await sleep(jidDelay);
        }
        try {
          await sendFn(next.jid, next.payload, next.options);
          globalTimestamps.push(now());
          lastSendByJid.set(next.jid, now());
        } catch (error) {
          logger(`outbound error jid=${next.jid} err=${error.message}`);
        }
      }
    } finally {
      running = false;
    }
  }

  function stop() {
    stopped = true;
    queue.length = 0;
  }

  function stats() {
    return {
      queueSize: queue.length,
      globalWindowSize: globalTimestamps.length,
      perJidCount: lastSendByJid.size
    };
  }

  return {
    enqueue,
    stop,
    stats,
    canSendGlobal,
    canSendToJid
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { createOutboundQueue };
