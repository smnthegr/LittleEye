import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import { getNavigationContourY, NAVIGATION_SIDE_CENTER_X } from './navigation-contour';

export const DESIGN_WIDTH = 390;
export const MAX_PAGE_WIDTH = 480;

type Style = ViewStyle | TextStyle | ImageStyle;
type Styles = Record<string, Style>;

const dimensionProperties = new Set([
  'width', 'height', 'minWidth', 'minHeight', 'maxHeight', 'flexBasis',
  'top', 'right', 'bottom', 'left', 'start', 'end',
  'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
  'paddingHorizontal', 'paddingVertical', 'paddingStart', 'paddingEnd',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'marginHorizontal', 'marginVertical', 'marginStart', 'marginEnd',
  'gap', 'rowGap', 'columnGap', 'borderRadius',
  'borderTopLeftRadius', 'borderTopRightRadius',
  'borderBottomLeftRadius', 'borderBottomRightRadius',
  'borderTopStartRadius', 'borderTopEndRadius',
  'borderBottomStartRadius', 'borderBottomEndRadius',
]);

const round = (value: number) => Math.round(value * 100) / 100;

export function getResponsiveMetrics(width: number) {
  const pageWidth = Math.max(1, Math.min(width, MAX_PAGE_WIDTH));
  const scale = pageWidth / DESIGN_WIDTH;
  // Typography changes gently and still honors the phone's accessibility setting.
  const textScale = Math.max(0.9, Math.min(scale, 1.15));
  return {
    pageWidth,
    scale,
    textScale,
    scaleSize: (value: number) => round(value * scale),
  };
}

export function getHomeNavigationLayout(width: number, bottomInset: number, fontScale = 1) {
  const { scaleSize, textScale } = getResponsiveMetrics(width);
  // Keep the blue body attached to the bottom while protecting the gesture area.
  const baseBottomPadding = round(Math.max(0, bottomInset - scaleSize(20)) + scaleSize(4));
  const artworkTop = 0;
  const artworkHeight = scaleSize(110);
  const menuSize = scaleSize(76);
  const iconSlotSize = scaleSize(28);
  const labelLineHeight = round(16 * Math.max(1, textScale));
  const sideWidth = scaleSize(82);
  const accessibleScale = Math.max(1, fontScale);
  const labelLines = Math.max(1, Math.ceil(56 * Math.max(1, textScale) * accessibleScale / sideWidth));
  const labelHeight = round(labelLineHeight * accessibleScale * labelLines);
  const iconGap = scaleSize(4);
  const sideContentHeight = iconSlotSize + iconGap + labelHeight;
  const shoulderY = getNavigationContourY(61) * artworkHeight / 120;
  const gestureClearance = bottomInset > 0 ? Math.min(bottomInset, 18) : scaleSize(4);
  const minimumBottomPadding = Math.ceil((shoulderY + sideContentHeight + 2 * gestureClearance - artworkHeight) * 100) / 100;
  const bottomPadding = round(Math.max(baseBottomPadding, minimumBottomPadding));
  const height = artworkHeight + bottomPadding;
  const centeredSideBottom = (height - shoulderY - sideContentHeight) / 2;
  // Leave breathing room inside the notch and keep the full float in the host.
  const menuBottomY = getNavigationContourY(195) * artworkHeight / 120 - scaleSize(16);
  return {
    bottomPadding,
    artworkHeight,
    artworkTop,
    height,
    // Center each icon and label in the attached body, including its bottom fill.
    sideBottom: round(centeredSideBottom),
    mainBottom: round(height - menuBottomY),
    menuSize,
    menuGlowWidth: round(menuSize * 1.95),
    menuGlowHeight: round(menuSize * 1.8),
    iconSlotSize,
    iconSize: scaleSize(28),
    sideWidth,
    sideInset: scaleSize(32),
    sideCenterInset: scaleSize(NAVIGATION_SIDE_CENTER_X),
    labelHeight,
    labelLineHeight,
    iconGap,
    scrollPadding: height + scaleSize(16),
  };
}

/** Shared safe-area geometry for the pinned back/profile controls on every route. */
export function getPageHeaderLayout(width: number, topInset: number) {
  const { scaleSize } = getResponsiveMetrics(width);
  const top = Math.max(0, topInset) + scaleSize(8);
  const buttonSize = Math.max(44, scaleSize(44));
  return {
    top,
    horizontalInset: scaleSize(24),
    buttonSize,
    contentTop: round(top + buttonSize + scaleSize(8)),
  };
}

/** Reserve SOS text/actions first; use scrolling when their minimum sizes cannot fit. */
export function getEmergencyHotlineLayout(width: number, height: number, topInset: number, bottomInset: number, fontScale = 1) {
  const { scale, scaleSize, textScale } = getResponsiveMetrics(width);
  const { contentTop } = getPageHeaderLayout(width, topInset);
  const bottomPadding = Math.max(0, bottomInset) + scaleSize(16);
  const contentHeight = Math.max(0, height - contentTop - bottomPadding);
  const spacingScale = Math.min(scale, Math.max(0.75, contentHeight / 560));
  const contentTextScale = Math.min(textScale, Math.max(0.9, contentHeight / 560));
  const textMultiplier = contentTextScale * Math.max(1, Math.min(fontScale, 1.25));
  const gap = round((contentHeight < scaleSize(560) ? 10 : 16) * spacingScale);
  const headingHeight = round(72 * textMultiplier + 8 * spacingScale);
  const addressHeight = round(Math.max(88 * spacingScale, 60 * textMultiplier + 32 * spacingScale));
  const actionHeight = round(Math.max(52, 64 * spacingScale, 40 * textMultiplier + 16 * spacingScale));
  const fixedHeight = headingHeight + addressHeight + actionHeight * 2 + gap * 4;
  const sosDiameter = round(Math.max(64, Math.min(scaleSize(280), contentHeight - fixedHeight)));
  const requiredContentHeight = round(fixedHeight + sosDiameter);
  const scrollRequired = requiredContentHeight > contentHeight + 0.05;
  const minPageHeight = scrollRequired ? contentTop + requiredContentHeight + bottomPadding : height;
  return { contentTop, bottomPadding, contentHeight, gap, headingHeight, addressHeight, actionHeight, sosDiameter, spacingScale, textScale: contentTextScale, scrollRequired, minPageHeight };
}

/** Scale design dimensions, leaving percentages, width caps, borders and colors intact. */
export function scaleStyles<T extends Styles>(baseStyles: T, scale: number, textScale: number): T {
  const result: Styles = {};
  for (const [name, style] of Object.entries(baseStyles)) {
    const scaled: Record<string, unknown> = { ...style };
    const fontSize = 'fontSize' in style ? style.fontSize : undefined;
    const fontScale = typeof fontSize === 'number'
      ? Math.max(Math.min(fontSize, 12), fontSize * textScale) / fontSize
      : textScale;

    for (const [key, value] of Object.entries(style)) {
      if (typeof value === 'number' && dimensionProperties.has(key)) {
        // Keep standard form controls at least 44 points tall on compact phones.
        scaled[key] = key === 'minHeight' && value >= 44 && value <= 64
          ? Math.max(44, round(value * scale))
          : round(value * scale);
      } else if (typeof value === 'number' && (key === 'fontSize' || key === 'lineHeight' || key === 'letterSpacing')) {
        scaled[key] = round(value * fontScale);
      } else if (key === 'transform' && Array.isArray(value)) {
        scaled[key] = value.map(transform => Object.fromEntries(
          Object.entries(transform).map(([property, amount]) => [
            property,
            (property === 'translateX' || property === 'translateY') && typeof amount === 'number'
              ? round(amount * scale) : amount,
          ]),
        ));
      }
    }
    result[name] = scaled;
  }
  return result as T;
}
