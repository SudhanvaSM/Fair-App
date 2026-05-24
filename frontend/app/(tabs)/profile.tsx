import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {Text, View, StyleSheet, ScrollView} from "react-native";

import { ProfileDetails } from "@/types/item";

import { getProfileDetails } from "@/src/services/user.services";

import DateFormat from "@/utils/dateFormat";

import useScrollToTop from "../hooks/useScrollToTop";

export default function ProfileScreen() {
	const [profileDetails, setProfileDetails] = useState<ProfileDetails>();

	const scrollRef = useScrollToTop();

	useFocusEffect(
		useCallback(() => {
			setProfileDetails(getProfileDetails());
		}, [])
	);

	if (!profileDetails) {
		return (
			<View style={{ flex: 1, backgroundColor: "#0F172A" }} />
		);
	}

	const recentActivity = DateFormat(profileDetails.recentActivity);
	
	const pendingBalance = profileDetails.pendingBalance;

	return (
		<ScrollView
			style={styles.scrollView}
			contentContainerStyle={{ paddingBottom: 40 }}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
			ref={scrollRef}
		>
			<View style={{ alignItems: "center" }}>
				<View style={[styles.container, { flexDirection: "row" }]}>
					<View style={styles.avatar}>
						<MaterialIcons
							name="person"
							size={60}
							color="#000"
						/>
					</View>
					<View style={styles.textContainer}>
						<Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>Sudhanva S M</Text>
						<Text style={{ color: "white", fontSize: 14, fontWeight: "400" }}>+91 XXXXX XXXXX</Text>
						<Text style={{ color: "white", fontSize: 12, fontWeight: "400" }}>genericemail@gmail.com</Text>
					</View>
				</View>

				<View style={[styles.container, { marginVertical: 10 }]}>
					<Text style={[styles.text, { marginBottom: 16, fontSize: 22, textAlign: "center" }]}>
						Statistics
					</Text>
					<View style={styles.row}>
						<Text style={styles.textType}>Total Spent</Text>
						<Text style={styles.text}>₹{profileDetails.totalSpent.toFixed(2)}</Text>
					</View>

					<View style={styles.row}>
						<Text style={styles.textType}>Groups</Text>
						<Text style={styles.text}>{profileDetails.totalGroups}</Text>
					</View>

					<View style={styles.row}>
						<Text style={styles.textType}>Bills Scanned</Text>
						<Text style={styles.text}>{profileDetails.totalBillsScanned}</Text>
					</View>

					<View style={styles.row}>
						<Text style={styles.textType}>Pending Balance</Text>
						<Text 
							style={[styles.text, {color: pendingBalance > 0 ? "#00fe0d" : pendingBalance < 0 ? "red" : "gray"}]}>
							₹{pendingBalance.toFixed(2)}
						</Text>
					</View>
				</View>

				<View style={[styles.container, { marginVertical: 10 }]}>
					<Text style={[styles.text, { marginBottom: 16, fontSize: 22, textAlign: "center" }]}>
						Activity Insights
					</Text>
					<View style={styles.row}>
						<Text
							numberOfLines={1}
							ellipsizeMode="tail"
							style={[styles.textType, { flexShrink: 1 }]}>
								Most Active Group
						</Text>
						<Text numberOfLines={1} ellipsizeMode="tail" style={styles.text}>{profileDetails.activeGroup}</Text>
					</View>

					<View style={styles.row}>
						<Text style={styles.textType}>Largest Split</Text>
						<Text style={styles.text}>₹{profileDetails.highestExpense.toFixed(2)}</Text>
					</View>

					<View style={styles.row}>
						<Text style={styles.textType}>Recent Activity</Text>
						<Text style={styles.text}>{recentActivity}</Text>
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
		gap: 10,
		justifyContent: "center",
		alignItems: "center",
    },
	text: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
		flexShrink: 1
	},
	textType: {
		color: "#fff",
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
		backgroundColor: "#CBD5E1",
		alignItems: "center",
		justifyContent: "center",
	},
	textContainer: {
		paddingHorizontal: 16,
		gap: 5,
		marginRight: 50,
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
	row: {
		width: "90%",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		borderBottomColor: "#aaa",
		borderBottomWidth: 0.5,
		paddingVertical: 8,
	}
});
