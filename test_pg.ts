import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './db/schema';
import { sql } from 'drizzle-orm';

async function run() {
    try {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
        const dbPg = drizzle(pool, { schema });
        const txResult = await dbPg.transaction(async (tx) => {
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
        await pool.end();
    } catch (e: any) {
        console.error("Tx error full:", e);
    } finally {
        process.exit(0);
    }
}
run();
