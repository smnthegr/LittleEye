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
const { getHomeNavigationLayout, getResponsiveMetrics, scaleStyles } = await import(responsiveURL);
resolutionHook.deregister();

const phoneWidths = [320, 360, 375, 390, 412, 430, 480];

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

    const contentWidth = width - scaleSize(38);
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
    for (const key of ['bottomPadding', 'mainBottom', 'height', 'scrollPadding']) {
      assert.ok(Math.abs(largeInset[key] - smallInset[key] - 18) < 0.001,
        `${key} should count additional gesture space once at ${width}`);
    }
    assert.ok(largeInset.sideBottom >= 18, `labels need clearance from the gesture handle at ${width}`);
  }
});

test('reference iPhone dock and entire menu sit lower with less empty footer space', () => {
  const screenHeight = 844;
  const layout = getHomeNavigationLayout(390, 34);
  const labelBottom = screenHeight - layout.sideBottom;
  const menuTop = screenHeight - layout.mainBottom - layout.menuSize;
  const menuBottom = screenHeight - layout.mainBottom;
  assert.equal(layout.height, 136, 'the container should move down from its former 162-point height');
  assert.equal(layout.artworkHeight, 110);
  assert.equal(layout.menuSize, 76, 'the whole menu artwork and touch target should shrink together');
  assert.equal(layout.iconSize, 28);
  assert.equal(menuTop, 732);
  assert.equal(menuBottom, 808);
  assert.equal(labelBottom, 823.31);
  assert.ok(labelBottom > 802, 'the entire icon and label group should sit lower than the former dock');
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
      const sideContentHeight = layout.iconSlotSize + layout.iconGap + layout.labelHeight;
      assert.ok(layout.sideWidth >= 44 && sideContentHeight >= 44, 'side buttons need usable touch targets');
      assert.ok(layout.mainBottom > inset, `center button intersects the home indicator at ${width}`);
      assert.ok(layout.sideBottom > 0, `side labels need bottom spacing at ${width}`);
      assert.ok(layout.mainBottom + layout.menuSize <= layout.height, 'center button should remain inside its dock bounds');
    }
  }
});

test('side icon and text groups remain centred in the lowered blue body across phone widths', () => {
  for (const width of phoneWidths) {
    for (const inset of [0, 16, 34]) {
      const layout = getHomeNavigationLayout(width, inset);
      const groupHeight = layout.iconSlotSize + layout.iconGap + layout.labelHeight;
      const groupTop = layout.height - layout.sideBottom - groupHeight;
      const groupCenter = groupTop + groupHeight / 2;
      const curveY = getNavigationContourY(71) * layout.artworkHeight / 120;
      const blueBodyCenter = (curveY + layout.height) / 2;
      const { scaleSize } = getResponsiveMetrics(width);
      const gestureClearance = inset > 0 ? Math.min(inset, scaleSize(16)) : scaleSize(4);
      const centeredBottom = (layout.height - curveY - groupHeight) / 2;
      if (centeredBottom >= gestureClearance) {
        assert.ok(Math.abs(groupCenter - blueBodyCenter) < 0.02,
          `icon and text should be centred together inside the blue body at ${width}/${inset}`);
      } else {
        assert.ok(Math.abs(layout.sideBottom - gestureClearance) < 0.02,
          `centering should only yield to the minimum gesture clearance at ${width}/${inset}`);
      }
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
  assert.equal(screenIconCenter, 785.31, 'the side icons should move down from their former 764-point position');
});
