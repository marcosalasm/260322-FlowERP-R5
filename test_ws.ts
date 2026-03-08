import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './db/schema';
import { sql } from 'drizzle-orm';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function run() {
    try {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
        const dbWs = drizzle(pool, { schema });
        const txResult = await dbWs.transaction(async (tx) => {
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
        console.error("Tx error", e.message || e);
    } finally {
        process.exit(0);
    }
}
run();
