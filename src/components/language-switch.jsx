// src/components/language-switch.jsx
'use client';

import { useEffect, useState } from 'react';
import IntlSelector from '@/components/intl-selector';
import { formatAvailableLanguages } from '@/lib/i18n-utils';

/**
 * LanguageSwitch
 * Small wrapper that centralizes the "load available languages" logic.
 * Usage: <LanguageSwitch slim /> or <LanguageSwitch initialLanguages={langs} />
 * If `initialLanguages` is provided it is forwarded to IntlSelector. Otherwise
 * this component loads `/api/query/public/site_settings`, formats the list and
 * passes it to IntlSelector. This lets pages render the selector with one
 * line and preserves the existing behavior/format (id, code, name, flag, countryCode).
 */
export default function LanguageSwitch({ slim = false, initialLanguages = null }) {
    const [languages, setLanguages] = useState(initialLanguages || null);

    useEffect(() => {
        // If caller provided languages, don't fetch.
        if (initialLanguages && Array.isArray(initialLanguages) && initialLanguages.length > 0) {
            setLanguages(initialLanguages);
            return;
        }

        let mounted = true;

        // Formatting of available languages delegated to shared helper
        // `formatAvailableLanguages` (imported from src/lib/i18n-utils.js)

        const load = async () => {
            try {
                const res = await fetch('/api/query/public/site_settings');
                const json = await res.json();
                if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
                    const siteSettings = json.data[0];
                    const availableLangs = siteSettings.availableLanguages || ['en'];

                    const formatted = formatAvailableLanguages(availableLangs);

                    if (mounted) setLanguages(formatted);
                    return;
                }

                // fallback
                if (mounted) setLanguages([{ id: 'en', code: 'en', name: 'English', flag: '🇺🇸' }]);
            } catch (err) { 
                if (mounted) setLanguages([{ id: 'en', code: 'en', name: 'English', flag: '🇺🇸' }]);
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, [initialLanguages]);

    // Pass either the computed languages or null (IntlSelector will fetch if null).
    return <IntlSelector slim={slim} initialLanguages={languages} />;
}
