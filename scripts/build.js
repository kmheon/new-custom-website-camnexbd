#!/usr/bin/env node
/**
 * CamneX Platform - Content-Hashed Asset Bundler
 * Compiles TypeScript/React storefront and admin bundle with esbuild,
 * compiles Tailwind CSS with PostCSS, minifies CSS,
 * produces content-hashed assets with manifest for long immutable caching,
 * and maintains fallback public/bundle.js and public/style.css for local dev server compatibility.
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

async function runBuild() {
  const distDir = path.join(__dirname, '../public/dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // 1. Bundle TypeScript/React Application
  console.log('[BUILD] Bundling src/main.tsx with esbuild...');
  const jsResult = await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/main.tsx')],
    bundle: true,
    minify: true,
    target: 'es2020',
    write: false,
    sourcemap: false
  });

  if (!jsResult.outputFiles || jsResult.outputFiles.length === 0) {
    throw new Error('esbuild produced no output files');
  }

  const outputJs = jsResult.outputFiles[0].contents;
  const jsHash = crypto.createHash('md5').update(outputJs).digest('hex').slice(0, 10);
  const hashedJsFilename = `bundle.${jsHash}.js`;
  const hashedJsPath = path.join(distDir, hashedJsFilename);
  const publicBundlePath = path.join(__dirname, '../public/bundle.js');

  fs.writeFileSync(hashedJsPath, outputJs);
  fs.writeFileSync(publicBundlePath, outputJs);

  // 2. Compile Tailwind CSS (Build-time, minified)
  console.log('[BUILD] Compiling Tailwind CSS with PostCSS...');
  const cssInputPath = path.join(__dirname, '../src/style.css');
  const cssInput = fs.readFileSync(cssInputPath, 'utf8');

  const postcssResult = await postcss([
    tailwindcss(path.join(__dirname, '../tailwind.config.js')),
    autoprefixer
  ]).process(cssInput, { from: cssInputPath });

  // Minify CSS with esbuild
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

  // 3. Write Manifest
  const manifest = {
    'main.js': `/dist/${hashedJsFilename}`,
    'main.css': `/dist/${hashedCssFilename}`,
    'hash': jsHash,
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
    const newJsTag = `<script src="/dist/${hashedJsFilename}"></script>`;
    if (jsRegex.test(indexHtml)) {
      indexHtml = indexHtml.replace(jsRegex, newJsTag);
    } else {
      indexHtml = indexHtml.replace('</body>', `  ${newJsTag}\n</body>`);
    }

    fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
  }

  // 5. Clean up old hashed bundle files (keep current ones)
  const existingFiles = fs.readdirSync(distDir);
  for (const f of existingFiles) {
    if (f.startsWith('bundle.') && (f.endsWith('.js') || f.endsWith('.css'))) {
      if (f !== hashedJsFilename && f !== hashedCssFilename) {
        try { fs.unlinkSync(path.join(distDir, f)); } catch (_) {}
      }
    }
  }

  console.log(`[BUILD] Success!`);
  console.log(`  -> JS:  /dist/${hashedJsFilename} (${(outputJs.length / 1024).toFixed(1)} KB)`);
  console.log(`  -> CSS: /dist/${hashedCssFilename} (${(outputCss.length / 1024).toFixed(1)} KB)`);
  console.log(`  -> Manifest saved to public/dist/manifest.json`);
}

runBuild().catch(err => {
  console.error('[BUILD] Build failed:', err);
  process.exit(1);
});
