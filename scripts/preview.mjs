import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

const root = process.cwd();
const types = { '.css':'text/css', '.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.webp':'image/webp' };

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    let target = path.join(root, decodeURIComponent(url.pathname));
    if (!path.resolve(target).startsWith(path.resolve(root))) throw new Error('Invalid path');
    if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
    response.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(8000, '127.0.0.1', () => console.log('Preview: http://localhost:8000/'));
