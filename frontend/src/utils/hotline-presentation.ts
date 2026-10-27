import { isGeneralMedicalContact, type EmergencyHotline } from '../constants/emergency-hotlines';
import { getHotlineNetworkLabel } from './hotline-network';

export type HotlineServiceGroup = { name: string; hotlines: EmergencyHotline[] };

export function groupHotlineServices(hotlines: readonly EmergencyHotline[]): HotlineServiceGroup[] {
  const groups = new Map<string, EmergencyHotline[]>();
  for (const hotline of hotlines) groups.set(hotline.name, [...(groups.get(hotline.name) ?? []), hotline]);
  return [...groups].map(([name, entries]) => ({ name, hotlines: entries }));
}

/** City dispatch and direct medical/rescue services stay outside the disclosure. */
export function isEssentialHotline(hotline: EmergencyHotline) {
  if (hotline.area === 'Philippines') return true;
  if (isGeneralMedicalContact(hotline) || hotline.area.endsWith(' province')) return false;
  if (hotline.extension && !/^\d{3,6}$/.test(hotline.dialNumber)) return false;
  return /^\d{3,6}$/.test(hotline.dialNumber)
    || /Helpline|Emergency Hotline|Emergency Operations Center|Disaster Operations Center|Emergency Medical|Emergency Doctor|CDRRMO|COMCEN|Rescue \/ Disaster Response|Red Cross|Ambulance|Emergency Rescue Unit Foundation|Rescue — (?:RCERT|Special Rescue Unit)$/i.test(hotline.name)
    || (!hotline.name.includes(' — ') && /Rescue$/i.test(hotline.name));
}

/** Presentation only: never deletes contacts or treats a source date as uptime. */
export function getHotlinePresentation(hotlines: readonly EmergencyHotline[]) {
  const visible = groupHotlineServices(hotlines.filter(isEssentialHotline)).map(group => {
    // Prefer the charter's direct EMS/ERS dispatch alternatives within this
    // service, while retaining other published networks and distinct services.
    const charterNumbers = ['09302434706', '09369401591', '0344323871'];
    const preferred = (hotline: EmergencyHotline) => group.name === 'Bacolod City Rescue / Disaster Response'
      && charterNumbers.includes(hotline.dialNumber) ? 0 : 1;
    const networks = new Set<string>();
    const entries = [...group.hotlines].sort((a, b) => preferred(a) - preferred(b)).filter(hotline => {
      const key = /^\d{3,6}$/.test(hotline.dialNumber) ? `${hotline.dialNumber}:${hotline.extension ?? ''}`
        : getHotlineNetworkLabel(hotline) ?? 'Mobile';
      if (networks.has(key)) return false;
      networks.add(key);
      return true;
    });
    return { name: group.name, hotlines: entries };
  });
  const visibleIds = new Set(visible.flatMap(group => group.hotlines.map(hotline => hotline.id)));
  return {
    visible,
    additional: groupHotlineServices(hotlines.filter(hotline => !visibleIds.has(hotline.id))),
  };
}
