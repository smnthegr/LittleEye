export const severityLevels = [
  { label: 'Mild', color: '#F5C06F' },
  { label: 'Moderate', color: '#FF791F' },
  { label: 'Severe', color: '#FF3946' },
] as const;

export type Severity = typeof severityLevels[number]['label'];

export const guidanceBySeverity: Record<Severity, { signs: string[]; steps: { title: string; detail: string }[] }> = {
  Mild: {
    signs: ['Bruises', 'Small bumps', 'Scratches', 'Mild swelling', 'The child is alert, breathing, behaving, and moving normally.'],
    steps: [
      { title: 'Comfort the child', detail: 'Comfort the child and check for visible injuries.' },
      { title: 'Clean minor cuts', detail: 'Clean minor cuts or scratches with clean running water.' },
      { title: 'Apply a cold pack', detail: 'Apply a cold pack wrapped in a towel to bruises or swelling for up to 20 minutes.' },
      { title: 'Observe for changes', detail: 'Observe for worsening pain, swelling, or changes in behavior.' },
      { title: 'Seek medical advice if needed', detail: 'Seek medical advice if symptoms worsen or a head injury is suspected, especially in younger toddlers.' },
    ],
  },
  Moderate: {
    signs: ['Significant swelling', 'Persistent pain', 'Difficulty moving a limb', 'Suspected fracture', 'Deep cuts', 'Possible concussion without immediate emergency warning signs'],
    steps: [
      { title: 'Stop activity', detail: 'Stop the child from moving or playing.' },
      { title: 'Check the child', detail: "Check the child's breathing, alertness, and visible injuries." },
      { title: 'Support the injured area', detail: 'Keep the injured area still and supported. Do not straighten a suspected fracture.' },
      { title: 'Apply a cold pack if appropriate', detail: 'Apply a wrapped cold pack to swelling if appropriate.' },
      { title: 'Arrange prompt medical assessment', detail: 'Seek emergency care if symptoms worsen or serious warning signs appear.' },
    ],
  },
  Severe: {
    signs: ['Unconsciousness', 'Unresponsiveness', 'Seizures', 'Abnormal breathing', 'Difficult breathing', 'Heavy bleeding', 'Suspected serious head injury', 'Suspected serious neck injury', 'Suspected spinal injury', 'Suspected internal injury'],
    steps: [
      { title: 'Call 911 immediately', detail: 'Call 911 immediately in the Philippines.' },
      { title: 'Check responsiveness and breathing', detail: "Check the child's responsiveness and breathing." },
      { title: 'Begin CPR if needed', detail: "If the child is unresponsive and not breathing normally, begin CPR and follow the emergency dispatcher's instructions." },
      { title: 'Limit movement', detail: 'If spinal injury is suspected, avoid unnecessary movement. Move the child only if needed for immediate safety or lifesaving care.' },
      { title: 'Control heavy bleeding', detail: 'Apply firm, continuous pressure with clean gauze or cloth.' },
      { title: 'Respond safely to a seizure', detail: 'Clear nearby hazards, do not restrain the child, and never put anything in their mouth.' },
      { title: 'Stay and monitor', detail: "Stay with the child, monitor breathing, and follow the emergency dispatcher's instructions." },
    ],
  },
};
