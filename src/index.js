/**
 * Public entry point for the Time Interval Chunker.
 *
 * Re-exports the core API so callers import from a single path:
 *   import { chunkEqual, chunkBySize, mapChunkBoundaries } from 'time-interval-chunker';
 */
export { chunkEqual, chunkBySize, mapChunkBoundaries } from './core.js';
