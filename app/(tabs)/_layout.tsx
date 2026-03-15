import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { signOut } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        headerStyle: { backgroundColor: Colors.dark.background },
        headerTitleStyle: { color: '#fff' },
        tabBarStyle: { display: 'none' },
        headerRight: () => (
          <TouchableOpacity onPress={signOut} style={{ marginRight: 15 }}>
            <Ionicons name="log-out-outline" size={24} color="#E53935" />
          </TouchableOpacity>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={28} color={color} />,
        }}
      />
      {/* We can add a Profile tab later if needed */}
    </Tabs>
  );
}
