const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
}

function main() {
  // Use multithreaded core (with worker) for better compatibility with COOP/COEP
  const corePkg = path.join(process.cwd(), 'node_modules', '@ffmpeg', 'core');
  const dist = path.join(corePkg, 'dist');
  const outDir = path.join(process.cwd(), 'public', 'ffmpeg');
  ensureDir(outDir);

  const files = [
    'ffmpeg-core.js',
    'ffmpeg-core.wasm',
    'ffmpeg-core.worker.js',
  ];

  for (const file of files) {
    const src = path.join(dist, file);
    const dest = path.join(outDir, file);
    if (!fs.existsSync(src)) {
      console.warn(`[copy-ffmpeg-core] Missing ${src}. Ensure @ffmpeg/core is installed.`);
      continue;
    }
    copyFile(src, dest);
    console.log(`[copy-ffmpeg-core] Copied ${file} -> ${dest}`);
  }
}

try {
  main();
} catch (e) {
  console.error('[copy-ffmpeg-core] Failed:', e);
  process.exit(0);
}


