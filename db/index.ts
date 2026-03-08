import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Uses Supabase's PostgreSQL connection string (Transaction Pooler recommended)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false }, // Required by Supabase
    connectionTimeoutMillis: 10000,  // 10s timeout for acquiring a connection
    idleTimeoutMillis: 30000,        // Close idle connections after 30s
    max: 10,                          // Max pool size
});

export const db = drizzle(pool, { schema });
