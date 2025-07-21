import { theme } from '@/constants/theme';
import React, { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

type InputType = 'text' | 'email' | 'password' | 'number';

interface InputTextProps extends TextInputProps {
  label?: string;
  error?: string;
  type?: InputType;
}

const InputText = forwardRef<TextInput, InputTextProps>(
  ({ label, error, type = 'text', style, ...props }, ref) => {
    const config: Partial<TextInputProps> = {
      keyboardType: 'default',
      autoCapitalize: 'sentences',
      secureTextEntry: false,
    };

    if (type === 'email') {
      config.keyboardType = 'email-address';
      config.autoCapitalize = 'none';
    } else if (type === 'password') {
      config.secureTextEntry = true;
      config.autoCapitalize = 'none';
    } else if (type === 'number') {
      config.keyboardType = 'numeric';
      config.autoCapitalize = 'none';
    }

    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          ref={ref}
          {...config}
          {...props}
          placeholderTextColor={theme.colors.textSecondary}
          style={[
            styles.input,
            error && styles.inputError,
            style,
          ]}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

InputText.displayName = 'InputText';

export default InputText;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    marginBottom: 8,
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.iconBackground,
    backgroundColor: theme.colors.cardBackground,
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
  inputError: {
    borderColor: theme.colors.accent,
  },
  errorText: {
    marginTop: 4,
    color: theme.colors.accent,
    fontSize: 12,
  },
});
