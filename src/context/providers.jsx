// context/providers.jsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import SafeCartProvider from './SafeCartProvider';
import { LanguageProvider } from './LanguageContext.jsx';

export default function Providers({ children }) {
    return (
        <SessionProvider>
            <SafeCartProvider>
                <ThemeProvider attribute="class" enableSystem={true} defaultTheme="system">
                    <LanguageProvider>
                        {children}
                    </LanguageProvider>
                </ThemeProvider>
            </SafeCartProvider>
        </SessionProvider>
    );
}
