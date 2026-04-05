const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.kmsiyrmqoymvmloveisq:FlowERP2026%40@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    
    // Get Service Requests that are "OC Aprobada" but don't have a Purchase Order yet
    const srRes = await client.query("SELECT * FROM service_requests WHERE status='OC Aprobada';");
    const serviceRequests = srRes.rows;

    for (const req of serviceRequests) {
        // Check if PO exists
        const checkPo = await client.query("SELECT id FROM purchase_orders WHERE service_request_id = $1", [req.id]);
        if (checkPo.rows.length > 0) {
            console.log(`Skipping SR ${req.id}, already has PO`);
            continue;
        }

        console.log(`Restoring missing Purchase Order for SR ${req.id}...`);

        let winnerSelection = req.winner_selection;
        if (typeof winnerSelection === 'string') {
            try { winnerSelection = JSON.parse(winnerSelection); } catch(e) {}
        }
        if (!winnerSelection) { console.log(`No winner selection for ${req.id}`); continue; }

        for (const [itemId, winnerInfo] of Object.entries(winnerSelection)) {
            // Find the quote
            const quoteRes = await client.query("SELECT * FROM quote_responses WHERE id = $1", [winnerInfo.quote_response_id]);
            const quote = quoteRes.rows[0];
            if (!quote) continue;

            const poPayload = {
                service_request_id: req.id,
                project_id: req.project_id,
                project_name: req.project_name,
                supplier_id: quote.supplier_id,
                supplier_name: quote.supplier_name,
                order_date: quote.created_at || new Date().toISOString(),
                expected_delivery_date: new Date(Date.now() + quote.delivery_days * 24 * 60 * 60 * 1000).toISOString(),
                subtotal: quote.total,
                discount: 0,
                iva: 0,
                total_amount: quote.total,
                status: 'Aprobada',
                payment_terms: quote.payment_terms || 'Contado'
            };

            const poInsert = await client.query(
                `INSERT INTO purchase_orders (service_request_id, project_id, project_name, supplier_id, supplier_name, order_date, expected_delivery_date, subtotal, discount, iva, total_amount, status, payment_terms) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
                [poPayload.service_request_id, poPayload.project_id, poPayload.project_name, poPayload.supplier_id, poPayload.supplier_name, poPayload.order_date, poPayload.expected_delivery_date, poPayload.subtotal, poPayload.discount, poPayload.iva, poPayload.total_amount, poPayload.status, poPayload.payment_terms]
            );

            const newPoId = poInsert.rows[0].id;
            console.log(`Created PO ${newPoId} for SR ${req.id}`);

            // Restore items
            const sItemRes = await client.query("SELECT * FROM service_request_items WHERE service_request_id = $1 AND id = $2", [req.id, itemId]);
            if (sItemRes.rows.length > 0) {
                const sItem = sItemRes.rows[0];
                
                const qItemRes = await client.query("SELECT * FROM quote_line_items WHERE quote_response_id = $1 AND service_request_item_id = $2", [quote.id, itemId]);
                const qItem = qItemRes.rows[0];
                const unitPrice = qItem ? qItem.unit_price : (quote.total / sItem.quantity); // Fallback to total if missing

                await client.query(
                    `INSERT INTO purchase_order_items (purchase_order_id, name, quantity, unit, unit_price, project_id)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                     [newPoId, sItem.name, sItem.quantity, sItem.unit, unitPrice, req.project_id]
                );
                console.log(`Created Item ${sItem.name} for PO ${newPoId}`);
            }
        }
    }
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
