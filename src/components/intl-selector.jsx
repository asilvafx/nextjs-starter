// @/components/intl-selector.jsx

'use client';

import { useEffect, useState } from 'react';
import { LanguageSelector } from '@/components/ui/language-selector';
import { useLanguage } from '@/context/LanguageContext'; 

export default function IntlSelector({ slim = false, initialLanguages = null }) {
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const { availableLanguages: providerLanguages, isLoading: _providerLoading } = useLanguage();

    useEffect(() => {
        let mounted = true;

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
                    className={`flex h-9 animate-pulse items-center gap-2 rounded-md border border-input bg-muted/10 px-3 py-2 text-sm shadow-sm ${slim ? 'justify-center' : ''}`}>
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
