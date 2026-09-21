import { build } from 'esbuild';

await build({
  entryPoints: ['sync/github-gist-sync.js'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2022'],
  outfile: 'sync/github-gist-sync.bundle.js',
  minify: true,
  legalComments: 'none'
});
