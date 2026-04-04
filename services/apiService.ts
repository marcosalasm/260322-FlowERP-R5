import { supabase } from '../lib/supabase';

const API_URL = (import.meta as any).env?.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : 'https://flowerp.net/api');

// ─── HTTP helper (for writes: POST / PUT / DELETE) ─────────────────────────
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
};

const toCamel = (s: string) => s.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
const keysToCamel = (o: any): any => {
    if (o === Object(o) && !Array.isArray(o) && typeof o !== 'function') {
        const n: any = {};
        Object.keys(o).forEach((k) => { n[toCamel(k)] = keysToCamel(o[k]); });
        return n;
    } else if (Array.isArray(o)) {
        return o.map((i) => keysToCamel(i));
    }
    return o;
};

const toSnake = (s: string) => s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const keysToSnake = (o: any): any => {
    if (o === Object(o) && !Array.isArray(o) && typeof o !== 'function') {
        const n: any = {};
        Object.keys(o).forEach((k) => { n[toSnake(k)] = keysToSnake(o[k]); });
        return n;
    } else if (Array.isArray(o)) {
        return o.map((i) => keysToSnake(i));
    }
    return o;
};

const sbGet = async (table: string, extraQuery?: (q: any) => any) => {
    let q = supabase.from(table).select('*');
    if (extraQuery) q = extraQuery(q);
    const { data, error } = await q;
    if (error) throw new Error(`API [${table}]: Failed to fetch: ` + error.message);
    return keysToCamel(data || []);
};

const sbInsert = async (table: string, payload: any) => {
    const { data, error } = await supabase.from(table).insert(keysToSnake(payload)).select().single();
    if (error) throw new Error(`Failed to create ${table}: ` + error.message);
    return keysToCamel(data);
};

const sbUpdate = async (table: string, id: number, payload: any) => {
    const { data, error } = await supabase.from(table).update(keysToSnake(payload)).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update ${table}: ` + error.message);
    return keysToCamel(data);
};

const sbDelete = async (table: string, id: number) => {
    const { data, error } = await supabase.from(table).delete().eq('id', id).select().single();
    if (error) throw new Error(`Failed to delete ${table}: ` + error.message);
    return keysToCamel(data);
};

export const apiService = {

    // ── Users ──────────────────────────────────────────────────────────────
    getUsers: async () => {
        const r = await fetchWithAuth(`${API_URL}/users`);
        if (!r.ok) throw new Error('API [users]: Failed to fetch');
        const data = await r.json();
        return (data ?? []).map((u: any) => ({
            ...u,
            roleIds: u.userRoles?.map((ur: any) => ur.roleId) ?? [1],
        }));
    },
    createUser: async (user: any) => {
        const r = await fetchWithAuth(`${API_URL}/users`, { method: 'POST', body: JSON.stringify(user) });
        if (!r.ok) throw new Error('Failed to create user');
        return r.json();
    },
    updateUser: async (id: number, user: any) => {
        const r = await fetchWithAuth(`${API_URL}/users/${id}`, { method: 'PUT', body: JSON.stringify(user) });
        if (!r.ok) throw new Error('Failed to update user');
        return r.json();
    },
    deleteUser: async (id: number) => {
        const r = await fetchWithAuth(`${API_URL}/users/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Failed to delete user');
        return r.json();
    },

    // ── Roles ──────────────────────────────────────────────────────────────
    getRoles: async () => sbGet('roles'),
    createRole: async (role: any) => sbInsert('roles', role),
    updateRole: async (id: number, role: any) => sbUpdate('roles', id, role),
    deleteRole: async (id: number) => sbDelete('roles', id),

    // ── Projects ───────────────────────────────────────────────────────────
    getProjects: async () => sbGet('projects'),
    createProject: async (data: any) => sbInsert('projects', data),

    // ── Accounts Receivable ────────────────────────────────────────────────
    getAccountsReceivable: async () => sbGet('accounts_receivable'),
    createAccountReceivable: async (data: any) => sbInsert('accounts_receivable', data),
    updateAccountReceivable: async (id: number, data: any) => sbUpdate('accounts_receivable', id, data),

    // ── Prospects ──────────────────────────────────────────────────────────
    getProspects: async () => {
        const { data, error } = await supabase.from('prospects').select('*').order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data || []).map((p: any) => ({
            ...p,
            nextFollowUpDate: p.next_follow_up_date,
            spouseName: p.spouse_name,
            followUps: p.follow_ups || [],
            sourceBonoId: p.source_bono_id
        }));
    },
    checkDuplicateProspect: async (name: string): Promise<{ exists: boolean; prospect: any | null }> => {
        // En tu backend esto comprobaba si el nombre coincidía. Hacemos un ilike directo en Supabase:
        const { data, error } = await supabase.from('prospects').select('*').ilike('company', name).limit(1);
        if (error || !data || data.length === 0) return { exists: false, prospect: null };
        const p = data[0];
        return { exists: true, prospect: {
            ...p,
            nextFollowUpDate: p.next_follow_up_date,
            spouseName: p.spouse_name,
            followUps: p.follow_ups || [],
            sourceBonoId: p.source_bono_id
        } };
    },
    createProspect: async (data: any) => {
        const payload = {
            name: data.name,
            company: data.company,
            phone: data.phone,
            email: data.email,
            next_follow_up_date: data.nextFollowUpDate || null,
            birthday: data.birthday || null,
            spouse_name: data.spouseName,
            children: data.children,
            hobbies: data.hobbies,
            follow_ups: data.followUps,
            source: data.source,
            source_bono_id: data.sourceBonoId
        };
        const { data: result, error } = await supabase.from('prospects').insert([payload]).select().single();
        if (error) throw new Error(`Failed to create prospect: ${error.message}`);
        return {
            ...result,
            nextFollowUpDate: result.next_follow_up_date,
            spouseName: result.spouse_name,
            followUps: result.follow_ups || [],
            sourceBonoId: result.source_bono_id
        };
    },
    updateProspect: async (id: number, data: any) => {
        const payload: any = {
            name: data.name,
            company: data.company,
            phone: data.phone,
            email: data.email,
            next_follow_up_date: data.nextFollowUpDate || null,
            birthday: data.birthday || null,
            spouse_name: data.spouseName,
            children: data.children,
            hobbies: data.hobbies,
            follow_ups: data.followUps,
            source: data.source,
            source_bono_id: data.sourceBonoId
        };
        Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
        const { data: result, error } = await supabase.from('prospects').update(payload).eq('id', id).select().single();
        if (error) throw new Error('Failed to update prospect');
        return {
            ...result,
            nextFollowUpDate: result.next_follow_up_date,
            spouseName: result.spouse_name,
            followUps: result.follow_ups || [],
            sourceBonoId: result.source_bono_id
        };
    },
    deleteProspect: async (id: number) => {
        const { data: result, error } = await supabase.from('prospects').delete().eq('id', id).select().single();
        if (error) throw new Error('Failed to delete prospect');
        return result;
    },

    // ── Service Requests ───────────────────────────────────────────────────
    getServiceRequests: async () => {
        const { data, error } = await supabase.from('service_requests').select('*, items:service_request_items(*)').order('created_at', { ascending: false });
        if (error) throw new Error('Failed to fetch service requests: ' + error.message);
        return keysToCamel(data || []);
    },
    createServiceRequest: async (data: any) => {
        const { items, id: _frontendId, ...srData } = data;
        const payload = keysToSnake(srData);
        
        const { data: newSR, error } = await supabase.from('service_requests').insert([payload]).select().single();
        if (error) throw new Error('Failed to create service request: ' + error.message);
        
        if (items && items.length > 0) {
            const itemsPayload = items.map((item: any) => ({
                ...keysToSnake(item),
                service_request_id: newSR.id
            }));
            const { error: itemsError } = await supabase.from('service_request_items').insert(itemsPayload);
            if (itemsError) throw new Error('Failed to create service request items: ' + itemsError.message);
        }
        return keysToCamel(newSR);
    },
    updateServiceRequest: async (id: number, data: any) => {
        const { items, ...srData } = data;
        const payload = keysToSnake(srData);
        
        const { data: updatedSR, error } = await supabase.from('service_requests').update(payload).eq('id', id).select().single();
        if (error) throw new Error('Failed to update service request: ' + error.message);
        
        if (items) {
            await supabase.from('service_request_items').delete().eq('service_request_id', id);
            if (items.length > 0) {
                const itemsPayload = items.map((item: any) => {
                    const { id: _itemId, ...itemRest } = item;
                    return { ...keysToSnake(itemRest), service_request_id: updatedSR.id };
                });
                const { error: itemsError } = await supabase.from('service_request_items').insert(itemsPayload);
                if (itemsError) throw new Error('Failed to update service request items: ' + itemsError.message);
            }
        }
        return keysToCamel(updatedSR);
    },
    deleteServiceRequest: async (id: number) => sbDelete('service_requests', id),
    generateServiceRequestPdf: async (id: number, companyInfo: any) => {
        const r = await fetchWithAuth(`${API_URL}/service-requests/${id}/pdf`, { 
            method: 'POST', 
            body: JSON.stringify({ companyInfo }) 
        });
        if (!r.ok) {
            const e = await r.json().catch(() => ({}));
            throw new Error(e.error || 'Failed to generate PDF');
        }
        return r.json();
    },

    // ── Quote Responses ────────────────────────────────────────────────────
    getQuoteResponses: async () => {
        const { data, error } = await supabase.from('quote_responses').select('*, items:quote_response_items(*)').order('created_at', { ascending: false });
        if (error) throw new Error('Failed to fetch quote responses: ' + error.message);
        return keysToCamel(data || []);
    },
    createQuoteResponse: async (data: any) => {
        const { items, id: _frontendId, ...qrData } = data;
        const payload = keysToSnake(qrData);
        
        const { data: newQR, error } = await supabase.from('quote_responses').insert([payload]).select().single();
        if (error) throw new Error('Failed to create quote response: ' + error.message);
        
        if (items && items.length > 0) {
            const itemsPayload = items.map((item: any) => ({
                ...keysToSnake(item),
                quote_response_id: newQR.id
            }));
            const { error: itemsError } = await supabase.from('quote_response_items').insert(itemsPayload);
            if (itemsError) throw new Error('Failed to create quote response items: ' + itemsError.message);
        }
        return keysToCamel(newQR);
    },
    updateQuoteResponse: async (id: number, data: any) => {
        const { items, ...qrData } = data;
        const payload = keysToSnake(qrData);
        
        const { data: updatedQR, error } = await supabase.from('quote_responses').update(payload).eq('id', id).select().single();
        if (error) throw new Error('Failed to update quote response: ' + error.message);
        
        if (items) {
            await supabase.from('quote_response_items').delete().eq('quote_response_id', id);
            if (items.length > 0) {
                const itemsPayload = items.map((item: any) => {
                    const { id: _itemId, ...itemRest } = item;
                    return { ...keysToSnake(itemRest), quote_response_id: updatedQR.id };
                });
                const { error: itemsError } = await supabase.from('quote_response_items').insert(itemsPayload);
                if (itemsError) throw new Error('Failed to update quote response items: ' + itemsError.message);
            }
        }
        return keysToCamel(updatedQR);
    },
    deleteQuoteResponse: async (id: number) => sbDelete('quote_responses', id),

    // ── Purchase Orders ────────────────────────────────────────────────────
    getPurchaseOrders: async () => {
        const { data, error } = await supabase.from('purchase_orders').select('*, items:purchase_order_items(*)').order('created_at', { ascending: false });
        if (error) throw new Error('Failed to fetch purchase orders: ' + error.message);
        return keysToCamel(data || []);
    },
    createPurchaseOrder: async (data: any) => {
        const { items, id: _frontendId, ...poData } = data;
        const payload = keysToSnake(poData);
        
        const { data: newPO, error } = await supabase.from('purchase_orders').insert([payload]).select().single();
        if (error) throw new Error('Failed to create purchase order: ' + error.message);
        
        if (items && items.length > 0) {
            const itemsPayload = items.map((item: any) => ({
                ...keysToSnake(item),
                purchase_order_id: newPO.id
            }));
            const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsPayload);
            if (itemsError) throw new Error('Failed to create purchase order items: ' + itemsError.message);
        }
        return keysToCamel(newPO);
    },
    updatePurchaseOrder: async (id: number, data: any) => {
        const { items, ...poData } = data;
        const payload = keysToSnake(poData);
        
        const { data: updatedPO, error } = await supabase.from('purchase_orders').update(payload).eq('id', id).select().single();
        if (error) throw new Error('Failed to update purchase order: ' + error.message);
        
        if (items) {
            await supabase.from('purchase_order_items').delete().eq('purchase_order_id', id);
            if (items.length > 0) {
                const itemsPayload = items.map((item: any) => {
                    const { id: _itemId, ...itemRest } = item;
                    return { ...keysToSnake(itemRest), purchase_order_id: updatedPO.id };
                });
                const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsPayload);
                if (itemsError) throw new Error('Failed to update purchase order items: ' + itemsError.message);
            }
        }
        return keysToCamel(updatedPO);
    },
    deletePurchaseOrder: async (id: number) => sbDelete('purchase_orders', id),

    // ── Accounts Payable ───────────────────────────────────────────────────
    getAccountsPayable: async () => sbGet('accounts_payable'),
    createAccountPayable: async (data: any) => sbInsert('accounts_payable', data),
    updateAccountPayable: async (id: number, data: any) => sbUpdate('accounts_payable', id, data),
    deleteAccountPayable: async (id: number) => sbDelete('accounts_payable', id),

    // ── Goods Receipts ─────────────────────────────────────────────────────
    getGoodsReceipts: async () => {
        const { data, error } = await supabase.from('goods_receipts').select('*, items:goods_receipt_items(*)').order('creation_date', { ascending: false });
        if (error) throw new Error('Failed to fetch goods receipts: ' + error.message);
        return keysToCamel(data || []);
    },
    createGoodsReceipt: async (data: any) => {
        const { items, id: _frontendId, ...grData } = data;
        const payload = keysToSnake(grData);
        
        const { data: newGR, error } = await supabase.from('goods_receipts').insert([payload]).select().single();
        if (error) throw new Error('Failed to create goods receipt: ' + error.message);
        
        if (items && items.length > 0) {
            const itemsPayload = items.map((item: any) => ({
                ...keysToSnake(item),
                goods_receipt_id: newGR.id
            }));
            const { error: itemsError } = await supabase.from('goods_receipt_items').insert(itemsPayload);
            if (itemsError) throw new Error('Failed to create goods receipt items: ' + itemsError.message);
        }
        return keysToCamel(newGR);
    },
    updateGoodsReceipt: async (id: number, data: any) => {
        const { items, ...grData } = data;
        const payload = keysToSnake(grData);
        
        const { data: updatedGR, error } = await supabase.from('goods_receipts').update(payload).eq('id', id).select().single();
        if (error) throw new Error('Failed to update goods receipt: ' + error.message);
        
        if (items) {
            await supabase.from('goods_receipt_items').delete().eq('goods_receipt_id', id);
            if (items.length > 0) {
                const itemsPayload = items.map((item: any) => {
                    const { id: _itemId, ...itemRest } = item;
                    return { ...keysToSnake(itemRest), goods_receipt_id: updatedGR.id };
                });
                const { error: itemsError } = await supabase.from('goods_receipt_items').insert(itemsPayload);
                if (itemsError) throw new Error('Failed to update goods receipt items: ' + itemsError.message);
            }
        }
        return keysToCamel(updatedGR);
    },
    deleteGoodsReceipt: async (id: number) => sbDelete('goods_receipts', id),

    // ── Credit Notes ───────────────────────────────────────────────────────
    getCreditNotes: async () => {
        const { data, error } = await supabase.from('credit_notes').select('*, items:credit_note_items(*)').order('creation_date', { ascending: false });
        if (error) throw new Error('Failed to fetch credit notes: ' + error.message);
        return keysToCamel(data || []);
    },
    createCreditNote: async (data: any) => {
        const { items, id: _frontendId, ...cnData } = data;
        const payload = keysToSnake(cnData);
        
        const { data: newCN, error } = await supabase.from('credit_notes').insert([payload]).select().single();
        if (error) throw new Error('Failed to create credit note: ' + error.message);
        
        if (items && items.length > 0) {
            const itemsPayload = items.map((item: any) => ({
                ...keysToSnake(item),
                credit_note_id: newCN.id
            }));
            const { error: itemsError } = await supabase.from('credit_note_items').insert(itemsPayload);
            if (itemsError) throw new Error('Failed to create credit note items: ' + itemsError.message);
        }
        return keysToCamel(newCN);
    },
    updateCreditNote: async (id: number, data: any) => {
        const { items, ...cnData } = data;
        const payload = keysToSnake(cnData);
        
        const { data: updatedCN, error } = await supabase.from('credit_notes').update(payload).eq('id', id).select().single();
        if (error) throw new Error('Failed to update credit note: ' + error.message);
        
        if (items) {
            await supabase.from('credit_note_items').delete().eq('credit_note_id', id);
            if (items.length > 0) {
                const itemsPayload = items.map((item: any) => {
                    const { id: _itemId, ...itemRest } = item;
                    return { ...keysToSnake(itemRest), credit_note_id: updatedCN.id };
                });
                const { error: itemsError } = await supabase.from('credit_note_items').insert(itemsPayload);
                if (itemsError) throw new Error('Failed to update credit note items: ' + itemsError.message);
            }
        }
        return keysToCamel(updatedCN);
    },
    deleteCreditNote: async (id: number) => sbDelete('credit_notes', id),

    // ── Subcontracts ───────────────────────────────────────────────────────
    getSubcontracts: async () => sbGet('subcontracts'),
    createSubcontract: async (data: any) => sbInsert('subcontracts', data),
    updateSubcontract: async (id: number, data: any) => sbUpdate('subcontracts', id, data),

    // ── Suppliers ──────────────────────────────────────────────────────────
    getSuppliers: async () => {
        const data = await sbGet('suppliers');
        return data.map((camelResult: any) => {
            if ('bankAccount_2' in camelResult) { camelResult.bankAccount2 = camelResult.bankAccount_2; delete camelResult.bankAccount_2; }
            if ('bankAccount_2Details' in camelResult) { camelResult.bankAccount2Details = camelResult.bankAccount_2Details; delete camelResult.bankAccount_2Details; }
            return camelResult;
        });
    },
    createSupplier: async (data: any) => {
        const payload = keysToSnake(data);
        if ('bank_account2' in payload) { payload.bank_account_2 = payload.bank_account2; delete payload.bank_account2; }
        if ('bank_account2_details' in payload) { payload.bank_account_2_details = payload.bank_account2_details; delete payload.bank_account2_details; }
        
        const { data: result, error } = await supabase.from('suppliers').insert([payload]).select().single();
        if (error) throw new Error('Failed to create supplier: ' + error.message);
        
        const camelResult = keysToCamel(result);
        if ('bankAccount_2' in camelResult) { camelResult.bankAccount2 = camelResult.bankAccount_2; delete camelResult.bankAccount_2; }
        if ('bankAccount_2Details' in camelResult) { camelResult.bankAccount2Details = camelResult.bankAccount_2Details; delete camelResult.bankAccount_2Details; }
        return camelResult;
    },
    updateSupplier: async (id: number, data: any) => {
        const payload = keysToSnake(data);
        if ('bank_account2' in payload) { payload.bank_account_2 = payload.bank_account2; delete payload.bank_account2; }
        if ('bank_account2_details' in payload) { payload.bank_account_2_details = payload.bank_account2_details; delete payload.bank_account2_details; }

        const { data: result, error } = await supabase.from('suppliers').update(payload).eq('id', id).select().single();
        if (error) throw new Error('Failed to update supplier: ' + error.message);
        
        const camelResult = keysToCamel(result);
        if ('bankAccount_2' in camelResult) { camelResult.bankAccount2 = camelResult.bankAccount_2; delete camelResult.bankAccount_2; }
        if ('bankAccount_2Details' in camelResult) { camelResult.bankAccount2Details = camelResult.bankAccount_2Details; delete camelResult.bankAccount_2Details; }
        return camelResult;
    },
    deleteSupplier: async (id: number) => {
        const { data: result, error } = await supabase.from('suppliers').delete().eq('id', id).select().single();
        if (error) throw new Error('Failed to delete supplier: ' + error.message);
        
        const camelResult = keysToCamel(result);
        if ('bankAccount_2' in camelResult) { camelResult.bankAccount2 = camelResult.bankAccount_2; delete camelResult.bankAccount_2; }
        if ('bankAccount_2Details' in camelResult) { camelResult.bankAccount2Details = camelResult.bankAccount_2Details; delete camelResult.bankAccount_2Details; }
        return camelResult;
    },

    // ── Offers ─────────────────────────────────────────────────────────────
    getOffers: async () => {
        const { data, error } = await supabase.from('offers').select('*, prospect:prospects(*)').order('id', { ascending: false });
        if (error) throw new Error('API [offers]: Failed to fetch');
        const camelData = keysToCamel(data || []);
        return camelData.map((o: any) => ({
            ...o,
            amount: Number(o.amount ?? 0),
            budget: Number(o.budgetAmount ?? 0),
            budgetAmount: Number(o.budgetAmount ?? 0),
            prospectName: o.prospect?.company || o.prospect?.name || 'Prospecto desconocido'
        }));
    },
    createOffer: async (data: any) => {
        const { id, budget, prospectName, prospect, createdAt, ...rest } = data;
        const payload = { ...rest, budgetAmount: budget || rest.budgetAmount || 0 };
        const result = await sbInsert('offers', payload);
        return {
            ...result,
            budget: result.budgetAmount,
            prospectName: prospectName || prospect?.company || prospect?.name || 'N/A'
        };
    },
    updateOffer: async (id: number, data: any) => {
        const { id: _id, budget, prospectName, prospect, createdAt, ...rest } = data;
        const payload = { ...rest, budgetAmount: budget || rest.budgetAmount || 0 };
        const result = await sbUpdate('offers', id, payload);
        return {
            ...result,
            budget: result.budgetAmount,
            prospectName: prospectName || prospect?.company || prospect?.name || 'N/A'
        };
    },
    deleteOffer: async (id: number) => sbDelete('offers', id),

    // ── Change Orders ──────────────────────────────────────────────────────
    getChangeOrders: async () => sbGet('change_orders').then(data => data.map((co: any) => ({...co, amountImpact: Number(co.amountImpact ?? 0), budgetImpact: Number(co.budgetImpact ?? 0)}))),
    createChangeOrder: async (data: any) => sbInsert('change_orders', data),
    updateChangeOrder: async (id: number, data: any) => sbUpdate('change_orders', id, data),
    deleteChangeOrder: async (id: number) => sbDelete('change_orders', id),

    // ── Budgets ────────────────────────────────────────────────────────────
    getBudgets: async () => {
        const { data, error } = await supabase.from('budgets').select('*, activities:budget_activities(*, subActivities:budget_sub_activities(*))');
        if (error) throw new Error('API [budgets]: Failed to fetch: ' + error.message);
        return keysToCamel(data || []);
    },
    createBudget: async (data: any) => {
        const { activities, prospect, prospectName, ...budgetData } = data;
        const payload = keysToSnake(budgetData);

        const { data: newBudget, error } = await supabase
            .from('budgets')
            .insert([payload])
            .select()
            .single();
        if (error) throw new Error('Failed to create budget: ' + error.message);

        if (activities && activities.length > 0) {
            for (let i = 0; i < activities.length; i++) {
                const { subActivities, id: _actId, budgetId, budget_id, ...activityGroup } = activities[i];
                const actPayload = keysToSnake(activityGroup);
                actPayload.budget_id = newBudget.id;
                
                const { data: newActivity, error: actError } = await supabase
                    .from('budget_activities')
                    .insert([actPayload])
                    .select()
                    .single();
                if (actError) throw new Error('Failed to create budget activity: ' + actError.message);

                if (subActivities && subActivities.length > 0) {
                    const subsPayload = subActivities.map((sub: any) => {
                        const { id: _subId, activityId, activity_id, ...subRest } = sub;
                        return {
                            ...keysToSnake(subRest),
                            activity_id: newActivity.id
                        };
                    });
                    const { error: subError } = await supabase.from('budget_sub_activities').insert(subsPayload);
                    if (subError) throw new Error('Failed to create budget sub activities: ' + subError.message);
                }
            }
        }
        return keysToCamel(newBudget);
    },
    updateBudget: async (id: number, data: any) => {
        const { activities, prospect, prospectName, ...budgetData } = data;
        const payload = keysToSnake(budgetData);

        const { data: updatedBudget, error } = await supabase
            .from('budgets')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) throw new Error('Failed to update budget: ' + error.message);

        if (activities) {
            // Delete all activities (cascade deletes sub-activities)
            await supabase.from('budget_activities').delete().eq('budget_id', id);

            if (activities.length > 0) {
                for (let i = 0; i < activities.length; i++) {
                    const { subActivities, id: _actId, budgetId, budget_id, ...activityGroup } = activities[i];
                    const actPayload = keysToSnake(activityGroup);
                    actPayload.budget_id = updatedBudget.id;
                    
                    const { data: newActivity, error: actError } = await supabase
                        .from('budget_activities')
                        .insert([actPayload])
                        .select()
                        .single();
                    if (actError) throw new Error('Failed to create budget activity: ' + actError.message);

                    if (subActivities && subActivities.length > 0) {
                        const subsPayload = subActivities.map((sub: any) => {
                            const { id: _subId, activityId, activity_id, ...subRest } = sub;
                            return {
                                ...keysToSnake(subRest),
                                activity_id: newActivity.id
                            };
                        });
                        const { error: subError } = await supabase.from('budget_sub_activities').insert(subsPayload);
                        if (subError) throw new Error('Failed to create budget sub activities: ' + subError.message);
                    }
                }
            }
        }
        return keysToCamel(updatedBudget);
    },
    deleteBudget: async (id: number) => sbDelete('budgets', id),

    // ── Materials ──────────────────────────────────────────────────────────
    getMaterials: async () => {
        const { data, error } = await supabase.from('materials').select('*');
        if (error) throw new Error('API [materials]: Failed to fetch');
        const arr = data || [];
        arr.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        return arr.map((m: any) => ({
            ...m,
            unitCost: Number(m.unitCost ?? m.unit_cost ?? 0),
            quantity: Number(m.quantity ?? 0),
            lastUpdated: m.lastUpdated ?? m.last_updated,
        }));
    },
    createMaterial: async (data: any) => {
        const payload: any = { ...data };
        if (payload.unitCost !== undefined) { payload.unit_cost = payload.unitCost; delete payload.unitCost; }
        if (payload.lastUpdated !== undefined) { payload.last_updated = payload.lastUpdated; delete payload.lastUpdated; }
        const { data: result, error } = await supabase.from('materials').insert([payload]).select().single();
        if (error) throw new Error('Failed to create material: ' + error.message);
        return { ...result, unitCost: result.unit_cost, lastUpdated: result.last_updated };
    },
    updateMaterial: async (id: number, data: any) => {
        const payload: any = { ...data };
        if (payload.unitCost !== undefined) { payload.unit_cost = payload.unitCost; delete payload.unitCost; }
        if (payload.lastUpdated !== undefined) { payload.last_updated = payload.lastUpdated; delete payload.lastUpdated; }
        const { data: result, error } = await supabase.from('materials').update(payload).eq('id', id).select().single();
        if (error) throw new Error('Failed to update material: ' + error.message);
        return { ...result, unitCost: result.unit_cost, lastUpdated: result.last_updated };
    },
    deleteMaterial: async (id: number) => {
        const { data: result, error } = await supabase.from('materials').delete().eq('id', id).select().single();
        if (error) throw new Error('Failed to delete material: ' + error.message);
        return result;
    },
    searchMaterials: async (query: string) => {
        const { data, error } = await supabase.from('materials').select('*').ilike('name', `%${query}%`);
        if (error) throw new Error('API [materials/search]: Failed to fetch');
        const arr = data || [];
        arr.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        return arr.map((m: any) => ({
            ...m,
            unitCost: Number(m.unitCost ?? m.unit_cost ?? 0),
            quantity: Number(m.quantity ?? 0),
            lastUpdated: m.lastUpdated ?? m.last_updated,
        }));
    },

    // ── Service Items (Sub Contratos) ──────────────────────────────────────
    getServiceItems: async () => {
        const { data, error } = await supabase.from('service_items').select('*');
        if (error) throw new Error('API [service-items]: Failed to fetch');
        return (data || []).map((s: any) => ({
            ...s,
            unitCost: Number(s.unitCost ?? s.unit_cost ?? 0),
        }));
    },
    createServiceItem: async (data: any) => {
        const payload: any = { ...data };
        if (payload.unitCost !== undefined) { payload.unit_cost = payload.unitCost; delete payload.unitCost; }
        const { data: result, error } = await supabase.from('service_items').insert([payload]).select().single();
        if (error) throw new Error('Failed to create service item: ' + error.message);
        return { ...result, unitCost: result.unit_cost };
    },
    updateServiceItem: async (id: number, data: any) => {
        const payload: any = { ...data };
        if (payload.unitCost !== undefined) { payload.unit_cost = payload.unitCost; delete payload.unitCost; }
        const { data: result, error } = await supabase.from('service_items').update(payload).eq('id', id).select().single();
        if (error) throw new Error('Failed to update service item: ' + error.message);
        return { ...result, unitCost: result.unit_cost };
    },
    deleteServiceItem: async (id: number) => {
        const { data: result, error } = await supabase.from('service_items').delete().eq('id', id).select().single();
        if (error) throw new Error('Failed to delete service item: ' + error.message);
        return result;
    },

    // ── Labor Items (Mano de Obra) ─────────────────────────────────────────
    getLaborItems: async () => {
        const { data, error } = await supabase.from('labor_items').select('*');
        if (error) throw new Error('API [labor-items]: Failed to fetch');
        return keysToCamel(data || []).map((l: any) => ({
            ...l,
            hourlyRate: Number(l.hourlyRate ?? 0),
        }));
    },
    createLaborItem: async (data: any) => {
        const payload = keysToSnake(data);
        const { data: result, error } = await supabase.from('labor_items').insert([payload]).select().single();
        if (error) throw new Error('Failed to create labor item: ' + error.message);
        return keysToCamel(result);
    },
    updateLaborItem: async (id: number, data: any) => {
        const payload = keysToSnake(data);
        const { data: result, error } = await supabase.from('labor_items').update(payload).eq('id', id).select().single();
        if (error) throw new Error('Failed to update labor item: ' + error.message);
        return keysToCamel(result);
    },
    deleteLaborItem: async (id: number) => {
        const { data: result, error } = await supabase.from('labor_items').delete().eq('id', id).select().single();
        if (error) throw new Error('Failed to delete labor item: ' + error.message);
        return keysToCamel(result);
    },

    // ── Recurring Order Templates ──────────────────────────────────────────
    getRecurringOrderTemplates: async () => {
        const { data, error } = await supabase.from('recurring_order_templates').select('*');
        if (error) throw new Error('API [recurring-order-templates]: Failed to fetch');
        return (data || []).map((t: any) => ({ ...t, items: t.items ?? [] }));
    },
    createRecurringOrderTemplate: async (data: any) => {
        const payload: any = { ...data };
        const { data: result, error } = await supabase.from('recurring_order_templates').insert([payload]).select().single();
        if (error) throw new Error('Failed to create recurring order template: ' + error.message);
        return { ...result, items: result.items ?? [] };
    },
    updateRecurringOrderTemplate: async (id: number, data: any) => {
        const payload: any = { ...data };
        const { data: result, error } = await supabase.from('recurring_order_templates').update(payload).eq('id', id).select().single();
        if (error) throw new Error('Failed to update recurring order template: ' + error.message);
        return { ...result, items: result.items ?? [] };
    },
    deleteRecurringOrderTemplate: async (id: number) => {
        const { data: result, error } = await supabase.from('recurring_order_templates').delete().eq('id', id).select().single();
        if (error) throw new Error('Failed to delete recurring order template: ' + error.message);
        return result;
    },

    // ── Predetermined Activities ───────────────────────────────────────────
    getPredeterminedActivities: async () => {
        const { data, error } = await supabase.from('predetermined_activities')
            .select(`*, predetermined_sub_activities (*)`);
        if (error) throw new Error('API [predetermined-activities]: Failed to fetch: ' + error.message);
        return (data || []).map((a: any) => ({
            ...a,
            baseUnit: a.base_unit ?? a.baseUnit,
            subActivities: (a.predetermined_sub_activities || []).map((sub: any) => ({
                ...sub,
                quantityPerBaseUnit: Number(sub.quantity_per_base_unit ?? sub.quantityPerBaseUnit ?? 0),
            })),
        }));
    },
    createPredeterminedActivity: async (data: any) => {
        const { subActivities, baseUnit, ...activityData } = data;
        const payload = { ...activityData, base_unit: baseUnit ?? data.base_unit };
        
        const { data: result, error } = await supabase
            .from('predetermined_activities')
            .insert([payload])
            .select()
            .single();
        if (error) throw new Error('Failed to create predetermined activity: ' + error.message);
        
        if (subActivities && subActivities.length > 0) {
            const subsPayload = subActivities.map((sub: any) => ({
                 predetermined_activity_id: result.id,
                 item_number: sub.itemNumber ?? sub.item_number,
                 type: sub.type,
                 description: sub.description,
                 quantity_per_base_unit: sub.quantityPerBaseUnit ?? sub.quantity_per_base_unit ?? 0,
                 unit: sub.unit,
                 notes: sub.notes
            }));
            const { error: subError } = await supabase.from('predetermined_sub_activities').insert(subsPayload);
            if (subError) throw new Error('Failed to create predetermined sub activities: ' + subError.message);
        }
        
        return { ...result, subActivities: subActivities || [] };
    },
    updatePredeterminedActivity: async (id: number, data: any) => {
        const { subActivities, baseUnit, ...activityData } = data;
        const payload = { ...activityData, base_unit: baseUnit ?? data.base_unit };
        
        const { data: result, error } = await supabase
            .from('predetermined_activities')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) throw new Error('Failed to update predetermined activity: ' + error.message);

        // Replace sub activities: delete old ones and insert new ones
        await supabase.from('predetermined_sub_activities').delete().eq('predetermined_activity_id', id);
        
        if (subActivities && subActivities.length > 0) {
            const subsPayload = subActivities.map((sub: any) => ({
                 predetermined_activity_id: id,
                 item_number: sub.itemNumber ?? sub.item_number,
                 type: sub.type,
                 description: sub.description,
                 quantity_per_base_unit: sub.quantityPerBaseUnit ?? sub.quantity_per_base_unit ?? 0,
                 unit: sub.unit,
                 notes: sub.notes
            }));
            const { error: subError } = await supabase.from('predetermined_sub_activities').insert(subsPayload);
            if (subError) throw new Error('Failed to update predetermined sub activities: ' + subError.message);
        }
        
        return { ...result, subActivities: subActivities || [] };
    },
    deletePredeterminedActivity: async (id: number) => {
        // Cascade delete will handle predetermined_sub_activities
        const { data: result, error } = await supabase.from('predetermined_activities').delete().eq('id', id).select().single();
        if (error) throw new Error('Failed to delete predetermined activity: ' + error.message);
        return result;
    },

    // ── Bonos ──────────────────────────────────────────────────────────────
    getBonos: async () => sbGet('bonos'),
    createBono: async (data: any) => sbInsert('bonos', data),
    procesarTransaccionEntregado: async (bonoId: number | null, bonoData: any, prospectData: any) => {
        const r = await fetchWithAuth(`${API_URL}/bonos/transaccion-entregado`, { 
            method: 'POST', 
            body: JSON.stringify({ bonoId, bonoData, prospectData }) 
        });
        const result = await r.json();
        if (!r.ok) {
            throw new Error(result.error || 'Failed to process transaction');
        }
        return result;
    },
    updateBono: async (id: number, data: any) => sbUpdate('bonos', id, data),
    deleteBono: async (id: number) => sbDelete('bonos', id),
    /** Transacción atómica: En APC (Bono + Prospecto + Oferta) */
    procesarTransaccionEnAPC: async (bonoId: number | null, bonoData: any, prospectData: any, offerData?: any) => {
        const r = await fetchWithAuth(`${API_URL}/bonos/transaccion-en-apc`, {
            method: 'POST',
            body: JSON.stringify({ bonoId, bonoData, prospectData, offerData })
        });
        const result = await r.json();
        if (!r.ok) throw new Error(result.error || 'Failed to process En APC transaction');
        return result;
    },
    /** Transacción atómica: Formalizado/Construcción (Oferta→Aprobación + Proyecto + CxC) */
    procesarTransaccionFormalizado: async (bonoId: number | null, offerId: number | null, prospectData: any, projectData?: any, arData?: any) => {
        const r = await fetchWithAuth(`${API_URL}/bonos/transaccion-formalizado`, {
            method: 'POST',
            body: JSON.stringify({ bonoId, offerId, prospectData, projectData, arData })
        });
        const result = await r.json();
        if (!r.ok) throw new Error(result.error || 'Failed to process Formalizado transaction');
        return result;
    },

    // ── Administrative Budgets & Expenses ──────────────────────────────────
    getAdministrativeBudgets: async () => sbGet('administrative_budgets'),
    createAdministrativeBudget: async (data: any) => sbInsert('administrative_budgets', data),
    updateAdministrativeBudget: async (id: number, data: any) => sbUpdate('administrative_budgets', id, data),
    getAdministrativeExpenses: async () => sbGet('administrative_expenses'),
    createAdministrativeExpense: async (data: any) => sbInsert('administrative_expenses', data),

    // ── Company Info ───────────────────────────────────────────────────────
    getCompanyInfo: async () => {
        const { data, error } = await supabase.from('company_info').select('*').limit(1).single();
        if (error && error.code !== 'PGRST116') throw new Error('API [company-info]: Failed to fetch ' + error.message);
        return data ? keysToCamel(data) : null;
    },
    updateCompanyInfo: async (data: any) => {
        const payload = keysToSnake(data);
        const id = payload.id || 1;
        const { data: result, error } = await supabase.from('company_info').upsert({ id, ...payload }).select().single();
        if (error) throw new Error('Failed to update company info ' + error.message);
        return keysToCamel(result);
    },

    // ── Pre-Operative Expenses ─────────────────────────────────────────────
    getPreOpRubros: async () => sbGet('pre_op_rubros'),
    createPreOpRubro: async (data: any) => sbInsert('pre_op_rubros', data),
    updatePreOpRubro: async (id: number, data: any) => sbUpdate('pre_op_rubros', id, data),
    getPreOpExpenses: async () => sbGet('pre_op_expenses'),
    createPreOpExpense: async (data: any) => sbInsert('pre_op_expenses', data),
    updatePreOpExpense: async (id: number, data: any) => sbUpdate('pre_op_expenses', id, data),

    // ── Document Notes ────────────────────────────────────────────────────
    getDocumentNotes: async (): Promise<{ [key: string]: string[] }> => {
        try {
            const r = await fetchWithAuth(`${API_URL}/document-notes`);
            if (!r.ok) throw new Error('API unavailable');
            const data = await r.json();
            return data?.notes ?? {};
        } catch {
            // Fallback: read from localStorage if back-end route is not deployed yet
            const stored = localStorage.getItem('flowerp_document_notes');
            return stored ? JSON.parse(stored) : {};
        }
    },
    saveDocumentNotes: async (notes: { [key: string]: string[] }): Promise<void> => {
        // Persist to localStorage immediately (offline-safe)
        localStorage.setItem('flowerp_document_notes', JSON.stringify(notes));
        try {
            const r = await fetchWithAuth(`${API_URL}/document-notes`, {
                method: 'POST',
                body: JSON.stringify({ notes }),
            });
            if (!r.ok) throw new Error('Failed to save document notes');
        } catch {
            // Silently succeed – data is in localStorage and will sync later
            console.warn('Document notes saved to localStorage only (API unavailable).');
        }
    },
};
