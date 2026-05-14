import {Text, View, StyleSheet, ScrollView, Pressable, Alert} from "react-native"
import { router, Stack, useLocalSearchParams } from "expo-router";
import { AssignmentList, DebtDetails, Item, Receipt, SplitHistory } from "@/types/item";
import React from "react";
import { getDetailedReceipt, getItemsList, getDebtsList, getAssignmentsList, clearReceipt } from "@/src/services/receipt.service";
import { getMemberName } from "@/src/services/member.service";

export default function DetailedGroup() {
	const { groupId } = useLocalSearchParams();
	const id = Number(groupId);

	const receipt: Receipt = getDetailedReceipt(id);
	const items: Item[] = getItemsList(id);
	const debts: DebtDetails[] = getDebtsList(id);
	const assignments: AssignmentList[] = getAssignmentsList(id);

	const totalDebts = debts.reduce((sum: number, debt: DebtDetails) => sum + debt.amount, 0);

	const payer = getMemberName(receipt.payerMemberId);
	const payerTotal = receipt.total - totalDebts;

	const date = new Date(receipt.createdAt);

	const grouped = new Map();
	for (const item of assignments) {
		if (!grouped.has(item.itemId)) {
			grouped.set(item.itemId, {
				item_id: item.itemId,
				name: item.name,
				selectedPeople: [],
			});
		}
		grouped.get(item.itemId).selectedPeople.push(item.memberName);
	}
	const peopleSelections = Array.from(grouped.values());

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
							clearReceipt(id);
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
						{debts.map((debt) => {
							return (
							<View key={debt.id} style={styles.row}>
								<View style={{ alignItems: "center", justifyContent: "center" }}>
									<Text style={styles.text}>{debt.from_member}</Text>
								</View>
								<View style={{ flexDirection: "column", justifyContent: "center", alignItems: "flex-end" }}>
									<Text style={[styles.text, { fontWeight: "700" }]}>₹{debt.amount.toFixed(2)}</Text>
									<Text style={styles.text}>Owes {debt.to_member}</Text>
								</View>
							</View>
							);
						})}
						<View style={styles.row}>
							<View style={{ alignItems: "center", justifyContent: "center" }}>
								<Text style={[styles.text, { fontWeight: "700", color: "#FFD700" }]}>{payer?.name}</Text>
							</View>
							<View style={{ flexDirection: "column", justifyContent: "center", alignItems: "flex-end" }}>
								<Text style={[styles.text, { fontWeight: "700", color: "#FFD700" }]}>₹{payerTotal.toFixed(2)}</Text>
								<Text style={styles.text}>Paid upfront</Text>
							</View>
						</View>
					</View>
				</View>

				<View style ={{ alignItems: "center", marginTop: 40}}>
					<View style={[styles.container, { backgroundColor: "#334155" }]}>
						<Text style={[styles.text, { fontWeight: "600", fontSize: 18, textDecorationLine: "underline" }]}>Items</Text>
						{items.map((item: Item) => {
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
						{peopleSelections.map((item) => {
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
								<Text style={styles.text}>₹{receipt.subtotal.toFixed(2) ?? 0}</Text>
							</View>

							<View style={styles.row}>
								<Text style={styles.text}>Tax:</Text>
								<Text style={styles.text}>₹{receipt.tax.toFixed(2) ?? 0}</Text>
							</View>

							<View style={styles.row}>
								<Text style={styles.text}>Service Charge:</Text>
								<Text style={styles.text}>₹{receipt.serviceCharge ?? 0}</Text>
							</View>

							<View style={styles.row}>
								<Text style={styles.text}>Tips:</Text>
								<Text style={styles.text}>₹{receipt.finalTip ?? 0}</Text>
							</View>

							<View style={styles.row}>
								<Text style={styles.text}>Total:</Text>
								<Text style={styles.text}>₹{receipt.total.toFixed(2) ?? 0}</Text>
							</View>
					</View>
				</View>

				<View style ={{ alignItems: "center", marginTop: 40}}>
					<View style={[styles.container, { backgroundColor: "#2B3648" }]}>
						<Text style={[styles.text, { fontWeight: "600", fontSize: 18, textDecorationLine: "underline" }]}>Other</Text>
							<View style={styles.row}>
								<Text style={styles.text}>Receipt ID:</Text>
								<Text style={styles.text}>{receipt.id ?? 0}</Text>
							</View>

							<View style={styles.row}>
								<Text style={styles.text}>Date:</Text>
								<Text style={styles.text}>{date.toLocaleDateString([], { day:"2-digit", month: "long", year: "numeric" }) ?? 0}</Text>
							</View>

							<View style={styles.row}>
								<Text style={styles.text}>Time:</Text>
								<Text style={styles.text}>{date.toLocaleTimeString([], { hour:"2-digit", minute: "2-digit" }) ?? 0}</Text>
							</View>
					</View>

					<Pressable 
						hitSlop={20}
						onPress={(e) => {
							e.stopPropagation();
							removeItem(receipt.id || -1)}}
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
