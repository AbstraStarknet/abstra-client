import * as Contacts from 'expo-contacts';
import { useEffect, useState } from 'react';

export function useContacts() {
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Permiso denegado para contactos');
        setLoading(false);
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      setContacts(data.filter(c => c.phoneNumbers?.length));
      setLoading(false);
    })();
  }, []);

  return { contacts, loading, error };
}