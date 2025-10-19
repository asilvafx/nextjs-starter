// locale/requests.js
import { getRequestConfig } from 'next-intl/server';
import fs from 'fs';
import path from 'path';

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
                
                console.log(`✅ Loaded translations from: ${file}`);
            } catch (error) {
                console.error(`❌ Error loading translation file ${file}:`, error.message);
            }
        }

        console.log(`🌍 Successfully loaded ${files.length} translation files for locale: ${locale}`);
        return translations;
        
    } catch (error) {
        console.error(`❌ Error loading translations for locale ${locale}:`, error.message);
        return {};
    }
}

export default getRequestConfig(async () => {
    // Provide a static locale, fetch a user setting,
    // read from `cookies()`, `headers()`, etc.
    const locale = 'fr';

    // Load all translation files for the specified locale
    const messages = await loadTranslations(locale);

    return {
        locale,
        messages
    };
});
