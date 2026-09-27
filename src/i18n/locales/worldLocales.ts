/**
 * ORION-9 WORLD LOCALES TRANSLATION DICTIONARIES
 * Comprehensive native translation dictionaries for global languages.
 */

import { TranslationSchema } from '../types';
import { en } from './en';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Helper to construct a complete TranslationSchema by merging locale overrides with the English fallback
 */
function createLocaleDict(overrides: DeepPartial<TranslationSchema>): TranslationSchema {
  const result: any = JSON.parse(JSON.stringify(en));
  for (const [sectionKey, sectionVal] of Object.entries(overrides)) {
    if (sectionVal && typeof sectionVal === 'object') {
      result[sectionKey] = {
        ...result[sectionKey],
        ...sectionVal,
      };
    }
  }
  return result as TranslationSchema;
}

export const fr = createLocaleDict({
  common: { language: 'Langue', selectLanguage: 'Sélectionner la langue', save: 'Enregistrer', cancel: 'Annuler', close: 'Fermer', search: 'Rechercher' },
  auth: {
    signInTitle: 'Se connecter à Orion',
    subtitle: 'Entrez votre identifiant pour accéder à votre espace de travail',
    userIdLabel: 'Identifiant',
    userIdPlaceholder: "Nom d'utilisateur ou e-mail",
    continueBtn: 'Continuer',
    enterPassword: 'Mot de passe',
    enterOrionBtn: 'Entrer dans Orion',
    identifying: 'Identification...',
    userNotFound: 'Utilisateur introuvable',
    invalidCredentials: 'Mot de passe incorrect',
    selectLanguage: 'Sélectionner la langue',
  },
  navigation: { settings: 'Paramètres', dashboard: 'Tableau de bord' },
  wallpaper: { title: 'Studio de papier peint' },
});

export const pt = createLocaleDict({
  common: { language: 'Idioma', selectLanguage: 'Selecionar idioma', save: 'Salvar', cancel: 'Cancelar', close: 'Fechar', search: 'Buscar' },
  auth: {
    signInTitle: 'Entrar no Orion',
    subtitle: 'Insira seu ID de usuário para acessar seu espaço de trabalho',
    userIdLabel: 'ID de usuário',
    userIdPlaceholder: 'Nome de usuário ou e-mail',
    continueBtn: 'Continuar',
    enterPassword: 'Senha',
    enterOrionBtn: 'Entrar no Orion',
    identifying: 'Identificando...',
    userNotFound: 'Usuário não encontrado',
    invalidCredentials: 'Senha incorreta',
    selectLanguage: 'Selecionar idioma',
  },
  navigation: { settings: 'Configurações', dashboard: 'Painel' },
  wallpaper: { title: 'Estúdio de papéis de parede' },
});

export const it = createLocaleDict({
  common: { language: 'Lingua', selectLanguage: 'Seleziona lingua', save: 'Salva', cancel: 'Annulla', close: 'Chiudi', search: 'Cerca' },
  auth: {
    signInTitle: 'Accedi a Orion',
    subtitle: 'Inserisci il tuo ID utente per accedere allo spazio di lavoro',
    userIdLabel: 'ID utente',
    userIdPlaceholder: 'Nome utente o email',
    continueBtn: 'Continua',
    enterPassword: 'Password',
    enterOrionBtn: 'Entra in Orion',
    identifying: 'Identificazione...',
    userNotFound: 'Utente non trovato',
    invalidCredentials: 'Password non valida',
    selectLanguage: 'Seleziona lingua',
  },
  navigation: { settings: 'Impostazioni', dashboard: 'Dashboard' },
  wallpaper: { title: 'Studio sfondi' },
});

export const zh = createLocaleDict({
  common: { language: '语言', selectLanguage: '选择语言', save: '保存', cancel: '取消', close: '关闭', search: '搜索' },
  auth: {
    signInTitle: '登录 Orion',
    subtitle: '输入您的用户 ID 以访问工作区',
    userIdLabel: '用户 ID',
    userIdPlaceholder: '用户名或邮箱',
    continueBtn: '继续',
    enterPassword: '密码',
    enterOrionBtn: '进入 Orion',
    identifying: '正在识别...',
    userNotFound: '用户未找到',
    invalidCredentials: '密码不正确',
    selectLanguage: '选择语言',
  },
  navigation: { settings: '设置', dashboard: '仪表板' },
  wallpaper: { title: '壁纸工作室' },
});

export const ja = createLocaleDict({
  common: { language: '言語', selectLanguage: '言語を選択', save: '保存', cancel: 'キャンセル', close: '閉じる', search: '検索' },
  auth: {
    signInTitle: 'Orion にサインイン',
    subtitle: 'ワークスペースにアクセスするにはユーザーIDを入力してください',
    userIdLabel: 'ユーザーID',
    userIdPlaceholder: 'ユーザー名またはメールアドレス',
    continueBtn: '次へ',
    enterPassword: 'パスワード',
    enterOrionBtn: 'Orion に入る',
    identifying: '認証中...',
    userNotFound: 'ユーザーが見つかりません',
    invalidCredentials: 'パスワードが無効です',
    selectLanguage: '言語を選択',
  },
  navigation: { settings: '設定', dashboard: 'ダッシュボード' },
  wallpaper: { title: '壁紙スタジオ' },
});

export const ko = createLocaleDict({
  common: { language: '언어', selectLanguage: '언어 선택', save: '저장', cancel: '취소', close: '닫기', search: '검색' },
  auth: {
    signInTitle: 'Orion에 로그인',
    subtitle: '작업 공간에 액세스하려면 사용자 ID를 입력하세요',
    userIdLabel: '사용자 ID',
    userIdPlaceholder: '사용자 이름 또는 이메일',
    continueBtn: '계속',
    enterPassword: '비밀번호',
    enterOrionBtn: 'Orion 시작하기',
    identifying: '확인 중...',
    userNotFound: '사용자를 찾을 수 없습니다',
    invalidCredentials: '잘못된 비밀번호입니다',
    selectLanguage: '언어 선택',
  },
  navigation: { settings: '설정', dashboard: '대시보드' },
  wallpaper: { title: '배경화면 스튜디오' },
});

export const ar = createLocaleDict({
  common: { language: 'اللغة', selectLanguage: 'اختر اللغة', save: 'حفظ', cancel: 'إلغاء', close: 'إغلاق', search: 'بحث' },
  auth: {
    signInTitle: 'تسجيل الدخول إلى Orion',
    subtitle: 'أدخل معرف المستخدم للوصول إلى مساحة العمل الخاصة بك',
    userIdLabel: 'معرف المستخدم',
    userIdPlaceholder: 'اسم المستخدم أو البريد الإلكتروني',
    continueBtn: 'متابعة',
    enterPassword: 'كلمة المرور',
    enterOrionBtn: 'دخول Orion',
    identifying: 'جارٍ التحقق...',
    userNotFound: 'المستخدم غير موجود',
    invalidCredentials: 'كلمة المرور غير صالحة',
    selectLanguage: 'اختر اللغة',
  },
  navigation: { settings: 'الإعدادات', dashboard: 'لوحة التحكم' },
  wallpaper: { title: 'استوديو الخلفيات' },
});

export const ru = createLocaleDict({
  common: { language: 'Язык', selectLanguage: 'Выбрать язык', save: 'Сохранить', cancel: 'Отмена', close: 'Закрыть', search: 'Поиск' },
  auth: {
    signInTitle: 'Войти в Orion',
    subtitle: 'Введите свой ID пользователя для доступа к рабочему пространству',
    userIdLabel: 'ID пользователя',
    userIdPlaceholder: 'Имя пользователя или email',
    continueBtn: 'Продолжить',
    enterPassword: 'Пароль',
    enterOrionBtn: 'Войти в Orion',
    identifying: 'Идентификация...',
    userNotFound: 'Пользователь не найден',
    invalidCredentials: 'Неверный пароль',
    selectLanguage: 'Выбрать язык',
  },
  navigation: { settings: 'Настройки', dashboard: 'Панель управления' },
  wallpaper: { title: 'Студия обоев' },
});

export const bn = createLocaleDict({
  common: { language: 'ভাষা', selectLanguage: 'ভাষা নির্বাচন করুন', save: 'সংরক্ষণ', cancel: 'বাতিল', close: 'বন্ধ করুন', search: 'অনুসন্ধান' },
  auth: {
    signInTitle: 'Orion-এ সাইন ইন করুন',
    subtitle: 'আপনার ওয়ার্কস্পেস অ্যাক্সেস করতে ইউজার আইডি লিখুন',
    userIdLabel: 'ইউজার আইডি',
    userIdPlaceholder: 'ব্যবহারকারীর নাম বা ইমেল',
    continueBtn: 'চালিয়ে যান',
    enterPassword: 'পাসওয়ার্ড',
    enterOrionBtn: 'Orion-এ প্রবেশ করুন',
    identifying: 'শনাক্ত করা হচ্ছে...',
    userNotFound: 'ব্যবহারকারী পাওয়া যায়নি',
    invalidCredentials: 'অবৈধ পাসওয়ার্ড',
    selectLanguage: 'ভাষা নির্বাচন করুন',
  },
  navigation: { settings: 'সেটিংস', dashboard: 'ড্যাশবোর্ড' },
  wallpaper: { title: 'ওয়ালপেপার স্টুডিও' },
});

export const mr = createLocaleDict({
  common: { language: 'भाषा', selectLanguage: 'भाषा निवडा', save: 'जतन करा', cancel: 'रद्द करा', close: 'बंद करा', search: 'शोधा' },
  auth: {
    signInTitle: 'Orion मध्ये साइन इन करा',
    subtitle: 'आपल्या वर्कस्पेसवर प्रवेश करण्यासाठी वापरकर्ता ID प्रविष्ट करा',
    userIdLabel: 'वापरकर्ता ID',
    userIdPlaceholder: 'वापरकर्ता नाव किंवा ईमेल',
    continueBtn: 'पुढे जा',
    enterPassword: 'पासवर्ड',
    enterOrionBtn: 'Orion मध्ये प्रवेश करा',
    identifying: 'ओळख पटवत आहे...',
    userNotFound: 'वापरकर्ता सापडला नाही',
    invalidCredentials: 'अवैध पासवर्ड',
    selectLanguage: 'भाषा निवडा',
  },
  navigation: { settings: 'सेटिंग्ज', dashboard: 'डॅशबोर्ड' },
  wallpaper: { title: 'वॉलपेपर स्टुडिओ' },
});

export const te = createLocaleDict({
  common: { language: 'భాష', selectLanguage: 'భాషను ఎంచుకోండి', save: 'భద్రపరచు', cancel: 'రద్దు చేయి', close: 'మూసివేయి', search: 'శోధించండి' },
  auth: {
    signInTitle: 'Orion లో సైన్ ఇన్ చేయండి',
    subtitle: 'మీ వర్క్‌స్పేస్‌ను యాక్సెస్ చేయడానికి యూజర్ IDని నమోదు చేయండి',
    userIdLabel: 'యూజర్ ID',
    userIdPlaceholder: 'వినియోగదారు పేరు లేదా ఇమెయిల్',
    continueBtn: 'కొనసాగించండి',
    enterPassword: 'పాస్‌వర్డ్',
    enterOrionBtn: 'Orion లోకి ప్రవేశించండి',
    identifying: 'గుర్తిస్తోంది...',
    userNotFound: 'వినియోగదారు కనుగొనబడలేదు',
    invalidCredentials: 'చెల్లని పాస్‌వర్డ్',
    selectLanguage: 'భాషను ఎంచుకోండి',
  },
  navigation: { settings: 'సెట్టింగ్‌లు', dashboard: 'డాష్‌బోర్డ్' },
  wallpaper: { title: 'వాల్‌పేపర్ స్టూడియో' },
});

export const ta = createLocaleDict({
  common: { language: 'மொழி', selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்', save: 'சேமி', cancel: 'ரத்து செய்', close: 'மூடு', search: 'தேடு' },
  auth: {
    signInTitle: 'Orion இல் உள்நுழையவும்',
    subtitle: 'உங்கள் பணியிடத்தை அணுக பயனர் ஐடியை உள்ளிடவும்',
    userIdLabel: 'பயனர் ID',
    userIdPlaceholder: 'பயனர் பெயர் அல்லது மின்னஞ்சல்',
    continueBtn: 'தொடரவும்',
    enterPassword: 'கடவுச்சொல்',
    enterOrionBtn: 'Orion இல் நுழையவும்',
    identifying: 'அடையாளம் காணப்படுகிறது...',
    userNotFound: 'பயனர் காணப்படவில்லை',
    invalidCredentials: 'தவறான கடவுச்சொல்',
    selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்',
  },
  navigation: { settings: 'அமைப்புகள்', dashboard: 'டாஷ்போர்டு' },
  wallpaper: { title: 'வால்பேப்பர் ஸ்டுடியோ' },
});

export const gu = createLocaleDict({
  common: { language: 'ભાષા', selectLanguage: 'ભાષા પસંદ કરો', save: 'સાચવો', cancel: 'રદ કરો', close: 'બંધ કરો', search: 'શોધો' },
  auth: {
    signInTitle: 'Orion માં સાઇન ઇન કરો',
    subtitle: 'તમારા વર્કસ્પેસને ઍક્સેસ કરવા વપરાશકર્તા ID દાખલ કરો',
    userIdLabel: 'વપરાશકર્તા ID',
    userIdPlaceholder: 'વપરાશકર્તા નામ અથવા ઇમેઇલ',
    continueBtn: 'ચાલુ રાખો',
    enterPassword: 'પાસવર્ડ',
    enterOrionBtn: 'Orion માં પ્રવેશ કરો',
    identifying: 'ઓળખ કરી રહ્યું છે...',
    userNotFound: 'વપરાશકર્તા મળ્યો નથી',
    invalidCredentials: 'અમાન્ય પાસવર્ડ',
    selectLanguage: 'ભાષા પસંદ કરો',
  },
  navigation: { settings: 'સેટિંગ્સ', dashboard: 'ડેશબોર્ડ' },
  wallpaper: { title: 'વોલપેપર સ્ટુડિયો' },
});

export const kn = createLocaleDict({
  common: { language: 'ಭಾಷೆ', selectLanguage: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ', save: 'ಉಳಿಸಿ', cancel: 'ರದ್ದುಮಾಡಿ', close: 'ಮುಚ್ಚಿ', search: 'ಹುಡುಕಿ' },
  auth: {
    signInTitle: 'Orion ಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ',
    subtitle: 'ನಿಮ್ಮ ಕಾರ್ಯಕ್ಷೇತ್ರವನ್ನು ಪ್ರವೇಶಿಸಲು ಬಳಕೆದಾರ ID ನಮೂದಿಸಿ',
    userIdLabel: 'ಬಳಕೆದಾರ ID',
    userIdPlaceholder: 'ಬಳಕೆದಾರ ಹೆಸರು ಅಥವಾ ಇಮೇಲ್',
    continueBtn: 'ಮುಂದುವರಿಸಿ',
    enterPassword: 'ಪಾಸ್‌ವರ್ಡ್',
    enterOrionBtn: 'Orion ಗೆ ಪ್ರವೇಶಿಸಿ',
    identifying: 'ಗುರುತಿಸಲಾಗುತ್ತಿದೆ...',
    userNotFound: 'ಬಳಕೆದಾರರು ಕಂಡುಬಂದಿಲ್ಲ',
    invalidCredentials: 'ಅಮಾನ್ಯ ಪಾಸ್‌ವರ್ಡ್',
    selectLanguage: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
  },
  navigation: { settings: 'ಸಂಯೋಜನೆಗಳು', dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' },
  wallpaper: { title: 'ವಾಲ್‌ಪೇಪರ್ ಸ್ಟುಡಿಯೋ' },
});

export const ml = createLocaleDict({
  common: { language: 'ഭാഷ', selectLanguage: 'ഭാഷ തിരഞ്ഞെടുക്കുക', save: 'സംരക്ഷിക്കുക', cancel: 'റദ്ദാക്കുക', close: 'അടയ്ക്കുക', search: 'തിരയുക' },
  auth: {
    signInTitle: 'Orion-ലേക്ക് സൈൻ ഇൻ ചെയ്യുക',
    subtitle: 'നിങ്ങളുടെ വർക്ക്‌സ്‌പെയ്‌സ് ആക്‌സസ് ചെയ്യാൻ ഉപയോക്തൃ ഐഡി നൽകുക',
    userIdLabel: 'ഉപയോക്തൃ ID',
    userIdPlaceholder: 'ഉപയോക്തൃനാമം അല്ലെങ്കിൽ ഇമെയിൽ',
    continueBtn: 'തുടരുക',
    enterPassword: 'പാസ്‌വേഡ്',
    enterOrionBtn: 'Orion-ലേക്ക് പ്രവേശിക്കുക',
    identifying: 'തിരിച്ചറിയുന്നു...',
    userNotFound: 'ഉപയോക്താവിനെ കണ്ടെത്തിയില്ല',
    invalidCredentials: 'അസാധുവായ പാസ്‌വേഡ്',
    selectLanguage: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
  },
  navigation: { settings: 'ക്രമീകരണങ്ങൾ', dashboard: 'ഡാഷ്‌ബോർഡ്' },
  wallpaper: { title: 'വാൾപേപ്പർ സ്റ്റുഡിയോ' },
});

export const pa = createLocaleDict({
  common: { language: 'ਭਾਸ਼ਾ', selectLanguage: 'ਭਾਸ਼ਾ ਚੁਣੋ', save: 'ਸੰਭਾਲੋ', cancel: 'ਰੱਦ ਕਰੋ', close: 'ਬੰਦ ਕਰੋ', search: 'ਖੋਜੋ' },
  auth: {
    signInTitle: 'Orion ਵਿੱਚ ਸਾਈਨ ਇਨ ਕਰੋ',
    subtitle: 'ਆਪਣੇ ਵਰਕਸਪੇਸ ਤੱਕ ਪਹੁੰਚਣ ਲਈ ਯੂਜ਼ਰ ID ਦਰਜ ਕਰੋ',
    userIdLabel: 'ਯੂਜ਼ਰ ID',
    userIdPlaceholder: 'ਵਰਤੋਂਕਾਰ ਨਾਂ ਜਾਂ ਈਮੇਲ',
    continueBtn: 'ਜਾਰੀ ਰੱਖੋ',
    enterPassword: 'ਪਾਸਵਰਡ',
    enterOrionBtn: 'Orion ਵਿੱਚ ਦਾਖਲ ਹੋਵੋ',
    identifying: 'ਪਛਾਣ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ...',
    userNotFound: 'ਵਰਤੋਂਕਾਰ ਨਹੀਂ ਲੱਭਿਆ',
    invalidCredentials: 'ਗਲਤ ਪਾਸਵਰਡ',
    selectLanguage: 'ਭਾਸ਼ਾ ਚੁਣੋ',
  },
  navigation: { settings: 'ਸੈਟਿੰਗਾਂ', dashboard: 'ਡੈਸ਼ਬੋਰਡ' },
  wallpaper: { title: 'ਵਾਲਪੇਪਰ ਸਟੂਡੀਓ' },
});

export const tr = createLocaleDict({
  common: { language: 'Dil', selectLanguage: 'Dil seçin', save: 'Kaydet', cancel: 'İptal', close: 'Kapat', search: 'Ara' },
  auth: {
    signInTitle: "Orion'da oturum açın",
    subtitle: 'Çalışma alanınıza erişmek için Kullanıcı Kimliğinizi girin',
    userIdLabel: 'Kullanıcı Kimliği',
    userIdPlaceholder: 'Kullanıcı adı veya e-posta',
    continueBtn: 'Devam Et',
    enterPassword: 'Şifre',
    enterOrionBtn: "Orion'a Gir",
    identifying: 'Kimlik doğrulanıyor...',
    userNotFound: 'Kullanıcı bulunamadı',
    invalidCredentials: 'Geçersiz şifre',
    selectLanguage: 'Dil seçin',
  },
  navigation: { settings: 'Ayarlar', dashboard: 'Panel' },
  wallpaper: { title: 'Duvar Kağıdı Stüdyosu' },
});

export const nl = createLocaleDict({
  common: { language: 'Taal', selectLanguage: 'Selecteer taal', save: 'Opslaan', cancel: 'Annuleren', close: 'Sluiten', search: 'Zoeken' },
  auth: {
    signInTitle: 'Aanmelden bij Orion',
    subtitle: 'Voer uw gebruikers-ID in om toegang te krijgen tot uw werkruimte',
    userIdLabel: 'Gebruikers-ID',
    userIdPlaceholder: 'Gebruikersnaam of e-mail',
    continueBtn: 'Doorgaan',
    enterPassword: 'Wachtwoord',
    enterOrionBtn: 'Orion openen',
    identifying: 'Identificeren...',
    userNotFound: 'Gebruiker niet gevonden',
    invalidCredentials: 'Ongeldig wachtwoord',
    selectLanguage: 'Selecteer taal',
  },
  navigation: { settings: 'Instellingen', dashboard: 'Dashboard' },
  wallpaper: { title: 'Achtergrond Studio' },
});

export const pl = createLocaleDict({
  common: { language: 'Język', selectLanguage: 'Wybierz język', save: 'Zapisz', cancel: 'Anuluj', close: 'Zamknij', search: 'Szukaj' },
  auth: {
    signInTitle: 'Zaloguj się do Orion',
    subtitle: 'Wprowadź identyfikator użytkownika, aby uzyskać dostęp do obszaru roboczego',
    userIdLabel: 'Identyfikator',
    userIdPlaceholder: 'Nazwa użytkownika lub e-mail',
    continueBtn: 'Dalej',
    enterPassword: 'Hasło',
    enterOrionBtn: 'Wejdź do Orion',
    identifying: 'Identyfikacja...',
    userNotFound: 'Nie znaleziono użytkownika',
    invalidCredentials: 'Nieprawidłowe hasło',
    selectLanguage: 'Wybierz język',
  },
  navigation: { settings: 'Ustawienia', dashboard: 'Pulpit' },
  wallpaper: { title: 'Studio tapet' },
});

export const uk = createLocaleDict({
  common: { language: 'Мова', selectLanguage: 'Вибрати мову', save: 'Зберегти', cancel: 'Скасувати', close: 'Закрити', search: 'Пошук' },
  auth: {
    signInTitle: 'Увійти в Orion',
    subtitle: 'Введіть свій ID користувача для доступу до робочого простору',
    userIdLabel: 'ID користувача',
    userIdPlaceholder: 'Ім’я користувача або email',
    continueBtn: 'Продовжити',
    enterPassword: 'Пароль',
    enterOrionBtn: 'Увійти в Orion',
    identifying: 'Ідентифікація...',
    userNotFound: 'Користувача не знайдено',
    invalidCredentials: 'Невірний пароль',
    selectLanguage: 'Вибрати мову',
  },
  navigation: { settings: 'Налаштування', dashboard: 'Панель' },
  wallpaper: { title: 'Студія шпалер' },
});

export const vi = createLocaleDict({
  common: { language: 'Ngôn ngữ', selectLanguage: 'Chọn ngôn ngữ', save: 'Lưu', cancel: 'Hủy', close: 'Đóng', search: 'Tìm kiếm' },
  auth: {
    signInTitle: 'Đăng nhập vào Orion',
    subtitle: 'Nhập ID người dùng của bạn để truy cập không gian làm việc',
    userIdLabel: 'ID người dùng',
    userIdPlaceholder: 'Tên người dùng hoặc email',
    continueBtn: 'Tiếp tục',
    enterPassword: 'Mật khẩu',
    enterOrionBtn: 'Vào Orion',
    identifying: 'Đang xác định...',
    userNotFound: 'Không tìm thấy người dùng',
    invalidCredentials: 'Mật khẩu không hợp lệ',
    selectLanguage: 'Chọn ngôn ngữ',
  },
  navigation: { settings: 'Cài đặt', dashboard: 'Bảng điều khiển' },
  wallpaper: { title: 'Studio hình nền' },
});

export const th = createLocaleDict({
  common: { language: 'ภาษา', selectLanguage: 'เลือกภาษา', save: 'บันทึก', cancel: 'ยกเลิก', close: 'ปิด', search: 'ค้นหา' },
  auth: {
    signInTitle: 'เข้าสู่ระบบ Orion',
    subtitle: 'ป้อนรหัสผู้ใช้ของคุณเพื่อเข้าถึงพื้นที่ทำงาน',
    userIdLabel: 'รหัสผู้ใช้',
    userIdPlaceholder: 'ชื่อผู้ใช้หรืออีเมล',
    continueBtn: 'ดำเนินการต่อ',
    enterPassword: 'รหัสผ่าน',
    enterOrionBtn: 'เข้าสู่ Orion',
    identifying: 'กำลังระบุตัวตน...',
    userNotFound: 'ไม่พบผู้ใช้',
    invalidCredentials: 'รหัสผ่านไม่ถูกต้อง',
    selectLanguage: 'เลือกภาษา',
  },
  navigation: { settings: 'การตั้งค่า', dashboard: 'แดชบอร์ด' },
  wallpaper: { title: 'สตูดิโอวอลเปเปอร์' },
});

export const id = createLocaleDict({
  common: { language: 'Bahasa', selectLanguage: 'Pilih bahasa', save: 'Simpan', cancel: 'Batal', close: 'Tutup', search: 'Cari' },
  auth: {
    signInTitle: 'Masuk ke Orion',
    subtitle: 'Masukkan ID Pengguna Anda untuk mengakses ruang kerja',
    userIdLabel: 'ID Pengguna',
    userIdPlaceholder: 'Nama pengguna atau email',
    continueBtn: 'Lanjutkan',
    enterPassword: 'Kata Sandi',
    enterOrionBtn: 'Masuk Orion',
    identifying: 'Mengidentifikasi...',
    userNotFound: 'Pengguna tidak ditemukan',
    invalidCredentials: 'Kata sandi salah',
    selectLanguage: 'Pilih bahasa',
  },
  navigation: { settings: 'Pengaturan', dashboard: 'Dasbor' },
  wallpaper: { title: 'Studio Wallpaper' },
});

export const he = createLocaleDict({
  common: { language: 'שפה', selectLanguage: 'בחר שפה', save: 'שמור', cancel: 'ביטול', close: 'סגור', search: 'חיפוש' },
  auth: {
    signInTitle: 'התחבר אל Orion',
    subtitle: 'הזן את מזהה המשתמש שלך כדי לגשת לסביבת העבודה',
    userIdLabel: 'מזהה משתמש',
    userIdPlaceholder: 'שם משתמש או אימייל',
    continueBtn: 'המשך',
    enterPassword: 'סיסמה',
    enterOrionBtn: 'כניסה אל Orion',
    identifying: 'מזהה...',
    userNotFound: 'משתמש לא נמצא',
    invalidCredentials: 'סיסמה שגויה',
    selectLanguage: 'בחר שפה',
  },
  navigation: { settings: 'הגדרות', dashboard: 'לוח בקרה' },
  wallpaper: { title: 'סטודיו רקעים' },
});

export const fa = createLocaleDict({
  common: { language: 'زبان', selectLanguage: 'انتخاب زبان', save: 'ذخیره', cancel: 'لغو', close: 'بستن', search: 'جستجو' },
  auth: {
    signInTitle: 'ورود به Orion',
    subtitle: 'شناسه کاربری خود را برای دسترسی به فضای کاری وارد کنید',
    userIdLabel: 'شناسه کاربر',
    userIdPlaceholder: 'نام کاربری یا ایمیل',
    continueBtn: 'ادامه',
    enterPassword: 'رمز عبور',
    enterOrionBtn: 'ورود به اوریون',
    identifying: 'در حال شناسایی...',
    userNotFound: 'کاربر یافت نشد',
    invalidCredentials: 'رمز عبور نامعتبر',
    selectLanguage: 'انتخاب زبان',
  },
  navigation: { settings: 'تنظیمات', dashboard: 'داشبورد' },
  wallpaper: { title: 'استودیو تصویر زمینه' },
});

export const ur = createLocaleDict({
  common: { language: 'زبان', selectLanguage: 'زبان منتخب کریں', save: 'محفوظ کریں', cancel: 'منسوخ', close: 'بند کریں', search: 'تلاش کریں' },
  auth: {
    signInTitle: 'Orion میں سائن ان کریں',
    subtitle: 'اپنے ورک اسپیس تک رسائی کے لیے صارف ID درج کریں',
    userIdLabel: 'صارف ID',
    userIdPlaceholder: 'صارف کا نام یا ای میل',
    continueBtn: 'جاری رکھیں',
    enterPassword: 'پاس ورڈ',
    enterOrionBtn: 'اورین میں داخل ہوں',
    identifying: 'شناخت ہو رہی ہے...',
    userNotFound: 'صارف نہیں ملا',
    invalidCredentials: 'غلط پاس ورڈ',
    selectLanguage: 'زبان منتخب کریں',
  },
  navigation: { settings: 'ترتیبات', dashboard: 'ڈیش بورڈ' },
  wallpaper: { title: 'وال پیپر اسٹوڈیو' },
});

export const WORLD_TRANSLATIONS: Record<string, TranslationSchema> = {
  fr,
  pt,
  it,
  zh,
  ja,
  ko,
  ar,
  ru,
  bn,
  mr,
  te,
  ta,
  gu,
  kn,
  ml,
  pa,
  tr,
  nl,
  pl,
  uk,
  vi,
  th,
  id,
  he,
  fa,
  ur,
};
