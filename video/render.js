// Render video: node render.js <audio.wav> <out.mp4> [fps] [workers]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path'), fs = require('fs'), os = require('os');
const [audio, out, fpsArg, wArg] = require.main === module ? process.argv.slice(2) : [];
const FPS = +(fpsArg || 30), W = +(wArg || 4);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vid-'));
const http = require('http');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
let PORT;
function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rs) => {
      const f = path.join(__dirname, decodeURIComponent(req.url.split('?')[0]));
      if (!f.startsWith(__dirname) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); }
      rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(rs);
    }).listen(0, '127.0.0.1', () => { PORT = srv.address().port; res(srv); });
  });
}
async function openPage(b) {
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  await p.goto(`http://127.0.0.1:${PORT}/index.html?t=0`);
  await p.waitForFunction(() => window.gl3dReady === true, null, { timeout: 60000 });
  await p.evaluate(() => document.fonts.ready);
  return p;
}
module.exports = { serve, openPage };
async function worker(idx, f0, f1) {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await openPage(b);
  const seg = path.join(tmp, `seg${idx}.mp4`);
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', seg], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = f0; f < f1; f++) {
    await p.evaluate((t) => window.render(t), f / FPS);
    const buf = await p.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - f0) % 300 === 0) console.log(`w${idx} ${f - f0}/${f1 - f0}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await b.close();
  return seg;
}
if (require.main === module) (async () => {
  const srv = await serve();
  const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audio]).toString());
  const N = Math.ceil(dur * FPS), per = Math.ceil(N / W);
  const segs = await Promise.all([...Array(W)].map((_, i) => worker(i, i * per, Math.min(N, (i + 1) * per))));
  fs.writeFileSync(path.join(tmp, 'list.txt'), segs.map((s) => `file '${s}'`).join('\n'));
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-i', audio,
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  console.log('done', out);
  srv.close();
})();
