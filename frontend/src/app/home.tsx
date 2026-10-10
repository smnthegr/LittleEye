import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { BrandColors, BrandFonts } from '@/constants/brand';
import { BackButton } from '@/components/back-button';

// Integration destination only. Replace with the group's Home page.
// Camera details are available from useAppSession().camera.
export default function HomeScreen() {
  return <View style={styles.screen}>
    <Text style={styles.title}>Home</Text>
    <Text style={styles.note}>The Home page will be added here.</Text>
    <BackButton light accessibilityLabel="Back to camera setup" onPress={() => router.replace('/connect-camera')} style={styles.back} />
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, padding: 32, backgroundColor: BrandColors.white, justifyContent: 'center', alignItems: 'center' },
  title: { fontFamily: BrandFonts.bold, color: BrandColors.blue, fontSize: 26 },
  note: { fontFamily: BrandFonts.regular, color: BrandColors.blue, fontSize: 13, marginTop: 12 },
  back: { marginTop: 24 },
  label: { fontFamily: BrandFonts.semiBold, color: BrandColors.white, fontSize: 13 },
});
