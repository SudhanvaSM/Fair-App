export type Item = {
  item_id: number;
  name: string;
  qty: number;
  unit_price: number;
  total_price: number;
};

export type ItemPerPerson = {
  name: string;
  total_price: number;
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
    item_id: number;
    total_price: number;
  }[];
  subtotal: number;
  tax: number;
  service_charge?: number;
  rounding?: number;
  total: number;
}

export type RecentSplit = {
  title: string;
  people: number;
  date: string;
  price: number;
}

export type SplitHistory = {
  id: number;
  result: {
    perPerson: Record<string, number>;
    breakdown: Record<string, number>;
  }
  createdAt: string;
  raw?: {
    total?: number;
    subtotal?: number;
    tax?: number;
    service_charge?: number;
    items?: Item[];
  }
  thing: ItemWithSelection[];
}

export type Group = {
  name: string;
  members: string[];
}