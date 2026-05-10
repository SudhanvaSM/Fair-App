import { Tabs, } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
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
            borderTopWidth: 2,
            borderTopColor: "#334165",
            height: 65 + insets.bottom,
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
            headerTitle: "Fair",
            tabBarIcon: ({ focused, color }) => <Ionicons name={ focused ? "home" : "home-outline" } size={24} color={color}/>,
            animation: 'shift'
          }}
          
        />
        <Tabs.Screen
          name="groups"
          options={{
            title: "Groups",
            headerTitle: 'Groups',
            tabBarIcon: ({ focused, color }) => <MaterialCommunityIcons name={ focused ? "account-group" : "account-group-outline" } size={24} color={color}/>,
            animation: 'shift'
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            headerTitle: 'History',
            tabBarIcon: ({ focused, color }) => <MaterialIcons name={ focused ? "history" : "history-toggle-off" } size={24} color={color}/>,
            animation: 'shift'
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerTitle: 'Profile',
            tabBarIcon: ({ focused, color }) => <MaterialCommunityIcons name={focused ? "account-tie" : "account-tie-outline"} size={24} color={color}/>,
            animation: 'shift'
          }}
        />
      </Tabs>
    </ActionSheetProvider>
  );
}
