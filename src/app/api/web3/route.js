// app/api/web3/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth.js';
import {
    validateWallet,
    getGasPrice,
    createWallet,
    getTxStatus,
    sendTransaction,
    getTokenBalance,
    getWeb3Config
} from '@/lib/server/web3.js';

// GET - Get Web3 configuration and status
async function handleGet(request) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');

        switch (action) {
            case 'config':
                return NextResponse.json(await getWeb3Config());

            case 'gas_price':
                return NextResponse.json(await getGasPrice());

            case 'validate_wallet':
                const address = url.searchParams.get('address');
                if (!address) {
                    return NextResponse.json(
                        { error: 'Wallet address is required' },
                        { status: 400 }
                    );
                }
                return NextResponse.json(await validateWallet(address));

            case 'balance':
                const walletAddress = url.searchParams.get('address');
                const chain = url.searchParams.get('chain') === 'true';
                
                if (!walletAddress) {
                    return NextResponse.json(
                        { error: 'Wallet address is required' },
                        { status: 400 }
                    );
                }
                
                return NextResponse.json(await getTokenBalance(walletAddress, chain));

            case 'tx_status':
                const txHash = url.searchParams.get('hash');
                if (!txHash) {
                    return NextResponse.json(
                        { error: 'Transaction hash is required' },
                        { status: 400 }
                    );
                }
                return NextResponse.json(await getTxStatus(txHash));

            default:
                return NextResponse.json(await getWeb3Config());
        }
    } catch (error) {
        console.error('Web3 API GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}

// POST - Execute Web3 operations
async function handlePost(request) {
    try {
        const body = await request.json();
        const { action } = body;

        switch (action) {
            case 'create_wallet':
                return NextResponse.json(await createWallet());

            case 'send_transaction':
                const {
                    amount,
                    toAddress,
                    fromAddress,
                    privateKey,
                    useNativeCurrency = false
                } = body;

                // Validate required fields
                if (!amount || !toAddress || !fromAddress || !privateKey) {
                    return NextResponse.json(
                        { error: 'Missing required fields: amount, toAddress, fromAddress, privateKey' },
                        { status: 400 }
                    );
                }

                // Validate amount
                if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
                    return NextResponse.json(
                        { error: 'Invalid amount' },
                        { status: 400 }
                    );
                }

                const result = await sendTransaction(
                    parseFloat(amount),
                    toAddress,
                    fromAddress,
                    privateKey,
                    useNativeCurrency
                );

                return NextResponse.json(result);

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Web3 API POST error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}

// Export handlers with authentication
export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);