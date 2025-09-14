// context/providers.jsx
"use client";

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from "next-themes";
import SafeCartProvider from "./SafeCartProvider";

export default function Providers({ children }) {

    return (
        <SessionProvider>
            <SafeCartProvider>
                <ThemeProvider attribute="class" enableSystem={true} defaultTheme="system">

                    {children}
                </ThemeProvider>
            </SafeCartProvider>
        </SessionProvider>
    );
}
