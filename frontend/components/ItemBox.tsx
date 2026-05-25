import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";

type Props = {
	name: string;
	price: number;
	people: string[];
	selectedPeople: string[];
	onTogglePerson: (person: string) => void;
	onSelectAll: () => void;
};

export default function ItemBox({ name, price, people, selectedPeople, onTogglePerson, onSelectAll }: Props) {

	const count = selectedPeople.length;

	const perPerson = useMemo(() => {
		if (count === 0) return 0;
		return price / count;
	}, [count, price]);

	const isAllSelected = selectedPeople.length === people.length;
	
	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.itemName}>{name}</Text>
				<Text style={styles.price}>₹{price}</Text>
			</View>

			<View style={styles.chipContainer}>
				{people.map((person) => {
					const selected = selectedPeople.includes(person);
					
					return (
						<Pressable
							key={person}
							onPress={() => onTogglePerson(person)}
							style={[
								styles.chip,
								selected && styles.chipSelected,
							]}
						>
							<Text
								style={[
									styles.chipText,
									selected && styles.chipTextSelected,
								]}
							>
								{person}
							</Text>
						</Pressable>
					);
				})}
				
				<Pressable
					onPress={() => onSelectAll()}
					style={[styles.chip, isAllSelected && styles.chipSelected]}
				>
					<Text style={[styles.chipText, isAllSelected && styles.chipTextSelected]}> 
						{isAllSelected ? "Clear" : "Select All"} 
					</Text>
				</Pressable>
			</View>

			<View style={styles.footer}>
				{count === 0 ? (
					<Text style={styles.hint}>Tap to assign</Text>
				) : (
					<Text style={styles.splitText}>
						Price per individual: ₹{perPerson.toFixed(2)}
					</Text>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#334155",
		padding: 14,
		borderRadius: 20,
		marginTop: 30,
		elevation: 2,
    },
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 10,
		paddingHorizontal: 5,
	},
    itemName: {
        fontSize: 16,
        fontWeight: "600",
		color: "#fff",
    },
	price: {
		fontSize: 16,
        fontWeight: "600",
		color: "#fff",
	},
	chipContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
	},
	chip: {	
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		backgroundColor: "#eee",
		margin: 4,
	},
	chipSelected: {
		backgroundColor: "#10B981",
	},
	chipText: {
		fontSize: 13,
		color: "#000",
		fontWeight: "500",
	},
	chipTextSelected: {
		color: "#fff",
    	fontWeight: "500",
	},
	footer: {
		marginTop: 8,
		paddingHorizontal: 5,
	},
	hint: {
		fontSize: 14,
    	color: "#cbd5f5",
	},
	splitText: {
		fontSize: 14,
		fontWeight: "500",
		color: "#fff",
	}
});