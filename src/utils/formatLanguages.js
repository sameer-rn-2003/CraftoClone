const NATIVE_LABELS = {
  en: 'English',
  hi: 'हिंदी',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  kn: 'ಕನ್ನಡ',
  te: 'తెలుగు',
  ml: 'മലയാളം',
  ta: 'தமிழ்',
};

export const formatLanguages = (apiLanguages = []) => {
  return apiLanguages.map(lang => ({
    code: lang.code,
    label: lang.name,
    nativeLabel: NATIVE_LABELS[lang.code] || lang.name, // fallback
  }));
};