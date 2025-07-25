import { useCavos } from '@/hooks/useCavos';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export type WalletContact = {
  id: string;
  name: string;
  wallet_address: string;
  created_at: string;
};

const CONTACTS_STORAGE_KEY = 'wallet_contacts';
const CONTACTS_API_URL = 'http://192.168.68.88:3000/api/contacts';

export function useContacts() {
  const { wallet } = useCavos();
  const [contacts, setContacts] = useState<WalletContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load contacts from local storage and sync with server
  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      // Load from local storage first (faster UX)
      const localData = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
      const localContacts: WalletContact[] = localData ? JSON.parse(localData) : [];
      setContacts(localContacts);

      // Sync with server (background)
      try {
        const response = await fetch(CONTACTS_API_URL);

        if (response.ok) {
          const serverResponse = await response.json();

          // Handle server response format: { success: true, data: [...] }
          if (serverResponse.success && serverResponse.data) {
            setContacts(serverResponse.data);

            // Update local storage with server data
            await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(serverResponse.data));
          } else {
            console.error('Server returned error:', serverResponse.error);
          }
        } else {
          console.error('Server request failed:', response.status, response.statusText);
        }
      } catch (syncError) {
        console.log('Sync with server failed, using local data:', syncError);
      }

    } catch (err: any) {
      setError(err.message);
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Find contact by name (for AI agent)
  const findContactByName = useCallback((name: string): WalletContact | null => {
    const searchName = name.toLowerCase().trim();
    return contacts.find(c =>
      c.name.toLowerCase().includes(searchName)
    ) || null;
  }, [contacts]);

  // Transfer to contact using server endpoint
  const transferToContact = useCallback(async (
    contactName: string,
    amount: number,
    network: string = 'sepolia',
    tokenAddress: string,
    decimals: number = 6
  ): Promise<{ success: boolean; error?: string }> => {
    if (!wallet) {
      return { success: false, error: 'User not authenticated' };
    }

    const walletInfo = wallet.getWalletInfo();

    try {
      const response = await fetch(`${CONTACTS_API_URL}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: contactName.trim(),
          network,
          fromAddress: walletInfo.address,
          tokenAddress,
          amount,
          decimals,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Transfer failed' };
      }
    } catch (err: any) {
      console.error('Error transferring to contact:', err);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [wallet]);

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  return {
    contacts,
    loading,
    error,
    findContactByName,
    transferToContact,
    refreshContacts: loadContacts
  };
}