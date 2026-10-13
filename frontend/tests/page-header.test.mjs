import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const screens = [
  'app/home.tsx', 'app/first-aid-guidance.tsx', 'app/settings.tsx',
  'app/history.tsx', 'app/emergency-hotline.tsx', 'app/emergency-services.tsx',
  'app/emergency-contacts.tsx', 'app/call.tsx', 'app/connect-camera.tsx',
  'app/sign-in.tsx', 'app/sign-up.tsx', 'app/set-up.tsx', 'app/forgot-password.tsx',
  'components/profile-screen.tsx', 'components/settings-page.tsx',
];

test('route back/profile headers stay outside scrolling content', async () => {
  for (const file of screens) {
    const source = await readFile(new URL(`../src/${file}`, import.meta.url), 'utf8');
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let headerCount = 0;
    function visit(node, scrolling = false) {
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        const opening = ts.isJsxElement(node) ? node.openingElement : node;
        const name = opening.tagName.getText(tree);
        if (name === 'FixedPageHeader') {
          headerCount++;
          assert.equal(scrolling, false, `${file}: top controls must remain reachable after scrolling`);
        }
        scrolling ||= ['ScrollView', 'EdgeScrollView', 'FlatList'].includes(name);
      }
      ts.forEachChild(node, child => visit(child, scrolling));
    }
    visit(tree);
    assert.ok(headerCount > 0, `${file}: missing shared page controls`);
  }
});
