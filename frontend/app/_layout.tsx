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

    useEffect(() => {
        let isMounted = true;

        async function handleRecoveryUrl(url: string) {
            if (!/:\/\/\/?reset-password\/?(\?|#|$)/.test(url)) return;
            const code = new URL(url).searchParams.get("code");
            if (!code) return;
            try {
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (!error && isMounted) router.replace("/reset-password");
            } catch (e) { 
                console.error("Recovery failed"); 
            }
        }

        Linking.getInitialURL().then((url) => {
            if (url) {
                void handleRecoveryUrl(url);
            }
        });

        const subscription = Linking.addEventListener(
            "url",
            ({ url }) => {
                void handleRecoveryUrl(url);
            }
        );

        return () => {
            isMounted = false;
            subscription.remove();
        };
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