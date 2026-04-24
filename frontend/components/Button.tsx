import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View, Pressable, Text } from "react-native";

type Variant = "photo" | "group" | "openCamera";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

type Props = {
	title: string;
	subtitle: string;
	variant?: Variant;
	onPress?: () => void;
};

export default function Button({ title, subtitle, variant = "photo", onPress }: Props) {

  const config = variantConfig[variant];
  const [pressed, setPressed] = React.useState(false);

  return (
    <View style={[styles.buttonContainer, { backgroundColor: config.backgroundColor }]}>
      <Pressable
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onPress={onPress}
        style={[
          styles.button,
          { transform: [{ scale: pressed ? 0.95 : 1 }] }
        ]}
      >
        <MaterialIcons
          name={config.icon}
          size={config.size}
          color="#3B82F6"
          style={styles.buttonIcon}
        />

        <Text style={styles.title}>{title}</Text>

        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}

      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
  width: 350,
  height: 200,
  borderRadius: 20,
  elevation: 4,
  backgroundColor: "#39434f",
  overflow: "hidden",
	paddingHorizontal: 10,
  marginTop: 20,
  borderWidth: 1,
  borderColor: "#fff",
  borderStyle: "dashed",
  },
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  buttonIcon: {
    marginBottom: 12,
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 12,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    color: "#a1a1aa",
    fontSize: 14,
    textAlign: "center",
  },
});

const variantConfig: Record<
  Variant,
  {icon: IconName; backgroundColor: string; size: number}
  > = {
  photo: {
    icon: "upload",
    backgroundColor: "#39434f",
    size: 28,
  },
  openCamera: {
    icon: "camera",
    backgroundColor: "#2c2c2c",
    size: 28,
  },
  group: {
    icon: "group",
    backgroundColor: "#1f2937",
    size: 28,
  },
};