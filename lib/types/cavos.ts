// Base API Response Type
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
    stack?: string; // Only in development
}

// Network Types
export type NetworkType = 'mainnet' | 'sepolia' | 'goerli';

// Ethereum/Starknet Address Type
export type Address = `0x${string}`;

// Balance Request/Response
export interface GetBalanceRequest {
    walletAddress: Address;
    tokenAddress: Address;
    decimals?: string;
}

export interface GetBalanceResponse {
    walletAddress: Address;
    tokenAddress: Address;
    balance: string;
    decimals: string;
}

// Transfer Request/Response
export interface TransferTokensRequest {
    network: NetworkType;
    fromAddress: Address;
    toAddress: Address;
    tokenAddress: Address;
    amount: number;
    decimals?: number;
}

export interface TransferTokensResponse {
    network: NetworkType;
    fromAddress: Address;
    toAddress: Address;
    tokenAddress: Address;
    amount: number;
    decimals: number;
    transactionResult: TransactionResult;
}

// Approve Request/Response
export interface ApproveTokensRequest {
    network: NetworkType;
    fromAddress: Address;
    hashedPrivateKey: string;
    spenderAddress: Address;
    tokenAddress: Address;
    amount: number;
    decimals?: number;
}

export interface ApproveTokensResponse {
    network: NetworkType;
    fromAddress: Address;
    spenderAddress: Address;
    tokenAddress: Address;
    amount: number;
    decimals: number;
    transactionResult: TransactionResult;
}

// Custom Calls Request/Response
export interface ContractCall {
    contractAddress: Address;
    entrypoint: string;
    calldata: any[];
}

export interface ExecuteCustomCallsRequest {
    network: NetworkType;
    fromAddress: Address;
    hashedPrivateKey: string;
    calls: ContractCall[];
}

export interface ExecuteCustomCallsResponse {
    network: NetworkType;
    fromAddress: Address;
    callsCount: number;
    calls: ContractCall[];
    transactionResult: TransactionResult;
}

// Transaction Result Type (adjust based on actual Cavos SDK response)
export interface TransactionResult {
    transaction_hash?: string;
    status?: string;
    block_number?: number;
    gas_used?: string;
    [key: string]: any; // Allow for additional fields
}

// Health Check Response
export interface HealthCheckResponse {
    success: boolean;
    message: string;
    timestamp: string;
    service?: string;
}

// API Info Response
export interface ApiInfoResponse {
    success: boolean;
    message: string;
    version: string;
    endpoints: Record<string, string>;
    documentation: string;
    timestamp: string;
}

// Error Types
export interface ApiError {
    success: false;
    message: string;
    errors?: string[];
    status?: number;
} 