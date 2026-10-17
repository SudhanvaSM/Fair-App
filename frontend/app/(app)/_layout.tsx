import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/AuthProvider';

export default function AppLayout() {
    const { session, loading } = useAuth();

    if (loading) {
        return null;
    }

    if (!session) {
        return <Redirect href="/(auth)/login"/>;
    }

    return (
        <Stack>
            <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false }}
            />
        </Stack>
    );
}