import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

type GroupProps = {
	title: string;
	people: number;
	total: number;
	onPress: () => void;
	variant?: "1" | "2";
	};


export default function Group({
	title,
	people,
	total,
	onPress,
	variant,
	}: GroupProps) {

	const [pressed, setPressed] = React.useState(false);

	return ( 
		<Pressable
		hitSlop={10}
		style={[
			styles.card,
			variant === "1" ? styles.variantOne : styles.variantTwo,
			{ transform: [{ scale: pressed ? 0.95 : 1 }] }
		]}
		onPress={onPress}
		onPressIn={() => setPressed(true)}
		onPressOut={() => setPressed(false)}
		>
			<View style={styles.topRow}>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.memberTitle}>{people} members</Text>
			</View>
			
			<View style={styles.bottomRow}>
				<Text style={styles.details}>Total Expenses: </Text>
				<Text style={styles.price}>₹{total.toFixed(2)}</Text>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	card: {
		width: "90%",
		padding: 20,
		borderRadius: 18,
		marginTop: 20,
  	},
	variantOne: {
		backgroundColor: "#273449",
	},
	variantTwo: {
		backgroundColor: "#22304A",
	},
	topRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 10,
		alignItems: "baseline",
	},
	bottomRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 5,
	},
	title: {
		color: "#fff",
		fontSize: 20,
		fontWeight: "600",
	},
	memberTitle: {
		fontSize: 16,
		fontWeight: "500",
		color: "#e9ecef",
	},
	details: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "400",
	},
	price: {
		color: "#22c55e",
		fontSize: 16,
		fontWeight: "400",
	},
});