"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.offersRelations = exports.predeterminedSubActivitiesRelations = exports.predeterminedActivitiesRelations = exports.quoteResponseItemsRelations = exports.quoteResponsesRelations = exports.creditNoteItemsRelations = exports.creditNotesRelations = exports.goodsReceiptItemsRelations = exports.goodsReceiptsRelations = exports.purchaseOrderItemsRelations = exports.purchaseOrdersRelations = exports.serviceRequestItemsRelations = exports.serviceRequestsRelations = exports.budgetSubActivitiesRelations = exports.budgetActivitiesRelations = exports.budgetsRelations = exports.userRolesRelations = exports.rolesRelations = exports.usersRelations = exports.auditLogs = exports.quoteResponseItems = exports.quoteResponses = exports.bonos = exports.subcontracts = exports.predeterminedSubActivities = exports.predeterminedActivities = exports.recurringOrderTemplates = exports.laborItems = exports.serviceItems = exports.materials = exports.accountsReceivable = exports.creditNoteItems = exports.creditNotes = exports.goodsReceiptItems = exports.goodsReceipts = exports.accountsPayable = exports.purchaseOrderItems = exports.purchaseOrders = exports.suppliers = exports.serviceRequestItems = exports.serviceRequests = exports.projects = exports.offers = exports.budgetSubActivities = exports.budgetActivities = exports.budgets = exports.prospects = exports.userRoles = exports.users = exports.roles = void 0;
exports.companyInfo = exports.preOpExpensesRelations = exports.preOpExpenses = exports.preOpRubros = exports.auditLogsRelations = exports.administrativeExpensesRelations = exports.administrativeBudgetsRelations = exports.administrativeExpenses = exports.systemSequences = exports.administrativeBudgets = exports.bonosRelations = exports.accountsPayableRelations = exports.subcontractsRelations = exports.changeOrdersRelations = exports.changeOrders = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
// Roles Table
exports.roles = (0, pg_core_1.pgTable)('roles', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    name: (0, pg_core_1.text)('name').notNull(),
    description: (0, pg_core_1.text)('description'),
    isDefault: (0, pg_core_1.boolean)('is_default').default(false),
    permissions: (0, pg_core_1.jsonb)('permissions').notNull().default({}),
    maxItemOveragePercentage: (0, pg_core_1.numeric)('max_item_overage_percentage'),
    maxProjectOveragePercentage: (0, pg_core_1.numeric)('max_project_overage_percentage'),
});
// Users Table
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    name: (0, pg_core_1.text)('name').notNull(),
    email: (0, pg_core_1.text)('email').unique().notNull(),
    avatar: (0, pg_core_1.text)('avatar'),
    status: (0, pg_core_1.text)('status').notNull().default('Active'),
    individualPermissions: (0, pg_core_1.jsonb)('individual_permissions').default({}),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
});
// User Roles Junction Table
exports.userRoles = (0, pg_core_1.pgTable)('user_roles', {
    userId: (0, pg_core_1.integer)('user_id').references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    roleId: (0, pg_core_1.integer)('role_id').references(function () { return exports.roles.id; }, { onDelete: 'cascade' }),
}, function (table) { return ({
    pk: (0, pg_core_1.primaryKey)({ columns: [table.userId, table.roleId] }),
}); });
// Prospects Table
exports.prospects = (0, pg_core_1.pgTable)('prospects', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    name: (0, pg_core_1.text)('name').notNull(),
    company: (0, pg_core_1.text)('company'),
    phone: (0, pg_core_1.text)('phone'),
    email: (0, pg_core_1.text)('email'),
    nextFollowUpDate: (0, pg_core_1.date)('next_follow_up_date'),
    birthday: (0, pg_core_1.date)('birthday'),
    spouseName: (0, pg_core_1.text)('spouse_name'),
    children: (0, pg_core_1.text)('children'),
    hobbies: (0, pg_core_1.text)('hobbies'),
    followUps: (0, pg_core_1.jsonb)('follow_ups').notNull().default([]),
    source: (0, pg_core_1.text)('source').default('Manual'),
    sourceBonoId: (0, pg_core_1.integer)('source_bono_id'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
}).enableRLS();
// Budgets Table
exports.budgets = (0, pg_core_1.pgTable)('budgets', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    consecutiveNumber: (0, pg_core_1.text)('consecutive_number').notNull(),
    prospectId: (0, pg_core_1.integer)('prospect_id').references(function () { return exports.prospects.id; }),
    date: (0, pg_core_1.date)('date').notNull(),
    description: (0, pg_core_1.text)('description'),
    indirectCosts: (0, pg_core_1.jsonb)('indirect_costs').notNull().default({}),
    directCostTotal: (0, pg_core_1.numeric)('direct_cost_total').notNull().default('0'),
    indirectCostTotal: (0, pg_core_1.numeric)('indirect_cost_total').notNull().default('0'),
    total: (0, pg_core_1.numeric)('total').notNull().default('0'),
    currency: (0, pg_core_1.text)('currency').notNull().default('CRC'),
    taxRate: (0, pg_core_1.numeric)('tax_rate').notNull().default('0'),
    finalTotal: (0, pg_core_1.numeric)('final_total').notNull().default('0'),
    status: (0, pg_core_1.text)('status').notNull().default('Draft'),
    isRecurring: (0, pg_core_1.boolean)('is_recurring').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
});
// Budget Activities
exports.budgetActivities = (0, pg_core_1.pgTable)('budget_activities', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    budgetId: (0, pg_core_1.integer)('budget_id').references(function () { return exports.budgets.id; }, { onDelete: 'cascade' }),
    itemNumber: (0, pg_core_1.text)('item_number'),
    description: (0, pg_core_1.text)('description').notNull(),
    quantity: (0, pg_core_1.numeric)('quantity').notNull().default('0'),
    unit: (0, pg_core_1.text)('unit').notNull().default('unidad'),
});
// Budget Sub Activities
exports.budgetSubActivities = (0, pg_core_1.pgTable)('budget_sub_activities', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    activityId: (0, pg_core_1.integer)('activity_id').references(function () { return exports.budgetActivities.id; }, { onDelete: 'cascade' }),
    itemNumber: (0, pg_core_1.text)('item_number'),
    description: (0, pg_core_1.text)('description').notNull(),
    quantity: (0, pg_core_1.numeric)('quantity').notNull().default('0'),
    unit: (0, pg_core_1.text)('unit').notNull().default('unidad'),
    materialUnitCost: (0, pg_core_1.numeric)('material_unit_cost').notNull().default('0'),
    laborUnitCost: (0, pg_core_1.numeric)('labor_unit_cost').notNull().default('0'),
    subcontractUnitCost: (0, pg_core_1.numeric)('subcontract_unit_cost').notNull().default('0'),
});
// Offers Table
exports.offers = (0, pg_core_1.pgTable)('offers', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    consecutiveNumber: (0, pg_core_1.text)('consecutive_number').notNull(),
    prospectId: (0, pg_core_1.integer)('prospect_id').references(function () { return exports.prospects.id; }),
    date: (0, pg_core_1.date)('date').notNull(),
    description: (0, pg_core_1.text)('description'),
    amount: (0, pg_core_1.numeric)('amount').notNull().default('0'),
    budgetAmount: (0, pg_core_1.numeric)('budget_amount').notNull().default('0'),
    projectType: (0, pg_core_1.text)('project_type').notNull(),
    status: (0, pg_core_1.text)('status').notNull().default('Confección'),
    budgetId: (0, pg_core_1.integer)('budget_id').references(function () { return exports.budgets.id; }),
    pdfAttachmentName: (0, pg_core_1.text)('pdf_attachment_name'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
});
// Projects Table
exports.projects = (0, pg_core_1.pgTable)('projects', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    offerId: (0, pg_core_1.integer)('offer_id').references(function () { return exports.offers.id; }),
    name: (0, pg_core_1.text)('name').notNull(),
    creationDate: (0, pg_core_1.date)('creation_date').notNull(),
    initialContractAmount: (0, pg_core_1.numeric)('initial_contract_amount').notNull().default('0'),
    initialBudget: (0, pg_core_1.numeric)('initial_budget').notNull().default('0'),
    contractAmount: (0, pg_core_1.numeric)('contract_amount').notNull().default('0'),
    budget: (0, pg_core_1.numeric)('budget').notNull().default('0'),
    location: (0, pg_core_1.text)('location'),
    owner: (0, pg_core_1.text)('owner'),
    type: (0, pg_core_1.text)('type').notNull(),
    status: (0, pg_core_1.text)('status').notNull().default('En Ejecución'),
    expenses: (0, pg_core_1.numeric)('expenses').notNull().default('0'),
    unforeseenExpenses: (0, pg_core_1.numeric)('unforeseen_expenses').notNull().default('0'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
});
// Service Requests
exports.serviceRequests = (0, pg_core_1.pgTable)('service_requests', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    projectId: (0, pg_core_1.integer)('project_id').references(function () { return exports.projects.id; }),
    projectName: (0, pg_core_1.text)('project_name').notNull(),
    requestDate: (0, pg_core_1.date)('request_date').notNull(),
    requester: (0, pg_core_1.text)('requester').notNull(),
    requesterId: (0, pg_core_1.integer)('requester_id').references(function () { return exports.users.id; }),
    requiredDate: (0, pg_core_1.date)('required_date'),
    status: (0, pg_core_1.text)('status').notNull().default('Pendiente Aprobación Director'),
    finalJustification: (0, pg_core_1.text)('final_justification'),
    overrunJustification: (0, pg_core_1.text)('overrun_justification'),
    isWarranty: (0, pg_core_1.boolean)('is_warranty').default(false),
    isPreOp: (0, pg_core_1.boolean)('is_pre_op').default(false),
    prospectId: (0, pg_core_1.integer)('prospect_id').references(function () { return exports.prospects.id; }),
    rejectionHistory: (0, pg_core_1.jsonb)('rejection_history').default([]),
    winnerSelection: (0, pg_core_1.jsonb)('winner_selection').default({}),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
});
// Service Request Items
exports.serviceRequestItems = (0, pg_core_1.pgTable)('service_request_items', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    serviceRequestId: (0, pg_core_1.integer)('service_request_id').references(function () { return exports.serviceRequests.id; }, { onDelete: 'cascade' }),
    name: (0, pg_core_1.text)('name').notNull(),
    quantity: (0, pg_core_1.numeric)('quantity').notNull().default('0'),
    unit: (0, pg_core_1.text)('unit').notNull().default('unidad'),
    specifications: (0, pg_core_1.text)('specifications'),
    isUnforeseen: (0, pg_core_1.boolean)('is_unforeseen').default(false),
    unforeseenJustification: (0, pg_core_1.text)('unforeseen_justification'),
    estimatedUnitCost: (0, pg_core_1.numeric)('estimated_unit_cost'),
});
// Suppliers
exports.suppliers = (0, pg_core_1.pgTable)('suppliers', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    name: (0, pg_core_1.text)('name').notNull(),
    serviceType: (0, pg_core_1.text)('service_type'),
    location: (0, pg_core_1.text)('location'),
    phone: (0, pg_core_1.text)('phone'),
    email: (0, pg_core_1.text)('email'),
    bankAccount: (0, pg_core_1.text)('bank_account'),
    bankAccountDetails: (0, pg_core_1.text)('bank_account_details'),
    bankAccount2: (0, pg_core_1.text)('bank_account_2'),
    bankAccount2Details: (0, pg_core_1.text)('bank_account_2_details'),
    sinpePhone: (0, pg_core_1.text)('sinpe_phone'),
    comments: (0, pg_core_1.text)('comments'),
}).enableRLS();
// Purchase Orders
exports.purchaseOrders = (0, pg_core_1.pgTable)('purchase_orders', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    serviceRequestId: (0, pg_core_1.integer)('service_request_id').references(function () { return exports.serviceRequests.id; }),
    projectId: (0, pg_core_1.integer)('project_id').references(function () { return exports.projects.id; }),
    supplierId: (0, pg_core_1.integer)('supplier_id').references(function () { return exports.suppliers.id; }),
    supplierName: (0, pg_core_1.text)('supplier_name').notNull(),
    orderDate: (0, pg_core_1.date)('order_date').notNull(),
    expectedDeliveryDate: (0, pg_core_1.date)('expected_delivery_date'),
    subtotal: (0, pg_core_1.numeric)('subtotal').notNull().default('0'),
    discount: (0, pg_core_1.numeric)('discount').default('0'),
    iva: (0, pg_core_1.numeric)('iva').default('0'),
    totalAmount: (0, pg_core_1.numeric)('total_amount').notNull().default('0'),
    status: (0, pg_core_1.text)('status').notNull().default('Pendiente Aprobación Financiera'),
    paymentTerms: (0, pg_core_1.text)('payment_terms'),
    proformaNumber: (0, pg_core_1.text)('proforma_number'),
    isWarranty: (0, pg_core_1.boolean)('is_warranty').default(false),
    isPreOp: (0, pg_core_1.boolean)('is_pre_op').default(false),
    prospectId: (0, pg_core_1.integer)('prospect_id').references(function () { return exports.prospects.id; }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
});
// Purchase Order Items
exports.purchaseOrderItems = (0, pg_core_1.pgTable)('purchase_order_items', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    purchaseOrderId: (0, pg_core_1.integer)('purchase_order_id').references(function () { return exports.purchaseOrders.id; }, { onDelete: 'cascade' }),
    name: (0, pg_core_1.text)('name').notNull(),
    quantity: (0, pg_core_1.numeric)('quantity').notNull().default('0'),
    unit: (0, pg_core_1.text)('unit').notNull().default('unidad'),
    unitPrice: (0, pg_core_1.numeric)('unit_price').notNull().default('0'),
});
// Accounts Payable (AP)
exports.accountsPayable = (0, pg_core_1.pgTable)('accounts_payable', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    purchaseOrderId: (0, pg_core_1.integer)('purchase_order_id').references(function () { return exports.purchaseOrders.id; }),
    subcontractId: (0, pg_core_1.integer)('subcontract_id').references(function () { return exports.subcontracts.id; }),
    supplierId: (0, pg_core_1.integer)('supplier_id').references(function () { return exports.suppliers.id; }),
    supplierName: (0, pg_core_1.text)('supplier_name').notNull(),
    invoiceNumber: (0, pg_core_1.text)('invoice_number').notNull(),
    invoiceDate: (0, pg_core_1.date)('invoice_date').notNull(),
    dueDate: (0, pg_core_1.date)('due_date').notNull(),
    totalAmount: (0, pg_core_1.numeric)('total_amount').notNull().default('0'),
    paidAmount: (0, pg_core_1.numeric)('paid_amount').default('0'),
    creditedAmount: (0, pg_core_1.numeric)('credited_amount').default('0'),
    appliedCreditNoteIds: (0, pg_core_1.jsonb)('applied_credit_note_ids').default([]),
    payments: (0, pg_core_1.jsonb)('payments').default([]), // Array of Payment objects
    status: (0, pg_core_1.text)('status').notNull().default('Pendiente de Pago'),
});
// Goods Receipts
exports.goodsReceipts = (0, pg_core_1.pgTable)('goods_receipts', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    purchaseOrderId: (0, pg_core_1.integer)('purchase_order_id').references(function () { return exports.purchaseOrders.id; }),
    creationDate: (0, pg_core_1.date)('creation_date').notNull(),
    expectedReceiptDate: (0, pg_core_1.date)('expected_receipt_date'),
    actualReceiptDate: (0, pg_core_1.date)('actual_receipt_date'),
    receivedBy: (0, pg_core_1.text)('received_by'),
    status: (0, pg_core_1.text)('status').notNull().default('Pendiente de Recepción'),
    notes: (0, pg_core_1.text)('notes'),
    closedByCreditNoteIds: (0, pg_core_1.jsonb)('closed_by_credit_note_ids').default([]),
    isSubcontractReceipt: (0, pg_core_1.boolean)('is_subcontract_receipt').default(false),
    amountReceived: (0, pg_core_1.numeric)('amount_received').default('0'),
    progressDescription: (0, pg_core_1.text)('progress_description'),
    subcontractorInvoice: (0, pg_core_1.text)('subcontractor_invoice'),
});
// Goods Receipt Items
exports.goodsReceiptItems = (0, pg_core_1.pgTable)('goods_receipt_items', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    goodsReceiptId: (0, pg_core_1.integer)('goods_receipt_id').references(function () { return exports.goodsReceipts.id; }, { onDelete: 'cascade' }),
    purchaseOrderItemId: (0, pg_core_1.integer)('purchase_order_item_id').references(function () { return exports.purchaseOrderItems.id; }),
    name: (0, pg_core_1.text)('name').notNull(),
    quantityOrdered: (0, pg_core_1.numeric)('quantity_ordered').notNull().default('0'),
    unit: (0, pg_core_1.text)('unit').notNull().default('unidad'),
    quantityReceived: (0, pg_core_1.numeric)('quantity_received').notNull().default('0'),
});
// Credit Notes
exports.creditNotes = (0, pg_core_1.pgTable)('credit_notes', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    goodsReceiptId: (0, pg_core_1.integer)('goods_receipt_id').references(function () { return exports.goodsReceipts.id; }),
    purchaseOrderId: (0, pg_core_1.integer)('purchase_order_id').references(function () { return exports.purchaseOrders.id; }),
    projectId: (0, pg_core_1.integer)('project_id').references(function () { return exports.projects.id; }),
    supplierId: (0, pg_core_1.integer)('supplier_id').references(function () { return exports.suppliers.id; }),
    supplierName: (0, pg_core_1.text)('supplier_name').notNull(),
    creationDate: (0, pg_core_1.timestamp)('creation_date', { withTimezone: true }).defaultNow(),
    createdBy: (0, pg_core_1.text)('created_by'),
    approvalDate: (0, pg_core_1.timestamp)('approval_date', { withTimezone: true }),
    reason: (0, pg_core_1.text)('reason').notNull(),
    totalAmount: (0, pg_core_1.numeric)('total_amount').notNull().default('0'),
    status: (0, pg_core_1.text)('status').notNull().default('Pendiente Aprobación'),
    appliedToInvoice: (0, pg_core_1.boolean)('applied_to_invoice').default(false),
    pdfAttachmentName: (0, pg_core_1.text)('pdf_attachment_name'),
});
// Credit Note Items
exports.creditNoteItems = (0, pg_core_1.pgTable)('credit_note_items', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    creditNoteId: (0, pg_core_1.integer)('credit_note_id').references(function () { return exports.creditNotes.id; }, { onDelete: 'cascade' }),
    purchaseOrderItemId: (0, pg_core_1.integer)('purchase_order_item_id').references(function () { return exports.purchaseOrderItems.id; }),
    name: (0, pg_core_1.text)('name').notNull(),
    quantityToCredit: (0, pg_core_1.numeric)('quantity_to_credit').notNull().default('0'),
    unit: (0, pg_core_1.text)('unit').notNull().default('unidad'),
    unitPrice: (0, pg_core_1.numeric)('unit_price').notNull().default('0'),
    creditAmount: (0, pg_core_1.numeric)('credit_amount').notNull().default('0'),
});
// Accounts Receivable (AR)
exports.accountsReceivable = (0, pg_core_1.pgTable)('accounts_receivable', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    offerId: (0, pg_core_1.integer)('offer_id').references(function () { return exports.offers.id; }),
    clientName: (0, pg_core_1.text)('client_name').notNull(),
    companyName: (0, pg_core_1.text)('company_name'),
    paymentDate: (0, pg_core_1.date)('payment_date'),
    contractAmount: (0, pg_core_1.numeric)('contract_amount').notNull().default('0'),
    payments: (0, pg_core_1.jsonb)('payments').notNull().default([]), // Array of Payment objects
    phone: (0, pg_core_1.text)('phone'),
});
// Materials (Inventory)
exports.materials = (0, pg_core_1.pgTable)('materials', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    name: (0, pg_core_1.text)('name').notNull(),
    unit: (0, pg_core_1.text)('unit').notNull(),
    unitCost: (0, pg_core_1.numeric)('unit_cost'),
    quantity: (0, pg_core_1.numeric)('quantity').notNull().default('0'),
    lastUpdated: (0, pg_core_1.timestamp)('last_updated', { withTimezone: true }).defaultNow(),
}).enableRLS();
// Service Items
exports.serviceItems = (0, pg_core_1.pgTable)('service_items', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    name: (0, pg_core_1.text)('name').notNull(),
    unit: (0, pg_core_1.text)('unit').notNull(),
    unitCost: (0, pg_core_1.numeric)('unit_cost'),
    lastUpdated: (0, pg_core_1.timestamp)('last_updated', { withTimezone: true }).defaultNow(),
}).enableRLS();
// Labor Items
exports.laborItems = (0, pg_core_1.pgTable)('labor_items', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    name: (0, pg_core_1.text)('name').notNull(),
    hourlyRate: (0, pg_core_1.numeric)('hourly_rate').notNull().default('0'),
    currency: (0, pg_core_1.text)('currency').notNull().default('CRC'),
}).enableRLS();
// Recurring Order Templates
exports.recurringOrderTemplates = (0, pg_core_1.pgTable)('recurring_order_templates', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    name: (0, pg_core_1.text)('name').notNull(),
    description: (0, pg_core_1.text)('description'),
    items: (0, pg_core_1.jsonb)('items').notNull().default([]), // Array of ServiceRequestItem
}).enableRLS();
// Predetermined Activities
exports.predeterminedActivities = (0, pg_core_1.pgTable)('predetermined_activities', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    name: (0, pg_core_1.text)('name').notNull(),
    baseUnit: (0, pg_core_1.text)('base_unit').notNull(),
}).enableRLS();
// Predetermined Sub Activities
exports.predeterminedSubActivities = (0, pg_core_1.pgTable)('predetermined_sub_activities', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    predeterminedActivityId: (0, pg_core_1.integer)('predetermined_activity_id').references(function () { return exports.predeterminedActivities.id; }, { onDelete: 'cascade' }),
    itemNumber: (0, pg_core_1.text)('item_number'),
    type: (0, pg_core_1.text)('type').notNull(), // 'material' | 'labor' | 'subcontract'
    description: (0, pg_core_1.text)('description').notNull(),
    quantityPerBaseUnit: (0, pg_core_1.numeric)('quantity_per_base_unit').notNull().default('0'),
    unit: (0, pg_core_1.text)('unit').notNull(),
    notes: (0, pg_core_1.text)('notes'),
}).enableRLS();
// Subcontracts
exports.subcontracts = (0, pg_core_1.pgTable)('subcontracts', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    purchaseOrderId: (0, pg_core_1.integer)('purchase_order_id').references(function () { return exports.purchaseOrders.id; }),
    projectId: (0, pg_core_1.integer)('project_id').references(function () { return exports.projects.id; }),
    supplierId: (0, pg_core_1.integer)('supplier_id').references(function () { return exports.suppliers.id; }),
    contractNumber: (0, pg_core_1.text)('contract_number').notNull(),
    scopeDescription: (0, pg_core_1.text)('scope_description').notNull(),
    contractAmount: (0, pg_core_1.numeric)('contract_amount').notNull().default('0'),
    paymentTerms: (0, pg_core_1.text)('payment_terms'),
    creationDate: (0, pg_core_1.date)('creation_date').notNull(),
    installments: (0, pg_core_1.jsonb)('installments').default([]), // Array of SubcontractInstallment
});
// Bonos (Recurring Projects R4)
exports.bonos = (0, pg_core_1.pgTable)('bonos', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    nombre: (0, pg_core_1.text)('nombre').notNull(),
    tipoBono: (0, pg_core_1.text)('tipo_bono').notNull(),
    entidad: (0, pg_core_1.text)('entidad').notNull(),
    estatus: (0, pg_core_1.text)('estatus').notNull(),
    ubicacion: (0, pg_core_1.text)('ubicacion').notNull(),
    fechaEntrega: (0, pg_core_1.date)('fecha_entrega').notNull(),
    monto: (0, pg_core_1.numeric)('monto').notNull().default('0'),
    budgetId: (0, pg_core_1.integer)('budget_id').references(function () { return exports.budgets.id; }),
    constructora: (0, pg_core_1.text)('constructora'),
    checklist: (0, pg_core_1.jsonb)('checklist').default([]), // Array of { name: string, status: string }
    logs: (0, pg_core_1.jsonb)('logs').default([]), // Array of { date: string, user: string, content: string }
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
});
// Quote Responses
exports.quoteResponses = (0, pg_core_1.pgTable)('quote_responses', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    serviceRequestId: (0, pg_core_1.integer)('service_request_id').references(function () { return exports.serviceRequests.id; }, { onDelete: 'cascade' }),
    supplierId: (0, pg_core_1.integer)('supplier_id').references(function () { return exports.suppliers.id; }),
    supplierName: (0, pg_core_1.text)('supplier_name').notNull(),
    quoteNumber: (0, pg_core_1.text)('quote_number'),
    deliveryDays: (0, pg_core_1.integer)('delivery_days').notNull().default(0),
    paymentTerms: (0, pg_core_1.text)('payment_terms'),
    qualityNotes: (0, pg_core_1.text)('quality_notes'),
    total: (0, pg_core_1.numeric)('total').notNull().default('0'),
    currency: (0, pg_core_1.text)('currency').notNull().default('CRC'),
    pdfAttachmentName: (0, pg_core_1.text)('pdf_attachment_name'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
});
// Quote Response Items
exports.quoteResponseItems = (0, pg_core_1.pgTable)('quote_response_items', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    quoteResponseId: (0, pg_core_1.integer)('quote_response_id').references(function () { return exports.quoteResponses.id; }, { onDelete: 'cascade' }),
    serviceRequestItemId: (0, pg_core_1.integer)('service_request_item_id').references(function () { return exports.serviceRequestItems.id; }),
    unitPrice: (0, pg_core_1.numeric)('unit_price').notNull().default('0'),
    quality: (0, pg_core_1.text)('quality').notNull().default('Media'),
    notes: (0, pg_core_1.text)('notes'),
});
// Audit Logs
exports.auditLogs = (0, pg_core_1.pgTable)('audit_logs', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').references(function () { return exports.users.id; }),
    userName: (0, pg_core_1.text)('user_name'),
    action: (0, pg_core_1.text)('action').notNull(),
    entityType: (0, pg_core_1.text)('entity_type').notNull(),
    entityId: (0, pg_core_1.integer)('entity_id'),
    details: (0, pg_core_1.jsonb)('details'),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true }).defaultNow(),
}).enableRLS();
// --- RELATIONS ---
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, function (_a) {
    var many = _a.many;
    return ({
        userRoles: many(exports.userRoles),
        auditLogs: many(exports.auditLogs),
    });
});
exports.rolesRelations = (0, drizzle_orm_1.relations)(exports.roles, function (_a) {
    var many = _a.many;
    return ({
        userRoles: many(exports.userRoles),
    });
});
exports.userRolesRelations = (0, drizzle_orm_1.relations)(exports.userRoles, function (_a) {
    var one = _a.one;
    return ({
        user: one(exports.users, { fields: [exports.userRoles.userId], references: [exports.users.id] }),
        role: one(exports.roles, { fields: [exports.userRoles.roleId], references: [exports.roles.id] }),
    });
});
exports.budgetsRelations = (0, drizzle_orm_1.relations)(exports.budgets, function (_a) {
    var many = _a.many, one = _a.one;
    return ({
        activities: many(exports.budgetActivities),
        prospect: one(exports.prospects, { fields: [exports.budgets.prospectId], references: [exports.prospects.id] }),
    });
});
exports.budgetActivitiesRelations = (0, drizzle_orm_1.relations)(exports.budgetActivities, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        budget: one(exports.budgets, { fields: [exports.budgetActivities.budgetId], references: [exports.budgets.id] }),
        subActivities: many(exports.budgetSubActivities),
    });
});
exports.budgetSubActivitiesRelations = (0, drizzle_orm_1.relations)(exports.budgetSubActivities, function (_a) {
    var one = _a.one;
    return ({
        activity: one(exports.budgetActivities, { fields: [exports.budgetSubActivities.activityId], references: [exports.budgetActivities.id] }),
    });
});
exports.serviceRequestsRelations = (0, drizzle_orm_1.relations)(exports.serviceRequests, function (_a) {
    var many = _a.many, one = _a.one;
    return ({
        items: many(exports.serviceRequestItems),
        quoteResponses: many(exports.quoteResponses),
        project: one(exports.projects, { fields: [exports.serviceRequests.projectId], references: [exports.projects.id] }),
        requester: one(exports.users, { fields: [exports.serviceRequests.requesterId], references: [exports.users.id] }),
    });
});
exports.serviceRequestItemsRelations = (0, drizzle_orm_1.relations)(exports.serviceRequestItems, function (_a) {
    var one = _a.one;
    return ({
        request: one(exports.serviceRequests, { fields: [exports.serviceRequestItems.serviceRequestId], references: [exports.serviceRequests.id] }),
    });
});
exports.purchaseOrdersRelations = (0, drizzle_orm_1.relations)(exports.purchaseOrders, function (_a) {
    var many = _a.many, one = _a.one;
    return ({
        items: many(exports.purchaseOrderItems),
        supplier: one(exports.suppliers, { fields: [exports.purchaseOrders.supplierId], references: [exports.suppliers.id] }),
        project: one(exports.projects, { fields: [exports.purchaseOrders.projectId], references: [exports.projects.id] }),
        goodsReceipts: many(exports.goodsReceipts),
    });
});
exports.purchaseOrderItemsRelations = (0, drizzle_orm_1.relations)(exports.purchaseOrderItems, function (_a) {
    var one = _a.one;
    return ({
        order: one(exports.purchaseOrders, { fields: [exports.purchaseOrderItems.purchaseOrderId], references: [exports.purchaseOrders.id] }),
    });
});
exports.goodsReceiptsRelations = (0, drizzle_orm_1.relations)(exports.goodsReceipts, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        purchaseOrder: one(exports.purchaseOrders, { fields: [exports.goodsReceipts.purchaseOrderId], references: [exports.purchaseOrders.id] }),
        items: many(exports.goodsReceiptItems),
        creditNotes: many(exports.creditNotes),
    });
});
exports.goodsReceiptItemsRelations = (0, drizzle_orm_1.relations)(exports.goodsReceiptItems, function (_a) {
    var one = _a.one;
    return ({
        receipt: one(exports.goodsReceipts, { fields: [exports.goodsReceiptItems.goodsReceiptId], references: [exports.goodsReceipts.id] }),
        purchaseOrderItem: one(exports.purchaseOrderItems, { fields: [exports.goodsReceiptItems.purchaseOrderItemId], references: [exports.purchaseOrderItems.id] }),
    });
});
exports.creditNotesRelations = (0, drizzle_orm_1.relations)(exports.creditNotes, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        goodsReceipt: one(exports.goodsReceipts, { fields: [exports.creditNotes.goodsReceiptId], references: [exports.goodsReceipts.id] }),
        purchaseOrder: one(exports.purchaseOrders, { fields: [exports.creditNotes.purchaseOrderId], references: [exports.purchaseOrders.id] }),
        project: one(exports.projects, { fields: [exports.creditNotes.projectId], references: [exports.projects.id] }),
        supplier: one(exports.suppliers, { fields: [exports.creditNotes.supplierId], references: [exports.suppliers.id] }),
        items: many(exports.creditNoteItems),
    });
});
exports.creditNoteItemsRelations = (0, drizzle_orm_1.relations)(exports.creditNoteItems, function (_a) {
    var one = _a.one;
    return ({
        creditNote: one(exports.creditNotes, { fields: [exports.creditNoteItems.creditNoteId], references: [exports.creditNotes.id] }),
        purchaseOrderItem: one(exports.purchaseOrderItems, { fields: [exports.creditNoteItems.purchaseOrderItemId], references: [exports.purchaseOrderItems.id] }),
    });
});
exports.quoteResponsesRelations = (0, drizzle_orm_1.relations)(exports.quoteResponses, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        serviceRequest: one(exports.serviceRequests, { fields: [exports.quoteResponses.serviceRequestId], references: [exports.serviceRequests.id] }),
        supplier: one(exports.suppliers, { fields: [exports.quoteResponses.supplierId], references: [exports.suppliers.id] }),
        items: many(exports.quoteResponseItems),
    });
});
exports.quoteResponseItemsRelations = (0, drizzle_orm_1.relations)(exports.quoteResponseItems, function (_a) {
    var one = _a.one;
    return ({
        quoteResponse: one(exports.quoteResponses, { fields: [exports.quoteResponseItems.quoteResponseId], references: [exports.quoteResponses.id] }),
        serviceRequestItem: one(exports.serviceRequestItems, { fields: [exports.quoteResponseItems.serviceRequestItemId], references: [exports.serviceRequestItems.id] }),
    });
});
exports.predeterminedActivitiesRelations = (0, drizzle_orm_1.relations)(exports.predeterminedActivities, function (_a) {
    var many = _a.many;
    return ({
        subActivities: many(exports.predeterminedSubActivities),
    });
});
exports.predeterminedSubActivitiesRelations = (0, drizzle_orm_1.relations)(exports.predeterminedSubActivities, function (_a) {
    var one = _a.one;
    return ({
        activity: one(exports.predeterminedActivities, { fields: [exports.predeterminedSubActivities.predeterminedActivityId], references: [exports.predeterminedActivities.id] }),
    });
});
exports.offersRelations = (0, drizzle_orm_1.relations)(exports.offers, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        prospect: one(exports.prospects, { fields: [exports.offers.prospectId], references: [exports.prospects.id] }),
        budget: one(exports.budgets, { fields: [exports.offers.budgetId], references: [exports.budgets.id] }),
        changeOrders: many(exports.changeOrders),
    });
});
// Change Orders Table
exports.changeOrders = (0, pg_core_1.pgTable)('change_orders', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    consecutive: (0, pg_core_1.text)('consecutive').notNull(),
    offerId: (0, pg_core_1.integer)('offer_id').references(function () { return exports.offers.id; }),
    projectName: (0, pg_core_1.text)('project_name'),
    description: (0, pg_core_1.text)('description').notNull(),
    changeType: (0, pg_core_1.text)('change_type').notNull(), // 'Adicional' | 'Crédito'
    amountImpact: (0, pg_core_1.numeric)('amount_impact').notNull().default('0'),
    budgetImpact: (0, pg_core_1.numeric)('budget_impact').notNull().default('0'),
    creationDate: (0, pg_core_1.text)('creation_date'),
    approvalDate: (0, pg_core_1.text)('approval_date'),
    status: (0, pg_core_1.text)('status').notNull().default('Pendiente Aprobación'),
    budgetId: (0, pg_core_1.integer)('budget_id').references(function () { return exports.budgets.id; }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
});
exports.changeOrdersRelations = (0, drizzle_orm_1.relations)(exports.changeOrders, function (_a) {
    var one = _a.one;
    return ({
        offer: one(exports.offers, { fields: [exports.changeOrders.offerId], references: [exports.offers.id] }),
        budget: one(exports.budgets, { fields: [exports.changeOrders.budgetId], references: [exports.budgets.id] }),
    });
});
exports.subcontractsRelations = (0, drizzle_orm_1.relations)(exports.subcontracts, function (_a) {
    var one = _a.one;
    return ({
        purchaseOrder: one(exports.purchaseOrders, { fields: [exports.subcontracts.purchaseOrderId], references: [exports.purchaseOrders.id] }),
        project: one(exports.projects, { fields: [exports.subcontracts.projectId], references: [exports.projects.id] }),
        supplier: one(exports.suppliers, { fields: [exports.subcontracts.supplierId], references: [exports.suppliers.id] }),
    });
});
exports.accountsPayableRelations = (0, drizzle_orm_1.relations)(exports.accountsPayable, function (_a) {
    var one = _a.one;
    return ({
        purchaseOrder: one(exports.purchaseOrders, { fields: [exports.accountsPayable.purchaseOrderId], references: [exports.purchaseOrders.id] }),
        subcontract: one(exports.subcontracts, { fields: [exports.accountsPayable.subcontractId], references: [exports.subcontracts.id] }),
        supplier: one(exports.suppliers, { fields: [exports.accountsPayable.supplierId], references: [exports.suppliers.id] }),
    });
});
exports.bonosRelations = (0, drizzle_orm_1.relations)(exports.bonos, function (_a) {
    var one = _a.one;
    return ({
        budget: one(exports.budgets, { fields: [exports.bonos.budgetId], references: [exports.budgets.id] }),
    });
});
// Administrative Budgets table
exports.administrativeBudgets = (0, pg_core_1.pgTable)('administrative_budgets', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    year: (0, pg_core_1.integer)('year').notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    categories: (0, pg_core_1.jsonb)('categories').notNull().default([]), // Array of AdministrativeBudgetCategory
    sourceCategories: (0, pg_core_1.jsonb)('source_categories').notNull().default([]), // Array of AdministrativeBudgetSourceCategory
    status: (0, pg_core_1.text)('status').notNull().default('Borrador'),
    approvalHistory: (0, pg_core_1.jsonb)('approval_history').notNull().default([]),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
});
// System Sequences (Folios Atómicos Generales)
exports.systemSequences = (0, pg_core_1.pgTable)('system_sequences', {
    prefix: (0, pg_core_1.text)('prefix').primaryKey(), // e.g: 'PRE', 'FAC', 'REQ'
    lastValue: (0, pg_core_1.integer)('last_value').notNull().default(0),
}).enableRLS();
// Administrative Expenses table
exports.administrativeExpenses = (0, pg_core_1.pgTable)('administrative_expenses', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    date: (0, pg_core_1.date)('date').notNull(),
    categoryId: (0, pg_core_1.integer)('category_id').notNull(),
    budgetId: (0, pg_core_1.integer)('budget_id').references(function () { return exports.administrativeBudgets.id; }),
    amount: (0, pg_core_1.numeric)('amount').notNull().default('0'),
    supplier: (0, pg_core_1.text)('supplier').notNull(),
    description: (0, pg_core_1.text)('description').notNull(),
    invoiceNumber: (0, pg_core_1.text)('invoice_number'),
    paymentProofName: (0, pg_core_1.text)('payment_proof_name'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
}).enableRLS();
exports.administrativeBudgetsRelations = (0, drizzle_orm_1.relations)(exports.administrativeBudgets, function (_a) {
    var many = _a.many;
    return ({
        expenses: many(exports.administrativeExpenses),
    });
});
exports.administrativeExpensesRelations = (0, drizzle_orm_1.relations)(exports.administrativeExpenses, function (_a) {
    var one = _a.one;
    return ({
        budget: one(exports.administrativeBudgets, { fields: [exports.administrativeExpenses.budgetId], references: [exports.administrativeBudgets.id] }),
    });
});
exports.auditLogsRelations = (0, drizzle_orm_1.relations)(exports.auditLogs, function (_a) {
    var one = _a.one;
    return ({
        user: one(exports.users, { fields: [exports.auditLogs.userId], references: [exports.users.id] }),
    });
});
// Pre-operative Rubros table
exports.preOpRubros = (0, pg_core_1.pgTable)('pre_op_rubros', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    nombre: (0, pg_core_1.text)('nombre').notNull(),
    limitePorProspecto: (0, pg_core_1.numeric)('limite_por_prospecto').notNull().default('0'),
}).enableRLS();
// Pre-operative Expenses table
exports.preOpExpenses = (0, pg_core_1.pgTable)('pre_op_expenses', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    prospectId: (0, pg_core_1.integer)('prospect_id').references(function () { return exports.prospects.id; }),
    prospectName: (0, pg_core_1.text)('prospect_name'),
    budgetId: (0, pg_core_1.integer)('budget_id').references(function () { return exports.budgets.id; }),
    budgetName: (0, pg_core_1.text)('budget_name'),
    fecha: (0, pg_core_1.date)('fecha').notNull(),
    totalGasto: (0, pg_core_1.numeric)('total_gasto').notNull().default('0'),
    status: (0, pg_core_1.text)('status').notNull().default('Registrado'),
    desglose: (0, pg_core_1.jsonb)('desglose').notNull().default({}),
    ad_hoc_expenses: (0, pg_core_1.jsonb)('ad_hoc_expenses').default([]),
    descripcion: (0, pg_core_1.text)('descripcion'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
});
exports.preOpExpensesRelations = (0, drizzle_orm_1.relations)(exports.preOpExpenses, function (_a) {
    var one = _a.one;
    return ({
        prospect: one(exports.prospects, { fields: [exports.preOpExpenses.prospectId], references: [exports.prospects.id] }),
        budget: one(exports.budgets, { fields: [exports.preOpExpenses.budgetId], references: [exports.budgets.id] }),
    });
});
// Company Info Table
exports.companyInfo = (0, pg_core_1.pgTable)('company_info', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tenantId: (0, pg_core_1.integer)('tenant_id').notNull().default(1),
    name: (0, pg_core_1.text)('name').notNull(),
    legalId: (0, pg_core_1.text)('legal_id'),
    address: (0, pg_core_1.text)('address'),
    phone: (0, pg_core_1.text)('phone'),
    email: (0, pg_core_1.text)('email'),
    logoBase64: (0, pg_core_1.text)('logo_base64'),
    country: (0, pg_core_1.text)('country').default('CR'),
    ivaRate: (0, pg_core_1.numeric)('iva_rate').default('13'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
});
