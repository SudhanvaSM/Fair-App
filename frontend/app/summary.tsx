import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput, } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useState } from "react";

import { Receipt, ItemWithSelection } from "@/types/item";

import { db } from "@/src/db/database";
import { createItemAssignment, createReceipt, createReceiptItem } from "@/src/services/receipt.service";
import { getMembersByGroupId } from "@/src/services/member.service";
import { createDebt } from "@/src/services/debt.service";

export default function Summary() {

	const { data } = useLocalSearchParams();
	const parsedParam = Array.isArray(data) ? data[0] : data;
	const parsedData = parsedParam ? JSON.parse(parsedParam) : null;
	
	if (!parsedData || !parsedData.result.perPerson) {
		console.log("BROKEN DATA:", parsedData);
		return <Text style={{ color: "white" }}>No Data</Text>;
	}

	const imageUri = parsedData.imageUri;

	const groupId = parsedData.groupId;
	const members = getMembersByGroupId(groupId);

	const payer = members.find((m) => m.name === 'You');

	const result = parsedData.result;

	const getTime = (date: Date) => {
			const time = date.getHours();
			if (time >= 4 && time < 12) return "Breakfast";
			if (time >= 12 && time < 16) return "Lunch";
			if (time >= 16 && time < 20) return "Snacks";
			return "Dinner";
	}

	const createdAt = new Date();
	const defaultTitle = getTime(createdAt);

	const [receiptName, setReceiptName] = useState("");

	if (receiptName.length > 20) {
		Alert.alert(
			"Invalid Title", "Title name is too long. Maximum limit is 20 characters.",
			[
				{
					text: "OK",
					style: "default"
				}
			]
		)
		setReceiptName("");
	}

	const receiptTitle = receiptName ? receiptName : defaultTitle;
	
	const receipt: Receipt = {
		title: receiptTitle,
		groupId,
		payerMemberId: payer?.id ?? members[0].id,
		subtotal: parsedData.raw?.subtotal ?? 0,
		tax: parsedData.raw?.tax ?? 0,
		finalTip: parsedData.raw?.finalTip ?? 0,
		serviceCharge: parsedData.raw?.serviceCharge ?? 0,
		createdAt: createdAt.toISOString(),
		total: parsedData.raw?.total ?? 0,
		imageUri,
	};

	const items: ItemWithSelection[] = parsedData.raw?.items ?? [];

	const [saving, setSaving] = useState(false);

	const handleSaveAndGoHome = async () => {
		if (saving) return;
		setSaving(true);

		try {
			db.withTransactionSync(() => {
				const receiptId = createReceipt(receipt);
				for (const item of items) {
					const itemId = createReceiptItem(item, receiptId);

					for (const personName of item.selectedPeople) {
						const member = members.find((m) => m.name === personName);
						if (!member) continue;
						createItemAssignment(itemId, member.id);
					}
				}
				
				for (const [personName, amount] of Object.entries(result.perPerson as Record<string, number>)) {
					if (personName === payer?.name) continue;

					const member = members.find((m) => m.name === personName);

					if (!member) continue;

					createDebt({
						receiptId,
						groupId,
						fromMemberId: member.id,
						toMemberId: receipt.payerMemberId,
						amount,
						status: 'pending'
					})
					
				}
			});

			router.replace("/(tabs)/home");
		} catch (e) {
			console.error(e);
			Alert.alert(
				"Error",
				"Failed to save receipt"
			);
			setSaving(false);
		}
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
				<View style={{ alignItems: "center", marginTop: 20 }}>
					<View style={styles.container}>
						<View style={{ marginBottom: -5 }}>
							<Text style={[styles.titleText, { fontSize: 18, textDecorationLine: "underline" }]}>Receipt Name</Text>
						</View>
						<TextInput
							keyboardType="default"
							autoCapitalize="words"
							placeholder="Enter receipt name..."
							placeholderTextColor="#888"
							value={receiptName}
							onChangeText={setReceiptName}
							style={styles.input}
						/>
						<View style={[styles.row, { borderBottomWidth: 0, paddingBottom: 0, marginTop: -5 }]}>
							<Text style={styles.titleText}>Current Title</Text>
							<Text style={styles.titleText}>{receiptTitle}</Text>
						</View>
					</View>
				</View>

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
					<View style={[styles.next, saving && { opacity: 0.6 }]}>
						<Pressable
							onPress={() => handleSaveAndGoHome()}
						>
							<Text style={styles.nextText}>
								{!saving ? ("Return to Home \n →") : "Saving..."}
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
		width: "80%",
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
	},
	input: {
		width: "80%",
		backgroundColor: "#111827",
		color: "#fff",
		paddingHorizontal: 15,
		borderRadius: 18,
		marginTop: 5,
	},
	titleText: {
		fontSize: 16,
		fontWeight: "500",
		color: "#fff",
		textAlign: "center",
	}
});