'use strict';

const FLAP_WINDOW_MS = 60 * 1000;
const FLAP_MAX_RECONNECTS = 3;

function createFlapDetector({ windowMs = FLAP_WINDOW_MS, maxReconnects = FLAP_MAX_RECONNECTS } = {}) {
  if (!Number.isFinite(windowMs) || windowMs <= 0) {
    throw new Error('windowMs must be a positive finite number');
  }
  if (!Number.isFinite(maxReconnects) || maxReconnects <= 0) {
    throw new Error('maxReconnects must be a positive finite number');
  }
  let timestamps = [];

  function record() {
    const nowMs = Date.now();
    timestamps = timestamps.filter((t) => nowMs - t < windowMs);
    timestamps.push(nowMs);
    return timestamps.length;
  }

  function shouldStop() {
    if (timestamps.length <= maxReconnects) return false;
    const newest = timestamps[timestamps.length - 1];
    return Date.now() - newest < windowMs;
  }

  function reset() {
    timestamps = [];
  }

  function snapshot() {
    return timestamps.slice();
  }

  return { record, shouldStop, reset, snapshot };
}

module.exports = {
  FLAP_WINDOW_MS,
  FLAP_MAX_RECONNECTS,
  createFlapDetector
};
