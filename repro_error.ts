
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './db/schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function test() {
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql, { schema });

    console.log("Attempting to insert a prospect with empty strings for dates...");
    try {
        const result = await db.insert(schema.prospects).values({
            name: "Test User Error",
            company: "Test Co",
            phone: "123",
            email: "",
            nextFollowUpDate: "", // This is likely the culprit
            birthday: "",         // This too
            followUps: []         // And this is not in the schema
        } as any).returning();
        console.log("Success:", result);
    } catch (error) {
        console.error("Error detected:", error);
    }
}

test();
