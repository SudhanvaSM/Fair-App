/*
SCHEMA OF THE DB:
groups
- id
- name
- created_at
- sync_status
- updated_at

members
- id
- group_id
- name
- active
- sync_status
- created_at
- updated_at

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
- sync_status
- updated_at

items
- id
- receipt_id
- name
- qty
- unit_price
- total_price
- sync_status
- created_at

debts
- id
- receipt_id
- group_id
- from_member_id
- to_member_id
- amount
- sync_status
- created_at

item_assignments
- id
- member_id
- item_id
- sync_status
- created_at

settlements
- id
- group_id
- from_member_id
- to_member_id
- amount
- sync_status
- created_at

sync_deletions
- id
- table_name
- record_id
- deleted_at

profile
- user_id
- name
- email
- phone

app_state
- key
- value
*/

import { db } from './database';

const DEBUG = false;

export function initializeDatabase() {
	if (DEBUG) {
		console.log("Database tables dropped.")
		db.execSync(`
			DROP TABLE IF EXISTS item_assignments;
			DROP TABLE IF EXISTS debts;
			DROP TABLE IF EXISTS settlements;
			DROP TABLE IF EXISTS items;
			DROP TABLE IF EXISTS receipts;
			DROP TABLE IF EXISTS members;
			DROP TABLE IF EXISTS groups;
			DROP TABLE IF EXISTS profile;
			DROP TABLE IF EXISTS sync_deletions;
			DROP TABLE IF EXISTS app_state;
		`);
	}
	db.execSync(`
		CREATE TABLE IF NOT EXISTS groups (
			id TEXT PRIMARY KEY NOT NULL,
			name TEXT NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			sync_status TEXT DEFAULT 'not_synced',
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT groups_sync_check CHECK (sync_status in ('synced', 'not_synced'))
		);

		CREATE TABLE IF NOT EXISTS members (
			id TEXT PRIMARY KEY NOT NULL,
			group_id TEXT NOT NULL,
			name TEXT NOT NULL,
			active INTEGER NOT NULL DEFAULT 1,
			sync_status TEXT DEFAULT 'not_synced',
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
			CONSTRAINT members_sync_check CHECK (sync_status in ('synced', 'not_synced'))
		);

		CREATE TABLE IF NOT EXISTS receipts (
			id TEXT PRIMARY KEY NOT NULL,
			title TEXT NOT NULL CHECK (length(title) <= 20),
			group_id TEXT NOT NULL,
			payer_member_id TEXT NOT NULL,
			subtotal INTEGER NOT NULL,
			tax INTEGER NOT NULL,
			final_tip INTEGER DEFAULT 0,
			service_charge INTEGER DEFAULT 0,
			total INTEGER NOT NULL,
			created_at TEXT NOT NULL,
			receipt_image_uri TEXT,
			sync_status TEXT DEFAULT 'not_synced',
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
			FOREIGN KEY (payer_member_id) REFERENCES members(id) ON DELETE CASCADE,
			CONSTRAINT receipts_sync_check CHECK (sync_status in ('synced', 'not_synced'))
		);

		CREATE TABLE IF NOT EXISTS items (
			id TEXT PRIMARY KEY NOT NULL,
			receipt_id TEXT NOT NULL,
			name TEXT NOT NULL,
			qty INTEGER NOT NULL,
			unit_price INTEGER NOT NULL,
			total_price INTEGER NOT NULL,
			sync_status TEXT DEFAULT 'not_synced',
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
			CONSTRAINT items_sync_check CHECK (sync_status in ('synced', 'not_synced'))
		);

		CREATE TABLE IF NOT EXISTS debts (
			id TEXT PRIMARY KEY NOT NULL,
			receipt_id TEXT NOT NULL,
			group_id TEXT NOT NULL,
			from_member_id TEXT NOT NULL,
			to_member_id TEXT NOT NULL,
			amount INTEGER NOT NULL,
			sync_status TEXT DEFAULT 'not_synced',
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
			FOREIGN KEY (from_member_id) REFERENCES members(id) ON DELETE CASCADE,
			FOREIGN KEY (to_member_id) REFERENCES members(id) ON DELETE CASCADE,
			CONSTRAINT debts_sync_check CHECK (sync_status in ('synced', 'not_synced')),
			CONSTRAINT debts_amount_check CHECK (amount > 0),
			CONSTRAINT debts_members_check CHECK (from_member_id <> to_member_id)
		);

		CREATE TABLE IF NOT EXISTS settlements (
			id TEXT PRIMARY KEY NOT NULL,
			group_id TEXT NOT NULL,
			from_member_id TEXT NOT NULL,
			to_member_id TEXT NOT NULL,
			amount INTEGER NOT NULL,
			sync_status TEXT DEFAULT 'not_synced',
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
			FOREIGN KEY (from_member_id) REFERENCES members(id) ON DELETE CASCADE,
			FOREIGN KEY (to_member_id) REFERENCES members(id) ON DELETE CASCADE,
			CONSTRAINT settlements_sync_check CHECK (sync_status in ('synced', 'not_synced')),
			CONSTRAINT settlements_amount_check CHECK (amount > 0),
			CONSTRAINT settlements_members_check CHECK (from_member_id <> to_member_id)
		);

		CREATE TABLE IF NOT EXISTS item_assignments (
			id TEXT PRIMARY KEY NOT NULL,
			item_id TEXT NOT NULL,
			member_id TEXT NOT NULL,
			sync_status TEXT DEFAULT 'not_synced',
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
			FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
			CONSTRAINT item_assignments_sync_check CHECK (sync_status in ('synced', 'not_synced')),
			CONSTRAINT item_assignments_unique UNIQUE (item_id, member_id)
		);

		CREATE TABLE IF NOT EXISTS sync_deletions (
			id TEXT PRIMARY KEY NOT NULL,
			table_name TEXT NOT NULL,
			record_id TEXT NOT NULL,
			deleted_at TEXT DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(table_name, record_id)
		);

		CREATE TABLE IF NOT EXISTS profile (
 			user_id TEXT PRIMARY KEY NOT NULL,
			email TEXT NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS app_state (
			key TEXT PRIMARY KEY NOT NULL,
			value TEXT NOT NULL
		);
  	`);
}