/**
 * Core chunking logic for the Time Interval Chunker.
 *
 * The module exposes pure functions only — no I/O, no clock. This makes
 * behaviour trivially deterministic and testable: every function returns
 * the same value for the same arguments, with no hidden state.
 */

/**
 * A half-open time interval [start, end). `start` is inclusive, `end` is
 * exclusive, matching the convention used by Date.getTime() and most
 * interval arithmetic. Chunking therefore never produces an overlapping
 * boundary: the end of one chunk is the exact start of the next.
 *
 * @typedef {Object} Interval
 * @property {number} start - Inclusive start, in milliseconds since epoch.
 * @property {number} end   - Exclusive end, in milliseconds since epoch.
 */

/**
 * Splits `[rangeStart, rangeEnd)` into `n` contiguous half-open chunks of
 * equal length.
 *
 * `n` MUST evenly divide the range length. This is a deliberate constraint:
 * when the caller knows their data fits a regular grid (e.g. hourly buckets
 * across a whole number of hours), silently stretching or shrinking the
 * final chunk would hide a bug in the caller's math. Force the caller to
 * pick an `n` that divides cleanly, or use `chunkBySize` instead.
 *
 * @param {number} rangeStart - Inclusive start (ms since epoch).
 * @param {number} rangeEnd   - Exclusive end (ms since epoch).
 * @param {number} n          - Number of chunks; must be a positive integer.
 * @returns {Interval[]}
 * @throws {TypeError}  If arguments are not finite numbers.
 * @throws {RangeError} If `rangeEnd < rangeStart`, or `n` is not a positive
 *                      integer, or `n` does not evenly divide the range.
 */
export function chunkEqual(rangeStart, rangeEnd, n) {
  if (!Number.isFinite(rangeStart) || !Number.isFinite(rangeEnd)) {
    throw new TypeError('rangeStart and rangeEnd must be finite numbers');
  }
  if (!Number.isInteger(n) || n <= 0) {
    throw new RangeError('n must be a positive integer');
  }
  if (rangeEnd < rangeStart) {
    throw new RangeError('rangeEnd must be >= rangeStart');
  }

  const total = rangeEnd - rangeStart;
  if (total % n !== 0) {
    throw new RangeError(
      `range length ${total} is not evenly divisible by n=${n}`
    );
  }

  const step = total / n;
  const chunks = new Array(n);
  for (let i = 0; i < n; i++) {
    chunks[i] = { start: rangeStart + i * step, end: rangeStart + (i + 1) * step };
  }
  return chunks;
}

/**
 * Splits `[rangeStart, rangeEnd)` into contiguous half-open chunks of
 * approximately `chunkSize` milliseconds.
 *
 * "Approximately" because if the range length is not a multiple of
 * `chunkSize`, the LAST chunk is shortened to end exactly at `rangeEnd`.
 * We never emit a chunk that extends past `rangeEnd` — callers using this
 * for batched queries rely on the upper bound being honoured.
 *
 * @param {number} rangeStart - Inclusive start (ms since epoch).
 * @param {number} rangeEnd   - Exclusive end (ms since epoch).
 * @param {number} chunkSize  - Desired chunk length in ms; must be a positive integer.
 * @returns {Interval[]}
 * @throws {TypeError}  If arguments are not finite numbers.
 * @throws {RangeError} If `rangeEnd < rangeStart`, `chunkSize` is not a
 *                      positive integer, or `chunkSize` is zero.
 */
export function chunkBySize(rangeStart, rangeEnd, chunkSize) {
  if (!Number.isFinite(rangeStart) || !Number.isFinite(rangeEnd)) {
    throw new TypeError('rangeStart and rangeEnd must be finite numbers');
  }
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new RangeError('chunkSize must be a positive integer');
  }
  if (rangeEnd < rangeStart) {
    throw new RangeError('rangeEnd must be >= rangeStart');
  }

  const chunks = [];
  let cursor = rangeStart;
  while (cursor < rangeEnd) {
    const end = Math.min(cursor + chunkSize, rangeEnd);
    chunks.push({ start: cursor, end });
    cursor = end;
  }
  return chunks;
}

/**
 * Applies `fn` to the boundary (start and end) of every chunk produced by
 * `chunkBySize`, returning the results in order.
 *
 * The callback receives plain numbers, not Interval objects, because the
 * common use case is forming a pair (e.g. an HTTP query-string range or a
 * database BETWEEN clause) from the two timestamps. Returning numbers
 * keeps the callback signature trivial and avoids accidental aliasing of
 * the chunk objects.
 *
 * @param {number}   rangeStart - Inclusive start (ms since epoch).
 * @param {number}   rangeEnd   - Exclusive end (ms since epoch).
 * @param {number}   chunkSize  - Desired chunk length in ms; positive integer.
 * @param {(start: number, end: number) => T} fn - Called once per chunk.
 * @returns {T[]}
 * @template T
 */
export function mapChunkBoundaries(rangeStart, rangeEnd, chunkSize, fn) {
  const chunks = chunkBySize(rangeStart, rangeEnd, chunkSize);
  const out = new Array(chunks.length);
  for (let i = 0; i < chunks.length; i++) {
    out[i] = fn(chunks[i].start, chunks[i].end);
  }
  return out;
}
