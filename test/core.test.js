import { test } from 'node:test';
import assert from 'node:assert/strict';

import { chunkEqual, chunkBySize, mapChunkBoundaries } from '../src/index.js';

// ---------- chunkEqual ----------

test('chunkEqual splits a range into n equal contiguous half-open chunks', () => {
  const chunks = chunkEqual(0, 100, 4);
  assert.deepEqual(chunks, [
    { start: 0, end: 25 },
    { start: 25, end: 50 },
    { start: 50, end: 75 },
    { start: 75, end: 100 },
  ]);
});

test('chunkEqual produces a single chunk when n === 1', () => {
  assert.deepEqual(chunkEqual(10, 20, 1), [{ start: 10, end: 20 }]);
});

test('chunkEqual on a zero-length range yields zero-length chunks', () => {
  // A degenerate range [x, x) is still divisible by any n: each chunk is [x, x).
  assert.deepEqual(chunkEqual(5, 5, 3), [
    { start: 5, end: 5 },
    { start: 5, end: 5 },
    { start: 5, end: 5 },
  ]);
});

test('chunkEqual throws when n does not evenly divide the range', () => {
  assert.throws(() => chunkEqual(0, 100, 3), RangeError);
});

test('chunkEqual throws for non-positive n', () => {
  assert.throws(() => chunkEqual(0, 100, 0), RangeError);
  assert.throws(() => chunkEqual(0, 100, -2), RangeError);
});

test('chunkEqual throws for non-integer n', () => {
  assert.throws(() => chunkEqual(0, 100, 2.5), RangeError);
});

test('chunkEqual throws when rangeEnd < rangeStart', () => {
  assert.throws(() => chunkEqual(100, 0, 2), RangeError);
});

test('chunkEqual throws for non-finite bounds', () => {
  assert.throws(() => chunkEqual(NaN, 10, 1), TypeError);
  assert.throws(() => chunkEqual(0, Infinity, 1), TypeError);
});

// ---------- chunkBySize ----------

test('chunkBySize splits an evenly divisible range into equal chunks', () => {
  assert.deepEqual(chunkBySize(0, 100, 25), [
    { start: 0, end: 25 },
    { start: 25, end: 50 },
    { start: 50, end: 75 },
    { start: 75, end: 100 },
  ]);
});

test('chunkBySize shortens the final chunk when the range is not a multiple of chunkSize', () => {
  assert.deepEqual(chunkBySize(0, 100, 30), [
    { start: 0, end: 30 },
    { start: 30, end: 60 },
    { start: 60, end: 90 },
    { start: 90, end: 100 }, // remainder: 10 ms, not 30
  ]);
});

test('chunkBySize yields no chunks for a zero-length range', () => {
  assert.deepEqual(chunkBySize(7, 7, 5), []);
});

test('chunkBySize with chunkSize larger than the range yields one shortened chunk', () => {
  assert.deepEqual(chunkBySize(10, 15, 100), [{ start: 10, end: 15 }]);
});

test('chunkBySize throws for non-positive chunkSize', () => {
  assert.throws(() => chunkBySize(0, 100, 0), RangeError);
  assert.throws(() => chunkBySize(0, 100, -5), RangeError);
});

test('chunkBySize throws for non-integer chunkSize', () => {
  assert.throws(() => chunkBySize(0, 100, 10.5), RangeError);
});

test('chunkBySize throws when rangeEnd < rangeStart', () => {
  assert.throws(() => chunkBySize(100, 0, 10), RangeError);
});

// ---------- mapChunkBoundaries ----------

test('mapChunkBoundaries calls fn with each chunk\'s start and end', () => {
  const pairs = mapChunkBoundaries(0, 100, 30, (s, e) => `${s}-${e}`);
  assert.deepEqual(pairs, ['0-30', '30-60', '60-90', '90-100']);
});

test('mapChunkBoundaries returns an empty array for a zero-length range', () => {
  assert.deepEqual(mapChunkBoundaries(5, 5, 10, () => 'x'), []);
});

test('mapChunkBoundaries preserves object results without flattening', () => {
  const out = mapChunkBoundaries(0, 4, 2, (s, e) => ({ lo: s, hi: e }));
  assert.deepEqual(out, [
    { lo: 0, hi: 2 },
    { lo: 2, hi: 4 },
  ]);
});
