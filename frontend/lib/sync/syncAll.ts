import { syncDebts } from "lib/sync/push/syncDebts";
import { syncGroups } from "lib/sync/push/syncGroups";
import { syncItemAssignments } from "lib/sync/push/syncItemAssignments";
import { syncItems } from "lib/sync/push/syncItems";
import { syncMembers } from "lib/sync/push/syncMembers";
import { syncReceipts } from "lib/sync/push/syncReceipts";
import { syncReceiptDeletions } from "lib/sync/push/syncReceiptDeletions";
import { syncGroupDeletions } from "lib/sync/push/syncGroupDeletions";
import { syncSettlements } from "lib/sync/push/syncSettlements";

export default async function syncAll(): Promise<boolean> {
    try {
        let success = true;

        if (!(await syncGroups())) success = false;

        if (!(await syncMembers())) success = false;

        // Remove replaced receipts and their remote children before pushing
        // the replacement rows so immutable records cannot linger remotely.
        if (!(await syncReceiptDeletions())) success = false;

        if (!(await syncReceipts())) success = false;

        if (!(await syncItems())) success = false;

        if (!(await syncItemAssignments())) success = false;

        if (!(await syncDebts())) success = false;

        if (!(await syncSettlements())) success = false;

        if (!(await syncGroupDeletions())) success = false;

        return success;

    } catch (error) {
        console.error("SYNC CRASHED:", error);
        return false;
    }
}
