// app/main/layout.js
"use client"

import { LayoutProvider } from './context/LayoutProvider'
import { useAuth } from '@/hooks/useAuth'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { Suspense } from 'react'


export default function MainLayout({ children }) {
    const { status } = useAuth()

    // Show loading spinner while authentication is being checked
    if (status === "loading") {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                <LoadingPage />
            </div>
        )
    }

    return (
        <LayoutProvider>
            <Suspense fallback={
                <div className="h-screen w-screen flex items-center justify-center">
                    <LoadingPage message="Loading content..." />
                </div>
            }>
                {children}
            </Suspense>
        </LayoutProvider>
    )
}
