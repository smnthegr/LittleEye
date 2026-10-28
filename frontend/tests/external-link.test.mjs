import assert from 'node:assert/strict';
import test from 'node:test';
import { loadFrontend } from './helpers/ui-test.mjs';

for (const fail of [false, true]) {
  test(`native attribution link ${fail ? 'handles browser failure without rejecting' : 'opens through the browser'}`, async () => {
    const launches = [], alerts = [];
    let prevented = false;
    const { ExternalLink } = loadFrontend('src/components/external-link.tsx', {
      'expo-router': { Link: 'Link' },
      'expo-web-browser': {
        openBrowserAsync: async href => { launches.push(href); if (fail) throw new Error('Synthetic browser failure'); },
        WebBrowserPresentationStyle: { AUTOMATIC: 'auto' },
      },
      'react-native': { Alert: { alert: (...args) => alerts.push(args) } },
    }, { process: { env: { EXPO_OS: 'android' } } });
    await assert.doesNotReject(() => ExternalLink({ href: 'https://www.tomtom.com/legal/' }).props.onPress({ preventDefault() { prevented = true; } }));
    assert.equal(prevented, true);
    assert.deepEqual(launches, ['https://www.tomtom.com/legal/']);
    assert.equal(alerts.length, fail ? 1 : 0);
  });
}

test('web attribution links keep normal browser navigation', async () => {
  const { ExternalLink } = loadFrontend('src/components/external-link.tsx', {
    'expo-router': { Link: 'Link' }, 'expo-web-browser': {}, 'react-native': {},
  }, { process: { env: { EXPO_OS: 'web' } } });
  await ExternalLink({ href: 'https://www.tomtom.com/legal/' }).props.onPress({ preventDefault() { assert.fail('Web navigation should not be prevented'); } });
});
