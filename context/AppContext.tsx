
import React, { createContext } from 'react';
import { User, Role, Project, ServiceRequest, PurchaseOrder, AccountPayable, Prospect, Offer, ChangeOrder, AccountReceivable, Supplier, Material, ServiceItem, RecurringOrderTemplate, CompanyInfo, QuoteResponse, Budget, PredeterminedActivity, GoodsReceipt, CreditNote, InventoryAdjustmentLog, LaborItem, AdministrativeBudget, AdministrativeExpense, Subcontract, BonoRequisito, PreOpRubro, PreOpExpense } from '../types';

export interface AppContextType {
    user: User;
    setUser: React.Dispatch<React.SetStateAction<User>>;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    serviceRequests: ServiceRequest[];
    setServiceRequests: React.Dispatch<React.SetStateAction<ServiceRequest[]>>;
    quoteResponses: QuoteResponse[];
    setQuoteResponses: React.Dispatch<React.SetStateAction<QuoteResponse[]>>;
    purchaseOrders: PurchaseOrder[];
    setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
    accountsPayable: AccountPayable[];
    setAccountsPayable: React.Dispatch<React.SetStateAction<AccountPayable[]>>;
    goodsReceipts: GoodsReceipt[];
    setGoodsReceipts: React.Dispatch<React.SetStateAction<GoodsReceipt[]>>;
    creditNotes: CreditNote[];
    setCreditNotes: React.Dispatch<React.SetStateAction<CreditNote[]>>;
    subcontracts: Subcontract[];
    setSubcontracts: React.Dispatch<React.SetStateAction<Subcontract[]>>;
    prospects: Prospect[];
    setProspects: React.Dispatch<React.SetStateAction<Prospect[]>>;
    offers: Offer[];
    setOffers: React.Dispatch<React.SetStateAction<Offer[]>>;
    changeOrders: ChangeOrder[];
    setChangeOrders: React.Dispatch<React.SetStateAction<ChangeOrder[]>>;
    accountsReceivable: AccountReceivable[];
    setAccountsReceivable: React.Dispatch<React.SetStateAction<AccountReceivable[]>>;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    roles: Role[];
    setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
    suppliers: Supplier[];
    setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
    materials: Material[];
    setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
    serviceItems: ServiceItem[];
    setServiceItems: React.Dispatch<React.SetStateAction<ServiceItem[]>>;
    laborItems: LaborItem[];
    setLaborItems: React.Dispatch<React.SetStateAction<LaborItem[]>>;
    recurringOrderTemplates: RecurringOrderTemplate[];
    setRecurringOrderTemplates: React.Dispatch<React.SetStateAction<RecurringOrderTemplate[]>>;
    companyInfo: CompanyInfo;
    setCompanyInfo: React.Dispatch<React.SetStateAction<CompanyInfo>>;
    budgets: Budget[];
    setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
    predeterminedActivities: PredeterminedActivity[];
    setPredeterminedActivities: React.Dispatch<React.SetStateAction<PredeterminedActivity[]>>;
    inventoryAdjustmentLogs?: InventoryAdjustmentLog[];
    setInventoryAdjustmentLogs?: React.Dispatch<React.SetStateAction<InventoryAdjustmentLog[]>>;
    administrativeBudgets: AdministrativeBudget[];
    setAdministrativeBudgets: React.Dispatch<React.SetStateAction<AdministrativeBudget[]>>;
    administrativeExpenses: AdministrativeExpense[];
    setAdministrativeExpenses: React.Dispatch<React.SetStateAction<AdministrativeExpense[]>>;
    bonosItems: BonoRequisito[];
    setBonosItems: React.Dispatch<React.SetStateAction<BonoRequisito[]>>;
    preOpRubros: PreOpRubro[];
    setPreOpRubros: React.Dispatch<React.SetStateAction<PreOpRubro[]>>;
    preOpExpenses: PreOpExpense[];
    setPreOpExpenses: React.Dispatch<React.SetStateAction<PreOpExpense[]>>;
}


// Create a context to share user data
export const AppContext = createContext<AppContextType | null>(null);
