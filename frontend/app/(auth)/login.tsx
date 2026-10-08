import { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useScrollToTop } from '@react-navigation/native';
import { db } from '@/src/db/database';

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const scrollRef = useRef<ScrollView>(null);
    useScrollToTop(scrollRef);

    async function handleLogin() {
        try {
            if (!email || !password) {
                Alert.alert('Incomplete credentials', 'Enter email and password',
                    [{ text: "OK" }],
                    {cancelable: true,});
                return;
            }

            setLoading(true);

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                Alert.alert('Login failed', error.message,
                    [{ text: "OK" }],
                    {cancelable: true,});
                setEmail("");
                setPassword("");
                return;
            }

            const user = data.user;

            db.runSync(`
                INSERT INTO profile (user_id, email)
                VALUES (?, ?)
            `, [user.id, email]);

        } finally {
            setLoading(false);
        }
    }

    async function handleSignup() {
        try {
            if (!email || !password) {
                Alert.alert('Error', 'Enter email and password',
                    [{ text: "OK" }],
                    {cancelable: true,});
                return;
            }

            setLoading(true);

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                Alert.alert('Signup failed', error.message,
                    [{ text: "OK" }],
                    {cancelable: true,});
                return;
            }

            const user = data.user;

            if (!user) {
                Alert.alert("Signup incomplete", "Account was created, but no user information was returned.",
                    [{ text: "OK" }],
                    {cancelable: true,});
                return;
            }

            const { error: profileError } = await supabase
                .from("profiles")
                .upsert({
                    id: user.id,
                    email: email,
                });

            if (profileError) {
                console.error("Profile creation failed:", profileError);

                Alert.alert(
                    "Profile creation failed",
                    profileError.message,
                    [{ text: "OK" }],
                    {cancelable: true,}
                );

                return;
            }

            Alert.alert(
                'Success',
                'Account created successfully!',
                    [{ text: "OK" }],
                    {cancelable: true,}
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ref={scrollRef}
        >
            <View style={styles.container}>
                <Text style={styles.title}>FAIR</Text>

                <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.input}
                    placeholderTextColor={ '#888' }
                />

                <TextInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                    placeholderTextColor={ '#888' }
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
                    <Text
                        style={{ color: '#ffffff' }}
                    >Don't have an account? Sign up</Text>
                </Pressable>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
		backgroundColor: '#0F172A',
	},

    container: {
        flex: 1,
        justifyContent: "center",
        alignContent: "center",
        padding: 34,
    },

    title: {
        fontSize: 40,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 40,
        marginTop: 40,
        color: "#ffffff"
    },

    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 14,
        marginBottom: 12,
        
		backgroundColor: "#111827",
		color: "#ffffff",
    },

    button: {
        backgroundColor: '#ffffff',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },

    buttonText: {
        color: '#000000',
        fontWeight: 'bold',
    },

    signupButton: {
        marginTop: 20,
        alignItems: 'center',
    },
});