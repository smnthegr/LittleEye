import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, View, type GestureResponderEvent, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { MinimalRingArtwork } from '@/components/minimal-ring-artwork';
import { MinimalRingButtons } from '@/components/minimal-ring-buttons';
import { MinimalRingEffects } from '@/components/minimal-ring-effects';
import { createDPadInteraction } from '@/utils/dpad-interaction';
import { createDPadFeedback } from '@/utils/dpad-feedback';
import { CONTROL_BOUNDS, DIRECTION_ROTATIONS, hitTestDPadTouch, type DPadDirection } from '@/utils/minimal-ring-geometry';

export type MinimalRingDPadProps = {
  size?: number;
  onDirectionStart: (direction: DPadDirection) => void;
  onDirectionStop: (direction: DPadDirection) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Shape-aware single-pointer control. The parent owns movement, this owns its lifetime. */
export function MinimalRingDPad({ size = 300, onDirectionStart, onDirectionStop,
  disabled = false, style }: MinimalRingDPadProps) {
  const dimension = Number.isFinite(size) && size > 0 ? size : 300;
  const [active, setActive] = useState<DPadDirection | null>(null);
  const [feedback] = useState(createDPadFeedback);
  const updateFeedback = useCallback((control: DPadDirection | null) => {
    feedback.set(control);
    setActive(control);
  }, [feedback]);
  const [interaction] = useState(() => createDPadInteraction({
    start: onDirectionStart, stop: onDirectionStop,
    feedback: updateFeedback,
  }));
  const cancel = useCallback(() => interaction.cancel(), [interaction]);
  useLayoutEffect(() => {
    interaction.updateCallbacks({ start: onDirectionStart, stop: onDirectionStop,
      feedback: updateFeedback });
  }, [interaction, onDirectionStart, onDirectionStop, updateFeedback]);

  useEffect(() => {
    const state = AppState.addEventListener('change', next => { if (next !== 'active') cancel(); });
    const blur = Platform.OS === 'android' ? AppState.addEventListener('blur', cancel) : undefined;
    if (Platform.OS === 'web') window.addEventListener('blur', cancel);
    return () => {
      cancel(); state?.remove(); blur?.remove();
      if (Platform.OS === 'web') window.removeEventListener('blur', cancel);
    };
  }, [cancel]);
  useEffect(() => { cancel(); }, [cancel, disabled, dimension]);

  const hit = (event: GestureResponderEvent) => hitTestDPadTouch(event.nativeEvent.locationX, event.nativeEvent.locationY, dimension);
  const activate = (control: DPadDirection) => {
    if (!disabled && interaction.begin(control, -1)) interaction.end(-1);
  };

  return <View testID="minimal-ring-dpad" collapsable={false}
    style={[styles.root, style, { width: dimension, height: dimension }]}
    onStartShouldSetResponder={() => false}
    onStartShouldSetResponderCapture={event => !disabled && hit(event) !== null}
    onResponderGrant={event => { if (!disabled) interaction.begin(hit(event), event.nativeEvent.identifier); }}
    onResponderMove={event => {
      const owner = interaction.active;
      if (!owner) return;
      const touch = event.nativeEvent.touches.find(value => value.identifier === owner.pointer);
      if (touch) interaction.move(hitTestDPadTouch(touch.locationX, touch.locationY, dimension, owner.control), owner.pointer);
    }}
    onResponderEnd={event => {
      event.nativeEvent.changedTouches.forEach(touch => {
        interaction.move(hitTestDPadTouch(touch.locationX, touch.locationY, dimension, interaction.active?.control), touch.identifier);
        interaction.end(touch.identifier);
      });
    }}
    onResponderRelease={cancel} onResponderTerminate={cancel}
    onResponderTerminationRequest={() => interaction.active === null} onTouchCancel={cancel}>
    <MinimalRingEffects feedback={feedback} disabled={disabled} />
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <MinimalRingArtwork frameOnly disabled={disabled} />
    </View>
    <MinimalRingButtons active={active} feedback={feedback} size={dimension} disabled={disabled} />
    {(Object.keys(DIRECTION_ROTATIONS) as DPadDirection[]).map(control => {
      const bounds = CONTROL_BOUNDS[control];
      const width = Math.max(48, bounds.width / 300 * dimension);
      const height = Math.max(48, bounds.height / 300 * dimension);
      return <View key={control} pointerEvents="none" accessible accessibilityRole="button"
        accessibilityLabel={`Move camera preview ${control}`}
        accessibilityState={{ disabled }} accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={event => { if (event.nativeEvent.actionName === 'activate') activate(control); }}
        onAccessibilityTap={() => activate(control)}
        tabIndex={disabled ? -1 : 0}
        {...(Platform.OS === 'web' ? {
          onClick: () => activate(control),
          onKeyDown: (event: Parameters<NonNullable<ViewProps['onKeyDown']>>[0] | { key: string; repeat?: boolean; preventDefault: () => void }) => {
            const key = 'key' in event ? event : event.nativeEvent;
            if (key.key !== ' ' && key.key !== 'Enter') return;
            event.preventDefault();
            if (!disabled && !key.repeat) interaction.begin(control, -1);
          },
          onKeyUp: (event: Parameters<NonNullable<ViewProps['onKeyUp']>>[0] | { key: string; preventDefault: () => void }) => {
            const key = 'key' in event ? event.key : event.nativeEvent.key;
            if (key !== ' ' && key !== 'Enter') return;
            event.preventDefault(); interaction.end(-1);
          },
          onBlur: cancel,
        } : {})}
        style={{ position: 'absolute', left: (bounds.left + bounds.width / 2) / 300 * dimension - width / 2,
          top: (bounds.top + bounds.height / 2) / 300 * dimension - height / 2, width, height }} />;
    })}
  </View>;
}

const styles = StyleSheet.create({ root: { position: 'relative', flexShrink: 0 } });
