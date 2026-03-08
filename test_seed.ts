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
        await dbPg.execute(sql`
            CREATE TABLE IF NOT EXISTS "system_sequences" (
                "prefix" text PRIMARY KEY NOT NULL,
                "last_value" integer DEFAULT 0 NOT NULL
            );
        `);
        console.log("system_sequences created");
        await pool.end();
    } catch (e: any) {
        console.error("error", e.message || e);
    } finally {
        process.exit(0);
    }
}
run();
