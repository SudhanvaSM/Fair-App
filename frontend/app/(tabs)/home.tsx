import { View, Text, StyleSheet, Image, ScrollView, } from "react-native";
import { useRouter, Link, useFocusEffect } from "expo-router";
import Button from "@/components/Button";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import { useActionSheet } from '@expo/react-native-action-sheet';
import IconButton from "@/components/IconButton";
import Card from "@/components/Card";
import { RecentSplit, SplitHistory } from "@/types/item";
import { initializeDatabase } from "@/src/db/schema";
import { getRecentReceipts } from "@/src/services/receipt.service";

const LIMIT_RECENT_SPLITS_IN_HOME_SCREEN = 5;

export default function Home() {
  useEffect(() => {
    initializeDatabase();
  }, []);
  const router = useRouter();

  const [selectedImage, setSelectedImage] = useState<string> ();

  const [showAppOptions, setShowAppOptions] = useState<boolean>(false);

  const [history, setHistory] = useState<RecentSplit[]>([]);

  useFocusEffect(
		useCallback(() => {
			const receipts = getRecentReceipts(LIMIT_RECENT_SPLITS_IN_HOME_SCREEN);

      setHistory(receipts);
		}, [])
	);

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setShowAppOptions(true);
      console.log(result);
    } else {
      alert("You did not select any image.");
    }
  }

  const onReset = () => {
    setShowAppOptions(false);
    setSelectedImage(undefined);
  };

  const onContinueImageAsync = async() => {
    if (!selectedImage) return;
    router.push({
      pathname: "/processing",
      params: {
        imageUri: selectedImage,
      },
  });
  };

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required');
      return false;
    }
    return true;
  };

  const openCamera = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setShowAppOptions(true);
    }
  };
  const { showActionSheetWithOptions } = useActionSheet();

  const handleScan = () => {
    const options = ['Take Photo', 'Choose from Gallery', 'Cancel'];
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      async (selectedIndex) => {
        if (selectedIndex === 0) {
          // Camera
          await openCamera();
        } else if (selectedIndex === 1) {
          // Gallery
          await pickImageAsync();
        }
      }
    );
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
      >
      <View style={{backgroundColor: "#0F172A"}}>
        <View style={{ justifyContent: "center", paddingHorizontal: 20,}}>

          {!showAppOptions && (
            <View style={{alignItems: "center"}}>
              <Button
                variant="photo"
                title="Scan receipt"
                subtitle="Take a photo or upload from gallery"
                onPress={handleScan}
              />
            </View>
          )}

          {selectedImage && (
            <View style={{ marginTop: 20 }}>
              <Text style={{ color: "#9ca3af", marginBottom: 8, fontSize: 16, fontWeight: 500, paddingHorizontal: 15 }}>
                Preview:
              </Text>
              <View style={{alignItems: "center"}}>
                <Image
                  source={{ uri: selectedImage }}
                  style={{ width: 350, height: 450, borderRadius: 12, }}
                />
              </View>
            </View>
          )}

          {showAppOptions && (
            <View style={{ marginTop: 20, flexDirection: "row"}}>
              <IconButton icon="refresh" label="Reset" size={36} color={"#60A5FA"} onPress={onReset} />
              <IconButton icon="send" label="Continue" size={36} color={"#10B981"} onPress={onContinueImageAsync}/>
            </View>
          )}

          {!showAppOptions && history.length !== 0 && (
            <>
            <View style={{ marginTop: 10, paddingHorizontal: 10, justifyContent: "center" }}>
              <Text style={styles.recent}> 
                Recent Splits
              </Text>
              {history.map((item) => {
                const createdAt = new Date(item.date);
                const today = new Date();
                let date;
                if (createdAt.toDateString() === today.toDateString()) date = "Today"
                else {
                  const yesterday = new Date(today.getDate() - 1);
                  if (createdAt.toDateString() === yesterday.toDateString()) date = "Yesterday";
                  else date = createdAt.toLocaleDateString([], { day: "2-digit", month: "short" });
                }
                return (
                  <View key={item.id}style={{ alignItems: "center" }}>
                    <Card
                    title={item.title}
                    people={item.people}
                    date={date}
                    price={Number(item.price.toFixed(2)) || 0}
                    onPress={() => openRecentSplitDetails(item)}
                    variant={(createdAt.getMinutes()) % 2 !== 0 ? "1" : "2"}
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