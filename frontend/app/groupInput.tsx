import {Text, View, StyleSheet, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform} from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import { GroupDraft } from "@/types/item";

import { createGroupWithMembers, getGroupsWithMembers } from "@/src/services/group.service";

import AddBlock from "@/components/AddBlock";

export default function GroupInput() {
	const { data, imageUri } = useLocalSearchParams();
	const parsedParam = Array.isArray(data) ? data[0] : data;
	const parsedData = parsedParam ? JSON.parse(parsedParam) : null;
	
	if (!parsedData || !parsedData.raw) {
		console.log("BROKEN DATA:", parsedData);
		return <Text style={{ color: "white" }}>No Data</Text>;
	}

	const [showInput, setShowInput] = useState(false);
	const [newItemName, setNewItemName] = useState("");
	const [memberInput, setMemberInput] = useState("");
	const [members, setMembers] = useState<string[]>(["You"]);
	const [itemsState, setItemsState] = useState<GroupDraft[]>([]);

	useEffect(() => {
		const groups = getGroupsWithMembers();
		setItemsState(groups);
	}, []);

	const addItem = (name: string) => {
		if (!name.trim() || members.length === 0) {
			Alert.alert("Invalid", "Add group name and at least 1 member");
			return;
		}
		
		createGroupWithMembers({
			name,
			members: members.map((m) => m.trim()),
		});
		setItemsState(getGroupsWithMembers());
		setMemberInput("");
		setMembers(["You"]);
		setNewItemName("");
		setShowInput(false);
	};

	const [pressedIndex, setPressedIndex] = useState<number | null>(null);

	const handleNext = (group: GroupDraft) => {
		router.push({
			pathname: "/assignment",
			params: {
				data: JSON.stringify(parsedData),
				groupId: String(group.id),
				imageUri,
			},
		});
	};

	return (
		<KeyboardAvoidingView 
			style={{ flex: 1 }}
			behavior={Platform.OS === 'ios' ? "padding" : "height"}	
		>
			<Stack.Screen
				options={{
				headerStyle: { backgroundColor: "#1E293B" },
				headerTitle: "Group Input",
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
				<View style={{ alignItems: "center" }}>
					{itemsState.map((group, i) => {
						return (
							<View key={i} style={styles.cardContainer}>
								<Pressable 
									hitSlop={100}
									onPress={() => handleNext(group)} 
									onPressIn={() => setPressedIndex(i)} onPressOut={() => setPressedIndex(null)} 
									style={{ transform: [{ scale: pressedIndex === i ? 0.97 : 1 }], alignItems: "center" }}>
									<Text style={styles.title}>{group.name}</Text>
									<View style={styles.chipContainer}>
										{group.members.map((member, j) => (
											<View key={j} style={styles.chip}>
												<Text style={styles.chipText}>
													{member}
												</Text>
											</View>
										))}
									</View>
								</Pressable>
							</View>
						);
					})}
					</View>
					<View style={{ alignItems: "center" }}>
						<AddBlock
							showInput={showInput}
							setShowInput={setShowInput}
							newName={newItemName}
							setNewName={setNewItemName}
							members={members}
							setMembers={setMembers}
							memberInput={memberInput}
							setMemberInput={setMemberInput}
							onAdd={addItem}
						/>
					</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	scrollView: {
		backgroundColor: '#0F172A',
	},
	cardContainer: {
		width: "90%",
		backgroundColor: "#334155",
		borderRadius: 20,
		overflow: "hidden",
		paddingHorizontal: 40,
		marginTop: 20,
	},
  	title: {
		color: "#fff",
		fontSize: 20,
		fontWeight: "600",
		textAlign: "center",
		paddingTop: 15,
		paddingHorizontal: 10
  	},
	chipContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: 10,
		marginBottom: 20,
	},
	chip: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		backgroundColor: "#eee",
		margin: 4,
	},
	chipText: {
		fontSize: 13,
		color: "#000",
		fontWeight: "500",
		textAlign: "center",
	},
	container: {
		width: "80%",
		padding: 15,
		backgroundColor: "#1f2937",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#436FAD",
		alignItems: "center", 
		justifyContent: "space-between", 
		gap: 20,
	},
	input: {
		width: "80%",
		backgroundColor: "#111827",
		color: "#fff",
		paddingHorizontal: 15,
		borderRadius: 8,
	},
	actions: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 20,
	},
});
