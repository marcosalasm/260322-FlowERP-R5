
import { db } from './db/index';
import { sql } from 'drizzle-orm';

async function applyMigrations() {
    console.log('--- Applying Purchasing Module Migrations ---');

    const queries = [
        `ALTER TABLE "accounts_payable" ADD COLUMN IF NOT EXISTS "subcontract_id" integer;`,
        `ALTER TABLE "accounts_payable" ADD COLUMN IF NOT EXISTS "credited_amount" numeric DEFAULT '0';`,
        `ALTER TABLE "accounts_payable" ADD COLUMN IF NOT EXISTS "applied_credit_note_ids" jsonb DEFAULT '[]';`,
        `ALTER TABLE "accounts_payable" ADD COLUMN IF NOT EXISTS "payments" jsonb DEFAULT '[]';`,

        `CREATE TABLE IF NOT EXISTS "goods_receipts" (
            "id" serial PRIMARY KEY,
            "tenant_id" integer NOT NULL DEFAULT 1,
            "purchase_order_id" integer,
            "creation_date" date NOT NULL,
            "expected_receipt_date" date,
            "actual_receipt_date" date,
            "received_by" text,
            "status" text NOT NULL DEFAULT 'Pendiente de Recepción',
            "notes" text,
            "closed_by_credit_note_ids" jsonb DEFAULT '[]',
            "is_subcontract_receipt" boolean DEFAULT false,
            "amount_received" numeric DEFAULT '0',
            "progress_description" text,
            "subcontractor_invoice" text
        );`,

        `CREATE TABLE IF NOT EXISTS "goods_receipt_items" (
            "id" serial PRIMARY KEY,
            "tenant_id" integer NOT NULL DEFAULT 1,
            "goods_receipt_id" integer,
            "purchase_order_item_id" integer,
            "name" text NOT NULL,
            "quantity_ordered" numeric NOT NULL DEFAULT '0',
            "unit" text NOT NULL DEFAULT 'unidad',
            "quantity_received" numeric NOT NULL DEFAULT '0'
        );`,

        `CREATE TABLE IF NOT EXISTS "credit_notes" (
            "id" serial PRIMARY KEY,
            "tenant_id" integer NOT NULL DEFAULT 1,
            "goods_receipt_id" integer,
            "purchase_order_id" integer,
            "project_id" integer,
            "supplier_id" integer,
            "supplier_name" text NOT NULL,
            "creation_date" timestamp with time zone DEFAULT now(),
            "created_by" text,
            "approval_date" timestamp with time zone,
            "reason" text NOT NULL,
            "total_amount" numeric NOT NULL DEFAULT '0',
            "status" text NOT NULL DEFAULT 'Pendiente Aprobación',
            "applied_to_invoice" boolean DEFAULT false,
            "pdf_attachment_name" text
        );`,

        `CREATE TABLE IF NOT EXISTS "credit_note_items" (
            "id" serial PRIMARY KEY,
            "tenant_id" integer NOT NULL DEFAULT 1,
            "credit_note_id" integer,
            "purchase_order_item_id" integer,
            "name" text NOT NULL,
            "quantity_to_credit" numeric NOT NULL DEFAULT '0',
            "unit" text NOT NULL DEFAULT 'unidad',
            "unit_price" numeric NOT NULL DEFAULT '0',
            "credit_amount" numeric NOT NULL DEFAULT '0'
        );`,

        `CREATE TABLE IF NOT EXISTS "pre_op_rubros" (
            "id" serial PRIMARY KEY,
            "tenant_id" integer NOT NULL DEFAULT 1,
            "nombre" text NOT NULL,
            "limite_por_prospecto" numeric NOT NULL DEFAULT '0'
        );`,

        `CREATE TABLE IF NOT EXISTS "pre_op_expenses" (
            "id" serial PRIMARY KEY,
            "tenant_id" integer NOT NULL DEFAULT 1,
            "prospect_id" integer,
            "prospect_name" text,
            "budget_id" integer,
            "budget_name" text,
            "fecha" date NOT NULL,
            "total_gasto" numeric NOT NULL DEFAULT '0',
            "status" text NOT NULL DEFAULT 'Registrado',
            "desglose" jsonb NOT NULL DEFAULT '{}',
            "created_at" timestamp with time zone DEFAULT now()
        );`,

        `ALTER TABLE "pre_op_expenses" ALTER COLUMN "prospect_name" DROP NOT NULL;`,
        `ALTER TABLE "pre_op_expenses" ADD COLUMN IF NOT EXISTS "budget_id" integer;`,
        `ALTER TABLE "pre_op_expenses" ADD COLUMN IF NOT EXISTS "budget_name" text;`
    ];

    for (const query of queries) {
        try {
            await db.execute(sql.raw(query));
            console.log(`✅ Executed: ${query.substring(0, 50)}...`);
        } catch (error) {
            console.error(`❌ Error executing query:`, (error as Error).message);
        }
    }

    console.log('--- Migration Sync Complete ---');

    // Seeding default rubros if empty
    try {
        const result = await db.execute(sql.raw('SELECT count(*) FROM pre_op_rubros'));
        const count = result.rows[0].count;
        if (Number(count) === 0) {
            console.log('--- Seeding Default Pre-Op Rubros ---');
            const rubros = [
                { nombre: 'FORMALIZACIÓN', limite_por_prospecto: '300000' },
                { nombre: 'COMISIONES', limite_por_prospecto: '250000' },
                { nombre: 'AVALÚOS', limite_por_prospecto: '150000' },
                { nombre: 'Permiso de construcción', limite_por_prospecto: '0' },
                { nombre: 'Poliza RT', limite_por_prospecto: '0' },
                { nombre: 'Tasado CFIA', limite_por_prospecto: '0' },
                { nombre: 'Caja Chica', limite_por_prospecto: '0' },
                { nombre: 'Gastos operativos del proyecto', limite_por_prospecto: '0' }
            ];
            for (const r of rubros) {
                await db.execute(sql.raw(`INSERT INTO pre_op_rubros (nombre, limite_por_prospecto) VALUES ('${r.nombre}', '${r.limite_por_prospecto}')`));
            }
            console.log('✅ Rubros seeded.');
        }
    } catch (e) {
        console.error('Error seeding rubros:', e);
    }

    process.exit(0);
}

applyMigrations().catch(err => {
    console.error('Fatal error during migration:', err);
    process.exit(1);
});
await db.execute(sql.raw('ALTER TABLE "service_request_items" ADD COLUMN IF NOT EXISTS "estimated_unit_cost" numeric;'));

