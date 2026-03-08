
import { User, Role, Permissions, Project, ProjectType, ProjectStatus, ServiceRequest, ServiceRequestStatus, Offer, OfferStatus, Prospect, AccountReceivable, Payment, Supplier, Material, ServiceItem, AccountPayable, APStatus, PurchaseOrder, POStatus, QuoteResponse, ChangeOrder, ChangeOrderStatus, RecurringOrderTemplate, CompanyInfo, Budget, BudgetStatus, PredeterminedActivity, GoodsReceipt, CreditNote, InventoryAdjustmentLog, LaborItem, AdministrativeBudget, AdministrativeExpense, Action, Subcontract, BonoRequisito, PreOpRubro, PreOpExpense } from '../types';
import { addDays } from 'date-fns';

const allPermissions: Permissions = {
  dashboard: { main: ['view'] },
  sales: {
    main: ['view'],
    prospects: ['view', 'create', 'edit', 'delete', 'export'],
    budgets: ['view', 'create', 'edit', 'delete', 'export'],
    offers: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    changeOrders: ['view', 'create', 'edit', 'delete', 'approve', 'export']
  },
  projects: { main: ['view', 'create', 'edit', 'delete', 'export'] },
  income: { main: ['view', 'create', 'edit', 'delete', 'export'] },
  purchasing: {
    main: ['view'],
    requests: ['view', 'create', 'edit', 'approve', 'delete'],
    quotes: ['view', 'create', 'edit', 'delete'],
    orders: ['view', 'create', 'approve', 'delete', 'export'],
    receipts: ['view', 'edit'],
    creditNotes: ['view', 'create', 'approve', 'delete'],
    payables: ['view', 'create', 'edit', 'export']
  },
  subcontracts: {
    main: ['view', 'create', 'edit', 'delete']
  },
  bonos: {
    main: ['view', 'create', 'edit', 'delete']
  },
  adminExpenses: {
    main: ['view'],
    budget: ['view', 'create', 'edit', 'delete', 'approve'],
    expenses: ['view', 'create', 'edit', 'delete']
  },
  database: {
    main: ['view'],
    suppliers: ['view', 'create', 'edit', 'delete'],
    materials: ['view', 'create', 'edit', 'delete', 'export'],
    inventory: ['view', 'create'],
    subcontracts: ['view', 'create', 'edit', 'delete'],
    labor: ['view', 'create', 'edit', 'delete'],
    recurringOrders: ['view', 'create', 'edit', 'delete'],
    predeterminedActivities: ['view', 'create', 'edit', 'delete'],
  },
  configuration: {
    main: ['view'],
    general: ['edit'],
    users: ['view', 'create', 'edit', 'delete'],
    roles: ['view', 'create', 'edit', 'delete']
  }
};

const directorProyectosPermissions: Permissions = {
  dashboard: allPermissions.dashboard,
  sales: allPermissions.sales,
  projects: allPermissions.projects,
  income: allPermissions.income,
  purchasing: allPermissions.purchasing,
  subcontracts: allPermissions.subcontracts,
  bonos: allPermissions.bonos,
  database: allPermissions.database,
  configuration: {
    main: ['view'],
    users: ['view'],
    roles: ['view']
  }
};

export const MOCK_ROLES: Role[] = [
  { id: 1, name: 'Gerente General', description: 'Acceso total y todas las aprobaciones.', permissions: allPermissions, isDefault: true },
  { id: 2, name: 'Director de proyectos', description: 'Gestiona proyectos y aprueba solicitudes iniciales.', permissions: directorProyectosPermissions, maxItemOveragePercentage: 10, maxProjectOveragePercentage: 5 },
  { id: 3, name: 'Encargado de proyectos', description: 'Crea solicitudes y gestiona el día a día de los proyectos.', permissions: { dashboard: { main: ['view'] }, projects: { main: ['view', 'edit'] }, purchasing: { main: ['view'], requests: ['view', 'create'] } } },
  { id: 4, name: 'Director financiero', description: 'Gestiona finanzas, aprueba órdenes de compra y pagos.', permissions: { ...allPermissions, configuration: { main: ['view'], general: ['edit'], users: ['view', 'edit'], roles: ['view', 'edit'] } }, maxItemOveragePercentage: 15, maxProjectOveragePercentage: 8 },
  { id: 5, name: 'Proveeduria', description: 'Gestiona cotizaciones y órdenes de compra.', permissions: { purchasing: allPermissions.purchasing, database: allPermissions.database } },
  { id: 6, name: 'Director de Ventas', description: 'Gestiona el equipo de ventas, prospectos y ofertas.', permissions: { sales: allPermissions.sales, income: allPermissions.income } },
];

export const MOCK_USERS: User[] = [
  { id: 1, name: 'Usuario Administrador', email: 'admin@flowerp.com', roleIds: [1], avatar: 'https://picsum.photos/seed/flowerp/100', status: 'Active' }
];

export const MOCK_COMPANY_INFO: CompanyInfo = {
  name: 'FLOWERP CONSTRUCTORA',
  legalId: '3-101-000000',
  address: 'Sede Central, San José, Costa Rica',
  phone: '2000-0000',
  email: 'administracion@flowerp.com',
  logoBase64: '',
  country: 'CR',
  ivaRate: 13,
};

// All transactional and master data arrays cleared
export const MOCK_PROJECTS: Project[] = [];
export const MOCK_SERVICE_REQUESTS: ServiceRequest[] = [];
export const MOCK_PROSPECTS: Prospect[] = [];
export const MOCK_OFFERS: Offer[] = [];
export const MOCK_BUDGETS: Budget[] = [];
export const MOCK_ACCOUNTS_RECEIVABLE: AccountReceivable[] = [];
export const MOCK_CHANGE_ORDERS: ChangeOrder[] = [];
export const MOCK_SUPPLIERS: Supplier[] = [];
export const MOCK_MATERIALS: Material[] = [];
export const MOCK_SERVICE_ITEMS: ServiceItem[] = [];
export const MOCK_LABOR_ITEMS: LaborItem[] = [];
export const MOCK_RECURRING_ORDER_TEMPLATES: RecurringOrderTemplate[] = [];
export const MOCK_QUOTE_RESPONSES: QuoteResponse[] = [];
export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [];
export const MOCK_ACCOUNTS_PAYABLE: AccountPayable[] = [];
export const MOCK_GOODS_RECEIPTS: GoodsReceipt[] = [];
export const MOCK_CREDIT_NOTES: CreditNote[] = [];
export const MOCK_SUBCONTRACTS: Subcontract[] = [];
export const MOCK_PREDETERMINED_ACTIVITIES: PredeterminedActivity[] = [];
export const MOCK_INVENTORY_ADJUSTMENT_LOGS: InventoryAdjustmentLog[] = [];
export const MOCK_ADMINISTRATIVE_BUDGETS: AdministrativeBudget[] = [];
export const MOCK_ADMINISTRATIVE_EXPENSES: AdministrativeExpense[] = [];
export const MOCK_BONOS_ITEMS: BonoRequisito[] = [];
export const MOCK_PREOP_RUBROS: PreOpRubro[] = [
  { id: 1, nombre: 'FORMALIZACIÓN', limitePorProspecto: 300000 },
  { id: 2, nombre: 'COMISIONES', limitePorProspecto: 250000 },
  { id: 3, nombre: 'AVALÚOS', limitePorProspecto: 150000 },
  { id: 4, nombre: 'Permiso de construcción', limitePorProspecto: 0 },
  { id: 5, nombre: 'Poliza RT', limitePorProspecto: 0 },
  { id: 6, nombre: 'Tasado CFIA', limitePorProspecto: 0 },
  { id: 7, nombre: 'Caja Chica', limitePorProspecto: 0 },
  { id: 8, nombre: 'Gastos operativos del proyecto', limitePorProspecto: 0 }
];
export const MOCK_PREOP_EXPENSES: PreOpExpense[] = [];

const useMockData = () => {
  return {
    users: MOCK_USERS,
    roles: MOCK_ROLES,
    companyInfo: MOCK_COMPANY_INFO,
    projects: MOCK_PROJECTS,
    serviceRequests: MOCK_SERVICE_REQUESTS,
    quoteResponses: MOCK_QUOTE_RESPONSES,
    purchaseOrders: MOCK_PURCHASE_ORDERS,
    accountsPayable: MOCK_ACCOUNTS_PAYABLE,
    goodsReceipts: MOCK_GOODS_RECEIPTS,
    creditNotes: MOCK_CREDIT_NOTES,
    subcontracts: MOCK_SUBCONTRACTS,
    prospects: MOCK_PROSPECTS,
    offers: MOCK_OFFERS,
    changeOrders: MOCK_CHANGE_ORDERS,
    accountsReceivable: MOCK_ACCOUNTS_RECEIVABLE,
    suppliers: MOCK_SUPPLIERS,
    materials: MOCK_MATERIALS,
    serviceItems: MOCK_SERVICE_ITEMS,
    laborItems: MOCK_LABOR_ITEMS,
    recurringOrderTemplates: MOCK_RECURRING_ORDER_TEMPLATES,
    budgets: MOCK_BUDGETS,
    predeterminedActivities: MOCK_PREDETERMINED_ACTIVITIES,
    inventoryAdjustmentLogs: MOCK_INVENTORY_ADJUSTMENT_LOGS,
    administrativeBudgets: MOCK_ADMINISTRATIVE_BUDGETS,
    administrativeExpenses: MOCK_ADMINISTRATIVE_EXPENSES,
    bonosItems: MOCK_BONOS_ITEMS,
    preOpRubros: MOCK_PREOP_RUBROS,
    preOpExpenses: MOCK_PREOP_EXPENSES,
  };
};

export default useMockData;
