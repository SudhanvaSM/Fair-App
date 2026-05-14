import { View, StyleSheet, ScrollView} from "react-native";
import { useEffect, useState } from "react";
import { GroupDraft } from "@/types/item";
import Groups from "@/components/Groups";
import { getAmountYouAreOwed, getGroupExpenses, getGroupsWithMembers } from "@/src/services/group.service";
import React from "react";
import { router } from "expo-router";

export default function GroupsScreen() {

	const [itemsState, setItemsState] = React.useState<GroupDraft[]>([]);

	useEffect(() => {
		const groups = getGroupsWithMembers();
		setItemsState(groups);
	}, []);

	const openGroupDetails = (group: GroupDraft) => {
		router.push({
			pathname: "/detailedGroups",
			params: {
			  groupId: group.id,
			},
		});
	};

	return (
		<ScrollView
			style={styles.scrollView}
			contentContainerStyle={{ paddingBottom: 40 }}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
		>
			<View style={{ marginTop: 10, paddingHorizontal: 10, justifyContent: "center" }}>
				{itemsState.map((group, i) => {
					const totalExpense = getGroupExpenses(group.id || -1)?.total ?? 0;
					const youAreOwed = getAmountYouAreOwed(group.id || -1)?.amount ?? 0;
					return (
						<View key={group.id}style={{ alignItems: "center" }}>
						<Groups
						title={group.name}
						people={group.members.length}
						total={totalExpense}
						youAreOwed={youAreOwed === 0 ? "Settled up" : youAreOwed.toFixed(2)}
						onPress={() => openGroupDetails(group)}
						variant={(group?.id ?? 0 % 2 !== 0) ? "1" : "2"}
						/>
						</View>
					);
				})}
				</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scrollView: {
		backgroundColor: '#0F172A',
	},
});
