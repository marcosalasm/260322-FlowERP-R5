const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.kmsiyrmqoymvmloveisq:FlowERP2026%40@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    
    // Attempt an insert similar to apiService.ts
    const poPayload = {
        service_request_id: 1,
        project_id: 1,
        project_name: 'test',
        supplier_id: 1,
        supplier_name: 'test supp',
        order_date: '2026-04-04',
        expected_delivery_date: '2026-04-10',
        subtotal: 100,
        discount: 0,
        iva: 0,
        total_amount: 100,
        status: 'Aprobada',
        payment_terms: 'Contado'
    };

    const res = await client.query(
        `INSERT INTO purchase_orders (service_request_id, project_id, project_name, supplier_id, supplier_name, order_date, expected_delivery_date, subtotal, discount, iva, total_amount, status, payment_terms) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
        [poPayload.service_request_id, poPayload.project_id, poPayload.project_name, poPayload.supplier_id, poPayload.supplier_name, poPayload.order_date, poPayload.expected_delivery_date, poPayload.subtotal, poPayload.discount, poPayload.iva, poPayload.total_amount, poPayload.status, poPayload.payment_terms]
    );

    const newPoId = res.rows[0].id;
    console.log("Created PO ID:", newPoId);

    const itemPayload = {
        id: 9999, // Simulate carrying over the ServiceRequestItem ID
        purchase_order_id: newPoId,
        name: 'test item',
        quantity: 1,
        unit: 'und',
        unit_price: 100
    };

    const itemRes = await client.query(
        `INSERT INTO purchase_order_items (id, purchase_order_id, name, quantity, unit, unit_price)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
         [itemPayload.id, itemPayload.purchase_order_id, itemPayload.name, itemPayload.quantity, itemPayload.unit, itemPayload.unit_price]
    );

    console.log("Created PO Item with explicit ID:", itemRes.rows[0].id);

    // Clean up
    await client.query(`DELETE FROM purchase_orders WHERE id = $1`, [newPoId]);
    console.log("Cleanup done.");
    
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
