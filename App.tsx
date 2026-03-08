
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/auth/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import Dashboard from './components/dashboard/Dashboard';
import PurchasingDashboard from './components/purchasing/PurchasingDashboard';
import SalesDashboard from './components/sales/SalesDashboard';
import ProjectsDashboard from './components/projects/ProjectsDashboard';
import IncomeDashboard from './components/income/IncomeDashboard';
import DatabaseDashboard from './components/database/DatabaseDashboard';
import ConfigurationDashboard from './components/configuration/ConfigurationDashboard';
import AdminExpensesDashboard from './components/admin_expenses/AdminExpensesDashboard';
import SubcontractsDashboard from './components/subcontracts/SubcontractsDashboard';
import BonosDashboard from './components/bonos/BonosDashboard';
import { User, Project, ServiceRequest, Prospect, Offer, AccountReceivable, Supplier, Material, ServiceItem, PurchaseOrder, AccountPayable, ChangeOrder, RecurringOrderTemplate, CompanyInfo, Role, QuoteResponse, Budget, PredeterminedActivity, GoodsReceipt, CreditNote, CreditNoteStatus, POStatus, InventoryAdjustmentLog, LaborItem, ServiceRequestStatus, ChangeOrderStatus, AdministrativeBudget, AdministrativeExpense, Subcontract, BonoRequisito, PreOpRubro, PreOpExpense } from './types';
import useMockData from './hooks/useMockData';
import { AppContext, AppContextType } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { apiService } from './services/apiService';

// Define available views
type View = 'dashboard' | 'purchasing' | 'sales' | 'projects' | 'income' | 'database' | 'configuration' | 'admin_expenses' | 'subcontracts' | 'bonos' | string;

const App: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');

  // --- AUTH GUARD ---
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(59,130,246,0.2)',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'rgba(148,163,184,0.8)', margin: 0, fontSize: '14px' }}>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }
  // --- END AUTH GUARD ---



  const {
    users: initialUsers,
    roles: initialRoles,
    companyInfo: initialCompanyInfo,
    projects: initialProjects,
    serviceRequests: initialServiceRequests,
    quoteResponses: initialQuoteResponses,
    purchaseOrders: initialPurchaseOrders,
    accountsPayable: initialAccountsPayable,
    goodsReceipts: initialGoodsReceipts,
    creditNotes: initialCreditNotes,
    subcontracts: initialSubcontracts,
    prospects: initialProspects,
    offers: initialOffers,
    changeOrders: initialChangeOrders,
    accountsReceivable: initialAccountsReceivable,
    suppliers: initialSuppliers,
    materials: initialMaterials,
    serviceItems: initialServiceItems,
    laborItems: initialLaborItems,
    recurringOrderTemplates: initialRecurringOrderTemplates,
    budgets: initialBudgets,
    predeterminedActivities: initialPredeterminedActivities,
    inventoryAdjustmentLogs: initialInventoryAdjustmentLogs,
    administrativeBudgets: initialAdministrativeBudgets,
    administrativeExpenses: initialAdministrativeExpenses,
    bonosItems: initialBonosItems,
    preOpRubros: initialPreOpRubros,
    preOpExpenses: initialPreOpExpenses,
  } = useMockData();

  const [users, setUsers] = useState<User[]>(initialUsers);
  const [roles, setRoles] = useState<Role[]>(initialRoles);

  useEffect(() => {
    const fetchData = async () => {
      // Use Promise.allSettled so that if any single API call fails,
      // the rest of the data still loads correctly.
      const results = await Promise.allSettled([
        apiService.getUsers(),                    // 0
        apiService.getProjects(),                 // 1
        apiService.getProspects(),                // 2
        apiService.getServiceRequests(),          // 3
        apiService.getPurchaseOrders(),           // 4
        apiService.getOffers(),                   // 5
        apiService.getBudgets(),                  // 6
        apiService.getChangeOrders(),             // 7
        apiService.getMaterials(),                // 8
        apiService.getServiceItems(),             // 9
        apiService.getLaborItems(),               // 10
        apiService.getSuppliers(),                // 11
        apiService.getRecurringOrderTemplates(),  // 12
        apiService.getPredeterminedActivities(),  // 13
        apiService.getSubcontracts(),             // 14
        apiService.getBonos(),                    // 15
        apiService.getAccountsReceivable(),       // 16
        apiService.getQuoteResponses(),           // 17
        apiService.getAccountsPayable(),          // 18
        apiService.getGoodsReceipts(),            // 19
        apiService.getCreditNotes(),              // 20
        apiService.getAdministrativeBudgets(),    // 21
        apiService.getAdministrativeExpenses(),   // 22
        apiService.getPreOpRubros(),              // 23
        apiService.getPreOpExpenses(),            // 24
        apiService.getRoles(),                    // 25
        apiService.getCompanyInfo()               // 26
      ]);

      // Helper: safely extract fulfilled value
      const get = (i: number) => results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value : null;

      const liveUsers = get(0);
      const liveProjects = get(1);
      const liveProspects = get(2);
      const liveServiceRequests = get(3);
      const livePurchaseOrders = get(4);
      const liveOffers = get(5);
      const liveBudgets = get(6);
      const liveChangeOrders = get(7);
      const liveMaterials = get(8);
      const liveServiceItems = get(9);
      const liveLaborItems = get(10);
      const liveSuppliers = get(11);
      const liveRecurringTemplates = get(12);
      const livePredeterminedActivities = get(13);
      const liveSubcontracts = get(14);
      const liveBonos = get(15);
      const liveAccountsReceivable = get(16);
      const liveQuoteResponses = get(17);
      const liveAccountsPayable = get(18);
      const liveGoodsReceipts = get(19);
      const liveCreditNotes = get(20);
      const liveAdminBudgets = get(21);
      const liveAdminExpenses = get(22);
      const livePreOpRubros = get(23);
      const livePreOpExpenses = get(24);
      const liveRoles = get(25);
      const liveCompanyInfo = get(26);

      // Log any failed fetch calls for debugging
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.warn(`API call #${i} failed:`, result.reason?.message || result.reason);
        }
      });

      if (liveUsers && liveUsers.length > 0) {
        setUsers(liveUsers.map((u: any) => ({
          ...u,
          roleIds: u.userRoles ? u.userRoles.map((ur: any) => ur.roleId) : (u.roleIds || [1]),
          avatar: u.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          status: u.status || 'Active'
        })));
      }

      if (liveProjects) setProjects(liveProjects);
      if (liveProspects) setProspects(liveProspects);
      if (liveServiceRequests) setServiceRequests(liveServiceRequests);
      if (livePurchaseOrders) setPurchaseOrders(livePurchaseOrders);
      if (liveOffers) setOffers(liveOffers);
      if (liveBudgets) setBudgets(liveBudgets);
      if (liveChangeOrders) setChangeOrders(liveChangeOrders);
      if (liveMaterials) setMaterials(liveMaterials);
      if (liveServiceItems) setServiceItems(liveServiceItems);
      if (liveLaborItems) setLaborItems(liveLaborItems);
      if (liveSuppliers) setSuppliers(liveSuppliers);
      if (liveRecurringTemplates) setRecurringOrderTemplates(liveRecurringTemplates);
      if (livePredeterminedActivities) setPredeterminedActivities(livePredeterminedActivities);
      if (liveSubcontracts) setSubcontracts(liveSubcontracts);
      if (liveBonos) setBonosItems(liveBonos);
      if (liveAccountsReceivable) setAccountsReceivable(liveAccountsReceivable);
      if (liveQuoteResponses) setQuoteResponses(liveQuoteResponses);
      if (liveAccountsPayable) setAccountsPayable(liveAccountsPayable);
      if (liveGoodsReceipts) setGoodsReceipts(liveGoodsReceipts);
      if (liveCreditNotes) setCreditNotes(liveCreditNotes);
      if (liveAdminBudgets) setAdministrativeBudgets(liveAdminBudgets);
      if (liveAdminExpenses) setAdministrativeExpenses(liveAdminExpenses);
      if (livePreOpRubros) setPreOpRubros(livePreOpRubros);
      if (livePreOpExpenses) setPreOpExpenses(livePreOpExpenses);
      if (liveRoles && liveRoles.length > 0) setRoles(liveRoles);
      if (liveCompanyInfo && liveCompanyInfo.name) setCompanyInfo(liveCompanyInfo);
    };

    fetchData();
  }, []);

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyInfo);


  const [currentUser, setCurrentUser] = useState<User>(() => {
    const generalManagerRole = roles.find(r => r.name === 'Gerente General');
    if (generalManagerRole) {
      const activeGM = users.find(u => u.roleIds.includes(generalManagerRole.id) && u.status === 'Active');
      if (activeGM) return activeGM;
    }
    return users.find(u => u.status === 'Active') || users[0];
  });

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(initialServiceRequests);
  const [quoteResponses, setQuoteResponses] = useState<QuoteResponse[]>(initialQuoteResponses);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>(initialAccountsPayable);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>(initialGoodsReceipts || []);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(initialCreditNotes || []);
  const [subcontracts, setSubcontracts] = useState<Subcontract[]>(initialSubcontracts);
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>(initialChangeOrders);
  const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>(initialAccountsReceivable);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>(initialServiceItems);
  const [laborItems, setLaborItems] = useState<LaborItem[]>(initialLaborItems);
  const [recurringOrderTemplates, setRecurringOrderTemplates] = useState<RecurringOrderTemplate[]>(initialRecurringOrderTemplates);
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [predeterminedActivities, setPredeterminedActivities] = useState<PredeterminedActivity[]>(initialPredeterminedActivities);
  const [inventoryAdjustmentLogs, setInventoryAdjustmentLogs] = useState<InventoryAdjustmentLog[]>(initialInventoryAdjustmentLogs || []);
  const [administrativeBudgets, setAdministrativeBudgets] = useState<AdministrativeBudget[]>(initialAdministrativeBudgets);
  const [administrativeExpenses, setAdministrativeExpenses] = useState<AdministrativeExpense[]>(initialAdministrativeExpenses);
  const [bonosItems, setBonosItems] = useState<BonoRequisito[]>(initialBonosItems);
  const [preOpRubros, setPreOpRubros] = useState<PreOpRubro[]>(initialPreOpRubros);
  const [preOpExpenses, setPreOpExpenses] = useState<PreOpExpense[]>(initialPreOpExpenses);


  useEffect(() => {
    // If the current user is deactivated, switch to the first available active user.
    const currentStillExistsAndIsActive = users.find(u => u.id === currentUser.id && u.status === 'Active');
    if (!currentStillExistsAndIsActive) {
      const generalManagerRole = roles.find(r => r.name === 'Gerente General');
      if (generalManagerRole) {
        const activeGM = users.find(u => u.roleIds.includes(generalManagerRole.id) && u.status === 'Active');
        if (activeGM) {
          setCurrentUser(activeGM);
          return;
        }
      }
      const firstActiveUser = users.find(u => u.status === 'Active');
      if (firstActiveUser) {
        setCurrentUser(firstActiveUser);
      } else if (users.length > 0) {
        // Fallback if no active users are left
        setCurrentUser(users[0]);
      }
    }
  }, [users, roles, currentUser.id]);

  useEffect(() => {
    const updatedProjects = projects.map(p => {
      let hasChanges = false;
      let nextExpenses = p.expenses;
      let nextUnforeseen = p.unforeseenExpenses;

      // --- 1. Recalculate Regular Expenses ---
      const projectPOs = purchaseOrders.filter(po => {
        if (po.isPreOp) return false;
        if (po.projectId !== p.id) return false;
        const validStatuses = [POStatus.Approved, POStatus.Issued, POStatus.PartiallyReceived, POStatus.FullyReceived];
        return validStatuses.includes(po.status);
      });

      const projectCNs = creditNotes.filter(cn => cn.projectId === p.id && cn.status === CreditNoteStatus.Approved);

      const totalPOAmount = projectPOs.reduce((sum, po) => sum + (Number(po.totalAmount) || 0), 0);
      const totalCNAmount = projectCNs.reduce((sum, cn) => sum + (Number(cn.totalAmount) || 0), 0);

      const offer = offers.find(o => o.id === p.offerId);
      const linkedPreOpExpenses = offer ? preOpExpenses.filter(e => e.prospectId === offer.prospectId) : [];
      const totalPreOpAmount = linkedPreOpExpenses.reduce((sum, e) => sum + (Number(e.totalGasto) || 0), 0);

      const computedExpenses = (totalPOAmount - totalCNAmount) + totalPreOpAmount;
      if (Math.abs((Number(p.expenses) || 0) - computedExpenses) > 0.01) {
        nextExpenses = computedExpenses;
        hasChanges = true;
      }

      // --- 2. Recalculate Unforeseen Expenses ---
      let totalUnforeseenForProject = 0;
      if (!offer) {
        const approvedRequests = serviceRequests.filter(sr => sr.projectId === p.id && ![ServiceRequestStatus.Rejected, ServiceRequestStatus.PendingApproval, ServiceRequestStatus.PendingGMApproval].includes(sr.status));
        totalUnforeseenForProject = approvedRequests
          .flatMap(sr => sr.items || [])
          .filter(item => item.isUnforeseen)
          .reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.estimatedUnitCost) || 0)), 0);
      } else {
        const materialsMap = new Map<string, { unit: string; quantity: number }>();
        if (offer.budgetId) {
          const initialBudget = budgets.find(b => b.id === offer.budgetId);
          initialBudget?.activities?.forEach(act => act.subActivities?.forEach(sub => {
            const desc = (sub.description || '').trim();
            const unit = (sub.unit || '').trim();
            if (!desc) return;
            const key = `${desc}|${unit}`;
            const existing = materialsMap.get(key) || { unit: unit, quantity: 0 };
            existing.quantity += Number(sub.quantity) || 0;
            materialsMap.set(key, existing);
          }));
        }
        changeOrders
          .filter(co => co.offerId === offer.id && co.status === ChangeOrderStatus.Approved && co.budgetId)
          .forEach(co => {
            const budget = budgets.find(b => b.id === co.budgetId);
            if (!budget) return;
            const multiplier = co.changeType === 'Crédito' ? -1 : 1;
            budget.activities?.forEach(act => act.subActivities?.forEach(sub => {
              const desc = (sub.description || '').trim();
              const unit = (sub.unit || '').trim();
              if (!desc) return;
              const key = `${desc}|${unit}`;
              const existing = materialsMap.get(key) || { unit: unit, quantity: 0 };
              existing.quantity += (Number(sub.quantity) || 0) * multiplier;
              materialsMap.set(key, existing);
            }));
          });

        const relevantRequests = serviceRequests
          .filter(sr => sr.projectId === p.id && ![ServiceRequestStatus.Rejected, ServiceRequestStatus.PendingApproval, ServiceRequestStatus.PendingGMApproval].includes(sr.status))
          .sort((a, b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime());

        const consumedBudgetQuantities = new Map<string, number>();

        relevantRequests.forEach(sr => {
          (sr.items || []).forEach(item => {
            let itemCostAsUnforeseen = 0;
            const itemName = (item.name || '').trim();
            const itemUnit = (item.unit || '').trim();

            if (item.isUnforeseen) {
              itemCostAsUnforeseen = (Number(item.quantity) || 0) * (Number(item.estimatedUnitCost) || 0);
            } else {
              const budgetItem = materialsMap.get(`${itemName}|${itemUnit}`);
              if (!budgetItem) {
                itemCostAsUnforeseen = (Number(item.quantity) || 0) * (Number(item.estimatedUnitCost) || 0);
              } else {
                const budgetedQty = budgetItem.quantity;
                const previouslyConsumed = consumedBudgetQuantities.get(itemName) || 0;
                const availableQty = budgetedQty - previouslyConsumed;
                const itemQty = Number(item.quantity) || 0;
                const overageQty = Math.max(0, itemQty - availableQty);

                if (overageQty > 0) {
                  itemCostAsUnforeseen = overageQty * (Number(item.estimatedUnitCost) || 0);
                }
              }
            }
            totalUnforeseenForProject += itemCostAsUnforeseen;

            if (!item.isUnforeseen) {
              consumedBudgetQuantities.set(itemName, (consumedBudgetQuantities.get(itemName) || 0) + (Number(item.quantity) || 0));
            }
          });
        });
      }

      if (Math.abs((Number(p.unforeseenExpenses) || 0) - totalUnforeseenForProject) > 0.01) {
        nextUnforeseen = totalUnforeseenForProject;
        hasChanges = true;
      }

      if (hasChanges) {
        return { ...p, expenses: nextExpenses, unforeseenExpenses: nextUnforeseen };
      }
      return p;
    });

    if (JSON.stringify(projects) !== JSON.stringify(updatedProjects)) {
      setProjects(updatedProjects);
    }
  }, [purchaseOrders, creditNotes, preOpExpenses, projects, offers, serviceRequests, budgets, changeOrders]);



  const appContextValue = useMemo<AppContextType>(() => ({
    user: currentUser,
    setUser: setCurrentUser,
    projects,
    setProjects,
    serviceRequests,
    setServiceRequests,
    quoteResponses,
    setQuoteResponses,
    purchaseOrders,
    setPurchaseOrders,
    accountsPayable,
    setAccountsPayable,
    goodsReceipts,
    setGoodsReceipts,
    creditNotes,
    setCreditNotes,
    subcontracts,
    setSubcontracts,
    prospects,
    setProspects,
    offers,
    setOffers,
    changeOrders,
    setChangeOrders,
    accountsReceivable,
    setAccountsReceivable,
    users,
    setUsers,
    roles,
    setRoles,
    suppliers,
    setSuppliers,
    materials,
    setMaterials,
    serviceItems,
    setServiceItems,
    laborItems,
    setLaborItems,
    recurringOrderTemplates,
    setRecurringOrderTemplates,
    companyInfo,
    setCompanyInfo,
    budgets,
    setBudgets,
    predeterminedActivities,
    setPredeterminedActivities,
    inventoryAdjustmentLogs,
    setInventoryAdjustmentLogs,
    administrativeBudgets,
    setAdministrativeBudgets,
    administrativeExpenses,
    setAdministrativeExpenses,
    bonosItems,
    setBonosItems,
    preOpRubros,
    setPreOpRubros,
    preOpExpenses,
    setPreOpExpenses,
  }), [currentUser, projects, serviceRequests, quoteResponses, purchaseOrders, accountsPayable, goodsReceipts, creditNotes, subcontracts, prospects, offers, changeOrders, accountsReceivable, users, roles, suppliers, materials, serviceItems, laborItems, recurringOrderTemplates, companyInfo, budgets, predeterminedActivities, inventoryAdjustmentLogs, administrativeBudgets, administrativeExpenses, bonosItems, preOpRubros, preOpExpenses]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'purchasing':
        return <PurchasingDashboard />;
      case 'sales':
        return <SalesDashboard />;
      case 'projects':
        return <ProjectsDashboard />;
      case 'income':
        return <IncomeDashboard />;
      case 'database':
        return <DatabaseDashboard />;
      case 'configuration':
        return <ConfigurationDashboard />;
      case 'admin_expenses':
        return <AdminExpensesDashboard />;
      case 'subcontracts':
        return <SubcontractsDashboard />;
      case 'bonos':
        return <BonosDashboard activeView={'bonos_requisitos'} />; // Default
      default:
        // Handle all bonos sub-views dynamically
        if (currentView.startsWith('bonos_')) {
          return <BonosDashboard activeView={currentView} />;
        }
        return <Dashboard />;
    }
  };

  return (
    <AppContext.Provider value={appContextValue}>
      <ToastProvider>
        <NotificationProvider>
          <div className="flex h-screen bg-light-gray font-sans">
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light-gray p-6">
                {renderView()}
              </main>
            </div>
          </div>
        </NotificationProvider>
      </ToastProvider>
    </AppContext.Provider>
  );

};

export default App;
