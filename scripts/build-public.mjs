import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, '.public-pages');
const paths = [
  'index.html', 'gate.js', 'app.js', 'style.css', 'subjects.js', 'subjects.css',
  'site-config.js', 'sync-config.js', 'sync/github-gist-sync.bundle.js',
  'task-notification-sw.js', 'politics-recite/index.html',
  'code-analysis/index.html', 'code-analysis/app.js', 'code-analysis/style.css',
  'theme/seika.css', 'theme/seika.js', 'theme/avatar.webp', 'theme/banner.webp',
  'theme/room-assets/computer-room.webp', 'theme/room-assets/desk-wood.webp',
  'theme/room-assets/door.webp', 'theme/room-assets/study-room-reader.webp',
  'theme/room-assets/study-room.webp', 'theme/room-assets/Nunito-Variable.woff2',
  'theme/room-assets/ZCOOLKuaiLe-Regular.woff2', 'theme/room-assets/OFL-Nunito.txt',
  'theme/room-assets/OFL-ZCOOL-KuaiLe.txt', 'theme/vendor/ripplet-1.1.0/ripplet.js',
  'theme/vendor/ripplet-1.1.0/LICENSE', 'theme/vendor/liquid-ripple-0.1.1/index.js',
  'theme/vendor/liquid-ripple-0.1.1/chunk-5DBRBCS5.js', 'theme/vendor/liquid-ripple-0.1.1/LICENSE'
];

await rm(output, { recursive:true, force:true });
await mkdir(output);
for (const relative of paths) {
  const target = path.join(output, relative);
  await mkdir(path.dirname(target), { recursive:true });
  await copyFile(path.join(root, relative), target);
}
await writeFile(path.join(output, 'gate-config.js'), 'window.SPACE_PUBLIC = true;\n');
console.log('Public Space built in .public-pages/');
