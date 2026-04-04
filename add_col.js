const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.kmsiyrmqoymvmloveisq:FlowERP2026%40@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log("Connected");
    
    await client.query(`ALTER TABLE quote_responses ADD COLUMN IF NOT EXISTS ai_validation JSONB DEFAULT NULL;`);
    console.log("Added ai_validation");
    
    await client.query(`ALTER TABLE quote_responses ADD COLUMN IF NOT EXISTS ai_score NUMERIC DEFAULT NULL;`);
    console.log("Added ai_score");
    
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log("Reloaded schema");
    
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
