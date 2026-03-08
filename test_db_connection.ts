import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

async function testConnection() {
    console.log('--- Database Connection Test ---');
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('Error: DATABASE_URL not found in .env.local');
        process.exit(1);
    }

    console.log(`Connecting to: ${url.split('@')[1]}`); // Log host for verification, hide credentials

    try {
        const sql = neon(url);
        const db = drizzle(sql);

        console.log('Attempting to query database...');
        // Simple query to verify connection
        const result = await sql`SELECT version()`;
        console.log('Successfully connected to Neon Database!');
        console.log('PostgreSQL Version:', result[0].version);

        // Verify if we can see the tables
        const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log(`Found ${tables.length} tables in public schema.`);

        process.exit(0);
    } catch (error) {
        console.error('Failed to connect to the database:');
        console.error(error);
        process.exit(1);
    }
}

testConnection();
