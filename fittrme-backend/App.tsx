/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar, ActivityIndicator, View, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthContext, AuthContextType, User } from './src/context/AuthContext';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('fittrme_token');
        const u = await AsyncStorage.getItem('fittrme_user');
        setToken(t);
        setUser(u ? (JSON.parse(u) as User) : null);
      } catch {
        setToken(null);
        setUser(null);
      }
    })();
  }, []);

  const auth = useMemo<AuthContextType>(
    () => ({
      token: token ?? null,
      user: user ?? null,
      signIn: async (tok: string, u: User) => {
        await AsyncStorage.setItem('fittrme_token', tok);
        await AsyncStorage.setItem('fittrme_user', JSON.stringify(u));
        setToken(tok);
        setUser(u);
      },
      signOut: async () => {
        await AsyncStorage.removeItem('fittrme_token');
        await AsyncStorage.removeItem('fittrme_user');
        setToken(null);
        setUser(null);
      },
    }),
    [token, user]
  );

  if (token === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B1220', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#7EE7C8" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={auth}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}
