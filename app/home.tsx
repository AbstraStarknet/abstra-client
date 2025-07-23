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
  TrendingUp,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
type Tx = { id: string; incoming: boolean; label: string; date: string; amount: number; };
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

  // Animated values & state
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const balanceAnim = useRef(new Animated.Value(0)).current;
  const [displayedBalance, setDisplayedBalance] = useState(0);

  useEffect(() => {
    if (!wallet) return router.replace('/login');
    setInfo(wallet.getWalletInfo());

    // 1) Animación de escala
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();

    // 2) Animación numérica del balance
    Animated.timing(balanceAnim, {
      toValue: 2847.5,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // 3) Listener para actualizar estado
    const id = balanceAnim.addListener(({ value }) => {
      setDisplayedBalance(value);
    });
    return () => {
      balanceAnim.removeListener(id);
    };
  }, [wallet]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

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
            <Pressable onPress={handleLogout} style={styles.headerIcon} hitSlop={8}>
              <LogOut color="#fff" size={22} />
            </Pressable>
            <Pressable style={styles.headerIcon} hitSlop={8}>
              <Settings color="#fff" size={22} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* BALANCE CARD */}
          <Animated.View style={[styles.balanceWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient
              colors={['#9333ea', '#f97316']}
              style={styles.balanceGradient}
            >
              <BlurView intensity={90} tint="dark" style={styles.balanceCard}>
                <View style={styles.balanceTop}>
                  <Text style={styles.balanceTitle}>Saldo Total</Text>
                  <Pressable onPress={() => setHideBalance(!hideBalance)}>
                    <EyeOff color="rgba(255,255,255,0.7)" size={20} />
                  </Pressable>
                </View>
                <Text style={styles.balanceValue}>
                  {hideBalance
                    ? '••••••'
                    : `$${displayedBalance.toFixed(2)}`}
                </Text>
                <View style={styles.actions}>
                  <Pressable style={styles.circleButton} android_ripple={{ color: '#ffffff20' }}>
                    <ArrowUpRight color="#fff" size={24} />
                    <Text style={styles.circleLabel}>Send</Text>
                  </Pressable>
                  <Pressable style={styles.circleButton} android_ripple={{ color: '#ffffff20' }}>
                    <ArrowDownLeft color="#fff" size={24} />
                    <Text style={styles.circleLabel}>Deposit</Text>
                  </Pressable>
                </View>
              </BlurView>
            </LinearGradient>
          </Animated.View>

          {/* SHORTCUTS */}
          <View style={styles.shortcuts}>
            {[
              { Icon: MessageCircle, label: 'Chat IA' },
              { Icon: CreditCard,    label: 'Tarjetas' },
              { Icon: TrendingUp,     label: 'Inversiones' },
            ].map(({ Icon, label }) => (
              <Pressable
                key={label}
                style={styles.shortcutCard}
                android_ripple={{ color: '#ffffff20' }}
              >
                <Icon color="#fff" size={28} />
                <Text style={styles.shortcutText}>{label}</Text>
              </Pressable>
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
                  <View
                    style={[
                      styles.txIconCircle,
                      item.incoming ? styles.txIn : styles.txOut,
                    ]}
                  >
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
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
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
  balanceGradient: {
    width: width - 48,
    borderRadius: 24,
  },
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
    flex: 0.48,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
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