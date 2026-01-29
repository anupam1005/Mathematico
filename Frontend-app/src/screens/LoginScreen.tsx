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

    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = 'Please enter a valid email';

    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';

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

            <CustomTextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!errors.email}
            />
            {errors.email && <Text style={styles.error}>{errors.email}</Text>}

            <CustomTextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightIcon={showPassword ? 'eye-off' : 'eye'}
              onRightIconPress={() => setShowPassword(!showPassword)}
              error={!!errors.password}
            />
            {errors.password && (
              <Text style={styles.error}>{errors.password}</Text>
            )}

            <Button
              mode="contained"
              onPress={handleLogin}
              disabled={isLoading}
              style={styles.loginButton}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                'Sign In'
              )}
            </Button>

            <Divider style={{ marginVertical: 16 }} />

            <Button mode="text" onPress={() => navigation.navigate('Register')}>
              Create an account
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: designSystem.colors.background },
  scrollContainer: { padding: designSystem.spacing.lg },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 80, height: 80 },
  title: { color: designSystem.colors.primary },
  subtitle: { textAlign: 'center' },
  card: { borderRadius: 12 },
  cardTitle: { textAlign: 'center', marginBottom: 16 },
  loginButton: { marginTop: 16 },
  error: { color: designSystem.colors.error, marginBottom: 8 },
});
