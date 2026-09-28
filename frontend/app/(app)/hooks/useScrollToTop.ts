import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import { ScrollView } from "react-native";

export default function useScrollToTop() {
	const scrollRef = useRef<ScrollView>(null);
	
	useFocusEffect(
		useCallback(() => {
			scrollRef.current?.scrollTo({
				y: 0,
				animated: false
			});
		}, [])
	);

	return scrollRef;
}