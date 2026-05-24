import { Tabs, } from 'expo-router';
import { useState } from 'react';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ActionSheetProvider }  from '@expo/react-native-action-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu } from 'react-native-paper';
import { Pressable, Text, StyleSheet } from 'react-native';

export default function TabsLayout() {
	const insets = useSafeAreaInsets();

	const [visible, setVisible] = useState(false);
	const openMenu = () => setVisible(true);
	const closeMenu = () => setVisible(false);

	return (
		<ActionSheetProvider>
			<Tabs
				screenOptions={{
					tabBarActiveTintColor: "#10B981",
					tabBarInactiveTintColor: "#94A3B8",
					headerTitleAlign: "center",
					headerStyle: {
						backgroundColor: "#1E293B",
					},
					headerShadowVisible: false,
					headerTintColor: "#fff",
					tabBarStyle: {
						backgroundColor: "#1E293B",
						borderTopWidth: 2,
						borderTopColor: "#334165",
						height: 65 + insets.bottom,
						paddingBottom: insets.bottom,
						paddingTop: 5,
					},
					tabBarLabelStyle: {
						fontSize: 12,
						fontWeight: "500",
					},
				}}
			>
			<Tabs.Screen
				name="home"
				options={{
					title: "Home",
					headerTitle: () => (
						<Text
							style={styles.title}
							numberOfLines={1}
							ellipsizeMode="tail"
						>Fair</Text>
					),
					tabBarIcon: ({ focused, color }) => <Ionicons name={ focused ? "home" : "home-outline" } size={24} color={color}/>,
					animation: 'shift',
				}}
			/>

			<Tabs.Screen
				name="groups"
				options={{
					title: "Groups",
					headerTitle: () => (
						<Text
							style={styles.title}
							numberOfLines={1}
							ellipsizeMode="tail"
						>Groups</Text>
					),
					tabBarIcon: ({ focused, color }) => <MaterialCommunityIcons name={ focused ? "account-group" : "account-group-outline" } size={24} color={color}/>,
					animation: 'shift'
				}}
				/>

			<Tabs.Screen
				name="history"
				options={{
					title: "History",
					headerTitle: () => (
						<Text
							style={styles.title}
							numberOfLines={1}
							ellipsizeMode="tail"
						>History</Text>
					),
					tabBarIcon: ({ focused, color }) => <MaterialIcons name={ focused ? "history" : "history-toggle-off" } size={24} color={color}/>,
					animation: 'shift'
				}}
				/>

			<Tabs.Screen
				name="profile"
				options={{
					title: "Profile",
					headerTitle: () => (
						<Text
							style={styles.title}
							numberOfLines={1}
							ellipsizeMode="tail"
						>Profile</Text>
					),
					tabBarIcon: ({ focused, color }) => <MaterialCommunityIcons name={focused ? "account-tie" : "account-tie-outline"} size={24} color={color}/>,
					animation: 'shift',
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
							onPress={() => {}}
							title="Edit Group Title"
							titleStyle={{ color: "#fff" }}
						/>
						<Menu.Item
							hitSlop={10}
							onPress={() => {}}
							title="Delete Group"
							titleStyle={{ color: "red" }}
						/>
						</Menu>
					)
				}}
			/>
		</Tabs>
		</ActionSheetProvider>
	);
}

const styles = StyleSheet.create({
	title: {
		color: "#fff",
		fontSize: 20,
		fontWeight: "600",
		flexShrink: 1,
  	},
})