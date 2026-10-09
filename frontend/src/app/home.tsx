import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { BrandColors, BrandFonts } from '@/constants/brand';
import { GlowButton } from '@/components/glow-button';

// Integration destination only. Replace with the group's Home page.
// Camera details are available from useAppSession().camera.
export default function HomeScreen() {
  return <View style={styles.screen}>
    <Text style={styles.title}>Home</Text>
    <Text style={styles.note}>The Home page will be added here.</Text>
    <GlowButton accessibilityRole="button" onPress={() => router.replace('/connect-camera')} style={styles.back}>
      <Text style={styles.label}>Back to camera setup</Text>
    </GlowButton>
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, padding: 32, backgroundColor: BrandColors.white, justifyContent: 'center', alignItems: 'center' },
  title: { fontFamily: BrandFonts.bold, color: BrandColors.blue, fontSize: 26 },
  note: { fontFamily: BrandFonts.regular, color: BrandColors.blue, fontSize: 13, marginTop: 12 },
  back: { backgroundColor: BrandColors.blue, borderRadius: 26, paddingHorizontal: 24, paddingVertical: 16, marginTop: 24 },
  label: { fontFamily: BrandFonts.semiBold, color: BrandColors.white, fontSize: 13 },
});