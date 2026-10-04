import { MemberBalance } from "@/types/item";
import { db } from "../db/database";
import { randomUUID } from "expo-crypto";

export function createMember(
	groupId: string,
	memberName: string
) {
	const memberId = randomUUID();
	db.runSync(
		`
		INSERT INTO members (id, group_id, name)
		VALUES (?, ?, ?)
		`,
		[memberId, groupId, memberName]
	);

	return memberId;
}

export function getMembersByGroupId(groupId: string) {
	return db.getAllSync<{
		id: string;
		name: string;
	}>
	(`
		SELECT id, name
		FROM members
		WHERE group_id = ?
	`, [groupId]
	);
}

export function getMemberName(memberId: string) {
	const memberName = db.getFirstSync<{ name: string }>(`
		SELECT m.name
		FROM members m
		WHERE m.id = ?
	`, [memberId]);

	if (!memberName) {
		throw new Error("Member not found!");
	}
	return memberName;
}

export function getMemberBalances(groupId: string): MemberBalance[] {
	return db.getAllSync<MemberBalance>(`
		SELECT 
			m.id as memberId, 
			m.name as name,
			COALESCE(
				(
					SELECT sum(d.amount)
					FROM debts d
					WHERE d.to_member_id = m.id
					AND d.status = 'pending'
				), 0
			)
				-
			COALESCE(
				(
					SELECT sum(d.amount)
					FROM debts d
					WHERE d.from_member_id = m.id
					AND d.status = 'pending'
				), 0
			)
				AS balance
			FROM members m
			WHERE m.group_id = ?
	`, [groupId]);
}