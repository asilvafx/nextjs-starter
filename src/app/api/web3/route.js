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
    loadWeb3Config
} from '@/lib/server/web3.js';

// GET - Get Web3 configuration and status
async function handleGet(request) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');

        switch (action) {
            case 'config':
                return NextResponse.json(await loadWeb3Config());

            case 'gas_price':
                const gasPriceResult = await getGasPrice();
                if (gasPriceResult.success) {
                    return NextResponse.json(gasPriceResult.gasPrice);
                } else {
                    return NextResponse.json(
                        { error: gasPriceResult.error },
                        { status: 500 }
                    );
                }

            case 'validate_wallet':
                const address = url.searchParams.get('address');
                if (!address) {
                    return NextResponse.json(
                        { error: 'Wallet address is required' },
                        { status: 400 }
                    );
                }
                const validationResult = await validateWallet(address);
                if (validationResult.success) {
                    return NextResponse.json(validationResult.isValid);
                } else {
                    return NextResponse.json(
                        { error: validationResult.error },
                        { status: 500 }
                    );
                }

            case 'balance':
                const walletAddress = url.searchParams.get('address');
                const chain = url.searchParams.get('chain') === 'true';
                
                if (!walletAddress) {
                    return NextResponse.json(
                        { error: 'Wallet address is required' },
                        { status: 400 }
                    );
                }
                
                const balanceResult = await getTokenBalance(walletAddress, chain);
                if (balanceResult.success) {
                    return NextResponse.json(balanceResult.balance);
                } else {
                    return NextResponse.json(
                        { error: balanceResult.error },
                        { status: 500 }
                    );
                }

            case 'tx_status':
                const txHash = url.searchParams.get('hash');
                if (!txHash) {
                    return NextResponse.json(
                        { error: 'Transaction hash is required' },
                        { status: 400 }
                    );
                }
                const statusResult = await getTxStatus(txHash);
                if (statusResult.success) {
                    return NextResponse.json(statusResult);
                } else {
                    return NextResponse.json(
                        { error: statusResult.error },
                        { status: 500 }
                    );
                }

            default:
                return NextResponse.json(await loadWeb3Config());
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
                const walletResult = await createWallet();
                if (walletResult.success) {
                    return NextResponse.json({
                        address: walletResult.address,
                        privateKey: walletResult.privateKey
                    });
                } else {
                    return NextResponse.json(
                        { error: walletResult.error },
                        { status: 500 }
                    );
                }

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

                if (result.success) {
                    return NextResponse.json({
                        tx_hash: result.tx_hash,
                        block: result.block,
                        gasUsed: result.gasUsed,
                        status: result.status
                    });
                } else {
                    return NextResponse.json(
                        { error: result.error },
                        { status: 500 }
                    );
                }

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