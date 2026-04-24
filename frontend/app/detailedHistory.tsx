import {Text, View, StyleSheet, ScrollView, Pressable, Alert} from "react-native"
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Item, ItemWithSelection, SplitHistory } from "@/types/item";
import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function DetailedHistory() {
	const { data } = useLocalSearchParams();
	const parsed = data ? JSON.parse(data as string) : null;

	if (!parsed || !parsed.result?.perPerson) {
  		return <Text style={{ color: "white" }}>No Data</Text>;
	}	

	const result = parsed.result;

	const removeItem = (id: number) => {
		Alert.alert (
			"Confirm Action",
			"Are you sure you want to delete this split?",
			[
				{
					text: "Cancel",
					style: "cancel",
				},
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							const stored = await AsyncStorage.getItem("history");
							const parsed = stored ? JSON.parse(stored) : [];
							const updated = parsed.filter((item: SplitHistory) => item.id !== id);
							await AsyncStorage.setItem("history", JSON.stringify(updated));
							router.back();
						} 
						catch (e) {
							console.error("Delete failed:", e);
						}
					}
				}
			]
		);
	};

	return (
		<>
			<Stack.Screen
				options={{
					headerStyle: { backgroundColor: "#1E293B" },
					headerTitle: "Detailed History",
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
				<View style ={{ alignItems: "center", marginTop: 40, }}>
					<View style={[styles.container, { backgroundColor: "#2B3648" }]}>
						<Text style={[styles.text, { fontWeight: "600", fontSize: 18, textDecorationLine: "underline" }]}>Breakdown</Text>
						{Object.entries(result.breakdown as Record<string, number>).map(([person, subtotal]) => {
							const total = result.perPerson?.[person] ?? 0;
							return (
							<View key={person} style={styles.row}>
								<View style={{ alignItems: "center", justifyContent: "center" }}>
									<Text style={styles.text}>{person}</Text>
								</View>
								<View style={{ flexDirection: "column", justifyContent: "center", alignItems: "flex-end" }}>
									<Text style={[styles.text, { color: "#b3acac" }]}>Subtotal: ₹{subtotal.toFixed(2)}</Text>
									<Text style={[styles.text, { fontWeight: "700" }]}>Total: ₹{total.toFixed(2)}</Text>
								</View>
							</View>
							);
						})}
					</View>
				</View>

				<View style ={{ alignItems: "center", marginTop: 40}}>
					<View style={[styles.container, { backgroundColor: "#334155" }]}>
						<Text style={[styles.text, { fontWeight: "600", fontSize: 18, textDecorationLine: "underline" }]}>Items</Text>
						{parsed.raw.items.map((item: Item) => {
							return (
								<View key={item.item_id} style={styles.row}>
									<Text style={styles.text}>{item.qty} x {item.name}</Text>
									<Text style={[styles.text, { flex: 1, textAlign: "right" }]}>
										₹{item.total_price}
									</Text>
								</View>
							);
						})}
					</View>
				</View>

				<View style ={{ alignItems: "center", marginTop: 40}}>
					<View style={[styles.container, { backgroundColor: "#2B3648" }]}>
						<Text style={[styles.text, { fontWeight: "600", fontSize: 18, textDecorationLine: "underline" }]}>Who Ate What</Text>
						{parsed.thing?.map((item: ItemWithSelection) => {
							return (
							<View key={item.item_id} style={styles.row}>
								<View style={{ alignItems: "flex-start", justifyContent: "center" }}>
									<Text style={styles.text}>{item.name}</Text>
									<Text style={styles.people}>{item.selectedPeople.join(", ")}</Text>
								</View>
							</View>
							);
						})}
					</View>
				</View>

				<View style ={{ alignItems: "center", marginTop: 40}}>
					<View style={[styles.container, { backgroundColor: "#334155" }]}>
						<Text style={[styles.text, { fontWeight: "600", fontSize: 18, textDecorationLine: "underline" }]}>Bill Details</Text>
							<View style={styles.row}>
								<Text style={styles.text}>Subtotal:</Text>
								<Text style={styles.text}>₹{parsed.raw.subtotal.toFixed(2) ?? 0}</Text>
							</View>

							<View style={styles.row}>
								<Text style={styles.text}>Tax:</Text>
								<Text style={styles.text}>₹{parsed.raw.tax.toFixed(2) ?? 0}</Text>
							</View>

							<View style={styles.row}>
								<Text style={styles.text}>Service Charge:</Text>
								<Text style={styles.text}>₹{parsed.raw.serviceCharge ?? 0}</Text>
							</View>

							<View style={styles.row}>
								<Text style={styles.text}>Total:</Text>
								<Text style={styles.text}>₹{parsed.raw.total.toFixed(2) ?? 0}</Text>
							</View>
					</View>
				</View>

				<View style ={{ alignItems: "center", marginTop: 40}}>
					<View style={[styles.container, { backgroundColor: "#2B3648" }]}>
						<Text style={[styles.text, { fontWeight: "600", fontSize: 18, textDecorationLine: "underline" }]}>Other</Text>
							<View style={styles.row}>
								<Text style={styles.text}>ID:</Text>
								<Text style={styles.text}>{parsed.id ?? 0}</Text>
							</View>

							<View style={styles.row}>
								<Text style={styles.text}>Date:</Text>
								<Text style={styles.text}>{new Date(parsed.createdAt).toLocaleDateString([], { day:"2-digit", month: "2-digit", year: "numeric" }) ?? 0}</Text>
							</View>

							<View style={styles.row}>
								<Text style={styles.text}>Time:</Text>
								<Text style={styles.text}>{new Date(parsed.createdAt).toLocaleTimeString([], { hour:"2-digit", minute: "2-digit" }) ?? 0}</Text>
							</View>
					</View>

					<Pressable 
						hitSlop={20}
						onPress={(e) => {
							e.stopPropagation();
							removeItem(parsed.id)}}
						style={{justifyContent: "center", marginTop: 20}}
						>
							<Text style={[styles.text, { textDecorationLine: "underline", color: "red", fontSize: 18 }]}>Remove Split</Text>
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
		width: "90%",
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
	people: {
		fontSize: 16,
		fontWeight: "300",
		color: "#fff",
	},
	next: {
		width: "50%",
		backgroundColor: "#7C3AED",
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
