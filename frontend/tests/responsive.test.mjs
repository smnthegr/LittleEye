import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';
import { getNavigationContourY } from '../src/utils/navigation-contour.ts';

// Metro resolves the app's extensionless TS imports; direct Node tests need the same resolution.
const responsiveURL = new URL('../src/utils/responsive.ts', import.meta.url).href;
const resolutionHook = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL === responsiveURL && specifier === './navigation-contour') {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});
const { getHomeNavigationLayout, getPageHeaderLayout, getResponsiveMetrics, getEmergencyHotlineLayout, scaleStyles } = await import(responsiveURL);
resolutionHook.deregister();

const phoneWidths = [320, 360, 375, 390, 412, 430, 480];

test('SOS fits its viewport or reserves a scrollable page without shrinking usable actions', () => {
  for (const width of [...phoneWidths, 568, 844, 1024]) {
    for (const height of [320, 390, 480, 568, 640, 740, 844, 932, 1366]) {
      for (const fontScale of [1, 1.25, 2]) {
        for (const topInset of [0, 24, 59]) {
          for (const bottomInset of [0, 34]) {
            const layout = getEmergencyHotlineLayout(width, height, topInset, bottomInset, fontScale);
            const used = layout.headingHeight + layout.addressHeight + layout.actionHeight * 2 + layout.gap * 4 + layout.sosDiameter;
            const available = layout.minPageHeight - layout.contentTop - layout.bottomPadding;
            assert.ok(used <= available + 0.05, `${width}x${height}: all content must remain reachable`);
            assert.equal(layout.scrollRequired, used > layout.contentHeight + 0.05);
            assert.ok(layout.minPageHeight >= height, 'scrollable content cannot be shorter than its viewport');
            if (!layout.scrollRequired) assert.equal(layout.minPageHeight, height, 'fitting pages retain their existing geometry');
            assert.ok(layout.sosDiameter * 148 / 204 >= 44, 'SOS keeps a usable touch target');
            assert.ok(layout.actionHeight >= 44, 'navigation actions keep usable touch targets');
            assert.ok(layout.contentTop >= getPageHeaderLayout(width, topInset).contentTop);
          }
        }
      }
    }
  }
});

test('SOS scroll fallback covers the audited failures while preserving the reference phone', () => {
  for (const dimensions of [[480, 568, 59, 34, 1.25], [568, 320, 0, 0, 1], [844, 390, 0, 21, 1]]) {
    const layout = getEmergencyHotlineLayout(...dimensions);
    assert.equal(layout.scrollRequired, true);
    assert.ok(layout.minPageHeight > dimensions[1]);
  }
  const reference = getEmergencyHotlineLayout(390, 844, 59, 34);
  assert.equal(reference.scrollRequired, false);
  assert.equal(reference.minPageHeight, 844);
  assert.equal(reference.sosDiameter, 280);
});

test('pinned page controls clear notches, preserve touch targets, and reserve content space', () => {
  for (const width of [...phoneWidths, 768]) {
    for (const inset of [0, 24, 47, 59]) {
      const header = getPageHeaderLayout(width, inset);
      const { pageWidth } = getResponsiveMetrics(width);
      assert.ok(header.top > inset);
      assert.ok(header.buttonSize >= 44);
      assert.ok(header.contentTop > header.top + header.buttonSize);
      assert.ok(2 * header.horizontalInset + 2 * header.buttonSize + 24 < pageWidth);
    }
  }
});

test('navbar reserves larger label groups and gesture clearance for enlarged phone text', () => {
  for (const width of phoneWidths) {
    for (const fontScale of [1, 1.3, 1.5, 2]) {
      const layout = getHomeNavigationLayout(width, 34, fontScale);
      const standard = getHomeNavigationLayout(width, 34);
      assert.ok(layout.labelHeight >= standard.labelHeight * fontScale - 0.02);
      assert.ok(layout.height >= standard.height);
      assert.ok(layout.sideBottom >= 18 - 0.02);
      assert.ok(layout.scrollPadding > layout.height);
      assert.equal(layout.labelLineHeight, standard.labelLineHeight, 'native text applies system font scaling once');
    }
  }
});

test('reference design remains unchanged at 390 points', () => {
  const base = { card: { width: 200, padding: 24, fontSize: 16, lineHeight: 24, minHeight: 56 } };
  const { scale, textScale } = getResponsiveMetrics(390);
  assert.deepEqual(scaleStyles(base, scale, textScale), base);
});

test('form margins and camera controls fit compact and large phone widths', () => {
  for (const width of phoneWidths) {
    const { scaleSize } = getResponsiveMetrics(width);
    const formWidth = width - 2 * scaleSize(36);
    assert.ok(Math.abs(formWidth / width - 318 / 390) < 0.001);

    const contentWidth = width - scaleSize(48);
    const dpadLeft = contentWidth / 2 - scaleSize(105);
    const dpadRight = contentWidth / 2 + scaleSize(105);
    assert.ok(dpadLeft > scaleSize(50), `sound controls overlap at ${width}`);
    assert.ok(dpadRight < contentWidth - scaleSize(60), `zoom controls overlap at ${width}`);
  }
});

test('compact forms keep usable control heights and readable text', () => {
  const base = { input: { minHeight: 56, fontSize: 14, lineHeight: 20 }, next: { minHeight: 44 }, caption: { fontSize: 10 } };
  for (const width of phoneWidths) {
    const { scale, textScale } = getResponsiveMetrics(width);
    const styles = scaleStyles(base, scale, textScale);
    assert.ok(styles.input.minHeight >= 44);
    assert.ok(styles.next.minHeight >= 44);
    assert.ok(styles.input.fontSize >= 12);
    assert.ok(styles.input.lineHeight > styles.input.fontSize);
    assert.ok(styles.caption.fontSize >= 10);
  }
});

test('scaling preserves percentages, width caps, borders, animation scale and source styles', () => {
  const base = { art: { width: '100%', maxWidth: 480, opacity: 0.5, borderWidth: 1.5, zIndex: 10,
    transform: [{ translateX: -20 }, { scale: 0.98 }, { rotate: '45deg' }] } };
  const snapshot = structuredClone(base);
  const { scale, textScale } = getResponsiveMetrics(320);
  const { art } = scaleStyles(base, scale, textScale);
  assert.equal(art.width, '100%');
  assert.equal(art.maxWidth, 480);
  assert.equal(art.opacity, 0.5);
  assert.equal(art.borderWidth, 1.5);
  assert.equal(art.zIndex, 10);
  assert.equal(art.transform[1].scale, 0.98);
  assert.equal(art.transform[2].rotate, '45deg');
  assert.ok(Math.abs(art.transform[0].translateX) < 20);
  assert.deepEqual(base, snapshot);
});

test('tablet and desktop viewports keep a capped phone canvas', () => {
  for (const width of [768, 1024, 1440]) {
    const metrics = getResponsiveMetrics(width);
    assert.equal(metrics.pageWidth, 480);
    assert.ok(metrics.textScale <= 1.15);
    assert.equal(metrics.scaleSize(390), 480);
  }
});

test('lowered navigation preserves gesture clearance without stretching artwork or buttons', () => {
  for (const width of phoneWidths) {
    const withoutInset = getHomeNavigationLayout(width, 0);
    assert.equal(getHomeNavigationLayout(width, -10).bottomPadding, withoutInset.bottomPadding);
    const smallInset = getHomeNavigationLayout(width, 16);
    const largeInset = getHomeNavigationLayout(width, 34);
    for (const inset of [16, 34]) {
      const safe = getHomeNavigationLayout(width, inset);
      for (const key of ['artworkHeight', 'menuSize', 'menuGlowWidth', 'menuGlowHeight', 'iconSlotSize']) {
        assert.equal(safe[key], withoutInset[key], `${key} stretched by the safe area at ${width}`);
      }
      assert.ok(safe.bottomPadding >= withoutInset.bottomPadding);
      assert.ok(safe.scrollPadding > safe.height);
    }
    const extraPadding = largeInset.bottomPadding - smallInset.bottomPadding;
    assert.ok(extraPadding >= 0 && extraPadding <= 18, 'compact labels may require some of the gesture space');
    for (const key of ['mainBottom', 'height', 'scrollPadding']) {
      assert.ok(Math.abs(largeInset[key] - smallInset[key] - extraPadding) < 0.001,
        `${key} should count additional gesture space once at ${width}`);
    }
    assert.ok(largeInset.sideBottom >= 18, `labels need clearance from the gesture handle at ${width}`);
  }
});

test('reference iPhone attached body cradles the menu with a wider natural gap', () => {
  const screenHeight = 844;
  const layout = getHomeNavigationLayout(390, 34);
  const labelBottom = screenHeight - layout.sideBottom;
  const menuTop = screenHeight - layout.mainBottom - layout.menuSize;
  const menuBottom = screenHeight - layout.mainBottom;
  assert.equal(layout.height, 128, 'the shortened body should stay attached to the bottom');
  assert.equal(layout.artworkTop, 0);
  assert.equal(layout.artworkHeight, 110);
  assert.equal(layout.menuSize, 76, 'the whole menu artwork and touch target should shrink together');
  assert.equal(layout.iconSize, 28);
  assert.equal(menuTop, 721.17);
  assert.equal(menuBottom, 797.17);
  assert.equal(labelBottom, 826);
  assert.equal(layout.labelHeight, 16);
  const notchBottom = screenHeight - layout.height + layout.artworkTop + getNavigationContourY(195) * layout.artworkHeight / 120;
  assert.ok(Math.abs(notchBottom - menuBottom - 16) < 0.01, 'the fuller cup should have wider natural padding');
  assert.ok(layout.menuGlowWidth > layout.menuSize && layout.menuGlowHeight > layout.menuSize,
    'the soft glow should extend beyond the smaller menu without enlarging its button');
});

test('curved navigation keeps its side tabs aligned and buttons clear the home indicator', () => {
  for (const width of phoneWidths) {
    const { pageWidth } = getResponsiveMetrics(width);
    for (const inset of [0, 16, 34]) {
      const layout = getHomeNavigationLayout(width, inset);
      const leftIconCenter = layout.sideInset + layout.sideWidth / 2;
      const rightIconCenter = pageWidth - layout.sideInset - layout.sideWidth / 2;
      const leftHighlightCenter = layout.sideCenterInset;
      const travelDistance = pageWidth - 2 * layout.sideCenterInset;
      const rightHighlightCenter = leftHighlightCenter + travelDistance;

      assert.ok(Math.abs(leftHighlightCenter - leftIconCenter) < 0.02, `Home highlight is off-center at ${width}`);
      assert.ok(Math.abs(rightHighlightCenter - rightIconCenter) < 0.02, `First-Aid highlight is off-center at ${width}`);
      assert.ok(travelDistance > layout.menuSize, 'only side tabs should determine the sliding selection');
      // Pressables retain their 44-point minimum height even when the smaller content is shorter.
      assert.ok(layout.sideWidth >= 44, 'side buttons need usable horizontal touch targets');
      assert.ok(layout.mainBottom > inset, `center button intersects the home indicator at ${width}`);
      assert.ok(layout.sideBottom > 0, `side labels need bottom spacing at ${width}`);
      assert.ok(layout.mainBottom + layout.menuSize <= layout.height, 'center button should remain inside its dock bounds');
    }
  }
});

test('side icon and text groups remain centred inside the attached body across phone widths', () => {
  for (const width of phoneWidths) {
    for (const inset of [0, 16, 34]) {
      const layout = getHomeNavigationLayout(width, inset);
      const groupHeight = layout.iconSlotSize + layout.iconGap + layout.labelHeight;
      const groupTop = layout.height - layout.sideBottom - groupHeight;
      const groupCenter = groupTop + groupHeight / 2;
      const curveY = layout.artworkTop + getNavigationContourY(61) * layout.artworkHeight / 120;
      const bodyBottomY = layout.height;
      const blueBodyCenter = (curveY + bodyBottomY) / 2;
      const { scaleSize } = getResponsiveMetrics(width);
      assert.ok(Math.abs(groupCenter - blueBodyCenter) < 0.02,
        `icon and text should be centred together inside the attached body at ${width}/${inset}`);
      assert.ok(groupTop + groupHeight < bodyBottomY, `label should remain inside the attached body at ${width}/${inset}`);
      const menuTop = layout.height - layout.mainBottom - layout.menuSize;
      assert.ok(menuTop - scaleSize(2.5) > 0, `the subtle floating movement must stay inside the host at ${width}`);
      if (inset === 34) {
        assert.ok(Math.abs(groupCenter - blueBodyCenter) < 0.02,
          `gesture phones should keep the icon and text group centred at ${width}`);
        assert.ok(layout.sideBottom >= 18, `gesture handle needs clearance below the label at ${width}`);
      }
      assert.ok(groupTop > curveY, `icon should clear the curved rim at ${width}/${inset}`);
    }
  }
  const reference = getHomeNavigationLayout(390, 34);
  const screenIconCenter = 844 - reference.sideBottom - reference.labelHeight - reference.iconGap - reference.iconSlotSize / 2;
  assert.equal(screenIconCenter, 792, 'the side icons and smaller labels should remain centered inside the attached body');
});
