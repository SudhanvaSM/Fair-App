import * as SQLite from 'expo-sqlite';
import { Platform } from "react-native";

if (Platform.OS === "web") {
	console.log("Web detected");
}
export const db = SQLite.openDatabaseSync('fair.db');

db.execSync(`
	PRAGMA foreign_keys = ON;
	`);