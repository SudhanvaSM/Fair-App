import { Text, View, StyleSheet, ScrollView, Pressable, Alert, TextInput } from "react-native"
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Menu } from "react-native-paper";

import { DebtDetails, DetailedGroup, MemberBalance } from "@/types/item";

import { changeGroupName, deleteGroup, getLatestDate } from "@/src/services/group.service";
import { getMemberBalances} from "@/src/services/member.service";
import { settleDebt } from "@/src/services/debt.service";

import Transaction from "@/components/Transaction";
import useImagePicker from "./hooks/useImagePicker";
import useScrollToTop from "./hooks/useScrollToTop";

export default function DetailedGroups() {
	const { groupData } = useLocalSearchParams();
	const parsedGroup = Array.isArray(groupData) ? groupData[0] : groupData;

	if (!parsedGroup) {
		return <Text style={{ color: "white" }}>No Data</Text>;
	}
	const scrollRef = useScrollToTop();

	const [groups, setGroups] = useState<DetailedGroup>(JSON.parse(parsedGroup));

	const id = Number(groups?.group.id);

	const [balances, setBalances] = useState<MemberBalance[]>(getMemberBalances(id));
	
	const memberMap = useMemo(() => {
		return new Map(groups?.members.map(member => [member.id, member.name]));
	}, [groups]);

	const redirectToDetailedHistory = (receiptId: number) => (
		router.push({
			pathname: "/detailedHistory",
			params: {
				receiptId,
			}
		})
	)
	
	const latestDate = new Date(getLatestDate(id));
	const today = new Date();
	let lastActivity;
	if (!isNaN(latestDate.getTime())) {
		if (latestDate.toDateString() === today.toDateString()) lastActivity = "Today"
		else {
			const yesterday = new Date(today);
			yesterday.setDate(today.getDate() - 1);
			if (latestDate.toDateString() === yesterday.toDateString()) lastActivity = "Yesterday";
			else lastActivity = latestDate.toLocaleDateString([], { day: "2-digit", month: "short" });
		}
	}
	else {
		lastActivity = "No Activity"
	}

	const createdOn = new Date(groups?.group.createdAt || 0);
	const dateCreatedOn = createdOn.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })

	const changeStatus = (debt: DebtDetails, groupId: number, fromMemberId: number, toMemberId: number) => {
		const newStatus = debt.status === "pending" ? "settled" : "pending";
		settleDebt(groupId, fromMemberId, toMemberId, newStatus);

		setGroups(prev => ({
			...prev,
			debts: prev.debts.map(d => 
				d.id === debt.id ? { ...d, status: newStatus} : d
			),
		}))

		setBalances(getMemberBalances(id));
	}

	const hasTransactions = (groups?.receipts.length ?? 0) > 0;

	const [visible, setVisible] = useState(false);

	const openMenu = () => setVisible(true);
	const closeMenu = () => setVisible(false);

	const [groupTitle, setGroupTitle] = useState(groups.group.name);
	const [tempGroupTitle, setTempGroupTitle] = useState("");
	const [editing, setEditing] = useState(false);

	const editGroupName = () => {
		closeMenu();
		setEditing(true);
	}

	const onSave = () => {
		const updatedTitle = tempGroupTitle.trim() || groups.group.name
		setGroupTitle(updatedTitle);
		changeGroupName(id, updatedTitle);
		setEditing(false);
    };

	const onCancel = () => {
		setGroupTitle(groupTitle);
		setEditing(false);
	}

	const handleDeleteGroup = () => {
		closeMenu();
		Alert.alert (
			"Confirm Action",
			`Are you sure you want to delete ${groups?.group.name}group?`,
			[
				{
					text: "Cancel",
					style: "cancel",
				},
				{
					text: "Delete",
					style: "destructive",
					onPress: async() => {
						try {
							deleteGroup(id);
							router.back();
						}
						catch (e) {
							console.error("Delete group failed: ", e);
						}
					}
				}
			],
			{
				cancelable: true,
			}
		);
	}

	const { handleScan } = useImagePicker();
	
	const onContinueImageAsync = async() => {
		const imageUri = await handleScan();
		if (!imageUri) return;

		router.push({
			pathname: "/preview",
			params: {
				imageUri,
				groupId: id,
			},
		});
	};

	const [pressed, setPressed] = useState(false);

	if (!groups || !balances) {
		return (
    		<View style={{ flex: 1, backgroundColor: "#0F172A" }} />
  		);
	}

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
						>
							{groupTitle}
						</Text>
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
								onPress={editGroupName}
								title="Edit Group Title"
								titleStyle={{ color: "#fff" }}
							/>
							<Menu.Item
								hitSlop={10}
								onPress={handleDeleteGroup}
								title="Delete Group"
								titleStyle={{ color: "red" }}
							/>
						</Menu>
						)
				}}
			/>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				ref={scrollRef}
			>
				{editing && (
					<View style={{ justifyContent: "center", alignItems: "center" }}>
						<View style={styles.groupContainer}>
							<TextInput
								keyboardType="default"
								autoCapitalize="words"
								placeholder="Enter group name..."
								placeholderTextColor={"#888"}
								value={tempGroupTitle}
								onChangeText={setTempGroupTitle}
								style={styles.input}
							/>

							<View style={styles.actions}>
								<Pressable onPress={onCancel}>
									<Text style={styles.cancel}>Cancel</Text>
								</Pressable>
						
								<Pressable onPress={onSave}>
									<Text style={styles.save}>Save</Text>
									</Pressable>
							</View>
						</View>
					</View>
				)}
				<View style ={{ alignItems: "center", marginTop: 40, }}>
					<View style={[styles.container, { backgroundColor: "#2B3648", paddingHorizontal: 20 }]}>
						<Text style={styles.title}>Group Overview</Text>
						<View style={styles.row}>
							<Text style={styles.text}>Total Spent</Text>
							<Text style={styles.text}>₹{groups?.totalExpenses}</Text>
						</View>

						<View style={styles.row}>
							<Text style={styles.text}>Last Split</Text>
							<Text style={styles.text}>{lastActivity}</Text>
						</View>

						<View style={styles.row}>
							<Text style={styles.text}>Created On</Text>
							<Text style={styles.text}>{dateCreatedOn}</Text>
						</View>

						<View style={{ width: "90%" }}>
							<Text style={styles.text}>Group Members</Text>
							<View style={styles.chipContainer}>
							{groups.members.map((member) => (
								<View key={member.id} style={styles.chip}>
									<Text style={styles.chipText}>
										{member.name}
									</Text>
								</View>
							))}
							</View>
						</View>
					</View>
				</View>

				{hasTransactions ? (
					<>
					<View style ={{ alignItems: "center", marginTop: 40, }}>
						<View style={[styles.container, { backgroundColor: "#334155" }]}>
							<Text style={styles.title}>Balances</Text>
							{balances?.map((member) => {
								const balance = member.balance;
								return (
									<View style={[styles.row, { width: "80%" }]} key={member.memberId}>
									<View style={{ alignItems: "flex-start" }}>
										<Text style={styles.text}>{member.name}</Text>
									</View>
									<View style={{ alignItems: "flex-end" }}>
										<Text style={[styles.text, { color: balance > 0 ? "#10B981" : balance < 0 ? "#DC2626" : "gray" }]}>
											{balance > 0 ? `+₹${balance.toFixed(2)}` : balance < 0 ? `-₹${Math.abs(balance).toFixed(2)}` : "Settled"}</Text>
									</View>
								</View>
								);
							})}
						</View>
					</View>

					<View style ={{ alignItems: "center", marginTop: 40, }}>
						<View style={[styles.container, { backgroundColor: "#2B3648" }]}>
							<Text style={styles.title}>Who Owes Whom?</Text>
							{groups?.debts?.map((debt) => {
								const amount = debt.amount;
								return (
									<View style={[styles.row, { width: "80%" }]} key={debt.id}>
										<Text style={[styles.text, debt.status === 'settled' && { color: "#888", textDecorationLine: "line-through" }]}>
											{debt.fromMember} {debt.fromMember === "You" ? "owe" : "owes" } {debt.toMember}
										</Text>
									<View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
										<Text style={[styles.text, debt.status === 'settled' && { color: "#888", textDecorationLine: "line-through" }]}>₹{amount.toFixed(2)}</Text>
										<Pressable
											style={{ width: 24 }}
											hitSlop={10}
											onPress={() => changeStatus(debt, groups.group.id, debt.fromMemberId, debt.toMemberId)}
										>
											<MaterialCommunityIcons 
												name={debt.status === 'settled' ? "checkbox-marked-circle-outline" : "checkbox-blank-circle-outline"}
												color={debt.status === 'settled' ? "#10B981" : "#DC2626"}
												size={20}
											/>
										</Pressable>
									</View>
								</View>
								);
							})}
						</View>
					</View>

					<View style ={{ alignItems: "center", marginTop: 40 }}>
						<View style={[styles.container, { backgroundColor: "#334155", gap: 10 }]}>
							<Text style={styles.title}>Transaction History</Text>
							{groups?.receipts.map((receipt) => {
								const title = receipt.title;
								const payerName = memberMap.get(receipt.payerMemberId) ?? "Unknown";
								return (
									<View key={receipt.id} style={[styles.row, { justifyContent: "center", borderBottomWidth: 0 }]}>
										<Transaction
											title={title}
											paidBy={payerName}
											date={receipt.createdAt}
											price={receipt.total}
											onPress={() => redirectToDetailedHistory(receipt.id || -1)}
										/>
									</View>
								);
							})}
						</View>
					</View>
				</>
				) :
				<>	
					<View style={{ justifyContent: "center", alignItems: "center", marginTop: 20 }}>
						<Text style={styles.text}>No expenses yet</Text>
					</View>
				</>
				}

				<View style={{ justifyContent: "center", alignItems: "center", marginTop: 40 }}>
					<Pressable
						style={[styles.emptyBox, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
						onPress={onContinueImageAsync}
						onPressIn={() => setPressed(true)}
						onPressOut={() => setPressed(false)}
					>
						<Text style={styles.emptyText}>Add New Split</Text>
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
	},
	row: {
		width: "90%",
		flexDirection: "row",
		justifyContent: "space-between",
		borderBottomWidth: 0.5,
		borderBottomColor: "#aaa",
		paddingVertical: 8,
		alignItems: "center",
	},
	chipContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: 15,
		gap: 10,
		justifyContent: "center",
	},
	chip: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		backgroundColor: "#475569",
	},
	chipText: {
		fontSize: 14,
		color: "#fff",
		fontWeight: "500",
		textAlign: "center",
	},
	title: {
		fontSize: 20,
		fontWeight: "700",
		color: "#fff",
		marginBottom: 8,
	},
	emptyText: {
		color: "#0F172A",
		textAlign: "center",
		fontSize: 18,
		fontWeight: "500",
	},
	input: {
		width: "90%",
		backgroundColor: "#111827",
		color: "#fff",
		paddingHorizontal: 15,
		borderRadius: 30,
		marginTop: 20,
	},
	groupContainer: {
		width: "90%",
		backgroundColor: "#334155",
		borderRadius: 30,
		marginTop: 20,
		alignItems: "center",
		marginBottom: 10,
	},
	actions: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 10,
		gap: 80,
		marginBottom: 20,
	},
	cancel: {
		color: "#DC2626",
		fontSize: 14,
	},
	save: {
		color: "#10B981",
		fontWeight: "600",
		fontSize: 14,
	},
	headerTitle: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "600",
		flexShrink: 1,
  	},
	emptyBox: {
		width: "45%",
		backgroundColor: "#E2E8F0",
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOpacity: 0.25,
		shadowRadius: 6,
		elevation: 4,
	}
});
