import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';

import { supabase } from '@/lib/supabase';
import pullInitialData from '@/lib/sync/pullInitialData';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        if (!email || !password) {
            Alert.alert('Error', 'Enter email and password');
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Alert.alert('Login failed', error.message);
            return;
        }

        try {
            await pullInitialData();
        } catch (error) {
            console.error("Initial data pull failed:", error);

            Alert.alert(
                "Sync failed",
                "Could not load your data. Please try again."
            );

            setLoading(false);
            return;
        }

        setLoading(false);
    }

    async function handleSignup() {
        if (!email || !password) {
            Alert.alert('Error', 'Enter email and password');
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        setLoading(false);

        if (error) {
            Alert.alert('Signup failed', error.message);
            return;
        }

        Alert.alert(
            'Success',
            'Account created successfully!'
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>FAIR</Text>

            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
            />

            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
            />

            <Pressable
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'Loading...' : 'Login'}
                </Text>
            </Pressable>

            <Pressable
                style={styles.signupButton}
                onPress={handleSignup}
                disabled={loading}
            >
                <Text>Don't have an account? Sign up</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },

    title: {
        fontSize: 40,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 40,
    },

    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 14,
        marginBottom: 12,
    },

    button: {
        backgroundColor: '#000',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },

    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },

    signupButton: {
        marginTop: 20,
        alignItems: 'center',
    },
});