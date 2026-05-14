import { db } from "../db/database";
import { GroupDraft } from "@/types/item";
import { createMember } from "./member.service";

export function createGroupWithMembers (group: GroupDraft) {
	let groupId = -1;
	db.withTransactionSync(() => {

    // Insert group
    const groupResult = db.runSync(
      `
      INSERT INTO groups (name)
      VALUES (?)
      `,
      [group.name]
    );

    groupId = Number(groupResult.lastInsertRowId);

    // Insert members
    for (const memberName of group.members) {
    	createMember(groupId, memberName)
    }
  });
  return groupId;
}

export function getGroupsWithMembers(): GroupDraft[] {
	const groups = db.getAllSync<{
		id: number;
		name: string;
	}>
	(`
		SELECT id, name
		FROM groups
		ORDER BY created_at DESC	
	`);

	return groups.map((group) => {
		const members = db.getAllSync<{
			name: string;
		}>
		(`
			SELECT name
			FROM members
			WHERE group_id = ?
		`,
		[group.id]
		);
		return {
			id: group.id,
			name: group.name,
			members: members.map((m) => m.name),
		};
	});
}

export function getGroupById(groupId: number) {
	const group = db.getFirstSync<{
		id: number;
		name: string;
	}>
	(`
		SELECT id, name
		FROM groups
		WHERE id = ?
	`, [groupId]);
	return group;
}

export function getGroupExpenses(groupId: number) {
	return db.getFirstSync<{ total: number }>(`
		SELECT COALESCE(SUM(total), 0) AS total
		FROM receipts
		WHERE group_id = ?
	`, [groupId]);
}

export function getAmountYouAreOwed(groupId: number) {
	return db.getFirstSync<{ amount: number }>(`
		SELECT COALESCE(SUM(amount - settled_amount), 0) AS amount
		FROM debts
		WHERE to_member_id = ?
		AND status = 'pending'
	`, [groupId]);
}