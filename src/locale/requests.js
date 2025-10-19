// locale/requests.js
import { getRequestConfig } from 'next-intl/server';
import fs from 'fs';
import path from 'path';

// Configuration
const DEFAULT_LOCALE = 'en'; // Fallback language

/**
 * Get the current locale from various sources
 * Priority: localStorage -> database settings -> default
 */
function getCurrentLocale() {
    // In server-side context, we'll use default and let client-side handle dynamic switching
    if (typeof window === 'undefined') {
        return DEFAULT_LOCALE;
    }
    
    // Client-side: check localStorage first
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
        return savedLanguage;
    }
    
    return DEFAULT_LOCALE;
}

/**
 * Dynamically loads and merges all JSON translation files from a language directory
 * @param {string} locale - The locale code (e.g., 'en', 'fr')
 * @returns {Promise<Object>} Merged translations object
 */
async function loadTranslations(locale) {
    const localeDir = path.join(process.cwd(), 'src', 'locale', locale);
    
    try {
        // Check if locale directory exists
        if (!fs.existsSync(localeDir)) {
            console.warn(`Locale directory not found: ${localeDir}`);
            return {};
        }

        // Get all JSON files in the locale directory
        const files = fs.readdirSync(localeDir).filter(file => file.endsWith('.json'));
        
        if (files.length === 0) {
            console.warn(`No JSON files found in: ${localeDir}`);
            return {};
        }

        // Load and merge all translation files
        const translations = {};
        
        for (const file of files) {
            try {
                const filePath = path.join(localeDir, file);
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const fileTranslations = JSON.parse(fileContent);
                
                // Merge translations (spread operator maintains the structure)
                Object.assign(translations, fileTranslations);
                 
            } catch (error) {
                console.error(`❌ Error loading translation file ${file}:`, error.message);
            }
        }
 
        return translations;
        
    } catch (error) {
        console.error(`❌ Error loading translations for locale ${locale}:`, error.message);
        return {};
    }
}

/**
 * Recursively merges fallback translations with current translations
 * Fallback values only fill in missing keys, never overwrite existing ones
 * @param {Object} current - Current locale translations
 * @param {Object} fallback - Fallback locale translations  
 * @returns {Object} Merged translations with fallback support
 */
function mergeWithFallback(current, fallback) {
    const result = { ...current };
    
    for (const [key, value] of Object.entries(fallback)) {
        if (!(key in result)) {
            // Key doesn't exist in current, use fallback
            result[key] = value;
        } else if (typeof value === 'object' && value !== null && typeof result[key] === 'object' && result[key] !== null) {
            // Both are objects, merge recursively
            result[key] = mergeWithFallback(result[key], value);
        }
        // If key exists in current and is not an object, keep current value (don't overwrite)
    }
    
    return result;
}

export default getRequestConfig(async () => {
    // Get current locale dynamically
    const locale = getCurrentLocale();

    // Load translations for current locale
    const currentMessages = await loadTranslations(locale);
    
    let messages = currentMessages;
    
    // If current locale is not the default, load default locale as fallback
    if (locale !== DEFAULT_LOCALE) {
        const fallbackMessages = await loadTranslations(DEFAULT_LOCALE);
        
        // Merge current with fallback (fallback fills missing keys only)
        messages = mergeWithFallback(currentMessages, fallbackMessages); 
    }

    return {
        locale,
        messages,
        // Configure next-intl to handle missing translations gracefully
        onError: (error) => {
            // Suppress console errors for missing translations
            if (error.code === 'MISSING_MESSAGE') {
                // Silently ignore missing translation errors
                return;
            }
            // Log other types of errors
            console.error('Translation error:', error);
        },
        getMessageFallback: ({ namespace, key, error }) => {
            // Return the raw key path when translation is missing
            // This will display something like "Cart.orderSummaryy" in the DOM
            const keyPath = namespace ? `${namespace}.${key}` : key;
            
            // Optional: Log missing translations in development for debugging
            if (process.env.NODE_ENV === 'development') {
                console.warn(`🔍 Missing translation: ${keyPath} (${error.code})`);
            }
            
            return keyPath;
        }
    };
});
