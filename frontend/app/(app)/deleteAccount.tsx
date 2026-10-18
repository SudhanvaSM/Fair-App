import { supabase } from "@/lib/supabase";
import { deleteLocalData, getName } from "@/src/services/user.services";
import { MaterialIcons } from "@expo/vector-icons";
import { useScrollToTop } from "@react-navigation/native";
import { router, Stack } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, View, Text, Pressable, StyleSheet, Alert, TextInput } from "react-native";

export default function DeleteAccount() {
	const scrollRef = useRef<ScrollView>(null);
	useScrollToTop(scrollRef);

	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	async function verifyPassword() {
		if (!password) {
			Alert.alert('Incomplete credentials', 'Password field cannot be empty',
				[{ text: "OK" }],
				{cancelable: true,});
			return;
		}
		try {
			await deleteAcc();
		} finally {
			setLoading(false);
		}
	}

	async function deleteAcc() {
		try {
			setLoading(true);

			// 1. Verify that the user has an active session.
			const {
				data: { session },
				error: sessionError,
			} = await supabase.auth.getSession();

			if (sessionError || !session) {
				Alert.alert(
					"Error",
					"Your session has expired. Please log in again."
				);
				return;
			}

			// 2. Delete the account through the secure Edge Function.
			const { data, error } = await supabase.functions.invoke(
				"delete-account",
				{
					body: { password }
				}
			);

			if (error) {

				const status = (error as any)?.context?.status;
				if (status === 401)  {
					Alert.alert(
						"Incorrect Password",
						"Your session may have expired, or your credentials could not be verified. Please log in again and retry.",
						[{text: "OK"}],
						{cancelable: true}
					)
				} else {
					Alert.alert(
						"Deletion failed",
						"We couldn't confirm that your account was deleted. Check your connection and try again.",
						[{text: "OK"}],
						{cancelable: true}
					);
				}
				return;
			}

			if (!data?.success) {
				console.error("Unexpected deletion response:", data);

				Alert.alert(
					"Deletion failed",
					"The server did not confirm account deletion."
				);

				return;
			}

			// 3. Account deletion succeeded on the server.
			// Do NOT sync after this point.
			try {
				// 4. Clear local data belonging to the deleted account.
				await deleteLocalData();
			} catch (localError) {
				console.error("Failed to clear local account data: ", localError);
				Alert.alert(
					"Account deleted",
					"Your account was deleted, but some local data could not be cleared. Please clear the app's local data before using it again.",
					[{text: "OK"}],
					{cancelable: true}
				);
				return;
			}

			// 5. Clear the local authentication session.
			const { error: signOutError } =
				await supabase.auth.signOut({ scope: "local" });

			if (signOutError) {
				console.error("Sign-out error:", signOutError);

				// The server-side account deletion already succeeded.
				// Do not report that account deletion failed.
			}

			// 6. Notify the user.
			Alert.alert(
				"Account deleted",
				"Your FAIR account has been deleted successfully.",
				[
					{
						text: "OK",
						onPress: () => {
							
						},
					},
				],
				{ cancelable: false }
			);

		} catch (err) {
			console.error("Account deletion error:", err);

			Alert.alert(
				"Error",
				"Something went wrong while deleting your account."
			);
		} finally {
			setLoading(false);
		}
	}

	const name = getName();
	return (
		<>
			<Stack.Screen
				options={{
					headerStyle: { backgroundColor: "#1E293B" },
					headerTitle: "Delete Account",
					headerTitleAlign: "left",
					headerShadowVisible: false,
					headerTintColor: "#ffffff",
					animation: "slide_from_right",
				}}
			/>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={{ paddingBottom: 40 }}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				ref={scrollRef}
			>
				<View style={{ alignItems: "center" }}>
					<View style={[styles.container, { flexDirection: "row", gap: 20 }]}>
						<View style={styles.avatar}>
							<MaterialIcons
								name="person"
								size={60}
								color="#000"
							/>
						</View>
						<View style={styles.textContainer}>
							<Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>{name}</Text>
						</View>
					</View>
				</View>

				<View style = {{ alignItems: "center", flex: 1, justifyContent: "center", padding: 30 }}>
					<Text style={{ color: "white", fontSize: 15, fontWeight: "400", marginBottom: 20, textAlign: "justify" }}>
						Deleting your account also deletes all groups where you are the creator.
						It does not delete the group if it has other members with valid FAIR account.
						It does not delete the group if you are not the creator.
						This action cannot be undone.{"\n"}
						{"\n"}To confirm your identity, please verify your FAIR password.
					</Text>

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
						onPress={verifyPassword}
						disabled={loading}
					>
						<Text style={styles.buttonText}>
							{loading ? 'Loading...' : 'Delete Account'}
						</Text>
					</Pressable>

				</View>
			</ScrollView>
		</>
	);
}
	
const styles = StyleSheet.create({
	scrollView: {
		backgroundColor: '#0F172A',
	},
	container: {
		marginBottom: 12,
		marginTop: 20,
		justifyContent: "center",
		alignItems: "center",
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
		width: "90%",
	},
	button: {
		backgroundColor: '#ffffff',
		padding: 15,
		borderRadius: 8,
		alignItems: 'center',
		width: "90%",
	},
	buttonText: {
		color: '#000000',
		fontWeight: 'bold',
	},
	signupButton: {
		marginTop: 20,
		alignItems: 'center',
	},
	avatar: {
		width: 70,
		height: 70,
		borderWidth: 2,
		borderColor: "#fff",
		borderRadius: 35,
		backgroundColor: "#CBD5E1",
		alignItems: "center",
		justifyContent: "center",
	},
	textContainer: {
		paddingHorizontal: 16,
		minWidth: 0,
	},
});