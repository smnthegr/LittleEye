// Visual study of the production background layers, not a full app screenshot.
// Uses the same optional rasterizer as render-minimal-ring.cjs.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs/validation/home-ambient');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...rest) {
  if (request === 'react-native') request = 'react-native-web';
  if (request === 'react-native-svg') return path.join(root, 'node_modules/react-native-svg/lib/commonjs/elements.web.js');
  if (request.startsWith('@/')) request = path.join(root, 'src', request.slice(2));
  return resolve.call(this, request, parent, ...rest);
};
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
      fileName: filename,
    });
    module._compile(outputText, filename);
  };
}
const { HomeAmbientBackground, HomeControlsAmbient, HomeNavigationSurface } = require('../src/components/home-ambient-background.tsx');
const { getHomeNavigationLayout, getPageHeaderLayout } = require('../src/utils/responsive.ts');
let render = 0;
function layer(Component, props, x, y, width, height) {
  const svg = renderToStaticMarkup(React.createElement(Component, props), { identifierPrefix: `study${render++}` });
  return svg.replace(/^<svg[^>]*>/, opening => {
    const viewBox = opening.match(/viewBox="([^"]+)"/)[1];
    return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${viewBox}" preserveAspectRatio="none">`;
  });
}
fs.mkdirSync(output, { recursive: true });
const dpad = fs.readFileSync(path.join(root, 'docs/validation/minimal-ring/artwork.svg'), 'utf8');
const { Resvg } = require('../.tmp/dpad-validation/node_modules/@resvg/resvg-js');
for (const [width, height] of [[360, 640], [390, 844], [430, 932], [844, 390]]) {
  // Use Home's existing sizing rules. Short canvases show the scrolled controls area.
  const pageWidth = Math.min(width, 480);
  const scale = pageWidth / 390;
  const controlsWidth = pageWidth - 24 * scale;
  const controlsHeight = 350 * scale;
  const centerX = width / 2;
  const size = 246 * scale;
  const navigation = getHomeNavigationLayout(pageWidth, 0);
  const header = getPageHeaderLayout(pageWidth, 44);
  const contentTop = header.top + 115 * scale - 27 * scale;
  const feedBottom = contentTop + (pageWidth - 32 * scale) * .74;
  const centerY = feedBottom + 189 * scale;
  const transitionHeight = (feedBottom + Math.max(44, 48 * scale) + (12 + 124) * scale) / .886;
  const canvasHeight = Math.max(height, feedBottom + (12 + 48 + 20 + 350 + 4) * scale + navigation.scrollPadding);
  const scrollY = Math.min(canvasHeight - height, Math.max(0, centerY + size / 2 + navigation.height + 16 - height));
  const art = dpad.replace(/^<svg[^>]*>/,
    `<svg x="${centerX - size / 2}" y="${centerY - scrollY - size / 2}" width="${size}" height="${size}" viewBox="0 0 300 300">`);
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    ${layer(HomeAmbientBackground, { canvasHeight, feedBottom, controlsCenter: centerY, controlsHeight, transitionHeight }, 0, -scrollY, width, canvasHeight)}
    ${layer(HomeControlsAmbient, {}, centerX - controlsWidth * .8, centerY - scrollY - controlsHeight * .775, controlsWidth * 1.6, controlsHeight * 1.55)}
    ${art}
    ${layer(HomeNavigationSurface, { width: pageWidth, height: navigation.artworkHeight }, (width - pageWidth) / 2, height - navigation.height, pageWidth, navigation.artworkHeight * 136 / 120)}
  </svg>`;
  const filename = `background-study-${width}x${height}`;
  fs.writeFileSync(path.join(output, `${filename}.svg`), source);
  fs.writeFileSync(path.join(output, `${filename}.png`), new Resvg(source).render().asPng());
}
console.log(`Rendered four background component studies to ${output}`);
