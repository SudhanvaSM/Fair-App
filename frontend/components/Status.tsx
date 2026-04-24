import { StyleSheet, View, Text } from "react-native";
import React from "react";

type Variant = "done" | "active" | "waiting";

type Props = {
	title: string;
	subtle: boolean;
	variant?: Variant;
};

export default function Status({ title, subtle, variant="done" }: Props) {
	const config = variantConfig[variant];
	
	return (
		<View style={[styles.cardContainer, { backgroundColor: config.backgroundColor }]}>
			<Text style={styles.title}>{title}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	cardContainer: {
		width: 60,
		height: 26,
		backgroundColor: "#25292e",
		borderRadius: 13,
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "600",
	},
}) 

const variantConfig = {
  done: {
	backgroundColor: "#22C55E",
  },
  active: {
	backgroundColor: "#3B82F6",
  },
  waiting: {
	backgroundColor: "#6B7280",
  },
} as const;