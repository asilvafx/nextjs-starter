// app/shop/context/LayoutProvider.jsx
'use client';

import { createContext, useContext } from 'react';

import '@/app/main/styles.css';

const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
    return (
        <LayoutContext.Provider value={{}}>
            <div className='container'>
                <div className='screen'>{children}</div>
            </div>
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a Provider');
    }
    return context;
};
