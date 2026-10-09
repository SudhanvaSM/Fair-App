import { MaterialIcons } from "@expo/vector-icons";
import  React from "react";
import { Pressable, Text, View, TextInput, StyleSheet, Alert } from "react-native";

type Props = {
	showInput: boolean;
	setShowInput: React.Dispatch<React.SetStateAction<boolean>>;
	newName: string;
	setNewName: React.Dispatch<React.SetStateAction<string>>;
	onAdd: (name: string) => void;
};

const AddMember = React.memo((props: Props) => {
	const {
		showInput,
		setShowInput,
		newName,
		setNewName,
		onAdd,
	} = props;

	const handleAdd = () => {
		const name = newName.trim();

		if (!name) {
			Alert.alert("Invalid", "Add at least 1 member",
                    [{ text: "OK" }],
                    {cancelable: true,});
			return;
		};

		onAdd(name);
		setNewName("");
		setShowInput(false);
	};

	const handleCancel = () => {
		setNewName("");
		setShowInput(false);
	};

	return (
		<>
		<Pressable
			onPress={() => setShowInput(true)}
			style={styles.addMemberButton}
		>
			<MaterialIcons name={"add-circle-outline"} size={20} color="orange" />
			<Text style={styles.addMemberText}>
				Add new member
			</Text>
		</Pressable>

		{showInput && (
				<View style={[{marginTop: 10}, styles.container]}>
					<TextInput
					keyboardType="default"
					autoCapitalize="words"
					placeholder="Enter member name..."
					placeholderTextColor="#888"
					value={newName}
					onChangeText={setNewName}
					style={styles.input}
					autoFocus
					/>

					<View style={styles.actions}>
						<Pressable
							onPress={handleCancel}
							style={[styles.actionButton, styles.cancelButton]}
							>
							<Text style={styles.buttonText}>Cancel</Text>
						</Pressable>

						<Pressable
							onPress={handleAdd}
							style={[styles.actionButton, styles.addButton]}
							>
							<Text style={styles.buttonText}>Add</Text>
						</Pressable>
					</View>
				</View>
			)}
		</>
	);
});

export default AddMember;

const styles = StyleSheet.create({
	container: {
		width: "80%",
		padding: 15,
		backgroundColor: "#1f2937",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#436FAD",
		alignItems: "center", 
		gap: 20,
		marginTop: 10,
	},
	input: {
		width: "80%",
		backgroundColor: "#111827",
		color: "#fff",
		paddingHorizontal: 15,
		borderRadius: 8,
		paddingVertical: 10,
	},
	actions: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 45,
	},
	actionButton: {
		width: "30%",
		padding: 10,
		borderRadius: 10,
		alignItems: "center",
	},
	cancelButton: {
		backgroundColor: "#EF4444",
	},
	addButton: {
		backgroundColor: "#10B981",
	},
	buttonText: {
		color: "white",
	},
	addMemberButton: { 
		flexDirection: "row", 
		marginTop: 20, gap: 5, 
		alignItems: "center", 
	},
	addMemberText: {
		color: "#cbd5f5", 
		fontWeight: "500", 
		fontSize: 16, 
	},
});