// @/components/intl-selector.jsx

'use client';

import { useEffect, useState } from 'react';
import { LanguageSelector } from '@/components/ui/language-selector';
import { useLanguage } from '@/context/LanguageContext';

const languageNames = {
    en: { name: 'English', flag: '🇺🇸' },
    es: { name: 'Spanish', flag: '🇪🇸' },
    fr: { name: 'Français', flag: '🇫🇷' },
    de: { name: 'German', flag: '🇩🇪' },
    it: { name: 'Italian', flag: '🇮🇹' },
    pt: { name: 'Portuguese', flag: '🇵🇹' },
    ja: { name: 'Japanese', flag: '🇯🇵' },
    ko: { name: 'Korean', flag: '🇰🇷' },
    zh: { name: 'Chinese', flag: '🇨🇳' }
};

export default function IntlSelector({ slim = false, initialLanguages = null }) {
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const { availableLanguages: providerLanguages, isLoading: providerLoading } = useLanguage();

    useEffect(() => {
        let mounted = true;

        const fetchFrontendLanguages = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/query/public/site_settings');
                const result = await response.json();

                if (result.success && result.data && result.data.length > 0) {
                    const siteSettings = result.data[0];
                    const availableLangs = siteSettings.availableLanguages || ['en'];

                    // Best-effort mapping from language code to a representative country code
                    const langToCountry = {
                        en: 'US',
                        es: 'ES',
                        fr: 'FR',
                        de: 'DE',
                        it: 'IT',
                        pt: 'PT',
                        ja: 'JP',
                        ko: 'KR',
                        zh: 'CN'
                    };

                    const formattedLanguages = availableLangs.map((code) => ({
                        id: code,
                        code,
                        name: languageNames[code]?.name || code.toUpperCase(),
                        flag: languageNames[code]?.flag || '🌐',
                        // include a countryCode when we can — LanguageSelector will use CircleFlag if present
                        countryCode: langToCountry[code] || undefined
                    }));

                    if (mounted) setLanguages(formattedLanguages);
                } else {
                    if (mounted) setLanguages([{ id: 'en', code: 'en', name: 'English', flag: '🇺🇸' }]);
                }
            } catch (err) {
                console.error('Failed to fetch frontend languages:', err);
                if (mounted) setLanguages([{ id: 'en', code: 'en', name: 'English', flag: '🇺🇸' }]);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        // If caller provided initialLanguages, prefer them (admin layout will pass these).
        if (initialLanguages && Array.isArray(initialLanguages) && initialLanguages.length > 0) {
            if (mounted) {
                setLanguages(initialLanguages);
                setLoading(false);
            }
            return () => {
                mounted = false;
            };
        }

        // Otherwise prefer provider languages when available, else fetch from public site settings.
        if (providerLanguages && Array.isArray(providerLanguages) && providerLanguages.length > 0) {
            setLanguages(providerLanguages);
            setLoading(false);
        } else {
            fetchFrontendLanguages();
        }

        return () => {
            mounted = false;
        };
    }, [initialLanguages, providerLanguages]);

    // We always render the LanguageSelector; it will show internal loading if needed.
    // Show a small skeleton while loading so the header doesn't jump
    if (loading) {
        return (
            <div className={slim ? 'w-16' : ''} aria-hidden>
                <div
                    className={`flex h-9 items-center gap-2 rounded-md border border-input px-3 py-2 text-sm shadow-sm bg-muted/10 animate-pulse ${slim ? 'justify-center' : ''}`}>
                    {/* slim: small circle; full: short bar */}
                    {slim ? (
                        <span className="h-4 w-4 rounded-full bg-muted-foreground/20" />
                    ) : (
                        <>
                            <span className="h-4 w-4 rounded bg-muted-foreground/20" />
                            <span className="h-4 w-20 rounded bg-muted-foreground/20" />
                        </>
                    )}
                </div>
            </div>
        );
    }

    return <LanguageSelector languages={languages} slim={slim} />;
}
