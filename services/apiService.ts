import { supabase } from '../lib/supabase';

const API_URL = 'http://localhost:3001/api';

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

// ─── Supabase GET helper ──────────────────────────────────────────────────
const sbGet = async (table: string, extraQuery?: (q: any) => any) => {
    const endpoint = table.replace(/_/g, '-');
    const r = await fetchWithAuth(`${API_URL}/${endpoint}`);
    if (!r.ok) throw new Error(`API [${endpoint}]: Failed to fetch`);
    return r.json();
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
    createRole: async (role: any) => {
        const r = await fetchWithAuth(`${API_URL}/roles`, { method: 'POST', body: JSON.stringify(role) });
        if (!r.ok) throw new Error('Failed to create role');
        return r.json();
    },
    updateRole: async (id: number, role: any) => {
        const r = await fetchWithAuth(`${API_URL}/roles/${id}`, { method: 'PUT', body: JSON.stringify(role) });
        if (!r.ok) throw new Error('Failed to update role');
        return r.json();
    },
    deleteRole: async (id: number) => {
        const r = await fetchWithAuth(`${API_URL}/roles/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Failed to delete role');
        return r.json();
    },

    // ── Projects ───────────────────────────────────────────────────────────
    getProjects: async () => sbGet('projects'),
    createProject: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/projects`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create project');
        return r.json();
    },

    // ── Accounts Receivable ────────────────────────────────────────────────
    getAccountsReceivable: async () => sbGet('accounts_receivable'),
    createAccountReceivable: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/accounts-receivable`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create account receivable');
        return r.json();
    },
    updateAccountReceivable: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/accounts-receivable/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update account receivable');
        return r.json();
    },

    // ── Prospects ──────────────────────────────────────────────────────────
    getProspects: async () => sbGet('prospects'),
    checkDuplicateProspect: async (name: string): Promise<{ exists: boolean; prospect: any | null }> => {
        const r = await fetchWithAuth(`${API_URL}/prospects/check-duplicate?name=${encodeURIComponent(name)}`);
        if (!r.ok) return { exists: false, prospect: null };
        return r.json();
    },
    createProspect: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/prospects`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) { const t = await r.text(); throw new Error(`Failed to create prospect: ${r.status} - ${t}`); }
        return r.json();
    },
    updateProspect: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/prospects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update prospect');
        return r.json();
    },
    deleteProspect: async (id: number) => {
        const r = await fetchWithAuth(`${API_URL}/prospects/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Failed to delete prospect');
        return r.json();
    },

    // ── Service Requests ───────────────────────────────────────────────────
    getServiceRequests: async () => {
        const r = await fetchWithAuth(`${API_URL}/service-requests`);
        if (!r.ok) throw new Error('API [service-requests]: Failed to fetch');
        const data = await r.json();
        return (data ?? []).map((sr: any) => ({ ...sr, items: sr.items ?? [] }));
    },
    createServiceRequest: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/service-requests`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) { const t = await r.text(); throw new Error(`Failed to create service request: ${t}`); }
        return r.json();
    },
    updateServiceRequest: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/service-requests/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update service request');
        return r.json();
    },
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
        const r = await fetchWithAuth(`${API_URL}/quote-responses`);
        if (!r.ok) throw new Error('API [quote-responses]: Failed to fetch');
        const data = await r.json();
        return (data ?? []).map((qr: any) => ({ ...qr, items: qr.items ?? [] }));
    },
    createQuoteResponse: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/quote-responses`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create quote response');
        return r.json();
    },
    updateQuoteResponse: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/quote-responses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update quote response');
        return r.json();
    },

    // ── Purchase Orders ────────────────────────────────────────────────────
    getPurchaseOrders: async () => {
        const r = await fetchWithAuth(`${API_URL}/purchase-orders`);
        if (!r.ok) throw new Error('API [purchase-orders]: Failed to fetch');
        const data = await r.json();
        return (data ?? []).map((po: any) => ({ ...po, items: po.items ?? [] }));
    },
    createPurchaseOrder: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/purchase-orders`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create purchase order');
        return r.json();
    },
    updatePurchaseOrder: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed to update purchase order'); }
        return r.json();
    },

    // ── Accounts Payable ───────────────────────────────────────────────────
    getAccountsPayable: async () => sbGet('accounts_payable'),
    createAccountPayable: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/accounts-payable`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create account payable');
        return r.json();
    },
    updateAccountPayable: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/accounts-payable/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update account payable');
        return r.json();
    },
    deleteAccountPayable: async (id: number) => {
        const r = await fetchWithAuth(`${API_URL}/accounts-payable/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Failed to delete account payable');
        return r.json();
    },

    // ── Goods Receipts ─────────────────────────────────────────────────────
    getGoodsReceipts: async () => {
        const r = await fetchWithAuth(`${API_URL}/goods-receipts`);
        if (!r.ok) throw new Error('API [goods-receipts]: Failed to fetch');
        const data = await r.json();
        return (data ?? []).map((gr: any) => ({ ...gr, items: gr.items ?? [] }));
    },
    createGoodsReceipt: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/goods-receipts`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create goods receipt');
        return r.json();
    },
    updateGoodsReceipt: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/goods-receipts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update goods receipt');
        return r.json();
    },
    deleteGoodsReceipt: async (id: number) => {
        const r = await fetchWithAuth(`${API_URL}/goods-receipts/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Failed to delete goods receipt');
        return r.json();
    },

    // ── Credit Notes ───────────────────────────────────────────────────────
    getCreditNotes: async () => {
        const r = await fetchWithAuth(`${API_URL}/credit-notes`);
        if (!r.ok) throw new Error('API [credit-notes]: Failed to fetch');
        const data = await r.json();
        return (data ?? []).map((cn: any) => ({ ...cn, items: cn.items ?? [] }));
    },
    createCreditNote: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/credit-notes`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create credit note');
        return r.json();
    },
    updateCreditNote: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/credit-notes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update credit note');
        return r.json();
    },

    // ── Subcontracts ───────────────────────────────────────────────────────
    getSubcontracts: async () => sbGet('subcontracts'),
    createSubcontract: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/subcontracts`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create subcontract');
        return r.json();
    },
    updateSubcontract: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/subcontracts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update subcontract');
        return r.json();
    },

    // ── Suppliers ──────────────────────────────────────────────────────────
    getSuppliers: async () => sbGet('suppliers'),
    createSupplier: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/suppliers`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create supplier');
        return r.json();
    },
    updateSupplier: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update supplier');
        return r.json();
    },
    deleteSupplier: async (id: number) => {
        const r = await fetchWithAuth(`${API_URL}/suppliers/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Failed to delete supplier');
        return r.json();
    },

    // ── Offers ─────────────────────────────────────────────────────────────
    getOffers: async () => {
        const r = await fetchWithAuth(`${API_URL}/offers`);
        if (!r.ok) throw new Error('API [offers]: Failed to fetch');
        const data = await r.json();
        return (data ?? []).map((o: any) => ({
            ...o,
            amount: Number(o.amount ?? 0),
            budget: Number(o.budget ?? 0),
            budgetAmount: Number(o.budgetAmount ?? o.budget_amount ?? 0),
        }));
    },
    createOffer: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/offers`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create offer');
        const o = await r.json();
        return { ...o, amount: Number(o.amount), budget: Number(o.budget), budgetAmount: Number(o.budgetAmount) };
    },
    updateOffer: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/offers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update offer');
        const o = await r.json();
        return { ...o, amount: Number(o.amount), budget: Number(o.budget), budgetAmount: Number(o.budgetAmount) };
    },
    deleteOffer: async (id: number) => {
        const r = await fetchWithAuth(`${API_URL}/offers/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Failed to delete offer');
        return r.json();
    },

    // ── Change Orders ──────────────────────────────────────────────────────
    getChangeOrders: async () => {
        const r = await fetchWithAuth(`${API_URL}/change-orders`);
        if (!r.ok) throw new Error('API [change-orders]: Failed to fetch');
        const data = await r.json();
        return (data ?? []).map((co: any) => ({
            ...co,
            amountImpact: Number(co.amountImpact ?? co.amount_impact ?? 0),
            budgetImpact: Number(co.budgetImpact ?? co.budget_impact ?? 0),
        }));
    },
    createChangeOrder: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/change-orders`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create change order');
        const co = await r.json();
        return { ...co, amountImpact: Number(co.amountImpact), budgetImpact: Number(co.budgetImpact) };
    },
    updateChangeOrder: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/change-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update change order');
        const co = await r.json();
        return { ...co, amountImpact: Number(co.amountImpact), budgetImpact: Number(co.budgetImpact) };
    },

    // ── Budgets ────────────────────────────────────────────────────────────
    getBudgets: async () => {
        const r = await fetchWithAuth(`${API_URL}/budgets`);
        if (!r.ok) throw new Error('API [budgets]: Failed to fetch');
        const data = await r.json();
        return (data ?? []).map((b: any) => ({
            ...b,
            activities: (b.activities ?? []).map((act: any) => ({
                ...act,
                subActivities: act.subActivities ?? [],
            })),
        }));
    },
    createBudget: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/budgets`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) {
            const errorText = await r.text();
            throw new Error(`Failed to create budget: ${r.status} ${r.statusText} - ${errorText}`);
        }
        return r.json();
    },
    updateBudget: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update budget');
        return r.json();
    },
    deleteBudget: async (id: number) => {
        const r = await fetchWithAuth(`${API_URL}/budgets/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Failed to delete budget');
        return r.json();
    },

    // ── Materials ──────────────────────────────────────────────────────────
    getMaterials: async () => {
        const r = await fetchWithAuth(`${API_URL}/materials`);
        if (!r.ok) throw new Error('API [materials]: Failed to fetch');
        const raw = await r.json();
        const data = Array.isArray(raw) ? raw : [];
        // Ordenar alfabéticamente
        data.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        return data.map((m: any) => ({
            ...m,
            unitCost: Number(m.unitCost ?? m.unit_cost ?? 0),
            quantity: Number(m.quantity ?? 0),
            lastUpdated: m.lastUpdated ?? m.last_updated,
        }));
    },
    createMaterial: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/materials`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create material');
        return r.json();
    },
    updateMaterial: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update material');
        return r.json();
    },
    deleteMaterial: async (id: number) => {
        const r = await fetchWithAuth(`${API_URL}/materials/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Failed to delete material');
        return r.json();
    },
    searchMaterials: async (query: string) => {
        const r = await fetchWithAuth(`${API_URL}/materials/search?q=${encodeURIComponent(query)}`);
        if (!r.ok) throw new Error('API [materials/search]: Failed to fetch');
        const raw = await r.json();
        const data = Array.isArray(raw) ? raw : [];
        data.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        return data.map((m: any) => ({
            ...m,
            unitCost: Number(m.unitCost ?? m.unit_cost ?? 0),
            quantity: Number(m.quantity ?? 0),
            lastUpdated: m.lastUpdated ?? m.last_updated,
        }));
    },

    // ── Service Items (Sub Contratos) ──────────────────────────────────────
    getServiceItems: async () => {
        const r = await fetchWithAuth(`${API_URL}/service-items`);
        if (!r.ok) throw new Error('API [service-items]: Failed to fetch');
        const data = await r.json();
        return (data ?? []).map((s: any) => ({
            ...s,
            unitCost: Number(s.unitCost ?? s.unit_cost ?? 0),
        }));
    },
    createServiceItem: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/service-items`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create service item');
        return r.json();
    },
    updateServiceItem: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/service-items/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update service item');
        return r.json();
    },
    deleteServiceItem: async (id: number) => {
        const r = await fetchWithAuth(`${API_URL}/service-items/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Failed to delete service item');
        return r.json();
    },

    // ── Labor Items (Mano de Obra) ─────────────────────────────────────────
    getLaborItems: async () => {
        const r = await fetchWithAuth(`${API_URL}/labor-items`);
        if (!r.ok) throw new Error('API [labor-items]: Failed to fetch');
        const data = await r.json();
        return (data ?? []).map((l: any) => ({
            ...l,
            hourlyRate: Number(l.hourlyRate ?? l.hourly_rate ?? 0),
        }));
    },
    createLaborItem: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/labor-items`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create labor item');
        return r.json();
    },
    updateLaborItem: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/labor-items/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update labor item');
        return r.json();
    },
    deleteLaborItem: async (id: number) => {
        const r = await fetchWithAuth(`${API_URL}/labor-items/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Failed to delete labor item');
        return r.json();
    },

    // ── Recurring Order Templates ──────────────────────────────────────────
    getRecurringOrderTemplates: async () => {
        const r = await fetchWithAuth(`${API_URL}/recurring-order-templates`);
        if (!r.ok) throw new Error('API [recurring-order-templates]: Failed to fetch');
        const data = await r.json();
        return (data ?? []).map((t: any) => ({ ...t, items: t.items ?? [] }));
    },
    createRecurringOrderTemplate: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/recurring-order-templates`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create recurring order template');
        return r.json();
    },
    updateRecurringOrderTemplate: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/recurring-order-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update recurring order template');
        return r.json();
    },
    deleteRecurringOrderTemplate: async (id: number) => {
        const r = await fetchWithAuth(`${API_URL}/recurring-order-templates/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Failed to delete recurring order template');
        return r.json();
    },

    // ── Predetermined Activities ───────────────────────────────────────────
    getPredeterminedActivities: async () => {
        const r = await fetchWithAuth(`${API_URL}/predetermined-activities`);
        if (!r.ok) throw new Error('API [predetermined-activities]: Failed to fetch');
        const data = await r.json();
        return (data ?? []).map((a: any) => ({
            ...a,
            baseUnit: a.baseUnit ?? a.base_unit,
            subActivities: (a.subActivities ?? []).map((sub: any) => ({
                ...sub,
                quantityPerBaseUnit: Number(sub.quantityPerBaseUnit ?? sub.quantity_per_base_unit ?? 0),
            })),
        }));
    },
    createPredeterminedActivity: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/predetermined-activities`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create predetermined activity');
        return r.json();
    },
    updatePredeterminedActivity: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/predetermined-activities/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update predetermined activity');
        return r.json();
    },
    deletePredeterminedActivity: async (id: number) => {
        const r = await fetchWithAuth(`${API_URL}/predetermined-activities/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Failed to delete predetermined activity');
        return r.json();
    },

    // ── Bonos ──────────────────────────────────────────────────────────────
    getBonos: async () => sbGet('bonos'),
    createBono: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/bonos`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create bono');
        return r.json();
    },
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
    updateBono: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/bonos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update bono');
        return r.json();
    },
    deleteBono: async (id: number) => {
        const r = await fetchWithAuth(`${API_URL}/bonos/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Failed to delete bono');
        return r.json();
    },
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
    createAdministrativeBudget: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/administrative-budgets`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create administrative budget');
        return r.json();
    },
    updateAdministrativeBudget: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/administrative-budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update administrative budget');
        return r.json();
    },
    getAdministrativeExpenses: async () => sbGet('administrative_expenses'),
    createAdministrativeExpense: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/administrative-expenses`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create administrative expense');
        return r.json();
    },

    // ── Company Info ───────────────────────────────────────────────────────
    getCompanyInfo: async () => {
        const r = await fetchWithAuth(`${API_URL}/company-info`);
        if (!r.ok) throw new Error('API [company-info]: Failed to fetch');
        const data = await r.json();
        return (data && data.length > 0) ? data[0] : null;
    },
    updateCompanyInfo: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/company-info`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update company info');
        return r.json();
    },

    // ── Pre-Operative Expenses ─────────────────────────────────────────────
    getPreOpRubros: async () => sbGet('pre_op_rubros'),
    createPreOpRubro: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/pre-op-rubros`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create pre-op rubro');
        return r.json();
    },
    updatePreOpRubro: async (id: number, data: any) => {
        const r = await fetchWithAuth(`${API_URL}/pre-op-rubros/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to update pre-op rubro');
        return r.json();
    },
    getPreOpExpenses: async () => sbGet('pre_op_expenses'),
    createPreOpExpense: async (data: any) => {
        const r = await fetchWithAuth(`${API_URL}/pre-op-expenses`, { method: 'POST', body: JSON.stringify(data) });
        if (!r.ok) throw new Error('Failed to create pre-op expense');
        return r.json();
    },

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
