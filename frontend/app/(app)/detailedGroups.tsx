import { Text, View, StyleSheet, ScrollView, Pressable, Alert, TextInput, KeyboardAvoidingView, Platform } from "react-native"
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Menu } from "react-native-paper";
import { Checkbox } from "expo-checkbox";

import { DetailedGroup, Member, MemberBalance, SimplifiedBalances } from "@/types/item";

import { changeGroupName, deleteGroup, getDetailedGroup, getLatestDate } from "@/src/services/group.service";

import Transaction from "@/components/Transaction";
import useImagePicker from "./hooks/useImagePicker";
import useScrollToTop from "./hooks/useScrollToTop";
import { simplifyBalances } from "@/utils/simplifyBalances";
import { getMemberBalances } from "@/utils/getMemberBalances";
import { insertSettlement } from "@/src/services/settlement.service";
import AddBlock from "@/components/AddBlock";
import AddMember from "@/components/AddMember";
import { randomUUID } from "expo-crypto";
import { addMemberIntoGroup } from "@/src/services/member.service";

export default function DetailedGroups() {
	const { groupData } = useLocalSearchParams();
	const parsedGroup = Array.isArray(groupData) ? groupData[0] : groupData;

	if (!parsedGroup) {
		return <Text style={{ color: "white" }}>No Data</Text>;
	}
	const scrollRef = useScrollToTop();

	const initialGroup: DetailedGroup = JSON.parse(parsedGroup);
	const id = initialGroup.group.id;

	const [groups, setGroups] = useState<DetailedGroup>(JSON.parse(parsedGroup));

	useFocusEffect(
		useCallback(() => {
			const updatedGroup = getDetailedGroup(id);
			setGroups(updatedGroup);
		}, [id])
	);

	const simplifiedBalances: SimplifiedBalances[] = simplifyBalances(id);

	const balances: MemberBalance[] = getMemberBalances(id);

	const [selectedSettlements, setSelectedSettlements] = useState<Record<string, boolean>>({});

	const settlementKey = (fromMemberId: string, toMemberId: string) =>
    `${fromMemberId}-${toMemberId}`;

	const toggleSettlement = (fromMemberId: string, toMemberId: string) => {
		const key = settlementKey(fromMemberId, toMemberId);

		setSelectedSettlements(prev => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	const saveSettlements = () => {

		const hasSelection = Object.values(selectedSettlements).some(selected => selected);

		if (!hasSelection) {
			Alert.alert(
				"Invalid Selections",
				"Select atleast one debt to settle.",
				[{ text: "OK" }],
				{cancelable: true,}
			);
			return;
		}

		simplifiedBalances.forEach(debt => {
			const key = settlementKey(
				debt.fromMemberId,
				debt.toMemberId
			);

			if (selectedSettlements[key]) {
				insertSettlement(
					id,
					debt.fromMemberId,
					debt.toMemberId,
					debt.amount
				);
			}
		});

		// Clear selections
		setSelectedSettlements({});

		// Re-fetch everything from SQLite
		const updatedGroup = getDetailedGroup(id);
		setGroups(updatedGroup);

		Alert.alert(
			"Settlements Saved",
			"The selected debts have been marked as settled.",
			[{ text: "OK" }],
			{cancelable: true,}
		);
	};
	
	const memberMap = useMemo(() => {
		return new Map(groups?.members.map(member => [member.id, member.name]));
	}, [groups]);

	const redirectToDetailedHistory = (receiptId: string) => (
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

	const [showInput, setShowInput] = useState(false);
	const [newName, setNewName] = useState("");

	const addMember = (name: string) => {
		const trimmedName = name.trim();
		if (!trimmedName) {
			Alert.alert("Invalid", "Add at least 1 member",
			[{ text: "OK" }],
			{cancelable: true,}
			);
			return;
		}

		for (const member of groups.members) {
			if (member.name.trim().toLowerCase() === trimmedName.toLowerCase()) {
				Alert.alert("Duplicate Name", "Member already exists in the group.",
				[{ text: "OK" }],
				{cancelable: true,})
				setNewName("");
				return;
			}
		}

		const newMember: Member = {
			id: randomUUID(),
			groupId: id,
			userId: null,
			name: trimmedName
		};

		try {
			addMemberIntoGroup(newMember.id, newMember.groupId, newMember.name);

			setGroups(prev => ({
				...prev,
				members: [...prev.members, newMember],
			}));
		} catch {
			Alert.alert("Error", "Could not add member.",
			[{ text: "OK" }],
			{cancelable: true,});
		}
	};

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
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
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
				keyboardDismissMode="interactive"
				automaticallyAdjustKeyboardInsets
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
								maxLength={20}
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
						<View style={{ justifyContent: "center", alignItems: "center", marginBottom: 5 }}>
							<AddMember
							showInput={showInput}
							setShowInput={setShowInput}
							newName={newName}
							setNewName={setNewName}
							onAdd={addMember}
						/>
						</View>
					</View>
				</View>

				{hasTransactions ? (
					<>
					<View style ={{ alignItems: "center", marginTop: 40, }}>
						<View style={[styles.container, { backgroundColor: "#334155" }]}>
							<Text style={styles.title}>Balances</Text>
							{balances?.map((member) => {
								const balance = Number(member.balance.toFixed(2));
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

					<View style={{ alignItems: "center", marginTop: 40 }}>
						<View style={[styles.container, { backgroundColor: "#2B3648" }]}>
							<Text style={styles.title}>Who Owes Whom?</Text>

							<View style={{ alignItems: "center", }}>
								{simplifiedBalances.length > 0 ? (
									simplifiedBalances.map((debt) => {
										const key = settlementKey(
											debt.fromMemberId,
											debt.toMemberId
										);

										const selected =
											selectedSettlements[key] ?? false;

										return (
											<View key={key} style={{ width: "90%", marginVertical: 10 }}>
												<View style={styles.row}>
													<Checkbox
														value={selected}
														hitSlop={20}
														onValueChange={() =>
															toggleSettlement(
																debt.fromMemberId,
																debt.toMemberId
															)
														}
														color={
															selected
																? "#10B981"
																: undefined
														}
													/>

													<Text
														style={[
															styles.text,
															{
																flex: 1,
																marginLeft: 10,
															},
														]}
													>
														{memberMap.get(debt.fromMemberId)}
														{memberMap.get(debt.fromMemberId) ===
														"You"
															? " owe "
															: " owes "}
														{memberMap.get(debt.toMemberId)}
													</Text>

													<Text style={styles.text}>
														₹{debt.amount.toFixed(2)}
													</Text>
												</View>
											</View>
										);
									})
								) : (
									<View>
										<Text
											style={[
												styles.text,
												{ marginLeft: 10 },
											]}
										>
											All balances settled
										</Text>
									</View>
								)}

								{simplifiedBalances.length > 0 && (
									<>
										<Pressable
											style={styles.settlementSaveButton}
											hitSlop={10}
											onPress={saveSettlements}
										>
											<Text style={styles.settlementSaveText}>
												Mark as paid
											</Text>
										</Pressable>

										<Text style={styles.helperText}>
											Check a debt to mark it as paid, then tap Save to
											settle it.
										</Text>
									</>
								)}
							</View>
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
											onPress={() => redirectToDetailedHistory(receipt.id || '0')}
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
		</KeyboardAvoidingView>
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
		paddingVertical: 12,
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
	},
	settlementSaveButton: {
		backgroundColor: "#E2E8F0",
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 20,
		marginBottom: 10,
		marginTop: 20,
	},
	settlementSaveText: {
		color: "#0F172A",
		fontSize: 16,
		fontWeight: "600",
	},
	helperText: {
		color: "#94A3B8",
		fontSize: 13,
		textAlign: "center",
		marginHorizontal: 20,
		marginTop: 10,
	},
});
