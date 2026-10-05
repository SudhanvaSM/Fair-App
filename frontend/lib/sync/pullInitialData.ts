import { db } from "@/src/db/database";
import fetchDebts from "./pull/fetchDebts";
import fetchGroups from "./pull/fetchGroups";
import fetchItemAssignments from "./pull/fetchItemAssignments";
import fetchItems from "./pull/fetchItems";
import fetchMembers from "./pull/fetchMembers";
import fetchReceipts from "./pull/fetchReceipts";

export default async function pullInitialData() {
	const groups = await fetchGroups();
	const members = await fetchMembers();
	const receipts = await fetchReceipts();
	const items = await fetchItems();
	const item_assignments = await fetchItemAssignments();
	const debts = await fetchDebts();

	db.withTransactionSync(() => {
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
				VALUES (?, ?, ?, ?, 'synced', ?)
			`, [member.id, member.group_id, member.name, member.active ? 1 : 0, member.updated_at]
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
			`, [item.id, item.receipt_id, item.name, item.qty, item.unit_price, item.total_price, item.updated_at]
		);
		}

		for (const item_assignment of item_assignments) {
			db.runSync(
			`
				INSERT INTO item_assignments
				VALUES (?, ?, ?, 'synced', ?)
			`, [item_assignment.id, item_assignment.item_id, item_assignment.member_id, item_assignment.updated_at]
		);
		}

		for (const debt of debts) {
			db.runSync(
			`
				INSERT INTO debts
				VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?)
			`, [debt.id, debt.receipt_id, debt.group_id, debt.from_member_id, debt.to_member_id, debt.amount, debt.status, debt.updated_at]
		);
		}
	})
}