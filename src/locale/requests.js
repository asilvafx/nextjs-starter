// @/locale/requests.js

import fs from 'fs';
import { cookies } from 'next/headers';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import path from 'path';
import { COOKIE_NAME, defaultLocale, locales } from './config';

// Load and merge translation JSON files from the locale folder
async function loadTranslations(locale) {
    const localeDir = path.join(process.cwd(), 'src', 'locale', locale);

    try {
        if (!fs.existsSync(localeDir)) return {};

        const files = fs.readdirSync(localeDir).filter((f) => f.endsWith('.json'));
        if (files.length === 0) return {};

        const translations = {};
        for (const file of files) {
            try {
                const filePath = path.join(localeDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const parsed = JSON.parse(content);
                Object.assign(translations, parsed);
            } catch (e) {
                console.error(`Error loading translation ${file} for locale ${locale}:`, e?.message || e);
            }
        }

        return translations;
    } catch (e) {
        console.error(`Error reading translations for locale ${locale}:`, e?.message || e);
        return {};
    }
}

// Merge fallback messages into current messages (only fill missing keys)
function mergeWithFallback(current, fallback) {
    const result = { ...current };
    for (const [key, value] of Object.entries(fallback || {})) {
        if (!(key in result)) {
            result[key] = value;
        } else if (
            typeof value === 'object' &&
            value !== null &&
            typeof result[key] === 'object' &&
            result[key] !== null
        ) {
            result[key] = mergeWithFallback(result[key], value);
        }
    }
    return result;
}

export default getRequestConfig(async () => {
    // Determine locale server-side without relying on URL segments.
    // Priority: cookie -> site settings -> configured default
    let candidate = null;

    try {
        // cookies() may be async in some Next.js runtimes — await it before using
        const store = await cookies();
        candidate = store.get(COOKIE_NAME)?.value || null;
    } catch (e) {
        candidate = null;
    }

    // Validate candidate; if not valid try site settings
    if (!hasLocale(locales, candidate)) {
        try {
            const res = await fetch(
                `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/query/public/site_settings`
            );
            const result = await res.json();
            if (result && result.success && Array.isArray(result.data) && result.data.length > 0) {
                const siteSettings = result.data[0];
                const siteLang = siteSettings.language;
                if (siteLang && hasLocale(locales, siteLang)) {
                    candidate = siteLang;
                }
            }
        } catch (err) {
            // ignore
        }
    }

    const locale = hasLocale(locales, candidate) ? candidate : defaultLocale || 'en';

    // Load messages
    const currentMessages = await loadTranslations(locale);
    let messages = currentMessages;

    if (locale !== (defaultLocale || 'en')) {
        const fallbackMessages = await loadTranslations(defaultLocale || 'en');
        messages = mergeWithFallback(currentMessages, fallbackMessages);
    }

    return {
        locale,
        messages,
        onError: (error) => {
            if (error && error.code === 'MISSING_MESSAGE') return;
            console.error('Translation error:', error);
        },
        getMessageFallback: ({ namespace, key, error }) => {
            const keyPath = namespace ? `${namespace}.${key}` : key;
            if (process.env.NODE_ENV === 'development') {
                console.warn(`Missing translation: ${keyPath} (${error?.code})`);
            }
            return keyPath;
        }
    };
});
