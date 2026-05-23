import { View, StyleSheet, Image, ScrollView, } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import IconButton from "@/components/IconButton";

export default function Preview() {

	const { imageUri, groupId } = useLocalSearchParams();

	const uri = Array.isArray(imageUri) ? imageUri[0] : imageUri;

	const onReset = () => {
		router.back();
	};

	const onContinueImageAsync = async() => {
		if (!imageUri) return;

		router.push({
			pathname: "/processing",
			params: {
				imageUri,
				groupId: String(groupId),
				},
		});
	};

  	return (
		<>
			<Stack.Screen
				options={{
					headerStyle: { backgroundColor: "#1E293B" },
					headerTitle: "Preview",
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
				<View style={{ marginTop: 20 }}>
					<View style={{alignItems: "center"}}>
					<Image
						source={{ uri }}
						style={{ width: 350, height: 450, borderRadius: 12, }}
					/>
					</View>
				</View>
						
				<View style={{ marginTop: 20, flexDirection: "row"}}>
					<IconButton 
						icon="refresh" 
						label="Reset" 
						size={36} 
						color={"#60A5FA"} 
						onPress={onReset} 
					/>
					<IconButton 
						icon="send" 
						label="Continue" 
						size={36} 
						color={"#10B981"} 
						onPress={onContinueImageAsync}
					/>
				</View>
			</ScrollView>
		</>
	);
}

const styles = StyleSheet.create({
	scrollView: {
		backgroundColor: '#0F172A',
	},
	text: {
		color: "#9ca3af", 
		marginBottom: 8, 
		fontSize: 18, 
		fontWeight: 500, 
	}
});