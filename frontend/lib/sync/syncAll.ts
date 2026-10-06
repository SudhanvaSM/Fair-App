import { syncDebts } from "./push/syncDebts";
import { syncGroups } from "./push/syncGroups";
import { syncItemAssignments } from "./push/syncItemAssignments";
import { syncItems } from "./push/syncItems";
import { syncMembers } from "./push/syncMembers";
import { syncReceipts } from "./push/syncReceipts";
import { syncReceiptDeletions } from "./push/syncReceiptDeletions";
import { syncGroupDeletions } from "./push/syncGroupDeletions";

export default async function syncAll(): Promise<boolean> {
    try {
        let success = true;

        if (!(await syncGroups())) success = false;

        if (!(await syncMembers())) success = false;

        if (!(await syncReceipts())) success = false;

        if (!(await syncItems())) success = false;

        if (!(await syncItemAssignments())) success = false;

        if (!(await syncDebts())) success = false;

        if (!(await syncGroupDeletions())) success = false;

        if (!(await syncReceiptDeletions())) success = false;

        return success;

    } catch (error) {
        console.error("SYNC CRASHED:", error);
        return false;
    }
}