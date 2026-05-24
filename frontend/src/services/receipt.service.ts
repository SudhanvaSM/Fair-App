import { db } from "../db/database";
import { AssignmentList, DebtDetails, Item, Receipt, RecentSplit } from "@/types/item";

export function createReceipt (data: Receipt) {
	const result = db.runSync(
		`
			INSERT INTO receipts (
				title,
				group_id,
				payer_member_id,
				subtotal,
				tax,
				final_tip,
				service_charge,
				created_at,
				total,
				receipt_image_uri
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`,
		[
			data.title,
			data.groupId,
			data.payerMemberId,
			data.subtotal,
			data.tax,
			data.finalTip,
			data.serviceCharge,
			data.createdAt,
			data.total,
			data.imageUri,
		]
	);

	return result.lastInsertRowId;
}

export function createReceiptItem(item: Item, receipt_id: number) {
	const result = db.runSync(
		`
			INSERT INTO items (
				receipt_id,
				name,
				qty,
				unit_price,
				total_price
			)
			VALUES (?, ?, ?, ?, ?)
		`,
		[
			receipt_id,
			item.name,
			item.qty,
			item.unitPrice,
			item.totalPrice
		]
	);

	return result.lastInsertRowId;
}

export function createItemAssignment(
	itemId: number,
	memberId: number
) {
	const result = db.runSync(`
		INSERT INTO item_assignments (
			item_id,
			member_id
		)	
		VALUES (?, ?)
	`, [itemId, memberId]);

	return result;
}

export function getRecentReceipts(limit?: number): RecentSplit[] {
	const result = db.getAllSync<RecentSplit>
	(`
			SELECT 
				r.id AS id, 
				g.id AS groupID,
				r.title AS title, 
				count(DISTINCT m.id) AS people, 
				r.created_at AS date, 
				r.total AS price
			FROM receipts r
			JOIN groups g ON r.group_id = g.id
			JOIN members m ON m.group_id = g.id
			GROUP BY r.id, g.name, r.created_at, r.total
			ORDER BY r.created_at DESC
			LIMIT ?
	`,[limit ? limit : 10]);

	return result;
}

export function getDetailedReceipt(receiptId: number): Receipt {
	const receipt = db.getFirstSync<Receipt>(
		`
		SELECT 
			id,
			title,
			group_id as groupId,
			payer_member_id AS payerMemberId,
			subtotal,
			tax,
			final_tip AS finalTip,
			service_charge AS serviceCharge,
			created_at AS createdAt,
			total,
			receipt_image_uri as imageUri
		FROM receipts
		WHERE id = ?
		`,
		[receiptId]
	);

	if (!receipt) {
		throw new Error(`Receipt ${receiptId} not found`);
	}

	return receipt;
}

export function getItemsList (receiptId: number): Item[] {
	const items = db.getAllSync<Item>(`
		SELECT 
			id AS itemId,
			name,
			qty,
			unit_price AS unitPrice,
			total_price AS totalPrice
		FROM items
		WHERE receipt_id = ?	
	`, [receiptId]);

	return items;
}

export function getDebtsList (receiptId: number): DebtDetails[] {
	const debts = db.getAllSync<DebtDetails>(`
		SELECT
			d.id AS id,
			d.amount AS amount,
			from_member.id AS fromMemberId,
			from_member.name AS fromMember,
			to_member.name AS toMember,
			to_member.id AS toMemberId
		FROM debts d

		JOIN members from_member
			ON d.from_member_id = from_member.id

		JOIN members to_member
			ON d.to_member_id = to_member.id

		WHERE d.receipt_id = ?	
	`, [receiptId]);

	return debts;
}

export function getAssignmentsList (receiptId: number): AssignmentList[] {
	const assignments = db.getAllSync<AssignmentList>(`
		SELECT
			i.id AS itemId,
			i.name,
			m.name AS memberName
		FROM item_assignments ia

		JOIN items i
			ON ia.item_id = i.id

		JOIN members m
			ON ia.member_id = m.id

		WHERE i.receipt_id = ?
	`, [receiptId]);

	return assignments;
}

export function clearReceipt(receiptId: number) {
	db.runSync(`
		DELETE FROM receipts
		WHERE id = ?
	`, [receiptId]);
}

export function clearReceiptHistory() {
	db.execSync(`
		DELETE FROM item_assignments;
		DELETE FROM debts;
		DELETE FROM items;
		DELETE FROM receipts;
	`);
}

export function getReceiptTitle() {
	return db.execSync(`
		SELECT title
		FROM receipts
		WHERE id = 2
	`)
}
