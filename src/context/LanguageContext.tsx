// @/context/LanguageContext.tsx
'use client';

import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAllPublic } from '@/lib/client/query.js';
import { COOKIE_NAME } from '@/locale/config';

// Type definitions
interface Language {
    id: string;
    code: string;
    name: string;
    flag: string;
    countryCode?: string;
}

interface LanguageContextType {
    currentLanguage: string;
    availableLanguages: Language[];
    setCurrentLanguage: (languageCode: string) => void;
    isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
    currentLanguage: 'en',
    availableLanguages: [],
    setCurrentLanguage: (languageCode: string) => {},
    isLoading: true
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [currentLanguage, setCurrentLanguage] = useState<string>('en');
    const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const router = useRouter();

    // Language name mappings
    const languageNames: Record<string, { name: string; flag: string }> = {
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

    // Small map from language to representative country (ISO alpha-2). Not exhaustive — used as best-effort.
    const langToCountry: Record<string, string> = {
        en: 'US',
        'en-GB': 'GB',
        es: 'ES',
        fr: 'FR',
        de: 'DE',
        it: 'IT',
        pt: 'PT',
        ja: 'JP',
        ko: 'KR',
        zh: 'CN'
    };

    // Convert a 2-letter country code (ISO) to emoji flag
    const countryCodeToEmoji = (cc?: string) => {
        if (!cc || cc.length !== 2) return '🌐';
        const codePoints = [...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    };

    // Resolve a human-friendly language name using an optional package (iso-639-1) or Intl.DisplayNames
    const resolveLanguageName = async (code: string) => {
        const primary = code.split(/[-_]/)[0];
        // Prefer Intl.DisplayNames which is widely available in modern browsers and Node
        try {
            if (typeof Intl !== 'undefined' && (Intl as any).DisplayNames) {
                const dn = new (Intl as any).DisplayNames(['en'], { type: 'language' });
                const name = dn.of(primary);
                if (name) return name;
            }
        } catch (e) {
            // ignore
        }

        // Fallback: use short tag or uppercase code
        return primary.toUpperCase();
    };

    // Extracted loader so other effects can refresh availableLanguages when locale changes
    const loadLanguageSettings = async () => {
        try {
            setIsLoading(true);
            const settings = await getAllPublic('site_settings');

            if (settings && settings.length > 0) {
                const siteSettings = settings[0];

                // Set current language from settings or localStorage
                const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('selectedLanguage') : null;
                const currentLang = savedLanguage || siteSettings.language || 'en';
                setCurrentLanguage(currentLang);

                // Set available languages from settings
                const availableLangs: string[] = siteSettings.availableLanguages || ['en'];
                const languagesWithNames = await Promise.all(
                    availableLangs.map(async (code: string) => {
                        const primary = code.split(/[-_]/)[0];
                        const resolvedName = await resolveLanguageName(code);
                        const name =
                            languageNames[code]?.name ||
                            languageNames[primary]?.name ||
                            resolvedName ||
                            code.toUpperCase();
                        const country = langToCountry[code] || langToCountry[primary];
                        const flag = languageNames[code]?.flag || (country ? countryCodeToEmoji(country) : '🌐');
                        return {
                            id: code,
                            code: code,
                            name,
                            flag,
                            countryCode: country || undefined
                        };
                    })
                );

                setAvailableLanguages(languagesWithNames);
            } else {
                // Fallback to defaults
                setCurrentLanguage('en');
                setAvailableLanguages([
                    {
                        id: 'en',
                        code: 'en',
                        name: 'English',
                        flag: '🇺🇸'
                    }
                ]);
            }
        } catch (error) {
            console.error('Failed to load language settings:', error);
            // Fallback to defaults on error
            setCurrentLanguage('en');
            setAvailableLanguages([
                {
                    id: 'en',
                    code: 'en',
                    name: 'English',
                    flag: '🇺🇸'
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLanguageSettings();
    }, []);

    // Listen for language changes from other tabs (BroadcastChannel preferred, storage as fallback)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        let bc: BroadcastChannel | null = null;

        const handleExternalChange = (newLang?: string) => {
            if (!newLang) return;
            // If it's already the same, do nothing
            if (newLang === currentLanguage) return;

            // Update local state and trigger refresh so next-intl reloads messages
            setCurrentLanguage(newLang);
            try {
                router.refresh();
            } catch (e) {
                try {
                    window.location.reload();
                } catch (err) {
                    // ignore
                }
            }
        };

        try {
            if ('BroadcastChannel' in window) {
                bc = new BroadcastChannel('site-locale');
                bc.onmessage = (ev) => {
                    const lang = ev?.data?.language;
                    if (lang) handleExternalChange(lang);
                };
            }
        } catch (e) {
            bc = null;
        }

        const onStorage = (e: StorageEvent) => {
            if (e.key === 'selectedLanguage' && e.newValue) {
                handleExternalChange(e.newValue);
            }
        };

        window.addEventListener('storage', onStorage);

        return () => {
            window.removeEventListener('storage', onStorage);
            if (bc) {
                try {
                    bc.close();
                } catch (e) {
                    // ignore
                }
            }
        };
    }, [currentLanguage, router]);

    // Handle language change
    const handleLanguageChange = (languageCode: string) => {
        // Update local state for immediate UI update in this tab
        setCurrentLanguage(languageCode);

        // Persist to localStorage (used for cross-tab fallback)
        try {
            localStorage.setItem('selectedLanguage', languageCode);
        } catch (e) {
            // ignore storage errors
        }

        // Persist selection to cookie so server-side getRequestConfig can read it
        try {
            // 1 year max-age
            const maxAge = 60 * 60 * 24 * 365;
            document.cookie = `${COOKIE_NAME}=${encodeURIComponent(languageCode)}; Path=/; max-age=${maxAge}; SameSite=Lax`;
        } catch (e) {
            // ignore cookie write errors
        }

        // Broadcast the change to other tabs/windows using BroadcastChannel (if available)
        try {
            if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
                const bc = new BroadcastChannel('site-locale');
                bc.postMessage({ language: languageCode });
                bc.close();
            }
        } catch (e) {
            // ignore
        }

        // Refresh server data so next-intl loads new messages for this tab
        try {
            router.refresh();
        } catch (e) {
            // If hooks cannot be used here for some reason, fallback to full reload
            try {
                window.location.reload();
            } catch (err) {
                // ignore
            }
        }
    };

    const value = {
        currentLanguage,
        availableLanguages,
        setCurrentLanguage: handleLanguageChange,
        isLoading
    };

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
