import { useCallback, useState } from 'react';
import { cavosApi, CavosApiError } from '../lib/services/cavosApi';
import type {
  ApproveTokensRequest,
  ApproveTokensResponse,
  ExecuteCustomCallsRequest,
  ExecuteCustomCallsResponse,
  GetBalanceRequest,
  GetBalanceResponse,
  HealthCheckResponse,
  TransferTokensRequest,
  TransferTokensResponse,
} from '../lib/types/cavos';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useCavos = () => {
  const [balanceState, setBalanceState] = useState<UseApiState<GetBalanceResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const [transferState, setTransferState] = useState<UseApiState<TransferTokensResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const [approveState, setApproveState] = useState<UseApiState<ApproveTokensResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const [executeState, setExecuteState] = useState<UseApiState<ExecuteCustomCallsResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const [healthState, setHealthState] = useState<UseApiState<HealthCheckResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  // Helper function to handle API calls
  const handleApiCall = useCallback(
    async <T>(
      apiCall: () => Promise<{ data?: T }>,
      setState: React.Dispatch<React.SetStateAction<UseApiState<T>>>
    ) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiCall();
        setState({
          data: response.data || null,
          loading: false,
          error: null,
        });
        return response.data;
      } catch (error) {
        const errorMessage = error instanceof CavosApiError
          ? error.message
          : 'An unexpected error occurred';

        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
        throw error;
      }
    },
    []
  );

  // Get token balance
  const getBalance = useCallback(
    async (request: GetBalanceRequest) => {
      return handleApiCall(
        () => cavosApi.getBalance(request),
        setBalanceState
      );
    },
    [handleApiCall]
  );

  // Transfer tokens
  const transferTokens = useCallback(
    async (request: TransferTokensRequest) => {
      return handleApiCall(
        () => cavosApi.transferTokens(request),
        setTransferState
      );
    },
    [handleApiCall]
  );

  // Approve tokens
  const approveTokens = useCallback(
    async (request: ApproveTokensRequest) => {
      return handleApiCall(
        () => cavosApi.approveTokens(request),
        setApproveState
      );
    },
    [handleApiCall]
  );

  // Execute custom calls
  const executeCustomCalls = useCallback(
    async (request: ExecuteCustomCallsRequest) => {
      return handleApiCall(
        () => cavosApi.executeCustomCalls(request),
        setExecuteState
      );
    },
    [handleApiCall]
  );

  // Health check
  const checkHealth = useCallback(async () => {
    return handleApiCall(
      () => cavosApi.healthCheck(),
      setHealthState
    );
  }, [handleApiCall]);

  // Clear functions
  const clearBalance = useCallback(() => {
    setBalanceState({ data: null, loading: false, error: null });
  }, []);

  const clearTransfer = useCallback(() => {
    setTransferState({ data: null, loading: false, error: null });
  }, []);

  const clearApprove = useCallback(() => {
    setApproveState({ data: null, loading: false, error: null });
  }, []);

  const clearExecute = useCallback(() => {
    setExecuteState({ data: null, loading: false, error: null });
  }, []);

  const clearHealth = useCallback(() => {
    setHealthState({ data: null, loading: false, error: null });
  }, []);

  return {
    // States
    balance: balanceState,
    transfer: transferState,
    approve: approveState,
    execute: executeState,
    health: healthState,

    // Actions
    getBalance,
    transferTokens,
    approveTokens,
    executeCustomCalls,
    checkHealth,

    // Clear functions
    clearBalance,
    clearTransfer,
    clearApprove,
    clearExecute,
    clearHealth,

    // Utility
    isLoading: balanceState.loading || transferState.loading || approveState.loading || executeState.loading || healthState.loading,
  };
};