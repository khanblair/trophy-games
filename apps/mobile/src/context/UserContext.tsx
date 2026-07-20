import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from 'convex/react';
import { api } from '@trophy-games/backend/convex/_generated/api';
import * as Application from 'expo-application';
import { router } from 'expo-router';

interface UserContextType {
  username: string | null;
  setUsername: (username: string | null) => void;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  username: null,
  setUsername: () => {},
  isLoading: true,
  logout: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsernameState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const deviceId = `${Application.applicationId}-${Application.nativeApplicationVersion}`;
  const remoteUser = useQuery(api.users.getUserByDevice, { deviceId });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem('@trophy_games_username');
        if (stored) {
          setUsernameState(stored);
        } else if (remoteUser !== undefined) {
            // Fallback: If we have it in convex but not local storage, sync it
            if (remoteUser?.username) {
                await AsyncStorage.setItem('@trophy_games_username', remoteUser.username);
                setUsernameState(remoteUser.username);
            } else {
                setUsernameState(null);
            }
        }
      } catch (e) {
        console.error('Failed to load username', e);
      } finally {
        if (remoteUser !== undefined) {
          setIsLoading(false);
        }
      }
    };
    loadUser();
  }, [remoteUser]);

  const setUsername = async (newUsername: string | null) => {
    setUsernameState(newUsername);
    if (newUsername) {
      await AsyncStorage.setItem('@trophy_games_username', newUsername);
    } else {
      await AsyncStorage.removeItem('@trophy_games_username');
    }
  };

  const logout = async () => {
    await setUsername(null);
    router.replace('/onboarding');
  };

  return (
    <UserContext.Provider value={{ username, setUsername, isLoading, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
