import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@trophy-games/backend/convex/_generated/api';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { User } from 'lucide-react-native';
import { themeColors } from '../theme/colors';

export default function OnboardingScreen() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const registerUser = useMutation(api.users.registerUser);
  const checkUsername = useQuery(api.users.checkUsername, { username: username.trim() });

  const getDeviceId = () => {
    return `${Application.applicationId}-${Application.nativeApplicationVersion}`;
  };

  const handleContinue = async () => {
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (checkUsername?.available === false) {
      setError('Username is already taken');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const deviceId = getDeviceId();
      const result = await registerUser({ username: trimmed, deviceId });
      
      if (result.success) {
        await AsyncStorage.setItem('@trophy_games_username', trimmed);
        router.replace('/(tabs)');
      } else {
        setError(result.reason || 'Failed to register username');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <User size={48} color={themeColors.primary} />
        </View>
        
        <Text style={styles.title}>Welcome to Trophy Games</Text>
        <Text style={styles.subtitle}>Choose a unique username to secure your account and manage your VIP access tokens.</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Choose a username..."
            placeholderTextColor={themeColors.textMuted}
            value={username}
            onChangeText={(t) => { setUsername(t); setError(''); }}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
          {username.length >= 3 && checkUsername !== undefined && (
            <Text style={[styles.availability, { color: checkUsername.available ? themeColors.primary : '#EF4444' }]}>
              {checkUsername.available ? '✓ Available' : '✗ Taken'}
            </Text>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity 
          style={[
            styles.button,
            (username.trim().length < 3 || checkUsername?.available === false) && styles.buttonDisabled
          ]}
          onPress={handleContinue}
          disabled={loading || username.trim().length < 3 || checkUsername?.available === false}
        >
          {loading ? (
            <ActivityIndicator color={themeColors.background} />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: themeColors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: themeColors.borderHairline,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: themeColors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: themeColors.textMuted,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.borderHairline,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: themeColors.textPrimary,
  },
  availability: {
    position: 'absolute',
    right: 16,
    top: 18,
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    backgroundColor: themeColors.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: themeColors.surfaceSecondary,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: themeColors.background,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
