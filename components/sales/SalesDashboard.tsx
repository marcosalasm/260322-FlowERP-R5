
import React, { useState, useMemo, useContext } from 'react';
import { Card } from '../shared/Card';
import { AppContext } from '../../context/AppContext';
import { Prospect, Offer, OfferStatus, AccountReceivable, Project, ChangeOrder, ChangeOrderStatus, Budget, BudgetStatus, ProjectStatus, Material, ServiceItem, LaborItem, ProjectType } from '../../types';
import { ProspectsTable } from './ProspectsTable';
import { OffersTable } from './OffersTable';
import { NewProspectModal } from './NewProspectModal';
import { NewOfferModal } from './NewOfferModal';
import { ProspectDetailModal } from './ProspectDetailModal';
import { EditProspectModal } from './EditProspectModal';
import { EditOfferModal } from './EditOfferModal';
import { addDays, format } from 'date-fns';
import { ChangeOrdersTable } from './ChangeOrdersTable';
import { NewChangeOrderModal } from './NewChangeOrderModal';
import { EditChangeOrderModal } from './EditChangeOrderModal';
import { BudgetsTable } from './BudgetsTable';
import { NewBudgetModal } from './NewBudgetModal';
import { EditBudgetModal } from './EditBudgetModal';
import { OfferDetailModal } from './OfferDetailModal';
import { MaterialListModal } from './MaterialListModal';
import { ExportBudgetModal } from './ExportBudgetModal';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';
import { apiService } from '../../services/apiService';


type SalesView = 'prospects' | 'budgets' | 'offers' | 'changeOrders';

const SalesDashboard: React.FC = () => {
    const appContext = useContext(AppContext);
    if (!appContext) return null;

    const { addNotification } = useNotifications();
    const { showToast } = useToast();
    const { can } = usePermissions();

    const {
        user,
        prospects, setProspects,
        offers, setOffers,
        changeOrders, setChangeOrders,
        accountsReceivable, setAccountsReceivable,
        projects, setProjects,
        budgets, setBudgets,
        materials, setMaterials,
        serviceItems,
        laborItems,
        roles,
        companyInfo
    } = appContext;

    const [activeView, setActiveView] = useState<SalesView>('prospects');
    const [isProspectModalOpen, setIsProspectModalOpen] = useState(false);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [isChangeOrderModalOpen, setIsChangeOrderModalOpen] = useState(false);

    const [isEditProspectModalOpen, setIsEditProspectModalOpen] = useState(false);
    const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

    const [isEditBudgetModalOpen, setIsEditBudgetModalOpen] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

    const [isEditOfferModalOpen, setIsEditOfferModalOpen] = useState(false);
    const [isOfferDetailModalOpen, setIsOfferDetailModalOpen] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

    const [isEditChangeOrderModalOpen, setIsEditChangeOrderModalOpen] = useState(false);
    const [selectedChangeOrder, setSelectedChangeOrder] = useState<ChangeOrder | null>(null);

    const [isMaterialListModalOpen, setIsMaterialListModalOpen] = useState(false);
    const [selectedBudgetForMaterials, setSelectedBudgetForMaterials] = useState<Budget | null>(null);

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [budgetToExport, setBudgetToExport] = useState<Budget | null>(null);

    const [searchTerm, setSearchTerm] = useState('');

    const executableProjects = useMemo(() =>
        projects.filter(p => p.status === ProjectStatus.InProgress),
        [projects]);

    const filteredProspects = useMemo(() => {
        const trimmedSearch = searchTerm.trim().toLowerCase();
        if (!trimmedSearch) {
            return prospects;
        }
        return prospects.filter(prospect =>
            prospect.name.toLowerCase().includes(trimmedSearch) ||
            (prospect.company && prospect.company.toLowerCase().includes(trimmedSearch))
        );
    }, [prospects, searchTerm]);

    const filteredBudgets = useMemo(() => {
        const trimmedSearch = searchTerm.trim().toLowerCase();
        if (!trimmedSearch) {
            return budgets;
        }
        return budgets.filter(budget =>
            budget.prospectName.toLowerCase().includes(trimmedSearch) ||
            budget.consecutiveNumber.toLowerCase().includes(trimmedSearch)
        );
    }, [budgets, searchTerm]);

    const filteredOffers = useMemo(() => {
        const trimmedSearch = searchTerm.trim().toLowerCase();
        if (!trimmedSearch) {
            return offers;
        }
        return offers.filter(offer =>
            offer.prospectName.toLowerCase().includes(trimmedSearch) ||
            offer.consecutiveNumber.toLowerCase().includes(trimmedSearch) ||
            offer.projectType.toLowerCase().includes(trimmedSearch)
        );
    }, [offers, searchTerm]);

    const filteredChangeOrders = useMemo(() => {
        const trimmedSearch = searchTerm.trim().toLowerCase();
        if (!trimmedSearch) {
            return changeOrders;
        }
        return changeOrders.filter(co =>
            co.projectName.toLowerCase().includes(trimmedSearch) ||
            co.consecutive.toLowerCase().includes(trimmedSearch) ||
            co.description.toLowerCase().includes(trimmedSearch)
        );
    }, [changeOrders, searchTerm]);

    const handleAddProspect = async (newProspectData: Omit<Prospect, 'id' | 'followUps'>) => {
        try {
            const newProspect = await apiService.createProspect({
                ...newProspectData,
                followUps: []
            });
            setProspects(prev => [newProspect, ...prev]);
            addNotification(`Recuerda dar seguimiento al nuevo prospecto: ${newProspect.name}`);
            showToast('Prospecto creado con éxito.', 'success');
        } catch (error: any) {
            console.error('Error creating prospect:', error);
            showToast(`Error al crear prospecto: ${error.message || error}`, 'error');
        }
    };

    const handleAddBudget = async (newBudgetData: Omit<Budget, 'id' | 'consecutiveNumber' | 'status'>) => {
        const currentYear = new Date().getFullYear();
        const budgetsThisYear = budgets.filter(b => b.consecutiveNumber.startsWith(`PRE-${currentYear}`));
        const lastNumber = budgetsThisYear.length > 0
            ? Math.max(...budgetsThisYear.map(b => parseInt(b.consecutiveNumber.split('-')[2])))
            : 0;
        const newConsecutiveNumber = `PRE-${currentYear}-${(lastNumber + 1).toString().padStart(3, '0')}`;

        const newBudgetDataFull = {
            consecutiveNumber: newConsecutiveNumber,
            status: BudgetStatus.Finalized,
            ...newBudgetData
        };

        try {
            const newBudget = await apiService.createBudget(newBudgetDataFull);
            setBudgets(prev => [newBudget, ...prev]);
            showToast('Presupuesto creado con éxito.', 'success');
        } catch (error: any) {
            console.error('Error creating budget:', error);
            showToast(`Error al crear presupuesto: ${error.message || error}`, 'error');
        }
    };

    const handleUpdateBudget = async (updatedBudget: Budget) => {
        try {
            const { id, ...data } = updatedBudget;
            const updated = await apiService.updateBudget(id, data);
            setBudgets(prev => prev.map(b => b.id === id ? updated : b));
            setIsEditBudgetModalOpen(false);
            setSelectedBudget(null);
            showToast('Presupuesto actualizado.', 'success');
        } catch (error) {
            showToast('Error al actualizar presupuesto.', 'error');
        }
    };

    const handleDeleteBudget = async (budgetId: number) => {
        if (!can('sales', 'budgets', 'delete')) {
            showToast('No tiene permiso para eliminar presupuestos.', 'error');
            return;
        }

        const isLinked = offers.some(offer => offer.budgetId === budgetId && offer.status !== OfferStatus.Rechazada);

        if (isLinked) {
            alert(
                'No se puede eliminar este presupuesto porque está vinculado a una oferta activa o aprobada. Para eliminarlo, la oferta asociada debe ser rechazada o el presupuesto debe ser desvinculado de la oferta.'
            );
            return;
        }

        if (window.confirm('¿Está seguro de que desea eliminar este presupuesto? Esta acción es irreversible.')) {
            try {
                await apiService.deleteBudget(budgetId);
                setBudgets(prevBudgets => prevBudgets.filter(b => b.id !== budgetId));
                showToast('Presupuesto eliminado con éxito.', 'success');
            } catch (error) {
                showToast('Error al eliminar presupuesto.', 'error');
            }
        }
    };

    const handleUpdateMasterMaterials = (updates: { materialId: number; newCost: number }[]) => {
        setMaterials(prevMaterials => {
            const newMaterials = [...prevMaterials];
            updates.forEach(update => {
                const materialIndex = newMaterials.findIndex(m => m.id === update.materialId);
                if (materialIndex !== -1) {
                    newMaterials[materialIndex] = {
                        ...newMaterials[materialIndex],
                        unitCost: update.newCost,
                        lastUpdated: new Date().toISOString(),
                    };
                }
            });
            return newMaterials;
        });
    };

    const handleEditBudget = (budget: Budget) => {
        setSelectedBudget(budget);
        setIsEditBudgetModalOpen(true);
    };

    const handleOpenMaterialListModal = (budget: Budget) => {
        setSelectedBudgetForMaterials(budget);
        setIsMaterialListModalOpen(true);
    };

    const handleOpenExportModal = (budget: Budget) => {
        setBudgetToExport(budget);
        setIsExportModalOpen(true);
    };

    const handleAddOffer = async (newOfferData: Omit<Offer, 'id' | 'consecutiveNumber'>) => {
        const currentYear = new Date().getFullYear();
        const offersThisYear = offers.filter(o => {
            const parts = o.consecutiveNumber.split('-');
            return parts[0] === 'OF' && parts.length === 3 && parseInt(parts[1]) === currentYear;
        });

        const lastOfferNumber = offersThisYear.length > 0
            ? Math.max(...offersThisYear.map(o => parseInt(o.consecutiveNumber.split('-')[2])))
            : 0;

        const newConsecutiveNumber = `OF-${currentYear}-${(lastOfferNumber + 1).toString().padStart(3, '0')}`;

        const newOfferDataFull = {
            consecutiveNumber: newConsecutiveNumber,
            ...newOfferData
        };

        try {
            const newOffer = await apiService.createOffer(newOfferDataFull);
            setOffers(prev => [newOffer, ...prev]);

            // Update the linked budget's status, but only if it's NOT recurring
            if (newOffer.budgetId) {
                const linkedBudget = budgets.find(b => b.id === newOffer.budgetId);
                if (linkedBudget && !linkedBudget.isRecurring) {
                    const updatedBudget = await apiService.updateBudget(linkedBudget.id, { ...linkedBudget, status: BudgetStatus.Linked });
                    setBudgets(prevBudgets => prevBudgets.map(b =>
                        b.id === newOffer.budgetId ? updatedBudget : b
                    ));
                }
            }
            if (newOffer.status === OfferStatus.Aprobacion) {
                await createEntitiesForApprovedOffer(newOffer);
            }
            showToast('Oferta creada con éxito.', 'success');
        } catch (error) {
            showToast('Error al crear oferta.', 'error');
        }
    };

    const createEntitiesForApprovedOffer = async (offer: Offer) => {
        const arExists = (accountsReceivable || []).some(ar => ar.offerId === offer.id);
        const projectExists = (projects || []).some(p => p.offerId === offer.id);

        if (arExists && projectExists) {
            console.log(`[SalesDashboard] Entities already exist for Offer ID ${offer.id}. Skipping creation.`);
            return;
        }

        const prospect = (prospects || []).find(p => p.id === offer.prospectId);
        if (!prospect) {
            console.error(`[SalesDashboard] Could not create entities: Prospect with ID ${offer.prospectId} not found for Offer ID ${offer.id}.`);
            showToast('Error: Prospecto no encontrado.', 'error');
            return;
        }

        // Create Account Receivable if it doesn't exist
        if (!arExists) {
            try {
                const newAccountReceivableData = {
                    offerId: offer.id,
                    clientName: prospect.name || 'N/A',
                    companyName: prospect.company || 'N/A',
                    paymentDate: addDays(new Date(), 30).toISOString().split('T')[0],
                    contractAmount: Number(offer.amount) || 0,
                    payments: [],
                    phone: prospect.phone || 'N/A',
                };
                const createdAR = await apiService.createAccountReceivable(newAccountReceivableData);
                setAccountsReceivable(prevAR => [...(prevAR || []), createdAR]);
                console.log(`[SalesDashboard] Account Receivable created successfully for Offer ID ${offer.id}.`);
            } catch (error) {
                console.error("[SalesDashboard] Error creating Account Receivable:", error);
            }
        }

        // Create Project if it doesn't exist
        if (!projectExists) {
            try {
                const newProjectData = {
                    offerId: offer.id,
                    name: `Proyecto ${offer.projectType || 'Varios'} - ${prospect.company || 'N/A'}`,
                    creationDate: new Date().toISOString().split('T')[0],
                    initialContractAmount: Number(offer.amount) || 0,
                    initialBudget: Number(offer.budget) || 0,
                    contractAmount: Number(offer.amount) || 0,
                    budget: Number(offer.budget) || 0,
                    location: 'Por definir',
                    owner: prospect.company || 'N/A',
                    type: offer.projectType || ProjectType.Consultoria,
                    status: ProjectStatus.InProgress,
                    expenses: 0,
                    unforeseenExpenses: 0,
                };
                const createdProject = await apiService.createProject(newProjectData);
                setProjects(prevProjects => [...(prevProjects || []), createdProject]);
                console.log(`[SalesDashboard] Project created successfully for Offer ID ${offer.id}.`);
                showToast('Proyecto creado con éxito.', 'success');
            } catch (error) {
                console.error("[SalesDashboard] Error creating Project:", error);
                showToast('Error al crear el proyecto.', 'error');
            }
        }
    };

    const updateOfferStatus = async (id: number, status: OfferStatus) => {
        try {
            const offer = offers.find(o => o.id === id);
            if (!offer) return;
            const updated = await apiService.updateOffer(id, { ...offer, status });

            setOffers(prevOffers => prevOffers.map(o => o.id === id ? updated : o));

            if (status === OfferStatus.Aprobacion) {
                await createEntitiesForApprovedOffer(updated);
            }
            showToast(`Estado de oferta actualizado a ${status}`, 'success');
        } catch (error) {
            showToast('Error al actualizar estado de oferta.', 'error');
        }
    };

    const handleAddChangeOrder = async (newCOData: Omit<ChangeOrder, 'id' | 'consecutive'>) => {
        const projectChangeOrders = changeOrders.filter(co => co.offerId === newCOData.offerId);
        const newConsecutive = `OCG-${newCOData.offerId}-${(projectChangeOrders.length + 1).toString().padStart(3, '0')}`;

        try {
            const newCO = await apiService.createChangeOrder({
                ...newCOData,
                consecutive: newConsecutive,
            });
            setChangeOrders(prev => [newCO, ...prev]);
            showToast('Orden de cambio creada con éxito.', 'success');
        } catch (error) {
            showToast('Error al crear orden de cambio.', 'error');
        }
    };

    const handleUpdateChangeOrder = async (updatedCO: ChangeOrder) => {
        const originalCO = changeOrders.find(co => co.id === updatedCO.id);
        if (!originalCO) return;

        const wasApproved = originalCO.status === ChangeOrderStatus.Approved;
        const isApproved = updatedCO.status === ChangeOrderStatus.Approved;

        // --- START: Material Deficit Validation for Credit COs ---
        if (isApproved && !wasApproved && updatedCO.changeType === 'Crédito' && updatedCO.budgetId) {
            const offer = offers.find(o => o.id === updatedCO.offerId);
            if (!offer) {
                console.error("Offer not found for material validation.");
                return; // Stop if crucial data is missing
            }

            // 1. Calculate the project's current consolidated material quantities
            const materialsMap = new Map<string, { unit: string; quantity: number }>();

            // Add initial budget materials
            if (offer.budgetId) {
                const initialBudget = budgets.find(b => b.id === offer.budgetId);
                initialBudget?.activities.forEach(act => act.subActivities.forEach(sub => {
                    const key = `${sub.description.trim()}|${sub.unit.trim()}`;
                    const existing = materialsMap.get(key) || { unit: sub.unit, quantity: 0 };
                    existing.quantity += Number(sub.quantity) || 0;
                    materialsMap.set(key, existing);
                }));
            }

            // Add/Subtract from OTHER approved change orders
            changeOrders
                .filter(co => co.offerId === updatedCO.offerId && co.status === ChangeOrderStatus.Approved)
                .forEach(co => {
                    const budget = budgets.find(b => b.id === co.budgetId);
                    if (!budget) return;
                    const multiplier = co.changeType === 'Crédito' ? -1 : 1;
                    budget.activities.forEach(act => act.subActivities.forEach(sub => {
                        const key = `${sub.description.trim()}|${sub.unit.trim()}`;
                        const existing = materialsMap.get(key) || { unit: sub.unit, quantity: 0 };
                        existing.quantity += (Number(sub.quantity) || 0) * multiplier;
                        materialsMap.set(key, existing);
                    }));
                });

            // 2. Check for deficits against the credit CO being approved
            const creditBudget = budgets.find(b => b.id === updatedCO.budgetId);
            if (creditBudget) {
                const potentialDeficits: string[] = [];
                creditBudget.activities.forEach(act => act.subActivities.forEach(sub => {
                    const key = `${sub.description.trim()}|${sub.unit.trim()}`;
                    const currentAvailable = materialsMap.get(key)?.quantity || 0;
                    const quantityToCredit = Number(sub.quantity) || 0;

                    if (currentAvailable - quantityToCredit < 0) {
                        potentialDeficits.push(
                            ` - ${sub.description}: disponible ${currentAvailable.toLocaleString()}, se acreditarán ${quantityToCredit.toLocaleString()}. Saldo final: ${(currentAvailable - quantityToCredit).toLocaleString()}.`
                        );
                    }
                }));

                if (potentialDeficits.length > 0) {
                    const warningMessage = `¡Advertencia! La aprobación de esta Orden de Cambio de Crédito resultará en un saldo negativo para los siguientes materiales:\n\n${potentialDeficits.join('\n')}\n\nEsto puede indicar un error o requerirá un ajuste futuro. ¿Desea continuar con la aprobación?`;
                    if (!window.confirm(warningMessage)) {
                        return; // Stop the approval process if user cancels
                    }
                }
            }
        }
        // --- END: Material Deficit Validation ---

        // Automatically set approval date on first approval
        if (!wasApproved && isApproved) {
            updatedCO.approvalDate = new Date().toISOString();
        }

        try {
            const { id, ...data } = updatedCO;
            const updated = await apiService.updateChangeOrder(id, data);

            let amountDelta = 0;
            let budgetDelta = 0;

            // Get original impact, will be 0 if it wasn't approved
            const originalAmountImpact = wasApproved ? originalCO.amountImpact * (originalCO.changeType === 'Crédito' ? -1 : 1) : 0;
            const originalBudgetImpact = wasApproved ? originalCO.budgetImpact * (originalCO.changeType === 'Crédito' ? -1 : 1) : 0;

            // Get new impact, will be 0 if it's not approved now
            const newAmountImpact = isApproved ? updated.amountImpact * (updated.changeType === 'Crédito' ? -1 : 1) : 0;
            const newBudgetImpact = isApproved ? updated.budgetImpact * (updated.changeType === 'Crédito' ? -1 : 1) : 0;

            // The total change is the new impact minus the old impact
            amountDelta = newAmountImpact - originalAmountImpact;
            budgetDelta = newBudgetImpact - originalBudgetImpact;

            if (amountDelta !== 0 || budgetDelta !== 0) {
                const offerId = updated.offerId;
                setProjects(prev => prev.map(p => p.offerId === offerId ? { ...p, contractAmount: p.contractAmount + amountDelta, budget: p.budget + budgetDelta } : p));
                setAccountsReceivable(prev => prev.map(ar => ar.offerId === offerId ? { ...ar, contractAmount: ar.contractAmount + amountDelta } : ar));
                setOffers(prev => prev.map(o => o.id === offerId ? { ...o, amount: o.amount + amountDelta, budget: o.budget + budgetDelta } : o));
            }

            setChangeOrders(prev => prev.map(co => co.id === updated.id ? updated : co));
            setIsEditChangeOrderModalOpen(false);
            setSelectedChangeOrder(null);
            showToast('Orden de cambio actualizada.', 'success');
        } catch (error) {
            showToast('Error al actualizar orden de cambio.', 'error');
        }
    };

    const handleUpdateChangeOrderStatus = (id: number, status: ChangeOrderStatus) => {
        const originalCO = changeOrders.find(co => co.id === id);
        if (originalCO) {
            handleUpdateChangeOrder({ ...originalCO, status });
        }
    };

    const handleEditChangeOrder = (changeOrder: ChangeOrder) => {
        setSelectedChangeOrder(changeOrder);
        setIsEditChangeOrderModalOpen(true);
    };

    const handleEditOffer = (offer: Offer) => {
        setSelectedOffer(offer);
        setIsEditOfferModalOpen(true);
    };

    const handleViewOfferDetails = (offer: Offer) => {
        setSelectedOffer(offer);
        setIsOfferDetailModalOpen(true);
    };

    const projectForSelectedOffer = useMemo(() => {
        if (!selectedOffer) return undefined;
        return projects.find(p => p.offerId === selectedOffer.id);
    }, [selectedOffer, projects]);

    const changeOrdersForSelectedOffer = useMemo(() => {
        if (!selectedOffer) return [];
        return changeOrders.filter(co => co.offerId === selectedOffer.id);
    }, [selectedOffer, changeOrders]);

    const handleUpdateOffer = async (updatedOffer: Offer) => {
        try {
            const { id, ...data } = updatedOffer;
            const originalOffer = offers.find(o => o.id === id);

            const updated = await apiService.updateOffer(id, data);
            setOffers(prev => prev.map(o => o.id === id ? updated : o));

            if (originalOffer) {
                const oldBudgetId = originalOffer.budgetId;
                const newBudgetId = updated.budgetId;

                // If the linked budget has changed, update statuses accordingly
                if (oldBudgetId !== newBudgetId) {
                    if (oldBudgetId) {
                        const oldBudget = budgets.find(b => b.id === oldBudgetId);
                        if (oldBudget && !oldBudget.isRecurring) {
                            const unlinked = await apiService.updateBudget(oldBudget.id, { ...oldBudget, status: BudgetStatus.Finalized });
                            setBudgets(prev => prev.map(b => b.id === oldBudgetId ? unlinked : b));
                        }
                    }
                    if (newBudgetId) {
                        const newBudget = budgets.find(b => b.id === newBudgetId);
                        if (newBudget && !newBudget.isRecurring) {
                            const linked = await apiService.updateBudget(newBudget.id, { ...newBudget, status: BudgetStatus.Linked });
                            setBudgets(prev => prev.map(b => b.id === newBudgetId ? linked : b));
                        }
                    }
                }
            }

            // Handle logic for newly approved offers (this is separate from budget linking)
            if (originalOffer && originalOffer.status !== OfferStatus.Aprobacion && updated.status === OfferStatus.Aprobacion) {
                await createEntitiesForApprovedOffer(updated);
            }

            setIsEditOfferModalOpen(false);
            setSelectedOffer(null);
            showToast('Oferta actualizada.', 'success');
        } catch (error) {
            showToast('Error al actualizar oferta.', 'error');
        }
    };


    const handleSelectProspect = (prospect: Prospect) => {
        setSelectedProspect(prospect);
    };

    const handleCloseDetailModal = () => {
        setSelectedProspect(null);
    };

    const handleAddFollowUp = (prospectId: number, comment: string) => {
        setProspects(prev => prev.map(p => {
            if (p.id === prospectId) {
                const newFollowUp = {
                    date: new Date().toISOString(),
                    comments: comment
                };
                const currentFollowUps = Array.isArray(p.followUps) ? p.followUps : [];
                const updatedProspect = { ...p, followUps: [newFollowUp, ...currentFollowUps] };
                if (selectedProspect && selectedProspect.id === prospectId) {
                    setSelectedProspect(updatedProspect);
                }
                return updatedProspect;
            }
            return p;
        }));
    };

    const handleUpdateProspect = async (updatedProspect: Prospect) => {
        try {
            const { id, ...data } = updatedProspect;
            const updated = await apiService.updateProspect(id, data);
            setProspects(prev => prev.map(p => p.id === id ? updated : p));
            setSelectedProspect(updated);
            setIsEditProspectModalOpen(false);
            showToast('Prospecto actualizado.', 'success');
        } catch (error) {
            showToast('Error al actualizar prospecto.', 'error');
        }
    };

    const activeViewContent = useMemo(() => {
        switch (activeView) {
            case 'prospects':
                return <ProspectsTable prospects={filteredProspects} onSelectProspect={handleSelectProspect} />;
            case 'budgets':
                return <BudgetsTable budgets={filteredBudgets} onEdit={handleEditBudget} onViewMaterials={handleOpenMaterialListModal} onExport={handleOpenExportModal} onDelete={handleDeleteBudget} />;
            case 'offers':
                return <OffersTable offers={filteredOffers} updateOfferStatus={updateOfferStatus} onEdit={handleEditOffer} onViewDetails={handleViewOfferDetails} />;
            case 'changeOrders':
                return <ChangeOrdersTable changeOrders={filteredChangeOrders} updateChangeOrderStatus={handleUpdateChangeOrderStatus} onEdit={handleEditChangeOrder} />;
            default:
                return null;
        }
    }, [activeView, filteredProspects, filteredBudgets, filteredOffers, filteredChangeOrders, handleUpdateChangeOrderStatus]);

    const headerButton = useMemo(() => {
        const baseButtonClasses = "bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2";
        switch (activeView) {
            case 'prospects':
                return can('sales', 'prospects', 'create') ? <button onClick={() => setIsProspectModalOpen(true)} className={baseButtonClasses}> + Nuevo Prospecto </button> : null;
            case 'budgets':
                return can('sales', 'budgets', 'create') ? <button onClick={() => setIsBudgetModalOpen(true)} className={baseButtonClasses}> + Nuevo Presupuesto </button> : null;
            case 'offers':
                return can('sales', 'offers', 'create') ? <button onClick={() => setIsOfferModalOpen(true)} className={baseButtonClasses}> + Nueva Oferta </button> : null;
            case 'changeOrders':
                return can('sales', 'changeOrders', 'create') ? <button onClick={() => setIsChangeOrderModalOpen(true)} className={baseButtonClasses}> + Nueva Orden de Cambio </button> : null;
            default:
                return null;
        }
    }, [activeView, can]);

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-dark-gray">Módulo de Ventas</h2>
                    {headerButton}
                </div>

                {/* Tabs and Search */}
                <div className="flex justify-between items-center border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        <button onClick={() => setActiveView('prospects')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeView === 'prospects' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                            Prospectos (CRM)
                        </button>
                        <button onClick={() => setActiveView('budgets')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeView === 'budgets' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                            Presupuestos
                        </button>
                        <button onClick={() => setActiveView('offers')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeView === 'offers' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                            Control de Ofertas
                        </button>
                        <button onClick={() => setActiveView('changeOrders')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeView === 'changeOrders' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                            Órdenes de Cambio
                        </button>
                    </nav>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full max-w-xs p-2 pl-10 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            aria-label="Buscar en módulo de ventas"
                        />
                    </div>
                </div>

                <Card>
                    {activeViewContent}
                </Card>
            </div>

            {selectedProspect && (
                <ProspectDetailModal
                    prospect={selectedProspect}
                    onClose={handleCloseDetailModal}
                    onAddFollowUp={handleAddFollowUp}
                    onEdit={() => setIsEditProspectModalOpen(true)}
                />
            )}

            <NewProspectModal
                isOpen={isProspectModalOpen}
                onClose={() => setIsProspectModalOpen(false)}
                onSubmit={handleAddProspect}
            />

            <NewBudgetModal
                isOpen={isBudgetModalOpen}
                onClose={() => setIsBudgetModalOpen(false)}
                onSubmit={handleAddBudget}
                prospects={prospects}
                materials={materials}
                serviceItems={serviceItems}
                laborItems={laborItems}
            />

            <EditBudgetModal
                isOpen={isEditBudgetModalOpen}
                onClose={() => {
                    setIsEditBudgetModalOpen(false);
                    setSelectedBudget(null);
                }}
                onSubmit={handleUpdateBudget}
                onUpdateMasterMaterials={handleUpdateMasterMaterials}
                budget={selectedBudget}
                prospects={prospects}
                materials={materials}
                serviceItems={serviceItems}
                laborItems={laborItems}
                offers={offers}
            />

            <NewOfferModal
                isOpen={isOfferModalOpen}
                onClose={() => setIsOfferModalOpen(false)}
                onSubmit={handleAddOffer}
                prospects={prospects}
                budgets={budgets}
            />

            <OfferDetailModal
                isOpen={isOfferDetailModalOpen}
                onClose={() => setIsOfferDetailModalOpen(false)}
                offer={selectedOffer}
                project={projectForSelectedOffer}
                changeOrders={changeOrdersForSelectedOffer}
            />

            <NewChangeOrderModal
                isOpen={isChangeOrderModalOpen}
                onClose={() => setIsChangeOrderModalOpen(false)}
                onSubmit={handleAddChangeOrder}
                executableProjects={executableProjects}
                budgets={budgets}
            />

            <EditProspectModal
                isOpen={isEditProspectModalOpen}
                onClose={() => setIsEditProspectModalOpen(false)}
                onSubmit={handleUpdateProspect}
                prospect={selectedProspect}
            />

            <EditOfferModal
                isOpen={isEditOfferModalOpen}
                onClose={() => {
                    setIsEditOfferModalOpen(false);
                    setSelectedOffer(null);
                }}
                onSubmit={handleUpdateOffer}
                offer={selectedOffer}
                prospects={prospects}
                budgets={budgets}
            />

            <EditChangeOrderModal
                isOpen={isEditChangeOrderModalOpen}
                onClose={() => {
                    setIsEditChangeOrderModalOpen(false);
                    setSelectedChangeOrder(null);
                }}
                onSubmit={handleUpdateChangeOrder}
                changeOrder={selectedChangeOrder}
                budgets={budgets}
            />
            <MaterialListModal
                isOpen={isMaterialListModalOpen}
                onClose={() => {
                    setIsMaterialListModalOpen(false);
                    setSelectedBudgetForMaterials(null);
                }}
                budget={selectedBudgetForMaterials}
            />

            {budgetToExport && (
                <ExportBudgetModal
                    isOpen={isExportModalOpen}
                    onClose={() => {
                        setIsExportModalOpen(false);
                        setBudgetToExport(null);
                    }}
                    budget={budgetToExport}
                    companyInfo={companyInfo}
                />
            )}
        </>
    );
};

export default SalesDashboard;
