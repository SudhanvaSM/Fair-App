import { SimplifiedBalances } from "@/types/item";
import { getMemberBalances } from "./getMemberBalances";

export function simplifyBalances(groupId: string) {
	const balances = getMemberBalances(groupId);
	
		const debtors = balances.filter(member => (member.balance < 0))
								.map(member => ({
									...member,
									balance: -member.balance
								}));
	
		const creditors = balances.filter(member => (member.balance > 0));

		const simplifiedBalances: SimplifiedBalances[] = [];

		let i = 0, j = 0;

		while (i < debtors.length && j < creditors.length) {
			const debtor = debtors[i];
			const creditor = creditors[j];

			const amount = Math.min(debtor.balance, creditor.balance);

			simplifiedBalances.push({
				fromMemberId: debtor.memberId,
				toMemberId: creditor.memberId,
				amount,
			});

			debtor.balance -= amount;
			creditor.balance -= amount;

			if (debtor.balance === 0) i++;
			if (creditor.balance === 0) j++; 
		}
		
		return simplifiedBalances;
}