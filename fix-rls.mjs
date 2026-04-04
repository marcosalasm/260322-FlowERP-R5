import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pg;

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    // List of ALL tables the frontend might be fetching or writing to directly now
    const tables = [
      'materials',
      'service_items',
      'administrative_budgets',
      'administrative_expenses',
      'company_info',
      'roles',
      'pre_op_rubros',
      'pre_op_expenses',
      'users',
      'prospects',
      'projects',
      'accounts_receivable',
      'service_requests',
      'quote_responses',
      'purchase_orders',
      'accounts_payable',
      'goods_receipts',
      'credit_notes',
      'subcontracts',
      'suppliers',
      'offers',
      'change_orders',
      'budgets',
      'labor_items',
      'recurring_order_templates',
      'predetermined_activities',
      'predetermined_sub_activities'
    ];

    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
        console.log(`Enabled RLS on ${table}`);

        // Check if policy exists
        const result = await client.query(`
          SELECT policyname
          FROM pg_policies
          WHERE tablename = $1 AND policyname = 'Public Access';
        `, [table]);

        if (result.rows.length === 0) {
          await client.query(`
            CREATE POLICY "Public Access" ON "${table}"
            FOR ALL USING (true) WITH CHECK (true);
          `);
          console.log(`Created Public Access policy on ${table}`);
        } else {
            console.log(`Policy already exists on ${table}`);
        }
      } catch (err) {
        console.error(`Error on table ${table}:`, err.message);
      }
    }

    console.log('Finished updating policies.');
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await client.end();
  }
}

run();
