import { db } from "@/src/db/database";
import fetchDebts from "./pull/fetchDebts";
import fetchGroups from "./pull/fetchGroups";
import fetchItemAssignments from "./pull/fetchItemAssignments";
import fetchItems from "./pull/fetchItems";
import fetchMembers from "./pull/fetchMembers";
import fetchReceipts from "./pull/fetchReceipts";
import { SyncStep } from "@/types/item";
import fetchSettlements from "./pull/fetchSettlements";
import fetchProfile from "./pull/fetchProfile";

export default async function pullInitialData(onProgress?: (step: SyncStep) => void) {
	onProgress?.("profile");
	const profile = await fetchProfile();

	onProgress?.("groups");
	const groups = await fetchGroups();

	onProgress?.("members");
	const members = await fetchMembers();

	onProgress?.("receipts");
	const receipts = await fetchReceipts();

	onProgress?.("items");
	const items = await fetchItems();

	onProgress?.("assignments");
	const item_assignments = await fetchItemAssignments();

	onProgress?.("debts");
	const debts = await fetchDebts();

	onProgress?.("settlements");
	const settlements = await fetchSettlements();

	db.withTransactionSync(() => {
		db.runSync(
			`
				INSERT OR REPLACE INTO profile(user_id, email, created_at)
				VALUES (?, ?, ?)
				ON CONFLICT(user_id) DO UPDATE SET
        			email = excluded.email
			`, [profile.id, profile.email, profile.created_at]
		);

		for (const group of groups) {
			db.runSync(
			`
				INSERT INTO groups(
								id,
								name,
								created_at,
								sync_status,
								updated_at
							)
				VALUES (?, ?, ?, 'synced', ?)
			`, [group.id, group.name, group.created_at, group.updated_at]
		);
		}

		for (const member of members) {
			db.runSync(
			`
				INSERT INTO members (id, group_id, name, active, sync_status, created_at, updated_at)
				VALUES (?, ?, ?, ?, 'synced', ?, ?)
			`, [member.id, member.group_id, member.name, member.active ? 1 : 0, member.created_at, member.updated_at]
		);
		}

		for (const receipt of receipts) {
			db.runSync(
			`
				INSERT INTO receipts (
					id,
					title,
					group_id,
					payer_member_id,
					subtotal,
					tax,
					final_tip,
					service_charge,
					total,
					created_at,
					receipt_image_uri,
					sync_status,
					updated_at
				)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)
			`, [receipt.id, 
				receipt.title, 
				receipt.group_id, 
				receipt.payer_member_id,
				receipt.subtotal,
				receipt.tax,
				receipt.final_tip,
				receipt.service_charge,
				receipt.total,
				receipt.created_at,
				receipt.receipt_image_uri,
				receipt.updated_at
			]
		);
		}

		for (const item of items) {
			db.runSync(
			`
				INSERT INTO items (
					id,
					receipt_id,
					name,
					qty,
					unit_price,
					total_price,
					sync_status,
					created_at
				)
				VALUES (?, ?, ?, ?, ?, ?, 'synced', ?)
			`, [item.id, item.receipt_id, item.name, item.qty, item.unit_price, item.total_price, item.created_at]
		);
		}

		for (const item_assignment of item_assignments) {
			db.runSync(
			`
				INSERT INTO item_assignments(id, member_id, item_id, sync_status, created_at)
				VALUES (?, ?, ?, 'synced', ?)
			`, [item_assignment.id, item_assignment.item_id, item_assignment.member_id, item_assignment.created_at]
		);
		}

		for (const debt of debts) {
			db.runSync(
			`
				INSERT INTO debts(
					id,
					receipt_id,
					group_id,
					from_member_id,
					to_member_id,
					amount,
					sync_status,
					created_at
				)
				VALUES (?, ?, ?, ?, ?, ?, 'synced', ?)
			`, [debt.id, debt.receipt_id, debt.group_id, debt.from_member_id, debt.to_member_id, debt.amount, debt.created_at]
		);
		}

		for (const settlement of settlements) {
			db.runSync(
			`
				INSERT INTO settlements(
					id,
					group_id,
					from_member_id,
					to_member_id,
					amount,
					sync_status,
					created_at
				)
				VALUES (?, ?, ?, ?, ?, 'synced', ?)
			`, [settlement.id, settlement.group_id, settlement.from_member_id, settlement.to_member_id, settlement.amount, settlement.created_at]
		);
		}

		db.runSync(
			`
				INSERT INTO app_state(key, value)
				VALUES (?, ?)
				ON CONFLICT(key) DO UPDATE SET value = excluded.value
			`, ["initial_sync_completed", "true"]
		)
	})

	onProgress?.("complete");
}