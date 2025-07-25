import { useContacts, type WalletContact } from '@/hooks/useContacts';
import { Plus, Trash2, User, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

type ContactModalProps = {
    visible: boolean;
    onClose: () => void;
    onSelectContact?: (contact: WalletContact) => void; // For selecting contact for transfer
};

export function ContactModal({ visible, onClose, onSelectContact }: ContactModalProps) {
    const { contacts, loading, addContact, removeContact } = useContacts();
    const [showAddForm, setShowAddForm] = useState(false);
    const [newContact, setNewContact] = useState({ name: '', email: '', walletAddress: '' });
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Animation
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: visible ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [visible, fadeAnim]);

    const handleAddContact = async () => {
        if (!newContact.name || !newContact.email || !newContact.walletAddress) {
            Alert.alert('Error', 'Todos los campos son obligatorios');
            return;
        }

        // Basic wallet address validation (Ethereum/Starknet format)
        if (!newContact.walletAddress.startsWith('0x')) {
            Alert.alert('Error', 'Dirección de wallet inválida. Debe empezar con 0x');
            return;
        }

        const addressWithoutPrefix = newContact.walletAddress.slice(2);
        if (!/^[0-9a-fA-F]+$/.test(addressWithoutPrefix)) {
            Alert.alert('Error', 'Dirección de wallet inválida. Solo caracteres hexadecimales');
            return;
        }

        if (addressWithoutPrefix.length < 40 || addressWithoutPrefix.length > 65) {
            Alert.alert('Error', 'Longitud de dirección inválida (40-65 caracteres hex)');
            return;
        }

        const result = await addContact(newContact.name, newContact.email, newContact.walletAddress);
        if (result.success) {
            setNewContact({ name: '', email: '', walletAddress: '' });
            setShowAddForm(false);
            Alert.alert('Éxito', 'Contacto agregado correctamente');
        } else {
            Alert.alert('Error', result.error || 'No se pudo agregar el contacto');
        }
    };

    const handleDeleteContact = (contact: WalletContact) => {
        Alert.alert(
            'Eliminar Contacto',
            `¿Estás seguro de eliminar a ${contact.name}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => removeContact(contact.id),
                },
            ]
        );
    };

    const renderContact = ({ item }: { item: WalletContact }) => (
        <View style={styles.contactRow}>
            <TouchableOpacity
                style={styles.contactInfo}
                onPress={() => onSelectContact?.(item)}
                disabled={!onSelectContact}
            >
                <View style={styles.contactIcon}>
                    <User color="#fff" size={20} />
                </View>
                <View style={styles.contactText}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactEmail}>{item.email}</Text>
                    <Text style={styles.contactAddress} numberOfLines={1}>
                        {item.wallet_address}
                    </Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteContact(item)}
                hitSlop={8}
            >
                <Trash2 color="#f87171" size={18} />
            </TouchableOpacity>
        </View>
    );

    if (!visible) return null;

    return (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.select({ ios: 'padding' })}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Contactos</Text>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            onPress={() => setShowAddForm(!showAddForm)}
                            style={styles.addButton}
                            hitSlop={8}
                        >
                            <Plus color="#fff" size={20} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onClose} hitSlop={8}>
                            <X color="#fff" size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Add Contact Form */}
                {showAddForm && (
                    <View style={styles.addForm}>
                        <TextInput
                            style={styles.input}
                            placeholder="Nombre"
                            placeholderTextColor="rgba(255,255,255,0.6)"
                            value={newContact.name}
                            onChangeText={(text) => setNewContact(prev => ({ ...prev, name: text }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="rgba(255,255,255,0.6)"
                            value={newContact.email}
                            onChangeText={(text) => setNewContact(prev => ({ ...prev, email: text }))}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Dirección de Wallet (0x...)"
                            placeholderTextColor="rgba(255,255,255,0.6)"
                            value={newContact.walletAddress}
                            onChangeText={(text) => setNewContact(prev => ({ ...prev, walletAddress: text }))}
                            autoCapitalize="none"
                        />
                        <View style={styles.addFormButtons}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddForm(false)}>
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleAddContact}>
                                <Text style={styles.saveButtonText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Contacts List */}
                <View style={styles.body}>
                    {loading ? (
                        <Text style={styles.loadingText}>Cargando contactos...</Text>
                    ) : contacts.length === 0 ? (
                        <Text style={styles.emptyText}>
                            No tienes contactos. Agrega uno tocando el botón +
                        </Text>
                    ) : (
                        <FlatList
                            data={contacts}
                            keyExtractor={item => item.id}
                            renderItem={renderContact}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    container: {
        width: '95%',
        height: '85%',
        backgroundColor: '#1A202C',
        borderRadius: 20,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    addButton: {
        backgroundColor: '#4A5568',
        padding: 8,
        borderRadius: 8,
    },
    addForm: {
        padding: 16,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 12,
        fontSize: 16,
    },
    addFormButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#4A5568',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#22c55e',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    body: {
        flex: 1,
        padding: 16,
    },
    loadingText: {
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginTop: 40,
        lineHeight: 22,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    contactInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    contactIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4A5568',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contactText: {
        flex: 1,
    },
    contactName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    contactEmail: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        marginBottom: 2,
    },
    contactAddress: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontFamily: 'monospace',
    },
    deleteButton: {
        padding: 8,
    },
}); 