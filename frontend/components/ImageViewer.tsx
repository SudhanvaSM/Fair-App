import { StyleSheet } from "react-native";
import { Image } from "expo-image";

type Props = {
	imgSource: string;
};

export default function ImageViewer({ imgSource}: Props) {
	return <Image source={imgSource} style={styles.image} />
}

const styles = StyleSheet.create({
	image: {
		width: "100%",
		height: "100%",
		borderRadius: 10,
		alignContent: "center",
		justifyContent: "center",
		alignItems: "center",
	},
});

