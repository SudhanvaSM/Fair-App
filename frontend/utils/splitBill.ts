import { ParsedData, Assignments } from "@/types/item";

export function splitBill(parsedData: ParsedData, assignments: Assignments, includeServiceCharge: boolean) {
  const personSubtotals: Record<string, number> = {};

  // 🧾 STEP 1: Split item costs
  for (const item of parsedData.items) {
    const { item_id, total_price } = item;
    const assignment = assignments[item_id];

    if (!assignment) {
      throw new Error(`Missing assignment for item ${item_id}`);
    }

    // 🔹 Equal split
    if (assignment.type === "equal" && Array.isArray(assignment.users)) {
      const users = assignment.users;

      if (users.length === 0) {
        throw new Error(`No users for item ${item_id}`);
      }

      const splitAmount = total_price / users.length;

      for (const user of users) {
        personSubtotals[user] =
          (personSubtotals[user] || 0) + splitAmount;
      }
    }

    // 🔹 Weighted split (future support)
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
          (users[user] / totalWeight) * total_price;

        personSubtotals[user] =
          (personSubtotals[user] || 0) + share;
      }
    }
  }

  // 🧾 STEP 2: Add tax + extras proportionally
  const {
    subtotal,
    tax,
    service_charge = 0,
    rounding = 0,
    total,
  } = parsedData;

  const totalExtra = tax + rounding + (includeServiceCharge ? service_charge : 0);

  const personTotalsExact: Record<string, number> = {};

  for (const person in personSubtotals) {
    const sub = personSubtotals[person];

    const shareRatio = subtotal > 0 ? sub / subtotal : 0;

    const exactTotal = sub + shareRatio * totalExtra;

    personTotalsExact[person] = exactTotal;
  }

  // 🧾 STEP 3: Round values
  const personTotals: Record<string, number> = {};

  for (const person in personTotalsExact) {
    personTotals[person] = Number(
      personTotalsExact[person].toFixed(2)
    );
  }

  // 🧾 STEP 4: Fix rounding mismatch
  const currentSum = Object.values(personTotals).reduce(
    (a, b) => a + b,
    0
  );

  const diff = Number((total - currentSum).toFixed(2));

  if (diff !== 0) {
    const highest = Object.keys(personSubtotals).reduce((a, b) =>
      personSubtotals[a] > personSubtotals[b] ? a : b
    );

    personTotals[highest] = Number(
      (personTotals[highest] + diff).toFixed(2)
    );
  }

  // 🧾 STEP 5: Final validation
  const finalSum = Object.values(personTotals).reduce(
    (a, b) => a + b,
    0
  );

  if (
    Number(finalSum.toFixed(2)) !== Number(total.toFixed(2))
  ) {
    throw new Error("Split mismatch: totals do not add up");
  }

  return {
    perPerson: personTotals,        // ✅ what user pays
    breakdown: personSubtotals,     // 🔹 subtotal only (optional UI)
  };
}