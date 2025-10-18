// app/api/web3/cache/route.js
import { NextResponse } from 'next/server';
import { clearWeb3ConfigCache } from '@/lib/server/web3';

export async function POST(_request) {
    try {
        clearWeb3ConfigCache();
        return NextResponse.json({
            success: true,
            message: 'Web3 configuration cache cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing Web3 cache:', error);
        return NextResponse.json({ success: false, error: 'Failed to clear Web3 cache' }, { status: 500 });
    }
}
