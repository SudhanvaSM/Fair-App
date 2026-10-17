import { useActionSheet } from "@expo/react-native-action-sheet";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

// Maximum dimensions for images sent to the receipt scanner.
const MAX_WIDTH = 1024;
const MAX_HEIGHT = 1024;

const requestPermission = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    alert("Camera permission is required");
    return false;
  }
  return true;
};

/** Resize oversized images while preserving their aspect ratio. */
const resizeImageIfNeeded = async (
  uri: string,
  width: number,
  height: number,
): Promise<string> => {
  if (width <= MAX_WIDTH && height <= MAX_HEIGHT) {
    return uri;
  }

  const context = ImageManipulator.manipulate(uri);

  // Resize the longer dimension to its limit; the other dimension scales
  // proportionally, so the image's aspect ratio is preserved.
  if (width >= height) {
    context.resize({ width: MAX_WIDTH });
  } else {
    context.resize({ height: MAX_HEIGHT });
  }

  const imageRef = await context.renderAsync();
  const result = await imageRef.saveAsync({
    compress: 0.8,
    format: SaveFormat.JPEG,
  });

  console.log("Resized image path:", result.uri);
  return result.uri;
};

const pickImageAsync = async (): Promise<string | null> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    quality: 1,
    mediaTypes: ["images"],
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  return resizeImageIfNeeded(asset.uri, asset.width, asset.height);
};

const openCamera = async (): Promise<string | null> => {
  const hasPermission = await requestPermission();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 1,
    mediaTypes: ["images"],
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  return resizeImageIfNeeded(asset.uri, asset.width, asset.height);
};

export default function useImagePicker() {
  const { showActionSheetWithOptions } = useActionSheet();

  const handleScan = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const options = ["Take Photo", "Choose from Gallery", "Cancel"];
      const cancelButtonIndex = 2;

      showActionSheetWithOptions(
        { options, cancelButtonIndex },
        async (selectedIndex) => {
          if (selectedIndex === 0) {
            resolve(await openCamera());
          } else if (selectedIndex === 1) {
            resolve(await pickImageAsync());
          } else {
            resolve(null);
          }
        },
      );
    });
  };

  return { handleScan };
}
