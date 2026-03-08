import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function testConnection() {
    console.log('--- Database Connection Test (Detailed) ---');
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('Error: DATABASE_URL not found in .env.local');
        process.exit(1);
    }

    console.log('URL format seems correct.');

    try {
        console.log('Initializing neon connection...');
        const sql = neon(url);

        console.log('Sending simple query: SELECT 1...');
        const startTime = Date.now();
        const result = await sql`SELECT 1 as connected`;
        const endTime = Date.now();

        if (result && result[0] && result[0].connected === 1) {
            console.log(`Connection successful! Response time: ${endTime - startTime}ms`);

            console.log('Fetching table list...');
            const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
            console.log('Tables in public schema:');
            tables.forEach(t => console.log(` - ${t.table_name}`));
        } else {
            console.log('Connection returned unexpected result:', result);
        }

        process.exit(0);
    } catch (error) {
        console.error('CRITICAL: Connection failed.');
        console.error(error);
        process.exit(1);
    }
}

testConnection();
