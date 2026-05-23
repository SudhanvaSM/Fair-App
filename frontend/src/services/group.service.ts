import { db } from "../db/database";
import { DebtDetails, DetailedGroup, Group, GroupDraft, GroupSummary, GroupSummaryRow, Member, Receipt } from "@/types/item";
import { createMember } from "./member.service";

export function createGroupWithMembers (group: GroupDraft) {
	let groupId = -1;
	db.withTransactionSync(() => {

    const groupResult = db.runSync(
      `
      INSERT INTO groups (name)
      VALUES (?)
      `,
      [group.name]
    );

    groupId = Number(groupResult.lastInsertRowId);

    for (const memberName of group.members) {
    	createMember(groupId, memberName)
    }
  });
  return groupId;
}

export function getGroupsWithMembers(): GroupSummary[] {
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
			totalExpenses: 0
		};
	});
}

export function getGroupSummary(): GroupSummary[] {
	const result = db.getAllSync<GroupSummaryRow>(`
		SELECT 
			g.id AS id,
			g.name AS name,
			COALESCE(
				GROUP_CONCAT(DISTINCT m.name),
				''
			) AS members,

			COALESCE(
				(
					SELECT sum(r.total)
					FROM receipts r
					WHERE r.group_id = g.id
				),
				0
			) AS totalExpenses,
			0 AS netBalance

			FROM groups g
			LEFT JOIN members m ON m.group_id = g.id
			GROUP BY g.id
			ORDER BY g.created_at DESC
	`);

	return result.map(group => ({
		...group,
		members: group.members ? group.members.split(',') : []
	}));
}

export function getDetailedGroup(groupId: number): DetailedGroup {
	const group = db.getFirstSync<Group>(`
		SELECT id, name, created_at AS createdAt
		FROM groups
		WHERE id = ?	
	`, [groupId]);
	if (!group) {
		throw new Error("Group not found");
	}

	const members = db.getAllSync<Member>(`
		SELECT id, group_id AS groupId, name
		FROM members
		WHERE group_id = ?
	`, [groupId]);


	const receipts = db.getAllSync<Receipt>(`
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
				total
			FROM receipts
			WHERE group_id = ?
			ORDER BY created_at DESC
	`, [groupId]);

	const debts = db.getAllSync<DebtDetails> (`
		SELECT 
			MIN(d.id) as id, 
			SUM(d.amount) as amount, 
			fm.id AS fromMemberId, 
			tm.id AS toMemberId,
			fm.name AS fromMember,
			tm.name AS toMember,
			d.status AS status
		FROM debts d
		JOIN members fm ON d.from_member_id = fm.id
		JOIN members tm ON d.to_member_id = tm.id
		WHERE 
			d.group_id = ?
		GROUP BY
			d.from_member_id,
			d.to_member_id,
			d.status
	`, [groupId]);

	const totalExpenses = db.getFirstSync<{ total: number }>(`
		SELECT COALESCE(SUM(total), 0) as total
		FROM receipts
		WHERE group_id = ?
	`, [groupId])?.total ?? 0;

	return {
		group,
		members,
		receipts,
		debts,
		totalExpenses,
	}
}

export function getLatestDate(groupId: number) {
	const result = db.getFirstSync<{ date: Date }>(`
		SELECT created_at as date
		FROM receipts
		WHERE group_id = ?
		ORDER BY created_at DESC
		LIMIT 1
	`, [groupId]);

	if (!result) {
		return "";
	}
	return result.date;
}

export function getGroupName(groupId: number) {
	const result = db.getFirstSync<{ title: string }>(`
		SELECT name AS title
		FROM groups
		WHERE id = ?
	`, [groupId]);

	if (!result) {
		return "";
	}
	return result.title;
}

export function changeGroupName(groupId: number, groupName: string) {
	db.runSync(`
		UPDATE groups
		SET name = ?
		WHERE id = ?
	`, [groupName, groupId]);
}

export function deleteGroup(groupId: number) {
	return db.runSync(`
		DELETE FROM groups
		WHERE id = ?
	`, [groupId]);
}