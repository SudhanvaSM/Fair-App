import { Tabs, } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActionSheetProvider }  from '@expo/react-native-action-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <ActionSheetProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#10B981",
          tabBarInactiveTintColor: "#94A3B8",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: "#1E293B",
          },
          headerShadowVisible: false,
          headerTintColor: "#fff",
          tabBarStyle: {
            backgroundColor: "#1E293B",
            borderTopWidth: 1,
            borderTopColor: "#334155",
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 5,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
          }
        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            headerTitle: "Split Scene",
            tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color}/>,
            animation: 'shift'
          }}
          
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            headerTitle: 'History',
            tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color}/>,
            animation: 'shift'
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerTitle: 'Profile',
            tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color}/>,
            animation: 'shift'
          }}
        />
      </Tabs>
    </ActionSheetProvider>
  );
}
