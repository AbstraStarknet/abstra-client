// API Configuration
export const API_CONFIG = {
    // Update this to your actual API base URL
    BASE_URL: __DEV__ ? 'http://localhost:3000/api' : 'https://your-production-api.com/api',
    TIMEOUT: 10000, // 10 seconds
} as const;

// Cavos API Endpoints
export const CAVOS_ENDPOINTS = {
    BASE: '/cavos',
    HEALTH: '/cavos/health',
    BALANCE: '/cavos/balance',
    TRANSFER: '/cavos/transfer',
    APPROVE: '/cavos/approve',
    EXECUTE: '/cavos/execute',
} as const;

// Supported Networks
export const NETWORKS = {
    MAINNET: 'mainnet',
    SEPOLIA: 'sepolia',
    GOERLI: 'goerli',
} as const;

export type NetworkType = typeof NETWORKS[keyof typeof NETWORKS]; 