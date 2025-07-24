import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {}

export const Card = React.forwardRef<View, CardProps>(({ style, ...props }, ref) => (
  <View ref={ref} style={[styles.card, style]} {...props} />
));

export const CardHeader = ({ style, ...props }: ViewProps) => (
  <View style={[styles.header, style]} {...props} />
);

export const CardTitle = ({ style, ...props }: ViewProps) => (
  <View style={[styles.title, style]} {...props} />
);

export const CardContent = ({ style, ...props }: ViewProps) => (
  <View style={[styles.content, style]} {...props} />
);

export const CardFooter = ({ style, ...props }: ViewProps) => (
  <View style={[styles.footer, style]} {...props} />
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    width: '100%',
    maxWidth: 400,
  },
  header: {
    marginBottom: 12,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    alignItems: 'center',
  },
  content: {
    gap: 12,
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
});