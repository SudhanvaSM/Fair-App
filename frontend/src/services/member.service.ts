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
	return db.getFirstSync<{ name: String }>(`
		SELECT m.name
		FROM members m
		WHERE m.id = ?
	`, [memberId]);
}