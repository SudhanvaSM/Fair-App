import { ParsedData, Assignments } from "@/types/item";

export function splitBill(parsedData: ParsedData, assignments: Assignments, includeServiceCharge: boolean) {
  	const personSubtotals: Record<string, number> = {};

  	// Split item costs
	for (const item of parsedData.items) {
		const { itemId, totalPrice } = item;
		const assignment = assignments[itemId];

		if (!assignment) {
			throw new Error(`Missing assignment for item ${itemId}`);
		}

		// Equal split
		if (assignment.type === "equal" && Array.isArray(assignment.users)) {
			const users = assignment.users;

			if (users.length === 0) {
				throw new Error(`No users for item ${itemId}`);
			}

			const splitAmount = totalPrice / users.length;

			for (const user of users) {
				personSubtotals[user] = (personSubtotals[user] || 0) + splitAmount;
			}
		}

		// Weighted Split
		else if (
			assignment.type === "weighted" &&
			!Array.isArray(assignment.users)
		) {
			const users = assignment.users;

			const totalWeight = Object.values(users).reduce(
				(a, b) => a + b,
				0
			);

			for (const user in users) {
				const share =
				(users[user] / totalWeight) * totalPrice;

				personSubtotals[user] =
				(personSubtotals[user] || 0) + share;
			}
		}
	}

	// Add tax + extras proportionally
	const {
		subtotal,
		tax,
		serviceCharge = 0,
		rounding = 0,
		finalTip = 0,
	} = parsedData;

	const totalExtra = tax + rounding + (includeServiceCharge ? serviceCharge : 0) + finalTip;

	const newTotal = subtotal + totalExtra;

	const personTotals: Record<string, number> = {};

	for (const person in personSubtotals) {
		const sub = personSubtotals[person];

		const shareRatio = subtotal > 0 ? sub / subtotal : 0;

		const exactTotal = sub + shareRatio * totalExtra;

		personTotals[person] = exactTotal;
	}

	// Round values
	for (const person in personTotals) {
		const roundedValue = Number(personTotals[person].toFixed(2));
		personTotals[person] = roundedValue;
	}

	// Fix rounding mismatch in total
	const currentSum = Object.values(personTotals).reduce((a, b) => a + b, 0);

	const diff = Number((newTotal - currentSum).toFixed(2));

	if (diff !== 0) {
		const highest = Object.keys(personSubtotals).reduce((a, b) =>
		personSubtotals[a] > personSubtotals[b] ? a : b
		);

		personTotals[highest] = Number(
		(personTotals[highest] + diff).toFixed(2)
		);
	}

	// Final validation
	const finalSum = Object.values(personTotals).reduce((a, b) => a + b, 0);

	if (Number(finalSum.toFixed(2)) !== Number(newTotal.toFixed(2))) {
		throw new Error("Split mismatch: totals do not add up");
	}

	return {
		perPerson: personTotals,
	};
}