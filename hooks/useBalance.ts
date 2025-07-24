// hooks/useBalance.ts
import { useCavos } from '@/hooks/useCavos';
import { useEffect, useState } from 'react';

const BACKEND_URL = 'https://tu-backend.com';

export function useBalance(
  tokenAddress: string,
  decimals: string = '18'
) {
  const { wallet } = useCavos();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!wallet) return;

    (async () => {
      setLoading(true);
      try {
        // Sólo extraemos la dirección, no accessToken
        const { address: walletAddress } = wallet.getWalletInfo();
        const res = await fetch(`${BACKEND_URL}/api/cavos/balance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletAddress, tokenAddress, decimals }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || res.statusText);
        }
        const json = await res.json();
        // tu controller devuelve { success, message, data: { balance } }
        setBalance(Number(json.data.balance));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [wallet, tokenAddress, decimals]);

  return { balance, loading, error };
}