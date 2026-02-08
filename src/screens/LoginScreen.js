import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { authAPI } from '../services/api';
import { setAuthToken } from '../services/api';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Card } from '../components/UI/Card';
import { COLORS, SIZES, GRADIENTS } from '../utils/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert(t('error'), t('pleaseEnterBothUsernameAndPassword'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.login(username, password);
      
      // Set token in memory storage
      setAuthToken(response.token);
      
      // Use the login function from AuthContext
      await login(response.token);
    } catch (error) {
      Alert.alert(t('loginFailed'), error.error || t('anErrorOccurredDuringLogin'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>🧵</Text>
            </View>
          </View>
          <Text style={styles.title}>{t('welcome')}</Text>
          <Text style={styles.subtitle}>{t('signInToYourTailorShop')}</Text>
        </View>

        <View style={styles.formContainer}>
          <Card variant="elevated" padding="lg">
            <View style={styles.form}>
              <Input
                label={t('username')}
                value={username}
                onChangeText={setUsername}
                placeholder={t('enterYourUsername')}
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={<Text style={styles.inputIcon}>👤</Text>}
              />

              <Input
                label={t('password')}
                value={password}
                onChangeText={setPassword}
                placeholder={t('enterYourPassword')}
                secureTextEntry
                leftIcon={<Text style={styles.inputIcon}>🔒</Text>}
              />

              <Button
                title={t('signIn')}
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                size="large"
                style={styles.loginButton}
              />
            </View>
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('defaultCredentials')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  scrollContent: {
    flexGrow: 1,
  },
  
  header: {
    alignItems: 'center',
    paddingTop: SIZES.padding.xxl * 2,
    paddingBottom: SIZES.padding.xl,
    paddingHorizontal: SIZES.padding.lg,
  },
  
  logoContainer: {
    marginBottom: SIZES.padding.lg,
  },
  
  logo: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SIZES.shadow.lg,
  },
  
  logoText: {
    fontSize: 40,
  },
  
  title: {
    fontSize: SIZES.xxxlarge,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.padding.sm,
    textAlign: 'center',
  },
  
  subtitle: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SIZES.padding.lg,
  },
  
  formContainer: {
    flex: 1,
    paddingHorizontal: SIZES.padding.lg,
    paddingBottom: SIZES.padding.xl,
  },
  
  form: {
    gap: SIZES.padding.md,
  },
  
  inputIcon: {
    fontSize: SIZES.large,
    color: COLORS.textLight,
  },
  
  loginButton: {
    marginTop: SIZES.padding.md,
  },
  
  footer: {
    alignItems: 'center',
    marginTop: SIZES.padding.lg,
  },
  
  footerText: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
