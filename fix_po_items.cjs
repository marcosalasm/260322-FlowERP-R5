const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.kmsiyrmqoymvmloveisq:FlowERP2026%40@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
});
async function run() {
  await client.connect();
  const pos = (await client.query('SELECT * FROM purchase_orders')).rows;
  for (const po of pos) {
    const items = (await client.query('SELECT * FROM service_request_items WHERE service_request_id = $1', [po.service_request_id])).rows;
    for (const item of items) {
      await client.query('INSERT INTO purchase_order_items (purchase_order_id, name, quantity, unit, unit_price, project_id) VALUES ($1, $2, $3, $4, $5, $6)', [po.id, item.name, item.quantity, item.unit, 0, po.project_id]);
      console.log('Fixed item for PO', po.id, item.name);
    }
  }
  await client.end();
}
run().catch(console.error);
