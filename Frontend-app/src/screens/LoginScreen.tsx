import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import {
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { CustomTextInput } from '../components/CustomTextInput';
import { useAuth } from '../contexts/AuthContext';
import { designSystem } from '../styles/designSystem';
import { debounce } from '../utils/debounce';

export default function LoginScreen({ navigation }: any) {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    setApiError(''); // Clear API errors on validation

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      newErrors.email = 'Email is required';
    } else if (trimmedEmail.length > 254) {
      newErrors.email = 'Email is too long (max 254 characters)';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!trimmedPassword) {
      newErrors.password = 'Password is required';
    } else if (trimmedPassword.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (trimmedPassword.length > 128) {
      newErrors.password = 'Password is too long (max 128 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = useCallback(async () => {
    if (!validateForm()) return;
    
    if (isSubmitting || isLoading) return; // Prevent double submission
    
    setIsSubmitting(true);
    setApiError('');
    
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const success = await login(normalizedEmail, password);
      
      if (!success) {
        setApiError('Invalid email or password. Please try again.');
      }
    } catch (error) {
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, login, isSubmitting, isLoading]);

  // Debounced login handler to prevent rapid submissions
  const debouncedLogin = useCallback(
    debounce(() => {
      handleLogin();
    }, 300),
    [handleLogin]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Title style={styles.title}>Mathematico</Title>
          <Paragraph style={styles.subtitle}>
            Learn Mathematics the Easy Way
          </Paragraph>
        </View>

        {/* Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Welcome Back</Title>

            <View style={styles.form}>
              <CustomTextInput
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setApiError(''); // Clear API error when user types
                  if (errors.email) {
                    setErrors({ ...errors, email: '' });
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                maxLength={254}
                error={!!errors.email}
                style={styles.input}
                testID="login-email-input"
                accessibilityLabel="Email input field for login"
                leftIcon="email"
              />
              {errors.email && (
                <Text style={styles.errorText} testID="email-error">
                  {errors.email}
                </Text>
              )}

              <CustomTextInput
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setApiError(''); // Clear API error when user types
                  if (errors.password) {
                    setErrors({ ...errors, password: '' });
                  }
                }}
                secureTextEntry={!showPassword}
                autoComplete="password"
                autoCorrect={false}
                maxLength={128}
                rightIcon={showPassword ? 'eye-off' : 'eye'}
                onRightIconPress={() => setShowPassword(!showPassword)}
                error={!!errors.password}
                style={styles.input}
                testID="login-password-input"
                accessibilityLabel="Password input field for login"
                leftIcon="lock"
              />
              {errors.password && (
                <Text style={styles.errorText} testID="password-error">
                  {errors.password}
                </Text>
              )}

              {apiError && (
                <View style={styles.apiErrorContainer}>
                  <Text style={styles.apiErrorText} testID="api-error">
                    {apiError}
                  </Text>
                </View>
              )}

              <Button
                mode="contained"
                onPress={debouncedLogin}
                disabled={isLoading || isSubmitting}
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
                testID="login-button"
                accessibilityLabel="Sign in button"
              >
                {isLoading || isSubmitting ? (
                  <ActivityIndicator color={designSystem.colors.surface} />
                ) : (
                  'Sign In'
                )}
              </Button>

              <Divider style={styles.divider} />

              <Button
                mode="text"
                onPress={() => navigation.navigate('Register')}
                labelStyle={styles.registerText}
              >
                Create an account
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: designSystem.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: designSystem.spacing.xxl,
    marginBottom: designSystem.spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: designSystem.spacing.md,
  },
  title: {
    ...designSystem.typography.h1,
    color: designSystem.colors.primary,
  },
  subtitle: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    textAlign: 'center',
    marginTop: designSystem.spacing.sm,
  },
  card: {
    ...designSystem.shadows.lg,
    borderRadius: designSystem.borderRadius.lg,
  },
  cardTitle: {
    ...designSystem.typography.h2,
    textAlign: 'center',
    marginBottom: designSystem.spacing.lg,
  },
  form: {
    marginTop: designSystem.spacing.md,
  },
  input: {
    marginBottom: designSystem.spacing.sm,
  },
  errorText: {
    color: designSystem.colors.error,
    ...designSystem.typography.caption,
    marginBottom: designSystem.spacing.sm,
    marginLeft: designSystem.spacing.sm,
  },
  loginButton: {
    marginTop: designSystem.spacing.lg,
    borderRadius: designSystem.borderRadius.md,
    ...designSystem.shadows.md,
  },
  buttonContent: {
    paddingVertical: designSystem.spacing.md,
  },
  divider: {
    marginVertical: designSystem.spacing.lg,
  },
  registerText: {
    color: designSystem.colors.primary,
    fontWeight: 'bold',
  },
  apiErrorContainer: {
    marginTop: designSystem.spacing.sm,
    marginBottom: designSystem.spacing.sm,
    padding: designSystem.spacing.sm,
    backgroundColor: designSystem.colors.error + '15',
    borderRadius: designSystem.borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: designSystem.colors.error,
  },
  apiErrorText: {
    color: designSystem.colors.error,
    ...designSystem.typography.caption,
    fontWeight: '500',
  },
});
