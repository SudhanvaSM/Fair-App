import { ItemWithSelection, Assignments } from "@/types/item";

export function buildAssignments(items: ItemWithSelection[]): Assignments {
  const assignments: Assignments = {};

  for (const item of items) {
    const { item_id, selectedPeople } = item;

    // Validation
    if (!selectedPeople || selectedPeople.length === 0) {
      throw new Error(`Item "${item.name}" has no assigned users`);
    }
    
    assignments[item_id] = {
      type: "equal",
      users: selectedPeople
    };
  }

  return assignments;
}