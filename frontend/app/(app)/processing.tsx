import { View, Text, StyleSheet, ScrollView, Animated, Pressable } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

import Status from "@/components/Status";
import { supabase } from "lib/supabase";

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

	const API_URL = process.env.EXPO_PUBLIC_API_URL;

	const TIMEOUT_MS = 45000;

	type Failure = { message: string; canRetry: boolean };

	const failureForStatus = (status: number): Failure => {
		switch (status) {
			case 401: return { message: "Your session expired. Please log out and log in again.", canRetry: false };
			case 413: return { message: "That photo is too large. Try a smaller one.", canRetry: false };
			case 415: return { message: "Please use a JPEG, PNG or WebP photo.", canRetry: false };
			case 422: return { message: "We couldn't read this receipt. Try a clearer, flatter photo.", canRetry: true };
			case 429: return { message: "Too many scans. Wait a minute and try again.", canRetry: true };
			case 502:
			case 503:
			case 504: return { message: "The scanner is unavailable right now. Try again in a moment.", canRetry: true };
			default:  return { message: `Something went wrong (${status}).`, canRetry: true };
		}
	};
	const [failure, setFailure] = useState<Failure | null>(null);
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		const controller = new AbortController();
		let timedOut = false;
		const timer = setTimeout(() => {
			timedOut = true;
			controller.abort();
		}, TIMEOUT_MS);

		const run = async () => {
			setFailure(null);
			updateStep(0);

			try {
				const { data: { session }, error } = await supabase.auth.getSession();
				if (error || !session) {
					setFailure({ message: "Please log in again.", canRetry: false });
        			return;
				}
				if (!uri) {
					setFailure({ message: "No image was selected.", canRetry: false });
					return;
				}
				const formData = new FormData();

				formData.append("file", {
					uri,
					name: "receipt.jpeg",
					type: "image/jpeg",
				} as any);
				updateStep(1);
				const res = await fetch(`${API_URL}/upload`, {
					signal: controller.signal,
					method: "POST",
					body: formData,
					headers: {
						'Authorization': `Bearer ${session.access_token}`,
					}
				});
				if (!res.ok) {
					setFailure(failureForStatus(res.status));
				}
				const data = await res.json();
				const items = data?.raw?.items;
				if (!Array.isArray(items) || items.length === 0) {
					setFailure({
					message: "We couldn't find any items on this receipt. Try a clearer photo.",
					canRetry: true,
					});
					return;
				}
				console.log(JSON.stringify(data));

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
							confidence: item.confidence ?? 0,
						})),
					}
				};

				updateStep(2);
				await delay(50);
				
				updateStep(3);
				await delay(250);

				if (controller.signal.aborted) return;

				router.replace({
					pathname: "../review",
					params: {
						items: JSON.stringify(normalisedData),
						groupId: String(groupId),
					},
				});
			} 
			catch (error) {
				if (timedOut) {
					setFailure({ message: "Scanning took too long. Try again.", canRetry: true });
				} else if (controller.signal.aborted) {
					return
				} else {
					setFailure({ message: "Couldn't reach the server. Check your connection.", canRetry: true });
				}
			} finally {
				clearTimeout(timer);
			}
		};
		run();
		return() => {
			clearTimeout(timer);
			controller.abort();
		};
	}, [attempt]);

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
			{failure ? (
				<View style={{ padding: 24, gap: 16, alignItems: "center" }}>
					<Text style={{ color: "#fff", fontSize: 18, textAlign: "center" }}>{failure.message}</Text>
					{failure.canRetry && (
						<>
							<Pressable onPress={() => setAttempt(a => a + 1)}>
								<Text style={{ color: "#6366f1", fontSize: 16 }}>Try again</Text>
							</Pressable>
							<Pressable onPress={() => router.replace({
								pathname: "../review",
								params: {
									groupId: String(groupId),
								},
							})}>
								<Text style={{ color: "#6366f1", fontSize: 16 }}>Enter items manually</Text>
							</Pressable>
						</>
					)}
					<Pressable onPress={() => router.back()}>
					<Text style={{ color: "#cbd5f5", fontSize: 16 }}>Go back</Text>
					</Pressable>
				</View>
				) : (
					<>
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
					</>
				)}
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