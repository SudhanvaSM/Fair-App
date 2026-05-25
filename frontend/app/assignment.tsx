import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useState } from "react";

import { ItemWithSelection, ItemPerPerson } from "@/types/item";

import ItemBox from "@/components/ItemBox";

import { buildAssignments } from "@/utils/buildAssignment";
import { splitBill } from "@/utils/splitBill";

import { getMembersByGroupId } from "@/src/services/member.service";

export default function Assignment() {

	const { data, groupId, imageUri } = useLocalSearchParams();
	const parsedParam = Array.isArray(data) ? data[0] : data;
	const parsedData = parsedParam ? JSON.parse(parsedParam) : null;

	const parsedGroupId = Number(groupId);
	const members = getMembersByGroupId(parsedGroupId);
	
	if (!parsedData || !parsedData.raw) {
		console.log("BROKEN DATA:", parsedData);
		return <Text style={{ color: "white" }}>No Data</Text>;
	}

	const raw = parsedData.raw;
	const items = raw.items;
	const includeServiceCharge = parsedData.raw.includeServiceCharge;

	const [thing, setThing] = useState(
		items.map((item: ItemWithSelection) => ({
			...item,
			selectedPeople: [],
		}))
	);

	const selectAllPeople = (index: number) => {
		setThing((prev: ItemPerPerson[]) => {
			const updated = [...prev];

			const isAllSelected = updated[index].selectedPeople.length === people.length;

			updated[index].selectedPeople = isAllSelected ? [] : [...people];
			
			return updated;
		})
	}

	const people = members.map((m) => m.name);
	people.sort();

	const showAlert = (name: string) => {
		Alert.alert(
			"Person Not Assigned",
			`You did not select any person for \n${name.toUpperCase()}`,
			[
				{ text: "OK", style: "default" }
			],
			{
				cancelable: true,
			}
		);
	};

	const splitEverythingEqually = () => {
		setThing((prev: ItemPerPerson[]) => {
			const isSplitEqually = prev.every(
				(item) => item.selectedPeople.length === people.length
			);
			return prev.map(item => ({
				...item,
				selectedPeople: isSplitEqually ? [] : [...people],
			}));
		});
	}
	
	const togglePerson = (index: number, person: string) => {
		setThing((prev: ItemPerPerson[]) => {
			const updated = [...prev];
			const selected = updated[index].selectedPeople;

			if (selected.includes(person)) {
				updated[index].selectedPeople = selected.filter((p: string) => p !== person);
			} 
			else {
				updated[index].selectedPeople = [...selected, person];
			}
			return updated;
		});
		};

	const handleNext = () => {
		// validation
		for (const item of thing) {
			if (!item.selectedPeople || item.selectedPeople.length === 0) {
				showAlert(item.name);
				return;
			}
		}

		const assignments = buildAssignments(thing);
		const result = splitBill(raw, assignments, includeServiceCharge);

		router.push({
			pathname: "/summary",
			params: {
			data: JSON.stringify({
				result,
				raw: {
					items: thing,
					subtotal: parsedData.raw.subtotal,
					tax: parsedData.raw.tax,
					total: parsedData.raw.total,
					serviceCharge: parsedData.raw.serviceCharge,
					finalTip: parsedData.raw.finalTip
				},
				groupId: parsedGroupId,
				imageUri,
			})
			}
		});
		};

	return (
		<>
			<Stack.Screen
				options={{
					headerStyle: { backgroundColor: "#1E293B" },
					headerTitle: "Who Ate What?",
					headerTitleAlign: "left",
					headerShadowVisible: false,
					headerTintColor: "#ffffff",
					animation: "slide_from_right",
				}}
			/>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={{ paddingBottom: 40 }}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				<View style={{alignItems: "center", marginTop: 20 }}>
					<Pressable
						style={styles.container} 
						onPress={splitEverythingEqually}>
							<Text style={styles.text}>Split All Equally</Text>
					</Pressable>
					{thing.map((item: ItemPerPerson, index: number) => (
						<View key={index} style={{width: "90%"}}>
							<ItemBox
								name={item.name}
								price={item.totalPrice}
								people={people}
								selectedPeople={item.selectedPeople}
								onTogglePerson={(person) => togglePerson(index, person)}
								onSelectAll={() => selectAllPeople(index)}
							/>
						</View>
					))}
				</View>

				<View style={{ marginVertical: 28 }}>
					<Text style={styles.subText}>Select who shared each item</Text>
				</View>

				<View style={{ alignItems: "center" }}>
					<Pressable
						onPress={() => handleNext()}
						style={styles.next}
					>
						<Text style={styles.nextText}>
							Looks Good {"\n"} →
						</Text>
					</Pressable>
				</View>
			</ScrollView>
		</>
	);
}

const styles = StyleSheet.create({
	scrollView: {
    	backgroundColor: '#0F172A',
  	},
	container: {
        backgroundColor: "#3B82F6",
		padding: 14,
		borderRadius: 30,
		marginBottom: 12,
		marginTop: 10,
		elevation: 2,
    },
	text: {
		fontSize: 16,
		fontWeight: "500",
		color: "#fff",
	},
	next: {
		width: "50%",
		backgroundColor: "#10B981",
		borderRadius: 20,
		overflow: "hidden",
		paddingHorizontal: 20,
		paddingVertical: 10,
	},
	nextText: {
		color: "#fff", 
		fontSize: 20,
		fontWeight: "600",
		textAlign: "center",
	},
	subText: {
		fontSize: 16,
		fontWeight: "500",
		color: "#cbd5f5",
		textAlign: "center",
	},
});