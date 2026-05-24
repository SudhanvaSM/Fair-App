import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";

import { GroupSummary } from "@/types/item";

import { createGroupWithMembers, getDetailedGroup, getGroupSummary, getGroupsWithMembers } from "@/src/services/group.service";

import useScrollToTop from "../hooks/useScrollToTop";

import AddBlock from "@/components/AddBlock";
import Groups from "@/components/Groups";

export default function GroupsScreen() {

	const [groupState, setGroupState] = useState<GroupSummary[]>([]);
	const scrollRef = useScrollToTop();

	useFocusEffect(
		useCallback(() => {
			const group = getGroupSummary();
			setGroupState(group);
		}, [])
	);

	const [showInput, setShowInput] = useState(false);
	const [newItemName, setNewItemName] = useState("");
	const [memberInput, setMemberInput] = useState("");
	const [members, setMembers] = useState<string[]>(["You"]);

	const addItem = (name: string) => {
		if (!name.trim() || members.length === 0) {
			Alert.alert("Invalid", "Add group name and at least 1 member");
			return;
		}
		
		createGroupWithMembers({
			name,
			members: members.map((m) => m.trim()),
		});
		setGroupState(getGroupsWithMembers());
		setMemberInput("");
		setMembers(["You"]);
		setNewItemName("");
		setShowInput(false);
	};

	const openGroupDetails = (groupId: number) => {
		const detailedGroup = getDetailedGroup(groupId);
		router.push({
			pathname: "/detailedGroups",
			params: {
			  groupData: JSON.stringify(detailedGroup),
			},
		});
	};

	return (
		<ScrollView
			style={styles.scrollView}
			contentContainerStyle={{ paddingBottom: 40 }}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
			ref={scrollRef}
		>
			<View style={{ marginTop: 10, paddingHorizontal: 10, justifyContent: "center" }}>
				{groupState.map((group) => {
					return (
						<View key={group.id}style={{ alignItems: "center" }}>
						<Groups
						title={group.name}
						people={group.members.length}
						total={group.totalExpenses}
						onPress={() => openGroupDetails(group.id || 0)}
						variant={((group.id ?? 0) % 2 !== 0) ? "1" : "2"}
						/>
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
	);
}

const styles = StyleSheet.create({
	scrollView: {
		backgroundColor: '#0F172A',
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
});
