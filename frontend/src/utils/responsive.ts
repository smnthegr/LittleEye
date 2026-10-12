import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import { getNavigationContourY } from './navigation-contour';

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

export function getHomeNavigationLayout(width: number, bottomInset: number) {
  const { scaleSize, textScale } = getResponsiveMetrics(width);
  // Leave room for the gesture handle without raising the whole dock by its full inset.
  const bottomPadding = round(Math.max(0, bottomInset - scaleSize(12)) + scaleSize(4));
  const artworkHeight = scaleSize(110);
  const menuSize = scaleSize(76);
  const iconSlotSize = scaleSize(28);
  const labelHeight = round(18 * Math.max(12 / 13, textScale));
  const iconGap = scaleSize(6);
  const height = artworkHeight + bottomPadding;
  const sideContentHeight = iconSlotSize + iconGap + labelHeight;
  const shoulderY = getNavigationContourY(71) * artworkHeight / 120;
  const centeredSideBottom = (height - shoulderY - sideContentHeight) / 2;
  const gestureClearance = bottomInset > 0 ? Math.min(bottomInset, scaleSize(16)) : scaleSize(4);
  return {
    bottomPadding,
    artworkHeight,
    height,
    // Center the icon and label together within the blue area beneath each shoulder.
    sideBottom: round(Math.max(gestureClearance, centeredSideBottom)),
    mainBottom: bottomPadding + scaleSize(10),
    menuSize,
    menuGlowWidth: round(menuSize * 1.65),
    menuGlowHeight: round(menuSize * 1.45),
    iconSlotSize,
    iconSize: scaleSize(28),
    sideWidth: scaleSize(82),
    sideInset: scaleSize(30),
    sideCenterInset: scaleSize(71),
    labelHeight,
    iconGap,
    scrollPadding: height + scaleSize(16),
  };
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
