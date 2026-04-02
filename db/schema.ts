import { pgTable, serial, text, integer, timestamp, numeric, boolean, jsonb, date, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';


// Roles Table
export const roles = pgTable('roles', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    name: text('name').notNull(),
    description: text('description'),
    isDefault: boolean('is_default').default(false),
    permissions: jsonb('permissions').notNull().default({}),
    maxItemOveragePercentage: numeric('max_item_overage_percentage'),
    maxProjectOveragePercentage: numeric('max_project_overage_percentage'),
});

// Users Table
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    name: text('name').notNull(),
    email: text('email').unique().notNull(),
    avatar: text('avatar'),
    status: text('status').notNull().default('Active'),
    individualPermissions: jsonb('individual_permissions').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// User Roles Junction Table
export const userRoles = pgTable('user_roles', {
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    roleId: integer('role_id').references(() => roles.id, { onDelete: 'cascade' }),
}, (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
}));

// Prospects Table
export const prospects = pgTable('prospects', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    name: text('name').notNull(),
    company: text('company'),
    phone: text('phone'),
    email: text('email'),
    nextFollowUpDate: date('next_follow_up_date'),
    birthday: date('birthday'),
    spouseName: text('spouse_name'),
    children: text('children'),
    hobbies: text('hobbies'),
    followUps: jsonb('follow_ups').notNull().default([]),
    source: text('source').default('Manual'),
    sourceBonoId: integer('source_bono_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}).enableRLS();

// Budgets Table
export const budgets = pgTable('budgets', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    consecutiveNumber: text('consecutive_number').notNull(),
    prospectId: integer('prospect_id').references(() => prospects.id),
    date: date('date').notNull(),
    description: text('description'),
    indirectCosts: jsonb('indirect_costs').notNull().default({}),
    directCostTotal: numeric('direct_cost_total').notNull().default('0'),
    indirectCostTotal: numeric('indirect_cost_total').notNull().default('0'),
    total: numeric('total').notNull().default('0'),
    currency: text('currency').notNull().default('CRC'),
    taxRate: numeric('tax_rate').notNull().default('0'),
    finalTotal: numeric('final_total').notNull().default('0'),
    status: text('status').notNull().default('Draft'),
    isRecurring: boolean('is_recurring').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Budget Activities
export const budgetActivities = pgTable('budget_activities', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    budgetId: integer('budget_id').references(() => budgets.id, { onDelete: 'cascade' }),
    itemNumber: text('item_number'),
    description: text('description').notNull(),
    quantity: numeric('quantity').notNull().default('0'),
    unit: text('unit').notNull().default('unidad'),
});

// Budget Sub Activities
export const budgetSubActivities = pgTable('budget_sub_activities', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    activityId: integer('activity_id').references(() => budgetActivities.id, { onDelete: 'cascade' }),
    itemNumber: text('item_number'),
    description: text('description').notNull(),
    quantity: numeric('quantity').notNull().default('0'),
    unit: text('unit').notNull().default('unidad'),
    materialUnitCost: numeric('material_unit_cost').notNull().default('0'),
    laborUnitCost: numeric('labor_unit_cost').notNull().default('0'),
    subcontractUnitCost: numeric('subcontract_unit_cost').notNull().default('0'),
});

// Offers Table
export const offers = pgTable('offers', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    consecutiveNumber: text('consecutive_number').notNull(),
    prospectId: integer('prospect_id').references(() => prospects.id),
    date: date('date').notNull(),
    description: text('description'),
    amount: numeric('amount').notNull().default('0'),
    budgetAmount: numeric('budget_amount').notNull().default('0'),
    projectType: text('project_type').notNull(),
    status: text('status').notNull().default('Confección'),
    budgetId: integer('budget_id').references(() => budgets.id),
    pdfAttachmentName: text('pdf_attachment_name'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Projects Table
export const projects = pgTable('projects', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    offerId: integer('offer_id').references(() => offers.id),
    name: text('name').notNull(),
    creationDate: date('creation_date').notNull(),
    initialContractAmount: numeric('initial_contract_amount').notNull().default('0'),
    initialBudget: numeric('initial_budget').notNull().default('0'),
    contractAmount: numeric('contract_amount').notNull().default('0'),
    budget: numeric('budget').notNull().default('0'),
    location: text('location'),
    owner: text('owner'),
    type: text('type').notNull(),
    status: text('status').notNull().default('En Ejecución'),
    expenses: numeric('expenses').notNull().default('0'),
    unforeseenExpenses: numeric('unforeseen_expenses').notNull().default('0'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Service Requests
export const serviceRequests = pgTable('service_requests', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    projectId: integer('project_id').references(() => projects.id),
    projectName: text('project_name').notNull(),
    requestDate: date('request_date').notNull(),
    requester: text('requester').notNull(),
    requesterId: integer('requester_id').references(() => users.id),
    requiredDate: date('required_date'),
    status: text('status').notNull().default('Pendiente Aprobación Director'),
    finalJustification: text('final_justification'),
    overrunJustification: text('overrun_justification'),
    isWarranty: boolean('is_warranty').default(false),
    isPreOp: boolean('is_pre_op').default(false),
    prospectId: integer('prospect_id').references(() => prospects.id),
    rejectionHistory: jsonb('rejection_history').default([]),
    winnerSelection: jsonb('winner_selection').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Service Request Items
export const serviceRequestItems = pgTable('service_request_items', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    serviceRequestId: integer('service_request_id').references(() => serviceRequests.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    quantity: numeric('quantity').notNull().default('0'),
    unit: text('unit').notNull().default('unidad'),
    specifications: text('specifications'),
    isUnforeseen: boolean('is_unforeseen').default(false),
    unforeseenJustification: text('unforeseen_justification'),
    estimatedUnitCost: numeric('estimated_unit_cost'),
});

// Suppliers
export const suppliers = pgTable('suppliers', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    name: text('name').notNull(),
    serviceType: text('service_type'),
    location: text('location'),
    phone: text('phone'),
    email: text('email'),
    bankAccount: text('bank_account'),
    bankAccountDetails: text('bank_account_details'),
    bankAccount2: text('bank_account_2'),
    bankAccount2Details: text('bank_account_2_details'),
    sinpePhone: text('sinpe_phone'),
    comments: text('comments'),
}).enableRLS();

// Purchase Orders
export const purchaseOrders = pgTable('purchase_orders', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    serviceRequestId: integer('service_request_id').references(() => serviceRequests.id),
    projectId: integer('project_id').references(() => projects.id),
    supplierId: integer('supplier_id').references(() => suppliers.id),
    supplierName: text('supplier_name').notNull(),
    orderDate: date('order_date').notNull(),
    expectedDeliveryDate: date('expected_delivery_date'),
    subtotal: numeric('subtotal').notNull().default('0'),
    discount: numeric('discount').default('0'),
    iva: numeric('iva').default('0'),
    totalAmount: numeric('total_amount').notNull().default('0'),
    status: text('status').notNull().default('Pendiente Aprobación Financiera'),
    paymentTerms: text('payment_terms'),
    proformaNumber: text('proforma_number'),
    isWarranty: boolean('is_warranty').default(false),
    isPreOp: boolean('is_pre_op').default(false),
    prospectId: integer('prospect_id').references(() => prospects.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Purchase Order Items
export const purchaseOrderItems = pgTable('purchase_order_items', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    purchaseOrderId: integer('purchase_order_id').references(() => purchaseOrders.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    quantity: numeric('quantity').notNull().default('0'),
    unit: text('unit').notNull().default('unidad'),
    unitPrice: numeric('unit_price').notNull().default('0'),
});

// Accounts Payable (AP)
export const accountsPayable = pgTable('accounts_payable', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    purchaseOrderId: integer('purchase_order_id').references(() => purchaseOrders.id),
    subcontractId: integer('subcontract_id').references(() => subcontracts.id),
    supplierId: integer('supplier_id').references(() => suppliers.id),
    supplierName: text('supplier_name').notNull(),
    invoiceNumber: text('invoice_number').notNull(),
    invoiceDate: date('invoice_date').notNull(),
    dueDate: date('due_date').notNull(),
    totalAmount: numeric('total_amount').notNull().default('0'),
    paidAmount: numeric('paid_amount').default('0'),
    creditedAmount: numeric('credited_amount').default('0'),
    appliedCreditNoteIds: jsonb('applied_credit_note_ids').default([]),
    payments: jsonb('payments').default([]), // Array of Payment objects
    status: text('status').notNull().default('Pendiente de Pago'),
});

// Goods Receipts
export const goodsReceipts = pgTable('goods_receipts', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    purchaseOrderId: integer('purchase_order_id').references(() => purchaseOrders.id),
    creationDate: date('creation_date').notNull(),
    expectedReceiptDate: date('expected_receipt_date'),
    actualReceiptDate: date('actual_receipt_date'),
    receivedBy: text('received_by'),
    status: text('status').notNull().default('Pendiente de Recepción'),
    notes: text('notes'),
    closedByCreditNoteIds: jsonb('closed_by_credit_note_ids').default([]),
    isSubcontractReceipt: boolean('is_subcontract_receipt').default(false),
    amountReceived: numeric('amount_received').default('0'),
    progressDescription: text('progress_description'),
    subcontractorInvoice: text('subcontractor_invoice'),
});

// Goods Receipt Items
export const goodsReceiptItems = pgTable('goods_receipt_items', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    goodsReceiptId: integer('goods_receipt_id').references(() => goodsReceipts.id, { onDelete: 'cascade' }),
    purchaseOrderItemId: integer('purchase_order_item_id').references(() => purchaseOrderItems.id),
    name: text('name').notNull(),
    quantityOrdered: numeric('quantity_ordered').notNull().default('0'),
    unit: text('unit').notNull().default('unidad'),
    quantityReceived: numeric('quantity_received').notNull().default('0'),
});

// Credit Notes
export const creditNotes = pgTable('credit_notes', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    goodsReceiptId: integer('goods_receipt_id').references(() => goodsReceipts.id),
    purchaseOrderId: integer('purchase_order_id').references(() => purchaseOrders.id),
    projectId: integer('project_id').references(() => projects.id),
    supplierId: integer('supplier_id').references(() => suppliers.id),
    supplierName: text('supplier_name').notNull(),
    creationDate: timestamp('creation_date', { withTimezone: true }).defaultNow(),
    createdBy: text('created_by'),
    approvalDate: timestamp('approval_date', { withTimezone: true }),
    reason: text('reason').notNull(),
    totalAmount: numeric('total_amount').notNull().default('0'),
    status: text('status').notNull().default('Pendiente Aprobación'),
    appliedToInvoice: boolean('applied_to_invoice').default(false),
    pdfAttachmentName: text('pdf_attachment_name'),
});

// Credit Note Items
export const creditNoteItems = pgTable('credit_note_items', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    creditNoteId: integer('credit_note_id').references(() => creditNotes.id, { onDelete: 'cascade' }),
    purchaseOrderItemId: integer('purchase_order_item_id').references(() => purchaseOrderItems.id),
    name: text('name').notNull(),
    quantityToCredit: numeric('quantity_to_credit').notNull().default('0'),
    unit: text('unit').notNull().default('unidad'),
    unitPrice: numeric('unit_price').notNull().default('0'),
    creditAmount: numeric('credit_amount').notNull().default('0'),
});

// Accounts Receivable (AR)
export const accountsReceivable = pgTable('accounts_receivable', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    offerId: integer('offer_id').references(() => offers.id),
    clientName: text('client_name').notNull(),
    companyName: text('company_name'),
    paymentDate: date('payment_date'),
    contractAmount: numeric('contract_amount').notNull().default('0'),
    payments: jsonb('payments').notNull().default([]), // Array of Payment objects
    phone: text('phone'),
});

// Materials (Inventory)
export const materials = pgTable('materials', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    name: text('name').notNull(),
    unit: text('unit').notNull(),
    unitCost: numeric('unit_cost'),
    quantity: numeric('quantity').notNull().default('0'),
    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow(),
}).enableRLS();

// Service Items
export const serviceItems = pgTable('service_items', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    name: text('name').notNull(),
    unit: text('unit').notNull(),
    unitCost: numeric('unit_cost'),
    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow(),
}).enableRLS();

// Labor Items
export const laborItems = pgTable('labor_items', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    name: text('name').notNull(),
    hourlyRate: numeric('hourly_rate').notNull().default('0'),
    currency: text('currency').notNull().default('CRC'),
}).enableRLS();

// Recurring Order Templates
export const recurringOrderTemplates = pgTable('recurring_order_templates', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    name: text('name').notNull(),
    description: text('description'),
    items: jsonb('items').notNull().default([]), // Array of ServiceRequestItem
}).enableRLS();

// Predetermined Activities
export const predeterminedActivities = pgTable('predetermined_activities', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    name: text('name').notNull(),
    baseUnit: text('base_unit').notNull(),
}).enableRLS();

// Predetermined Sub Activities
export const predeterminedSubActivities = pgTable('predetermined_sub_activities', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    predeterminedActivityId: integer('predetermined_activity_id').references(() => predeterminedActivities.id, { onDelete: 'cascade' }),
    itemNumber: text('item_number'),
    type: text('type').notNull(), // 'material' | 'labor' | 'subcontract'
    description: text('description').notNull(),
    quantityPerBaseUnit: numeric('quantity_per_base_unit').notNull().default('0'),
    unit: text('unit').notNull(),
    notes: text('notes'),
}).enableRLS();

// Subcontracts
export const subcontracts = pgTable('subcontracts', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    purchaseOrderId: integer('purchase_order_id').references(() => purchaseOrders.id),
    projectId: integer('project_id').references(() => projects.id),
    supplierId: integer('supplier_id').references(() => suppliers.id),
    contractNumber: text('contract_number').notNull(),
    scopeDescription: text('scope_description').notNull(),
    contractAmount: numeric('contract_amount').notNull().default('0'),
    paymentTerms: text('payment_terms'),
    creationDate: date('creation_date').notNull(),
    installments: jsonb('installments').default([]), // Array of SubcontractInstallment
});


// Bonos (Recurring Projects R4)
export const bonos = pgTable('bonos', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    nombre: text('nombre').notNull(),
    tipoBono: text('tipo_bono').notNull(),
    entidad: text('entidad').notNull(),
    estatus: text('estatus').notNull(),
    ubicacion: text('ubicacion').notNull(),
    fechaEntrega: date('fecha_entrega').notNull(),
    monto: numeric('monto').notNull().default('0'),
    budgetId: integer('budget_id').references(() => budgets.id),
    constructora: text('constructora'),
    checklist: jsonb('checklist').default([]), // Array of { name: string, status: string }
    logs: jsonb('logs').default([]), // Array of { date: string, user: string, content: string }
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Quote Responses
export const quoteResponses = pgTable('quote_responses', {
    id: serial('id').primaryKey(),
    serviceRequestId: integer('service_request_id').references(() => serviceRequests.id, { onDelete: 'cascade' }),
    supplierId: integer('supplier_id').references(() => suppliers.id),
    supplierName: text('supplier_name').notNull(),
    quoteNumber: text('quote_number'),
    deliveryDays: integer('delivery_days').notNull().default(0),
    paymentTerms: text('payment_terms'),
    qualityNotes: text('quality_notes'),
    total: numeric('total').notNull().default('0'),
    currency: text('currency').notNull().default('CRC'),
    pdfAttachmentName: text('pdf_attachment_name'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Quote Response Items
export const quoteResponseItems = pgTable('quote_response_items', {
    id: serial('id').primaryKey(),
    quoteResponseId: integer('quote_response_id').references(() => quoteResponses.id, { onDelete: 'cascade' }),
    serviceRequestItemId: integer('service_request_item_id').references(() => serviceRequestItems.id),
    unitPrice: numeric('unit_price').notNull().default('0'),
    quality: text('quality').notNull().default('Media'),
    notes: text('notes'),
});

// Audit Logs
export const auditLogs = pgTable('audit_logs', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    userName: text('user_name'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: integer('entity_id'),
    details: jsonb('details'),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow(),
}).enableRLS();

// --- RELATIONS ---

export const usersRelations = relations(users, ({ many }) => ({
    userRoles: many(userRoles),
    auditLogs: many(auditLogs),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
    userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
    user: one(users, { fields: [userRoles.userId], references: [users.id] }),
    role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

export const budgetsRelations = relations(budgets, ({ many, one }) => ({
    activities: many(budgetActivities),
    prospect: one(prospects, { fields: [budgets.prospectId], references: [prospects.id] }),
}));

export const budgetActivitiesRelations = relations(budgetActivities, ({ one, many }) => ({
    budget: one(budgets, { fields: [budgetActivities.budgetId], references: [budgets.id] }),
    subActivities: many(budgetSubActivities),
}));

export const budgetSubActivitiesRelations = relations(budgetSubActivities, ({ one }) => ({
    activity: one(budgetActivities, { fields: [budgetSubActivities.activityId], references: [budgetActivities.id] }),
}));

export const serviceRequestsRelations = relations(serviceRequests, ({ many, one }) => ({
    items: many(serviceRequestItems),
    quoteResponses: many(quoteResponses),
    project: one(projects, { fields: [serviceRequests.projectId], references: [projects.id] }),
    requester: one(users, { fields: [serviceRequests.requesterId], references: [users.id] }),
}));

export const serviceRequestItemsRelations = relations(serviceRequestItems, ({ one }) => ({
    request: one(serviceRequests, { fields: [serviceRequestItems.serviceRequestId], references: [serviceRequests.id] }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ many, one }) => ({
    items: many(purchaseOrderItems),
    supplier: one(suppliers, { fields: [purchaseOrders.supplierId], references: [suppliers.id] }),
    project: one(projects, { fields: [purchaseOrders.projectId], references: [projects.id] }),
    goodsReceipts: many(goodsReceipts),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
    order: one(purchaseOrders, { fields: [purchaseOrderItems.purchaseOrderId], references: [purchaseOrders.id] }),
}));

export const goodsReceiptsRelations = relations(goodsReceipts, ({ one, many }) => ({
    purchaseOrder: one(purchaseOrders, { fields: [goodsReceipts.purchaseOrderId], references: [purchaseOrders.id] }),
    items: many(goodsReceiptItems),
    creditNotes: many(creditNotes),
}));

export const goodsReceiptItemsRelations = relations(goodsReceiptItems, ({ one }) => ({
    receipt: one(goodsReceipts, { fields: [goodsReceiptItems.goodsReceiptId], references: [goodsReceipts.id] }),
    purchaseOrderItem: one(purchaseOrderItems, { fields: [goodsReceiptItems.purchaseOrderItemId], references: [purchaseOrderItems.id] }),
}));

export const creditNotesRelations = relations(creditNotes, ({ one, many }) => ({
    goodsReceipt: one(goodsReceipts, { fields: [creditNotes.goodsReceiptId], references: [goodsReceipts.id] }),
    purchaseOrder: one(purchaseOrders, { fields: [creditNotes.purchaseOrderId], references: [purchaseOrders.id] }),
    project: one(projects, { fields: [creditNotes.projectId], references: [projects.id] }),
    supplier: one(suppliers, { fields: [creditNotes.supplierId], references: [suppliers.id] }),
    items: many(creditNoteItems),
}));

export const creditNoteItemsRelations = relations(creditNoteItems, ({ one }) => ({
    creditNote: one(creditNotes, { fields: [creditNoteItems.creditNoteId], references: [creditNotes.id] }),
    purchaseOrderItem: one(purchaseOrderItems, { fields: [creditNoteItems.purchaseOrderItemId], references: [purchaseOrderItems.id] }),
}));

export const quoteResponsesRelations = relations(quoteResponses, ({ one, many }) => ({
    serviceRequest: one(serviceRequests, { fields: [quoteResponses.serviceRequestId], references: [serviceRequests.id] }),
    supplier: one(suppliers, { fields: [quoteResponses.supplierId], references: [suppliers.id] }),
    items: many(quoteResponseItems),
}));

export const quoteResponseItemsRelations = relations(quoteResponseItems, ({ one }) => ({
    quoteResponse: one(quoteResponses, { fields: [quoteResponseItems.quoteResponseId], references: [quoteResponses.id] }),
    serviceRequestItem: one(serviceRequestItems, { fields: [quoteResponseItems.serviceRequestItemId], references: [serviceRequestItems.id] }),
}));

export const predeterminedActivitiesRelations = relations(predeterminedActivities, ({ many }) => ({
    subActivities: many(predeterminedSubActivities),
}));

export const predeterminedSubActivitiesRelations = relations(predeterminedSubActivities, ({ one }) => ({
    activity: one(predeterminedActivities, { fields: [predeterminedSubActivities.predeterminedActivityId], references: [predeterminedActivities.id] }),
}));

export const offersRelations = relations(offers, ({ one, many }) => ({
    prospect: one(prospects, { fields: [offers.prospectId], references: [prospects.id] }),
    budget: one(budgets, { fields: [offers.budgetId], references: [budgets.id] }),
    changeOrders: many(changeOrders),
}));

// Change Orders Table
export const changeOrders = pgTable('change_orders', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    consecutive: text('consecutive').notNull(),
    offerId: integer('offer_id').references(() => offers.id),
    projectName: text('project_name'),
    description: text('description').notNull(),
    changeType: text('change_type').notNull(), // 'Adicional' | 'Crédito'
    amountImpact: numeric('amount_impact').notNull().default('0'),
    budgetImpact: numeric('budget_impact').notNull().default('0'),
    creationDate: text('creation_date'),
    approvalDate: text('approval_date'),
    status: text('status').notNull().default('Pendiente Aprobación'),
    budgetId: integer('budget_id').references(() => budgets.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const changeOrdersRelations = relations(changeOrders, ({ one }) => ({
    offer: one(offers, { fields: [changeOrders.offerId], references: [offers.id] }),
    budget: one(budgets, { fields: [changeOrders.budgetId], references: [budgets.id] }),
}));

export const subcontractsRelations = relations(subcontracts, ({ one }) => ({
    purchaseOrder: one(purchaseOrders, { fields: [subcontracts.purchaseOrderId], references: [purchaseOrders.id] }),
    project: one(projects, { fields: [subcontracts.projectId], references: [projects.id] }),
    supplier: one(suppliers, { fields: [subcontracts.supplierId], references: [suppliers.id] }),
}));

export const accountsPayableRelations = relations(accountsPayable, ({ one }) => ({
    purchaseOrder: one(purchaseOrders, { fields: [accountsPayable.purchaseOrderId], references: [purchaseOrders.id] }),
    subcontract: one(subcontracts, { fields: [accountsPayable.subcontractId], references: [subcontracts.id] }),
    supplier: one(suppliers, { fields: [accountsPayable.supplierId], references: [suppliers.id] }),
}));


export const bonosRelations = relations(bonos, ({ one }) => ({
    budget: one(budgets, { fields: [bonos.budgetId], references: [budgets.id] }),
}));

// Administrative Budgets table
export const administrativeBudgets = pgTable('administrative_budgets', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    year: integer('year').notNull(),
    name: text('name').notNull(),
    categories: jsonb('categories').notNull().default([]), // Array of AdministrativeBudgetCategory
    sourceCategories: jsonb('source_categories').notNull().default([]), // Array of AdministrativeBudgetSourceCategory
    status: text('status').notNull().default('Borrador'),
    approvalHistory: jsonb('approval_history').notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// System Sequences (Folios Atómicos Generales)
export const systemSequences = pgTable('system_sequences', {
    prefix: text('prefix').primaryKey(), // e.g: 'PRE', 'FAC', 'REQ'
    lastValue: integer('last_value').notNull().default(0),
}).enableRLS();

// Administrative Expenses table
export const administrativeExpenses = pgTable('administrative_expenses', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    date: date('date').notNull(),
    categoryId: integer('category_id').notNull(),
    budgetId: integer('budget_id').references(() => administrativeBudgets.id),
    amount: numeric('amount').notNull().default('0'),
    supplier: text('supplier').notNull(),
    description: text('description').notNull(),
    invoiceNumber: text('invoice_number'),
    paymentProofName: text('payment_proof_name'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}).enableRLS();

export const administrativeBudgetsRelations = relations(administrativeBudgets, ({ many }) => ({
    expenses: many(administrativeExpenses),
}));

export const administrativeExpensesRelations = relations(administrativeExpenses, ({ one }) => ({
    budget: one(administrativeBudgets, { fields: [administrativeExpenses.budgetId], references: [administrativeBudgets.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

// Pre-operative Rubros table
export const preOpRubros = pgTable('pre_op_rubros', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    nombre: text('nombre').notNull(),
    limitePorProspecto: numeric('limite_por_prospecto').notNull().default('0'),
}).enableRLS();

// Pre-operative Expenses table
export const preOpExpenses = pgTable('pre_op_expenses', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    prospectId: integer('prospect_id').references(() => prospects.id),
    prospectName: text('prospect_name'),
    budgetId: integer('budget_id').references(() => budgets.id),
    budgetName: text('budget_name'),
    fecha: date('fecha').notNull(),
    totalGasto: numeric('total_gasto').notNull().default('0'),
    status: text('status').notNull().default('Registrado'),
    desglose: jsonb('desglose').notNull().default({}),
    ad_hoc_expenses: jsonb('ad_hoc_expenses').default([]),
    descripcion: text('descripcion'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const preOpExpensesRelations = relations(preOpExpenses, ({ one }) => ({
    prospect: one(prospects, { fields: [preOpExpenses.prospectId], references: [prospects.id] }),
    budget: one(budgets, { fields: [preOpExpenses.budgetId], references: [budgets.id] }),
}));

// Company Info Table
export const companyInfo = pgTable('company_info', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().default(1),
    name: text('name').notNull(),
    legalId: text('legal_id'),
    address: text('address'),
    phone: text('phone'),
    email: text('email'),
    logoBase64: text('logo_base64'),
    country: text('country').default('CR'),
    ivaRate: numeric('iva_rate').default('13'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
