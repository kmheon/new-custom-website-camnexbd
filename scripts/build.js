#!/usr/bin/env node
/**
 * CamneX Platform - Content-Hashed Asset Bundler
 * Compiles TypeScript/React storefront and admin bundle with esbuild,
 * produces content-hashed assets with manifest for long immutable caching,
 * and maintains fallback public/bundle.js for local dev server compatibility.
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function runBuild() {
  const distDir = path.join(__dirname, '../public/dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Clean old hashed bundle files in public/dist
  const existingFiles = fs.readdirSync(distDir);
  for (const f of existingFiles) {
    if (f.startsWith('bundle.') && f.endsWith('.js')) {
      try { fs.unlinkSync(path.join(distDir, f)); } catch (_) {}
    }
  }

  console.log('[BUILD] Bundling src/main.tsx with esbuild...');
  const result = await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/main.tsx')],
    bundle: true,
    minify: true,
    target: 'es2020',
    write: false,
    sourcemap: false
  });

  const outputJs = result.outputFiles[0].contents;
  const hash = crypto.createHash('md5').update(outputJs).digest('hex').slice(0, 10);
  const hashedFilename = `bundle.${hash}.js`;
  const hashedPath = path.join(distDir, hashedFilename);
  const publicBundlePath = path.join(__dirname, '../public/bundle.js');

  fs.writeFileSync(hashedPath, outputJs);
  fs.writeFileSync(publicBundlePath, outputJs);

  const manifest = {
    'main.js': `/dist/${hashedFilename}`,
    hash,
    builtAt: new Date().toISOString()
  };

  fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`[BUILD] Success! Content-hashed asset created: /dist/${hashedFilename} (${(outputJs.length / 1024).toFixed(1)} KB)`);
  console.log(`[BUILD] Manifest saved to public/dist/manifest.json`);
}

runBuild().catch(err => {
  console.error('[BUILD] Build failed:', err);
  process.exit(1);
});

