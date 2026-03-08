console.log('1. Starting test script');
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
console.log('2. Dotenv configured');

import { db } from './db/index';
console.log('3. db imported');

import * as schema from './db/schema';
console.log('4. schema imported');

async function test() {
    console.log('5. Running test query...');
    try {
        const result = await db.query.users.findMany({ limit: 1 });
        console.log('6. Query result:', result);
    } catch (e) {
        console.error('7. Query failed:', e);
    }
}

test();
