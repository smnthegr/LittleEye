import { BrandColors } from '@/constants/brand';
import './text-button-focus';
import {
  Platform, Pressable, StyleSheet, Text,
  type PressableProps, type StyleProp, type TextStyle,
} from 'react-native';

type TextButtonProps = Omit<PressableProps, 'children'> & {
  children: string;
  textStyle?: StyleProp<TextStyle>;
};

/** Transparent hit area; tap feedback is painted on the letters only. */
export function TextButton({ children, style, textStyle, ...props }: TextButtonProps) {
  return (
    <Pressable accessibilityRole="button" {...props}
      {...(Platform.OS === 'web' ? { dataSet: { textButton: 'true' } } : {})}
      style={state => [styles.hitArea, typeof style === 'function' ? style(state) : style]}>
      {({ pressed }) => <Text style={[textStyle, pressed && styles.pressed]}>{children}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitArea: { minHeight: 44, justifyContent: 'center' },
  pressed: {
    opacity: 0.65,
    textShadowColor: BrandColors.lightBlue,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
});
