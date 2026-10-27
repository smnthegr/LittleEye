import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import test, { after } from 'node:test';

// Metro turns this static bundled-asset require into a numeric asset ID.
globalThis.require = path => {
  assert.equal(path, '../../assets/sample-video.mp4');
  return 1;
};

const state = globalThis.__recordingSaveTest = {
  sample: readFileSync(new URL('../assets/sample-video.mp4', import.meta.url)),
  granted: true, failSave: false, files: new Map(), saved: [], deleted: [], permissions: [], exporterLoads: 0,
};
const source = `
const state = globalThis.__recordingSaveTest;
export class Asset {
  static fromModule() { return { localUri: 'file:///sample.mp4', async downloadAsync() {} }; }
  static async create(uri) {
    if (state.failSave) throw new Error('Gallery is unavailable');
    if (!state.files.has(uri)) throw new Error('File not written before save');
    state.saved.push(uri);
    return { id: 'saved-video' };
  }
}
export const Paths = { cache: 'file:///cache' };
export class File {
  constructor(...parts) { this.uri = parts.join('/'); }
  async bytes() { return state.sample; }
  write(bytes) { state.files.set(this.uri, bytes); }
  get exists() { return state.files.has(this.uri); }
  delete() { state.deleted.push(this.uri); state.files.delete(this.uri); }
}
export async function requestPermissionsAsync(...args) {
  state.permissions.push(args); return { granted: state.granted };
}
`;
const stub = `data:text/javascript,${encodeURIComponent(source)}`;
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (['expo-asset', 'expo-file-system', 'expo-media-library'].includes(specifier)) return { url: stub, shortCircuit: true };
    if (specifier === '@/utils/export-sample-recording') {
      state.exporterLoads++;
      return { url: new URL('../src/utils/export-sample-recording.ts', import.meta.url).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { requestRecordingSavePermission, saveSampleRecording } = await import('../src/services/save-recording.ts');
after(() => hooks.deregister());

test('opening the screen and requesting permission do not initialize the video exporter', async () => {
  assert.equal(state.exporterLoads, 0);
  await requestRecordingSavePermission();
  assert.equal(state.exporterLoads, 0);
});

test('recording requests add-only video permission and clearly rejects denial', async () => {
  await requestRecordingSavePermission();
  assert.deepEqual(state.permissions.at(-1), [true, ['video']]);
  state.granted = false;
  await assert.rejects(requestRecordingSavePermission(), /Allow LittleEye/);
  state.granted = true;
});

test('the real exported MP4 is written before Gallery saves it and cache is cleaned afterward', async () => {
  const message = await saveSampleRecording(8, 2);
  assert.equal(message, 'Saved to Photos/Gallery');
  const uri = state.saved.at(-1);
  assert.match(uri, /LittleEye-\d+\.mp4$/);
  assert.ok(state.deleted.includes(uri));
  assert.equal(state.files.has(uri), false);
});

test('Gallery failures reject without claiming success or deleting the unsaved video', async () => {
  const savedCount = state.saved.length;
  state.failSave = true;
  await assert.rejects(saveSampleRecording(8, 2), /Gallery is unavailable/);
  assert.equal(state.saved.length, savedCount);
  assert.equal(state.files.size, 1);
  state.failSave = false;
});
