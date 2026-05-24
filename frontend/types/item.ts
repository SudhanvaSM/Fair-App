export type Item = {
	itemId: number;
	name: string;
	qty: number;
	unitPrice: number;
	totalPrice: number;
};

export type ItemPerPerson = {
	name: string;
	totalPrice: number;
	selectedPeople: string[];
}

export type ItemWithSelection = Item & {
  	selectedPeople: string[];
}

type Assignment = {
  	type: "equal" | "weighted";
  	users: string[] | Record<string, number>;
};

export type Assignments = Record<number, Assignment>;

export type ParsedData = {
  items: {
    itemId: number;
    totalPrice: number;
  }[];
  subtotal: number;
  tax: number;
  serviceCharge?: number;
  rounding?: number;
  finalTip?: number,
  total: number;
}

export type RecentSplit = {
	id: number;
	title: string;
	people: number;
	date: string;
	price: number;
}

export type Group = {
  	id: number;
  	name: string;
  	createdAt?: string;
}

export type Member = {
  	id: number;
  	groupId: number;
  	name: string;
}


export type Receipt = {
  	id?: number;
	title: string;
	groupId: number;
	payerMemberId: number;
	subtotal: number;
	tax: number;
	finalTip: number;
	serviceCharge: number;
	createdAt: string;
	total: number;
	imageUri: string;
}

export type Debt = {
	receiptId: number;
	groupId: number;
	fromMemberId: number;
	toMemberId: number;
	amount: number;
	status: "pending" | "settled";
}

export type DebtDetails = {
	id: number;
	amount: number;
	fromMember: string;
	toMember: string;
	fromMemberId: number;
	toMemberId: number;
	status: "pending" | "settled";
}

export type AssignmentList = {
	itemId: number;
	name: string;
	memberName: string;
}

export type GroupSummaryRow = {
    id: number;
	name: string;
	members: string;
	totalExpenses: number;
}

export type GroupDraft = {
  	id?: number;
  	name: string;
  	members: string[];
}
export type GroupSummary = GroupDraft & {
	totalExpenses: number;
}

export type DetailedGroup = {
	group: Group;
	members: Member[];
	receipts: Receipt[];
	debts: DebtDetails[];
	totalExpenses: number;
}

export type MemberBalance = {
	memberId: number;
	name: string;
	balance: number;
};

export type ProfileDetails = {
	totalSpent: number;
	totalGroups: number;
	totalBillsScanned: number;
	pendingBalance: number;
	pendingCount: number;
	settledCount: number;
	activeGroup: string;
	highestExpense: number;
	recentActivity: string;
}