const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.kmsiyrmqoymvmloveisq:FlowERP2026%40@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log("Connected");
    
    await client.query(`ALTER TABLE quote_responses ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb;`);
    console.log("Added history column");
    
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log("Reloaded schema");
    
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
