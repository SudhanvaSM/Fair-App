import { Tabs, } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActionSheetProvider }  from '@expo/react-native-action-sheet';

export default function TabsLayout() {
  return (
    <ActionSheetProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#10B981",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: "#1E293B",
          },
          headerShadowVisible: false,
          headerTintColor: "#fff",
          tabBarStyle: {
            backgroundColor: "#1E293B"
          },
        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            headerTitle: 'Fair',
            tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color}/>
          }}
          
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            headerTitle: 'History',
            tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color}/>
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerTitle: 'Profile',
            tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color}/>
          }}
        />
      </Tabs>
    </ActionSheetProvider>
  );
}
