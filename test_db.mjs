import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    let query = supabase.from('purchase_orders').select('*, items:purchase_order_items(*), suppliers(name), projects(name)');
    const { data, error } = await query
      .in('status', ['Emitida', 'OC Aprobada', 'Aprobada', 'Pendiente OC', 'Aprobación Financiera', 'Recibida', 'Cancelada', 'Recepción Parcial', 'Rechazada', 'Pendiente', 'Draft'])
      .order('created_at', { ascending: false });
    console.log("Error:", error);
    console.log("Data count:", data?.length);
    if(data && data.length > 0) console.log("Data sample:", data.map(d=>({id: d.id, s_name: d.suppliers?.name, p_name: d.projects?.name})));
}
main();
