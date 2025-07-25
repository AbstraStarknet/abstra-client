import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    ArrowDownLeft,
    ArrowLeft,
    ArrowUpRight,
} from 'lucide-react-native';
import {
    Dimensions,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

type Tx = { id: string; incoming: boolean; label: string; date: string; amount: number };

// Extended sample data for the full transactions list
const ALL_TRANSACTIONS: Tx[] = [
    { id: '1', incoming: true, label: 'Pago recibido', date: 'Hoy', amount: 150 },
    { id: '2', incoming: false, label: 'Compra en línea', date: 'Ayer', amount: 45.3 },
    { id: '3', incoming: true, label: 'Transferencia', date: 'Hace 2 días', amount: 200 },
    { id: '4', incoming: false, label: 'Pago de servicios', date: 'Hace 3 días', amount: 89.99 },
    { id: '5', incoming: true, label: 'Depósito', date: 'Hace 4 días', amount: 500 },
    { id: '6', incoming: false, label: 'Compra en tienda', date: 'Hace 5 días', amount: 23.50 },
    { id: '7', incoming: true, label: 'Transferencia recibida', date: 'Hace 1 semana', amount: 75 },
    { id: '8', incoming: false, label: 'Suscripción mensual', date: 'Hace 1 semana', amount: 9.99 },
    { id: '9', incoming: true, label: 'Reembolso', date: 'Hace 1 semana', amount: 12.30 },
    { id: '10', incoming: false, label: 'Transferencia enviada', date: 'Hace 2 semanas', amount: 100 },
];

export default function TransactionsScreen() {
    const router = useRouter();

    const renderTransaction = ({ item }: { item: Tx }) => (
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
    );

    return (
        <LinearGradient
            colors={['#1A202C', '#2D3748']}
            style={styles.fullscreenGradient}
        >
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <SafeAreaView style={styles.safeOverlay}>
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Transacciones</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* TRANSACTIONS LIST */}
                <View style={styles.container}>
                    <View style={styles.transactionsWrapper}>
                        <View style={styles.transactionsGradient}>
                            <BlurView intensity={90} tint="dark" style={styles.transactionsCard}>
                                <Text style={styles.sectionTitle}>Todas las Transacciones</Text>
                                <FlatList
                                    data={ALL_TRANSACTIONS}
                                    keyExtractor={item => item.id}
                                    renderItem={renderTransaction}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.listContainer}
                                />
                            </BlurView>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    fullscreenGradient: {
        flex: 1,
    },
    safeOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
    },
    transactionsWrapper: {
        flex: 1,
        alignItems: 'center',
    },
    transactionsGradient: {
        width: width - 48,
        flex: 1,
        borderRadius: 36,
        backgroundColor: '#2D3748',
        overflow: 'hidden',
    },
    transactionsCard: {
        flex: 1,
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
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    listContainer: {
        paddingBottom: 16,
    },
    txRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingVertical: 4,
    },
    txIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    txIn: {
        backgroundColor: 'rgba(34,197,94,0.2)',
    },
    txOut: {
        backgroundColor: 'rgba(248,113,113,0.2)',
    },
    txText: {
        flex: 1,
    },
    txLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    txDate: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        marginTop: 2,
    },
    txAmount: {
        fontSize: 16,
        fontWeight: '800',
    },
}); 