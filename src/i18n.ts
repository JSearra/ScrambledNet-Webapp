// Translations live in src/locales/<code>.json. Adding a file there adds the
// language to the picker; its "language.name" entry is the name shown for it.
type Dictionary = Record<string, string>;

const modules = import.meta.glob<Dictionary>('./locales/*.json', { eager: true, import: 'default' });

export const DEFAULT_LANGUAGE = 'en';
export const AUTO_LANGUAGE = 'auto';

export const locales: Record<string, Dictionary> = {};
for (const [path, dictionary] of Object.entries(modules)) {
    const code = path.match(/([\w-]+)\.json$/)![1];
    locales[code] = dictionary;
}

let current = DEFAULT_LANGUAGE;

export interface LanguageInfo {
    code: string;
    name: string;
}

/** All available languages, sorted by their own name. */
export function availableLanguages(): LanguageInfo[] {
    return Object.keys(locales)
        .map(code => ({ code, name: locales[code]['language.name'] ?? code }))
        .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
}

/**
 * Pick the first of the user's preferred languages (e.g. navigator.languages)
 * that we have a translation for. "pt-BR" matches "pt", "de-AT" matches "de".
 * Returns null when none of them match.
 */
export function detectLanguage(preferred: readonly string[], available: readonly string[] = Object.keys(locales)): string | null {
    const lookup = new Map(available.map(code => [code.toLowerCase(), code]));
    for (const tag of preferred) {
        const lower = tag.toLowerCase().replace(/_/g, '-');
        const match = lookup.get(lower) ?? lookup.get(normalizeTag(lower));
        if (match) return match;
    }
    return null;
}

// Tags that don't map to our file names by just dropping the region
const LANGUAGE_ALIASES: Record<string, string> = {
    no: 'nb', // Norwegian (generic)
    nn: 'nb', // Norwegian Nynorsk: Bokmål is the closest we have
    in: 'id', // Old code for Indonesian
};
const TRADITIONAL_CHINESE_REGIONS = new Set(['tw', 'hk', 'mo']);

/** "de-at" -> "de", "zh-tw" / "zh-hant-hk" -> "zh-hant", "zh-cn" -> "zh", "no" -> "nb". */
function normalizeTag(lower: string): string {
    const [language, ...rest] = lower.split('-');
    if (language === 'zh') {
        const traditional = rest.includes('hant') || (!rest.includes('hans') && rest.some(part => TRADITIONAL_CHINESE_REGIONS.has(part)));
        return traditional ? 'zh-hant' : 'zh';
    }
    return LANGUAGE_ALIASES[language] ?? language;
}

/** Resolve a stored preference ("auto" or a language code) to a language we have. */
export function resolveLanguage(preference: string | null | undefined, preferred: readonly string[]): string {
    if (preference && preference !== AUTO_LANGUAGE && locales[preference]) return preference;
    return detectLanguage(preferred) ?? DEFAULT_LANGUAGE;
}

export function getLanguage(): string {
    return current;
}

/** Translate a key, falling back to English and then to the key itself. */
export function t(key: string): string {
    return locales[current]?.[key] ?? locales[DEFAULT_LANGUAGE]?.[key] ?? key;
}

/**
 * Fill in every element marked with data-i18n (text), data-i18n-html (trusted
 * markup from our own locale files) or data-i18n-aria (aria-label).
 */
export function applyTranslations(root: ParentNode = document): void {
    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n!);
    });
    root.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach(el => {
        el.innerHTML = t(el.dataset.i18nHtml!);
    });
    root.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach(el => {
        el.setAttribute('aria-label', t(el.dataset.i18nAria!));
    });
}

export function setLanguage(code: string): void {
    current = locales[code] ? code : DEFAULT_LANGUAGE;
    if (typeof document !== 'undefined') {
        document.documentElement.lang = current;
        applyTranslations(document);
    }
}
