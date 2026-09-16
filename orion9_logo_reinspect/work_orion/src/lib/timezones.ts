export interface TimezoneDefinition {
  id: string;
  label: string;
  region: string;
  city: string;
}

export interface LanguageDefinition {
  code: string;
  name: string;
  nativeName: string;
  direction: string;
}

const getBrowserTimezones = () => {
  try {
    const tzs = Intl.supportedValuesOf('timeZone');
    return tzs.map(tz => {
      let label = tz;
      let abbr = '';
      try {
        const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'long' }).formatToParts(new Date());
        const tzName = parts.find(p => p.type === 'timeZoneName')?.value;
        if (tzName) {
          label = tzName;
        }
        
        const shortParts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date());
        const shortTzName = shortParts.find(p => p.type === 'timeZoneName')?.value;
        if (shortTzName) {
          abbr = shortTzName;
        }
      } catch (e) {
        // ignore
      }
      const parts = tz.split('/');
      const region = parts[0] || 'Other';
      const city = parts.slice(1).join('/') || tz;
      
      const fullLabel = abbr ? `${label} (${abbr})` : label;
      
      return { 
        value: tz, 
        label: `${tz} — ${fullLabel}`, 
        group: region, 
        searchStr: `${tz} ${label} ${abbr}`,
        // Normalized data as requested
        id: tz,
        region,
        city
      };
    });
  } catch (e) {
    return [
      { value: 'UTC', label: 'Coordinated Universal Time (UTC)', group: 'UTC', id: 'UTC', region: 'UTC', city: 'UTC' }
    ];
  }
};

export const timezones = getBrowserTimezones();

export const locales = [
  { value: 'en-IN', label: 'en-IN — English (India)', searchStr: 'English India en-IN', code: 'en-IN', name: 'English (India)', nativeName: 'English', direction: 'ltr' },
  { value: 'en-US', label: 'en-US — English (United States)', searchStr: 'English United States en-US', code: 'en-US', name: 'English (United States)', nativeName: 'English', direction: 'ltr' },
  { value: 'en-GB', label: 'en-GB — English (United Kingdom)', searchStr: 'English United Kingdom en-GB', code: 'en-GB', name: 'English (United Kingdom)', nativeName: 'English', direction: 'ltr' },
  { value: 'fr-FR', label: 'fr-FR — French (France)', searchStr: 'French France fr-FR', code: 'fr-FR', name: 'French (France)', nativeName: 'Français', direction: 'ltr' },
  { value: 'de-DE', label: 'de-DE — German (Germany)', searchStr: 'German Germany de-DE', code: 'de-DE', name: 'German (Germany)', nativeName: 'Deutsch', direction: 'ltr' },
  { value: 'ja-JP', label: 'ja-JP — Japanese (Japan)', searchStr: 'Japanese Japan ja-JP', code: 'ja-JP', name: 'Japanese (Japan)', nativeName: '日本語', direction: 'ltr' },
  { value: 'zh-CN', label: 'zh-CN — Chinese (Simplified)', searchStr: 'Chinese Simplified zh-CN', code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', direction: 'ltr' },
];
