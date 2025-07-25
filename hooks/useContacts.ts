import { useCavos } from '@/hooks/useCavos';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export type WalletContact = {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
  addedBy: string; // current user's email
  createdAt: string;
};

const CONTACTS_STORAGE_KEY = 'wallet_contacts';
const CONTACTS_API_URL = 'http://192.168.68.88:3000/api/contacts';

export function useContacts() {
  const { wallet } = useCavos();
  const [contacts, setContacts] = useState<WalletContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current user email
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
      const userContacts = localContacts.filter(c => c.addedBy === currentUserEmail);
      setContacts(userContacts);

      // Sync with server (background)
      try {
        const response = await fetch(`${CONTACTS_API_URL}?userEmail=${currentUserEmail}`);
        if (response.ok) {
          const serverContacts = await response.json();
          setContacts(serverContacts);

          // Update local storage with server data
          const allContacts = [...localContacts.filter(c => c.addedBy !== currentUserEmail), ...serverContacts];
          await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(allContacts));
        }
      } catch (syncError) {
        console.log('Sync with server failed, using local data');
      }

    } catch (err: any) {
      setError(err.message);
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserEmail]);

  // Add new contact
  const addContact = useCallback(async (name: string, email: string, walletAddress: string): Promise<boolean> => {
    if (!currentUserEmail) return false;

    const newContact: WalletContact = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      walletAddress: walletAddress.trim(),
      addedBy: currentUserEmail,
      createdAt: new Date().toISOString(),
    };

    try {
      // Add to local storage first
      const localData = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
      const localContacts: WalletContact[] = localData ? JSON.parse(localData) : [];
      localContacts.push(newContact);
      await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(localContacts));

      // Update state
      setContacts(prev => [...prev, newContact]);

      // Sync to server (background)
      fetch(CONTACTS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      }).catch(err => console.log('Server sync failed:', err));

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [currentUserEmail]);

  // Remove contact
  const removeContact = useCallback(async (contactId: string): Promise<boolean> => {
    if (!currentUserEmail) return false;

    try {
      // Remove from local storage
      const localData = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
      const localContacts: WalletContact[] = localData ? JSON.parse(localData) : [];
      const filteredContacts = localContacts.filter(c => c.id !== contactId);
      await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(filteredContacts));

      // Update state
      setContacts(prev => prev.filter(c => c.id !== contactId));

      // Sync to server (background)
      fetch(`${CONTACTS_API_URL}/${contactId}`, {
        method: 'DELETE',
      }).catch(err => console.log('Server sync failed:', err));

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
    refreshContacts: loadContacts
  };
}