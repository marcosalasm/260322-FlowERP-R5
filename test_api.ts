import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from './db/index';
import * as schema from './db/schema';

const cleanData = (data: any) => {
    const cleaned = { ...data };
    Object.keys(cleaned).forEach(key => {
        const value = cleaned[key];
        if (value === '' || (typeof value === 'string' && value.trim() === '')) {
            cleaned[key] = null;
        }
    });
    return cleaned;
};

async function run() {
    try {
        const body = {
            name: 'Test UI 3',
            company: 'Test Company',
            phone: '88888888',
            email: '',
            nextFollowUpDate: '',
            birthday: '',
            spouseName: '',
            children: '',
            hobbies: '',
            followUps: []
        };
        const cleanedBody = cleanData(body);
        console.log("Cleaned:", cleanedBody);

        const newProspect = await db.insert(schema.prospects).values(cleanedBody).returning();
        console.log("Inserted:", newProspect[0]);
    } catch (e) {
        console.error("Error inserting prospect:", e);
    } finally {
        process.exit(0);
    }
}
run();
