import { View, Text, StyleSheet, ScrollView, Pressable, } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SplitHistory } from "@/types/item";

export default function Summary() {

	const { data, group } = useLocalSearchParams();
	const parsedParam = Array.isArray(data) ? data[0] : data;
	const parsedData = parsedParam ? JSON.parse(parsedParam) : null;
	
	if (!parsedData || !parsedData.result.perPerson) {
		console.log("BROKEN DATA:", parsedData);
		return <Text style={{ color: "white" }}>No Data</Text>;
	}

	const parsedGroup = group ? JSON.parse(Array.isArray(group) ? group[0] : group) : null;

	const result = parsedData.result;

	const saveHistory = async(data: SplitHistory) => {
		const existing = await AsyncStorage.getItem("history");
		const parsed = existing ? JSON.parse(existing) : [];
		const updated = [data, ...parsed].slice(0, 10);
		await AsyncStorage.setItem("history", JSON.stringify(updated));
	};

	const handleSaveAndGoHome = async () => {
		await saveHistory({
			id: Date.now(),
			result: parsedData.result,
			createdAt: new Date().toISOString(),
			raw: {
				items: parsedData.raw?.items,
				subtotal: parsedData.raw?.subtotal,
				tax: parsedData.raw?.tax,
				total: parsedData.raw?.total,
				serviceCharge: parsedData.raw?.serviceCharge,
				finalTip: parsedData.raw?.finalTip
			},
			thing: parsedData.assignedItems,
		});

		router.replace("/(tabs)/home");
	};

	return (
		<>
			<Stack.Screen
				options={{
					headerStyle: { backgroundColor: "#1E293B" },
					headerTitle: "Summary",
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
			>
				<View style={{ alignItems: "center", marginTop: 20, }}>
					<View style={styles.container}>
						{Object.entries(result.perPerson as Record<string, number>).sort(([, a], [, b]) => b - a).map(([person, amount]) => (
							<View 
								key={person}
								style={styles.row}
								>
								<Text 
									style={[styles.text,  person === "You" && {fontWeight: "800", color: "#FFD700"}]}>
									{person}
								</Text>
								<Text 
									style={[styles.text,  person === "You" && {fontWeight: "800", color: "#FFD700"}]}>
									₹{amount.toFixed(2)}
								</Text>
							</View>
							))}
							<View style={{ marginTop: 10 }}>
								<View 
								style={styles.row}
								>
									<Text style={[styles.text, { fontWeight: "700", fontSize: 20, }]}>Total</Text>
									<Text style={[styles.text, { fontWeight: "700", fontSize: 20, }]}>₹{Object.values(result.perPerson as Record<string, number>).reduce((a, b) => a + b, 0).toFixed(2)}</Text>								
								</View>
							</View>

							<View style={{ marginTop: 10 }}>
								<View 
								style={styles.row}
								>
									<Text style={[styles.text, { fontWeight: "700" }]}>Paid By</Text>
									<Text style={[styles.text, { fontWeight: "700" }]}>You</Text>							
								</View>
							</View>
					</View>
				</View>

				<View style={{alignItems: "center", marginTop: 20}}>
					<View style={styles.next}>
						<Pressable
							onPress={() => handleSaveAndGoHome()}
						>
							<Text style={styles.nextText}>
								Return to Home {"\n"} →
							</Text>
						</Pressable>
					</View>
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
		width: "90%",
		backgroundColor: "#334155",
		borderRadius: 30,
		elevation: 2,
		overflow: "hidden",
		gap: 20,
		paddingVertical: 20,
		alignItems: "center"
	},
	text: {
		fontSize: 16,
		fontWeight: "500",
		color: "#fff",
		paddingVertical: 4,
	},
	next: {
		width: "50%",
		backgroundColor: "#10B981",
		borderRadius: 20,
		overflow: "hidden",
		paddingHorizontal: 20,
		paddingVertical: 10,
		marginTop: 20,
	},
	nextText: {
		color: "#fff", 
		fontSize: 20,
		fontWeight: "600",
		textAlign: "center",
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		width: "80%",
		borderBottomWidth: 0.5,
		borderBottomColor: "#aaa",
		paddingBottom: 8,
	}
});