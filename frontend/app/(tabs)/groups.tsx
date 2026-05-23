import { View, StyleSheet, ScrollView, Pressable, TextInput, Text, Alert } from "react-native";
import { useState } from "react";
import { GroupSummary } from "@/types/item";
import Groups from "@/components/Groups";
import { createGroupWithMembers, getDetailedGroup, getGroupSummary, getGroupsWithMembers} from "@/src/services/group.service";
import React from "react";
import { router, useFocusEffect } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

const AddItemBlock = React.memo((props: any) => {
  const { showInput, setShowInput, newItemName, setNewItemName, addItem, members, setMembers, memberInput, setMemberInput } = props;

  return (
    <>
      <Pressable
        onPress={() => setShowInput(true)}
        style={{ flexDirection: "row", marginTop: 20, gap: 5, alignItems: "center" }}
      >
        <MaterialIcons name={"add-circle-outline"} size={20} color="orange" />
        <Text style={{ color: "#cbd5f5", fontWeight: "500", fontSize: 16 }}>
          Add New Group
        </Text>
      </Pressable>

      {showInput && (
			<View style={[{marginTop: 10}, styles.container]}>
				<TextInput
					keyboardType="default"
					autoCapitalize="words"
					autoFocus
					placeholder="Enter group name..."
					placeholderTextColor="#888"
					value={newItemName}
					onChangeText={setNewItemName}
					style={styles.input}
				/>
				<TextInput
					keyboardType="default"
					autoCapitalize="words"
					placeholder="Enter member name..."
					placeholderTextColor="#888"
					value={memberInput}
					onChangeText={setMemberInput}
					style={styles.input}
				/>
				<View style={styles.actions}>
					<Pressable
						onPress={() => {
							if (!memberInput.trim()) return;
							if (members.includes(memberInput.trim())) return;
							setMembers((prev: any) => [...prev, memberInput.trim()]);
							setMemberInput("");
						}}
						style={{
							backgroundColor: "#10B981",
							padding: 8,
							borderRadius: 10,
							marginTop: 5,
						}}
						hitSlop={100}
						>
						<Text style={{ color: "#fff" }}>Add Member</Text>
					</Pressable>
				</View>
				<View style={{ flexDirection: "row", flexWrap: "wrap" }}>
					{members.map((member: string, i: number) => (
						<Pressable
						key={i}
						onPress={() => {
							setMembers((prev: string[]) => prev.filter((_, idx) => idx !== i));
						}}
						style={[styles.chip, { flexDirection: "row", alignItems: "center", gap: 5, }]}
						>
						<Text style={styles.chipText}>{member}</Text>
						<Text style={{ color: "red", fontWeight: "bold" }}>✕</Text>
						</Pressable>
					))}
				</View>
				<View style={styles.actions}>
					<Pressable onPress={() => {
						setShowInput(false)
						setNewItemName("")
					}}
						style={{
							width: "25%",
							backgroundColor: "#EF4444",
							padding: 10,
							borderRadius: 10,
							alignItems: "center",
						}}
					>
						<Text style={{ color: "white" }}>Cancel</Text>
					</Pressable>
					<Pressable
						onPress={() => addItem(newItemName)}
						style={{
							width: "25%",
							backgroundColor: "#10B981",
							padding: 10,
							borderRadius: 10,
							alignItems: "center",
						}}
						>
						<Text style={{ color: "white" }}>Add</Text>
					</Pressable>
				</View>
			</View>
		)}
    </>
  );
});

export default function GroupsScreen() {

	const [groupState, setGroupState] = React.useState<GroupSummary[]>([]);

	useFocusEffect(
		React.useCallback(() => {
			const group = getGroupSummary();
		setGroupState(group);
		}, [])
	);

	const openGroupDetails = (groupId: number) => {
		const detailedGroup = getDetailedGroup(groupId);
		router.push({
			pathname: "/detailedGroups",
			params: {
			  groupData: JSON.stringify(detailedGroup),
			},
		});
	};

	const [showInput, setShowInput] = React.useState(false);
	const [newItemName, setNewItemName] = React.useState("");
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

	return (
		<ScrollView
			style={styles.scrollView}
			contentContainerStyle={{ paddingBottom: 40 }}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
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
					<AddItemBlock
						showInput={showInput}
						setShowInput={setShowInput}
						newItemName={newItemName}
						setNewItemName={setNewItemName}
						members={members}
						setMembers={setMembers}
						memberInput={memberInput}
						setMemberInput={setMemberInput}
						addItem={addItem}
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
