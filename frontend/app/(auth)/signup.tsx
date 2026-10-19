import { supabase } from "@/lib/supabase";
import { useScrollToTop } from "@react-navigation/native";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Alert, ScrollView, View, Text, TextInput, Pressable, StyleSheet } from "react-native";

export default function SignUp() {

	const delay = (ms: number) =>
		new Promise(resolve => setTimeout(resolve, ms));

	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const scrollRef = useRef<ScrollView>(null);
	useScrollToTop(scrollRef);

	async function handleSignup() {
		
		try {
			if (!email || !password || !name) {
				Alert.alert('Error', 'Enter valid credentials',
					[{ text: "OK" }],
					{cancelable: true,});
				return;
			}

			if (password.length < 8) {
				Alert.alert("Weak password", 
					"Your password must contain at least 8 characters.",
					[{text: "OK"}],
					{cancelable: true}
				);
			return;
			}

			setLoading(true);

			const { data, error } = await supabase.auth.signUp({
				email: email.trim(),
				password,
				options: {
					data: {
						name: name.trim(),
					}
				}
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

			Alert.alert(
				'Success',
				'Account created successfully!',
					[{ text: "OK" }],
					{cancelable: true,}
			);

			await delay(100);

		} finally {
			setLoading(false);
		}
	}

	function handleLogin() {
		router.push('/login');
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
					placeholder="Name"
					value={name}
					onChangeText={setName}
					autoCapitalize="words"
					style={styles.input}
					placeholderTextColor={ '#888' }
				/>

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
					onPress={handleSignup}
					disabled={loading}
				>
					<Text style={styles.buttonText}>
						{loading ? 'Creating account...' : 'Sign up'}
					</Text>
				</Pressable>

				<Pressable
					style={styles.signupButton}
					onPress={handleLogin}
					disabled={loading}
				>
					<Text
						style={{ color: '#ffffff' }}
					>Already have an account? Log in</Text>
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