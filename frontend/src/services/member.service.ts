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
		memberId: string;
		name: string;
	}>
	(`
		SELECT id AS memberId, name
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
