import fs from 'fs';

let content = fs.readFileSync('services/apiService.ts', 'utf8');

// Use matching functions simply finding START and END substrings to avoid regex formatting issues

const blocks = [
  {
    table: 'service_requests',
    startFn: 'getServiceRequests: async () => {',
    endFn: 'generateServiceRequestPdf: async (id: number, companyInfo: any) => {',
    replacement: `getServiceRequests: async () => sbGet('service_requests'),
    createServiceRequest: async (data: any) => sbInsert('service_requests', data),
    updateServiceRequest: async (id: number, data: any) => sbUpdate('service_requests', id, data),
    deleteServiceRequest: async (id: number) => sbDelete('service_requests', id),
    generateServiceRequestPdf: async (id: number, companyInfo: any) => {`
  },
  {
    table: 'quote_responses',
    startFn: 'getQuoteResponses: async () => {',
    endFn: '// ── Purchase Orders',
    replacement: `getQuoteResponses: async () => sbGet('quote_responses'),
    createQuoteResponse: async (data: any) => sbInsert('quote_responses', data),
    updateQuoteResponse: async (id: number, data: any) => sbUpdate('quote_responses', id, data),
    deleteQuoteResponse: async (id: number) => sbDelete('quote_responses', id),

    // ── Purchase Orders`
  },
  {
    table: 'purchase_orders',
    startFn: 'getPurchaseOrders: async () => {',
    endFn: '// ── Accounts Payable',
    replacement: `getPurchaseOrders: async () => sbGet('purchase_orders'),
    createPurchaseOrder: async (data: any) => sbInsert('purchase_orders', data),
    updatePurchaseOrder: async (id: number, data: any) => sbUpdate('purchase_orders', id, data),
    deletePurchaseOrder: async (id: number) => sbDelete('purchase_orders', id),

    // ── Accounts Payable`
  },
  {
    table: 'goods_receipts',
    startFn: 'getGoodsReceipts: async () => {',
    endFn: '// ── Credit Notes',
    replacement: `getGoodsReceipts: async () => sbGet('goods_receipts'),
    createGoodsReceipt: async (data: any) => sbInsert('goods_receipts', data),
    updateGoodsReceipt: async (id: number, data: any) => sbUpdate('goods_receipts', id, data),
    deleteGoodsReceipt: async (id: number) => sbDelete('goods_receipts', id),

    // ── Credit Notes`
  },
  {
    table: 'credit_notes',
    startFn: 'getCreditNotes: async () => {',
    endFn: '// ── Subcontracts',
    replacement: `getCreditNotes: async () => sbGet('credit_notes'),
    createCreditNote: async (data: any) => sbInsert('credit_notes', data),
    updateCreditNote: async (id: number, data: any) => sbUpdate('credit_notes', id, data),
    deleteCreditNote: async (id: number) => sbDelete('credit_notes', id),

    // ── Subcontracts`
  },
  {
    table: 'offers',
    startFn: 'getOffers: async () => {',
    endFn: '// ── Change Orders',
    replacement: `getOffers: async () => sbGet('offers', q => q.order('id', {ascending: false})).then(data => data.map((o: any) => ({ ...o, amount: Number(o.amount ?? 0), budget: Number(o.budget ?? 0), budgetAmount: Number(o.budgetAmount ?? 0) }))),
    createOffer: async (data: any) => sbInsert('offers', data),
    updateOffer: async (id: number, data: any) => sbUpdate('offers', id, data),
    deleteOffer: async (id: number) => sbDelete('offers', id),

    // ── Change Orders`
  },
  {
    table: 'change_orders',
    startFn: 'getChangeOrders: async () => {',
    endFn: '// ── Budgets',
    replacement: `getChangeOrders: async () => sbGet('change_orders').then(data => data.map((co: any) => ({...co, amountImpact: Number(co.amountImpact ?? 0), budgetImpact: Number(co.budgetImpact ?? 0)}))),
    createChangeOrder: async (data: any) => sbInsert('change_orders', data),
    updateChangeOrder: async (id: number, data: any) => sbUpdate('change_orders', id, data),
    deleteChangeOrder: async (id: number) => sbDelete('change_orders', id),

    // ── Budgets`
  },
  {
    table: 'budgets',
    startFn: 'getBudgets: async () => {',
    endFn: '// ── Materials',
    replacement: `getBudgets: async () => {
        const { data, error } = await supabase.from('budgets').select('*, activities:budget_activities(*, subActivities:budget_sub_activities(*))');
        if (error) throw new Error('API [budgets]: Failed to fetch: ' + error.message);
        return keysToCamel(data || []);
    },
    createBudget: async (data: any) => sbInsert('budgets', data),
    updateBudget: async (id: number, data: any) => sbUpdate('budgets', id, data),
    deleteBudget: async (id: number) => sbDelete('budgets', id),

    // ── Materials`
  }
];

let changed = false;
for (const b of blocks) {
  const i1 = content.indexOf(b.startFn);
  const i2 = content.indexOf(b.endFn, i1);
  if (i1 !== -1 && i2 !== -1) {
    content = content.substring(0, i1) + b.replacement + content.substring(i2 + b.endFn.length);
    console.log("Replaced", b.table);
    changed = true;
  } else {
    console.log("Failed to find", b.table, i1, i2);
  }
}

// And predetermined activities error message
if (content.includes("if (error) throw new Error('API [predetermined-activities]: Failed to fetch');")) {
    content = content.replace("if (error) throw new Error('API [predetermined-activities]: Failed to fetch');", "if (error) throw new Error('API [predetermined-activities]: Failed to fetch: ' + error.message);");
    console.log("Replaced predetermined_activities error message");
    changed = true;
}

if (changed) fs.writeFileSync('services/apiService.ts', content);
