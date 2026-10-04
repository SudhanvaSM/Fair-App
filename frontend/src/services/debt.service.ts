import { randomUUID } from "expo-crypto";
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
				amount,
				status
			)
			VALUES (?, ?, ?, ?, ?, ?, 'pending')
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
		SET status = ?
		WHERE
			group_id = ?
			AND from_member_id = ?
			AND to_member_id = ?
	`, [
		status,
		groupId,
		fromMemberId,
		toMemberId
	]);
}