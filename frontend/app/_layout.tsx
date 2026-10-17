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
            try {
                const parsedUrl = new URL(url);
                const queryParams = parsedUrl.searchParams;
                const fragment = new URLSearchParams(parsedUrl.hash.slice(1));
                const code = queryParams.get("code");
                const accssToken = fragment.get("access_token") ?? queryParams.get("access_token");
                const refreshToken = fragment.get("refresh_token") ?? queryParams.get("refresh_token");
                const tokenHash = queryParams.get("token_hash");
                let error: Error | null = null;
                if (code) {
                    const result = await supabase.auth.exchangeCodeForSession(code);
                    error = result.error;
                } else if (tokenHash) {
                    const result = await supabase.auth.verifyOtp({
                        token_hash: tokenHash,
                        type: "recovery",
                    });
                    error = result.error;
                } else if (accssToken && refreshToken) {
                    const result = await supabase.auth.setSession({
                        access_token: accssToken,
                        refresh_token: refreshToken,
                    });
                    error = result.error;
                } else {
                    console.warn(
                        "Recovery URL did not contain a recognized code or token."
                    );
                    return;
                }
                if (error) {
                    console.error(
                        "Failed to establish recovery session:",
                        error.message
                    );
                    return;
                }
                if (isMounted) {
                    router.replace("/reset-password");
                } 
            } catch (error) {
                console.error(
                    "Failed to process recovery URL: ",
                    error
                );
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