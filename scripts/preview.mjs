import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../', import.meta.url));
const root = process.argv.includes('--public') ? path.join(source, '.public-pages') : path.resolve(source);
const types = { '.css':'text/css', '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.json':'application/json',
  '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.woff2':'font/woff2', '.pdf':'application/pdf' };

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    let target = path.join(root, decodeURIComponent(url.pathname));
    const relative = path.relative(root, target);
    if (relative.startsWith('..') || path.isAbsolute(relative) ||
        relative.split(path.sep).some(segment => segment.startsWith('.'))) throw new Error('Invalid path');
    if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
    if (!(await stat(target)).isFile()) throw new Error('Not a file');
    response.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(8000, '127.0.0.1', () => console.log('Preview: http://localhost:8000/'));
