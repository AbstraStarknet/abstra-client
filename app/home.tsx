import { useCavos } from '@/hooks/useCavos';
import type { CavosWallet } from 'cavos-service-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  EyeOff,
  LogOut,
  MessageCircle,
  Settings,
  User,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

// Configuración de token y endpoints
const TOKEN_ADDRESS = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
const DECIMALS      = '18';
const TO_ADDRESS    = '0x6761e4c92d7e74586563fc763068f5f459d427ddab032c8ffe934cc8ab92a81';
const TRANSFER_URL  = 'http://192.168.68.88:3000/api/cavos/transfer';
const BALANCE_URL   = 'http://192.168.68.88:3000/api/cavos/balance';

type Tx = { id: string; incoming: boolean; label: string; date: string; amount: number };
const SAMPLE_TX: Tx[] = [
  { id: '1', incoming: true,  label: 'Pago recibido',   date: 'Hoy',         amount: 150   },
  { id: '2', incoming: false, label: 'Compra en línea', date: 'Ayer',        amount: 45.3  },
  { id: '3', incoming: true,  label: 'Transferencia',   date: 'Hace 2 días', amount: 200   },
];

export default function HomeScreen() {
  const router = useRouter();
  const { wallet, logout } = useCavos();
  const [info, setInfo] = useState<ReturnType<CavosWallet['getWalletInfo']> | null>(null);
  const [hideBalance, setHideBalance] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // Animated values & state
  const scaleAnim   = useRef(new Animated.Value(0.8)).current;
  const balanceAnim = useRef(new Animated.Value(0)).current;
  const [displayedBalance, setDisplayedBalance] = useState(0);

  // Función para leer el balance y animarlo
  const fetchBalance = useCallback(async (address: string) => {
    setLoadingBalance(true);
    try {
      const res = await fetch(BALANCE_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ walletAddress: address, tokenAddress: TOKEN_ADDRESS, decimals: DECIMALS }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { data } = await res.json();
      const bal = typeof data.balance === 'object'
        ? data.balance.balance
        : Number(data.balance);

      // Animación desde 0 (o valor previo) hasta bal
      Animated.timing(balanceAnim, {
        toValue: bal,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } catch (e: any) {
      console.error('Error fetching balance:', e.message);
      Alert.alert('Error', 'No se pudo cargar el balance');
    } finally {
      setLoadingBalance(false);
    }
  }, [balanceAnim]);

  // Efecto al montar: restaurar info y balance
  useEffect(() => {
    if (!wallet) {
      router.replace('/login');
      return;
    }
    const wlInfo = wallet.getWalletInfo();
    setInfo(wlInfo);

    // Escala de entrada
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
    const listenerId = balanceAnim.addListener(({ value }) => setDisplayedBalance(value));

    // Primera carga de balance
    fetchBalance(wlInfo.address);

    return () => balanceAnim.removeListener(listenerId);
  }, [wallet, fetchBalance]);

 
  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const doTransfer = async () => {
    if (!info) return;
    Alert.alert('Envio', 'Iniciando transferencia...');
    try {
      const payload = {
        network:      'sepolia',
        fromAddress:  info.address,
        toAddress:    TO_ADDRESS,
        tokenAddress: TOKEN_ADDRESS,
        amount:       1,
        decimals:     Number(DECIMALS),
      };
      const res = await fetch(TRANSFER_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      console.log('Transfer result:', json.data.transactionResult);
      Alert.alert('Éxito', 'Transferencia completada');
      // 👉 Recarga el balance tras la transferencia
      fetchBalance(info.address);
    } catch (e: any) {
      console.error('Error en transferencia:', e.message);
      Alert.alert('Error', e.message);
    }
  };

  // Si no hay info, mostramos loader
  if (!info) {
    return (
      <SafeAreaView style={styles.loader}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  const userName = info.name ?? 'Usuario';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#f97316', '#9333ea']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {userName}</Text>
            <Text style={styles.subGreeting}>Bienvenido de vuelta</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={handleLogout} style={styles.headerIcon} hitSlop={8}>
              <LogOut color="#fff" size={22} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon} hitSlop={8}>
              <Settings color="#fff" size={22} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* BALANCE CARD */}
          <Animated.View style={[styles.balanceWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient colors={['#9333ea', '#f97316']} style={styles.balanceGradient}>
              <BlurView intensity={90} tint="dark" style={styles.balanceCard}>
                <View style={styles.balanceTop}>
                  <Text style={styles.balanceTitle}>Saldo USDC</Text>
                  <TouchableOpacity onPress={() => setHideBalance(!hideBalance)}>
                    <EyeOff color="rgba(255,255,255,0.7)" size={20} />
                  </TouchableOpacity>
                </View>

                {loadingBalance ? (
                  <ActivityIndicator size="small" color="#fff" style={{ marginVertical: 16 }} />
                ) : (
                  <Text style={styles.balanceValue}>
                    {hideBalance ? '••••••' : `$${displayedBalance.toFixed(2)}`}
                  </Text>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.circleButton, styles.sendButton]}
                    onPress={doTransfer}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <ArrowUpRight color="#fff" size={24} />
                    <Text style={styles.circleLabel}>Send</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.circleButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <ArrowDownLeft color="#fff" size={24} />
                    <Text style={styles.circleLabel}>Deposit</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </LinearGradient>
          </Animated.View>

          {/* SHORTCUTS */}
          <View style={styles.shortcuts}>
            {[
              { Icon: MessageCircle, label: 'Chat IA' },
              { Icon: CreditCard,    label: 'Tarjetas' },
              { Icon: User,          label: 'Mi cuenta' },
            ].map(({ Icon, label }) => (
              <TouchableOpacity
                key={label}
                style={styles.shortcutCard}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon color="#fff" size={28} />
                <Text style={styles.shortcutText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TRANSACTIONS */}
          <BlurView intensity={60} tint="dark" style={styles.txWrapper}>
            <Text style={styles.txHeader}>Transacciones Recientes</Text>
            <FlatList
              data={SAMPLE_TX}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.txRow}>
                  <View style={[styles.txIconCircle, item.incoming ? styles.txIn : styles.txOut]}>
                    {item.incoming ? (
                      <ArrowDownLeft color="#22c55e" size={18} />
                    ) : (
                      <ArrowUpRight color="#f87171" size={18} />
                    )}
                  </View>
                  <View style={styles.txText}>
                    <Text style={styles.txLabel}>{item.label}</Text>
                    <Text style={styles.txDate}>{item.date}</Text>
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: item.incoming ? '#22c55e' : '#f87171' },
                    ]}
                  >
                    {item.incoming ? '+' : '-'}${item.amount.toFixed(2)}
                  </Text>
                </View>
              )}
            />
          </BlurView>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  background: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  greeting: { color: '#fff', fontSize: 28, fontWeight: '800' },
  subGreeting: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4 },
  headerIcons: { flexDirection: 'row' },
  headerIcon: { marginLeft: 16 },
  container: { padding: 24, paddingBottom: 40 },
  balanceWrapper: { alignItems: 'center', marginBottom: 24 },
  balanceGradient: { width: width - 48, borderRadius: 24 },
  balanceCard: {
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  balanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  balanceValue: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '900',
    marginVertical: 16,
  },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  circleButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  sendButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  circleLabel: { color: '#fff', marginTop: 8, fontSize: 14, fontWeight: '700' },
  shortcuts: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  shortcutCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  shortcutText: { color: '#fff', marginTop: 8, fontSize: 13, fontWeight: '700' },
  txWrapper: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  txHeader: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  txRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  txIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txIn: { backgroundColor: 'rgba(34,197,94,0.2)' },
  txOut: { backgroundColor: 'rgba(248,113,113,0.2)' },
  txText: { flex: 1 },
  txLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  txDate: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '800' },
});