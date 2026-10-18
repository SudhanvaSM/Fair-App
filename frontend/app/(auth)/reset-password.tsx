import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";

export default function ResetPassword() {
	const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const { code } = useLocalSearchParams<{ code?: string }>();
    const [ready, setReady] = useState(false);
    const [linkError, setLinkError] = useState(false);
    const exchanged = useRef(false);

    useEffect(() => {
        if (exchanged.current) return;
        exchanged.current = true;
        (async () => {
            try {
            if (typeof code === "string" && code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) { setLinkError(true); return; }
                setReady(true);
                return;
            }
            const { data: { session } } = await supabase.auth.getSession();
            if (session) setReady(true); else setLinkError(true);
            } catch {
            setLinkError(true);
            }
        })();
        }, [code]);

	async function handleResetPassword() {
		if (!password || !confirmPassword) {
			Alert.alert(
				"Missing fields",
				"Enter and confirm your new password.",
                [{ text: "OK" }],
                {cancelable: true,}
			);
			return;
		}
		if (password.length < 8) {
            Alert.alert(
                "Weak password",
                "Your password must contain at least 8 characters.",
                [{ text: "OK" }],
                {cancelable: true,}
            );
            return;
        }
		if (password !== confirmPassword) {
            Alert.alert(
                "Passwords don't match",
                "Please enter the same password in both fields.",
                [{ text: "OK" }],
                {cancelable: true,}
            );
            return;
        }
		try {
			setLoading(true);
			const { error } = await supabase.auth.updateUser({ password });
            if (error) {
                Alert.alert(
                    "Password reset failed",
                    error.message,
                [{ text: "OK" }],
                {cancelable: true,}
                );
                return;
            }
            // Password updated successfully.
            // End the recovery session so the user returns to login.
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) {
                console.error("Sign-out after password reset failed:", signOutError.message);
            }
            Alert.alert(
                "Password updated",
                "Your password has been changed successfully. Please log in with your new password.",
                [
                    {
                        text: "Continue",
                        onPress: () => {
                            router.replace("/login");
                        },
                    },
                ],
                {cancelable: true,}
            );
		} catch {
			Alert.alert(
                "Error",
                "Something went wrong. Please try again.",
                [{ text: "OK" }],
                {cancelable: true,}
            );
        } finally {
            setLoading(false);
		}
	}
	return (
        <View style={styles.container}>
            <Text style={styles.title}>
                Reset Password
            </Text>

            <Text style={styles.description}>
                Enter a new password for your account.
            </Text>

            <TextInput
                placeholder="New password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
            />

            <TextInput
                placeholder="Confirm new password"
                placeholderTextColor="#888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
            />

            {linkError && (
                <Text style={styles.description}>
                    This reset link is invalid or has expired. Request a new one from the login screen
                    (on the same device).
                </Text>
                )}
                <Pressable style={styles.button} onPress={handleResetPassword} disabled={loading || !ready}>
                    {loading ? (
                        <ActivityIndicator color="#000000" />
                    ) : (
                        <Text style={styles.buttonText}>
                            Update Password
                        </Text>
                    )}
                </Pressable>

            <Pressable
                onPress={() => router.replace("/login")}
                style={styles.backButton}
            >
                <Text style={styles.backText}>
                    Back to Login
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 28,
        backgroundColor: "#0F172A",
    },

    title: {
        fontSize: 30,
        fontWeight: "bold",
        color: "#FFFFFF",
        textAlign: "center",
        marginBottom: 12,
    },

    description: {
        color: "#CBD5E1",
        textAlign: "center",
        marginBottom: 28,
    },

    input: {
        borderWidth: 1,
        borderColor: "#475569",
        borderRadius: 8,
        padding: 14,
        marginBottom: 14,
        backgroundColor: "#111827",
        color: "#FFFFFF",
    },

    button: {
        backgroundColor: "#FFFFFF",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 8,
    },

    buttonText: {
        color: "#000000",
        fontWeight: "bold",
    },

    backButton: {
        marginTop: 24,
        alignItems: "center",
    },

    backText: {
        color: "#FFFFFF",
    },
});