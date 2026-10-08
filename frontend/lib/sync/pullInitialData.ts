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
				INSERT OR REPLACE INTO profile
				VALUES (?, ?, ?)
				ON CONFLICT(user_id) DO UPDATE SET
        			email = excluded.email
			`, [profile.id, profile.email, profile.created_at]
		);

		for (const group of groups) {
			db.runSync(
			`
				INSERT INTO groups
				VALUES (?, ?, ?, 'synced', ?)
			`, [group.id, group.name, group.created_at, group.updated_at]
		);
		}

		for (const member of members) {
			db.runSync(
			`
				INSERT INTO members
				VALUES (?, ?, ?, ?, 'synced', ?, ?)
			`, [member.id, member.group_id, member.name, member.active ? 1 : 0, member.created_at, member.updated_at]
		);
		}

		for (const receipt of receipts) {
			db.runSync(
			`
				INSERT INTO receipts
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
				INSERT INTO items
				VALUES (?, ?, ?, ?, ?, ?, 'synced', ?)
			`, [item.id, item.receipt_id, item.name, item.qty, item.unit_price, item.total_price, item.created_at]
		);
		}

		for (const item_assignment of item_assignments) {
			db.runSync(
			`
				INSERT INTO item_assignments
				VALUES (?, ?, ?, 'synced', ?)
			`, [item_assignment.id, item_assignment.item_id, item_assignment.member_id, item_assignment.created_at]
		);
		}

		for (const debt of debts) {
			db.runSync(
			`
				INSERT INTO debts
				VALUES (?, ?, ?, ?, ?, ?, 'synced', ?)
			`, [debt.id, debt.receipt_id, debt.group_id, debt.from_member_id, debt.to_member_id, debt.amount, debt.created_at]
		);
		}

		for (const settlement of settlements) {
			db.runSync(
			`
				INSERT INTO settlements
				VALUES (?, ?, ?, ?, ?, 'synced', ?)
			`, [settlement.id, settlement.group_id, settlement.from_member_id, settlement.to_member_id, settlement.amount, settlement.created_at]
		);
		}

		db.runSync(
			`
				INSERT INTO app_state
				VALUES (?, ?)
				ON CONFLICT(key) DO UPDATE SET value = excluded.value
			`, ["initial_sync_completed", "true"]
		)
	})

	onProgress?.("complete");
}