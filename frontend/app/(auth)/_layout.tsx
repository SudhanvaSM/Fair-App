import { useAuth } from '@/lib/AuthProvider';
import { Redirect, Stack, useSegments } from 'expo-router';

export default function AuthLayout() {
	const { session, loading } = useAuth();
    const segments = useSegments();

    if (loading) {
        return null;
    }

    // Allow password recovery to remain accessible even when
    // Supabase has established a session.
    const isResetPasswordScreen = (segments as string[]).includes('reset-password');

    if (session && !isResetPasswordScreen) {
        return <Redirect href="/loading" />;
    }

	return (
        <Stack
            screenOptions={{
                headerShown: false,
                headerStyle: {
                    backgroundColor: '#1E293B',
                },
                headerShadowVisible: false,
                headerTintColor: '#fff',
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
        </Stack>
    );
}