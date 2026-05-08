import { View, Text, StyleSheet, ScrollView, Animated } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import Status from "@/components/Status";

export default function Processing() {
	type StepStatus = "waiting" | "active" | "done";

	type Step = {
		label: string;
		status: StepStatus;
	};
  const router = useRouter();

  const translateY = React.useRef(new Animated.Value(0)).current;

  const { imageUri } = useLocalSearchParams();
  const uri = Array.isArray(imageUri) ? imageUri[0] : imageUri;

  const [steps, setSteps] = React.useState<Step[]>([
    { label: "Image Captured", status: "active" as const },
    { label: "OCR Extraction", status: "waiting" as const },
    { label: "Parsing Items", status: "waiting" as const },
  ]);

  // 🔧 helpers
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

  // 🔁 scan animation
  React.useEffect(() => {
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

  // 🚀 processing flow
  React.useEffect(() => {
    const run = async () => {
      try {
        const formData = new FormData();

        formData.append("file", {
          uri,
          name: "receipt.jpg",
          type: "image/jpg",
        } as any);

        // ✅ Start backend call in parallel
        const fetchPromise = fetch("http://10.176.1.196:8000/upload", {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // ⏱ Step 1 → Image Captured
        await delay(500);
        updateStep(1);

        // ⏱ Step 2 → OCR
        await delay(500);
        updateStep(2);

		await delay(500);

    // 📡 wait for backend
    const res = await fetchPromise;
    const data = await res.json();

    // ⏱ Step 3 → Parsing
    updateStep(3);

		router.replace({
		pathname: "../review",
		params: {
			items: JSON.stringify(data),
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
        {/* 📦 Scan Card */}
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

        {/* 📊 Steps */}
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

        {/* ⏱ Footer */}
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
	color: "#6b7280", // gray (subtle)
  },
  textActive: {
	color: "#ffffff", // bright
  },
  textDone: {
		color: "#9ca3af", // soft gray
  },
});