import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

type TransactionProps = {
  title: string;
  paidBy: string;
  date: Date;
  price: number;
  onPress: () => void;
  variant?: "1" | "2";
};

export default function Transaction({
  title,
  paidBy,
  date,
  price,
  onPress,
  variant = "1",
}: TransactionProps) {
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
			style={styles.title}
			numberOfLines={1}
			ellipsizeMode="tail"
		>
			{title}
		</Text>
		<Text style={styles.price}>₹{price.toFixed(2)}</Text>
	  </View>

	  <View style={styles.bottomRow}>
		<Text style={styles.meta}>Paid By {paidBy}</Text>
		<Text style={styles.meta}>{date.toLocaleDateString([], { day: "2-digit", month: "short" })}</Text>
	  </View>
	</Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
	width: "85%",
	padding: 16,
	borderRadius: 18,
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
	gap: 20,
	alignItems: "center",
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
	color: "#22c55e",
	fontSize: 18,
	fontWeight: "600",
  },
  meta: {
	color: "#9ca3af",
	fontSize: 14,
  },
});