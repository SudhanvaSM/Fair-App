import { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useScrollToTop } from '@react-navigation/native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';

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

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                Alert.alert('Login failed', error.message,
                    [{ text: "OK" }],
                    {cancelable: true,});
                setPassword("");
                return;
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleSignup() {
        router.push("/signup");
    }

    async function resetPassword() {
        const trimmedEmail = email.trim();
        if(!trimmedEmail){
            Alert.alert(
                "Email Required",
                "Enter your email address first",
                [{ text: "OK" }],
                {cancelable: true,}
            );
            return;
        }
        try {
            setLoading(true);
            const redirectTo = Linking.createURL('reset-password');
            console.log("redirect link: ", redirectTo);
            const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
                redirectTo,
            });
            if (error) {
                Alert.alert("Unable to send email", "Please try again later."),
                [{ text: "OK" }],
                {cancelable: true,};
                return;
            }
            Alert.alert(
                "Check you email",
                "We've sent password-reset instructions if an account exists for this email.",
                [{ text: "OK" }],
                {cancelable: true,}
            );
        } catch {
            Alert.alert(
                "Error",
                "Something went wrong. Please try again later.",
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
                    onPress={resetPassword}
                    disabled={loading}
                >
                    <Text
                        style={{ color: '#ffffff' }}
                    >Forgot Password? Click here to reset</Text>
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