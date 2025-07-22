// context/AuthContext.tsx
import { CavosWallet } from 'cavos-service-native';
import * as SecureStore from 'expo-secure-store';
import React, {
    createContext,
    FC,
    ReactNode,
    useEffect,
    useState,
} from 'react';

interface AuthContextProps {
  wallet: CavosWallet | null;
  setWallet: (wallet: CavosWallet | null) => void;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({
  wallet: null,
  setWallet: () => {},
  loading: true,
  logout: async () => {},
});

type WalletState = {
  address: string;
  network: string;
  email: string;
  user_id: string;
  org_id: string;
  orgSecret: string;
  accessToken: string;
  refreshToken: string;
};

type AuthProviderProps = { children: ReactNode };

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<CavosWallet | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaurar de storage
  useEffect(() => {
    (async () => {
      try {
        const data = await SecureStore.getItemAsync('cavos_wallet');
        if (data) {
          const json = JSON.parse(data) as WalletState;
          // Reconstruir instancia
          const restored = new CavosWallet(
            json.address,
            json.network,
            json.email,
            json.user_id,
            json.org_id,
            json.orgSecret,
            json.accessToken,
            json.refreshToken
          );
          setWallet(restored);
        }
      } catch (e) {
        console.error('Error restaurando CavosWallet:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Persistir cada vez que cambie
  useEffect(() => {
    (async () => {
      if (wallet) {
        const state: WalletState = {
          address: wallet.getWalletInfo().address,
          network: wallet.getWalletInfo().network,
          email: wallet.getWalletInfo().email,
          user_id: wallet.getWalletInfo().user_id,
          org_id: wallet.getWalletInfo().org_id,
          // TODO orgSecret de nuestra instancia
          orgSecret: (wallet as any).orgSecret,
          accessToken: (wallet as any).accessToken,
          refreshToken: (wallet as any).refreshToken,
        };
        await SecureStore.setItemAsync('cavos_wallet', JSON.stringify(state));
      }
    })();
  }, [wallet]);

  const logout = async () => {
    setWallet(null);
    await SecureStore.deleteItemAsync('cavos_wallet');
  };

  return (
    <AuthContext.Provider value={{ wallet, setWallet, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};