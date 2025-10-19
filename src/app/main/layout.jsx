// app/main/layout.js
'use client';

import { Suspense } from 'react';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { useAuth } from '@/hooks/useAuth';
import { LanguageProvider } from '@/context/LanguageContext';
import { LayoutProvider } from './context/LayoutProvider';

export default function MainLayout({ children }) {
    const { status } = useAuth();

    // Show loading spinner while authentication is being checked
    if (status === 'loading') {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <LoadingPage />
            </div>
        );
    }

    return (
        <LanguageProvider>
            <LayoutProvider>
                <Suspense
                    fallback={
                        <div className="flex h-screen w-screen items-center justify-center">
                            <LoadingPage message="Loading content..." />
                        </div>
                    }>
                    {children}
                </Suspense>
            </LayoutProvider>
        </LanguageProvider>
    );
}
