import { MemberBalance } from "@/types/item";
import { db } from "../db/database";

export function createMember(
	groupId: number,
	memberName: string
) {
	const result = db.runSync(
		`
		INSERT INTO members (group_id, name)
		VALUES (?, ?)
		`,
		[groupId, memberName]
	);

	return Number(result.lastInsertRowId);
}

export function getMembersByGroupId(groupId: number) {
	return db.getAllSync<{
		id: number;
		name: string;
	}>
	(`
		SELECT id, name
		FROM members
		WHERE group_id = ?
	`, [groupId]
	);
}

export function getMemberName(memberId: number) {
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

export function getMemberBalances(groupId: number): MemberBalance[] {
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