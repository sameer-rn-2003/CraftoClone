import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';
import gu from './locales/gu.json';
import kn from './locales/kn.json';
import te from './locales/te.json';
import ml from './locales/ml.json';
import ta from './locales/ta.json';

const resources = {
    en: { translation: en },
    hi: { translation: hi },
    mr: { translation: mr },
    gu: { translation: gu },
    kn: { translation: kn },
    te: { translation: te },
    ml: { translation: ml },
    ta: { translation: ta },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'en',
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
        returnNull: false,
        react: { useSuspense: false },
    });

export default i18n;

