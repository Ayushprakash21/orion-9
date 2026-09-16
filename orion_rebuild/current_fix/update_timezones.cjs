const fs = require('fs');
let code = fs.readFileSync('src/lib/timezones.ts', 'utf8');

code = code.replace(/export const locales = \[[\s\S]*?\];/, `export const locales = [
  { value: 'en-IN', label: 'en-IN — English (India)', searchStr: 'English India en-IN', code: 'en-IN', name: 'English (India)', nativeName: 'English', direction: 'ltr' },
  { value: 'en-US', label: 'en-US — English (United States)', searchStr: 'English United States en-US', code: 'en-US', name: 'English (United States)', nativeName: 'English', direction: 'ltr' },
  { value: 'en-GB', label: 'en-GB — English (United Kingdom)', searchStr: 'English United Kingdom en-GB', code: 'en-GB', name: 'English (United Kingdom)', nativeName: 'English', direction: 'ltr' },
  { value: 'fr-FR', label: 'fr-FR — French (France)', searchStr: 'French France fr-FR', code: 'fr-FR', name: 'French (France)', nativeName: 'Français', direction: 'ltr' },
  { value: 'de-DE', label: 'de-DE — German (Germany)', searchStr: 'German Germany de-DE', code: 'de-DE', name: 'German (Germany)', nativeName: 'Deutsch', direction: 'ltr' },
  { value: 'ja-JP', label: 'ja-JP — Japanese (Japan)', searchStr: 'Japanese Japan ja-JP', code: 'ja-JP', name: 'Japanese (Japan)', nativeName: '日本語', direction: 'ltr' },
  { value: 'zh-CN', label: 'zh-CN — Chinese (Simplified)', searchStr: 'Chinese Simplified zh-CN', code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', direction: 'ltr' },
];`);

code = code.replace(/label: fullLabel,/, 'label: `${tz} — ${fullLabel}`,');

fs.writeFileSync('src/lib/timezones.ts', code);
