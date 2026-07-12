'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createOutboundQueue } = require('../src/core/outbound-queue.cjs');

test('outbound: hard-cap timestamps prevents unbounded array growth', async () => {
  let calls = 0;
  const queue = createOutboundQueue({
    minDelayMs: 0,
    globalMaxPerWindow: 100000,
    windowMs: 60 * 1000,
    hardCapTimestamps: 5,
    sendFn: async () => { calls += 1; }
  });

  for (let i = 0; i < 50; i += 1) {
    queue.enqueue(`jid-${i}@s.whatsapp.net`, { text: `m${i}` });
  }
  await new Promise((r) => setTimeout(r, 300));

  const stats = queue.stats();
  assert.equal(calls, 50, 'all 50 messages should be sent');
  assert.ok(
    stats.globalWindowSize <= 5,
    `globalTimestamps should be capped at 5, got ${stats.globalWindowSize}`
  );
});

test('outbound: queue hard-cap drops messages and increments counter', async () => {
  let sent = 0;
  const queue = createOutboundQueue({
    minDelayMs: 0,
    globalMaxPerWindow: 1,
    windowMs: 60 * 1000,
    queueHardCap: 3,
    sendFn: async () => { sent += 1; }
  });

  // First one passes the cap check, the next 3 fill the queue, the rest are dropped
  // because queueHardCap is 3. We attempt 10.
  for (let i = 0; i < 10; i += 1) {
    queue.enqueue(`jid-${i}@s.whatsapp.net`, { text: `m${i}` });
  }
  await new Promise((r) => setTimeout(r, 500));

  const stats = queue.stats();
  assert.ok(sent >= 1, 'at least one message should be sent');
  assert.ok(stats.dropped > 0, `dropped should be > 0, got ${stats.dropped}`);
  assert.ok(stats.queueSize <= 3, `queueSize should never exceed hardCap, got ${stats.queueSize}`);
});

test('outbound: per-JID cache evicts oldest entries when full', async () => {
  const queue = createOutboundQueue({
    minDelayMs: 0,
    globalMaxPerWindow: 100000,
    maxJidCache: 3,
    sendFn: async () => {}
  });

  for (let i = 0; i < 20; i += 1) {
    await new Promise((r) => setTimeout(r, 1));
    queue.enqueue(`jid-${i}@s.whatsapp.net`, { text: `m${i}` });
  }
  await new Promise((r) => setTimeout(r, 200));

  const stats = queue.stats();
  assert.ok(
    stats.perJidCount <= 3,
    `perJidCount should be capped at 3, got ${stats.perJidCount}`
  );
});

test('outbound: stats() reports dropped count and queueSize', async () => {
  const queue = createOutboundQueue({
    minDelayMs: 0,
    globalMaxPerWindow: 1,
    queueHardCap: 2,
    sendFn: async () => { await new Promise((r) => setTimeout(r, 50)); }
  });

  // enqueue quickly so multiple overflow while process() is still busy
  for (let i = 0; i < 50; i += 1) {
    queue.enqueue(`jid-${i}@s.whatsapp.net`, { text: `m${i}` });
  }
  await new Promise((r) => setTimeout(r, 200));

  const stats = queue.stats();
  assert.equal(typeof stats.queueSize, 'number');
  assert.equal(typeof stats.globalWindowSize, 'number');
  assert.equal(typeof stats.perJidCount, 'number');
  assert.equal(typeof stats.dropped, 'number');
  assert.ok(stats.dropped > 0, `expected at least 1 dropped, got ${stats.dropped}`);
});

test('outbound: stop() clears queue and rejects new enqueues', () => {
  const queue = createOutboundQueue({
    minDelayMs: 0,
    sendFn: async () => {}
  });
  queue.enqueue('a@s.whatsapp.net', { text: 'x' });
  queue.stop();
  const result = queue.enqueue('b@s.whatsapp.net', { text: 'y' });
  assert.equal(result, false);
  assert.equal(queue.stats().queueSize, 0);
});

test('outbound: drain backoff prevents tight loop when global window is saturated', async () => {
  let callCount = 0;
  const queue = createOutboundQueue({
    minDelayMs: 0,
    globalMaxPerWindow: 1,
    windowMs: 60 * 1000,
    drainBackoffMs: 50,
    sendFn: async () => { callCount += 1; }
  });

  queue.enqueue('a@s.whatsapp.net', { text: 'm1' });
  queue.enqueue('b@s.whatsapp.net', { text: 'm2' });
  await new Promise((r) => setTimeout(r, 200));

  assert.ok(callCount >= 1, 'at least one message should be sent');
  // The second message will eventually be sent once the first timestamp ages out,
  // but within 200ms with windowMs=60s, only 1 should be sent.
  assert.equal(callCount, 1, 'second message should be held back by global window');
});
