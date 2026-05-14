import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('fair.db');

db.execSync(`
	PRAGMA foreign_keys = ON;
	`);