// app/main/context/LayoutProvider.jsx
"use client"

import {useSession} from 'next-auth/react';
import { createContext, useContext } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles.css';

const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {

    const { data: session, status } = useSession();

    const layoutValue = {
        session,
        status,
        isAuthenticated: !!session,
        user: session?.user || null
    };

    return (
        <LayoutContext.Provider value={layoutValue}>
            <Header />
            <div className="container">
                <div className="screen">
                    {children}
                </div>
            </div>
            <Footer />
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
