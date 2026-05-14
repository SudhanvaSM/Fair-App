import { db } from "../db/database";
import { Debt } from "@/types/item";

export function createDebt (data: Debt) {
	const result = db.runSync(
		`
			INSERT INTO debts (
				receipt_id,
				group_id,
				from_member_id,
				to_member_id,
				amount,
				status
			)
			VALUES (?, ?, ?, ?, ?, 'pending')
		`,
		[
			data.receiptId,
			data.groupId,
			data.fromMemberId,
			data.toMemberId,
			data.amount,
		]
	);

	return result.lastInsertRowId;
}