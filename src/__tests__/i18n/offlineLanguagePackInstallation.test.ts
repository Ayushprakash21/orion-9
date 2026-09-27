import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LanguagePackService } from '../../i18n/LanguagePackService';
import { validateOrionLanguagePack, OrionLanguagePack } from '../../i18n/languagePack';

describe('ORION-9 — Offline / Air-Gapped .orionlang Package Ingestion & Security Validation', () => {
  let service: LanguagePackService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = LanguagePackService.getInstance();
  });

  const validArabicPack: OrionLanguagePack = {
    manifest: {
      id: 'ar-SA-custom',
      name: 'Arabic (Custom Air-Gapped)',
      nativeName: 'العربية المخصصة',
      bcp47: 'ar-SA',
      direction: 'rtl',
      version: '1.0.0',
      orionCompatibility: '>=1.0.0',
      translationSchemaVersion: 1,
      coverage: 100,
      features: { ui: true, regionalFormatting: true, rtl: true },
      author: 'Enterprise Airgap Deployer',
      sizeBytes: 150000,
      updatedAt: '2026-09-27T00:00:00Z',
    },
    translations: {
      common: {
        save: 'حفظ',
        cancel: 'إلغاء',
        apply: 'تطبيق',
        reset: 'إعادة تعيين',
        close: 'إغلاق',
        edit: 'تعديل',
        delete: 'حذف',
        search: 'بحث',
        filter: 'تصفية',
        loading: 'جاري التحميل',
        refresh: 'تحديث',
        back: 'رجوع',
        status: 'الحالة',
        active: 'نشط',
        inactive: 'غير نشط',
        default: 'افتراضي',
        enabled: 'مفعل',
        disabled: 'معطل',
        confirm: 'تأكيد',
        success: 'نجاح',
        error: 'خطأ',
        warning: 'تحذير',
        info: 'معلومات',
        language: 'اللغة',
        selectLanguage: 'اختر اللغة',
        orionPlatform: 'منصة أوريون',
        home: 'الرئيسية',
        apps: 'التطبيقات',
        control: 'التحكم',
        ai: 'الذكاء الاصطناعي',
        alerts: 'التنبيهات',
        more: 'المزيد',
        settings: 'الإعدادات',
        help: 'المساعدة',
        user: 'المستخدم',
        notifications: 'الإشعارات',
        viewAll: 'عرض الكل',
        actions: 'الإجراءات',
      } as any,
      auth: {
        signInTitle: 'تسجيل الدخول إلى أوريون',
        subtitle: 'أدخل معرف المستخدم للوصول إلى مساحة العمل',
        userIdLabel: 'معرف المستخدم',
        userIdPlaceholder: 'اسم المستخدم أو البريد الإلكتروني',
        continueBtn: 'متابعة',
        enterPassword: 'كلمة المرور',
        enterOrionBtn: 'دخول أوريون',
        identifying: 'جاري التحقق...',
        userNotFound: 'المستخدم غير موجود',
        invalidCredentials: 'كلمة المرور غير صحيحة',
        otherUser: 'مستخدم آخر',
        rememberMe: 'تذكرني',
        forgotPassword: 'نسيت كلمة المرور؟',
        switchUser: 'تبديل المستخدم',
        lock: 'قفل',
        signOut: 'تسجيل الخروج',
        restart: 'إعادة التشغيل',
        shutDown: 'إيقاف التشغيل',
        selectLanguage: 'اختر اللغة',
        showPassword: 'إظهار كلمة المرور',
        hidePassword: 'إخفاء كلمة المرور',
        enteringOrion: 'جاري الدخول إلى أوريون...',
      },
      navigation: {
        home: 'الرئيسية',
        control: 'برج المراقبة',
        ai: 'أوريون الذكاء الاصطناعي',
        alerts: 'التنبيهات والمخاطر',
        apps: 'التطبيقات',
        settings: 'الإعدادات',
        dashboard: 'لوحة التحكم',
      } as any,
      settings: {
        languageLabel: 'لغة النظام',
        languageDescription: 'تحديد لغة واجهة المستخدم لمنصة أوريون',
      } as any,
      wallpaper: {
        title: 'استوديو الخلفيات',
      } as any,
    } as any,
  };

  it('validates and successfully installs a genuine .orionlang data pack', async () => {
    const installRes = await service.installLanguagePackFromFile(validArabicPack);
    expect(installRes.success).toBe(true);
    expect(installRes.locale).toBe('ar');

    const pack = service.getLanguagePack('ar');
    expect(pack).toBeDefined();
    expect(pack?.manifest.direction).toBe('rtl');
    expect(pack?.translations.common.save).toBe('حفظ');
  });

  it('rejects a package containing executable script tags (Security Guard)', () => {
    const maliciousPack = {
      ...validArabicPack,
      translations: {
        ...validArabicPack.translations,
        common: {
          ...validArabicPack.translations.common,
          save: '<script>alert("hack")</script>حفظ',
        },
      },
    };

    const result = validateOrionLanguagePack(maliciousPack);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('forbidden script'))).toBe(true);
  });

  it('rejects a package with invalid direction', () => {
    const invalidPack = {
      ...validArabicPack,
      manifest: {
        ...validArabicPack.manifest,
        direction: 'diagonal' as any,
      },
    };

    const result = validateOrionLanguagePack(invalidPack);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('direction'))).toBe(true);
  });

  it('rejects an empty or malformed JSON package', async () => {
    const res = await service.installLanguagePackFromFile('NOT_JSON_DATA');
    expect(res.success).toBe(false);
    expect(res.error).toContain('malformed JSON');
  });
});
