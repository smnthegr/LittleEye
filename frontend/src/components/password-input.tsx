import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type ColorValue, type TextInputProps } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { BrandColors } from '@/constants/brand';
import { useResponsiveStyles } from '@/hooks/use-responsive-layout';

type Props = Omit<TextInputProps, 'secureTextEntry'> & { iconColor?: ColorValue };

export function PasswordInput({ style, iconColor = BrandColors.blue, editable = true, accessibilityLabel, ...props }: Props) {
  const s = useResponsiveStyles(styles);
  const [visible, setVisible] = useState(false);
  const shown = editable && visible;
  const inputStyle = StyleSheet.flatten(style);

  return <View style={[s.container, { marginBottom: inputStyle?.marginBottom }]}>
    <TextInput {...props} accessibilityLabel={accessibilityLabel} editable={editable}
      autoCapitalize="none" autoCorrect={false} secureTextEntry={!shown}
      style={[style, { marginBottom: 0 }, s.input]} />
    <Pressable accessibilityRole="button" accessibilityLabel={shown ? 'Hide password' : 'Show password'}
      accessibilityHint={accessibilityLabel} accessibilityState={{ disabled: !editable }} disabled={!editable}
      onPress={() => setVisible(current => !current)}
      style={({ pressed }) => [s.toggle, (!editable || pressed) && s.dimmed]}>
      <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <SymbolView name={shown
          ? { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }
          : { ios: 'eye', android: 'visibility', web: 'visibility' }} size={21} tintColor={iconColor} />
      </View>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  container: { alignSelf: 'stretch', position: 'relative' },
  input: { paddingRight: 56 },
  toggle: { position: 'absolute', right: 6, top: 0, bottom: 0, width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  dimmed: { opacity: 0.45 },
});
