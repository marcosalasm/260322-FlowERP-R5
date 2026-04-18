
import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import { Project, ServiceRequestStatus, User, Material, ServiceItem, RecurringOrderTemplate, Budget, Offer, ServiceRequest, OfferStatus, ChangeOrderStatus, ChangeOrder, ProjectStatus, ServiceRequestItem, Prospect, PurchaseOrder, POStatus } from '../../types';
import { AppContext } from '../../context/AppContext';
import { formatNumber } from '../../utils/format';

type EditableItem = Omit<ServiceRequestItem, 'quantity'> & {
    quantity: number | string;
};

const getNextId = (items: any[]) => ((items?.length || 0) > 0 ? Math.max(...items.map(i => i.id)) : 0) + 1;

interface NewServiceRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newRequestData: any) => void | Promise<void>;
    projects: Project[];
    currentUser: User;
    materials: Material[];
    serviceItems: ServiceItem[];
    recurringOrderTemplates: RecurringOrderTemplate[];
    budgets: Budget[];
    offers: Offer[];
    changeOrders: ChangeOrder[];
    allServiceRequests: ServiceRequest[];
    purchaseOrders: PurchaseOrder[];
}

export const NewServiceRequestModal: React.FC<NewServiceRequestModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    projects = [],
    currentUser,
    materials = [],
    serviceItems = [],
    recurringOrderTemplates = [],
    budgets = [],
    offers = [],
    changeOrders = [],
    allServiceRequests = [],
    purchaseOrders = []
}) => {
    const appContext = useContext(AppContext);
    const roles = appContext?.roles || [];
    const prospects = appContext?.prospects || [];

    const [isPreOp, setIsPreOp] = useState(false);
    const [selectedOfferId, setSelectedOfferId] = useState<string>('');
    const [selectedProspectId, setSelectedProspectId] = useState<string>('');
    const [requiredDate, setRequiredDate] = useState('');
    const [items, setItems] = useState<EditableItem[]>([{ id: 1, name: '', quantity: 1, unit: '' }]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isWarranty, setIsWarranty] = useState(false);
    const [showRecurringModal, setShowRecurringModal] = useState(false);

    const combinedItemCatalog = useMemo(() => [...(materials || []), ...(serviceItems || [])], [materials, serviceItems]);

    // PROTECT DATA RENDER - Early return spinner if modal is open but context data is not loaded
    if (isOpen && (!offers || !projects || !prospects || !materials || !budgets || !serviceItems)) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full mx-4">
                    <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Cargando Datos Requeridos</h3>
                    <p className="text-sm text-slate-500 text-center">Sincronizando información para nueva solicitud...</p>
                </div>
            </div>
        );
    }

    const approvedOffers = useMemo(() => {
        const allApproved = (offers || []).filter(o => o.status === OfferStatus.Aprobacion);
        if (isWarranty) {
            return allApproved;
        }
        const completedProjectIds = new Set((projects || []).filter(p => p.status === ProjectStatus.Completed).map(p => p.id));
        return allApproved.filter(o => {
            const projectForOffer = (projects || []).find(p => p.offerId === o.id);
            return !projectForOffer || !completedProjectIds.has(projectForOffer.id);
        });
    }, [offers, projects, isWarranty]);

    // --- Derived State from Selected Offer ---
    const selectedOffer = useMemo(() => (approvedOffers || []).find(o => o.id === Number(selectedOfferId)), [selectedOfferId, approvedOffers]);
    const associatedProject = useMemo(() => (projects || []).find(p => p.offerId === selectedOffer?.id), [selectedOffer, projects]);

    const isBudgetControlled = useMemo(() => {
        if (isPreOp) return false;
        if (!selectedOffer) return false;
        if (selectedOffer.budgetId) return true;
        return (changeOrders || []).some(co => co.offerId === selectedOffer.id && co.status === ChangeOrderStatus.Approved && co.budgetId);
    }, [selectedOffer, changeOrders, isPreOp]);

    const consolidatedMaterials = useMemo(() => {
        if (isPreOp || !selectedOffer) return [];
        const materialsMap = new Map<string, { unit: string; quantity: number }>();

        if (selectedOffer.budgetId) {
            const initialBudget = (budgets || []).find(b => b.id === selectedOffer.budgetId);
            if (initialBudget && initialBudget.activities) {
                initialBudget.activities.forEach(activity => {
                    activity.subActivities?.forEach(sub => {
                        if (!sub.description) return;
                        const key = `${sub.description.trim().toLowerCase()}|${sub.unit.trim().toLowerCase()}`;
                        const existing = materialsMap.get(key) || { unit: sub.unit, quantity: 0 };
                        existing.quantity += Number(sub.quantity) || 0;
                        materialsMap.set(key, existing);
                    });
                });
            }
        }

        const approvedChangeOrders = (changeOrders || []).filter(
            co => co.offerId === selectedOffer.id && co.status === ChangeOrderStatus.Approved
        );

        approvedChangeOrders.forEach(co => {
            if (!co.budgetId) return;
            const budget = (budgets || []).find(b => b.id === co.budgetId);
            if (!budget || !budget.activities) return;

            const multiplier = co.changeType === 'Crédito' ? -1 : 1;

            budget.activities.forEach(activity => {
                activity.subActivities?.forEach(sub => {
                    if (!sub.description) return;
                    const key = `${sub.description.trim().toLowerCase()}|${sub.unit.trim().toLowerCase()}`;
                    const existing = materialsMap.get(key) || { unit: sub.unit, quantity: 0 };
                    existing.quantity += (Number(sub.quantity) || 0) * multiplier;
                    materialsMap.set(key, existing);
                });
            });
        });

        return Array.from(materialsMap.entries()).map(([key, value]) => ({
            name: key.split('|')[0],
            unit: value.unit,
            quantity: value.quantity
        }));
    }, [selectedOffer, changeOrders, budgets, isPreOp]);

    const previouslyRequestedQuantities = useMemo(() => {
        if (isPreOp || !associatedProject) return new Map<string, number>();
        const quantityMap = new Map<string, number>();

        // 1. Pending Service Requests
        (allServiceRequests || [])
            .filter(req => req.projectId === associatedProject.id &&
                [ServiceRequestStatus.PendingApproval, ServiceRequestStatus.PendingGMApproval, ServiceRequestStatus.InQuotation, ServiceRequestStatus.QuotationReady].includes(req.status))
            .forEach(req => {
                req.items?.forEach(item => {
                    const key = item.name.trim().toLowerCase();
                    quantityMap.set(key, (quantityMap.get(key) || 0) + Number(item.quantity || 0));
                });
            });

        // 2. Existing Purchase Orders (approved, issued, received, etc.)
        (purchaseOrders || [])
            .filter(po => po.projectId === associatedProject.id &&
                po.status !== POStatus.Rejected && po.status !== POStatus.Cancelled)
            .forEach(po => {
                po.items?.forEach(item => {
                    const key = item.name.trim().toLowerCase();
                    quantityMap.set(key, (quantityMap.get(key) || 0) + Number(item.quantity || 0));
                });
            });

        return quantityMap;
    }, [associatedProject, allServiceRequests, purchaseOrders, isPreOp]);

    const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);

    const materialesPresupuestados = useMemo(() => {
        if (!isBudgetControlled || isPreOp) return [];
        return consolidatedMaterials.map(cm => {
            const mat = (combinedItemCatalog || []).find(m => m.name.toLowerCase() === cm.name.toLowerCase());
            const previouslyRequested = previouslyRequestedQuantities.get(cm.name.toLowerCase()) || 0;
            const availableQty = cm.quantity - previouslyRequested;
            return {
                material_id: mat?.id,
                name: mat ? mat.name : cm.name,
                unit: mat ? mat.unit : cm.unit,
                cantidad_disponible: availableQty,
                is_cataloged: !!mat
            };
        }).filter(m => m.is_cataloged);
    }, [consolidatedMaterials, combinedItemCatalog, previouslyRequestedQuantities, isBudgetControlled, isPreOp]);

    useEffect(() => {
        if (!isOpen) return;

        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        setRequiredDate(defaultDate.toISOString().split('T')[0]);

        if (approvedOffers.length > 0) {
            setSelectedOfferId(String(approvedOffers[0].id));
        } else {
            setSelectedOfferId('');
        }

        if (prospects.length > 0) {
            setSelectedProspectId(String(prospects[0].id));
        }

        setItems([{ id: 1, name: '', quantity: 1, unit: '' }]);
        setIsWarranty(false);
        setIsPreOp(false);
    }, [approvedOffers, prospects, isOpen]);

    useEffect(() => {
        setItems([{ id: 1, name: '', quantity: 1, unit: '' }]);
    }, [selectedOfferId, selectedProspectId, isPreOp]);

    const handleItemChange = (index: number, field: keyof EditableItem, value: any) => {
        setItems(prevItems => {
            const newItems = [...prevItems];
            const currentItem = { ...newItems[index] };

            if (field === 'name') {
                currentItem.name = value;
                currentItem.material_id = undefined;
                const normalizedValue = String(value).trim().toLowerCase();

                // Prioritize checking if it's in the project's budget
                const budgetItem = (consolidatedMaterials || []).find(m => m.name.toLowerCase() === normalizedValue);
                const catalogItem = (combinedItemCatalog || []).find(catItem => catItem.name.toLowerCase() === normalizedValue);

                const isNowUnforeseen = isPreOp || (isBudgetControlled && value && !budgetItem);
                currentItem.isUnforeseen = isNowUnforeseen;

                // Priority: Budget Unit > Catalog Unit > Empty
                if (budgetItem) {
                    currentItem.unit = budgetItem.unit;
                } else if (catalogItem) {
                    currentItem.unit = catalogItem.unit;
                } else {
                    currentItem.unit = '';
                }

                if (!isNowUnforeseen) {
                    currentItem.unforeseenJustification = '';
                    currentItem.estimatedUnitCost = undefined;
                }
            } else if (field === 'quantity') {
                currentItem.quantity = value === '' ? '' : Math.max(1, parseInt(value, 10) || 1);
            } else {
                (currentItem as any)[field] = value;
            }

            newItems[index] = currentItem;
            return newItems;
        });
    };

    const handleAddItem = () => {
        setItems([...items, { id: getNextId(items), name: '', quantity: 1, unit: '' }]);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleLoadTemplate = (templateId: number) => {
        const template = (recurringOrderTemplates || []).find(t => t.id === templateId);
        if (template) {
            const newItems: EditableItem[] = template.items?.map((item, index) => {
                const normalizedValue = item.name.trim().toLowerCase();
                const budgetItem = (consolidatedMaterials || []).find(m => m.name.toLowerCase() === normalizedValue);
                const isUnforeseen = isPreOp || (isBudgetControlled && !budgetItem);
                return {
                    id: Date.now() + index,
                    name: item.name,
                    quantity: item.quantity,
                    unit: budgetItem ? budgetItem.unit : item.unit,
                    isUnforeseen,
                    unforeseenJustification: isUnforeseen ? `Pedido recurrente: ${template.name}` : undefined,
                    estimatedUnitCost: isUnforeseen ? ((combinedItemCatalog || []).find(c => c.name.toLowerCase() === normalizedValue)?.unitCost || 0) : undefined
                };
            });
            setItems(newItems);
            setShowRecurringModal(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación de seguridad para evitar crashes
        if (!items || !Array.isArray(items) || items.length === 0) {
            alert('Error: La lista de artículos no fue inicializada correctamente.');
            return;
        }

        const finalItems = items
            .map(i => ({
                material_id: i.material_id,
                name: i.name.trim(),
                quantity: Number(i.quantity),
                unit: i.unit,
                specifications: i.specifications,
                isUnforeseen: i.isUnforeseen,
                unforeseenJustification: i.unforeseenJustification,
                estimatedUnitCost: i.estimatedUnitCost ? Number(i.estimatedUnitCost) : undefined,
            }))
            .filter(i => i.name && i.quantity > 0 && i.unit);

        if (!isPreOp && !associatedProject || (isPreOp && !selectedProspectId) || finalItems.length === 0) {
            alert('Por favor, complete todos los campos obligatorios y agregue al menos un artículo válido con su unidad de medida.');
            setIsSubmitting(false);
            return;
        }

        for (const item of finalItems) {
            if (item.isUnforeseen) {
                if (!item.unforeseenJustification?.trim() || item.estimatedUnitCost == null || item.estimatedUnitCost <= 0) {
                    alert(`Para el ítem manual "${item.name}", debe proveer una descripción/justificación y un costo estimado positivo.`);
                    setIsSubmitting(false);
                    return;
                }
            }
        }

        setIsSubmitting(true);
        const userRoles = roles.filter(r => currentUser.roleIds.includes(r.id));
        const maxItemOverage = Math.max(0, ...userRoles.map(r => r.maxItemOveragePercentage || 0));
        const maxProjectOverage = Math.max(0, ...userRoles.map(r => r.maxProjectOveragePercentage || 0));

        let requiresGMApproval = false;
        let totalAdditionalCost = 0;

        if (!isPreOp && isBudgetControlled && associatedProject) {
            for (const item of finalItems) {
                const normalizedName = item.name.toLowerCase();
                const budgetItem = (consolidatedMaterials || []).find(m => m.name.toLowerCase() === normalizedName);
                const budgetedQty = budgetItem?.quantity || 0;

                const previouslyReq = previouslyRequestedQuantities.get(normalizedName) || 0;
                const availableQty = budgetedQty - previouslyReq;

                if (item.isUnforeseen || item.quantity > availableQty) {
                    const overageQty = item.isUnforeseen ? item.quantity : item.quantity - availableQty;
                    const itemOveragePercentage = budgetedQty > 0 ? (overageQty / budgetedQty) * 100 : Infinity;

                    if (itemOveragePercentage > maxItemOverage) {
                        requiresGMApproval = true;
                    }

                    const estimatedUnitCost = item.estimatedUnitCost || (combinedItemCatalog || []).find(c => c.name.toLowerCase() === normalizedName)?.unitCost || 0;
                    totalAdditionalCost += overageQty * estimatedUnitCost;
                }
            }

            if (!requiresGMApproval && totalAdditionalCost > 0) {
                const projectBudget = associatedProject.budget;
                const cumulativeOverage = associatedProject.unforeseenExpenses + totalAdditionalCost;
                const projectOveragePercentage = projectBudget > 0 ? (cumulativeOverage / projectBudget) * 100 : Infinity;

                if (projectOveragePercentage > maxProjectOverage) {
                    requiresGMApproval = true;
                }
            }
        }

        const newStatus = requiresGMApproval
            ? ServiceRequestStatus.PendingGMApproval
            : ServiceRequestStatus.PendingApproval;

        const newRequestData = {
            projectId: isPreOp ? null : associatedProject!.id,
            projectName: isPreOp ? `GASTO PRE-OP: ${(prospects || []).find(p => p.id === Number(selectedProspectId))?.company}` : associatedProject!.name,
            requestDate: new Date().toISOString().split('T')[0],
            requester: currentUser.name,
            requesterId: currentUser.id,
            requiredDate,
            status: newStatus,
            items: finalItems,
            isWarranty: !isPreOp && isWarranty,
            isPreOp,
            prospectId: isPreOp ? Number(selectedProspectId) : undefined,
        };

        try {
            await onSubmit(newRequestData);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Ocurrió un error al crear la solicitud. Intente de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl transform transition-all max-h-[95vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-dark-gray">Nueva Solicitud de Bienes y Servicios</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
                    {/* Scrollable Content Area */}
                    <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-6 pb-4 custom-scrollbar">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 border-2 border-orange-500 rounded-xl bg-orange-50/30">
                                <div className="mb-3">
                                    {isPreOp ? (
                                        <>
                                            <label htmlFor="prospect-selection" className="block text-sm font-bold text-slate-700 mb-1">Prospecto de Ventas (Origen)</label>
                                            <select id="prospect-selection" value={selectedProspectId} onChange={e => setSelectedProspectId(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                                {prospects.length > 0 ? (
                                                    prospects.map(p => <option key={p.id} value={p.id}>{p.company} ({p.name})</option>)
                                                ) : (
                                                    <option value="" disabled>No hay prospectos disponibles</option>
                                                )}
                                            </select>
                                        </>
                                    ) : (
                                        <>
                                            <label htmlFor="offer-selection" className="block text-sm font-bold text-slate-700 mb-1">Oferta Aprobada de Origen</label>
                                            <select id="offer-selection" value={selectedOfferId} onChange={e => setSelectedOfferId(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                                {approvedOffers.length > 0 ? (
                                                    (approvedOffers || []).map(o => {
                                                        const projectForOffer = (projects || []).find(p => p.offerId === o.id);
                                                        const statusLabel = projectForOffer?.status === ProjectStatus.Completed ? ' (Finalizado)' : '';
                                                        return (<option key={o.id} value={o.id}>
                                                            {o.consecutiveNumber} - {o.prospectName}{statusLabel}
                                                        </option>)
                                                    })
                                                ) : (
                                                    <option value="" disabled>No hay ofertas aprobadas disponibles</option>
                                                )}
                                            </select>
                                        </>
                                    )}
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-6 h-6 border-2 rounded flex items-center justify-center transition-all ${isPreOp ? 'bg-primary border-primary' : 'bg-white border-slate-300 group-hover:border-primary'}`}>
                                        {isPreOp && (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isPreOp}
                                        onChange={e => setIsPreOp(e.target.checked)}
                                        className="hidden"
                                    />
                                    <span className="text-sm font-black text-secondary uppercase tracking-tight">Gasto Pre-operativo (Preventa)</span>
                                </label>
                            </div>
                            <div>
                                <label htmlFor="requiredDate" className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tight">Fecha Requerida</label>
                                <input type="date" id="requiredDate" value={requiredDate} onChange={e => setRequiredDate(e.target.value)} required className="w-full p-3 border border-slate-300 rounded-lg shadow-sm" />
                            </div>
                        </div>

                        {!isPreOp && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase">Proyecto Asociado</label>
                                    <p className="font-semibold text-slate-800 mt-1">
                                        {associatedProject?.name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase">Cliente</label>
                                    <p className="font-semibold text-slate-800 mt-1">
                                        {selectedOffer?.prospectName || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {!isPreOp && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isWarranty"
                                    checked={isWarranty}
                                    onChange={e => setIsWarranty(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="isWarranty" className="text-sm font-medium text-slate-700">
                                    Esta es una solicitud por garantía (permite seleccionar ofertas de proyectos finalizados)
                                </label>
                            </div>
                        )}

                        <div className="border-l-4 border-primary bg-blue-50 p-3 rounded-r-lg flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-[11px] font-black text-primary uppercase tracking-tight">Nota: Los costos unitarios estimados que ingrese manualmente deben incluir el impuesto de ventas (IVA).</p>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-dark-gray">Artículos Requeridos</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowRecurringModal(true)}
                                    className="text-xs bg-blue-50 text-primary py-1.5 px-4 rounded-lg border border-primary/20 font-bold uppercase hover:bg-blue-100 transition-colors"
                                >
                                    Pedidos Recurrentes
                                </button>
                            </div>
                                <div className="space-y-4">
                                {items.map((item, index) => {
                                    const normalizedName = item.name.trim().toLowerCase();
                                    const budgetItem = !isPreOp && isBudgetControlled && item.name ? (consolidatedMaterials || []).find(m => m.name.toLowerCase() === normalizedName) : null;
                                    const budgetedQty = budgetItem?.quantity || 0;
                                    const previouslyRequested = previouslyRequestedQuantities.get(normalizedName) || 0;
                                    const currentlyRequestedByOthers = items.filter((i, idx) => idx !== index && i.name.trim().toLowerCase() === normalizedName).reduce((sum, i) => sum + Number(i.quantity || 0), 0);
                                    const totalRequestedBeforeThisItem = previouslyRequested + currentlyRequestedByOthers;
                                    const availableQty = budgetedQty - totalRequestedBeforeThisItem;
                                    const isOverBudget = !isPreOp && availableQty - Number(item.quantity || 0) < 0;

                                    return (
                                        <div key={item.id} className={`p-4 rounded-xl border ${item.isUnforeseen ? 'bg-purple-50/50 border-purple-200 shadow-sm shadow-purple-50' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="grid grid-cols-[1fr,120px,120px,auto] gap-3 items-center">
                                                <div className="relative">
                                                    <input 
                                                        list={!isPreOp && isBudgetControlled ? undefined : `item-catalog-new-${isBudgetControlled}`}
                                                        placeholder="Seleccione o escriba un ítem..." 
                                                        value={item.name} 
                                                        onChange={e => {
                                                            setActiveDropdownIndex(index);
                                                            handleItemChange(index, 'name', e.target.value);
                                                            handleItemChange(index, 'material_id', undefined);
                                                        }} 
                                                        onFocus={() => setActiveDropdownIndex(index)}
                                                        onBlur={() => setTimeout(() => setActiveDropdownIndex(null), 200)}
                                                        required 
                                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" 
                                                    />
                                                    {activeDropdownIndex === index && !isPreOp && isBudgetControlled && item.name !== undefined && materialesPresupuestados.length > 0 && (
                                                        <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 shadow-xl rounded-lg max-h-48 overflow-y-auto">
                                                            {materialesPresupuestados
                                                                .filter(mat => mat.name.toLowerCase().includes(item.name.toLowerCase()))
                                                                .map(mat => (
                                                                    <li 
                                                                        key={mat.material_id || mat.name} 
                                                                        onMouseDown={(e) => {
                                                                            e.preventDefault(); 
                                                                            handleItemChange(index, 'name', mat.name);
                                                                            if (mat.material_id) handleItemChange(index, 'material_id', mat.material_id);
                                                                            handleItemChange(index, 'unit', mat.unit);
                                                                            setActiveDropdownIndex(null);
                                                                        }}
                                                                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between items-center"
                                                                    >
                                                                        <span className="font-semibold text-slate-700">{mat.name}</span>
                                                                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                                            {formatNumber(mat.cantidad_disponible || 0)} {mat.unit} disp.
                                                                        </span>
                                                                    </li>
                                                            ))}
                                                            {materialesPresupuestados.filter(mat => mat.name.toLowerCase().includes(item.name.toLowerCase())).length === 0 && (
                                                                <li className="p-3 text-sm text-slate-400 italic text-center">No hay coincidencias en presupuesto</li>
                                                            )}
                                                        </ul>
                                                    )}
                                                </div>
                                                <input type="number" placeholder="Cant." value={item.quantity} min="1" onChange={e => handleItemChange(index, 'quantity', e.target.value)} required className={`p-2.5 border rounded-lg text-center font-bold focus:ring-2 outline-none ${isOverBudget && isBudgetControlled && !item.isUnforeseen ? 'border-red-500 ring-red-100' : 'border-slate-300 focus:ring-primary/20'}`} />
                                                <input
                                                    type="text"
                                                    placeholder={item.isUnforeseen ? "Ej: kg, m2" : "Unidad"}
                                                    value={item.unit}
                                                    onChange={e => handleItemChange(index, 'unit', e.target.value)}
                                                    readOnly={!item.isUnforeseen}
                                                    required={item.isUnforeseen}
                                                    className={`p-2.5 border border-slate-300 rounded-lg text-center outline-none ${!item.isUnforeseen ? 'bg-slate-200 text-slate-500 cursor-not-allowed font-medium' : 'bg-white focus:ring-2 focus:ring-primary/20'}`}
                                                />
                                                <button type="button" onClick={() => handleRemoveItem(index)} disabled={items.length <= 1} className="p-2 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-30" aria-label="Eliminar artículo">
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd"></path></svg>
                                                </button>
                                            </div>

                                            {!isPreOp && isBudgetControlled && item.name && !item.isUnforeseen && (
                                                <div className={`mt-3 p-3 rounded-lg text-xs font-semibold ${isOverBudget ? 'bg-red-100 text-red-700' : 'bg-green-100/50 text-green-800'}`}>
                                                    <div className="grid grid-cols-3 gap-4 text-center">
                                                        <div className="bg-white/50 p-1.5 rounded-md">Presupuestado: <span className="font-bold">{formatNumber(budgetedQty)}</span></div>
                                                        <div className="bg-white/50 p-1.5 rounded-md">Solicitado: <span className="font-bold">{formatNumber(previouslyRequested)}</span></div>
                                                        <div className="bg-white/50 p-1.5 rounded-md">Disponible: <span className="font-bold">{formatNumber(availableQty)}</span></div>
                                                    </div>
                                                    {isOverBudget && <p className="mt-2 font-black uppercase text-center tracking-tighter">⛔ ¡Exceso Detectado! Requiere aprobación especial.</p>}
                                                </div>
                                            )}

                                            {item.isUnforeseen && (
                                                <div className="mt-4 pt-4 border-t border-purple-200/50 space-y-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-purple-800 uppercase tracking-widest mb-1">Costo Unit. Est. (Incl. IVA) (¢) *</label>
                                                            <input type="number" value={item.estimatedUnitCost || ''} onChange={e => handleItemChange(index, 'estimatedUnitCost', e.target.value)} className="w-full p-2.5 border border-purple-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-purple-200 outline-none" required min="0.01" step="any" placeholder="0.00" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-purple-800 uppercase tracking-widest mb-1">Justificación / Descripción *</label>
                                                            <input type="text" value={item.unforeseenJustification || ''} onChange={e => handleItemChange(index, 'unforeseenJustification', e.target.value)} className="w-full p-2.5 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 outline-none" required placeholder="Especifique el rubro o necesidad..." />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            <datalist id={`item-catalog-new-${isBudgetControlled}`}>
                                {(isBudgetControlled ? consolidatedMaterials : combinedItemCatalog).map(m => <option key={m.name} value={m.name} />)}
                            </datalist>
                            <button type="button" onClick={handleAddItem} className="mt-4 py-2 px-4 text-sm font-black text-primary hover:text-primary-dark uppercase tracking-widest flex items-center gap-2 border-2 border-primary/20 rounded-xl w-fit transition-all hover:bg-primary/5">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                Agregar Insumo Manual
                            </button>
                        </div>
                    </div>

                    {/* Fixed Footer Buttons */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 flex-shrink-0 bg-white">
                        <button type="button" onClick={onClose} className="bg-slate-100 text-slate-800 font-black py-3 px-8 rounded-xl hover:bg-slate-200 transition-colors uppercase tracking-widest text-xs">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting || (isPreOp ? !selectedProspectId : approvedOffers.length === 0)} className="bg-primary text-white font-black py-3 px-10 rounded-xl hover:bg-primary-dark transition-all disabled:bg-slate-300 disabled:cursor-wait uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
                            {isSubmitting ? 'Procesando...' : 'Crear Solicitud'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Recurring Order Selection Modal Overlay */}
            {showRecurringModal && (
                <div className="fixed inset-0 bg-black/40 z-[60] flex justify-center items-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tighter">Seleccionar Pedido Recurrente</h3>
                            <button onClick={() => setShowRecurringModal(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {(recurringOrderTemplates || []).map(template => (
                                <button
                                    key={template.id}
                                    type="button"
                                    onClick={() => handleLoadTemplate(template.id)}
                                    className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-blue-50 transition-all group"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-slate-700 group-hover:text-primary">{template.name}</span>
                                        <span className="text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-500">{template.items?.length || 0} items</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{template.description || 'Sin descripción.'}</p>
                                </button>
                            ))}
                            {recurringOrderTemplates.length === 0 && (
                                <p className="text-center text-slate-400 py-6 italic">No hay pedidos recurrentes guardados.</p>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setShowRecurringModal(false)} className="px-6 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors uppercase tracking-widest">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
};
