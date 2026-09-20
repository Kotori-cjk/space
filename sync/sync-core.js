export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

export async function snapshotHash(snapshot) {
  const bytes = new TextEncoder().encode(stableStringify(snapshot));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function decideSync({ remoteEtag, lastEtag, localHash, lastLocalHash }) {
  if (!remoteEtag) return 'upload';
  if (!lastEtag) return 'conflict';
  if (remoteEtag === lastEtag) return localHash === lastLocalHash ? 'noop' : 'upload';
  return localHash === lastLocalHash ? 'pull' : 'conflict';
}
