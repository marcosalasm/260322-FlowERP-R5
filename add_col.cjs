const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.kmsiyrmqoymvmloveisq:FlowERP2026%40@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log("Connected");
    
    const queries = [
      `ALTER TABLE quote_responses ADD COLUMN IF NOT EXISTS service_request_id INT4;`,
      `ALTER TABLE quote_responses ADD COLUMN IF NOT EXISTS supplier_id INT4;`,
      `ALTER TABLE quote_responses ADD COLUMN IF NOT EXISTS supplier_name TEXT;`,
      `ALTER TABLE quote_responses ADD COLUMN IF NOT EXISTS quote_number TEXT;`,
      `ALTER TABLE quote_responses ADD COLUMN IF NOT EXISTS delivery_days INT4;`,
      `ALTER TABLE quote_responses ADD COLUMN IF NOT EXISTS payment_terms TEXT;`,
      `ALTER TABLE quote_responses ADD COLUMN IF NOT EXISTS quality_notes TEXT;`,
      `ALTER TABLE quote_responses ADD COLUMN IF NOT EXISTS total NUMERIC;`,
      `ALTER TABLE quote_responses ADD COLUMN IF NOT EXISTS pdf_attachment_name TEXT;`,
      `ALTER TABLE quote_responses ADD COLUMN IF NOT EXISTS pdf_attachment_base64 TEXT;`,
      `ALTER TABLE quote_responses ADD COLUMN IF NOT EXISTS currency TEXT;`,
      `NOTIFY pgrst, 'reload schema';`
    ];

    for (let q of queries) {
      await client.query(q);
      console.log("Executed: ", q.substring(0, 50) + "...");
    }
    
    console.log("All columns ensured and schema reloaded.");
    
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
