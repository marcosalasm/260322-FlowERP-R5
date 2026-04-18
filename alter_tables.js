import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres.kmsiyrmqoymvmloveisq:FlowERP2026%40@aws-1-us-east-1.pooler.supabase.com:5432/postgres';
const client = new Client({ connectionString });

async function run() {
  await client.connect();
  await client.query("ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;");
  await client.query("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;");
  console.log("Columns added successfully.");
  await client.end();
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
