import { db } from "@/src/db/database";
import { SyncStep } from "@/types/item";
import { supabase } from "@/lib/supabase";

async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("No authenticated user");
    }

    const { data, error } = await supabase
        .from("profiles")
        .select(`*`)
        .eq("id", user.id)
        .single();

    if (error) {
        throw error;
    }

    return data;
}

async function fetchGroups() {
	const { data, error } = await supabase
		.from('groups')
		.select(`
			id,
			name,
			created_at,
			updated_at
		`);

	if (error) {
		throw error;
	}
	return data;
}

async function fetchMembers() {
	const { data, error } = await supabase
		.from('members')
		.select(`
			id,
			group_id,
			name,
			active,
			user_id,
			created_at,
			updated_at
		`);

	if (error) {
		throw error;
	}
	return data;
}

async function fetchReceipts() {
	const { data, error } = await supabase
		.from('receipts')
		.select(`
			id,
			title,
			group_id,
			payer_member_id,
			subtotal,
			tax,
			final_tip,
			service_charge,
			total,
			created_at,
			updated_at
		`);

	if (error) {
		throw error;
	}
	return data;
}

async function fetchItems() {
	const { data, error } = await supabase
		.from('items')
		.select(`
			id,
			receipt_id,
			name,
			qty,
			unit_price,
			total_price,
			created_at
		`);

	if (error) {
		throw error;
	}
	return data;
}

async function fetchItemAssignments() {
	const { data, error } = await supabase
		.from('item_assignments')
		.select(`
			id,
			member_id,
			item_id,
			created_at
		`);

	if (error) {
		throw error;
	}
	return data;
}

async function fetchDebts() {
	const { data, error } = await supabase
		.from('debts')
		.select(`
			id,
			receipt_id,
			group_id,
			from_member_id,
			to_member_id,
			amount,
			created_at
		`);

	if (error) {
		throw error;
	}
	return data;
}

async function fetchSettlements() {
	const { data, error } = await supabase
		.from('settlements')
		.select(`
			id,
			group_id,
			from_member_id,
			to_member_id,
			amount,
			created_at
		`);

	if (error) {
		throw error;
	}
	return data;
}

export default async function pullInitialData(onProgress?: (step: SyncStep) => void) {
	onProgress?.("profile");
	const profile = await fetchProfile();
	// console.log("Profile fetched");

	onProgress?.("groups");
	const groups = await fetchGroups();
	// console.log("groups fetched");

	onProgress?.("members");
	const members = await fetchMembers();
	// console.log("members fetched");

	onProgress?.("receipts");
	const receipts = await fetchReceipts();
	// console.log("receipts fetched");

	onProgress?.("items");
	const items = await fetchItems();
	// console.log("items fetched");

	onProgress?.("assignments");
	const item_assignments = await fetchItemAssignments();
	// console.log("assignments fetched");

	onProgress?.("debts");
	const debts = await fetchDebts();
	// console.log("debts fetched");

	onProgress?.("settlements");
	const settlements = await fetchSettlements();
	// console.log("settlements fetched");

	db.withTransactionSync(() => {
		db.runSync(
			`
				INSERT INTO profile(user_id, name, created_at)
				VALUES (?, ?, ?)
				ON CONFLICT(user_id) DO UPDATE SET
					name = excluded.name
			`, [profile.id, profile.name, profile.created_at]
		);

		for (const group of groups) {
			db.runSync(
			`
				INSERT INTO groups(
								id,
								name,
								created_at,
								sync_status,
								updated_at
							)
				VALUES (?, ?, ?, 'synced', ?)
			`, [group.id, group.name, group.created_at, group.updated_at]
		);
		}

		for (const member of members) {
			db.runSync(
			`
				INSERT INTO members (id, group_id, name, active, user_id, sync_status, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, 'synced', ?, ?)
			`, [member.id, member.group_id, member.name, member.active ? 1 : 0, member.user_id, member.created_at, member.updated_at]
		);
		}

		for (const receipt of receipts) {
			db.runSync(
			`
				INSERT INTO receipts (
					id,
					title,
					group_id,
					payer_member_id,
					subtotal,
					tax,
					final_tip,
					service_charge,
					total,
					created_at,
					sync_status,
					updated_at
				)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)
			`, [receipt.id, 
				receipt.title, 
				receipt.group_id, 
				receipt.payer_member_id,
				receipt.subtotal,
				receipt.tax,
				receipt.final_tip,
				receipt.service_charge,
				receipt.total,
				receipt.created_at,
				receipt.updated_at
			]
		);
		}

		for (const item of items) {
			db.runSync(
			`
				INSERT INTO items (
					id,
					receipt_id,
					name,
					qty,
					unit_price,
					total_price,
					sync_status,
					created_at
				)
				VALUES (?, ?, ?, ?, ?, ?, 'synced', ?)
			`, [item.id, item.receipt_id, item.name, item.qty, item.unit_price, item.total_price, item.created_at]
		);
		}

		for (const item_assignment of item_assignments) {
			db.runSync(
			`
				INSERT INTO item_assignments(id, member_id, item_id, sync_status, created_at)
				VALUES (?, ?, ?, 'synced', ?)
			`, [item_assignment.id, item_assignment.member_id, item_assignment.item_id, item_assignment.created_at]
		);
		}

		for (const debt of debts) {
			db.runSync(
			`
				INSERT INTO debts(
					id,
					receipt_id,
					group_id,
					from_member_id,
					to_member_id,
					amount,
					sync_status,
					created_at
				)
				VALUES (?, ?, ?, ?, ?, ?, 'synced', ?)
			`, [debt.id, debt.receipt_id, debt.group_id, debt.from_member_id, debt.to_member_id, debt.amount, debt.created_at]
		);
		}

		for (const settlement of settlements) {
			db.runSync(
			`
				INSERT INTO settlements(
					id,
					group_id,
					from_member_id,
					to_member_id,
					amount,
					sync_status,
					created_at
				)
				VALUES (?, ?, ?, ?, ?, 'synced', ?)
			`, [settlement.id, settlement.group_id, settlement.from_member_id, settlement.to_member_id, settlement.amount, settlement.created_at]
		);
		}

		db.runSync(
			`
				INSERT INTO app_state(key, value)
				VALUES (?, ?)
				ON CONFLICT(key) DO UPDATE SET value = excluded.value
			`, ["initial_sync_completed", "true"]
		)
	})

	onProgress?.("complete");
}