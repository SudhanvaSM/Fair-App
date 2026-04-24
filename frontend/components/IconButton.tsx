import { Pressable, StyleSheet, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type Props = {
	icon: keyof typeof MaterialIcons.glyphMap;
	label: string;
	size: number;
	onPress: () => void;
};

export default function IconButton({ icon, label, size, onPress } : Props) {
	return (
		<Pressable style={styles.iconButton} onPress={onPress}>
			<MaterialIcons name={icon} size={size} color="orange" />
			<Text style={styles.iconButtonLabel}>{label}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	iconButton: {
		justifyContent: "center",
		flex: 1,
		alignItems: "center",
		paddingHorizontal: 20,
	},
	iconButtonLabel: {
		color: "#fff",
		marginTop: 12,
		justifyContent: "center",
		alignItems: "center",
	},
})