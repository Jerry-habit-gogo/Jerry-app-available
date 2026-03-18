import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { color, radius, spacing, typography } from '../theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export default function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, error && styles.inputWrapError]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={color.text.placeholder}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[8],
  },
  label: {
    fontSize: typography.size.bodySmall,
    color: color.text.secondary,
    marginBottom: spacing[8],
    fontWeight: typography.weight.semiBold,
  },
  inputWrap: {
    backgroundColor: color.bg.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line.default,
    paddingHorizontal: spacing[16],
  },
  inputWrapError: {
    borderColor: color.state.error,
  },
  input: {
    minHeight: 52,
    fontSize: typography.size.body,
    color: color.text.primary,
  },
  errorText: {
    color: color.state.error,
    fontSize: typography.size.caption,
    marginTop: spacing[4],
  },
});
