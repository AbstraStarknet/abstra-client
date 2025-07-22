import { useCavos } from '@/hooks/useCavos';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { CavosWallet, SignInWithApple, SignInWithGoogle } from 'cavos-service-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

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
      colors={['#f97316', '#9333ea']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <BlurView intensity={70} tint="dark" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="cellphone" size={36} color="#fff" />
          </View>
          <Text style={styles.subtitle}>
            Tu wallet digital segura y fácil de usar
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
            <Text style={styles.googleText}>Continuar con Google</Text>
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
            <Text style={styles.appleText}>Continuar con Apple ID</Text>
          </SignInWithApple>
        </View>

        <Text style={styles.legalText}>
          Al continuar, aceptas nuestros términos de servicio y política de privacidad
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
    backgroundColor: '#9333ea',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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