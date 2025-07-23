import { Card, CardContent, CardHeader } from '@/components/Card';
import { useCavos } from '@/hooks/useCavos';
import { CavosWallet } from 'cavos-service-native';
import { useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { wallet, logout } = useCavos();
  const [info, setInfo] = useState<ReturnType<CavosWallet['getWalletInfo']> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet) {
      router.replace('/login');
      return;
    }
    const wlInfo = wallet.getWalletInfo();
    setInfo(wlInfo);
    setLoading(false);
  }, [wallet]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }
  if (!info) return null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header con logout alineado a la derecha */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleLogout} hitSlop={8}>
          <LogOut color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <CardHeader style={styles.header}>
            <Text style={styles.greeting}>
              Hola, {info.name}
            </Text>
            <Text style={styles.subGreeting}>
              Bienvenido a Abstra
            </Text>
          </CardHeader>

          <CardContent style={styles.content}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Dirección:</Text>
              <Text style={styles.value}>{info.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Red:</Text>
              <Text style={styles.value}>{info.network}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{info.email}</Text>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  loader: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  subGreeting: {
    color: '#ccc',
    fontSize: 16,
  },
  content: {
    paddingTop: 8,
  },
  infoRow: {
    marginBottom: 12,
  },
  label: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
  },
  value: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});