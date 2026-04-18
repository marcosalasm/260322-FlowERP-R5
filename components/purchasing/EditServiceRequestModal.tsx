
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Project, ServiceRequest, Material, ServiceItem, ServiceRequestItem, User, ServiceRequestItemChange, Budget, Offer, ServiceRequestStatus, ProjectStatus, ChangeOrder, ChangeOrderStatus, PurchaseOrder, POStatus } from '../../types';
import { AppContext } from '../../context/AppContext';
import { formatNumber } from '../../utils/format';

interface EditServiceRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedRequest: ServiceRequest) => void;
    request: ServiceRequest | null;
    projects: Project[];
    materials: Material[];
    serviceItems: ServiceItem[];
    currentUser: User;
    budgets: Budget[];
    offers: Offer[];
    changeOrders: ChangeOrder[];
    allServiceRequests: ServiceRequest[];
    purchaseOrders: PurchaseOrder[];
}

const getNextId = (items: any[]) => (items.length > 0 ? Math.max(...items.map(i => i.id)) : 0) + 1;

type EditableServiceRequestItem = Omit<ServiceRequestItem, 'quantity'> & {
    quantity: number | string;
};

export const EditServiceRequestModal: React.FC<EditServiceRequestModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    request,
    projects = [],
    materials = [],
    serviceItems = [],
    currentUser,
    budgets = [],
    offers = [],
    changeOrders = [],
    allServiceRequests = [],
    purchaseOrders = []
}) => {
    const appContext = useContext(AppContext);
    const roles = appContext?.roles || [];
    const [projectId, setProjectId] = useState<string>('');
    const [requiredDate, setRequiredDate] = useState('');
    const [items, setItems] = useState<EditableServiceRequestItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    const combinedItemCatalog = useMemo(() => [...(materials || []), ...(serviceItems || [])], [materials, serviceItems]);

    // --- Budget Control Logic ---
    const rootOffer = useMemo(() => {
        if (!request) return null;
        const project = (projects || []).find(p => p.id === request.projectId);
        if (!project || !project.offerId) return null;
        return (offers || []).find(o => o.id === project.offerId) || null;
    }, [request, projects, offers]);

    const isBudgetControlled = useMemo(() => {
        if (!rootOffer) return false;
        if (rootOffer.budgetId) return true;
        // Check if there are any approved change orders with a budget for this offer
        return (changeOrders || []).some(co => co.offerId === rootOffer.id && co.status === ChangeOrderStatus.Approved && co.budgetId);
    }, [rootOffer, changeOrders]);

    const consolidatedMaterials = useMemo(() => {
        if (!rootOffer) return [];
        const materialsMap = new Map<string, { unit: string; quantity: number }>();

        // 1. Add materials from the initial offer's budget
        if (rootOffer.budgetId) {
            const initialBudget = (budgets || []).find(b => b.id === rootOffer.budgetId);
            if (initialBudget) {
                initialBudget.activities.forEach(activity => {
                    activity.subActivities.forEach(sub => {
                        if (!sub.description) return;
                        const key = `${sub.description.trim().toLowerCase()}|${sub.unit.trim().toLowerCase()}`;
                        const existing = materialsMap.get(key) || { unit: sub.unit, quantity: 0 };
                        existing.quantity += Number(sub.quantity) || 0;
                        materialsMap.set(key, existing);
                    });
                });
            }
        }

        // 2. Add/Subtract materials from approved change orders
        const approvedChangeOrders = (changeOrders || []).filter(
            co => co.offerId === rootOffer.id && co.status === ChangeOrderStatus.Approved
        );

        approvedChangeOrders.forEach(co => {
            if (!co.budgetId) return;
            const budget = (budgets || []).find(b => b.id === co.budgetId);
            if (!budget) return;

            const multiplier = co.changeType === 'Crédito' ? -1 : 1;

            budget.activities.forEach(activity => {
                activity.subActivities.forEach(sub => {
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
    }, [rootOffer, changeOrders, budgets]);

    const previouslyRequestedQuantities = useMemo(() => {
        if (!request) return new Map<string, number>();
        const quantityMap = new Map<string, number>();

        // 1. Pending Service Requests
        (allServiceRequests || [])
            .filter(req => req.id !== request.id && req.projectId === request.projectId &&
                [ServiceRequestStatus.PendingApproval, ServiceRequestStatus.PendingGMApproval, ServiceRequestStatus.InQuotation, ServiceRequestStatus.QuotationReady].includes(req.status))
            .forEach(req => {
                (req.items || []).forEach(item => {
                    const key = item.name.trim().toLowerCase();
                    quantityMap.set(key, (quantityMap.get(key) || 0) + Number(item.quantity || 0));
                });
            });

        // 2. Existing Purchase Orders (approved, issued, received, etc.)
        (purchaseOrders || [])
            .filter(po => po.projectId === request.projectId &&
                po.status !== POStatus.Rejected && po.status !== POStatus.Cancelled)
            .forEach(po => {
                (po.items || []).forEach(item => {
                    const key = item.name.trim().toLowerCase();
                    quantityMap.set(key, (quantityMap.get(key) || 0) + Number(item.quantity || 0));
                });
            });

        return quantityMap;
    }, [request, allServiceRequests, purchaseOrders]);


    useEffect(() => {
        if (request && isOpen) {
            setProjectId(String(request.projectId));
            setRequiredDate(request.requiredDate);
            setItems(request?.items?.map(item => ({ ...item })) || []);
            // Disable editing if it's already far in the process
            setIsLocked(![ServiceRequestStatus.PendingApproval, ServiceRequestStatus.PendingGMApproval, ServiceRequestStatus.Rejected].includes(request.status));
        }
    }, [request, isOpen]);

    const handleItemChange = (index: number, field: keyof EditableServiceRequestItem, value: any) => {
        if (isLocked) return;
        setItems(prevItems => {
            const newItems = [...prevItems];
            const currentItem = { ...newItems[index] };

            if (field === 'name') {
                currentItem.name = value;
                const normalizedValue = String(value).trim().toLowerCase();

                const budgetItem = (consolidatedMaterials || []).find(m => m.name.toLowerCase() === normalizedValue);
                const catalogItem = (combinedItemCatalog || []).find(catItem => catItem.name.toLowerCase() === normalizedValue);

                const isNowUnforeseen = isBudgetControlled && value && !budgetItem;
                currentItem.isUnforeseen = isNowUnforeseen;

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
        if (isLocked) return;
        setItems([...items, { id: getNextId(items), name: '', quantity: 1, unit: '' }]);
    };

    const handleRemoveItem = (index: number) => {
        if (isLocked) return;
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!request || isLocked) return;
        setIsSubmitting(true);

        const finalItems = items
            .map(i => ({
                id: i.id,
                name: i.name.trim(),
                quantity: Number(i.quantity),
                unit: i.unit,
                specifications: i.specifications,
                isUnforeseen: i.isUnforeseen,
                unforeseenJustification: i.unforeseenJustification,
                estimatedUnitCost: i.estimatedUnitCost ? Number(i.estimatedUnitCost) : undefined,
            }))
            .filter(i => i.name && i.quantity > 0 && i.unit);

        if (finalItems.length === 0) {
            alert('Por favor agregue al menos un artículo válido con su unidad de medida.');
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

        const project = (projects || []).find(p => p.id === Number(projectId));
        const userRoles = roles.filter(r => currentUser.roleIds.includes(r.id));
        const maxItemOverage = Math.max(0, ...userRoles.map(r => r.maxItemOveragePercentage || 0));
        const maxProjectOverage = Math.max(0, ...userRoles.map(r => r.maxProjectOveragePercentage || 0));

        let requiresGMApproval = false;
        let totalAdditionalCost = 0;

        if (isBudgetControlled && project) {
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
                const projectBudget = project.budget;
                const cumulativeOverage = project.unforeseenExpenses + totalAdditionalCost;
                const projectOveragePercentage = projectBudget > 0 ? (cumulativeOverage / projectBudget) * 100 : Infinity;

                if (projectOveragePercentage > maxProjectOverage) {
                    requiresGMApproval = true;
                }
            }
        }

        const newStatus = requiresGMApproval
            ? ServiceRequestStatus.PendingGMApproval
            : ServiceRequestStatus.PendingApproval;

        // --- History Tracking ---
        const history: ServiceRequestItemChange[] = request.itemHistory ? [...request.itemHistory] : [];

        // Items added
        finalItems.forEach(item => {
            if (!request.items.some(oi => oi.id === item.id)) {
                history.push({
                    user: currentUser.name,
                    date: new Date().toISOString(),
                    type: 'added',
                    item: { name: item.name, quantity: item.quantity, unit: item.unit }
                });
            }
        });

        // Items removed
        (request.items || []).forEach(oi => {
            if (!finalItems.some(ni => ni.id === oi.id)) {
                history.push({
                    user: currentUser.name,
                    date: new Date().toISOString(),
                    type: 'removed',
                    item: { name: oi.name, quantity: oi.quantity, unit: oi.unit }
                });
            }
        });

        const updatedRequest: ServiceRequest = {
            ...request,
            requiredDate,
            items: finalItems,
            status: newStatus,
            itemHistory: history
        };

        onSubmit(updatedRequest);
        setIsSubmitting(false);
        onClose();
    };

    if (!isOpen || !request) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl transform transition-all max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-dark-gray">Editar Solicitud #{request.id}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
                    <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-6 pb-4 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tight">Proyecto Asociado</label>
                                <p className="w-full p-2.5 border border-slate-200 bg-slate-100 rounded-lg text-slate-600 font-medium">
                                    {request.projectName}
                                </p>
                            </div>
                            <div>
                                <label htmlFor="edit-requiredDate" className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tight">Fecha Requerida</label>
                                <input type="date" id="edit-requiredDate" value={requiredDate} onChange={e => setRequiredDate(e.target.value)} required disabled={isLocked} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-slate-100" />
                            </div>
                        </div>

                        {isLocked && (
                            <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-800 p-3 text-xs font-semibold rounded-r-lg">
                                Esta solicitud está bloqueada para edición porque ya se encuentra en proceso de cotización o aprobada.
                            </div>
                        )}
                        {request.status === ServiceRequestStatus.Rejected && request.rejectionReason && (
                            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-3 text-xs font-semibold rounded-r-lg">
                                <p className="font-bold mb-1">Motivo del Rechazo:</p>
                                <p>{request.rejectionReason}</p>
                            </div>
                        )}

                        <div className="flex flex-col">
                            <h3 className="text-lg font-bold text-dark-gray mb-4">Artículos de la Solicitud</h3>
                            <div className="space-y-4">
                                {items.map((item, index) => {
                                    const normalizedName = item.name.trim().toLowerCase();
                                    const budgetItem = isBudgetControlled && item.name ? (consolidatedMaterials || []).find(m => m.name.toLowerCase() === normalizedName) : null;
                                    const budgetedQty = budgetItem?.quantity || 0;
                                    const previouslyRequested = previouslyRequestedQuantities.get(normalizedName) || 0;
                                    const currentlyRequestedByOthers = items.filter((i, idx) => idx !== index && i.name.trim().toLowerCase() === normalizedName).reduce((sum, i) => sum + Number(i.quantity || 0), 0);
                                    const totalRequestedBeforeThisItem = previouslyRequested + currentlyRequestedByOthers;
                                    const availableQty = budgetedQty - totalRequestedBeforeThisItem;
                                    const isOverBudget = isBudgetControlled && availableQty - Number(item.quantity || 0) < 0;

                                    return (
                                        <div key={item.id} className={`p-4 rounded-xl border ${item.isUnforeseen ? 'bg-purple-50/50 border-purple-200' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="grid grid-cols-[1fr,120px,120px,auto] gap-3 items-center">
                                                <div className="relative">
                                                    <input list={`edit-item-catalog-${isBudgetControlled}`} placeholder="Nombre del Artículo" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} required disabled={isLocked} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-slate-100" />
                                                </div>
                                                <input type="number" placeholder="Cant." value={item.quantity} min="1" onChange={e => handleItemChange(index, 'quantity', e.target.value)} required disabled={isLocked} className={`p-2.5 border rounded-lg text-center font-bold focus:ring-2 outline-none ${isOverBudget && isBudgetControlled && !item.isUnforeseen ? 'border-red-500 ring-red-100' : 'border-slate-300 focus:ring-primary/20'}`} />
                                                <input
                                                    type="text"
                                                    placeholder="Unidad"
                                                    value={item.unit}
                                                    onChange={e => handleItemChange(index, 'unit', e.target.value)}
                                                    readOnly={!item.isUnforeseen}
                                                    required
                                                    className={`p-2.5 border border-slate-300 rounded-lg text-center outline-none ${!item.isUnforeseen ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-primary/20'}`}
                                                />
                                                <button type="button" onClick={() => handleRemoveItem(index)} disabled={isLocked || items.length <= 1} className="p-2 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-30">
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd"></path></svg>
                                                </button>
                                            </div>
                                            {isBudgetControlled && item.name && !item.isUnforeseen && (
                                                <div className={`mt-3 p-3 rounded-lg text-xs font-semibold ${isOverBudget ? 'bg-red-100 text-red-700' : 'bg-green-100/50 text-green-800'}`}>
                                                    <div className="grid grid-cols-3 gap-4 text-center">
                                                        <div className="bg-white/50 p-1.5 rounded-md">Presupuestado: <span className="font-bold">{formatNumber(budgetedQty)}</span></div>
                                                        <div className="bg-white/50 p-1.5 rounded-md">Solicitado: <span className="font-bold">{formatNumber(previouslyRequested)}</span></div>
                                                        <div className="bg-white/50 p-1.5 rounded-md">Disponible: <span className="font-bold">{formatNumber(availableQty)}</span></div>
                                                    </div>
                                                </div>
                                            )}
                                            {item.isUnforeseen && !isLocked && (
                                                <div className="mt-4 pt-4 border-t border-purple-200/50 space-y-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-purple-800 uppercase tracking-widest mb-1">Costo Unit. Est. (Incl. IVA) (¢) *</label>
                                                            <input type="number" value={item.estimatedUnitCost || ''} onChange={e => handleItemChange(index, 'estimatedUnitCost', e.target.value)} className="w-full p-2.5 border border-purple-300 rounded-lg text-sm font-mono font-bold" required min="0.01" step="any" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-purple-800 uppercase tracking-widest mb-1">Justificación / Descripción *</label>
                                                            <input type="text" value={item.unforeseenJustification || ''} onChange={e => handleItemChange(index, 'unforeseenJustification', e.target.value)} className="w-full p-2.5 border border-purple-300 rounded-lg text-sm" required />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            <datalist id={`edit-item-catalog-${isBudgetControlled}`}>
                                {(isBudgetControlled ? consolidatedMaterials : combinedItemCatalog).map(m => <option key={m.name} value={m.name} />)}
                            </datalist>
                            {!isLocked && (
                                <button type="button" onClick={handleAddItem} className="mt-4 py-2 px-4 text-sm font-black text-primary hover:text-primary-dark uppercase tracking-widest flex items-center gap-2 border-2 border-primary/20 rounded-xl w-fit">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                    Agregar Insumo Manual
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 flex-shrink-0 bg-white">
                        <button type="button" onClick={onClose} className="bg-slate-100 text-slate-800 font-black py-3 px-8 rounded-xl hover:bg-slate-200 transition-colors uppercase tracking-widest text-xs">
                            Cancelar
                        </button>
                        {!isLocked && (
                            <button type="submit" disabled={isSubmitting} className="bg-primary text-white font-black py-3 px-10 rounded-xl hover:bg-primary-dark transition-all disabled:bg-slate-300 uppercase tracking-widest text-xs shadow-lg">
                                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
