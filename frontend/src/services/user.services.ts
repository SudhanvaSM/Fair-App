import { ProfileDetails } from "@/types/item";
import { db } from "../db/database";

export function getProfileDetails(): ProfileDetails {
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

	const debts = db.getFirstSync<{ 
		pendingBalance: number,
		pending: number,
		settled: number
	}>(`
		SELECT 
			COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pendingBalance,
			COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS pending,
			COALESCE(SUM(CASE WHEN status = 'settled' THEN 1 ELSE 0 END), 0) AS settled
		FROM debts
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
		totalSpent: receipt?.totalSpent ?? 0,
		totalGroups: groups?.totalGroups ?? 0,
		totalBillsScanned: receipt?.totalBillsScanned ?? 0,
		pendingBalance: debts?.pendingBalance ?? 0,
		pendingCount: debts?.pending ?? 0,
		settledCount: debts?.settled ?? 0,
		activeGroup: activeGroup?.name ?? "No Activity",
		highestExpense: receipt?.highestExpense ?? 0,
		recentActivity: recentActivity?.date ?? ""
	}
}

export function resetAppData() {
	console.log("App Data Reset.");
	db.execSync(`
		DELETE FROM groups;
	`)
}