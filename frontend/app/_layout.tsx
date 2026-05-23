import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from "react-native-paper";

export default function RootLayout() {
  return (
    <ActionSheetProvider>
      <PaperProvider>
        <StatusBar style="light"/>
          <Stack>
            <Stack.Screen 
                name="(tabs)" 
                options={{ headerShown: false, animation: "slide_from_right" }} 
            />
          </Stack>
      </PaperProvider>
    </ActionSheetProvider>
  );
}
