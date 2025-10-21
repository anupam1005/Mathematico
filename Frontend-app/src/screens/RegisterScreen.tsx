// @ts-nocheck
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
  Checkbox,
} from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { designSystem } from '../styles/designSystem';

export default function RegisterScreen({ navigation }: any) {
  const { register, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    const success = await register(name.trim(), email.trim(), password);
    if (success) {
      // Navigate to login screen after successful registration
      navigation.navigate('Login');
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
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
            Join thousands of students learning mathematics
          </Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Create Account</Title>
            <Paragraph style={styles.cardSubtitle}>
              Start your learning journey today
            </Paragraph>

            <View style={styles.form}>
              <TextInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                autoCapitalize="words"
                autoComplete="name"
                error={!!errors.name}
                style={styles.input}
                left={<TextInput.Icon icon="account" />}
                testID="name-input"
                accessibilityLabel="Full name input field"
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}

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
                autoComplete="password-new"
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
              
              {/* Password Requirements */}
              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                <Text style={[styles.requirement, password.length >= 8 && styles.requirementMet]}>
                  • At least 8 characters
                </Text>
                <Text style={[styles.requirement, /[a-z]/.test(password) && styles.requirementMet]}>
                  • One lowercase letter (a-z)
                </Text>
                <Text style={[styles.requirement, /[A-Z]/.test(password) && styles.requirementMet]}>
                  • One uppercase letter (A-Z)
                </Text>
                <Text style={[styles.requirement, /\d/.test(password) && styles.requirementMet]}>
                  • One number (0-9)
                </Text>
                <Text style={[styles.requirement, /[@$!%*?&]/.test(password) && styles.requirementMet]}>
                  • One special character (@$!%*?&)
                </Text>
              </View>

              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry={!showConfirmPassword}
                autoComplete="password-new"
                error={!!errors.confirmPassword}
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
                testID="confirm-password-input"
                accessibilityLabel="Confirm password input field"
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}

              <View style={styles.termsContainer}>
                <Checkbox
                  status={agreeToTerms ? 'checked' : 'unchecked'}
                  onPress={() => setAgreeToTerms(!agreeToTerms)}
                  testID="terms-checkbox"
                  accessibilityLabel="Agree to terms and conditions checkbox"
                />
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>
              {errors.terms && (
                <Text style={styles.errorText}>{errors.terms}</Text>
              )}

              <Button
                mode="contained"
                onPress={handleRegister}
                style={styles.registerButton}
                contentStyle={styles.buttonContent}
                disabled={isLoading}
                testID="register-button"
                accessibilityLabel="Create account button"
              >
                {isLoading ? (
                  <ActivityIndicator color={designSystem.colors.surface} />
                ) : (
                  'Create Account'
                )}
              </Button>

              <Divider style={styles.divider} />

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <Button
                  mode="text"
                  onPress={handleLogin}
                  labelStyle={styles.loginButtonText}
                >
                  Sign In
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
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
    marginTop: designSystem.spacing.xl,
    marginBottom: designSystem.spacing.lg,
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: designSystem.spacing.lg,
  },
  termsText: {
    flex: 1,
    ...designSystem.typography.caption,
    color: designSystem.colors.textSecondary,
    lineHeight: 20,
    marginLeft: designSystem.spacing.sm,
  },
  termsLink: {
    color: designSystem.colors.primary,
    fontWeight: 'bold',
  },
  registerButton: {
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
  },
  loginButtonText: {
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
  passwordRequirements: {
    marginTop: designSystem.spacing.sm,
    marginBottom: designSystem.spacing.md,
    padding: designSystem.spacing.sm,
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: designSystem.colors.border,
  },
  requirementsTitle: {
    ...designSystem.typography.caption,
    color: designSystem.colors.textSecondary,
    fontWeight: 'bold',
    marginBottom: designSystem.spacing.xs,
  },
  requirement: {
    ...designSystem.typography.caption,
    color: designSystem.colors.textTertiary,
    marginBottom: designSystem.spacing.xs,
  },
  requirementMet: {
    color: designSystem.colors.success || '#4CAF50',
    textDecorationLine: 'line-through',
  },
});
