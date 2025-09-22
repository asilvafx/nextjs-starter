"use client"

import { LayoutProvider } from './main/context/LayoutProvider';
import Homepage from './main/page';

const Page = () => {
    console.log('Root Page component rendered');
    return (
        <LayoutProvider><Homepage /></LayoutProvider>
    );
};

export default Page;
