import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useAppSession } from './app-session';
import { BrightnessSlider } from './brightness-slider';
import { SettingsNetworkPanel } from './settings-network-panel';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';

const helpTopics = [
  ['Camera Setup', 'Connect your CCTV camera to power and its network. In camera setup, enter its name and supported stream address. This frontend preview stores setup details only; live viewing requires the camera integration.'],
  ['Understanding Fall Alerts', 'A fall alert should prompt you to check on the child. Incident details belong in History. Detection and alert delivery are not connected in this preview.'],
  ['Emergency Assistance', 'Use Emergency Hotline to find your emergency contacts and services. First-Aid Guidance remains in its own page.'],
  ['Troubleshooting', 'Check camera power, network connectivity and the stream address. If the feed is interrupted, monitoring may also be interrupted. Return to camera setup to review your connection details.'],
] as const;

function Info({ label, value }: { label: string; value: string }) {
  return <View style={s.info}><Text style={s.label}>{label}</Text><Text style={s.value}>{value}</Text></View>;
}
function Note({ children }: { children: string }) { return <Text style={s.note}>{children}</Text>; }
function Action({ title, onPress, disabled = false }: { title: string; onPress?: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.action, disabled && s.disabled, pressed && { opacity: .6 }]}><Text style={s.actionText}>{title}</Text></Pressable>;
}
type Preferences = { night: boolean; audio: boolean; fall: boolean; push: boolean; sound: boolean; vibration: boolean; preview: boolean };
function Toggle({ label, description, pref, preferences, onChange }: {
  label: string; description: string; pref: keyof Preferences; preferences: Preferences;
  onChange: (pref: keyof Preferences, value: boolean) => void;
}) {
  return <View style={s.toggleRow}><View style={s.toggleText}><Text style={s.value}>{label}</Text><Text style={s.description}>{description}</Text></View>
    <Switch accessibilityLabel={`${label} (preview)`} value={preferences[pref]}
      trackColor={{ false: '#9CB3D2', true: C.blue }} ios_backgroundColor="#9CB3D2" thumbColor={C.white}
      onValueChange={value => onChange(pref, value)} /></View>;
}

export function SettingsDetails({ section }: { section: string }) {
  const session = useAppSession();
  const [quality, setQuality] = useState('Auto');
  const [brightness, setBrightness] = useState(50);
  const [preferences, setPreferences] = useState({ night: true, audio: true, fall: true, push: true, sound: true, vibration: true, preview: false });
  const previewNote = 'Preview controls only. Selections reset when you leave this section and do not change the camera, AI stream or notification delivery.';

  const toggleProps = { preferences, onChange: (pref: keyof Preferences, value: boolean) => setPreferences(previous => ({ ...previous, [pref]: value })) };

  if (section === 'Image & Sound Settings') return <View>
    <Note>{previewNote}</Note><Text style={s.label}>Video quality</Text>
    {['720p — Standard', '1080p — High Definition', 'Auto'].map(option => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: quality === option }}
      onPress={() => setQuality(option)} style={[s.choice, quality === option && s.chosen]}><Text style={s.value}>{quality === option ? '●' : '○'}  {option === 'Auto' ? 'Auto — Camera default' : option}</Text></Pressable>)}
    <View style={s.brightness}>
      <View style={s.brightnessHeader}><Text style={s.value}>Brightness</Text><Text style={s.value}>{brightness}%</Text></View>
      <BrightnessSlider value={brightness} onValueChange={setBrightness} />
    </View>
    <Toggle {...toggleProps} label="Night Vision" description="Infrared night viewing, where supported." pref="night" />
    <Toggle {...toggleProps} label="Camera Audio" description="Audio from the camera, where supported." pref="audio" />
    <Note>Available controls must match the CCTV model. Image settings must preserve the validated AI processing stream.</Note>
  </View>;

  if (section === 'Network & Connection') return <SettingsNetworkPanel />;

  if (section === 'Fall Detection & Alerts') return <View>
    <Info label="AI Fall Detection" value="Not connected" /><Info label="Current detection status" value="Unavailable" />
    <Toggle {...toggleProps} label="Fall Alert Notifications" description="Notify the guardian when a fall is detected (preview)." pref="fall" />
    <Note>{previewNote}</Note><Info label="Incident severity" value="No classification available" />
    <Note>Severity information will reflect the existing system’s output. Incident details remain in History.</Note>
    <Text style={s.subheading}>Monitoring status</Text><Note>AI monitoring depends on camera availability and the detection service. Check Home for the live feed once those features are connected.</Note>
  </View>;

  if (section === 'Notification Preferences') return <View>
    <Note>{previewNote}</Note>
    <Toggle {...toggleProps} label="Push Notifications" description="Receive fall alerts on your phone." pref="push" />
    <Toggle {...toggleProps} label="Notification Sound" description="Play a sound when an alert arrives." pref="sound" />
    <Toggle {...toggleProps} label="Vibration" description="Vibrate when an alert arrives." pref="vibration" />
    <Toggle {...toggleProps} label="Alert Preview" description="Show a short alert message on your device (optional)." pref="preview" />
    <Note>Actual delivery requires the mobile notification integration and device permissions.</Note>
  </View>;

  if (section === 'Security & Access') return <View>
    <Text style={s.subheading}>Change Password</Text><Note>Password updates will be available when account authentication is connected.</Note>
    {['Current Password', 'New Password', 'Confirm New Password'].map(label => <View key={label}><Text style={s.label}>{label}</Text>
      <TextInput accessibilityLabel={`${label}, unavailable in preview`} editable={false} secureTextEntry placeholder="Unavailable in preview" style={[s.input, s.disabled]} /></View>)}
    <Action title="Save Changes" disabled />
    {session.camera && <><Text style={s.subheading}>Authorized Device Access</Text><Note>Camera sharing is not implemented. Authorized users and remove-access controls will appear when sharing is supported.</Note></>}
  </View>;

  if (section === 'Instructions & Help') return <View>{helpTopics.map(([title, text]) => <View key={title}><Text style={s.subheading}>{title}</Text><Note>{text}</Note></View>)}</View>;

  return null;
}

const s = StyleSheet.create({
  info: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#E4EBF5' },
  label: { fontFamily: F.semiBold, color: C.blue, fontSize: 11, marginTop: 10, marginBottom: 6 },
  value: { fontFamily: F.semiBold, color: C.blue, fontSize: 13, lineHeight: 21 },
  note: { fontFamily: F.regular, color: C.blue, fontSize: 12, lineHeight: 21, marginVertical: 10 },
  input: { minHeight: 48, padding: 12, borderWidth: 1, borderColor: C.lightBlue, borderRadius: 14, color: C.blue, fontFamily: F.regular, fontSize: 13 },
  action: { minHeight: 46, backgroundColor: C.blue, borderRadius: 23, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  actionText: { fontFamily: F.semiBold, color: C.white, fontSize: 12 }, disabled: { opacity: .45 },
  toggleRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E4EBF5' }, toggleText: { flex: 1 },
  description: { fontFamily: F.regular, color: C.blue, fontSize: 11, lineHeight: 18, marginTop: 4 },
  choice: { padding: 14, borderWidth: 1, borderColor: '#DBE5F2', borderRadius: 15, marginVertical: 4 }, chosen: { backgroundColor: '#EDF3FB', borderColor: C.blue },
  brightness: { paddingVertical: 18, marginTop: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E4EBF5' },
  brightnessHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  subheading: { fontFamily: F.bold, color: C.blue, fontSize: 15, marginTop: 24, marginBottom: 4 },
});
