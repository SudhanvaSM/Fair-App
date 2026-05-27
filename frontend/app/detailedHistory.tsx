import {Text, View, StyleSheet, ScrollView, Pressable, Alert, Image, Share } from "react-native"
import { router, Stack, useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Menu } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AssignmentList, DebtDetails, Item, Receipt } from "@/types/item";

import { getDetailedReceipt, getItemsList, getDebtsList, getAssignmentsList, clearReceipt } from "@/src/services/receipt.service";
import { getMemberName } from "@/src/services/member.service";
import { getDetailedGroup, getGroupName } from "@/src/services/group.service";

import useScrollToTop from "./hooks/useScrollToTop";

import genereteReceiptSummary from "@/utils/generateReceiptSummary";

export default function DetailedHistory() {
	const { receiptId } = useLocalSearchParams();
	const id = Number(receiptId);

	const scrollRef = useScrollToTop();

	const receipt: Receipt = getDetailedReceipt(id);
	const items: Item[] = getItemsList(id);
	const debts: DebtDetails[] = getDebtsList(id);
	const assignments: AssignmentList[] = getAssignmentsList(id);

	const groupTitle = getGroupName(receipt.groupId);

	const totalDebts = debts.reduce((sum: number, debt: DebtDetails) => sum + debt.amount, 0);

	const payer = getMemberName(receipt.payerMemberId);
	const payerTotal = receipt.total - totalDebts;

	const date = new Date(receipt.createdAt);

	const grouped = new Map();
	for (const item of assignments) {
		if (!grouped.has(item.itemId)) {
			grouped.set(item.itemId, {
				itemId: item.itemId,
				name: item.name,
				selectedPeople: [],
			});
		}
		grouped.get(item.itemId).selectedPeople.push(item.memberName);
	}
	const peopleSelections = Array.from(grouped.values());

	const [visible, setVisible] = useState(false);
	
	const openMenu = () => setVisible(true);
	const closeMenu = () => setVisible(false);

	const goToGroup = (groupId: number) => {
		closeMenu();
		const detailedGroup = getDetailedGroup(groupId);
		router.push({
			pathname: "/detailedGroups",
			params: {
				groupData: JSON.stringify(detailedGroup),
			}
		})
	}

	const summary = genereteReceiptSummary(receipt, debts, items, groupTitle, payer.name);

	const copyToClipboard = async() => {
		await Clipboard.setStringAsync(summary);
	}

	const shareAsMessage = async() => {
		await Share.share({ message: summary });
	}

	const removeItem = (id: number) => {
		closeMenu();
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
			],
			{
				cancelable: true,
			}
		);
	};

	return (
		<>
			<Stack.Screen
				options={{
					headerStyle: { backgroundColor: "#1E293B" },
					headerTitle: () => (
						<Text
							style={styles.headerTitle}
							numberOfLines={1}
							ellipsizeMode="tail"
						>{receipt.title}</Text>
					),
					headerTitleAlign: "left",
					headerShadowVisible: false,
					headerTintColor: "#ffffff",
					animation: "slide_from_right",
					headerRight: () => (
						<Menu
							contentStyle={{ marginTop: 35, borderRadius: 20, backgroundColor: "#334155" }}
							visible={visible}
							onDismiss={closeMenu}
							anchor={
								<Pressable 
									style={{ justifyContent: "center", alignItems: "center" }}
									hitSlop={10} 
									onPress={openMenu}
								>
									<MaterialCommunityIcons
										name={"dots-vertical"}
										color={"white"}
										size={24}
									/>
								</Pressable>
							}
						>
							<Menu.Item
								hitSlop={10}
								onPress={() => goToGroup(receipt.groupId)}
								title="Group info"
								titleStyle={{ color: "#fff" }}
							/>
							<Menu.Item
								hitSlop={10}
								onPress={() => {copyToClipboard()}}
								title="Copy Split"
								titleStyle={{ color: "#fff" }}
							/>
							<Menu.Item
								hitSlop={10}
								onPress={() => {shareAsMessage()}}
								title="Share Split"
								titleStyle={{ color: "#fff" }}
							/>
							<Menu.Item
								hitSlop={10}
								onPress={() => removeItem(id)}
								title="Remove Split"
								titleStyle={{ color: "red" }}
							/>
						</Menu>
					)
				}}
			/>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={{ paddingBottom: 40 }}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				ref={scrollRef}
			>
				<View style ={{ alignItems: "center", marginTop: 40}}>
					<View style={[styles.container, { backgroundColor: "#334155" }]}>
						<Text style={styles.title}>Bill Details</Text>
							<View style={styles.row}>
								<Text style={styles.text}>Subtotal</Text>
								<Text style={styles.text}>₹{receipt.subtotal.toFixed(2)}</Text>
							</View>

							<View style={styles.row}>
								<Text style={styles.text}>Tax</Text>
								<Text style={styles.text}>₹{receipt.tax.toFixed(2)}</Text>
							</View>

							{receipt.serviceCharge > 0 && (<View style={styles.row}>
								<Text style={styles.text}>Service Charge</Text>
								<Text style={styles.text}>₹{receipt.serviceCharge}</Text>
							</View>
							)}

							{receipt.finalTip > 0 && (
								<View style={styles.row}>
									<Text style={styles.text}>Tips</Text>
									<Text style={styles.text}>₹{receipt.finalTip}</Text>
								</View>
							)}

							<View style={styles.row}>
								<Text style={styles.totalText}>Total</Text>
								<Text style={styles.totalText}>₹{receipt.total.toFixed(2)}</Text>
							</View>
					</View>
				</View>

				<View style ={{ alignItems: "center", marginTop: 40, }}>
					<View style={[styles.container, { backgroundColor: "#2B3648" }]}>
						<Text style={styles.title}>Breakdown</Text>
						{debts.map((debt) => {
							return (
							<View key={debt.id} style={styles.row}>
								<View style={{ alignItems: "center", justifyContent: "center" }}>
									<Text style={styles.text}>{debt.fromMember}</Text>
								</View>
								<View style={{ flexDirection: "column", justifyContent: "center", alignItems: "flex-end" }}>
									<Text style={[styles.text, { fontWeight: "700" }]}>₹{debt.amount.toFixed(2)}</Text>
									<Text style={styles.text}> {debt.fromMember === "You" ? "Owe" : "Owes" } {debt.toMember}</Text>
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
						<Text style={styles.title}>Items</Text>
						{items.map((item: Item) => {
							return (
								<View key={item.itemId} style={styles.row}>
									<Text style={styles.text}>{item.qty} x {item.name}</Text>
									<Text style={[styles.text, { flex: 1, textAlign: "right" }]}>
										₹{item.totalPrice.toFixed(2)}
									</Text>
								</View>
							);
						})}
					</View>
				</View>

				<View style ={{ alignItems: "center", marginTop: 40}}>
					<View style={[styles.container, { backgroundColor: "#2B3648" }]}>
						<Text style={styles.title}>Who Ate What</Text>
						{peopleSelections.map((item) => {
							return (
							<View key={item.itemId} style={styles.row}>
								<View style={{ alignItems: "flex-start", justifyContent: "center" }}>
									<Text style={styles.text}>{item.name}</Text>
									<Text style={styles.people}>{item.selectedPeople.join(", ")}</Text>
								</View>
							</View>
							);
						})}
					</View>
				</View>

				<View style ={{ alignItems: "center", marginTop: 40 }}>
					<View style={[styles.container, { backgroundColor: "#334155" }]}>
						<Text style={styles.title}>Other</Text>
							<View style={styles.row}>
								<Text style={styles.text}>Receipt ID</Text>
								<Text style={styles.text}>{receipt.id}</Text>
							</View>

							<View style={styles.row}>
								<Text style={styles.text}>Date</Text>
								<Text style={styles.text}>{date.toLocaleDateString([], { day:"2-digit", month: "long", year: "numeric" }) ?? 0}</Text>
							</View>

							<View style={styles.row}>
								<Text style={styles.text}>Time</Text>
								<Text style={styles.text}>{date.toLocaleTimeString([], { hour:"2-digit", minute: "2-digit" }) ?? 0}</Text>
							</View>

							<View style={styles.row}>
								<Text style={styles.text}>Group Name</Text>
								<Text style={styles.text}>{groupTitle}</Text>
							</View>
					</View>

					<View style ={{ alignItems: "center", marginTop: 40, width: "100%" }}>
						<View style={[styles.container, { backgroundColor: "#2B3648" }]}>
							<Text style={styles.title}>Receipt Image</Text>
							{receipt.imageUri ? (
								<Image
									source={{ uri: receipt.imageUri }}
									style={{ width: 300, height: 400, borderRadius: 18, marginBottom: 20 }}
									resizeMode="stretch"
								/>
							) : (
								<Text style={styles.text}>No receipt image</Text>
							)}
						</View>
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
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		width: "80%",
		borderBottomWidth: 0.5,
		borderBottomColor: "#aaa",
		paddingBottom: 8,
	},
	totalText: {
		fontSize: 18,
		fontWeight: "700",
		color: "#10B981",
		paddingVertical: 4,
	},
	title: {
		color: "#fff",
		fontSize: 20,
		fontWeight: "700",
		marginBottom: 8,
		paddingTop: 4,
  	},
	headerTitle: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "700",
		flexShrink: 1,
	}
});
