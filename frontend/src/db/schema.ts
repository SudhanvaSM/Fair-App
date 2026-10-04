/*
SCHEMA OF THE DB:
groups
- id
- name
- created_at

members
- id
- group_id
- name

receipts
- id
- title
- group_id
- payer_member_id
- subtotal
- tax
- final_tip
- service_charge
- total
- created_at
- receipt_image_uri

items
- id
- receipt_id
- name
- qty
- unit_price
- total_price

debts
- id
- receipt_id
- group_id
- from_member_id
- to_member_id
- amount
- status

item_assignments
- id
- member_id
- item_id
*/

import { db } from './database';

const DEBUG = false;

export function initializeDatabase() {
	if (DEBUG) {
		console.log("Database tables dropped.")
		db.execSync(`
			DROP TABLE IF EXISTS item_assignments;
			DROP TABLE IF EXISTS debts;
			DROP TABLE IF EXISTS items;
			DROP TABLE IF EXISTS receipts;
			DROP TABLE IF EXISTS members;
			DROP TABLE IF EXISTS groups;
		`);
	}
	db.execSync(`
		CREATE TABLE IF NOT EXISTS groups (
			id TEXT PRIMARY KEY NOT NULL,
			name TEXT NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS members (
			id TEXT PRIMARY KEY NOT NULL,
			group_id TEXT NOT NULL,
			name TEXT NOT NULL,
			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS receipts (
			id TEXT PRIMARY KEY NOT NULL,
			title VARCHAR(20) NOT NULL,
			group_id TEXT NOT NULL,
			payer_member_id TEXT NOT NULL,
			subtotal REAL NOT NULL,
			tax REAL NOT NULL,
			final_tip REAL DEFAULT 0,
			service_charge REAL DEFAULT 0,
			total REAL NOT NULL,
			created_at TEXT NOT NULL,
			receipt_image_uri TEXT NOT NULL,
			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
			FOREIGN KEY (payer_member_id) REFERENCES members(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS items (
			id TEXT PRIMARY KEY NOT NULL,
			receipt_id TEXT NOT NULL,
			name TEXT NOT NULL,
			qty INTEGER NOT NULL,
			unit_price REAL NOT NULL,
			total_price REAL NOT NULL,
			FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS debts (
			id TEXT PRIMARY KEY NOT NULL,
			receipt_id TEXT NOT NULL,
			group_id TEXT NOT NULL,
			from_member_id TEXT NOT NULL,
			to_member_id TEXT NOT NULL,
			amount REAL NOT NULL,
			status TEXT NOT NULL DEFAULT 'pending',
			FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
			FOREIGN KEY (from_member_id) REFERENCES members(id) ON DELETE CASCADE,
			FOREIGN KEY (to_member_id) REFERENCES members(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS item_assignments (
			id TEXT PRIMARY KEY NOT NULL,
			item_id TEXT NOT NULL,
			member_id TEXT NOT NULL,
			FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
			FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
		);
  	`);
}