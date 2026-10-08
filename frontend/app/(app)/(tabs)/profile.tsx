import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Redirect, Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {Text, View, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator  } from "react-native";
import { Icon, Menu } from "react-native-paper";

import { ProfileDetails } from "@/types/item";

import { deleteLocalData, getProfileDetails, resetAppData } from "@/src/services/user.services";

import DateFormat from "@/utils/dateFormat";

import useScrollToTop from "../hooks/useScrollToTop";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthProvider";
import syncAll from "@/lib/sync/syncAll";
import Ring from "@/components/LoadingWheel";


export default function ProfileScreen() {

	const [visible, setVisible] = useState(false);
	const openMenu = () => setVisible(true);
	const closeMenu = () => setVisible(false);

	const [isSyncing, setIsSyncing] = useState(false);

	const scrollRef = useScrollToTop();

	const [profileDetails, setProfileDetails] = useState<ProfileDetails>();

	useFocusEffect(
		useCallback(() => {
			setProfileDetails(getProfileDetails());
		}, [])
	);

	const { session, loading } = useAuth();
	if (loading) {
		return null;
	}

	if (!session) {
		return <Redirect href="/login" />;
	}

	if (!profileDetails) {
		return (
			<View style={{ flex: 1, backgroundColor: "#0F172A" }} />
		);
	}

	const recentActivity = DateFormat(profileDetails.recentActivity);
	
	const pendingBalance = profileDetails.pendingBalance;

	const deleteAllData = () => {
		Alert.alert (
			"Reset Data",
			"Are you sure you want to reset all data? This action deletes existing groups and splits.\nTHIS ACTION CANNOT BE UNDONE.",
			[
				{
					text: "Cancel",
					style: "cancel",
				},
				{
					text: "Delete",
					style: "destructive",
					onPress:() => {
						try {
							resetAppData();
							syncAll().catch(error => {
								console.error("Background sync failed:", error);
							});
							setProfileDetails(getProfileDetails());
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

	const logout = async () => {
		const success = await syncAll();

		if (!success) {
			Alert.alert("Could not complete sync", "Please try again before logging out.");
			return;
		}

		const { error } = await supabase.auth.signOut({ scope: "local" });

		if (error) {
            Alert.alert('Logout failed', error.message);
            return;
        }

		deleteLocalData();
	}

	const syncLocalChanges = async () => {
		if (isSyncing) return;

		setIsSyncing(true);

		try {
			const success = await syncAll();

			if (!success) {
				Alert.alert("Could not complete sync", "Please try again before logging out.");
				return;
			}
			await new Promise(resolve => setTimeout(resolve, 500));
			Alert.alert("Upload Complete", "All local changes uploaded to cloud database.");
		} finally {
			setIsSyncing(false);
		}
	};

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
							onPress={() => syncLocalChanges()}
							title="Sync Local Changes"
							titleStyle={{ color: "white" }}
							trailingIcon={() => (
								<View style={{ width: 32, alignItems: "center" }}>
									{isSyncing ? (
									<Ring
										size={20}
										strokeWidth={2}
										color={"#ffffff"}
										duration={1500}
									/>
								) : (
									null
								)}
								</View>
							)
							}
						/>

						<Menu.Item
							hitSlop={10}
							onPress={() => deleteAllData()}
							title="Reset App Data"
							titleStyle={{ color: "red" }}
						/>

						<Menu.Item
							hitSlop={10}
							onPress={() => logout()}
							title="Log Out"
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
				<View style={{ alignItems: "center" }}>
					<View style={[styles.container, { flexDirection: "row", gap: 20 }]}>
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
							<Text style={{ color: "white", fontSize: 12, fontWeight: "400" }} ellipsizeMode="tail" numberOfLines={1}>{profileDetails.email}</Text>
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
								style={[styles.text, {color: pendingBalance > 0 ? "#10B981" : pendingBalance < 0 ? "red" : "gray"}]}>
								₹{Math.abs(pendingBalance).toFixed(2)}
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
		</>
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
		flex: 1,
		minWidth: 0,
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
