import {Text, View, StyleSheet, ScrollView, Pressable, Alert} from "react-native"
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { RecentSplit } from "@/types/item";

import useScrollToTop from "../hooks/useScrollToTop";

import Card from "@/components/Card";

import { clearReceiptHistory, getRecentReceipts } from "@/src/services/receipt.service";

import DateFormat from "@/utils/dateFormat";


export default function History() {
	const [history, setHistory] = useState<RecentSplit[]>([]);

	const scrollRef = useScrollToTop();
	
	useFocusEffect(
		useCallback(() => {
			setHistory(getRecentReceipts());
		}, [])
	);

	const openDetails = (item: RecentSplit) => {
		router.push({
			pathname: "/detailedHistory",
			params: {
				receiptId: item.id,
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
				ref={scrollRef}
			>
				{!history.length ? (
					<View style={styles.container}>
						<Text style={styles.text}> Your previous splits will appear here </Text>
					</View>
				)
				:
				(
					<>
					<View style ={{ justifyContent: "center" }}>
						{history.map((item) => {
							const date = DateFormat(item.date)
							return (
								<View key={item.id}style={{ alignItems: "center" }}>
								<Card
								title={item.title}
								people={item.people}
								date={date}
								price={Number(item.price.toFixed(2)) || 0}
								onPress={() => openDetails(item)}
								variant={(item.id) % 2 !== 0 ? "1" : "2"}
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
													clearReceiptHistory();
													setHistory([]);
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
