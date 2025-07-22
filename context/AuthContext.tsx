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
  /** Instancia activa de CavosWallet (o null) */
  wallet: CavosWallet | null;
  /** Setter para actualizar el wallet (p. ej. tras login) */
  setWallet: (wallet: CavosWallet | null) => void;
  /** Indica si estamos restaurando el wallet desde storage */
  loading: boolean;
  /** Cierra sesión y elimina el wallet */
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({
  wallet: null,
  setWallet: () => {},
  loading: true,
  logout: async () => {},
});

type AuthProviderProps = { children: ReactNode };

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<CavosWallet | null>(null);
  const [loading, setLoading] = useState(true);

  // Al montar, intentamos restaurar el wallet de SecureStore
  useEffect(() => {
    (async () => {
      try {
        const data = await SecureStore.getItemAsync('cavos_wallet');
        if (data) {
          const json = JSON.parse(data);
          const restored = CavosWallet.fromJSON(json);
          setWallet(restored);
        }
      } catch (e) {
        console.error('Error restaurando CavosWallet:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Cada vez que cambie wallet (p. ej. tras login), lo persistimos
  useEffect(() => {
    (async () => {
      if (wallet) {
        const json = JSON.stringify(wallet.toJSON());
        await SecureStore.setItemAsync('cavos_wallet', json);
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