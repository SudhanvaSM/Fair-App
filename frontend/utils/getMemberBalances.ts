import { getGroupDebts } from "@/src/services/debt.service";
import { getMembersByGroupId } from "@/src/services/member.service";
import { getGroupSettlements } from "@/src/services/settlement.service";

export function getMemberBalances(groupId: string) {
	const members = getMembersByGroupId(groupId);
	const debts = getGroupDebts(groupId);
	const settlements = getGroupSettlements(groupId);

	const balances = new Map<string, number>();

	for (const member of members) {
		balances.set(member.memberId, 0);
	}

	for (const debt of debts) {
		balances.set(
			debt.fromMemberId,
			balances.get(debt.fromMemberId)! - debt.amount
		);

		balances.set(
			debt.toMemberId,
			balances.get(debt.toMemberId)! + debt.amount
		);
	}

	for (const settlement of settlements) {
		balances.set(
			settlement.fromMemberId,
			balances.get(settlement.fromMemberId)! + settlement.amount
		);

		balances.set(
			settlement.toMemberId,
			balances.get(settlement.toMemberId)! - settlement.amount
		);
	}

	return members.map(member => ({
		memberId: member.memberId,
		name: member.name,
		balance: balances.get(member.memberId)!
	}))
}