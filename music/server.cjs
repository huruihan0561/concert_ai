const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3002);
const LIBRARY_ROOT = path.join(ROOT, '1');
const VITE_PORT = 5176;
const AUDIO_EXTS = new Set(['.mp3', '.m4a', '.aac', '.ogg', '.wav', '.mgg']);
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function toUrl(absPath) {
  return '/' + path.relative(ROOT, absPath).split(path.sep).join('/');
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'text/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.webp': return 'image/webp';
    case '.mp3': return 'audio/mpeg';
    case '.m4a': return 'audio/mp4';
    case '.aac': return 'audio/aac';
    case '.ogg': return 'audio/ogg';
    case '.wav': return 'audio/wav';
    case '.mgg': return 'application/octet-stream';
    default: return 'application/octet-stream';
  }
}

function safeJoin(root, target) {
  const resolved = path.resolve(root, '.' + target);
  return resolved.startsWith(root) ? resolved : null;
}

function findCover(dir) {
  const names = ['cover.jpg', 'cover.jpeg', 'cover.png', 'cover.webp', 'cover.gif'];
  for (const name of names) {
    const candidate = path.join(dir, name);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return toUrl(candidate);
  }
  return null;
}

function scanLibrary() {
  if (!fs.existsSync(LIBRARY_ROOT)) return [];
  const albums = [];

  for (const entry of fs.readdirSync(LIBRARY_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const albumDir = path.join(LIBRARY_ROOT, entry.name);
    const tracks = [];

    for (const file of fs.readdirSync(albumDir, { withFileTypes: true })) {
      if (!file.isFile()) continue;
      const ext = path.extname(file.name).toLowerCase();
      if (!AUDIO_EXTS.has(ext)) continue;
      const abs = path.join(albumDir, file.name);
      tracks.push({
        title: path.basename(file.name, ext),
        file: toUrl(abs),
      });
    }

    tracks.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'));
    if (!tracks.length) continue;

    albums.push({
      title: entry.name,
      cover: findCover(albumDir),
      folder: toUrl(albumDir),
      tracks,
    });
  }

  albums.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'));
  return albums;
}

async function proxyToVite(req, res) {
  const options = {
    hostname: 'localhost',
    port: VITE_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${VITE_PORT}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Vite proxy error:', err.message);
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Vite dev server not running');
  });

  req.pipe(proxyReq, { end: true });
}

function serve(req, res) {
  const requestUrl = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(requestUrl.pathname);

  if (pathname === '/api/albums') {
    const albums = scanLibrary();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ albums }, null, 2));
    return;
  }

  if (pathname.startsWith('/1/')) {
    const abs = safeJoin(LIBRARY_ROOT, pathname.replace('/1/', '/'));
    if (abs && fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      res.writeHead(200, { 'Content-Type': contentType(abs) });
      fs.createReadStream(abs).pipe(res);
      return;
    }
  }

  proxyToVite(req, res);
}

http.createServer(serve).listen(PORT, () => {
  console.log(`Music server running at http://localhost:${PORT}`);
});
