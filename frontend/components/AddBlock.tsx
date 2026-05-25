import { MaterialIcons } from "@expo/vector-icons";
import  React from "react";
import { Pressable, Text, View, TextInput, StyleSheet } from "react-native";

type Props = {
	showInput: boolean;
	setShowInput: React.Dispatch<React.SetStateAction<boolean>>;
	newName: string;
	setNewName: React.Dispatch<React.SetStateAction<string>>;
	onAdd: (name: string) => void;
	members?: string[];
	setMembers?: React.Dispatch<React.SetStateAction<string[]>>;
	memberInput?: string;
	setMemberInput?: React.Dispatch<React.SetStateAction<string>>;
};

const AddBlock = React.memo((props: Props) => {
	const {
		showInput,
		setShowInput,
		newName,
		setNewName,
		onAdd,
		members,
		setMembers,
		memberInput,
		setMemberInput,
	} = props;

	const showMembers = (
		members !== undefined &&
		setMembers !== undefined &&
		memberInput !== undefined &&
		setMemberInput !== undefined
	);
  return (
    <>
      <Pressable
        onPress={() => setShowInput(true)}
        style={{ flexDirection: "row", marginTop: 20, gap: 5, alignItems: "center" }}
      >
        <MaterialIcons name={"add-circle-outline"} size={20} color="orange" />
        <Text style={{ color: "#cbd5f5", fontWeight: "500", fontSize: 16 }}>
          {showMembers ? "Add New Group" : "Add New Item"}
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
					value={newName}
					onChangeText={setNewName}
					style={styles.input}
				/>
				
				{showMembers && (
					<>
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
									setMembers((prev: string[]) => [...prev, memberInput.trim()]);
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
					</>
				)}

				<View style={styles.actions}>
					<Pressable onPress={() => {
						setShowInput(false)
						setNewName("")
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
						onPress={() => onAdd(newName)}
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

export default AddBlock;

const styles = StyleSheet.create({
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