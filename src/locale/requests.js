// @/locale/requests.js

import fs from 'node:fs';
import path from 'node:path';
import { cookies } from 'next/headers';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { COOKIE_NAME, defaultLocale, locales } from './config';
import { getBundledTranslations } from './_messages';
import { getSiteSettings } from '@/lib/server/admin';

// Cache site settings to prevent multiple fetches per request
let siteSettingsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Load and merge translation JSON files from the locale folder
async function loadTranslations(locale) {
    // Prefer bundled imports so the Next/Vercel build includes translations.
    // This avoids reading from the filesystem at runtime in production
    // (serverless/edge environments where the source files may not be available).
    try {
        const bundled = getBundledTranslations(locale);
        if (bundled && Object.keys(bundled).length > 0) return bundled;
    } catch (_e) {
        // fallthrough to fs-based loader for development/local runs
    }

    // Fallback to previous filesystem-based loader (works in local dev).
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
            } catch (_e) {
                console.error(`Error loading translation ${file} for locale ${locale}:`, _e?.message || _e);
            }
        }

        return translations;
    } catch (_e) {
        console.error(`Error reading translations for locale ${locale}:`, _e?.message || _e);
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

// Get site settings with caching to prevent multiple requests
async function getCachedSiteSettings() {
    const now = Date.now();
    
    // Return cached data if still valid
    if (siteSettingsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        // Remove console.log to stop spam - only log when fetching fresh data
        return siteSettingsCache;
    }
    
    try {
        console.log('Fetching fresh site settings for locale detection');
        const result = await getSiteSettings();
        
        if (result?.success && result.data) {
            siteSettingsCache = result.data;
            cacheTimestamp = now;
            return siteSettingsCache;
        }
    } catch (error) {
        console.error('Error fetching site settings for locale:', error);
    }
    
    return null;
}

export default getRequestConfig(async () => {
    // Determine locale server-side without relying on URL segments.
    // Priority: cookie -> site settings -> configured default
    let candidate = null;

    try {
        // cookies() may be async in some Next.js runtimes — await it before using
        const store = await cookies();
        candidate = store.get(COOKIE_NAME)?.value || null;
    } catch (_e) {
        candidate = null;
    }

    // Early return if we have a valid locale from cookie - no need to check site settings
    if (hasLocale(locales, candidate)) {
        const locale = candidate;
        
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
    }

    // Only check site settings if cookie doesn't have valid locale
    try {
        const siteSettings = await getCachedSiteSettings();
        if (siteSettings?.language && hasLocale(locales, siteSettings.language)) {
            candidate = siteSettings.language;
        }
    } catch (_err) {
        // ignore
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
