import { DebtDetails, Item, Receipt } from "@/types/item";

export default function genereteReceiptSummary(
	receipt: Receipt, 
	debts: DebtDetails[], 
	items: Item[],
	groupTitle: string,
	payer: string
) {
	const group = groupTitle;
	const date = new Date(receipt.createdAt).toLocaleDateString([], { day:"2-digit", month: "long", year: "numeric" });
	const receiptName = receipt.title;
	const subTotal = (receipt.subtotal).toFixed(2);
	const tax = (receipt.tax).toFixed(2);
	const serviceCharge = receipt.serviceCharge > 0 ? `Service Charge: ₹${receipt.serviceCharge.toFixed(2)}\n` : "";
	const tip = receipt.finalTip > 0 ? `Tips: ₹${receipt.finalTip.toFixed(2)}\n` : "";
	const total = (receipt.total).toFixed(2);
	const payerName = payer;

	return `FAIR Split Summary

Group: ${group}
Date: ${date}
Receipt Title: ${receiptName}

Items:
${items.map((item: Item) => 
	`• ${item.qty} x ${item.name} - ₹${item.totalPrice.toFixed(2)}`
).join("\n")}

Subtotal: ₹${subTotal}
Tax: ₹${tax}
${serviceCharge}${tip}Total: ₹${total}

Balances:
${debts.map((debt: DebtDetails) => 
	`• ${debt.fromMember} ${debt.fromMember === "You" ? "owe" : "owes" } ${debt.toMember} ₹${debt.amount.toFixed(2)}`
).join("\n")}

Paid By: ${payerName}`;
}