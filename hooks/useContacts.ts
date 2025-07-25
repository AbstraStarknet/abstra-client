import { useCavos } from '@/hooks/useCavos';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export type WalletContact = {
  id: string;
  name: string;
  email: string;
  wallet_address: string; // Server uses snake_case
  added_by: string;
  created_at: string;
};

const CONTACTS_STORAGE_KEY = 'wallet_contacts';
const CONTACTS_API_URL = 'http://192.168.68.88:3000/api/contacts';

export function useContacts() {
  const { wallet } = useCavos();
  const [contacts, setContacts] = useState<WalletContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current user email (addedBy parameter)
  const currentUserEmail = wallet?.getWalletInfo().email;

  // Load contacts from local storage and sync with server
  const loadContacts = useCallback(async () => {
    if (!currentUserEmail) return;

    setLoading(true);
    try {
      // Load from local storage first (faster UX)
      const localData = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
      const localContacts: WalletContact[] = localData ? JSON.parse(localData) : [];

      // Filter contacts for current user
      const userContacts = localContacts.filter(c => c.added_by === currentUserEmail);
      setContacts(userContacts);

      // Sync with server (background)
      try {
        const response = await fetch(`${CONTACTS_API_URL}?userEmail=${encodeURIComponent(currentUserEmail)}`);

        if (response.ok) {
          const serverResponse = await response.json();

          // Handle server response format: { success: true, data: [...], count: x }
          if (serverResponse.success && serverResponse.data) {
            setContacts(serverResponse.data);

            // Update local storage with server data
            const allContacts = [...localContacts.filter(c => c.added_by !== currentUserEmail), ...serverResponse.data];
            await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(allContacts));
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
  }, [currentUserEmail]);

  // Add new contact
  const addContact = useCallback(async (name: string, email: string, walletAddress: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUserEmail) {
      return { success: false, error: 'User not authenticated' };
    }

    const contactData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      walletAddress: walletAddress.trim(),
      addedBy: currentUserEmail, // Handle addedBy behind the scenes
    };

    try {
      // Send to server first
      const response = await fetch(CONTACTS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Server success - update local storage and state
        const newContact: WalletContact = result.data;

        const localData = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
        const localContacts: WalletContact[] = localData ? JSON.parse(localData) : [];
        localContacts.push(newContact);
        await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(localContacts));

        // Update state
        setContacts(prev => [...prev, newContact]);

        return { success: true };
      } else {
        // Server error
        const errorMessage = result.error || 'Failed to add contact';

        // If it's a network error, save locally for later sync
        if (!response.ok && response.status >= 500) {
          const tempContact: WalletContact = {
            id: `temp_${Date.now()}`,
            name: contactData.name,
            email: contactData.email,
            wallet_address: contactData.walletAddress,
            added_by: contactData.addedBy,
            created_at: new Date().toISOString(),
          };

          const localData = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
          const localContacts: WalletContact[] = localData ? JSON.parse(localData) : [];
          localContacts.push(tempContact);
          await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(localContacts));

          setContacts(prev => [...prev, tempContact]);
          return { success: true }; // Show success to user, sync later
        }

        return { success: false, error: errorMessage };
      }
    } catch (err: any) {
      console.error('Error adding contact:', err);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [currentUserEmail]);

  // Remove contact
  const removeContact = useCallback(async (contactId: string): Promise<boolean> => {
    if (!currentUserEmail) return false;

    try {
      // Remove from server first
      const response = await fetch(`${CONTACTS_API_URL}/${contactId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Server success - update local storage and state
          const localData = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
          const localContacts: WalletContact[] = localData ? JSON.parse(localData) : [];
          const filteredContacts = localContacts.filter(c => c.id !== contactId);
          await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(filteredContacts));

          setContacts(prev => prev.filter(c => c.id !== contactId));
          return true;
        }
      }

      // If server fails, still remove locally
      const localData = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
      const localContacts: WalletContact[] = localData ? JSON.parse(localData) : [];
      const filteredContacts = localContacts.filter(c => c.id !== contactId);
      await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(filteredContacts));

      setContacts(prev => prev.filter(c => c.id !== contactId));
      return true;

    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [currentUserEmail]);

  // Find contact by name (for AI agent)
  const findContactByName = useCallback((name: string): WalletContact | null => {
    const searchName = name.toLowerCase().trim();
    return contacts.find(c =>
      c.name.toLowerCase().includes(searchName) ||
      c.email.toLowerCase().includes(searchName)
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
    if (!currentUserEmail || !wallet) {
      return { success: false, error: 'User not authenticated' };
    }

    const walletInfo = wallet.getWalletInfo();

    try {
      const response = await fetch(`${CONTACTS_API_URL}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUserEmail,
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
  }, [currentUserEmail, wallet]);

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  return {
    contacts,
    loading,
    error,
    addContact,
    removeContact,
    findContactByName,
    transferToContact,
    refreshContacts: loadContacts
  };
}