import Web3 from 'web3';
import DBService from '@/data/rest.db.js';

let cachedConfig = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Load Web3 configuration from database
const loadWeb3Config = async () => {
    try {
        // Check cache first
        if (cachedConfig && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
            return cachedConfig;
        }

        const settingsData = await DBService.readAll('site_settings');
        
        if (!settingsData || Object.keys(settingsData).length === 0) {
            console.log('No site settings found, using default Web3 config');
            cachedConfig = {
                WEB3_ACTIVE: false,
                WEB3_CONTRACT_ADDRESS: "",
                WEB3_CONTRACT_SYMBOL: "",
                WEB3_CHAIN_SYMBOL: "",
                WEB3_INFURA_RPC: "",
                WEB3_CHAIN_ID: 1,
                WEB3_NETWORK_NAME: "Ethereum Mainnet"
            };
        } else {
            // Get the first settings record
            const settings = Object.values(settingsData)[0];
            
            cachedConfig = {
                WEB3_ACTIVE: settings.web3Active || false,
                WEB3_CONTRACT_ADDRESS: settings.web3ContractAddress || "",
                WEB3_CONTRACT_SYMBOL: settings.web3ContractSymbol || "",
                WEB3_CHAIN_SYMBOL: settings.web3ChainSymbol || "",
                WEB3_INFURA_RPC: settings.web3InfuraRpc || "",
                WEB3_CHAIN_ID: settings.web3ChainId || 1,
                WEB3_NETWORK_NAME: settings.web3NetworkName || "Ethereum Mainnet"
            };
        }

        cacheTime = Date.now();
        return cachedConfig;
    } catch (error) {
        console.error('Error loading Web3 config from database:', error);
        // Return default config on error
        return {
            WEB3_ACTIVE: false,
            WEB3_CONTRACT_ADDRESS: "",
            WEB3_CONTRACT_SYMBOL: "",
            WEB3_CHAIN_SYMBOL: "",
            WEB3_INFURA_RPC: "",
            WEB3_CHAIN_ID: 1,
            WEB3_NETWORK_NAME: "Ethereum Mainnet"
        };
    }
};

// Clear cache when config changes
export const clearWeb3ConfigCache = () => {
    cachedConfig = null;
    cacheTime = null;
};

// Get Web3 instance
let web3Instance = null;
const getWeb3Instance = async () => {
    const config = await loadWeb3Config();
    
    if (!config.WEB3_ACTIVE || !config.WEB3_INFURA_RPC) {
        return null;
    }

    if (!web3Instance || web3Instance.currentProvider.host !== config.WEB3_INFURA_RPC) {
        web3Instance = new Web3(new Web3.providers.HttpProvider(config.WEB3_INFURA_RPC));
    }

    return web3Instance;
};

const balanceOfABI = [
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "balance",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
];

const transferABI = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "type": "function"
    }
];



export const validateWallet = async (address) => {
    const web3 = await getWeb3Instance();
    if (!web3) {
        return { error: 'Web3 is not configured or RPC provider is not available.' };
    }
    
    try {
        const isValid = web3.utils.isAddress(address);
        return { success: true, isValid };
    } catch (error) {
        return { error: `Error validating wallet address: ${error.message}` };
    }
};
export const getGasPrice = async () => {
    const web3 = await getWeb3Instance();
    if (!web3) {
        return { error: 'Web3 is not configured or RPC provider is not available.' };
    }

    try {
        const gasPrice = await web3.eth.getGasPrice();
        const ethPrice = web3.utils.fromWei(gasPrice, "Gwei");
        const ratePrice = parseFloat(ethPrice / 10000);
        return { success: true, gasPrice: ratePrice.toFixed(3), gasPriceWei: gasPrice };
    } catch (error) {
        return { error: `Error fetching gas price: ${error.message}` };
    }
};
export const createWallet = async () => {
    const web3 = await getWeb3Instance();
    if (!web3) {
        return { error: 'Web3 is not configured or RPC provider is not available.' };
    }

    try {
        const wallet = web3.eth.accounts.create();
        return { 
            success: true, 
            wallet: {
                address: wallet.address,
                privateKey: wallet.privateKey
            }
        };
    } catch (error) {
        return { error: `Error creating wallet: ${error.message}` };
    }
};
export const getTxStatus = async (hash) => {
    const web3 = await getWeb3Instance();
    if (!web3) {
        return { error: 'Web3 is not configured or RPC provider is not available.' };
    }

    try {
        // Get transaction receipt
        const receipt = await web3.eth.getTransactionReceipt(hash);

        if (receipt) {
            return { success: true, receipt };
        } else {
            return { error: 'Transaction is not mined yet or does not exist.' };
        }
    } catch (error) {
        return { error: `Error fetching transaction status: ${error.message}` };
    }
};
export const sendTransaction = async (amountToSend, destinationAddress, tokenHolder, holderSecretKey, inChain = false, txType = 'transfer') => {
    const web3 = await getWeb3Instance();
    const config = await loadWeb3Config();
    
    if (!web3) {
        return { error: 'Web3 is not configured or RPC provider is not available.' };
    }

    try {
        const amountInWei = web3.utils.toWei(amountToSend.toString(), "ether");

        const nonce = await web3.eth.getTransactionCount(tokenHolder);
        const gasPrice = await web3.eth.getGasPrice();
        const gasLimit = 200000;

        let params = {};

        if (inChain) {
            // Native cryptocurrency transfer
            params = {
                to: destinationAddress,
                value: amountInWei,
                nonce: web3.utils.toHex(nonce),
                gasPrice: web3.utils.toHex(gasPrice),
                gas: web3.utils.toHex(gasLimit),
            };
        } else {
            // ERC-20 token transfer
            if (!config.WEB3_CONTRACT_ADDRESS) {
                return { error: 'Token contract address is not configured.' };
            }

            const web3contract = new web3.eth.Contract(transferABI, config.WEB3_CONTRACT_ADDRESS, { from: tokenHolder });

            params = {
                from: tokenHolder,
                to: config.WEB3_CONTRACT_ADDRESS,
                nonce: web3.utils.toHex(nonce),
                value: '0x00',
                data: web3contract.methods.transfer(destinationAddress, amountInWei).encodeABI(),
                gasPrice: web3.utils.toHex(gasPrice),
                gasLimit: web3.utils.toHex(gasLimit),
            };
        }

        const signedTx = await web3.eth.accounts.signTransaction(params, holderSecretKey);

        let transactionHash = "";
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .once("transactionHash", async (txHash) => {
                transactionHash = txHash;
            })
            .on('error', function(error) { 
                console.log("Transaction error:", error); 
            });

        return {
            success: true,
            txHash: transactionHash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed,
            receipt
        };

    } catch (error) {
        console.error("Transaction failed:", error);
        return { error: `Transaction failed: ${error.message}` };
    }
};

export const getTokenBalance = async (tokenHolder, chain = false) => {
    const web3 = await getWeb3Instance();
    const config = await loadWeb3Config();
    
    if (!web3) {
        return { error: 'Web3 is not configured or RPC provider is not available.' };
    }

    try {
        let balance, formattedBalance;
        
        if (chain) {
            // Get native blockchain token balance (ETH, MATIC, etc.)
            balance = await web3.eth.getBalance(tokenHolder);
            formattedBalance = parseFloat(web3.utils.fromWei(balance, "ether"));
            
            return {
                success: true,
                balance: formattedBalance.toFixed(6),
                balanceWei: balance,
                symbol: config.WEB3_CHAIN_SYMBOL || 'ETH',
                type: 'native'
            };
        } else {
            // Get ERC-20 token balance
            if (!config.WEB3_CONTRACT_ADDRESS) {
                return { error: 'Token contract address is not configured.' };
            }
            
            const contract = new web3.eth.Contract(balanceOfABI, config.WEB3_CONTRACT_ADDRESS);
            const result = await contract.methods.balanceOf(tokenHolder).call();
            formattedBalance = parseFloat(web3.utils.fromWei(result, "ether"));
            
            return {
                success: true,
                balance: formattedBalance.toFixed(6),
                balanceWei: result,
                symbol: config.WEB3_CONTRACT_SYMBOL || 'TOKEN',
                type: 'erc20',
                contractAddress: config.WEB3_CONTRACT_ADDRESS
            };
        }
    } catch (error) {
        console.error("Failed to fetch balance:", error);
        return { error: `Failed to fetch balance: ${error.message}` };
    }
};

// Get Web3 configuration
export const getWeb3Config = async () => {
    try {
        const config = await loadWeb3Config();
        return {
            success: true,
            config: {
                active: config.WEB3_ACTIVE,
                networkName: config.WEB3_NETWORK_NAME,
                chainId: config.WEB3_CHAIN_ID,
                chainSymbol: config.WEB3_CHAIN_SYMBOL,
                contractSymbol: config.WEB3_CONTRACT_SYMBOL,
                hasContract: !!config.WEB3_CONTRACT_ADDRESS,
                rpcConfigured: !!config.WEB3_INFURA_RPC
            }
        };
    } catch (error) {
        return { error: `Failed to get Web3 config: ${error.message}` };
    }
};
