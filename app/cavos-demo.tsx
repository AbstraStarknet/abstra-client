import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useCavos } from '../hooks/useCavos';
import type { Address, NetworkType } from '../lib/types/cavos';

export default function CavosDemo() {
    const {
        balance,
        transfer,
        approve,
        health,
        getBalance,
        transferTokens,
        approveTokens,
        checkHealth,
        clearBalance,
        clearTransfer,
        clearApprove,
        clearHealth,
        isLoading,
    } = useCavos();

    // Form states for balance
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [tokenAddress, setTokenAddress] = useState<string>('');
    const [decimals, setDecimals] = useState<string>('18');

    // Form states for transfer
    const [transferNetwork, setTransferNetwork] = useState<string>('sepolia');
    const [transferFromAddress, setTransferFromAddress] = useState<string>('');
    const [transferToAddress, setTransferToAddress] = useState<string>('');
    const [transferTokenAddress, setTransferTokenAddress] = useState<string>('');
    const [transferAmount, setTransferAmount] = useState<string>('');
    const [transferDecimals, setTransferDecimals] = useState<string>('6');

    // Form states for approve
    const [approveNetwork, setApproveNetwork] = useState<string>('sepolia');
    const [approveFromAddress, setApproveFromAddress] = useState<string>('');
    const [approveSpenderAddress, setApproveSpenderAddress] = useState<string>('');
    const [approveTokenAddress, setApproveTokenAddress] = useState<string>('');
    const [approvePrivateKey, setApprovePrivateKey] = useState<string>('');
    const [approveAmount, setApproveAmount] = useState<string>('');
    const [approveDecimals, setApproveDecimals] = useState<string>('6');

    const handleHealthCheck = async () => {
        try {
            await checkHealth();
            Alert.alert('Success', 'Health check completed!');
        } catch (error) {
            Alert.alert('Error', 'Health check failed');
        }
    };

    const handleGetBalance = async () => {
        if (!walletAddress || !tokenAddress) {
            Alert.alert('Error', 'Please fill in wallet and token addresses');
            return;
        }

        try {
            await getBalance({
                walletAddress: walletAddress as Address,
                tokenAddress: tokenAddress as Address,
                decimals,
            });
            Alert.alert('Success', 'Balance retrieved!');
        } catch (error) {
            Alert.alert('Error', 'Failed to get balance');
        }
    };

    const handleTransfer = async () => {
        if (!transferFromAddress || !transferToAddress || !transferTokenAddress || !transferAmount) {
            Alert.alert('Error', 'Please fill in all transfer fields');
            return;
        }

        try {
            await transferTokens({
                network: transferNetwork as NetworkType,
                fromAddress: transferFromAddress as Address,
                toAddress: transferToAddress as Address,
                tokenAddress: transferTokenAddress as Address,
                amount: parseFloat(transferAmount),
                decimals: parseInt(transferDecimals),
            });
            Alert.alert('Success', 'Transfer initiated!');
        } catch (error) {
            Alert.alert('Error', 'Failed to transfer tokens');
        }
    };

    const handleApprove = async () => {
        if (!approveFromAddress || !approveSpenderAddress || !approveTokenAddress || !approveAmount || !approvePrivateKey) {
            Alert.alert('Error', 'Please fill in all approval fields');
            return;
        }

        try {
            await approveTokens({
                network: approveNetwork as NetworkType,
                fromAddress: approveFromAddress as Address,
                hashedPrivateKey: approvePrivateKey,
                spenderAddress: approveSpenderAddress as Address,
                tokenAddress: approveTokenAddress as Address,
                amount: parseFloat(approveAmount),
                decimals: parseInt(approveDecimals),
            });
            Alert.alert('Success', 'Approval completed!');
        } catch (error) {
            Alert.alert('Error', 'Failed to approve tokens');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Cavos API Demo</Text>

            {/* Health Check Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Health Check</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleHealthCheck}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>
                        {health.loading ? 'Checking...' : 'Check API Health'}
                    </Text>
                </TouchableOpacity>

                {health.data && (
                    <View style={styles.result}>
                        <Text style={styles.resultTitle}>Health Status:</Text>
                        <Text style={styles.resultText}>
                            {JSON.stringify(health.data, null, 2)}
                        </Text>
                    </View>
                )}

                {health.error && (
                    <View style={styles.error}>
                        <Text style={styles.errorText}>Error: {health.error}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearHealth}
                >
                    <Text style={styles.clearButtonText}>Clear Health</Text>
                </TouchableOpacity>
            </View>

            {/* Get Balance Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Get Token Balance</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Wallet Address (0x...)"
                    value={walletAddress}
                    onChangeText={setWalletAddress}
                    multiline
                />

                <TextInput
                    style={styles.input}
                    placeholder="Token Address (0x...)"
                    value={tokenAddress}
                    onChangeText={setTokenAddress}
                    multiline
                />

                <TextInput
                    style={styles.input}
                    placeholder="Decimals (default: 18)"
                    value={decimals}
                    onChangeText={setDecimals}
                    keyboardType="numeric"
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleGetBalance}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>
                        {balance.loading ? 'Getting Balance...' : 'Get Balance'}
                    </Text>
                </TouchableOpacity>

                {balance.data && (
                    <View style={styles.result}>
                        <Text style={styles.resultTitle}>Balance Result:</Text>
                        <Text style={styles.resultText}>
                            {JSON.stringify(balance.data, null, 2)}
                        </Text>
                    </View>
                )}

                {balance.error && (
                    <View style={styles.error}>
                        <Text style={styles.errorText}>Error: {balance.error}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearBalance}
                >
                    <Text style={styles.clearButtonText}>Clear Balance</Text>
                </TouchableOpacity>
            </View>

            {/* Transfer Tokens Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Transfer Tokens</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Network (sepolia, mainnet, goerli)"
                    value={transferNetwork}
                    onChangeText={setTransferNetwork}
                />

                <TextInput
                    style={styles.input}
                    placeholder="From Address (0x...)"
                    value={transferFromAddress}
                    onChangeText={setTransferFromAddress}
                    multiline
                />

                <TextInput
                    style={styles.input}
                    placeholder="To Address (0x...)"
                    value={transferToAddress}
                    onChangeText={setTransferToAddress}
                    multiline
                />

                <TextInput
                    style={styles.input}
                    placeholder="Token Address (0x...)"
                    value={transferTokenAddress}
                    onChangeText={setTransferTokenAddress}
                    multiline
                />

                <TextInput
                    style={styles.input}
                    placeholder="Amount"
                    value={transferAmount}
                    onChangeText={setTransferAmount}
                    keyboardType="numeric"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Decimals (default: 6)"
                    value={transferDecimals}
                    onChangeText={setTransferDecimals}
                    keyboardType="numeric"
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleTransfer}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>
                        {transfer.loading ? 'Transferring...' : 'Transfer Tokens'}
                    </Text>
                </TouchableOpacity>

                {transfer.data && (
                    <View style={styles.result}>
                        <Text style={styles.resultTitle}>Transfer Result:</Text>
                        <Text style={styles.resultText}>
                            {JSON.stringify(transfer.data, null, 2)}
                        </Text>
                    </View>
                )}

                {transfer.error && (
                    <View style={styles.error}>
                        <Text style={styles.errorText}>Error: {transfer.error}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearTransfer}
                >
                    <Text style={styles.clearButtonText}>Clear Transfer</Text>
                </TouchableOpacity>
            </View>

            {/* Approve Tokens Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Approve Tokens</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Network (sepolia, mainnet, goerli)"
                    value={approveNetwork}
                    onChangeText={setApproveNetwork}
                />

                <TextInput
                    style={styles.input}
                    placeholder="From Address (0x...)"
                    value={approveFromAddress}
                    onChangeText={setApproveFromAddress}
                    multiline
                />

                <TextInput
                    style={styles.input}
                    placeholder="Spender Address (0x...)"
                    value={approveSpenderAddress}
                    onChangeText={setApproveSpenderAddress}
                    multiline
                />

                <TextInput
                    style={styles.input}
                    placeholder="Token Address (0x...)"
                    value={approveTokenAddress}
                    onChangeText={setApproveTokenAddress}
                    multiline
                />

                <TextInput
                    style={styles.input}
                    placeholder="Hashed Private Key"
                    value={approvePrivateKey}
                    onChangeText={setApprovePrivateKey}
                    secureTextEntry
                    multiline
                />

                <TextInput
                    style={styles.input}
                    placeholder="Amount"
                    value={approveAmount}
                    onChangeText={setApproveAmount}
                    keyboardType="numeric"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Decimals (default: 6)"
                    value={approveDecimals}
                    onChangeText={setApproveDecimals}
                    keyboardType="numeric"
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleApprove}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>
                        {approve.loading ? 'Approving...' : 'Approve Tokens'}
                    </Text>
                </TouchableOpacity>

                {approve.data && (
                    <View style={styles.result}>
                        <Text style={styles.resultTitle}>Approval Result:</Text>
                        <Text style={styles.resultText}>
                            {JSON.stringify(approve.data, null, 2)}
                        </Text>
                    </View>
                )}

                {approve.error && (
                    <View style={styles.error}>
                        <Text style={styles.errorText}>Error: {approve.error}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearApprove}
                >
                    <Text style={styles.clearButtonText}>Clear Approval</Text>
                </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                <Text style={styles.instructionText}>
                    1. First, test the health check to verify API connection{'\n'}
                    2. Enter a valid wallet address and token address{'\n'}
                    3. Use sample addresses:{'\n'}
                    • Wallet: 0x1234...{'\n'}
                    • Token: 0x5678...{'\n'}
                    {'\n'}
                    Note: Update API_CONFIG.BASE_URL in constants/api.ts with your backend URL
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
        color: '#333',
    },
    section: {
        backgroundColor: '#fff',
        padding: 20,
        marginBottom: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 14,
        backgroundColor: '#f9f9f9',
        minHeight: 44,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    clearButton: {
        backgroundColor: '#ff6b6b',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 10,
    },
    clearButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    result: {
        backgroundColor: '#e8f5e8',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    resultTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#2d5a2d',
    },
    resultText: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#2d5a2d',
    },
    error: {
        backgroundColor: '#ffeaea',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    errorText: {
        color: '#d32f2f',
        fontSize: 14,
    },
    instructionText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#666',
    },
}); 