# time-interval-chunker

Splits a `[start, end)` time range into fixed-size chunks and applies a function to each chunk's boundaries. Useful for batched queries that must respect time bounds.

```js
import { chunkBySize, mapChunkBoundaries } from 'time-interval-chunker';

// Build "from/to" query params for a 24-hour range in 1-hour batches.
const oneHour = 60 * 60 * 1000;
const params = mapChunkBoundaries(
  Date.parse('2024-01-01T00:00:00Z'),
  Date.parse('2024-01-02T00:00:00Z'),
  oneHour,
  (start, end) => ({ from: start, to: end })
);

// Raw intervals, if you'd rather iterate yourself.
const chunks = chunkBySize(0, 100, 25);
// => [{ start: 0, end: 25 }, { start: 25, end: 50 }, ...]
```

## Why

Processing a long time range in one shot often means a query that times out or holds locks for too long. Splitting the range into bounded windows lets you page through the work in predictable chunks. The trade-off here is simplicity: the library deals only in integer milliseconds and half-open intervals, and does not attempt to align chunk boundaries to calendar units (hours, days, months). If you need calendar-aligned buckets, convert to a count of those units first and pass integer bounds.

## Edge cases worth knowing

- All chunks are half-open `[start, end)`. The end of one chunk equals the start of the next, so boundaries never overlap and never leave a gap.
- `chunkBySize` shortens the final chunk when the range length is not a multiple of `chunkSize`. It will never emit a chunk extending past `rangeEnd`.
- `chunkEqual` requires the range to be evenly divisible by `n`; if it isn't, the function throws rather than silently stretching a chunk. Use `chunkBySize` when you can't guarantee even division.
- Inputs are integers in milliseconds since the epoch. Non-integer or non-finite values are rejected.

## API

- `chunkEqual(rangeStart, rangeEnd, n) -> Interval[]` — equal split, throws if `n` does not evenly divide the range.
- `chunkBySize(rangeStart, rangeEnd, chunkSize) -> Interval[]` — fixed-size split, final chunk shortened to fit.
- `mapChunkBoundaries(rangeStart, rangeEnd, chunkSize, fn) -> fn[]` — applies `fn(start, end)` to every chunk from `chunkBySize`.

`Interval` is `{ start: number, end: number }`.
