import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from './db/index';
import * as schema from './db/schema';
import { sql } from 'drizzle-orm';

async function run() {
    try {
        const txResult = await db.transaction(async (tx) => {
            const [updated] = await tx.insert(schema.systemSequences)
                .values({ prefix: 'PRE', lastValue: 1 })
                .onConflictDoUpdate({
                    target: schema.systemSequences.prefix,
                    set: { lastValue: sql`${schema.systemSequences.lastValue} + 1` }
                })
                .returning();
            return updated;
        });
        console.log("Tx success", txResult);
    } catch (e: any) {
        console.error("Tx error", e);
    } finally {
        process.exit(0);
    }
}
run();
