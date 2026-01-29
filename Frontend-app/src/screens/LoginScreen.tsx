import React, { useState } from 'react';
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
    if (!validateForm()) return;
    await login(email.trim(), password);
  };

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
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!errors.email}
                style={styles.input}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}

              <CustomTextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                rightIcon={showPassword ? 'eye-off' : 'eye'}
                onRightIconPress={() => setShowPassword(!showPassword)}
                error={!!errors.password}
                style={styles.input}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}

              <Button
                mode="contained"
                onPress={handleLogin}
                disabled={isLoading}
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
              >
                {isLoading ? (
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
});
