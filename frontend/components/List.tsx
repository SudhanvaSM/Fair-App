import { StyleSheet, View, Text } from "react-native";
import React from "react";

type Props = {
	title: string;
	people: string[];
	price: number;
};

export default function List({ title, people, price }: Props) {
	return (
		<View style={styles.cardContainer}>
			<View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20, marginHorizontal: 20, }}>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.price}>{price}</Text>
			</View>
			
			{people.map((person: string, index: number) => {
				return (
					<View
						key={index}
						style={styles.card}
					>
						<Text style={styles.people}>{person}</Text>
					</View>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	cardContainer: {
		width: 350,
		backgroundColor: "#25292e",
		borderRadius: 20,
		overflow: "hidden",
		paddingHorizontal: 10,
		marginTop: 20,
	},
  	title: {
		color: "#fff",
		fontSize: 20,
		fontWeight: "600",
		textAlign: "left",
		paddingTop: 15,
		paddingHorizontal: 10
  	},
  	people: {
		color: "#cbd5f5",
		fontSize: 14,
		textAlign: "left",
		paddingHorizontal: 10
  	},
	price: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	card: {
		flex: 1,
    	alignItems: "flex-start",
    	justifyContent: "flex-start",
    	padding: 20,
	}
}) 