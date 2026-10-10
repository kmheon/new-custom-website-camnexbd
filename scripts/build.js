#!/usr/bin/env node
/**
 * CamneX Platform - Content-Hashed Multi-Surface Asset Bundler
 * Compiles 3 separate frontend bundles:
 * 1. Storefront: src/main.tsx -> bundle.main.<hash>.js
 * 2. Website Manager: src/admin/main.tsx -> bundle.admin.<hash>.js
 * 3. Staff App: src/staff/main.tsx -> bundle.staff.<hash>.js
 * And compiles Tailwind CSS with PostCSS.
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

async function compileBundle(entryPath, bundleName, distDir, fallbackPath) {
  console.log(`[BUILD] Bundling ${bundleName} (${entryPath}) with esbuild...`);
  const result = await esbuild.build({
    entryPoints: [entryPath],
    bundle: true,
    minify: true,
    target: 'es2020',
    write: false,
    sourcemap: false
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

  // 2. Compile Tailwind CSS (Build-time, minified)
  console.log('[BUILD] Compiling Tailwind CSS with PostCSS...');
  const cssInputPath = path.join(__dirname, '../src/style.css');
  const cssInput = fs.readFileSync(cssInputPath, 'utf8');

  const postcssResult = await postcss([
    tailwindcss(path.join(__dirname, '../tailwind.config.js')),
    autoprefixer
  ]).process(cssInput, { from: cssInputPath });

  const minifiedCssResult = await esbuild.transform(postcssResult.css, {
    loader: 'css',
    minify: true
  });

  const outputCss = Buffer.from(minifiedCssResult.code);
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

  // 4. Synchronize public/index.html with active hashed bundles
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
