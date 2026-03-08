import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from './db/index';
import * as schema from './db/schema';
import { desc } from 'drizzle-orm';

async function run() {
    try {
        const data = await db.query.prospects.findMany({
            orderBy: [desc(schema.prospects.id)],
            limit: 3
        });
        console.log("Latest prospects:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error reading DB:", e);
    } finally {
        process.exit(0);
    }
}
run();
