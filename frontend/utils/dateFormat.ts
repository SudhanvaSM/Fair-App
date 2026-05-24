export default function DateFormat(createdAt: string) {
	if (createdAt === "") return "No Activity";
	
	const receiptDate = new Date(createdAt);
	const today = new Date();
	let date;
	if (receiptDate.toDateString() === today.toDateString()) date = "Today"
	else {
		const yesterday = new Date(today.getDate() - 1);
		if (receiptDate.toDateString() === yesterday.toDateString()) date = "Yesterday";
		else date = receiptDate.toLocaleDateString([], { day: "2-digit", month: "short" });
	}
	return date;
}