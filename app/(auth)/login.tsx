import { useCavos } from '@/hooks/useCavos';
import { FontAwesome } from '@expo/vector-icons';
import { CavosWallet, SignInWithApple, SignInWithGoogle } from 'cavos-service-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { setWallet, loading: restoring } = useCavos();

  if (restoring) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const handleSuccess = (wallet: CavosWallet) => {
    setWallet(wallet);
    router.replace('/home');
  };

  const handleError = (err: Error) => {
    console.error('Login error:', err);
  };

  return (
    <LinearGradient
      colors={['#1A202C', '#2D3748']}
      style={styles.background}
    >
      <BlurView intensity={70} tint="dark" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Image
              source={require('@/assets/images/AbstraLogo_Navy.png')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.subtitle}>
            Your secure and easy-to-use digital wallet
          </Text>
        </View>

        <View style={styles.content}>
          <SignInWithGoogle
            appId="app-640e577c8500de0a8a9fd9c19023b54c"
            network="sepolia"
            finalRedirectUri="abstra://callback"
            onSuccess={handleSuccess}
            onError={handleError}
            style={styles.googleButton}
          >
            <Text style={styles.googleText}>Continue with Google</Text>
          </SignInWithGoogle>

          <SignInWithApple
            appId="app-640e577c8500de0a8a9fd9c19023b54c"
            network="sepolia"
            finalRedirectUri="abstra://callback"
            onSuccess={handleSuccess}
            onError={handleError}
            style={styles.appleButton}
          >
            <FontAwesome name="apple" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.appleText}>Continue with Apple ID</Text>
          </SignInWithApple>
        </View>

        <Text style={styles.legalText}>
          By continuing, you accept our terms of service and privacy policy
        </Text>
      </BlurView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    flex: 1,
    backgroundColor: '#1A202C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    backgroundColor: 'rgba(45, 55, 72, 0.3)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    width: '100%',
    marginBottom: 24,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 10,
  },
  icon: {
    marginRight: 16,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  appleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  legalText: {
    fontSize: 12,
    color: '#ddd',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 24,
  },
});