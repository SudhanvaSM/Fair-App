import {Text, View, StyleSheet, ScrollView, Pressable, Alert, TextInput, KeyboardAvoidingView, Platform} from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { GroupDraft } from "@/types/item";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { createGroupWithMembers, getGroupsWithMembers } from "@/src/services/group.service";

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

export default function GroupInput() {
	const { data, imageUri } = useLocalSearchParams();
	const parsedParam = Array.isArray(data) ? data[0] : data;
	const parsedData = parsedParam ? JSON.parse(parsedParam) : null;
	
	if (!parsedData || !parsedData.raw) {
		console.log("BROKEN DATA:", parsedData);
		return <Text style={{ color: "white" }}>No Data</Text>;
	}

	const [showInput, setShowInput] = React.useState(false);
	const [newItemName, setNewItemName] = React.useState("");
	const [memberInput, setMemberInput] = useState("");
	const [members, setMembers] = useState<string[]>(["You"]);
	const [itemsState, setItemsState] = React.useState<GroupDraft[]>([]);

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
				keyboardShouldPersistTaps="always"
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
