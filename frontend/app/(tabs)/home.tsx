import { View, Text, StyleSheet, ScrollView, } from "react-native";
import { Link, useFocusEffect, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { RecentSplit } from "@/types/item";

import { initializeDatabase } from "@/src/db/schema";
import { getRecentReceipts } from "@/src/services/receipt.service";

import useImagePicker from "../hooks/useImagePicker";
import useScrollToTop from "../hooks/useScrollToTop";

import DateFormat from "@/utils/dateFormat";

import Card from "@/components/Card";
import Button from "@/components/Button";


const LIMIT_RECENT_SPLITS_IN_HOME_SCREEN = 5;
const GROUP_ID = "-1";

export default function Home() {

    useEffect(() => {
      	initializeDatabase();
    }, []);

    const [history, setHistory] = useState<RecentSplit[]>([]);
    const scrollRef = useScrollToTop();

    useFocusEffect(
      	useCallback(() => {
        	const receipts = getRecentReceipts(LIMIT_RECENT_SPLITS_IN_HOME_SCREEN);
        	setHistory(receipts);
      	}, [])
    );

	const { handleScan } = useImagePicker();

	const onContinueImageAsync = async() => {
		const imageUri = await handleScan();
		if (!imageUri) return;

		router.push({
			pathname: "/preview",
			params: {
				imageUri,
				groupId: GROUP_ID,
			},
		});
	};

    const openRecentSplitDetails = (item: RecentSplit) => {
        router.push({
          	pathname: "/detailedHistory",
          	params: {
            	receiptId: item.id,
          	},
        });
    };

    return (
        <ScrollView
          	style={styles.scrollView}
          	contentContainerStyle={{ paddingBottom: 40 }}
          	showsVerticalScrollIndicator={false}
          	keyboardShouldPersistTaps="handled"
          	ref={scrollRef}
        >
			<View style={{ backgroundColor: "#0F172A", marginTop: 10 }}>
				<View style={{ justifyContent: "center" }}>
					<View style={{alignItems: "center"}}>
					<Button
						variant="photo"
						title="Scan receipt"
						subtitle="Take a photo or upload from gallery"
						onPress={onContinueImageAsync}
					/>
					</View>

					{history.length !== 0 && (
						<>
							<View style={{ justifyContent: "center" }}>
								<Text style={styles.recent}>Recent Splits</Text>
								{history.map((item) => {

								const date = DateFormat(item.date);

								return (
									<View key={item.id}style={{ alignItems: "center" }}>
									<Card
									title={item.title}
									people={item.people}
									date={date}
									price={Number(item.price.toFixed(2)) || 0}
									onPress={() => openRecentSplitDetails(item)}
									variant={(item.id) % 2 !== 0 ? "1" : "2"}
									/>
									</View>
								);
								})}

								<View style={{justifyContent: "center", alignItems: "center"}}>
									<Link href={"/history"} style={styles.href}>
										See full history
									</Link>
								</View>
							</View>
						</>
					)}
          		</View>
        	</View>
      	</ScrollView>
  );
}

const styles = StyleSheet.create({
	text: {
		color: "#9ca3af",
		fontSize: 16,
		fontWeight: "600",
	},
	recent: {
		color: "#9ca3af",
		fontSize: 20,
		fontWeight: "500",
		marginTop: 24,
		paddingHorizontal: 33,
	},
	scrollView: {
		backgroundColor: '#0F172A',
	},
	href: {
		fontSize: 20,
		textDecorationLine: "underline",
		color: "#fff",
		marginTop: 20,
	},
});