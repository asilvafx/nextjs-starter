// @/context/LanguageContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAllPublic } from '@/lib/client/query.js';

// Type definitions
interface Language {
    id: string;
    code: string;
    name: string;
    flag: string;
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

    // Load language settings from database
    useEffect(() => {
        const loadLanguageSettings = async () => {
            try {
                setIsLoading(true);
                const settings = await getAllPublic('site_settings');
                
                if (settings && settings.length > 0) {
                    const siteSettings = settings[0];
                    
                    // Set current language from settings or localStorage
                    const savedLanguage = localStorage.getItem('selectedLanguage');
                    const currentLang = savedLanguage || siteSettings.language || 'en';
                    setCurrentLanguage(currentLang);
                    
                    // Set available languages from settings
                    const availableLangs: string[] = siteSettings.availableLanguages || ['en'];
                    const languagesWithNames = availableLangs.map((code: string) => ({
                        id: code,
                        code: code,
                        name: languageNames[code]?.name || code.toUpperCase(),
                        flag: languageNames[code]?.flag || '🌐'
                    }));
                    
                    setAvailableLanguages(languagesWithNames);
                } else {
                    // Fallback to defaults
                    setCurrentLanguage('en');
                    setAvailableLanguages([{
                        id: 'en',
                        code: 'en',
                        name: 'English',
                        flag: '🇺🇸'
                    }]);
                }
            } catch (error) {
                console.error('Failed to load language settings:', error);
                // Fallback to defaults on error
                setCurrentLanguage('en');
                setAvailableLanguages([{
                    id: 'en',
                    code: 'en', 
                    name: 'English',
                    flag: '🇺🇸'
                }]);
            } finally {
                setIsLoading(false);
            }
        };

        loadLanguageSettings();
    }, []);

    // Handle language change
    const handleLanguageChange = (languageCode: string) => {
        setCurrentLanguage(languageCode);
        localStorage.setItem('selectedLanguage', languageCode);
        
        // Trigger page reload to apply new translations
        window.location.reload();
    };

    const value = {
        currentLanguage,
        availableLanguages,
        setCurrentLanguage: handleLanguageChange,
        isLoading
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}