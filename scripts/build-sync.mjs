import { build } from 'esbuild';

await build({
  entryPoints: ['sync/supabase-sync.js'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2022'],
  outfile: 'sync/supabase-sync.bundle.js',
  minify: true,
  legalComments: 'none'
});
