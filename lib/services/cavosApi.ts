import { API_CONFIG, CAVOS_ENDPOINTS } from '../../constants/api';
import type {
    ApiInfoResponse,
    ApiResponse,
    ApproveTokensRequest,
    ApproveTokensResponse,
    ExecuteCustomCallsRequest,
    ExecuteCustomCallsResponse,
    GetBalanceRequest,
    GetBalanceResponse,
    HealthCheckResponse,
    TransferTokensRequest,
    TransferTokensResponse
} from '../types/cavos';

class CavosApiError extends Error {
    constructor(
        message: string,
        public status?: number,
        public errors?: string[]
    ) {
        super(message);
        this.name = 'CavosApiError';
    }
}

class CavosApiClient {
    private baseUrl: string;
    private timeout: number;

    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
    }

    /**
     * Generic HTTP request method
     */
    private async request<T>(
        endpoint: string,
        options: {
            method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
            body?: any;
            headers?: Record<string, string>;
        } = {}
    ): Promise<T> {
        const { method = 'GET', body, headers = {} } = options;

        const url = `${this.baseUrl}${endpoint}`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            if (!response.ok) {
                throw new CavosApiError(
                    data.message || 'Request failed',
                    response.status,
                    data.errors
                );
            }

            return data;
        } catch (error) {
            if (error instanceof CavosApiError) {
                throw error;
            }

            if (error.name === 'AbortError') {
                throw new CavosApiError('Request timeout');
            }

            throw new CavosApiError(
                error.message || 'Network error',
                error.status
            );
        }
    }

    /**
     * Health check endpoint
     */
    async healthCheck(): Promise<ApiResponse<HealthCheckResponse>> {
        return this.request<ApiResponse<HealthCheckResponse>>(CAVOS_ENDPOINTS.HEALTH);
    }

    /**
     * Get API information
     */
    async getApiInfo(): Promise<ApiResponse<ApiInfoResponse>> {
        return this.request<ApiResponse<ApiInfoResponse>>(CAVOS_ENDPOINTS.BASE);
    }

    /**
     * Get token balance for a wallet
     */
    async getBalance(request: GetBalanceRequest): Promise<ApiResponse<GetBalanceResponse>> {
        return this.request<ApiResponse<GetBalanceResponse>>(CAVOS_ENDPOINTS.BALANCE, {
            method: 'POST',
            body: request,
        });
    }

    /**
     * Transfer tokens between wallets
     */
    async transferTokens(request: TransferTokensRequest): Promise<ApiResponse<TransferTokensResponse>> {
        return this.request<ApiResponse<TransferTokensResponse>>(CAVOS_ENDPOINTS.TRANSFER, {
            method: 'POST',
            body: request,
        });
    }

    /**
     * Approve tokens for spending by another address
     */
    async approveTokens(request: ApproveTokensRequest): Promise<ApiResponse<ApproveTokensResponse>> {
        return this.request<ApiResponse<ApproveTokensResponse>>(CAVOS_ENDPOINTS.APPROVE, {
            method: 'POST',
            body: request,
        });
    }

    /**
     * Execute custom contract calls
     */
    async executeCustomCalls(request: ExecuteCustomCallsRequest): Promise<ApiResponse<ExecuteCustomCallsResponse>> {
        return this.request<ApiResponse<ExecuteCustomCallsResponse>>(CAVOS_ENDPOINTS.EXECUTE, {
            method: 'POST',
            body: request,
        });
    }

    /**
     * Update base URL (useful for switching between environments)
     */
    setBaseUrl(url: string): void {
        this.baseUrl = url;
    }

    /**
     * Update timeout
     */
    setTimeout(timeout: number): void {
        this.timeout = timeout;
    }
}

// Export singleton instance
export const cavosApi = new CavosApiClient();

// Export class for testing or multiple instances
export { CavosApiClient, CavosApiError };
