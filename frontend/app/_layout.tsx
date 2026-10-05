import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from '@/lib/AuthProvider';
import { useEffect } from 'react';
import { initializeDatabase } from '@/src/db/schema';

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