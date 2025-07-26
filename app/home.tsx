import { ChatModal, ChatMsg } from '@/components/ChatModal';
import { useCavos } from '@/hooks/useCavos';
import { useContacts, type WalletContact } from '@/hooks/useContacts';
import type { CavosWallet } from 'cavos-service-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  EyeOff,
  LogOut,
  MessageCircle,
  Settings
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  RefreshControl,
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
const DECIMALS = '18';
const TO_ADDRESS = '0x6761e4c92d7e74586563fc763068f5f459d427ddab032c8ffe934cc8ab92a81';
const TRANSFER_URL = 'http://192.168.68.99:3000/api/contacts/transfer';
const BALANCE_URL = 'http://192.168.68.99:3000/api/cavos/balance';
const AGENT_URL = 'http://192.168.68.99:3000/agent/ask';

type Tx = { id: string; incoming: boolean; label: string; date: string; amount: number };
const SAMPLE_TX: Tx[] = [
  { id: '1', incoming: true, label: 'Pago recibido', date: 'Hoy', amount: 150 },
  { id: '2', incoming: false, label: 'Compra en línea', date: 'Ayer', amount: 45.3 },
  { id: '3', incoming: true, label: 'Transferencia', date: 'Hace 2 días', amount: 200 },
];

export default function HomeScreen() {
  const router = useRouter();
  const { wallet, logout } = useCavos();
  const { findContactByName, transferToContact } = useContacts();
  const [info, setInfo] = useState<ReturnType<CavosWallet['getWalletInfo']> | null>(null);
  const [hideBalance, setHideBalance] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);

  const shortcuts = [
    { Icon: MessageCircle, label: 'Chat IA', onPress: () => setShowChat(true) },
  ];
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const balanceAnim = useRef(new Animated.Value(0)).current;
  const [displayedBalance, setDisplayedBalance] = useState(0);

  const fetchBalance = useCallback(async (address: string) => {
    setLoadingBalance(true);
    try {
      console.log('Fetching balance for address:', address);
      const res = await fetch(BALANCE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          tokenAddress: TOKEN_ADDRESS,
          decimals: DECIMALS,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Balance API error:', res.status, errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const response = await res.json();
      console.log('Balance response:', response);

      let bal = 0;

      // Handle different response formats
      if (response.data?.balance !== undefined) {
        // Format: { data: { balance: number } }
        bal = typeof response.data.balance === 'object'
          ? response.data.balance.balance || 0
          : Number(response.data.balance) || 0;
      } else if (response.balance !== undefined) {
        // Format: { balance: number }
        bal = Number(response.balance) || 0;
      } else if (response.data?.balance?.balance !== undefined) {
        // Format: { data: { balance: { balance: number } } }
        bal = Number(response.data.balance.balance) || 0;
      } else {
        console.warn('Unexpected response format:', response);
        bal = 0;
      }

      console.log('Parsed balance:', bal);

      Animated.timing(balanceAnim, {
        toValue: bal,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } catch (e: any) {
      console.error('Error fetching balance:', e.message);
      Alert.alert('Error', 'No se pudo cargar el balance: ' + e.message);
    } finally {
      setLoadingBalance(false);
    }
  }, [balanceAnim]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    if (!info) return;

    setRefreshing(true);
    try {
      await fetchBalance(info.address);
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [info, fetchBalance]);

  useEffect(() => {
    if (!wallet) {
      router.replace('/login');
      return;
    }
    const wlInfo = wallet.getWalletInfo();
    setInfo(wlInfo);

    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    const sub = balanceAnim.addListener(({ value }) => setDisplayedBalance(value));

    fetchBalance(wlInfo.address);
    return () => balanceAnim.removeListener(sub);
  }, [wallet, balanceAnim, fetchBalance, router, scaleAnim]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const doTransfer = async () => {
    if (!info) return;
    Alert.alert('Envío', 'Iniciando transferencia…');
    try {
      const payload = {
        network: 'sepolia',
        fromAddress: info.address,
        toAddress: TO_ADDRESS,
        tokenAddress: TOKEN_ADDRESS,
        amount: 1,
        decimals: Number(DECIMALS),
      };
      const res = await fetch(TRANSFER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      await res.json();
      Alert.alert('Éxito', 'Transferencia completada');
      fetchBalance(info.address);
    } catch (e: any) {
      console.error('Error en transferencia:', e.message);
      Alert.alert('Error', e.message);
    }
  };

  // Enhanced transfer function for AI commands using server endpoint
  const doTransferToContact = async (contact: WalletContact, amount: number) => {
    if (!info) return;

    Alert.alert('Envío', `Enviando $${amount} USDC a ${contact.name}...`);

    const result = await transferToContact(
      contact.name,
      amount,
      'sepolia',
      TOKEN_ADDRESS,
      Number(DECIMALS)
    );

    if (result.success) {
      Alert.alert('Éxito', `Transferencia de $${amount} USDC a ${contact.name} completada`);
      fetchBalance(info.address);
    } else {
      Alert.alert('Error', result.error || 'Error en la transferencia');
    }
  };

  // AI Command Processing
  // AI Command Processing - Replace the entire function
  const processAICommand = async (text: string): Promise<string> => {
    try {
      // Send message to AI agent
      const response = await fetch(AGENT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Agent API error:', response.status, errorText);
        return "❌ Error conectando con el agente. Intenta de nuevo.";
      }

      const result = await response.json();

      // Handle tool results (transfers, contacts, etc.)
      if (result.toolResult) {
        console.log('Tool executed:', result.toolCall?.function?.name);
        console.log('Tool result:', result.toolResult);

        // If it's a transfer, refresh balance
        if (result.toolCall?.function?.name === 'transferTokens') {
          setTimeout(() => {
            if (info) fetchBalance(info.address);
          }, 2000);
          return "✅ " + result.toolResult;
        }

        // For other tools, return the result
        return "" + result.toolResult;
      }

      // Handle AI message responses
      if (result.aiMessage?.content) {
        return result.aiMessage.content;
      }

      return "🤖 Recibido, pero no hay respuesta del agente.";

    } catch (error) {
      console.error('Error calling agent:', error);
      return "❌ Error de conexión. Verifica que el servidor esté funcionando.";
    }
  };

  if (!info) {
    return (
      <SafeAreaView style={styles.loader}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  const userName = info.name ?? 'Usuario';

  return (
    <LinearGradient
      colors={['#1A202C', '#2D3748']}
      style={styles.fullscreenGradient}
    >
      {/* superponemos la StatusBar translucida */}
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <SafeAreaView style={styles.safeOverlay}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {userName.split(' ')[0]}</Text>
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

        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
              colors={['#fff']}
              progressBackgroundColor="#2D3748"
              title="Actualizando saldo..."
              titleColor="#fff"
            />
          }
        >
          {/* BALANCE CARD */}
          <Animated.View style={[styles.balanceWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.balanceGradient}>
              <BlurView intensity={90} tint="dark" style={styles.balanceCard}>
                <View style={styles.balanceTop}>
                  <Text style={styles.balanceTitle}>Saldo USDC</Text>
                  <TouchableOpacity onPress={() => setHideBalance(!hideBalance)}>
                    <EyeOff color="rgba(255,255,255,0.7)" size={20} />
                  </TouchableOpacity>
                </View>

                {loadingBalance || refreshing
                  ? <View style={styles.balanceLoadingContainer}>
                    <ActivityIndicator style={{ marginVertical: 16 }} color="#fff" />
                    <Text style={styles.balanceLoadingText}>
                      {refreshing ? 'Actualizando...' : 'Cargando...'}
                    </Text>
                  </View>
                  : <Text style={styles.balanceValue}>
                    {hideBalance ? '••••••' : `$${displayedBalance.toFixed(2)}`}
                  </Text>}

                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.actionButton, styles.sendButton]} onPress={doTransfer}>
                    <ArrowUpRight color="#fff" size={24} />
                    <Text style={styles.circleLabel}>Send</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <ArrowDownLeft color="#fff" size={24} />
                    <Text style={styles.circleLabel}>Deposit</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </View>
          </Animated.View>

          {/* TRANSACTIONS */}
          <TouchableOpacity
            onPress={() => router.push('/transactions')}
            activeOpacity={0.8}
          >
            <View style={styles.balanceWrapper}>
              <View style={styles.balanceGradient}>
                <BlurView intensity={90} tint="dark" style={styles.balanceCard}>
                  <View style={styles.txHeaderRow}>
                    <Text style={styles.txHeader}>Transacciones Recientes</Text>
                    <Text style={styles.seeAllText}>Ver todas</Text>
                  </View>
                  <FlatList
                    data={SAMPLE_TX.slice(0, 3)}
                    keyExtractor={item => item.id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <View style={styles.txRow}>
                        <View style={[styles.txIconCircle, item.incoming ? styles.txIn : styles.txOut]}>
                          {item.incoming
                            ? <ArrowDownLeft color="#22c55e" size={18} />
                            : <ArrowUpRight color="#f87171" size={18} />}
                        </View>
                        <View style={styles.txText}>
                          <Text style={styles.txLabel}>{item.label}</Text>
                          <Text style={styles.txDate}>{item.date}</Text>
                        </View>
                        <Text style={[styles.txAmount, { color: item.incoming ? '#22c55e' : '#f87171' }]}>
                          {item.incoming ? '+' : '-'}${item.amount.toFixed(2)}
                        </Text>
                      </View>
                    )}
                  />
                  {SAMPLE_TX.length > 3 && (
                    <View style={styles.moreIndicator}>
                      <Text style={styles.moreText}>+{SAMPLE_TX.length - 3} más</Text>
                    </View>
                  )}
                </BlurView>
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* BOTTOM NAVIGATION */}
        <View style={styles.bottomNav}>
          {shortcuts.map(({ Icon, label, onPress }) => (
            <TouchableOpacity
              key={label}
              style={styles.bottomNavButton}
              onPress={onPress}
            >
              <Icon color="#fff" size={24} />
              <Text style={styles.bottomNavText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ChatModal
          visible={showChat}
          onClose={() => setShowChat(false)}
          messages={chatMsgs}
          onSend={async (text) => {
            // Add user message
            setChatMsgs(prev => [
              ...prev,
              { id: Date.now().toString(), fromMe: true, text },
            ]);

            // Add loading message
            const loadingId = Date.now().toString() + '_loading';
            setChatMsgs(prev => [
              ...prev,
              { id: loadingId, fromMe: false, text: '🤔 Pensando...' },
            ]);

            try {
              // Process AI command and get response
              const response = await processAICommand(text);

              // Replace loading message with actual response
              setChatMsgs(prev => prev.map(msg =>
                msg.id === loadingId
                  ? { ...msg, text: response }
                  : msg
              ));
            } catch (error) {
              // Replace loading message with error
              setChatMsgs(prev => prev.map(msg =>
                msg.id === loadingId
                  ? { ...msg, text: '❌ Error procesando tu mensaje.' }
                  : msg
              ));
            }
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // Este gradient ahora cubre TODO
  fullscreenGradient: {
    flex: 1,
  },
  // SafeAreaView transparente para ver el gradient
  safeOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    flex: 1,
    backgroundColor: 'transparent',
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
    borderRadius: 36,
    backgroundColor: '#2D3748',
    overflow: 'hidden',
  },
  balanceCard: {
    padding: 24,
    borderRadius: 36,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  balanceValue: { color: '#fff', fontSize: 38, fontWeight: '900', marginVertical: 16 },
  balanceLoadingContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  balanceLoadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
  },

  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: '#4A5568',
  },
  sendButton: {},
  circleLabel: { color: '#fff', marginTop: 8, fontSize: 14, fontWeight: '700' },

  shortcuts: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  shortcutCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#4A5568',
    marginHorizontal: 4,
    borderRadius: 28,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  shortcutText: { color: '#fff', marginTop: 8, fontSize: 13, fontWeight: '700' },

  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#2D3748',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomNavButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  bottomNavText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

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
    width: 44, height: 44,
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
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  moreIndicator: {
    alignItems: 'center',
    marginTop: 10,
  },
  moreText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
});