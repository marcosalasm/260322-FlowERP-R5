const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.kmsiyrmqoymvmloveisq:FlowERP2026%40@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log("Connected");
    
    await client.query(`ALTER TABLE quote_responses ALTER COLUMN currency DROP NOT NULL;`);
    console.log("Dropped NOT NULL constraint on currency");

    // Also just in case supplier_id had NOT NULL
    await client.query(`ALTER TABLE quote_responses ALTER COLUMN supplier_id DROP NOT NULL;`);
    
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log("Reloaded schema");
    
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
