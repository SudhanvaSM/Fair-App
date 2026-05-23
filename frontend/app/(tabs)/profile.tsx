import { MaterialIcons } from "@expo/vector-icons";
import {Text, View, StyleSheet, ScrollView} from "react-native";
import  AsyncStorage  from "@react-native-async-storage/async-storage";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

export default function ProfileScreen() {
	//<SplitHistory[]>
	const [history, setHistory] = useState([]);

	useFocusEffect(
		useCallback(() => {
			const fetch = async () => {
			// await AsyncStorage.clear();
			const data = await AsyncStorage.getItem("history");
			const parsed = data ? JSON.parse(data) : [];
			setHistory(parsed);
			};

			fetch();
		}, [])
	);

	return (
		<ScrollView
			style={styles.scrollView}
			contentContainerStyle={{ paddingBottom: 40 }}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
		>
			<View style={{ alignItems: "center" }}>
				<View style={styles.container}>
					<View style={styles.avatar}>
						<MaterialIcons
							name="person"
							size={60}
							color="#000"
						/>
					</View>
					<View style={{ flexDirection: "column" }}>
						<View style={styles.textContainer}>
							<Text style={{ color: "white", fontSize: 18, fontWeight: "600", marginHorizontal: 10, }}>Sudhanva S M</Text>
						</View>
						<View style={styles.chipContainer}>
							<View style={styles.chip}>
								<Text style={styles.textType}>Bills scanned: </Text>
								<Text style={styles.text}>10</Text>
							</View>
							<View style={styles.chip}>
								<Text style={styles.textType}>Total split: </Text>
								<Text style={styles.text}>₹1255.56</Text>
							</View>
							<View style={styles.chip}>
								<Text style={styles.textType}>Groups: </Text>
								<Text style={styles.text}>3</Text>
							</View>
						</View>
					</View>
				</View>
			</View>

			<View style={{ alignItems: "center" }}>
				<View style={[styles.container, { flexDirection: "column", alignItems: "center", }]}>
					<Text 
						style={{ color: "white", fontSize: 20, fontWeight: "600", marginHorizontal: 10, textAlign: "center" }}>
						Groups
					</Text>

					<View style={{ width: "75%", marginTop: 10 }}>
						{history.map((h) => {
							const members = Object.keys(h.result.perPerson);
							return (
							<View key={h.id} style={[styles.chip, { justifyContent: "center", }]}>
								<Text style={styles.text}>
								{members.join(", ")}
								</Text>
							</View>
							);
						})}
						</View>
				</View>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "90%",
        backgroundColor: "#334155",
		padding: 14,
		borderRadius: 30,
		marginBottom: 12,
		marginTop: 20,
		elevation: 2,
		borderWidth: 1,
		borderColor: "#fff",
		flexDirection: "row",
    },
	text: {
		color: "#000",
		fontSize: 16,
		fontWeight: "600",
	},
	textType: {
		color: "#000",
		fontSize: 16,
	},
	scrollView: {
		backgroundColor: '#0F172A',
	},
	avatar: {
		width: 70,
		height: 70,
		borderWidth: 2,
		borderColor: "#fff",
		borderRadius: 35,
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 50,
		marginLeft: 10,
	},
	textContainer: {
		paddingHorizontal: 10,
		flexDirection: "row",
	},
	chipContainer: {
		flexDirection: "column",
		paddingHorizontal: 10,
	},
	chip: {	
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 20,
		backgroundColor: "#eee",
		margin: 4,
		marginTop: 10,
		flexDirection: "row",
		width: "100%",
	},
});
