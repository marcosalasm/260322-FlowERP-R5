
export type Action = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';

export type Permissions = {
  [module: string]: { // e.g., 'sales', 'purchasing'
    [section: string]: Action[]; // e.g., 'offers': ['view', 'create']
  };
};

export interface Role {
  id: number;
  name: string;
  description: string;
  isDefault?: boolean; // To mark non-editable/non-deletable roles
  permissions: Permissions;
  maxItemOveragePercentage?: number;
  maxProjectOveragePercentage?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  roleIds: number[]; // Replaces the old 'role: UserRole'
  avatar: string;
  status: 'Active' | 'Inactive';
  password?: string;
  individualPermissions?: Permissions; // For user-specific overrides
}

export enum ProjectType {
  BonoOrdinario = 'Bono Ordinario',
  BonoCredito = 'Bono Credito',
  BonoRAMT = 'Bono RAMT',
  BonoArt59 = 'Bono Art 59',
  Consultoria = 'Consultoria',
  Construccion = 'Construccion',
}

export enum ProjectStatus {
  InProgress = 'En Ejecución',
  Completed = 'Finalizado',
  Paused = 'Pausado',
}

export interface Project {
  id: number;
  offerId?: number; // Added to link to an approved offer
  name: string;
  creationDate: string; // YYYY-MM-DD format
  initialContractAmount: number;
  initialBudget: number;
  contractAmount: number;
  budget: number;
  location: string;
  owner: string;
  type: ProjectType;
  status: ProjectStatus;
  expenses: number;
  unforeseenExpenses: number;
}

export enum ServiceRequestStatus {
  PendingApproval = 'Pendiente Aprobación Director',
  PendingGMApproval = 'Pendiente Aprobación Gerente',
  Approved = 'Aprobada para Cotizar',
  Rejected = 'Rechazada',
  InQuotation = 'En Cotización',
  QuotationReady = 'Cotización Lista',
  POPendingApproval = 'OC Pendiente Aprobación',
  POApproved = 'OC Aprobada',
  Completed = 'Completada',
}

export interface ServiceRequestItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  specifications?: string;
  isUnforeseen?: boolean;
  unforeseenJustification?: string;
  estimatedUnitCost?: number;
}

export type WinnerSelection = { [serviceRequestItemId: number]: { quoteResponseId: number; supplierId: number; } };

export type ServiceRequestItemChangeType = 'added' | 'removed';

export interface ServiceRequestItemChange {
  user: string;
  date: string; // ISO String
  type: ServiceRequestItemChangeType;
  item: {
    name: string;
    quantity: number;
    unit: string;
  };
}

export interface ServiceRequest {
  id: number;
  projectId: number | null;
  projectName: string;
  requestDate: string;
  requester: string;
  requesterId: number;
  requiredDate: string;
  status: ServiceRequestStatus;
  items: ServiceRequestItem[];
  itemHistory?: ServiceRequestItemChange[];
  attachments?: string[];
  finalJustification?: string;
  winnerSelection?: WinnerSelection;
  overrunJustification?: string;
  rejectionHistory?: { date: string; user: string; reason: string; }[];
  isWarranty?: boolean;
  isPreOp?: boolean;
  prospectId?: number;
}

export enum QuoteStatus {
  Pending = "Pendiente",
  Received = "Recibida",
  Selected = "Seleccionada",
  Rejected = "Rechazada",
}

export interface QuoteRequest {
  id: number;
  serviceRequestId: number;
  supplierId: number;
  requestDate: string;
  status: QuoteStatus;
}

export type QualityRating = 'Alta' | 'Media' | 'Baja';

export interface QuoteResponseItem {
  serviceRequestItemId: number;
  unitPrice: number;
  quality: QualityRating;
  notes?: string;
}

export interface QuoteResponseChange {
  user: string;
  changeDate: string; // ISO String
  changes: Array<{
    field: string;
    oldValue: string | number;
    newValue: string | number;
  }>;
}

export interface QuoteResponse {
  id: number;
  serviceRequestId: number;
  supplierId: number;
  supplierName: string;
  quoteNumber?: string;
  deliveryDays: number;
  paymentTerms: string;
  qualityNotes: string; // Overall notes for the quote
  total: number;
  currency?: 'CRC' | 'USD';
  pdfAttachmentName?: string;
  pdfAttachmentBase64?: string;
  items: QuoteResponseItem[];
  history?: QuoteResponseChange[];
  aiValidation?: {
    totalMatch: boolean;
    namesMatch: boolean;
    discrepancyNote?: string;
  };
}


export enum POStatus {
  PendingFinancialApproval = 'Pendiente Aprobación Financiera',
  Approved = 'Aprobada',
  Rejected = 'Rechazada',
  Issued = 'Emitida',
  PartiallyReceived = 'Recibida Parcial',
  FullyReceived = 'Recibida Completa',
  Cancelled = 'Cancelada',
}

export interface PurchaseOrderItem extends ServiceRequestItem {
  unitPrice: number;
}

export interface PurchaseOrder {
  id: number;
  serviceRequestId: number;
  projectId: number;
  projectName: string;
  supplierId: number;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  discount: number;
  iva: number;
  totalAmount: number;
  status: POStatus;
  paymentTerms: string;
  proformaNumber?: string;
  signedPoPdfName?: string;
  signedPoPdfBase64?: string;
  proofsPdfName?: string;
  proofsPdfBase64?: string;
  rejectionReason?: string;
  isWarranty?: boolean;
  subcontractId?: number;
  isPreOp?: boolean;
  prospectId?: number;
}

export enum GoodsReceiptStatus {
  Pending = 'Pendiente de Recepción',
  PartiallyReceived = 'Recibido Parcial',
  FullyReceived = 'Recibido Completo',
}

export interface GoodsReceiptItem {
  purchaseOrderItemId: number; // Links to the original item ID in the PO (which is the ServiceRequestItem ID)
  name: string;
  quantityOrdered: number;
  unit: string;
  quantityReceived: number;
}

export interface GoodsReceipt {
  id: number;
  purchaseOrderId: number;
  creationDate: string; // Date the receipt line was created (when PO was issued)
  expectedReceiptDate: string;
  actualReceiptDate?: string; // Date when items were actually received
  receivedBy?: string;
  items: GoodsReceiptItem[];
  status: GoodsReceiptStatus;
  notes?: string;
  closedByCreditNoteIds?: number[];
  // New fields for subcontract progress
  isSubcontractReceipt?: boolean;
  amountReceived?: number;
  progressDescription?: string;
  subcontractorInvoice?: string;
}

export enum CreditNoteStatus {
  PendingApproval = 'Pendiente Aprobación',
  Approved = 'Aprobada',
  Rejected = 'Rechazada',
}

export interface CreditNoteItem {
  purchaseOrderItemId: number;
  name: string;
  quantityToCredit: number;
  unit: string;
  unitPrice: number;
  creditAmount: number;
}

export interface CreditNote {
  id: number;
  goodsReceiptId: number;
  purchaseOrderId: number;
  projectId: number;
  supplierId: number;
  supplierName: string;
  creationDate: string; // ISO String
  createdBy: string; // User name
  approvalDate?: string; // ISO String
  reason: string;
  items: CreditNoteItem[];
  totalAmount: number;
  status: CreditNoteStatus;
  appliedToInvoice?: boolean;
  pdfAttachmentName?: string;
  pdfAttachmentBase64?: string;
}


export enum APStatus {
  PendingPayment = 'Pendiente de Pago',
  PartiallyPaid = 'Pagada Parcialmente',
  Paid = 'Pagada',
  Overdue = 'Vencida',
}

export interface AccountPayable {
  id: number;
  purchaseOrderId: number;
  subcontractId?: number;
  supplierId: number;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  creditedAmount?: number;
  appliedCreditNoteIds?: number[];
  payments: Payment[];
  status: APStatus;
}


export interface Supplier {
  id: number;
  name: string;
  serviceType: string;
  location: string;
  phone: string;
  email: string;
  bankAccount: string;
  bankAccountDetails?: string;
  sinpePhone?: string;
  bankAccount2?: string;
  bankAccount2Details?: string;
  comments?: string;
}

export interface Material {
  id: number;
  name: string;
  unit: string; // e.g., 'kg', 'm2', 'unidad', 'saco'
  unitCost?: number;
  lastUpdated?: string;
  quantity: number; // Current inventory quantity
}

export interface ServiceItem {
  id: number;
  name: string;
  unit: string; // e.g., 'Hora', 'Día', 'Proyecto', 'Trámite'
  unitCost?: number;
  lastUpdated?: string;
}

export interface LaborItem {
  id: number;
  name: string;
  hourlyRate: number;
  currency: 'CRC' | 'USD';
}

export enum OfferStatus {
  Confeccion = "Confección",
  Revision = "Revisión",
  Aprobacion = "Aprobación",
  Rechazada = "Rechazada"
}

export interface Offer {
  id: number;
  consecutiveNumber: string;
  prospectId: number;
  prospectName: string;
  date: string;
  description?: string;
  amount: number;
  budget: number;
  projectType: ProjectType;
  status: OfferStatus;
  pdfAttachmentName?: string;
  budgetId?: number;
}

export interface FollowUp {
  date: string;
  comments: string;
}

export interface Prospect {
  id: number;
  name: string;
  company: string;
  phone: string;
  email: string;
  nextFollowUpDate: string; // Renamed from followUpDate
  // New personal info fields
  birthday?: string;
  spouseName?: string;
  children?: string;
  hobbies?: string;
  // Follow-up history
  followUps: FollowUp[];
  // Traceability
  source?: string; // 'Manual' | 'Conversión de Requisito Recurrente'
  sourceBonoId?: number; // ID of the bono/requisito that generated this prospect
}

export interface Payment {
  id: number;
  date: string; // ISO Date string
  amount: number;
  details?: string;
  proofAttachmentName?: string;
  proofAttachmentBase64?: string;
  paidBy?: string;
  paidById?: number;
}

export interface AccountReceivable {
  id: number;
  offerId: number;
  clientName: string;
  companyName: string;
  paymentDate: string; // Due date
  contractAmount: number;
  payments: Payment[];
  phone: string;
}

export enum ChangeOrderStatus {
  PendingApproval = 'Pendiente Aprobación',
  Approved = 'Aprobada',
  Rejected = 'Rechazada',
}

export interface ChangeOrder {
  id: number;
  consecutive: string;
  offerId: number;
  projectName: string;
  description: string;
  changeType: 'Adicional' | 'Crédito';
  amountImpact: number; // Always a positive value
  budgetImpact: number; // Always a positive value
  creationDate: string;
  approvalDate?: string;
  status: ChangeOrderStatus;
  budgetId?: number;
}

export interface RecurringOrderTemplate {
  id: number;
  name: string;
  description?: string;
  items: ServiceRequestItem[];
}

export interface CompanyInfo {
  name: string;
  legalId: string;
  address: string;
  phone: string;
  email: string;
  logoBase64?: string;
  country: string;
  ivaRate: number;
}

// Budgeting Module Types
export enum BudgetStatus {
  Draft = 'Borrador',
  Finalized = 'Finalizado',
  Linked = 'Vinculado a Oferta',
}

export interface BudgetSubActivity {
  id: number;
  itemNumber: string;
  description: string;
  quantity: number | string;
  unit: string;
  materialUnitCost: number | string;
  laborUnitCost: number | string;
  subcontractUnitCost: number | string;
}

export interface BudgetActivity {
  id: number;
  itemNumber: string;
  description: string;
  quantity: number | string;
  unit: string;
  subActivities: BudgetSubActivity[];
  predeterminedActivityId?: number;
}

export interface IndirectCosts {
  utility: number;
  administration: number;
  unexpected: number;
  permit: number;
  cfa: number;
  rtPolicy: number;
  professionalFees: number;
  pettyCash: number;
}

export interface OperationalExpenseItem {
  id: number;
  description: string;
  quantity: number | string;
  unit: string;
  unitCost: number | string;
}

export interface Budget {
  id: number;
  consecutiveNumber: string;
  prospectId: number;
  prospectName: string;
  date: string;
  description?: string;
  activities: BudgetActivity[];
  indirectCosts: IndirectCosts;
  operationalExpenses?: OperationalExpenseItem[];
  directCostTotal: number;
  indirectCostTotal: number;
  total: number; // Gran Total del Presupuesto (pre-tax)
  countryCode: string;
  currency: 'CRC' | 'USD';
  taxRate: number;
  finalTotal: number;
  status: BudgetStatus;
  isRecurring?: boolean;
}

// Predetermined Activities Module Types
export interface PredeterminedSubActivity {
  id: number;
  itemNumber: string;
  type: 'material' | 'labor' | 'subcontract';
  description: string;
  quantityPerBaseUnit: number;
  unit: string;
  notes?: string;
}

export interface PredeterminedActivity {
  id: number;
  name: string;
  baseUnit: string;
  subActivities: PredeterminedSubActivity[];
}

// Inventory Module Types
export type AdjustmentType = 'Entrada' | 'Salida';

export interface InventoryAdjustmentLog {
  id: number;
  materialId: number;
  materialName: string;
  adjustmentDate: string; // ISO String
  user: string; // User name
  adjustmentType: AdjustmentType;
  quantityAdjusted: number;
  quantityBefore: number;
  quantityAfter: number;
  justification: string;
  relatedDocument?: string; // e.g., 'OC-123'
}

// Administrative Expenses Module Types
export interface AdministrativeBudgetCategory {
  id: number;
  name: string;
  monthlyAmounts: number[]; // 12 months, 0-indexed
  annualBudget: number; // sum of monthlyAmounts
}

export type BudgetItemFrequency = 'Pago Único' | 'Mensual' | 'Trimestral' | 'Anual';

export interface AdministrativeBudgetItem {
  id: number;
  description: string;
  amount: number;
  frequency: BudgetItemFrequency;
  month: number; // 0-11, for 'Pago Único'
  notes: string;
}

export interface AdministrativeBudgetSourceCategory {
  id: number;
  name: string;
  isCustom: boolean;
  items: AdministrativeBudgetItem[];
}

export interface AdministrativeBudget {
  id: number;
  year: number;
  name: string;
  categories: AdministrativeBudgetCategory[];
  sourceCategories?: AdministrativeBudgetSourceCategory[];
  status: 'Borrador' | 'En Revisión' | 'Aprobado' | 'Finalizado';
  approvalHistory?: {
    user: string;
    date: string; // ISO String
    action: 'Creado' | 'Aprobado' | 'Modificado';
  }[];
}

export interface AdministrativeExpense {
  id: number;
  date: string; // YYYY-MM-DD
  categoryId: number; // Links to AdministrativeBudgetCategory.id
  budgetId: number; // Links to AdministrativeBudget.id
  amount: number;
  supplier: string;
  description: string;
  invoiceNumber?: string;
  paymentProofBase64?: string;
  paymentProofName?: string;
}

// Subcontracts Module Types
export interface SubcontractInstallment {
  id: number;
  description: string;
  amount: number;
  isPaid: boolean;
}

export interface Subcontract {
  id: number;
  purchaseOrderId: number;
  projectId: number;
  supplierId: number;
  contractNumber: string;
  scopeDescription: string;
  contractAmount: number;
  paymentTerms: string;
  creationDate: string; // ISO String
  contractPdfName?: string;
  contractPdfBase64?: string;
  relatedDocs?: { name: string; base64: string }[];
  installments?: SubcontractInstallment[];
}

// Bonos (R4) Types
export interface BonoRequisito {
  id: number;
  nombre: string;
  tipoBono: string;
  entidad: string;
  estatus: string;
  ubicacion: string;
  fechaEntrega: string;
  monto: number;
  budgetId?: number;
  presupuesto?: number;
  constructora?: string;
  checklist?: { name: string; status: string }[];
  logs?: { date: string; user: string; content: string }[];
}

// Pre-operative Expenses Types
export interface PreOpRubro {
  id: number;
  nombre: string;
  limitePorProspecto: number;
}

export interface PreOpExpense {
  id: number;
  prospectId?: number;
  prospectName?: string;
  budgetId?: number;
  budgetName?: string;
  fecha: string;
  totalGasto: number;
  status: 'Registrado' | 'Cerrado';
  desglose: { [rubroId: number]: number };
}
