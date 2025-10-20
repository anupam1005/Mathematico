import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { designSystem } from '../styles/designSystem';
import { testNetworkConnectivity } from '../utils/networkTest';

export default function LoginScreen({ navigation }: any) {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    const success = await login(email.trim(), password);
    if (!success) {
      // Error is already handled in the auth context
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Please contact support at support@mathematico.com for password reset assistance.',
      [{ text: 'OK' }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Welcome Back</Title>
            <Paragraph style={styles.cardSubtitle}>
              Sign in to continue your learning journey
            </Paragraph>

            <View style={styles.form}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={!!errors.email}
                style={styles.input}
                left={<TextInput.Icon icon="email" />}
                testID="email-input"
                accessibilityLabel="Email input field"
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                autoComplete="password"
                error={!!errors.password}
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                testID="password-input"
                accessibilityLabel="Password input field"
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}

              <Button
                mode="text"
                onPress={handleForgotPassword}
                style={styles.forgotPassword}
                labelStyle={styles.forgotPasswordText}
              >
                Forgot Password?
              </Button>

              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
                disabled={isLoading}
                testID="login-button"
                accessibilityLabel="Sign in button"
              >
                {isLoading ? (
                  <ActivityIndicator color={designSystem.colors.surface} />
                ) : (
                  'Sign In'
                )}
              </Button>

              <Divider style={styles.divider} />

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <Button
                  mode="text"
                  onPress={handleRegister}
                  labelStyle={styles.registerButtonText}
                >
                  Sign Up
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
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
    marginTop: designSystem.spacing.md,
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
    marginBottom: designSystem.spacing.lg,
  },
  cardTitle: {
    ...designSystem.typography.h2,
    color: designSystem.colors.textPrimary,
    textAlign: 'center',
    marginBottom: designSystem.spacing.sm,
  },
  cardSubtitle: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: designSystem.spacing.lg,
  },
  forgotPasswordText: {
    color: designSystem.colors.primary,
  },
  loginButton: {
    marginBottom: designSystem.spacing.lg,
    borderRadius: designSystem.borderRadius.md,
    ...designSystem.shadows.md,
  },
  buttonContent: {
    paddingVertical: designSystem.spacing.md,
  },
  divider: {
    marginVertical: designSystem.spacing.lg,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
  },
  registerButtonText: {
    color: designSystem.colors.primary,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: designSystem.spacing.lg,
  },
  footerText: {
    ...designSystem.typography.caption,
    color: designSystem.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
