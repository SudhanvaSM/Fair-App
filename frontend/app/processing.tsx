import { View, Text, StyleSheet, ScrollView, Animated } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

import Status from "@/components/Status";

import { API_URL } from "@/src/config/api";


export default function Processing() {
	type StepStatus = "waiting" | "active" | "done";

	type Step = {
		label: string;
		status: StepStatus;
	};
  	const router = useRouter();

	const translateY = useRef(new Animated.Value(0)).current;

	const { imageUri, groupId } = useLocalSearchParams();
	const uri = Array.isArray(imageUri) ? imageUri[0] : imageUri;

	const [steps, setSteps] = useState<Step[]>([
		{ label: "Image Captured", status: "active" as const },
		{ label: "OCR Extraction", status: "waiting" as const },
		{ label: "Parsing Items", status: "waiting" as const },
	]);
	
	const delay = (ms: number) =>
		new Promise(resolve => setTimeout(resolve, ms));

	const updateStep = (activeIndex: number) => {
		setSteps(prev =>
		prev.map((step, i) => ({
			...step,
			status:
			i < activeIndex
				? "done"
				: i === activeIndex
				? "active"
				: "waiting",
		}))
		);
	};

	useEffect(() => {
		Animated.loop(
		Animated.sequence([
			Animated.timing(translateY, {
			toValue: 200,
			duration: 2000,
			useNativeDriver: true,
			}),
			Animated.timing(translateY, {
			toValue: -10,
			duration: 2000,
			useNativeDriver: true,
			}),
		])
		).start();
	}, []);

	useEffect(() => {
		const run = async () => {
		try {
			const formData = new FormData();

			formData.append("file", {
			uri,
			name: "receipt.jpg",
			type: "image/jpg",
			} as any);

			const fetchPromise = fetch(`${API_URL}/upload`, {
			method: "POST",
			body: formData,
			headers: {
				"Content-Type": "multipart/form-data",
			},
			});

			await delay(500);
			updateStep(1);

			await delay(500);
			updateStep(2);

			await delay(500);

		const res = await fetchPromise;
		const data = await res.json();

		const normalisedData = {
			...data,
			raw: {
				...data.raw,
				items: data.raw.items.map((item: any) => ({
					itemId: item.item_id,
					name: item.name,
					qty: item.qty,
					unitPrice: item.unit_price ?? 0,
					totalPrice: item.total_price ?? 0,
				})),
			}
		};

		updateStep(3);
			router.replace({
			pathname: "../review",
			params: {
				items: JSON.stringify(normalisedData),
				groupId: String(groupId),
				imageUri: uri,
			},
			});

		} catch (err) {
			console.error("Processing error:", err);
		}
		};

		run();
	}, []);

	return (
		<>
		<Stack.Screen
			options={{
			headerStyle: { backgroundColor: "#1E293B" },
			headerTitle: "Processing",
			headerTitleAlign: "left",
			headerShadowVisible: false,
			headerTintColor: "#ffffff",
				animation: "slide_from_right",
			}}
		/>

		<ScrollView style={styles.scrollView}>
			<View style={styles.card}>
			<View style={styles.scan}>
				<MaterialIcons
				name="receipt-long"
				size={150}
				color="#cbd5f5"
				/>

				<Animated.View
				style={[
					styles.scanLine,
					{ transform: [{ translateY }] },
				]}
				>
				<LinearGradient
					colors={[
					"transparent",
					"rgb(99, 101, 241)",
					"transparent",
					]}
					start={{ x: 0, y: 0.5 }}
					end={{ x: 1, y: 0.5 }}
					style={StyleSheet.absoluteFill}
				/>
				</Animated.View>
			</View>
			</View>

			<View style={{ gap: 16, marginTop: 24 }}>
			{steps.map((step, index) => (
				<View key={index} style={styles.status}>
				<Text
					style={[
						styles.text,
						step.status === "waiting" && styles.textWaiting,
						step.status === "active" && styles.textActive,
						step.status === "done" && styles.textDone,
					]}>
						{step.label}
					</Text>
				<Status title={step.status} subtle={false} variant={step.status} />
				</View>
			))}
			</View>

			<View style={styles.footer}>
			<Text style={styles.footerText}>
				Usually takes 2-3 seconds
			</Text>
			</View>
		</ScrollView>
		</>
	);
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  scan: {
    width: 350,
    height: 200,
    borderRadius: 20,
    elevation: 4,
    backgroundColor: "#39434f",
    overflow: "hidden",
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scanLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    shadowColor: "#6366f1",
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  scrollView: {
    backgroundColor: "#0F172A",
  },
  text: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "500",
  },
  status: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 50,
    alignItems: "center",
  },
  footer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    color: "#cbd5f5",
    fontSize: 16,
  },
  textWaiting: {
	color: "#6b7280",
  },
  textActive: {
	color: "#ffffff", 
  },
  textDone: {
		color: "#9ca3af", 
  },
});