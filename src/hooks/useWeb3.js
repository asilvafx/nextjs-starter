// src/hooks/useWeb3.js
'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export const useWeb3 = () => {
    const [web3Config, setWeb3Config] = useState(null);
    const [userWallet, setUserWallet] = useState(null);
    const [balance, setBalance] = useState('0');
    const [isLoading, setIsLoading] = useState(true);
    const [isWeb3Enabled, setIsWeb3Enabled] = useState(false);

    // Fetch Web3 configuration and settings
    const fetchWeb3Config = useCallback(async () => {
        try {
            const response = await fetch('/api/web3?action=config');
            if (response.ok) {
                const config = await response.json();
                setWeb3Config(config);
                setIsWeb3Enabled(config.WEB3_ACTIVE);
                return config;
            } else {
                const error = await response.json();
                console.error('Failed to fetch Web3 config:', error.error);
                toast.error('Failed to load Web3 configuration');
            }
        } catch (error) {
            console.error('Failed to fetch Web3 config:', error);
            toast.error('Failed to connect to Web3 service');
        }
        return null;
    }, []);

    // Get or create user wallet
    const initializeWallet = useCallback(async () => {
        try {
            // Check if user has stored wallet data
            const storedWallet = localStorage.getItem('user_wallet');
            if (storedWallet) {
                const wallet = JSON.parse(storedWallet);
                setUserWallet(wallet);
                await fetchBalance(wallet.address);
                return wallet;
            }

            // If no wallet exists, create one
            const response = await fetch('/api/web3', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'create_wallet' })
            });

            if (response.ok) {
                const newWallet = await response.json();
                // Store wallet securely (in production, you'd want better security)
                localStorage.setItem('user_wallet', JSON.stringify(newWallet));
                setUserWallet(newWallet);
                await fetchBalance(newWallet.address);
                return newWallet;
            } else {
                const error = await response.json();
                console.error('Failed to create wallet:', error.error);
                toast.error('Failed to create Web3 wallet');
            }
        } catch (error) {
            console.error('Failed to initialize wallet:', error);
            toast.error('Failed to initialize Web3 wallet');
        }
        return null;
    }, []);

    // Fetch wallet balance
    const fetchBalance = useCallback(async (address) => {
        if (!address) return '0';

        try {
            const response = await fetch(`/api/web3?action=balance&address=${address}&chain=false`);
            if (response.ok) {
                const balanceData = await response.json();
                const balanceStr = balanceData.toString();
                setBalance(balanceStr);
                return balanceStr;
            } else {
                const error = await response.json();
                console.error('Failed to fetch balance:', error.error);
                // Don't show toast for balance errors as they happen frequently
                setBalance('0');
            }
        } catch (error) {
            console.error('Failed to fetch balance:', error);
            setBalance('0');
        }
        return '0';
    }, []);

    // Refresh balance
    const refreshBalance = useCallback(async () => {
        if (userWallet?.address) {
            await fetchBalance(userWallet.address);
        }
    }, [userWallet?.address, fetchBalance]);

    // Send transaction
    const sendTransaction = useCallback(
        async (toAddress, amount, note = '') => {
            if (!userWallet) {
                toast.error('No wallet available');
                return null;
            }

            try {
                const response = await fetch('/api/web3', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'send_transaction',
                        amount: amount,
                        toAddress: toAddress,
                        fromAddress: userWallet.address,
                        privateKey: userWallet.privateKey,
                        useNativeCurrency: false
                    })
                });

                if (response.ok) {
                    const result = await response.json();

                    if (!result.tx_hash) {
                        toast.error('Transaction failed - no transaction hash received');
                        return null;
                    }

                    // Save transaction record to database
                    try {
                        const dbResponse = await fetch('/api/query/transactions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                hash: result.tx_hash,
                                type: 'sent',
                                amount: amount.toString(),
                                toAddress: toAddress,
                                fromAddress: userWallet.address,
                                status: 'pending',
                                note: note,
                                gasUsed: result.gasUsed?.toString() || '21000',
                                gasPrice: '0' // Will be updated when transaction is confirmed
                            })
                        });

                        if (!dbResponse.ok) {
                            const dbError = await dbResponse.json();
                            console.error('Failed to save transaction record:', dbError.error);
                        }
                    } catch (dbError) {
                        console.error('Failed to save transaction record:', dbError);
                        // Don't fail the transaction if DB save fails
                    }

                    // Refresh balance after transaction
                    setTimeout(() => refreshBalance(), 2000);
                    return result;
                } else {
                    const error = await response.json();
                    toast.error(error.error || 'Transaction failed');
                    return null;
                }
            } catch (error) {
                console.error('Transaction failed:', error);
                toast.error('Transaction failed');
                return null;
            }
        },
        [userWallet, refreshBalance]
    );

    // Get transaction status
    const getTransactionStatus = useCallback(async (txHash) => {
        try {
            const response = await fetch(`/api/web3?action=tx_status&hash=${txHash}`);
            if (response.ok) {
                const result = await response.json();
                return result;
            } else {
                const error = await response.json();
                console.error('Failed to get transaction status:', error.error);
            }
        } catch (error) {
            console.error('Failed to get transaction status:', error);
        }
        return null;
    }, []);

    // Fetch transaction history
    const fetchTransactionHistory = useCallback(async (page = 1, limit = 50) => {
        try {
            const response = await fetch(`/api/query/transactions?page=${page}&limit=${limit}`);
            if (response.ok) {
                const result = await response.json();
                return result.data || [];
            }
        } catch (error) {
            console.error('Failed to fetch transaction history:', error);
        }
        return [];
    }, []);

    // Update transaction status
    const updateTransactionStatus = useCallback(async (hash, status) => {
        try {
            const response = await fetch('/api/query/transactions', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    hash: hash,
                    status: status
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Failed to update transaction status:', error);
            return false;
        }
    }, []);

    // Copy address to clipboard
    const copyAddress = useCallback(async () => {
        if (userWallet?.address) {
            try {
                await navigator.clipboard.writeText(userWallet.address);
                toast.success('Address copied to clipboard');
            } catch (_error) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = userWallet.address;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    toast.success('Address copied to clipboard');
                } catch (_err) {
                    toast.error('Failed to copy address');
                }
                document.body.removeChild(textArea);
            }
        }
    }, [userWallet?.address]);

    // Format balance for display
    const formatBalance = useCallback(
        (balanceValue = balance) => {
            const num = parseFloat(balanceValue);
            if (num >= 1000000) {
                return `${(num / 1000000).toFixed(2)}M`;
            } else if (num >= 1000) {
                return `${(num / 1000).toFixed(2)}K`;
            } else if (num >= 1) {
                return num.toFixed(4);
            } else {
                return num.toFixed(6);
            }
        },
        [balance]
    );

    // Format address for display
    const formatAddress = useCallback(
        (address = userWallet?.address) => {
            if (!address) return '';
            return `${address.slice(0, 6)}...${address.slice(-4)}`;
        },
        [userWallet?.address]
    );

    // Initialize Web3 when component mounts
    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            const config = await fetchWeb3Config();

            if (config?.WEB3_ACTIVE) {
                await initializeWallet();
            }

            setIsLoading(false);
        };

        initialize();
    }, [fetchWeb3Config, initializeWallet]);

    return {
        // State
        web3Config,
        userWallet,
        balance,
        isLoading,
        isWeb3Enabled,

        // Methods
        fetchBalance,
        refreshBalance,
        sendTransaction,
        getTransactionStatus,
        fetchTransactionHistory,
        updateTransactionStatus,
        copyAddress,
        formatBalance,
        formatAddress,

        // Computed values
        formattedBalance: formatBalance(),
        formattedAddress: formatAddress()
    };
};

// Hook for Web3 settings only (lighter weight)
export const useWeb3Settings = () => {
    const [isWeb3Enabled, setIsWeb3Enabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch(`/api/query/public/site_settings?_t=${Date.now()}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data?.length > 0) {
                        const settings = data.data[0];
                        setIsWeb3Enabled(settings.web3Active === true);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch Web3 settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    return {
        isWeb3Enabled,
        isLoading
    };
};
