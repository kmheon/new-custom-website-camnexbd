#!/usr/bin/env node
/**
 * CamneX Platform - Content-Hashed Multi-Surface Asset Bundler
 * Compiles 3 separate frontend bundles:
 * 1. Storefront: src/main.tsx -> bundle.main.<hash>.js
 * 2. Website Manager: src/admin/main.tsx -> bundle.admin.<hash>.js
 * 3. Staff App: src/staff/main.tsx -> bundle.staff.<hash>.js
 * And compiles Tailwind CSS with PostCSS.
 *
 * CloudLinux / cPanel LVE Memory & Thread Concurrency Protection:
 * Caps Go and libuv worker threads so esbuild + PostCSS never exceed shared-hosting LVE limits.
 */

process.env.GOMAXPROCS = process.env.GOMAXPROCS || '1';
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || '1';
process.env.RAYON_NUM_THREADS = process.env.RAYON_NUM_THREADS || '1';

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

const isDev = process.argv.includes('--dev');

async function compileBundle(entryPath, bundleName, distDir, fallbackPath) {
  console.log(`[BUILD] Bundling ${bundleName} (${entryPath}) with esbuild (mode: ${isDev ? 'development' : 'production'})...`);
  const result = await esbuild.build({
    entryPoints: [entryPath],
    bundle: true,
    minify: !isDev,
    target: 'es2020',
    write: false,
    sourcemap: isDev ? 'inline' : false,
    define: {
      'process.env.NODE_ENV': isDev ? '"development"' : '"production"'
    }
  });

  if (!result.outputFiles || result.outputFiles.length === 0) {
    throw new Error(`esbuild produced no output files for ${bundleName}`);
  }

  const outputJs = result.outputFiles[0].contents;
  const hash = crypto.createHash('md5').update(outputJs).digest('hex').slice(0, 10);
  const filename = `bundle.${bundleName}.${hash}.js`;
  const distPath = path.join(distDir, filename);

  fs.writeFileSync(distPath, outputJs);
  if (fallbackPath) {
    fs.writeFileSync(fallbackPath, outputJs);
  }

  return { filename, hash, sizeKb: (outputJs.length / 1024).toFixed(1) };
}

async function runBuild() {
  const distDir = path.join(__dirname, '../public/dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // 1. Bundle 3 Separate Surfaces
  const mainBundle = await compileBundle(
    path.join(__dirname, '../src/main.tsx'),
    'main',
    distDir,
    path.join(__dirname, '../public/bundle.js')
  );

  const adminBundle = await compileBundle(
    path.join(__dirname, '../src/admin/main.tsx'),
    'admin',
    distDir,
    path.join(__dirname, '../public/bundle.admin.js')
  );

  const staffBundle = await compileBundle(
    path.join(__dirname, '../src/staff/main.tsx'),
    'staff',
    distDir,
    path.join(__dirname, '../public/bundle.staff.js')
  );

  // Stop esbuild child service before running PostCSS/Tailwind to release ~150MB RAM and OS threads on cPanel LVE
  try {
    if (typeof esbuild.stop === 'function') {
      await esbuild.stop();
    }
  } catch (_) {}
  if (typeof global.gc === 'function') {
    try { global.gc(); } catch (_) {}
  }

  // 2. Compile Tailwind CSS (Build-time, minified)
  console.log('[BUILD] Compiling Tailwind CSS with PostCSS...');
  const cssInputPath = path.join(__dirname, '../src/style.css');
  const cssInput = fs.readFileSync(cssInputPath, 'utf8');

  const postcssResult = await postcss([
    tailwindcss(path.join(__dirname, '../tailwind.config.js')),
    autoprefixer
  ]).process(cssInput, { from: cssInputPath });

  // Lightweight in-process CSS minification to avoid respawning esbuild child process during peak PostCSS heap
  const minifiedCss = postcssResult.css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();

  const outputCss = Buffer.from(minifiedCss, 'utf8');
  const cssHash = crypto.createHash('md5').update(outputCss).digest('hex').slice(0, 10);
  const hashedCssFilename = `bundle.${cssHash}.css`;
  const hashedCssPath = path.join(distDir, hashedCssFilename);
  const publicCssPath = path.join(__dirname, '../public/style.css');

  fs.writeFileSync(hashedCssPath, outputCss);
  fs.writeFileSync(publicCssPath, outputCss);

  // 3. Write Unified Manifest
  const manifest = {
    'main.js': `/dist/${mainBundle.filename}`,
    'admin.js': `/dist/${adminBundle.filename}`,
    'staff.js': `/dist/${staffBundle.filename}`,
    'main.css': `/dist/${hashedCssFilename}`,
    'hash': mainBundle.hash,
    'builtAt': new Date().toISOString()
  };

  fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // 4. Synchronize public/index.html with active hashed bundles (optional, disabled by default)
  // server.js dynamically resolves and injects manifest assets into HTML responses at runtime.
  // We leave public/index.html untouched so Git working trees remain clean during automated builds.
  // Use --sync-html only when preparing an explicit static-file preview build.
  const syncHtml = process.argv.includes('--sync-html');
  if (syncHtml) {
    const indexHtmlPath = path.join(__dirname, '../public/index.html');
    if (fs.existsSync(indexHtmlPath)) {
      let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
      const cssRegex = /<link[^>]+(?:id="app-styles"|href=["'][^"']*(?:\/style\.css|\/dist\/bundle\.[^"']*\.css)["'])[^>]*>/i;
      const newCssTag = `<link rel="stylesheet" href="/dist/${hashedCssFilename}" id="app-styles">`;
      if (cssRegex.test(indexHtml)) {
        indexHtml = indexHtml.replace(cssRegex, newCssTag);
      } else {
        indexHtml = indexHtml.replace('</head>', `  ${newCssTag}\n</head>`);
      }

      const jsRegex = /<script[^>]+src=["'][^"']*(?:bundle\.js|\/dist\/bundle\.[^"']*\.js)["'][^>]*><\/script>/i;
      const newJsTag = `<script src="/dist/${mainBundle.filename}"></script>`;
      if (jsRegex.test(indexHtml)) {
        indexHtml = indexHtml.replace(jsRegex, newJsTag);
      } else {
        indexHtml = indexHtml.replace('</body>', `  ${newJsTag}\n</body>`);
      }

      fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
      console.log('  -> Synchronized public/index.html (--sync-html requested)');
    }
  }

  // 5. Clean up old hashed bundle files (keep current ones)
  const activeFiles = new Set([
    mainBundle.filename,
    adminBundle.filename,
    staffBundle.filename,
    hashedCssFilename
  ]);

  const existingFiles = fs.readdirSync(distDir);
  for (const f of existingFiles) {
    if (f.startsWith('bundle.') && (f.endsWith('.js') || f.endsWith('.css'))) {
      if (!activeFiles.has(f)) {
        try { fs.unlinkSync(path.join(distDir, f)); } catch (_) {}
      }
    }
  }

  console.log(`[BUILD] Success!`);
  console.log(`  -> Storefront JS:     /dist/${mainBundle.filename} (${mainBundle.sizeKb} KB)`);
  console.log(`  -> Admin JS:          /dist/${adminBundle.filename} (${adminBundle.sizeKb} KB)`);
  console.log(`  -> Staff JS:          /dist/${staffBundle.filename} (${staffBundle.sizeKb} KB)`);
  console.log(`  -> CSS:               /dist/${hashedCssFilename} (${(outputCss.length / 1024).toFixed(1)} KB)`);
  console.log(`  -> Manifest saved to public/dist/manifest.json`);
}

runBuild().catch(err => {
  console.error('[BUILD] Build failed:', err);
  process.exit(1);
});
