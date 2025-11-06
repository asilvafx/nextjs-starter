'use client';

import { LayoutProvider } from './main/context/LayoutProvider';
import Homepage from './main/page';

const Page = () => { 
    return (
        <LayoutProvider>
            <Homepage />
        </LayoutProvider>
    );
};

export default Page;
