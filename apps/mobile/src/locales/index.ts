import { I18n } from 'i18n-js';
import en from './en';
import fr from './fr';
import es from './es';

const translations = {
    en,
    fr,
    es,
};

const i18n = new I18n(translations);

i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;
