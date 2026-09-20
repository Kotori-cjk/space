import test from 'node:test';
import assert from 'node:assert/strict';
import { decideSync, snapshotHash, stableStringify } from './sync-core.js';

test('stableStringify ignores object key order', () => {
  assert.equal(stableStringify({ b: 2, a: { d: 4, c: 3 } }), stableStringify({ a: { c: 3, d: 4 }, b: 2 }));
});

test('snapshotHash is deterministic', async () => {
  assert.equal(await snapshotHash({ notes: { b: 2, a: 1 } }), await snapshotHash({ notes: { a: 1, b: 2 } }));
});

test('decideSync protects first connection and concurrent edits', () => {
  assert.equal(decideSync({ remoteEtag: '', lastEtag: '', localHash: 'a', lastLocalHash: '' }), 'upload');
  assert.equal(decideSync({ remoteEtag: 'r1', lastEtag: '', localHash: 'a', lastLocalHash: '' }), 'conflict');
  assert.equal(decideSync({ remoteEtag: 'r1', lastEtag: 'r1', localHash: 'b', lastLocalHash: 'a' }), 'upload');
  assert.equal(decideSync({ remoteEtag: 'r2', lastEtag: 'r1', localHash: 'a', lastLocalHash: 'a' }), 'pull');
  assert.equal(decideSync({ remoteEtag: 'r2', lastEtag: 'r1', localHash: 'b', lastLocalHash: 'a' }), 'conflict');
});
