'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createFlapDetector, FLAP_WINDOW_MS, FLAP_MAX_RECONNECTS } = require('../src/core/reconnect-policy.cjs');

test('flap detector: shouldStop returns false below threshold', () => {
  const fd = createFlapDetector();
  assert.equal(fd.record(), 1);
  assert.equal(fd.record(), 2);
  assert.equal(fd.shouldStop(), false);
});

test('flap detector: shouldStop returns true when count exceeds maxReconnects', () => {
  const fd = createFlapDetector();
  fd.record();
  fd.record();
  fd.record();
  fd.record();
  assert.equal(fd.shouldStop(), true);
});

test('flap detector: reset() clears the timestamp history', () => {
  const fd = createFlapDetector();
  fd.record();
  fd.record();
  fd.record();
  fd.record();
  fd.reset();
  assert.equal(fd.shouldStop(), false);
  assert.deepEqual(fd.snapshot(), []);
});

test('flap detector: snapshot returns a defensive copy', () => {
  const fd = createFlapDetector();
  fd.record();
  const snap = fd.snapshot();
  snap.push(12345);
  assert.notEqual(fd.snapshot().length, snap.length, 'snapshot must not share internal state');
});

test('flap detector: rejects invalid windowMs', () => {
  assert.throws(() => createFlapDetector({ windowMs: 0 }));
  assert.throws(() => createFlapDetector({ windowMs: -1 }));
  assert.throws(() => createFlapDetector({ windowMs: 'abc' }));
  assert.throws(() => createFlapDetector({ windowMs: NaN }));
});

test('flap detector: rejects invalid maxReconnects', () => {
  assert.throws(() => createFlapDetector({ maxReconnects: 0 }));
  assert.throws(() => createFlapDetector({ maxReconnects: -5 }));
  assert.throws(() => createFlapDetector({ maxReconnects: 'three' }));
});

test('flap detector: exported constants match documented values', () => {
  assert.equal(FLAP_WINDOW_MS, 60 * 1000);
  assert.equal(FLAP_MAX_RECONNECTS, 3);
});

test('flap detector: simulates flapping pattern from real bug report', () => {
  const fd = createFlapDetector();

  // Simulate 3 reconnects inside 60s — under threshold, should not stop
  fd.record();
  fd.record();
  fd.record();
  assert.equal(fd.shouldStop(), false, '3 reconnects should not trigger flap stop');

  // 4th reconnect — over threshold, must trigger
  fd.record();
  assert.equal(fd.shouldStop(), true, '4th reconnect in 60s should trigger flap detection');
});
