import { useActionSheet } from "@expo/react-native-action-sheet";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator } from 'expo-image-manipulator';

// Bounds
const MAX_WIDTH = 1024;
const MAX_HEIGHT = 1024;

const requestPermission = async () => {
	const { status } = await ImagePicker.requestCameraPermissionsAsync();
	if (status !== 'granted') {
		alert('Camera permission is required');
		return false;
	}
	return true;
}

const pickImageAsync = async () => {
	let result = await ImagePicker.launchImageLibraryAsync({
	  	allowsEditing: true,
	  	quality: 0.8,
		mediaTypes: ['images'],
	});
	if (!result.assets?.[0]) {
		return null;
	}
	if (result.canceled) {
		return null;
	}

	const { uri, width, height } = result.assets[0];

	let finalUri = uri;

	// 2. Check if the image exceeds the maximum dimensions
	if (width > MAX_WIDTH || height > MAX_HEIGHT) {
		const actions = [];

		// Determine the constraint based on orientation
		if (width > height) {
		actions.push({ resize: { width: MAX_WIDTH } });
		} else {
		actions.push({ resize: { height: MAX_HEIGHT } });
		}
		const context = await ImageManipulator.manipulate(uri);

		const imageRef = await context.renderAsync();

		const manipResult = await imageRef.saveAsync({
		compress: 0.8,
		format: ImageManipulator.SaveFormat.JPEG,
		});

		finalUri = manipResult.uri;
	}

	console.log("Resized image path:", finalUri);
	return finalUri;
};

const openCamera = async () => {
	const hasPermission = await requestPermission();
	if (!hasPermission) return null;

	let result = await ImagePicker.launchCameraAsync({
		allowsEditing: true,
		quality: 1,
		mediaTypes: ['images']
	});

	if (!result.assets?.[0]) {
		return null;
	}

	if (result.canceled) {
		return null;
	}
	const { uri, width, height } = result.assets[0];

	let finalUri = uri;

	// 2. Check if the image exceeds the maximum dimensions
	if (width > MAX_WIDTH || height > MAX_HEIGHT) {
		const actions = [];

		// Determine the constraint based on orientation
		if (width > height) {
		actions.push({ resize: { width: MAX_WIDTH } });
		} else {
		actions.push({ resize: { height: MAX_HEIGHT } });
		}
		const context = await ImageManipulator.manipulate(uri);

		const imageRef = await context.renderAsync();

		const manipResult = await imageRef.saveAsync({
		compress: 0.8,
		format: ImageManipulator.SaveFormat.JPEG,
		});

		finalUri = manipResult.uri;
	}

	console.log("Resized image path:", finalUri);
	return finalUri;
};

export default function useImagePicker() {
	const { showActionSheetWithOptions } = useActionSheet();

	const handleScan = (): Promise<string | null> => {
		return new Promise((resolve) => {
			const options = ['Take Photo', 'Choose from Gallery', 'Cancel'];
				const cancelButtonIndex = 2;

				showActionSheetWithOptions({ options, cancelButtonIndex, },
				async (selectedIndex) => {
					if (selectedIndex === 0) {
						// Camera
						const uri = await openCamera();
						resolve(uri);
					} 
					else if (selectedIndex === 1) {
						// Gallery
						const uri = await pickImageAsync();
						resolve(uri);
					}
					else {
						resolve(null);
					}
				}	
			);
		});
	};

	return { handleScan }
}