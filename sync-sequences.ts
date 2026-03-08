import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pg;

async function syncSequences() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    console.log('🔄 Sincronizando TODAS las secuencias de la base de datos...\n');

    // Query all serial columns and their sequences
    const result = await client.query(`
        SELECT 
            t.table_name,
            c.column_name,
            pg_get_serial_sequence(t.table_name, c.column_name) AS seq_name
        FROM information_schema.tables t
        JOIN information_schema.columns c ON c.table_name = t.table_name AND c.table_schema = t.table_schema
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          AND c.column_default LIKE 'nextval%'
        ORDER BY t.table_name;
    `);

    console.log(`📊 Encontradas ${result.rows.length} secuencias para sincronizar:\n`);

    let fixedCount = 0;
    for (const row of result.rows) {
        const { table_name, column_name, seq_name } = row;
        if (!seq_name) continue;

        const maxRes = await client.query(`SELECT COALESCE(MAX(${column_name}), 0) AS max_val FROM ${table_name}`);
        const maxVal = parseInt(maxRes.rows[0].max_val || '0');

        const seqRes = await client.query(`SELECT last_value FROM ${seq_name}`);
        const currentSeqVal = parseInt(seqRes.rows[0].last_value);

        if (currentSeqVal <= maxVal) {
            const newVal = maxVal + 1;
            await client.query(`SELECT setval('${seq_name}', ${newVal}, false)`);
            console.log(`⚠️  FIXED: ${table_name}.${column_name} | seq: ${currentSeqVal} → ${newVal} | max_id: ${maxVal}`);
            fixedCount++;
        } else {
            console.log(`✅ OK: ${table_name}.${column_name} | seq: ${currentSeqVal} | max_id: ${maxVal}`);
        }
    }

    console.log(`\n🏁 Sincronización completada. ${fixedCount} secuencias corregidas de ${result.rows.length} total.`);
    await client.end();
}

syncSequences().catch(err => { console.error('Error:', err); process.exit(1); });
