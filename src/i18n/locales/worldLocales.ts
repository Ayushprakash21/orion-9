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
  common: { language: 'Langue', selectLanguage: 'Sélectionner la langue', save: 'Enregistrer', cancel: 'Annuler', close: 'Fermer', search: 'Rechercher', home: 'Accueil', apps: 'Applications', control: 'Contrôle', ai: 'IA', alerts: 'Alertes', more: 'Plus' },
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
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',
  },
  navigation: { home: 'Accueil', apps: 'Applications', control: 'Contrôle', ai: 'IA', alerts: 'Alertes', more: 'Plus', settings: 'Paramètres', dashboard: 'Tableau de bord' },
  wallpaper: { title: 'Studio de papier peint' },
});

export const pt = createLocaleDict({
  common: { language: 'Idioma', selectLanguage: 'Selecionar idioma', save: 'Salvar', cancel: 'Cancelar', close: 'Fechar', search: 'Buscar', home: 'Início', apps: 'Aplicativos', control: 'Controle', ai: 'IA', alerts: 'Alertas', more: 'Mais' },
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
    showPassword: 'Mostrar senha',
    hidePassword: 'Ocultar senha',
  },
  navigation: { home: 'Início', apps: 'Aplicativos', control: 'Controle', ai: 'IA', alerts: 'Alertas', more: 'Mais', settings: 'Configurações', dashboard: 'Painel' },
  wallpaper: { title: 'Estúdio de papéis de parede' },
});

export const it = createLocaleDict({
  common: { language: 'Lingua', selectLanguage: 'Seleziona lingua', save: 'Salva', cancel: 'Annulla', close: 'Chiudi', search: 'Cerca', home: 'Home', apps: 'Applicazioni', control: 'Controllo', ai: 'IA', alerts: 'Avvisi', more: 'Altro' },
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
    showPassword: 'Mostra password',
    hidePassword: 'Nascondi password',
  },
  navigation: { home: 'Home', apps: 'Applicazioni', control: 'Controllo', ai: 'IA', alerts: 'Avvisi', more: 'Altro', settings: 'Impostazioni', dashboard: 'Dashboard' },
  wallpaper: { title: 'Studio sfondi' },
});

export const zh = createLocaleDict({
  common: { language: '语言', selectLanguage: '选择语言', save: '保存', cancel: '取消', close: '关闭', search: '搜索', home: '首页', apps: '应用', control: '控制', ai: 'AI', alerts: '警报', more: '更多' },
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
    showPassword: '显示密码',
    hidePassword: '隐藏密码',
  },
  navigation: { home: '首页', apps: '应用', control: '控制', ai: 'AI', alerts: '警报', more: '更多', settings: '设置', dashboard: '仪表板' },
  wallpaper: { title: '壁纸工作室' },
});

export const ja = createLocaleDict({
  common: { language: '言語', selectLanguage: '言語を選択', save: '保存', cancel: 'キャンセル', close: '閉じる', search: '検索', home: 'ホーム', apps: 'アプリ', control: 'コントロール', ai: 'AI', alerts: 'アラート', more: 'その他' },
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
    showPassword: 'パスワードを表示',
    hidePassword: 'パスワードを隠す',
  },
  navigation: { home: 'ホーム', apps: 'アプリ', control: 'コントロール', ai: 'AI', alerts: 'アラート', more: 'その他', settings: '設定', dashboard: 'ダッシュボード' },
  wallpaper: { title: '壁紙スタジオ' },
});

export const ko = createLocaleDict({
  common: { language: '언어', selectLanguage: '언어 선택', save: '저장', cancel: '취소', close: '닫기', search: '검색', home: '홈', apps: '앱', control: '제어', ai: 'AI', alerts: '알림', more: '더보기' },
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
    showPassword: '비밀번호 표시',
    hidePassword: '비밀번호 숨기기',
  },
  navigation: { home: '홈', apps: '앱', control: '제어', ai: 'AI', alerts: '알림', more: '더보기', settings: '설정', dashboard: '대시보드' },
  wallpaper: { title: '배경화면 스튜디오' },
});

export const ar = createLocaleDict({
  common: { language: 'اللغة', selectLanguage: 'اختر اللغة', save: 'حفظ', cancel: 'إلغاء', close: 'إغلاق', search: 'بحث', home: 'الرئيسية', apps: 'التطبيقات', control: 'التحكم', ai: 'الذكاء الاصطناعي', alerts: 'التنبيهات', more: 'المزيد' },
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
    showPassword: 'إظهار كلمة المرور',
    hidePassword: 'إخفاء كلمة المرور',
  },
  navigation: { home: 'الرئيسية', apps: 'التطبيقات', control: 'التحكم', ai: 'الذكاء الاصطناعي', alerts: 'التنبيهات', more: 'المزيد', settings: 'الإعدادات', dashboard: 'لوحة التحكم' },
  wallpaper: { title: 'استوديو الخلفيات' },
});

export const ru = createLocaleDict({
  common: { language: 'Язык', selectLanguage: 'Выбрать язык', save: 'Сохранить', cancel: 'Отмена', close: 'Закрыть', search: 'Поиск', home: 'Главная', apps: 'Приложения', control: 'Управление', ai: 'ИИ', alerts: 'Оповещения', more: 'Еще' },
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
    showPassword: 'Показать пароль',
    hidePassword: 'Скрыть пароль',
  },
  navigation: { home: 'Главная', apps: 'Приложения', control: 'Управление', ai: 'ИИ', alerts: 'Оповещения', more: 'Еще', settings: 'Настройки', dashboard: 'Панель управления' },
  wallpaper: { title: 'Студия обоев' },
});

export const bn = createLocaleDict({
  common: { language: 'ভাষা', selectLanguage: 'ভাষা নির্বাচন করুন', save: 'সংরক্ষণ', cancel: 'বাতিল', close: 'বন্ধ করুন', search: 'অনুসন্ধান', home: 'হোম', apps: 'অ্যাপস', control: 'নিয়ন্ত্রণ', ai: 'এআই', alerts: 'সতর্কতা', more: 'আরও' },
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
    showPassword: 'পাসওয়ার্ড দেখান',
    hidePassword: 'পাসওয়ার্ড লুকান',
  },
  navigation: { home: 'হোম', apps: 'অ্যাপস', control: 'নিয়ন্ত্রণ', ai: 'এআই', alerts: 'সতর্কতা', more: 'আরও', settings: 'সেটিংস', dashboard: 'ড্যাশবোর্ড' },
  wallpaper: { title: 'ওয়ালপেপার স্টুডিও' },
});

export const mr = createLocaleDict({
  common: { language: 'भाषा', selectLanguage: 'भाषा निवडा', save: 'जतन करा', cancel: 'रद्द करा', close: 'बंद करा', search: 'शोधा', home: 'मुख्यपृष्ठ', apps: 'अ‍ॅप्स', control: 'नियंत्रण', ai: 'एआय', alerts: 'सूचना', more: 'अधिक' },
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
    showPassword: 'पासवर्ड दाखवा',
    hidePassword: 'पासवर्ड लपवा',
  },
  navigation: { home: 'मुख्यपृष्ठ', apps: 'अ‍ॅप्स', control: 'नियंत्रण', ai: 'एआय', alerts: 'सूचना', more: 'अधिक', settings: 'सेटिंग्ज', dashboard: 'डॅशबोर्ड' },
  wallpaper: { title: 'वॉलपेपर स्टुडिओ' },
});

export const te = createLocaleDict({
  common: { language: 'భాష', selectLanguage: 'భాషను ఎంచుకోండి', save: 'భద్రపరచు', cancel: 'రద్దు చేయి', close: 'మూసివేయి', search: 'శోధించండి', home: 'హోమ్', apps: 'యాప్‌లు', control: 'నియంత్రణ', ai: 'AI', alerts: 'హెచ్చరికలు', more: 'మరిన్ని' },
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
    showPassword: 'పాస్‌వర్డ్ చూపించు',
    hidePassword: 'పాస్‌వర్డ్ దాచు',
  },
  navigation: { home: 'హోమ్', apps: 'యాప్‌లు', control: 'నియంత్రణ', ai: 'AI', alerts: 'హెచ్చరికలు', more: 'మరిన్ని', settings: 'సెట్టింగ్‌లు', dashboard: 'డాష్‌బోర్డ్' },
  wallpaper: { title: 'వాల్‌పేపర్ స్టూడియో' },
});

export const ta = createLocaleDict({
  common: { language: 'மொழி', selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்', save: 'சேமி', cancel: 'ரத்து செய்', close: 'மூடு', search: 'தேடு', home: 'முகப்பு', apps: 'செயலிகள்', control: 'கட்டுப்பாடு', ai: 'AI', alerts: 'எச்சரிக்கைகள்', more: 'மேலும்' },
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
    showPassword: 'கடவுச்சொல்லைக் காட்டு',
    hidePassword: 'கடவுச்சொல்லை மறை',
  },
  navigation: { home: 'முகப்பு', apps: 'செயலிகள்', control: 'கட்டுப்பாடு', ai: 'AI', alerts: 'எச்சரிக்கைகள்', more: 'மேலும்', settings: 'அமைப்புகள்', dashboard: 'டாஷ்போர்டு' },
  wallpaper: { title: 'வால்பேப்பர் ஸ்டுடியோ' },
});

export const gu = createLocaleDict({
  common: { language: 'ભાષા', selectLanguage: 'ભાષા પસંદ કરો', save: 'સાચવો', cancel: 'રદ કરો', close: 'બંધ કરો', search: 'શોધો', home: 'હોમ', apps: 'એપ્લિકેશન્સ', control: 'નિયંત્રણ', ai: 'AI', alerts: 'ચેતવણીઓ', more: 'વધુ' },
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
    showPassword: 'પાસવર્ડ બતાવો',
    hidePassword: 'પાસવર્ડ છુપાવો',
  },
  navigation: { home: 'હોમ', apps: 'એપ્લિકેશન્સ', control: 'નિયંત્રણ', ai: 'AI', alerts: 'ચેતવણીઓ', more: 'વધુ', settings: 'સેટિંગ્સ', dashboard: 'ડેશબોર્ડ' },
  wallpaper: { title: 'વોલપેપર સ્ટુડિયો' },
});

export const kn = createLocaleDict({
  common: { language: 'ಭಾಷೆ', selectLanguage: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ', save: 'ಉಳಿಸಿ', cancel: 'ರದ್ದುಮಾಡಿ', close: 'ಮುಚ್ಚಿ', search: 'ಹುಡುಕಿ', home: 'ಮುಖಪುಟ', apps: 'ಅಪ್ಲಿಕೇಶನ್‌ಗಳು', control: 'ನಿಯಂತ್ರಣ', ai: 'AI', alerts: 'ಎಚ್ಚರಿಕೆಗಳು', more: 'ಇನ್ನಷ್ಟು' },
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
    showPassword: 'ಪಾಸ್‌ವರ್ಡ್ ತೋರಿಸಿ',
    hidePassword: 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆಮಾಡಿ',
  },
  navigation: { home: 'ಮುಖಪುಟ', apps: 'ಅಪ್ಲಿಕೇಶನ್‌ಗಳು', control: 'ನಿಯಂತ್ರಣ', ai: 'AI', alerts: 'ಎಚ್ಚರಿಕೆಗಳು', more: 'ಇನ್ನಷ್ಟು', settings: 'ಸಂಯೋಜನೆಗಳು', dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' },
  wallpaper: { title: 'ವಾಲ್‌ಪೇಪರ್ ಸ್ಟುಡಿಯೋ' },
});

export const ml = createLocaleDict({
  common: { language: 'ഭാഷ', selectLanguage: 'ഭാഷ തിരഞ്ഞെടുക്കുക', save: 'സംരക്ഷിക്കുക', cancel: 'റദ്ദാക്കുക', close: 'അടയ്ക്കുക', search: 'തിരയുക', home: 'ഹോം', apps: 'ആപ്പുകൾ', control: 'നിയന്ത്രണം', ai: 'AI', alerts: 'അലേർട്ടുകൾ', more: 'കൂടുതൽ' },
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
    showPassword: 'പാസ്‌വേഡ് കാണിക്കുക',
    hidePassword: 'പാസ്‌വേഡ് മറയ്ക്കുക',
  },
  navigation: { home: 'ഹോം', apps: 'ആപ്പുകൾ', control: 'നിയന്ത്രണം', ai: 'AI', alerts: 'അലേർട്ടുകൾ', more: 'കൂടുതൽ', settings: 'ക്രമീകരണങ്ങൾ', dashboard: 'ഡാഷ്‌ബോർഡ്' },
  wallpaper: { title: 'വാൾപേപ്പർ സ്റ്റുഡിയോ' },
});

export const pa = createLocaleDict({
  common: { language: 'ਭਾਸ਼ਾ', selectLanguage: 'ਭਾਸ਼ਾ ਚੁਣੋ', save: 'ਸੰਭਾਲੋ', cancel: 'ਰੱਦ ਕਰੋ', close: 'ਬੰਦ ਕਰੋ', search: 'ਖੋਜੋ', home: 'ਹੋਮ', apps: 'ਐਪਾਂ', control: 'ਨਿਯੰਤਰਣ', ai: 'AI', alerts: 'ਚੇਤਾਵਨੀਆਂ', more: 'ਹੋਰ' },
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
    showPassword: 'ਪਾਸਵਰਡ ਦਿਖਾਓ',
    hidePassword: 'ਪਾਸਵਰਡ ਲੁਕਾਓ',
  },
  navigation: { home: 'ਹੋਮ', apps: 'ਐਪਾਂ', control: 'ਨਿਯੰਤਰਣ', ai: 'AI', alerts: 'ਚੇਤਾਵਨੀਆਂ', more: 'ਹੋਰ', settings: 'ਸੈਟਿੰਗਾਂ', dashboard: 'ਡੈਸ਼ਬੋਰਡ' },
  wallpaper: { title: 'ਵਾਲਪੇਪਰ ਸਟੂਡੀਓ' },
});

export const tr = createLocaleDict({
  common: { language: 'Dil', selectLanguage: 'Dil seçin', save: 'Kaydet', cancel: 'İptal', close: 'Kapat', search: 'Ara', home: 'Ana Sayfa', apps: 'Uygulamalar', control: 'Kontrol', ai: 'YZ', alerts: 'Uyarılar', more: 'Daha Fazla' },
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
    showPassword: 'Şifreyi göster',
    hidePassword: 'Şifreyi gizle',
  },
  navigation: { home: 'Ana Sayfa', apps: 'Uygulamalar', control: 'Kontrol', ai: 'YZ', alerts: 'Uyarılar', more: 'Daha Fazla', settings: 'Ayarlar', dashboard: 'Panel' },
  wallpaper: { title: 'Duvar Kağıdı Stüdyosu' },
});

export const nl = createLocaleDict({
  common: { language: 'Taal', selectLanguage: 'Selecteer taal', save: 'Opslaan', cancel: 'Annuleren', close: 'Sluiten', search: 'Zoeken', home: 'Home', apps: 'Apps', control: 'Bediening', ai: 'AI', alerts: 'Meldingen', more: 'Meer' },
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
    showPassword: 'Wachtwoord tonen',
    hidePassword: 'Wachtwoord verbergen',
  },
  navigation: { home: 'Home', apps: 'Apps', control: 'Bediening', ai: 'AI', alerts: 'Meldingen', more: 'Meer', settings: 'Instellingen', dashboard: 'Dashboard' },
  wallpaper: { title: 'Achtergrond Studio' },
});

export const pl = createLocaleDict({
  common: { language: 'Język', selectLanguage: 'Wybierz język', save: 'Zapisz', cancel: 'Anuluj', close: 'Zamknij', search: 'Szukaj', home: 'Start', apps: 'Aplikacje', control: 'Sterowanie', ai: 'AI', alerts: 'Alerty', more: 'Więcej' },
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
    showPassword: 'Pokaż hasło',
    hidePassword: 'Ukryj hasło',
  },
  navigation: { home: 'Start', apps: 'Aplikacje', control: 'Sterowanie', ai: 'AI', alerts: 'Alerty', more: 'Więcej', settings: 'Ustawienia', dashboard: 'Pulpit' },
  wallpaper: { title: 'Studio tapet' },
});

export const uk = createLocaleDict({
  common: { language: 'Мова', selectLanguage: 'Вибрати мову', save: 'Зберегти', cancel: 'Скасувати', close: 'Закрити', search: 'Пошук', home: 'Головна', apps: 'Програми', control: 'Керування', ai: 'ШІ', alerts: 'Сповіщення', more: 'Більше' },
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
    showPassword: 'Показати пароль',
    hidePassword: 'Приховати пароль',
  },
  navigation: { home: 'Головна', apps: 'Програми', control: 'Керування', ai: 'ШІ', alerts: 'Сповіщення', more: 'Більше', settings: 'Налаштування', dashboard: 'Панель' },
  wallpaper: { title: 'Студія шпалер' },
});

export const vi = createLocaleDict({
  common: { language: 'Ngôn ngữ', selectLanguage: 'Chọn ngôn ngữ', save: 'Lưu', cancel: 'Hủy', close: 'Đóng', search: 'Tìm kiếm', home: 'Trang chủ', apps: 'Ứng dụng', control: 'Điều khiển', ai: 'AI', alerts: 'Cảnh báo', more: 'Thêm' },
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
    showPassword: 'Hiển thị mật khẩu',
    hidePassword: 'Ẩn mật khẩu',
  },
  navigation: { home: 'Trang chủ', apps: 'Ứng dụng', control: 'Điều khiển', ai: 'AI', alerts: 'Cảnh báo', more: 'Thêm', settings: 'Cài đặt', dashboard: 'Bảng điều khiển' },
  wallpaper: { title: 'Studio hình nền' },
});

export const th = createLocaleDict({
  common: { language: 'ภาษา', selectLanguage: 'เลือกภาษา', save: 'บันทึก', cancel: 'ยกเลิก', close: 'ปิด', search: 'ค้นหา', home: 'หน้าแรก', apps: 'แอปพลิเคชัน', control: 'การควบคุม', ai: 'AI', alerts: 'การแจ้งเตือน', more: 'เพิ่มเติม' },
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
    showPassword: 'แสดงรหัสผ่าน',
    hidePassword: 'ซ่อนรหัสผ่าน',
  },
  navigation: { home: 'หน้าแรก', apps: 'แอปพลิเคชัน', control: 'การควบคุม', ai: 'AI', alerts: 'การแจ้งเตือน', more: 'เพิ่มเติม', settings: 'การตั้งค่า', dashboard: 'แดชบอร์ด' },
  wallpaper: { title: 'สตูดิโอวอลเปเปอร์' },
});

export const id = createLocaleDict({
  common: { language: 'Bahasa', selectLanguage: 'Pilih bahasa', save: 'Simpan', cancel: 'Batal', close: 'Tutup', search: 'Cari', home: 'Beranda', apps: 'Aplikasi', control: 'Kontrol', ai: 'AI', alerts: 'Peringatan', more: 'Lainnya' },
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
    showPassword: 'Tampilkan kata sandi',
    hidePassword: 'Sembunyikan kata sandi',
  },
  navigation: { home: 'Beranda', apps: 'Aplikasi', control: 'Kontrol', ai: 'AI', alerts: 'Peringatan', more: 'Lainnya', settings: 'Pengaturan', dashboard: 'Dasbor' },
  wallpaper: { title: 'Studio Wallpaper' },
});

export const he = createLocaleDict({
  common: { language: 'שפה', selectLanguage: 'בחר שפה', save: 'שמור', cancel: 'ביטול', close: 'סגור', search: 'חיפוש', home: 'בית', apps: 'יישומים', control: 'בקרה', ai: 'בינה מלאכותית', alerts: 'התראות', more: 'עוד' },
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
    showPassword: 'הצג סיסמה',
    hidePassword: 'הסתר סיסמה',
  },
  navigation: { home: 'בית', apps: 'יישומים', control: 'בקרה', ai: 'בינה מלאכותית', alerts: 'התראות', more: 'עוד', settings: 'הגדרות', dashboard: 'לוח בקרה' },
  wallpaper: { title: 'סטודיו רקעים' },
});

export const fa = createLocaleDict({
  common: { language: 'زبان', selectLanguage: 'انتخاب زبان', save: 'ذخیره', cancel: 'لغو', close: 'بستن', search: 'جستجو', home: 'خانه', apps: 'برنامه‌ها', control: 'کنترل', ai: 'هوش مصنوعی', alerts: 'هشدارها', more: 'بیشتر' },
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
    showPassword: 'نمایش رمز عبور',
    hidePassword: 'پنهان کردن رمز عبور',
  },
  navigation: { home: 'خانه', apps: 'برنامه‌ها', control: 'کنترل', ai: 'هوش مصنوعی', alerts: 'هشدارها', more: 'بیشتر', settings: 'تنظیمات', dashboard: 'داشبورد' },
  wallpaper: { title: 'استودیو تصویر زمینه' },
});

export const ur = createLocaleDict({
  common: { language: 'زبان', selectLanguage: 'زبان منتخب کریں', save: 'محفوظ کریں', cancel: 'منسوخ', close: 'بند کریں', search: 'تلاش کریں', home: 'ہوم', apps: 'ایپس', control: 'کنٹرول', ai: 'اے آئی', alerts: 'انتباہات', more: 'مزید' },
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
    showPassword: 'پاس ورڈ دکھائیں',
    hidePassword: 'پاس ورڈ چھپائیں',
  },
  navigation: { home: 'ہوم', apps: 'ایپس', control: 'کنٹرول', ai: 'اے آئی', alerts: 'انتباہات', more: 'مزید', settings: 'ترتیبات', dashboard: 'ڈیش بورڈ' },
  wallpaper: { title: 'وال پیپر اسٹوڈیو' },
});

export const sv = createLocaleDict({
  common: { language: 'Svenska', selectLanguage: 'Välj språk', save: 'Spara', cancel: 'Avbryt', close: 'Stäng', search: 'Sök', home: 'Hem', apps: 'Appar', control: 'Kontroll', ai: 'AI', alerts: 'Varningar', more: 'Mer' },
  auth: {
    signInTitle: 'Logga in på Orion',
    subtitle: 'Ange ditt användar-ID för att komma åt din arbetsyta',
    userIdLabel: 'Användar-ID',
    userIdPlaceholder: 'Användarnamn eller e-post',
    continueBtn: 'Fortsätt',
    enterPassword: 'Lösenord',
    enterOrionBtn: 'Öppna Orion',
    identifying: 'Identifierar...',
    userNotFound: 'Användaren hittades inte',
    invalidCredentials: 'Felaktigt lösenord',
    selectLanguage: 'Välj språk',
    showPassword: 'Visa lösenord',
    hidePassword: 'Dölj lösenord',
  },
  navigation: { home: 'Hem', apps: 'Appar', control: 'Kontroll', ai: 'AI', alerts: 'Varningar', more: 'Mer', settings: 'Inställningar', dashboard: 'Översikt' },
  wallpaper: { title: 'Bakgrundsstudio' },
});

export const no = createLocaleDict({
  common: { language: 'Norsk', selectLanguage: 'Velg språk', save: 'Lagre', cancel: 'Avbryt', close: 'Lukk', search: 'Søk', home: 'Hjem', apps: 'Apper', control: 'Kontroll', ai: 'AI', alerts: 'Varsler', more: 'Mer' },
  auth: {
    signInTitle: 'Logg inn på Orion',
    subtitle: 'Skriv inn bruker-ID for å få tilgang til arbeidsområdet',
    userIdLabel: 'Bruker-ID',
    userIdPlaceholder: 'Brukernavn eller e-post',
    continueBtn: 'Fortsett',
    enterPassword: 'Passord',
    enterOrionBtn: 'Gå inn i Orion',
    identifying: 'Identifiserer...',
    userNotFound: 'Bruker ikke funnet',
    invalidCredentials: 'Ugyldig passord',
    selectLanguage: 'Velg språk',
    showPassword: 'Vis passord',
    hidePassword: 'Skjul passord',
  },
  navigation: { home: 'Hjem', apps: 'Apper', control: 'Kontroll', ai: 'AI', alerts: 'Varsler', more: 'Mer', settings: 'Innstillinger', dashboard: 'Dashbord' },
  wallpaper: { title: 'Bakgrunnsstudio' },
});

export const da = createLocaleDict({
  common: { language: 'Dansk', selectLanguage: 'Vælg sprog', save: 'Gem', cancel: 'Annuller', close: 'Luk', search: 'Søg', home: 'Hjem', apps: 'Apps', control: 'Styring', ai: 'AI', alerts: 'Advarsler', more: 'Mere' },
  auth: {
    signInTitle: 'Log ind på Orion',
    subtitle: 'Indtast dit bruger-ID for at få adgang til dit arbejdsområde',
    userIdLabel: 'Bruger-ID',
    userIdPlaceholder: 'Brugernavn eller e-mail',
    continueBtn: 'Fortsæt',
    enterPassword: 'Adgangskode',
    enterOrionBtn: 'Gå til Orion',
    identifying: 'Identificerer...',
    userNotFound: 'Bruger ikke fundet',
    invalidCredentials: 'Forkert adgangskode',
    selectLanguage: 'Vælg sprog',
    showPassword: 'Vis adgangskode',
    hidePassword: 'Skjul adgangskode',
  },
  navigation: { home: 'Hjem', apps: 'Apps', control: 'Styring', ai: 'AI', alerts: 'Advarsler', more: 'Mere', settings: 'Indstillinger', dashboard: 'Kontrolpanel' },
  wallpaper: { title: 'Baggrundsstudie' },
});

export const fi = createLocaleDict({
  common: { language: 'Suomi', selectLanguage: 'Valitse kieli', save: 'Tallenna', cancel: 'Peruuta', close: 'Sulje', search: 'Hae', home: 'Koti', apps: 'Sovellukset', control: 'Ohjaus', ai: 'Tekoäly', alerts: 'Ilmoitukset', more: 'Lisää' },
  auth: {
    signInTitle: 'Kirjaudu Orioniin',
    subtitle: 'Syötä käyttäjätunnuksesi päästäksesi työtilaasi',
    userIdLabel: 'Käyttäjätunnus',
    userIdPlaceholder: 'Käyttäjänimi tai sähköposti',
    continueBtn: 'Jatka',
    enterPassword: 'Salasana',
    enterOrionBtn: 'Avaa Orion',
    identifying: 'Tunnistetaan...',
    userNotFound: 'Käyttäjää ei löydy',
    invalidCredentials: 'Virheellinen salasana',
    selectLanguage: 'Valitse kieli',
    showPassword: 'Näytä salasana',
    hidePassword: 'Piilota salasana',
  },
  navigation: { home: 'Koti', apps: 'Sovellukset', control: 'Ohjaus', ai: 'Tekoäly', alerts: 'Ilmoitukset', more: 'Lisää', settings: 'Asetukset', dashboard: 'Kojelauta' },
  wallpaper: { title: 'Taustakuvastudio' },
});

export const el = createLocaleDict({
  common: { language: 'Ελληνικά', selectLanguage: 'Επιλέξτε γλώσσα', save: 'Αποθήκευση', cancel: 'Ακύρωση', close: 'Κλείσιμο', search: 'Αναζήτηση', home: 'Αρχική', apps: 'Εφαρμογές', control: 'Έλεγχος', ai: 'AI', alerts: 'Ειδοποιήσεις', more: 'Περισσότερα' },
  auth: {
    signInTitle: 'Σύνδεση στο Orion',
    subtitle: 'Εισαγάγετε το αναγνωριστικό χρήστη για να αποκτήσετε πρόσβαση',
    userIdLabel: 'Αναγνωριστικό χρήστη',
    userIdPlaceholder: 'Όνομα χρήστη ή email',
    continueBtn: 'Συνέχεια',
    enterPassword: 'Κωδικός πρόσβασης',
    enterOrionBtn: 'Είσοδος στο Orion',
    identifying: 'Ταυτοποίηση...',
    userNotFound: 'Ο χρήστης δεν βρέθηκε',
    invalidCredentials: 'Μη έγκυρος κωδικός πρόσβασης',
    selectLanguage: 'Επιλέξτε γλώσσα',
    showPassword: 'Εμφάνιση κωδικού',
    hidePassword: 'Απόκρυψη κωδικού',
  },
  navigation: { home: 'Αρχική', apps: 'Εφαρμογές', control: 'Έλεγχος', ai: 'AI', alerts: 'Ειδοποιήσεις', more: 'Περισσότερα', settings: 'Ρυθμίσεις', dashboard: 'Ταμπλό' },
  wallpaper: { title: 'Στούντιο ταπετσαρίας' },
});

export const cs = createLocaleDict({
  common: { language: 'Čeština', selectLanguage: 'Vybrat jazyk', save: 'Uložit', cancel: 'Zrušit', close: 'Zavřít', search: 'Hledat', home: 'Domů', apps: 'Aplikace', control: 'Ovládání', ai: 'AI', alerts: 'Upozornění', more: 'Více' },
  auth: {
    signInTitle: 'Přihlásit se do Orion',
    subtitle: 'Zadejte své uživatelské ID pro přístup do pracovního prostoru',
    userIdLabel: 'Uživatelské ID',
    userIdPlaceholder: 'Uživatelské jméno nebo e-mail',
    continueBtn: 'Pokračovat',
    enterPassword: 'Heslo',
    enterOrionBtn: 'Vstoupit do Orion',
    identifying: 'Ověřování...',
    userNotFound: 'Uživatel nenalezen',
    invalidCredentials: 'Neplatné heslo',
    selectLanguage: 'Vybrat jazyk',
    showPassword: 'Zobrazit heslo',
    hidePassword: 'Skrýt heslo',
  },
  navigation: { home: 'Domů', apps: 'Aplikace', control: 'Ovládání', ai: 'AI', alerts: 'Upozornění', more: 'Více', settings: 'Nastavení', dashboard: 'Přehled' },
  wallpaper: { title: 'Studio tapet' },
});

export const ro = createLocaleDict({
  common: { language: 'Română', selectLanguage: 'Selectați limba', save: 'Salvare', cancel: 'Anulare', close: 'Închidere', search: 'Căutare', home: 'Acasă', apps: 'Aplicații', control: 'Control', ai: 'IA', alerts: 'Alerte', more: 'Mai mult' },
  auth: {
    signInTitle: 'Autentificare în Orion',
    subtitle: 'Introduceți ID-ul de utilizator pentru a accesa spațiul de lucru',
    userIdLabel: 'ID utilizator',
    userIdPlaceholder: 'Nume utilizator sau email',
    continueBtn: 'Continuare',
    enterPassword: 'Parolă',
    enterOrionBtn: 'Intră în Orion',
    identifying: 'Se identifică...',
    userNotFound: 'Utilizatorul nu a fost găsit',
    invalidCredentials: 'Parolă incorectă',
    selectLanguage: 'Selectați limba',
    showPassword: 'Afișează parola',
    hidePassword: 'Ascunde parola',
  },
  navigation: { home: 'Acasă', apps: 'Aplicații', control: 'Control', ai: 'IA', alerts: 'Alerte', more: 'Mai mult', settings: 'Setări', dashboard: 'Panou principal' },
  wallpaper: { title: 'Studio fundaluri' },
});

export const hu = createLocaleDict({
  common: { language: 'Magyar', selectLanguage: 'Nyelv kiválasztása', save: 'Mentés', cancel: 'Mégse', close: 'Bezárás', search: 'Keresés', home: 'Főoldal', apps: 'Alkalmazások', control: 'Vezérlés', ai: 'MI', alerts: 'Értesítések', more: 'Továbbiak' },
  auth: {
    signInTitle: 'Bejelentkezés az Orionba',
    subtitle: 'Adja meg felhasználói azonosítóját a munkaterület eléréséhez',
    userIdLabel: 'Felhasználói azonosító',
    userIdPlaceholder: 'Felhasználónév vagy e-mail',
    continueBtn: 'Folytatás',
    enterPassword: 'Jelszó',
    enterOrionBtn: 'Belépés az Orionba',
    identifying: 'Azonosítás...',
    userNotFound: 'Felhasználó nem található',
    invalidCredentials: 'Érvénytelen jelszó',
    selectLanguage: 'Nyelv kiválasztása',
    showPassword: 'Jelszó megjelenítése',
    hidePassword: 'Jelszó elrejtése',
  },
  navigation: { home: 'Főoldal', apps: 'Alkalmazások', control: 'Vezérlés', ai: 'MI', alerts: 'Értesítések', more: 'Továbbiak', settings: 'Beállítások', dashboard: 'Irányítópult' },
  wallpaper: { title: 'Háttérkép stúdió' },
});

export const fil = createLocaleDict({
  common: { language: 'Filipino', selectLanguage: 'Pumili ng wika', save: 'I-save', cancel: 'Kanselahin', close: 'Isara', search: 'Maghanap', home: 'Home', apps: 'Mga App', control: 'Kontrol', ai: 'AI', alerts: 'Mga Alerto', more: 'Higit Pa' },
  auth: {
    signInTitle: 'Mag-sign in sa Orion',
    subtitle: 'Ilagay ang iyong User ID upang ma-access ang iyong workspace',
    userIdLabel: 'User ID',
    userIdPlaceholder: 'Username o email',
    continueBtn: 'Magpatuloy',
    enterPassword: 'Password',
    enterOrionBtn: 'Pumasok sa Orion',
    identifying: 'Kinikilala...',
    userNotFound: 'Hindi natagpuan ang user',
    invalidCredentials: 'Maling password',
    selectLanguage: 'Pumili ng wika',
    showPassword: 'Ipakita ang password',
    hidePassword: 'Itago ang password',
  },
  navigation: { home: 'Home', apps: 'Mga App', control: 'Kontrol', ai: 'AI', alerts: 'Mga Alerto', more: 'Higit Pa', settings: 'Mga Setting', dashboard: 'Dashboard' },
  wallpaper: { title: 'Wallpaper Studio' },
});

export const sw = createLocaleDict({
  common: { language: 'Kiswahili', selectLanguage: 'Chagua lugha', save: 'Hifadhi', cancel: 'Ghairi', close: 'Funga', search: 'Tafuta', home: 'Nyumbani', apps: 'Programu', control: 'Udhibiti', ai: 'AI', alerts: 'Tahadhari', more: 'Zaidi' },
  auth: {
    signInTitle: 'Ingia kwenye Orion',
    subtitle: 'Weka Kitambulisho chako cha Mtumiaji ili kufikia nafasi yako ya kazi',
    userIdLabel: 'Kitambulisho cha Mtumiaji',
    userIdPlaceholder: 'Jina la mtumiaji au barua pepe',
    continueBtn: 'Endelea',
    enterPassword: 'Nenosiri',
    enterOrionBtn: 'Ingia Orion',
    identifying: 'Inatambua...',
    userNotFound: 'Mtumiaji hajapatikana',
    invalidCredentials: 'Nenosiri si sahihi',
    selectLanguage: 'Chagua lugha',
    showPassword: 'Onyesha nenosiri',
    hidePassword: 'Ficha nenosiri',
  },
  navigation: { home: 'Nyumbani', apps: 'Programu', control: 'Udhibiti', ai: 'AI', alerts: 'Tahadhari', more: 'Zaidi', settings: 'Mipangilio', dashboard: 'Dashibodi' },
  wallpaper: { title: 'Studio ya Mandhari' },
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
  sv,
  no,
  da,
  fi,
  el,
  cs,
  ro,
  hu,
  fil,
  sw,
};
