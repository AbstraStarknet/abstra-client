import { ChatModal, ChatMsg } from '@/components/chatModal';
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

// Configuración de token y endpoints - UPDATE THESE IPs
const TOKEN_ADDRESS = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
const DECIMALS = '18';
const TO_ADDRESS = '0x6761e4c92d7e74586563fc763068f5f459d427ddab032c8ffe934cc8ab92a81';
const TRANSFER_URL = 'http://192.168.68.99:3000/api/contacts/transfer';
const BALANCE_URL = 'http://192.168.68.99:3000/api/cavos/balance';
const AGENT_URL = 'http://192.168.68.99:3000/agent/ask';

type Tx = { id: string; incoming: boolean; label: string; date: string; amount: number };
const SAMPLE_TX: Tx[] = [
  { id: '1', incoming: true, label: 'Payment received', date: 'Today', amount: 150 },
  { id: '2', incoming: false, label: 'Online purchase', date: 'Yesterday', amount: 45.3 },
  { id: '3', incoming: true, label: 'Transfer', date: '2 days ago', amount: 200 },
  { id: '4', incoming: false, label: 'Service payment', date: '3 days ago', amount: 89.99 },
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

  // Add conversation history state for the AI agent
  const [agentHistory, setAgentHistory] = useState<Array<{ role: string; content: string }>>([]);

  const shortcuts = [
    { Icon: MessageCircle, label: 'AI Chat', onPress: () => setShowChat(true) },
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
        bal = typeof response.data.balance === 'object'
          ? response.data.balance.balance || 0
          : Number(response.data.balance) || 0;
      } else if (response.balance !== undefined) {
        bal = Number(response.balance) || 0;
      } else if (response.data?.balance?.balance !== undefined) {
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
      Alert.alert('Error', 'Could not load balance: ' + e.message);
    } finally {
      setLoadingBalance(false);
    }
  }, [balanceAnim]);

  const onRefresh = useCallback(async () => {
    if (!info) return;
    setRefreshing(true);
    try {
      await fetchBalance(info.address);
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
    Alert.alert('Transfer', 'Initiating transfer...');
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
      Alert.alert('Success', 'Transfer completed');
      fetchBalance(info.address);
    } catch (e: any) {
      console.error('Error in transfer:', e.message);
      Alert.alert('Error', e.message);
    }
  };

  const doTransferToContact = async (contact: WalletContact, amount: number) => {
    if (!info) return;

    Alert.alert('Transfer', `Sending $${amount} USDC to ${contact.name}...`);

    const result = await transferToContact(
      contact.name,
      amount,
      'sepolia',
      TOKEN_ADDRESS,
      Number(DECIMALS)
    );

    if (result.success) {
      Alert.alert('Success', `Transfer of $${amount} USDC to ${contact.name} completed`);
      fetchBalance(info.address);
    } else {
      Alert.alert('Error', result.error || 'Transfer error');
    }
  };

  // Updated AI Command Processing for new agent format
  const processAICommand = async (text: string): Promise<string> => {
    try {
      console.log('Sending message to agent:', text);
      console.log('Current history length:', agentHistory.length);

      const response = await fetch(AGENT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: agentHistory
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Agent API error:', response.status, errorText);
        return "❌ Error connecting to agent. Try again.";
      }

      const result = await response.json();
      console.log('Agent response:', result);

      // Update conversation history
      if (result.history) {
        setAgentHistory(result.history);
        console.log('Updated history length:', result.history.length);
      }

      // Check if tools were executed and refresh balance
      const toolsExecuted = result.trace?.find((step: any) =>
        step.type === 'tool_calls' || step.toolName
      );

      if (toolsExecuted) {
        console.log('Tools were executed, refreshing balance...');
        setTimeout(() => {
          if (info) {
            fetchBalance(info.address);
          }
        }, 2000);
      }

      return result.finalOutput || "🤖 Message received, but no response from agent.";

    } catch (error) {
      console.error('Error calling agent:', error);
      return "❌ Connection error. Check that the server is running.";
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

  const userName = info.name ?? 'User';

  return (
    <LinearGradient colors={['#1A202C', '#2D3748']} style={styles.fullscreenGradient}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeOverlay}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {userName.split(' ')[0]}</Text>
            <Text style={styles.subGreeting}>Welcome back</Text>
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
              title="Updating balance..."
              titleColor="#fff"
            />
          }
        >
          <Animated.View style={[styles.balanceWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.balanceGradient}>
              <BlurView intensity={90} tint="dark" style={styles.balanceCard}>
                <View style={styles.balanceTop}>
                  <Text style={styles.balanceTitle}>USDC Balance</Text>
                  <TouchableOpacity onPress={() => setHideBalance(!hideBalance)}>
                    <EyeOff color="rgba(255,255,255,0.7)" size={20} />
                  </TouchableOpacity>
                </View>

                {loadingBalance || refreshing
                  ? <View style={styles.balanceLoadingContainer}>
                    <ActivityIndicator style={{ marginVertical: 16 }} color="#fff" />
                    <Text style={styles.balanceLoadingText}>
                      {refreshing ? 'Updating...' : 'Loading...'}
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

          <TouchableOpacity onPress={() => router.push('/transactions')} activeOpacity={0.8}>
            <View style={styles.balanceWrapper}>
              <View style={styles.balanceGradient}>
                <BlurView intensity={90} tint="dark" style={styles.balanceCard}>
                  <View style={styles.txHeaderRow}>
                    <Text style={styles.txHeader}>Recent Transactions</Text>
                    <Text style={styles.seeAllText}>See all</Text>
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
                      <Text style={styles.moreText}>+{SAMPLE_TX.length - 3} more</Text>
                    </View>
                  )}
                </BlurView>
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.bottomNav}>
          {shortcuts.map(({ Icon, label, onPress }) => (
            <TouchableOpacity key={label} style={styles.bottomNavButton} onPress={onPress}>
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
            setChatMsgs(prev => [
              ...prev,
              { id: Date.now().toString(), fromMe: true, text },
            ]);

            const loadingId = Date.now().toString() + '_loading';
            setChatMsgs(prev => [
              ...prev,
              { id: loadingId, fromMe: false, text: '🤔 Thinking...' },
            ]);

            try {
              const response = await processAICommand(text);
              setChatMsgs(prev => prev.map(msg =>
                msg.id === loadingId
                  ? { ...msg, text: response }
                  : msg
              ));
            } catch (error) {
              setChatMsgs(prev => prev.map(msg =>
                msg.id === loadingId
                  ? { ...msg, text: '❌ Error processing your message.' }
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