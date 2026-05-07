import {Text, View, StyleSheet, ScrollView, Pressable, Alert} from "react-native"
import  AsyncStorage  from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { SplitHistory } from "@/types/item";
import Card from "@/components/Card";

export default function ProfileScreen() {
	const [history, setHistory] = useState<SplitHistory[]>([]);

	const getMealLabel = (hour: number) => {

		if (hour >= 5 && hour < 11) return "Breakfast";
		if (hour >= 11 && hour < 15) return "Lunch";
		if (hour >= 15 && hour < 19) return "Snacks";
		return "Dinner";
	}
	
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

	const openDetails = (item: SplitHistory) => {
		router.push({
			pathname: "/detailedHistory",
			params: {
				data: JSON.stringify(item),
			},
		});
	};

	return (
		<>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={{ paddingBottom: 40 }}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				{!history.length ? (
					<View style={styles.container}>
						<Text style={styles.text}> NO HISTORY TO SHOW </Text>
					</View>
				)
				:
				(
					<>
					<View style ={{ justifyContent: "center" }}>
						{history.map((item) => {
							const label = getMealLabel(new Date(item.createdAt).getHours());
							const mins = new Date(item.createdAt).getMinutes();
							return (
								<View key={item.id}style={{ alignItems: "center" }}>
									<Card
									title={label}
									people={Object.keys(item.result.perPerson).length}
									date={String(new Date(item.createdAt).toDateString())}
									price={Number(item.raw?.total?.toFixed(2)) || 0}
									onPress={() => openDetails(item)}
									variant={mins % 2 !== 0 ? "1" : "2"}
									/>
								</View>
							);
						})}
					</View>

					<View style={styles.container}>
						<Pressable
							onPress={() => {
								Alert.alert (
									"Confirm Action",
									"Are you sure you want to delete all splits?",
									[
										{
											text: "Cancel",
											style: "cancel",
										},
										{
											text: "Delete",
											style: "destructive",
											onPress: async() => {
												try {
													await AsyncStorage.clear();
													router.back();
												}
												catch (e) {
													console.error("Remove all splits failed: ", e);
												}
											}
										}
									]
								);
							}}
						>
							<Text style={{ color: "red", fontWeight: "600", fontSize: 18, textDecorationLine: "underline" }}>
								Remove all splits
							</Text>
						</Pressable>
					</View>
					</>
				)}
			</ScrollView>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#0F172A",
		alignItems: "center",
		marginTop: 20,
	},
	text: {
		color: "white",
		fontSize: 18,
		fontWeight: "600",
	},
	scrollView: {
		backgroundColor: '#0F172A',
	},
});
