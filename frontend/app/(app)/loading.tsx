import Ring from '@/components/LoadingWheel';
import pullInitialData from '@/lib/sync/pullInitialData';
import { SyncStep } from '@/types/item';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '@/src/db/database';
import { supabase } from '@/lib/supabase';
import { deleteLocalData } from '@/src/services/user.services';

export default function LoadingScreen() {
	const insets = useSafeAreaInsets();

	const [currentStep, setCurrentStep] = useState<SyncStep>("groups");

	const goToHome = () => {
		router.replace("/(app)/(tabs)/home");
	}

	const loadData = async () => {
		// await supabase.auth.signOut({ scope: "local" });
		// deleteLocalData();
		const result = db.getFirstSync<{ value: string }>(`
				SELECT value
				FROM app_state
				WHERE key = ?
			`, ["initial_sync_completed"]);

		const initialSyncCompleted = result?.value === "true";

		if (initialSyncCompleted) {
			goToHome();
		}
		else {
			try {
				await pullInitialData((step) => {
					setCurrentStep(step);
				});

				await new Promise(resolve => setTimeout(resolve, 250));
				goToHome();

			} catch (error) {
				console.error("Initial data pull failed:", error);
				Alert.alert(
					"Sync failed",
					"Could not load your data. Please try again."
				);
			}
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const stepText: Record<SyncStep, { text: string, progress: number }> = {
		profile: {
			text: "Fetching Profile",
			progress: 1
		},
		groups: {
			text: "Fetching Groups",
			progress: 2
		},
		members: {
			text: "Fetching Members",
			progress: 3
		},
		receipts: {
			text: "Fetching Receipts",
			progress: 4
		},
		items: {
			text: "Fetching Items",
			progress: 5
		},
		assignments: {
			text: "Fetching Assignments",
			progress: 6
		},
		debts: {
			text: "Fetching Debts",
			progress: 7
		},
		settlements: {
			text: "Fetching Settlements",
			progress: 8
		},
		complete: {
			text: "Sync Complete",
			progress: 9
		}
	}

	const len = Object.keys(stepText).length;

	return (
		<>
			<Stack.Screen
                options={{
                    headerShown: false,
                    headerStyle: {
                        backgroundColor: "#1E293B",
                    },
                    headerShadowVisible: false,
					headerTintColor: "#fff",
                }}
            />
			<View style={[styles.container, { paddingVertical: insets.top, }]}>
				<Ring
					size={60}
					strokeWidth={2}
					duration={1500}
					color='#ffffff'
				/>
				<Text
					style={styles.text}
				>
					{stepText[currentStep].text}
					{"\n"}
					{stepText[currentStep].progress} out of {len}
				</Text>
			</View>
		</>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: '#0F172A',
	},

	text: {
		color: "#ffffff",
		marginTop: 10,
		fontSize: 20,
		fontWeight: 500,
		textAlign: "center",
	},
})