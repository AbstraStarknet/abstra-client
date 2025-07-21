import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { theme } from '../constants/theme';

interface CardProps {
  children: ReactNode;
}

const Card: React.FC<CardProps> = ({ children }) => {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={theme.gradients.topBar as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBar}
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    width: Dimensions.get('window').width * 0.9,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  topBar: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
});

export default Card;
