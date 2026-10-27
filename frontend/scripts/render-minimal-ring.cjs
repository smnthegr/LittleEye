// Render the real component through react-native-svg's web implementation.
// Optional QA-only dependency: npm install --prefix .tmp/dpad-validation --no-save --package-lock=false @resvg/resvg-js
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs/validation/minimal-ring');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === 'react-native') request = 'react-native-web';
  if (request === 'react-native-svg') return path.join(root, 'node_modules/react-native-svg/lib/commonjs/elements.web.js');
  if (request.startsWith('@/')) request = path.join(root, 'src', request.slice(2));
  return originalResolve.call(this, request, parent, ...rest);
};
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
      fileName: filename,
    }).outputText;
    module._compile(source, filename);
  };
}
const { MinimalRingArtwork } = require('../src/components/minimal-ring-artwork.tsx');
const { AMBIENT_GLOW_MIN_OPACITY, AMBIENT_GLOW_MAX_OPACITY, PRESS_BLOOM_OPACITY,
  MinimalRingGlowArtwork } = require('../src/components/minimal-ring-glow-artwork.tsx');
const { MinimalRingRippleArtwork } = require('../src/components/minimal-ring-ripple-artwork.tsx');
const { BUTTON_ART_PADDING, BUTTON_PRESS_SCALE, CONTROL_BOUNDS, hitTestDPad } = require('../src/utils/minimal-ring-geometry.ts');
fs.mkdirSync(output, { recursive: true });
let renderNumber = 0;
function staticSvg(Component, props = {}) {
  return renderToStaticMarkup(React.createElement(Component, props), { identifierPrefix: `preview${renderNumber++}-` })
    .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
    .replace('width="100%"', 'width="300"').replace('height="100%"', 'height="300"');
}
function content(svg) { return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, ''); }
function artwork(props = {}, pulse = AMBIENT_GLOW_MIN_OPACITY) {
  const frame = staticSvg(MinimalRingArtwork, { frameOnly: true });
  // Match the independently positioned SVG layers used by MinimalRingButtons.
  const buttons = Object.entries(CONTROL_BOUNDS).map(([control, bounds]) => {
    const left = bounds.left - BUTTON_ART_PADDING;
    const top = bounds.top - BUTTON_ART_PADDING;
    const width = bounds.width + BUTTON_ART_PADDING * 2;
    const height = bounds.height + BUTTON_ART_PADDING * 2;
    const viewBox = `${left} ${top} ${width} ${height}`;
    const button = staticSvg(MinimalRingArtwork, { ...props, control, viewBox });
    const ripple = props.active === control && control !== 'center'
      ? staticSvg(MinimalRingRippleArtwork, { control, viewBox, progress: .45 }) : '';
    const svg = (button + ripple)
      .replaceAll('<svg ', `<svg x="${left}" y="${top}" `)
      .replaceAll('width="300"', `width="${width}"`).replaceAll('height="300"', `height="${height}"`);
    if (props.active !== control) return svg;
    const cx = bounds.left + bounds.width / 2;
    const cy = bounds.top + bounds.height / 2;
    return `<g transform="translate(${cx} ${cy + 1}) scale(${BUTTON_PRESS_SCALE}) translate(${-cx} ${-cy})">${svg}</g>`;
  }).join('');
  const surface = frame.replace('</svg>', `${buttons}</svg>`);
  // At rest the light has a .98 scale; at peak it spreads to 1.085.
  const phase = Math.max(0, Math.min(1, (pulse - AMBIENT_GLOW_MIN_OPACITY) / (AMBIENT_GLOW_MAX_OPACITY - AMBIENT_GLOW_MIN_OPACITY)));
  const scale = .98 + phase * .105;
  const halo = `<g opacity="${pulse}" transform="translate(150 150) scale(${scale}) translate(-150 -150)">${content(staticSvg(MinimalRingGlowArtwork))}</g>`;
  const bloom = props.active ? `<g opacity="${PRESS_BLOOM_OPACITY}">${content(staticSvg(MinimalRingGlowArtwork, { control: props.active }))}</g>` : '';
  return surface.replace(/(<svg[^>]*>)/, `$1${halo}${bloom}`);
}
const svg = artwork();
fs.writeFileSync(path.join(output, 'artwork.svg'), svg);
const inner = content(svg);
const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="347" height="300" viewBox="0 0 347 300">
<defs><radialGradient id="preview-blue"><stop stop-color="#c9d9ed"/><stop offset="1" stop-color="#e9eaf0"/></radialGradient></defs>
<rect width="347" height="300" fill="url(#preview-blue)"/><g transform="translate(28 0)">${inner}</g></svg>`;
fs.writeFileSync(path.join(output, 'blue-preview.svg'), preview);
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Minimal Ring validation</title>
<style>body{font:14px system-ui;background:#f2f5fa;color:#354b67;padding:24px}main{display:flex;flex-wrap:wrap;gap:24px}figure{margin:0}figcaption{margin-top:10px} .checker{background:repeating-conic-gradient(#e4eaf2 0% 25%,#fff 0% 50%) 0/20px 20px} .dark{background:#32465b}</style>
<h1>Minimal Ring · blue palette</h1><p>Same SVG components used by LittleEye. Colorful sky-blue left and cooler-blue right; lighter, distinct frosted top and bottom. Soft shadows, vibrant blurred blue pulse, and generous touch targets. Center diameter reduced to 64 reference units. Home D-pad is now 246 points, approximately 5% larger overall. Original image is only available in chat; no numeric pixel-difference claim.</p>
<main><figure>${preview}<figcaption>Reference-scale reconstruction; blue palette requested by user.</figcaption></figure>
<figure class="checker">${svg}<figcaption>Transparent background.</figcaption></figure><figure class="dark">${svg}<figcaption style="color:white">Transparency over dark content.</figcaption></figure>
<figure>${artwork({}, AMBIENT_GLOW_MAX_OPACITY)}<figcaption>Glow at its widest point.</figcaption></figure><figure>${artwork({ active: 'up' })}<figcaption>Up held: depressed glass, bloom, and ripple clipped to the button. Center is decorative.</figcaption></figure>
${[201.85,246,302.77].map(size => `<figure>${svg.replace('width="300"','width="'+size+'"').replace('height="300"','height="'+size+'"')}<figcaption>${size}px square layout.</figcaption></figure>`).join('')}</main></html>`;
fs.writeFileSync(path.join(output, 'preview.html'), html);
let Resvg;
try { ({ Resvg } = require('../.tmp/dpad-validation/node_modules/@resvg/resvg-js')); }
catch { console.log('SVG and HTML written; install optional renderer for PNG output.'); process.exit(0); }
for (const [name, source] of [['transparent', svg], ['blue-preview', preview], ['pressed-up', artwork({ active: 'up' })], ['pulse-peak', artwork({}, AMBIENT_GLOW_MAX_OPACITY)]]) {
  fs.writeFileSync(path.join(output, `${name}.png`), new Resvg(source).render().asPng());
}
// Raster check: no visible ripple pixel may lie more than one pixel beyond its shape.
const { PNG } = require('pngjs');
let frames = 0;
for (const control of ['up', 'right', 'down', 'left']) {
  for (const progress of [.12, .45, .8]) {
    const ripple = staticSvg(MinimalRingRippleArtwork, { control, progress });
    const bytes = new Resvg(ripple).render().asPng();
    if (progress === .45) fs.writeFileSync(path.join(output, `ripple-${control}.png`), bytes);
    const png = PNG.sync.read(bytes);
    let visible = 0;
    for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
      if (png.data[(y * png.width + x) * 4 + 3] < 4) continue;
      visible++;
      const nearShape = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]
        .some(([dx, dy]) => hitTestDPad(x + .5 + dx, y + .5 + dy) === control);
      if (!nearShape) throw new Error(`Ripple escaped ${control} clip at ${x},${y} (progress ${progress})`);
    }
    if (!visible) throw new Error(`Ripple frame is unexpectedly empty: ${control}, ${progress}`);
    frames++;
  }
}
console.log(`Verified ripple clipping in ${frames} rendered frames across all four directions.`);
console.log(`Rendered real SVG component to ${output}`);
