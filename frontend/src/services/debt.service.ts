import { db } from "../db/database";
import { Debt } from "@/types/item";

export function createDebt (data: Debt) {
	db.runSync(
		`
			INSERT INTO debts (
				id,
				receipt_id,
				group_id,
				from_member_id,
				to_member_id,
				amount
			)
			VALUES (?, ?, ?, ?, ?, ?)
		`,
		[
			data.id,
			data.receiptId,
			data.groupId,
			data.fromMemberId,
			data.toMemberId,
			data.amount,
		]
	);
}

export function settleDebt(
	groupId: string,
	fromMemberId: string,
	toMemberId: string,
	status: "pending" | "settled"
) {
	db.runSync(`
		UPDATE debts
		SET status = ?, sync_status = ?, updated_at = ?
		WHERE
			group_id = ?
			AND from_member_id = ?
			AND to_member_id = ?
	`, [
		status,
		"not_synced",
		new Date().toISOString(),
		groupId,
		fromMemberId,
		toMemberId
	]);
}

export function getGroupDebts(groupId: string) {
	return db.getAllSync<{
		fromMemberId: string;
		toMemberId: string;
		amount: number;
	}>(`
		SELECT 
			from_member_id AS fromMemberId,
			to_member_id AS toMemberId,
			amount AS amount
		FROM debts
		WHERE group_id = ?
	`, [groupId]);
}