import {  randomUUID } from "expo-crypto";
import { db } from "../db/database";
import { AssignmentList, DebtDetails, Item, Receipt, RecentSplit } from "@/types/item";

export function createReceipt (data: Receipt) {
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
				created_at,
				total,
				receipt_image_uri
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`,
		[
			data.id,
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
}

export function createReceiptItem(item: Item, receipt_id: string) {
	const itemId = randomUUID();
	db.runSync(
		`
			INSERT INTO items (
				id, 
				receipt_id,
				name,
				qty,
				unit_price,
				total_price
			)
			VALUES (?, ?, ?, ?, ?, ?)
		`,
		[
			itemId,
			receipt_id,
			item.name,
			item.qty,
			item.unitPrice,
			item.totalPrice
		]
	);

	return itemId;
}

export function createItemAssignment(
	itemId: string,
	memberId: string
) {
	const itemAssignmentId = randomUUID();
	db.runSync(`
		INSERT INTO item_assignments (
			id, 
			item_id,
			member_id
		)	
		VALUES (?, ?, ?)
	`, [itemAssignmentId, itemId, memberId]);

	return itemAssignmentId;
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

export function getDetailedReceipt(receiptId: string): Receipt {
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

export function getItemsList (receiptId: string): Item[] {
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

export function getDebtsList (receiptId: string): DebtDetails[] {
	const debts = db.getAllSync<DebtDetails>(`
		SELECT
			d.id AS id,
			d.amount AS amount,
			from_member.id AS fromMemberId,
			from_member.name AS fromMember,
			to_member.name AS toMember,
			to_member.id AS toMemberId,
			d.status AS status
		FROM debts d

		JOIN members from_member
			ON d.from_member_id = from_member.id

		JOIN members to_member
			ON d.to_member_id = to_member.id

		WHERE d.receipt_id = ?	
	`, [receiptId]);

	return debts;
}

export function getAssignmentsList (receiptId: string): AssignmentList[] {
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

export function clearReceipt(receiptId: string) {
    db.withTransactionSync(() => {
        db.runSync(
            `
            DELETE FROM receipts
            WHERE id = ?
            `,
            [receiptId]
        );

        db.runSync(
            `
            INSERT INTO sync_deletions (id, table_name, record_id)
            VALUES (?, ?, ?)
            `,
            [randomUUID(), 'receipts', receiptId]
        );
    });
}

export function clearReceiptHistory() {
    db.withTransactionSync(() => {
		const receipts = db.getAllSync<{ id: string }>(
            `
            SELECT id FROM receipts
            `
        );

        for (const receipt of receipts) {
			db.runSync(
            `
            INSERT INTO sync_deletions (id, table_name, record_id)
            VALUES (?, ?, ?)
            `,
            [randomUUID(), 'receipts', receipt.id]
        );
		}

		db.runSync(`DELETE FROM receipts`)
    });
}

export function getReceiptTitle() {
	return db.execSync(`
		SELECT title
		FROM receipts
		WHERE id = 2
	`)
}

export function changeReceiptTitle(receiptId: string, updatedTitle: string) {
	db.runAsync(`
		UPDATE receipts
		SET title = ?, sync_status = ?, updated_at = ?
		WHERE id = ?
	`, [updatedTitle, "not_synced", new Date().toISOString(), receiptId]);
}
