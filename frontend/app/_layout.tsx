import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from '@/lib/AuthProvider';
import { useEffect } from 'react';
import { initializeDatabase } from '@/src/db/schema';
import * as Linking from "expo-linking";
import { supabase } from '@/lib/supabase';

export default function RootLayout() {
    useEffect(() => {
      	initializeDatabase();
    }, []);
    
    return (
        <AuthProvider>
            <ActionSheetProvider>
                <PaperProvider>
                    <StatusBar style="light" />
                    <Stack>
                        <Stack.Screen
                            name="(auth)"
                            options={{
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen
                            name="(app)"
                            options={{
                                headerShown: false,
                            }}
                        />
                    </Stack>
                </PaperProvider>
            </ActionSheetProvider>
        </AuthProvider>
    );
}