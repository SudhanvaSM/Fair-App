import { useActionSheet } from "@expo/react-native-action-sheet";
import * as ImagePicker from "expo-image-picker";

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
	  	allowsEditing: false,
	  	quality: 1,
	});

	if (!result.canceled) {
	  	console.log(result);
	  	const uri = result.assets[0].uri;
		return uri;
	} 
	else {
	  	alert("You did not select any image.");
	}
	return null;
};

const openCamera = async () => {
	const hasPermission = await requestPermission();
	if (!hasPermission) return null;

	let result = await ImagePicker.launchCameraAsync({
		allowsEditing: false,
		quality: 1,
	});

	if (!result.canceled) {
		console.log(result);
		const uri = result.assets[0].uri;
		return uri;
	}
	return null;
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