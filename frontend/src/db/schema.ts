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
- group_id
- payer_member_id
- subtotal
- tax
- final_tip
- service_charge
- total
- created_at

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
- settled_amount
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
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
    	);

		CREATE TABLE IF NOT EXISTS members (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			group_id INTEGER NOT NULL,
			name TEXT NOT NULL,
			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS receipts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			group_id INTEGER NOT NULL,
			payer_member_id INTEGER NOT NULL,
			subtotal REAL NOT NULL,
			tax REAL NOT NULL,
			final_tip REAL DEFAULT 0,
			service_charge REAL DEFAULT 0,
			total REAL NOT NULL,
			created_at TEXT NOT NULL,

			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,

			FOREIGN KEY (payer_member_id) REFERENCES members(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			receipt_id INTEGER NOT NULL,
			name TEXT NOT NULL,
			qty INTEGER NOT NULL,
			unit_price REAL NOT NULL,
			total_price REAL NOT NULL,

			FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS debts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			receipt_id INTEGER NOT NULL,
			group_id INTEGER NOT NULL,
			from_member_id INTEGER NOT NULL,
			to_member_id INTEGER NOT NULL,
			amount REAL NOT NULL,
			settled_amount REAL DEFAULT 0,

			status TEXT NOT NULL DEFAULT 'pending',

			FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,

			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,

			FOREIGN KEY (from_member_id) REFERENCES members(id) ON DELETE CASCADE,

			FOREIGN KEY (to_member_id) REFERENCES members(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS item_assignments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			item_id INTEGER NOT NULL,
			member_id INTEGER NOT NULL,

			FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,

			FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
		);
  	`);
}