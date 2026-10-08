export type Item = {
    itemId: string;
    name: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
};

export type ItemPerPerson = {
    name: string;
    totalPrice: number;
    selectedPeople: string[];
};

export type ItemWithSelection = Item & {
    selectedPeople: string[];
};

export type Assignment = {
    users: string[];
};

export type Assignments = Record<string, Assignment>;

export type ParsedData = {
    items: {
        itemId: string;
        totalPrice: number;
    }[];
    subtotal: number;
    tax: number;
    serviceCharge?: number;
    rounding?: number;
    finalTip?: number;
    total: number;
};

export type RecentSplit = {
    id: string;
    title: string;
    people: number;
    date: string;
    price: number;
};

export type Group = {
    id: string;
    ownerUserId: string;
    name: string;
    createdAt?: string;
};

export type Member = {
    id: string;
    groupId: string;
    userId: string | null;
    name: string;
};

export type Receipt = {
    id: string;
    title: string;
    groupId: string;
    payerMemberId: string;
    subtotal: number;
    tax: number;
    finalTip: number;
    serviceCharge: number;
    createdAt: string;
    total: number;
    imageUri: string;
};

export type Debt = {
    id: string;
    receiptId: string;
    groupId: string;
    fromMemberId: string;
    toMemberId: string;
    amount: number;
};

export type DebtDetails = {
    id: string;
    amount: number;
    fromMember: string;
    toMember: string;
    fromMemberId: string;
    toMemberId: string;
};

export type AssignmentList = {
    itemId: string;
    name: string;
    memberName: string;
};

export type GroupSummaryRow = {
    id: string;
    name: string;
    members: string;
    totalExpenses: number;
};

export type GroupDraft = {
    id: string;
    name: string;
    members: string[];
};

export type GroupSummary = GroupDraft & {
    totalExpenses: number;
};

export type DetailedGroup = {
    group: Group;
    members: Member[];
    receipts: Receipt[];
    debts: DebtDetails[];
    totalExpenses: number;
};

export type MemberBalance = {
    memberId: string;
    name: string;
    balance: number;
};

export type ProfileDetails = {
    email: string;
    totalSpent: number;
    totalGroups: number;
    totalBillsScanned: number;
    pendingBalance: number;
    activeGroup: string;
    highestExpense: number;
    recentActivity: string;
};

export type SyncStep =
    | "profile"
    | "groups"
    | "members"
    | "receipts"
    | "items"
    | "assignments"
    | "debts"
    | "settlements"
    | "complete";

export type SimplifiedBalances = {
    fromMemberId: string;
    toMemberId: string;
    amount: number;
}