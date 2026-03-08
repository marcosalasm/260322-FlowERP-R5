
import { db } from './db/index';
import * as schema from './db/schema';
import { sql } from 'drizzle-orm';

async function verifyPurchasingModule() {
    console.log('--- Verifying Purchasing Module Database ---');

    const tablesToCheck = [
        { name: 'suppliers', schema: schema.suppliers },
        { name: 'serviceRequests', schema: schema.serviceRequests },
        { name: 'serviceRequestItems', schema: schema.serviceRequestItems },
        { name: 'purchaseOrders', schema: schema.purchaseOrders },
        { name: 'purchaseOrderItems', schema: schema.purchaseOrderItems },
        { name: 'accountsPayable', schema: schema.accountsPayable },
        { name: 'goodsReceipts', schema: schema.goodsReceipts },
        { name: 'goodsReceiptItems', schema: schema.goodsReceiptItems },
        { name: 'creditNotes', schema: schema.creditNotes },
        { name: 'creditNoteItems', schema: schema.creditNoteItems },
        { name: 'quoteResponses', schema: schema.quoteResponses },
        { name: 'quoteResponseItems', schema: schema.quoteResponseItems },
        { name: 'subcontracts', schema: schema.subcontracts },
        { name: 'preOpRubros', schema: schema.preOpRubros },
        { name: 'preOpExpenses', schema: schema.preOpExpenses },
        { name: 'recurringOrderTemplates', schema: schema.recurringOrderTemplates },
        { name: 'predeterminedActivities', schema: schema.predeterminedActivities },
        { name: 'predeterminedSubActivities', schema: schema.predeterminedSubActivities }
    ];

    for (const table of tablesToCheck) {
        try {
            // Check if table exists by doing a simple count
            const result = await db.select({ count: sql`count(*)` }).from(table.schema);
            console.log(`✅ Table '${table.name}' exists. Row count: ${result[0].count}`);
        } catch (error) {
            console.error(`❌ Error accessing table '${table.name}':`, (error as Error).message);
        }
    }

    console.log('--- Verification Complete ---');
    process.exit(0);
}

verifyPurchasingModule().catch(err => {
    console.error('Fatal error during verification:', err);
    process.exit(1);
});
