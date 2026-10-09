import { ProfileDetails } from "@/types/item";
import { db } from "../db/database";
import { randomUUID } from "expo-crypto";

export function getProfileDetails(): ProfileDetails {

	const profile = db.getFirstSync<{email: string}>(`
		SELECT email
		FROM profile
	`);

	const receipt = db.getFirstSync<{
		totalSpent: number, 
		totalBillsScanned: number, 
		highestExpense: number 
	}>(`
		SELECT 
			COALESCE(SUM(total), 0) AS totalSpent,
			COUNT(*) AS totalBillsScanned,
			COALESCE(MAX(total), 0) AS highestExpense
		FROM receipts
	`);
	
	const groups = db.getFirstSync<{ totalGroups: number }>(`
		SELECT COUNT(*) AS totalGroups
		FROM groups
	`);

	// need to change min uuid, add user_id column to members
	const debts = db.getFirstSync<{ pendingBalance: number }>(`
		WITH self_members AS (
			SELECT group_id, MIN(id) AS self_id
			FROM members
			GROUP BY group_id
		)
			
		SELECT 
			COALESCE(
				SUM(
					CASE
						WHEN d.to_member_id = sm.self_id
						THEN d.amount

						WHEN d.from_member_id = sm.self_id
						THEN -(d.amount)

						ELSE 0
					END
				), 0
			) 
			+
			COALESCE(
				(
					SELECT SUM(
						CASE
							WHEN s.from_member_id = sm.self_id
							THEN s.amount

							WHEN s.to_member_id = sm.self_id
							THEN -(s.amount)

							ELSE 0
						END
					)
					FROM settlements s
					WHERE s.group_id = sm.group_id
				), 0
			) AS pendingBalance
		FROM debts d
		JOIN self_members sm
			ON sm.group_id = d.group_id
	`);

	const activeGroup = db.getFirstSync<{ name: string }>(`
		SELECT g.name AS name
		FROM receipts r
		JOIN groups g ON g.id = r.group_id
		GROUP BY r.group_id
		ORDER BY COUNT(r.group_id) DESC
		LIMIT 1
	`);

	const recentActivity = db.getFirstSync<{ date: string }>(`
		SELECT created_at as date
		FROM receipts
		ORDER BY created_at DESC
		LIMIT 1	
	`);

	return {
		email: profile?.email ?? "0",
		totalSpent: receipt?.totalSpent ?? 0,
		totalGroups: groups?.totalGroups ?? 0,
		totalBillsScanned: receipt?.totalBillsScanned ?? 0,
		pendingBalance: debts?.pendingBalance ?? 0,
		activeGroup: activeGroup?.name ?? "No Activity",
		highestExpense: receipt?.highestExpense ?? 0,
		recentActivity: recentActivity?.date ?? ""
	}
}

export function resetAppData() {
	console.log("App Data Reset.");
	db.withTransactionSync(() => {
		const groups = db.getAllSync<{ id: string }>(
			`
			SELECT id FROM groups
			`
		);

		for (const group of groups) {
			db.runSync(
				`
				INSERT INTO sync_deletions (id, table_name, record_id)
				VALUES (?, ?, ?)
				`,
				[randomUUID(), 'groups', group.id]
			);
		}

		db.runSync(`DELETE FROM groups;`)
	});
}

export function deleteLocalData() {
	db.withTransactionSync(() => {
		db.runSync(`DELETE FROM groups;`);
		db.runSync(`DELETE FROM sync_deletions;`);
		db.runSync(`DELETE FROM app_state;`);
		db.runSync(`DELETE FROM profile;`);
	});
}