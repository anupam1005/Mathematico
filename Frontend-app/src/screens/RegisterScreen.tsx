<<<<<<< HEAD
=======
// @ts-nocheck
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
=======
  TextInput,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  Divider,
<<<<<<< HEAD
} from 'react-native-paper';
import { Icon } from '../components/Icon';
import { CustomTextInput } from '../components/CustomTextInput';
import { CustomCheckbox } from '../components/CustomCheckbox';
=======
  Checkbox,
} from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    // Simplified password validation for development
    // } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
    //   newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
    // }
=======
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686

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
<<<<<<< HEAD
      // Registration successful - user is now authenticated and will be automatically
      // redirected to the main dashboard by the AuthContext
      console.log('Registration successful - user will be redirected to dashboard');
=======
      // Navigate to login screen after successful registration
      navigation.navigate('Login');
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
            
            {/* Student Registration Note */}
            <View style={styles.studentNote}>
              <Text style={styles.studentNoteText}>
                <Text style={styles.studentNoteTitle}>Student Registration:</Text>{'\n'}
                Create your account with a strong password to access learning materials
              </Text>
            </View>

            <View style={styles.form}>
              <CustomTextInput
=======

            <View style={styles.form}>
              <TextInput
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
                label="Full Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                autoCapitalize="words"
                autoComplete="name"
                error={!!errors.name}
                style={styles.input}
<<<<<<< HEAD
                leftIcon="person"
=======
                left={<TextInput.Icon icon="account" />}
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
                testID="name-input"
                accessibilityLabel="Full name input field"
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}

<<<<<<< HEAD
              <CustomTextInput
=======
              <TextInput
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={!!errors.email}
                style={styles.input}
<<<<<<< HEAD
                leftIcon="email"
=======
                left={<TextInput.Icon icon="email" />}
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
                testID="email-input"
                accessibilityLabel="Email input field"
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}

<<<<<<< HEAD
              <CustomTextInput
=======
              <TextInput
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                autoComplete="password-new"
                error={!!errors.password}
                style={styles.input}
<<<<<<< HEAD
                leftIcon="lock"
                rightIcon={showPassword ? 'eye-off' : 'eye'}
                onRightIconPress={() => setShowPassword(!showPassword)}
=======
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
                testID="password-input"
                accessibilityLabel="Password input field"
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
<<<<<<< HEAD
              
              {/* Password Requirements */}
              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                <Text style={[styles.requirement, password.length >= 8 && styles.requirementMet]}>
                  • At least 8 characters
                </Text>
                <Text style={styles.requirement}>
                  • Use a strong password for security
                </Text>
              </View>

              <CustomTextInput
=======

              <TextInput
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry={!showConfirmPassword}
                autoComplete="password-new"
                error={!!errors.confirmPassword}
                style={styles.input}
<<<<<<< HEAD
                leftIcon="lock"
                rightIcon={showConfirmPassword ? 'eye-off' : 'eye'}
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
=======
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
                testID="confirm-password-input"
                accessibilityLabel="Confirm password input field"
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}

              <View style={styles.termsContainer}>
<<<<<<< HEAD
                <CustomCheckbox
=======
                <Checkbox
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
  studentNote: {
    backgroundColor: designSystem.colors.secondary + '10',
    borderLeftWidth: 4,
    borderLeftColor: designSystem.colors.secondary,
    padding: designSystem.spacing.md,
    marginBottom: designSystem.spacing.lg,
    borderRadius: designSystem.borderRadius.sm,
  },
  studentNoteText: {
    ...designSystem.typography.caption,
    color: designSystem.colors.textPrimary,
    lineHeight: 18,
  },
  studentNoteTitle: {
    fontWeight: 'bold',
    color: designSystem.colors.secondary,
  },
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
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
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
});
