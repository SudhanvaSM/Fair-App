import { useAuth } from '@/lib/AuthProvider';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
	const { session, loading } = useAuth();

    if (loading) {
        return null;
    }

    if (session) {
        return <Redirect href="/loading"/>;
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