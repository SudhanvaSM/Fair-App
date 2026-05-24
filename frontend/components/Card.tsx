import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

type CardProps = {
  title: string;
  people: number;
  date: string;
  price: number;
  onPress: () => void;
  variant?: "1" | "2";
};

export default function Card({
	title,
	people,
	date,
	price,
	onPress,
	variant = "1",
	}: CardProps) {
		const [pressed, setPressed] = useState(false);
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
				<Text 
					numberOfLines={1}
					ellipsizeMode="tail"
					style={styles.title}>
						{title}
				</Text>
				<Text style={styles.price}>₹{price.toFixed(2)}</Text>
			</View>

			<View style={styles.bottomRow}>
				<Text style={styles.meta}>{people} people</Text>
				<Text style={styles.meta}>{date}</Text>
			</View>
			</Pressable>
		);
}

const styles = StyleSheet.create({
	card: {
		width: "85%",
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
		marginBottom: 12,
	},
	bottomRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	title: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "600",
		flexShrink: 1,
	},
	price: {
		color: "#00fe0d",
		fontSize: 18,
		fontWeight: "600",
	},
	meta: {
		color: "#9ca3af",
		fontSize: 14,
	},
});