import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
    AUTO_LANGUAGE, availableLanguages, detectLanguage, isRtl, locales, resolveLanguage, setLanguage, t,
} from '../src/i18n';

const EU_LANGUAGES = [
    'bg', 'cs', 'da', 'de', 'el', 'en', 'es', 'et', 'fi', 'fr', 'ga', 'hr',
    'hu', 'it', 'lt', 'lv', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'sl', 'sv',
];

const OTHER_LANGUAGES = [
    'af', 'ar', 'ca', 'fa', 'id', 'ja', 'ko', 'ms', 'nb', 'ru', 'tr', 'uk', 'vi', 'zh', 'zh-Hant',
];

describe('locale files', () => {
    it('cover all 24 official EU languages plus the extra ones', () => {
        expect(Object.keys(locales).sort()).toEqual([...EU_LANGUAGES, ...OTHER_LANGUAGES].sort());
    });

    it('all have exactly the same keys as English, none empty', () => {
        const englishKeys = Object.keys(locales.en).sort();
        for (const [code, dictionary] of Object.entries(locales)) {
            expect(Object.keys(dictionary).sort(), code).toEqual(englishKeys);
            for (const [key, value] of Object.entries(dictionary)) {
                expect(value.trim(), `${code}: ${key}`).not.toBe('');
            }
        }
    });

    it('keep the markup of HTML strings intact', () => {
        for (const [code, dictionary] of Object.entries(locales)) {
            expect(dictionary['instructions.intro'], code).toMatch(/<strong>Scrambled Net<\/strong>/);
            expect(dictionary['privacy.text'], code).toMatch(/<a href="privacy\.html">[^<]+<\/a>/);
        }
    });

    it('define every key used in index.html', () => {
        const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
        const keys = [...html.matchAll(/data-i18n(?:-html|-aria)?="([^"]+)"/g)].map(m => m[1]);
        expect(keys.length).toBeGreaterThan(20);
        for (const key of keys) expect(locales.en, key).toHaveProperty([key]);
    });

    it('list languages by their own names', () => {
        const names = availableLanguages().map(l => l.name);
        expect(names).toContain('Deutsch');
        expect(names).toContain('Ελληνικά');
        expect(names).toContain('日本語');
        expect(names).toContain('Indonesia');
        expect(names).toHaveLength(EU_LANGUAGES.length + OTHER_LANGUAGES.length);
    });
});

describe('detectLanguage', () => {
    it('matches exact and regional tags', () => {
        expect(detectLanguage(['de'])).toBe('de');
        expect(detectLanguage(['de-AT'])).toBe('de');
        expect(detectLanguage(['pt-BR'])).toBe('pt');
        expect(detectLanguage(['FR_ca'])).toBe('fr');
    });

    it('picks Simplified or Traditional Chinese by script and region', () => {
        expect(detectLanguage(['zh-CN'])).toBe('zh');
        expect(detectLanguage(['zh'])).toBe('zh');
        expect(detectLanguage(['zh-SG'])).toBe('zh');
        expect(detectLanguage(['zh-Hans-HK'])).toBe('zh');
        expect(detectLanguage(['zh-TW'])).toBe('zh-Hant');
        expect(detectLanguage(['zh-HK'])).toBe('zh-Hant');
        expect(detectLanguage(['zh-Hant'])).toBe('zh-Hant');
    });

    it('maps other Norwegian codes and the old Indonesian code', () => {
        expect(detectLanguage(['no'])).toBe('nb');
        expect(detectLanguage(['nn-NO'])).toBe('nb');
        expect(detectLanguage(['nb-NO'])).toBe('nb');
        expect(detectLanguage(['in-ID'])).toBe('id');
    });

    it('maps Arabic and Persian variants, including Dari', () => {
        expect(detectLanguage(['ar-EG'])).toBe('ar');
        expect(detectLanguage(['ar-SA'])).toBe('ar');
        expect(detectLanguage(['fa-IR'])).toBe('fa');
        expect(detectLanguage(['fa-AF'])).toBe('fa');
        expect(detectLanguage(['prs'])).toBe('fa');
    });

    it('uses the first preferred language we have', () => {
        expect(detectLanguage(['th-TH', 'hi-IN', 'sv-SE', 'en-US'])).toBe('sv');
    });

    it('returns null when nothing matches', () => {
        expect(detectLanguage(['th', 'hi-IN'])).toBeNull();
        expect(detectLanguage([])).toBeNull();
    });
});

describe('resolveLanguage', () => {
    it('follows the device when set to auto or unset', () => {
        expect(resolveLanguage(AUTO_LANGUAGE, ['it-IT'])).toBe('it');
        expect(resolveLanguage(undefined, ['pl'])).toBe('pl');
    });

    it('falls back to English when the device language is not available', () => {
        expect(resolveLanguage(AUTO_LANGUAGE, ['th'])).toBe('en');
    });

    it('prefers a language the player picked over the device language', () => {
        expect(resolveLanguage('fi', ['de-DE'])).toBe('fi');
    });

    it('ignores a saved language that no longer exists', () => {
        expect(resolveLanguage('xx', ['nl-BE'])).toBe('nl');
    });
});

describe('t', () => {
    it('translates into the current language', () => {
        setLanguage('de');
        expect(t('common.back')).toBe('Zurück');
        setLanguage('en');
        expect(t('common.back')).toBe('Back');
    });

    it('returns the key for unknown keys', () => {
        expect(t('no.such.key')).toBe('no.such.key');
    });
});

describe('isRtl', () => {
    it('is true only for right-to-left languages', () => {
        expect(isRtl('ar')).toBe(true);
        expect(isRtl('fa')).toBe(true);
        expect(isRtl('ar-EG')).toBe(true);
        expect(isRtl('en')).toBe(false);
        expect(isRtl('zh-Hant')).toBe(false);
    });
});
