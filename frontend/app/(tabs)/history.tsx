import {Text, View, StyleSheet, ScrollView, Pressable, Alert} from "react-native"
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { RecentSplit } from "@/types/item";

import useScrollToTop from "../hooks/useScrollToTop";

import Card from "@/components/Card";

import { clearReceiptHistory, getRecentReceipts } from "@/src/services/receipt.service";

import DateFormat from "@/utils/dateFormat";
import { Menu } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";


export default function History() {
	const [history, setHistory] = useState<RecentSplit[]>([]);

	const [visible, setVisible] = useState(false);
	const openMenu = () => setVisible(true);
	const closeMenu = () => setVisible(false);

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

	const deleteAllSplits = () => {
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
			],
			{
				cancelable: true,
			}
		);
	}

	return (
		<>
		<Stack.Screen
			options={{
				headerRight: () => (
					<Menu
						contentStyle={{ marginTop: 35, borderRadius: 20, backgroundColor: "#334155" }}
						visible={visible}
						onDismiss={closeMenu}
						anchor={
							<Pressable 
								style={{ justifyContent: "center", alignItems: "center", paddingRight: 20 }}
								hitSlop={10} 
								onPress={openMenu}
							>
								<MaterialCommunityIcons
									name={"dots-vertical"}
									color={"white"}
									size={24}
								/>
							</Pressable>
						}
					>
					<Menu.Item
						hitSlop={10}
						onPress={() => deleteAllSplits()}
						title="Delete All Splits"
						titleStyle={{ color: "red" }}
					/>
					</Menu>
				)
			}}
		/>
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
					<View style ={{ marginTop: 10, paddingHorizontal: 10, justifyContent: "center" }}>
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
