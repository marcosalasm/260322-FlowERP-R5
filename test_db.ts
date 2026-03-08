import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from './db/index';
import * as schema from './db/schema';

async function run() {
    try {
        const data = {
            name: "Test Prospect 2",
            company: null,
            phone: null,
            email: null,
            nextFollowUpDate: null,
            birthday: null,
            spouseName: null,
            children: null,
            hobbies: null,
            followUps: []
        };
        const newProspect = await db.insert(schema.prospects).values(data).returning();
        console.log("Success:", newProspect);
    } catch (e) {
        console.error("Error inserting prospect:", e);
    } finally {
        process.exit(0);
    }
}
run();
