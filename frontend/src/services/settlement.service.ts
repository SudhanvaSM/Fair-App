import { randomUUID } from "expo-crypto";
import { db } from "../db/database";

export function getGroupSettlements(groupId: string) {
	return db.getAllSync<{
		fromMemberId: string;
		toMemberId: string;
		amount: number;
	}>(`
		SELECT 
			from_member_id AS fromMemberId,
			to_member_id AS toMemberId,
			amount AS amount
		FROM settlements
		WHERE group_id = ?
	`, [groupId]);
}

export function insertSettlement(
	groupId: string, fromMemberId: string, toMemberId: string, amount: number
) {
	db.runSync(`
		INSERT INTO settlements(
			id,
			group_id,
			from_member_id,
			to_member_id,
			amount,
			sync_status,
			created_at
		)
		VALUES(?, ?, ?, ?, ?, ?, ?)
	`, [randomUUID(), groupId, fromMemberId, toMemberId, amount, "not_synced", new Date().toISOString()])
}