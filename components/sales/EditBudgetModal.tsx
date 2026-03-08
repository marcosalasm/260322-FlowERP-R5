
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Prospect, BudgetActivity, BudgetSubActivity, IndirectCosts, Budget, Material, ServiceItem, PredeterminedActivity, Offer, OfferStatus, LaborItem, OperationalExpenseItem } from '../../types';
import { VAT_RATES } from '../../data/vatRates';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { formatNumber } from '../../utils/format';
import { OperationalExpensesModal } from './OperationalExpensesModal';
import { IndirectCostsModal } from './IndirectCostsModal';

interface EditBudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedBudgetData: Budget) => void;
    onUpdateMasterMaterials: (updates: { materialId: number; newCost: number }[]) => void;
    budget: Budget | null;
    prospects: Prospect[];
    materials: Material[];
    serviceItems: ServiceItem[];
    laborItems: LaborItem[];
    offers: Offer[];
}

const getNextId = (items: { id: number }[]) => ((items || []).length > 0 ? Math.max(...(items || []).map(i => i.id)) : 0) + 1;

const USD_TO_CRC_RATE = 500;

const getConvertedRate = (rate: number, fromCurrency: 'USD' | 'CRC', toCurrency: 'USD' | 'CRC') => {
    if (fromCurrency === toCurrency) return rate;
    if (fromCurrency === 'USD' && toCurrency === 'CRC') return rate * USD_TO_CRC_RATE;
    if (fromCurrency === 'CRC' && toCurrency === 'USD') return rate / USD_TO_CRC_RATE;
    return rate;
};

const CHAPTER_UNIT_OPTIONS = ["m", "m2", "m3", "Global", "Kg", "Unidad", "Litro"];

type LocalSubActivity = BudgetSubActivity & { type: 'material' | 'labor' | 'subcontract' };
type LocalActivity = Omit<BudgetActivity, 'subActivities'> & { subActivities: LocalSubActivity[] };

const initialLocalSubActivity: LocalSubActivity = { id: 1, itemNumber: '1.1', description: '', quantity: 1, unit: '', materialUnitCost: 0, laborUnitCost: 0, subcontractUnitCost: 0, type: 'material' };

const initialActivity: LocalActivity = {
    id: 1, itemNumber: '1', description: '', quantity: 1, unit: 'Global',
    subActivities: [initialLocalSubActivity]
};

export const EditBudgetModal: React.FC<EditBudgetModalProps> = ({ isOpen, onClose, onSubmit, onUpdateMasterMaterials, budget, prospects, materials, serviceItems, laborItems, offers }) => {
    const appContext = useContext(AppContext);
    const { predeterminedActivities = [] } = appContext || {};
    const { showToast } = useToast();

    const [prospectId, setProspectId] = useState<string>('');
    const [description, setDescription] = useState('');
    const [activities, setActivities] = useState<LocalActivity[]>([]);
    const [indirectCosts, setIndirectCosts] = useState<IndirectCosts>({} as IndirectCosts);
    const [operationalExpenses, setOperationalExpenses] = useState<OperationalExpenseItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [countryCode, setCountryCode] = useState<string>('CR');
    const [currency, setCurrency] = useState<'CRC' | 'USD'>('CRC');
    const [taxRate, setTaxRate] = useState<number>(0);
    const [selectedPredetActivityId, setSelectedPredetActivityId] = useState<string>('');
    const [predetActivityQty, setPredetActivityQty] = useState<number | string>(1);
    const [isRecurring, setIsRecurring] = useState(false);
    const [isOperationalExpensesModalOpen, setIsOperationalExpensesModalOpen] = useState(false);
    const [isIndirectCostsModalOpen, setIsIndirectCostsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);
    const [isFooterMinimized, setIsFooterMinimized] = useState(true);
    const [isFullscreenBreakdown, setIsFullscreenBreakdown] = useState(false);

    const isLocked = useMemo(() => {
        if (!budget || budget.isRecurring) return false;
        return offers.some(offer => offer.budgetId === budget.id && offer.status === OfferStatus.Aprobacion);
    }, [budget, offers]);

    useEffect(() => {
        if (isOpen && budget) {
            setProspectId(String(budget.prospectId));
            setDescription(budget.description || '');
            const mappedActivities: LocalActivity[] = (budget.activities || []).map(act => ({
                ...act,
                subActivities: (act.subActivities || []).map(sub => {
                    let type: LocalSubActivity['type'] = 'material';
                    const normalizedDesc = sub.description ? sub.description.trim().toLowerCase() : '';
                    if ((laborItems || []).some(l => l.name.trim().toLowerCase() === normalizedDesc)) type = 'labor';
                    else if ((serviceItems || []).some(s => s.name.trim().toLowerCase() === normalizedDesc)) type = 'subcontract';
                    return { ...sub, type };
                })
            }));
            setActivities(mappedActivities);
            setIndirectCosts(budget.indirectCosts ? { ...budget.indirectCosts } : {} as IndirectCosts);
            setOperationalExpenses(budget.operationalExpenses && budget.operationalExpenses.length > 0 ? [...budget.operationalExpenses] : [{ id: 1, description: '', quantity: 1, unit: '', unitCost: 0 }]);
            setCountryCode(budget.countryCode || 'CR');
            setCurrency(budget.currency || 'CRC');
            setIsRecurring(budget.isRecurring || false);
            setSearchTerm('');
            setIsHeaderMinimized(false);
            setIsFooterMinimized(true);
            setIsFullscreenBreakdown(false);
        }
    }, [isOpen, budget, laborItems, serviceItems]);

    useEffect(() => {
        const selectedCountryData = VAT_RATES.find(c => c.code === countryCode);
        setTaxRate(selectedCountryData ? selectedCountryData.rate : 0);
    }, [countryCode]);

    const handleUpdateOperationalExpenses = (updatedExpenses: OperationalExpenseItem[]) => {
        setOperationalExpenses(updatedExpenses);
    };

    const handleUpdateIndirectCosts = (updatedCosts: IndirectCosts) => {
        setIndirectCosts(updatedCosts);
    };

    const handleActivityChange = (actId: number, field: keyof BudgetActivity, value: string) => {
        setActivities(acts => acts.map(act => act.id === actId ? { ...act, [field]: value } : act));
    };

    const handleSubActivityChange = (actId: number, subActId: number, field: keyof LocalSubActivity, value: string) => {
        if (isLocked && ['materialUnitCost', 'laborUnitCost', 'subcontractUnitCost'].includes(field)) return;
        setActivities(acts => acts.map(act => {
            if (act.id === actId) {
                const newSubActivities = act.subActivities.map(sub => {
                    if (sub.id === subActId) {
                        const updatedSub = { ...sub, [field]: value };
                        if (field === 'type') {
                            updatedSub.description = '';
                            updatedSub.unit = '';
                            updatedSub.materialUnitCost = 0;
                            updatedSub.laborUnitCost = 0;
                            updatedSub.subcontractUnitCost = 0;
                        }
                        if (field === 'description') {
                            const normalizedValue = value.trim().toLowerCase();
                            let item: Material | ServiceItem | LaborItem | undefined;
                            switch (updatedSub.type) {
                                case 'material': item = materials.find(i => i.name.trim().toLowerCase() === normalizedValue); break;
                                case 'labor': item = laborItems.find(i => i.name.trim().toLowerCase() === normalizedValue); break;
                                case 'subcontract': item = serviceItems.find(i => i.name.trim().toLowerCase() === normalizedValue); break;
                            }
                            if (item) {
                                if ('hourlyRate' in item) {
                                    updatedSub.unit = 'Hora';
                                    updatedSub.laborUnitCost = getConvertedRate(item.hourlyRate, item.currency, currency);
                                } else {
                                    updatedSub.unit = item.unit;
                                    if (updatedSub.type === 'material') updatedSub.materialUnitCost = (item as Material).unitCost || 0;
                                    else updatedSub.subcontractUnitCost = (item as ServiceItem).unitCost || 0;
                                }
                            }
                        }
                        return updatedSub;
                    }
                    return sub;
                });
                return { ...act, subActivities: newSubActivities };
            }
            return act;
        }));
    };

    const handleRemoveActivity = (actId: number) => {
        setActivities(prev => prev.filter(act => act.id !== actId).map((act, index) => ({ ...act, itemNumber: String(index + 1) })));
    };

    const handleAddActivity = () => {
        const nextId = getNextId(activities);
        const newItemNumber = String(activities.length + 1);
        setActivities(prev => [...prev, {
            id: nextId, itemNumber: newItemNumber, description: '', quantity: 1, unit: 'Global',
            subActivities: [{ id: 1, itemNumber: `${newItemNumber}.1`, description: '', quantity: 1, unit: '', materialUnitCost: 0, laborUnitCost: 0, subcontractUnitCost: 0, type: 'material' }]
        }]);
    };

    const handleAddPredetActivity = () => {
        const predetActivity = predeterminedActivities.find(a => a.id === Number(selectedPredetActivityId));
        if (!predetActivity) return;

        const multiplier = Number(predetActivityQty) || 1;
        const nextId = getNextId(activities);
        const newItemNumber = String(activities.length + 1);

        const newSubActivities: LocalSubActivity[] = predetActivity.subActivities.map((sub, idx) => {
            let type: LocalSubActivity['type'] = sub.type as any || 'material';
            let mCost = 0, lCost = 0, sCost = 0;

            const normalizedDesc = sub.description.trim().toLowerCase();

            if (type === 'material') {
                const mat = materials.find(m => m.name.trim().toLowerCase() === normalizedDesc);
                mCost = mat?.unitCost || 0;
            } else if (type === 'labor') {
                const lab = laborItems.find(l => l.name.trim().toLowerCase() === normalizedDesc);
                lCost = lab ? getConvertedRate(lab.hourlyRate, lab.currency, currency) : 0;
            } else if (type === 'subcontract') {
                const sbc = serviceItems.find(s => s.name.trim().toLowerCase() === normalizedDesc);
                sCost = sbc?.unitCost || 0;
            }

            return {
                id: idx + 1,
                itemNumber: `${newItemNumber}.${idx + 1}`,
                description: sub.description,
                quantity: sub.quantityPerBaseUnit * multiplier,
                unit: sub.unit,
                materialUnitCost: mCost,
                laborUnitCost: lCost,
                subcontractUnitCost: sCost,
                type
            };
        });

        const newActivity: LocalActivity = {
            id: nextId,
            itemNumber: newItemNumber,
            description: `${predetActivity.name} (${multiplier} ${predetActivity.baseUnit})`,
            quantity: multiplier,
            unit: predetActivity.baseUnit,
            subActivities: newSubActivities,
            predeterminedActivityId: predetActivity.id
        };

        setActivities(prev => [...prev, newActivity]);
        setSelectedPredetActivityId('');
        setPredetActivityQty(1);
        showToast(`Actividad "${predetActivity.name}" añadida correctamente.`, 'success');
    };

    const handleAddSubActivity = (actId: number) => {
        setActivities(prev => prev.map(act => {
            if (act.id === actId) {
                const nextId = getNextId(act.subActivities);
                const newItemNumber = `${act.itemNumber}.${act.subActivities.length + 1}`;
                return { ...act, subActivities: [...act.subActivities, { id: nextId, itemNumber: newItemNumber, description: '', quantity: 1, unit: '', materialUnitCost: 0, laborUnitCost: 0, subcontractUnitCost: 0, type: 'material' }] };
            }
            return act;
        }));
    };

    const handleRemoveSubActivity = (actId: number, subActId: number) => {
        setActivities(prev => prev.map(act => {
            if (act.id === actId && act.subActivities.length > 1) {
                const newSubActivities = act.subActivities.filter(sub => sub.id !== subActId)
                    .map((sub, index) => ({ ...sub, itemNumber: `${act.itemNumber}.${index + 1}` }));
                return { ...act, subActivities: newSubActivities };
            }
            return act;
        }));
    };

    const calculations = useMemo(() => {
        let totalMaterialsDirect = 0;
        let totalLaborDirect = 0;
        let totalSubcontractsDirect = 0;

        (activities || []).forEach(activity => {
            (activity?.subActivities || []).forEach(sub => {
                const quantity = Number(sub?.quantity) || 0;
                totalMaterialsDirect += quantity * (Number(sub?.materialUnitCost) || 0);
                totalLaborDirect += quantity * (Number(sub?.laborUnitCost) || 0);
                totalSubcontractsDirect += quantity * (Number(sub?.subcontractUnitCost) || 0);
            });
        });

        const directCostTotal = totalMaterialsDirect + totalLaborDirect + totalSubcontractsDirect;
        const operationalExpensesTotal: number = operationalExpenses.reduce((acc: number, item): number => acc + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0), 0);
        const indirectCostPercentage: number = indirectCosts ? Object.values(indirectCosts).reduce<number>((sum, val: any) => sum + (Number(val) || 0), 0) : 0;
        const indirectCostTotal: number = (directCostTotal + operationalExpensesTotal) * (indirectCostPercentage / 100);
        const grandTotal: number = directCostTotal + indirectCostTotal + operationalExpensesTotal;

        // Revised Tax Calculation: (Total Labor + Operational Expenses + Indirect Costs) * Tax Rate
        const taxBase = totalLaborDirect + operationalExpensesTotal + indirectCostTotal;
        const taxAmount: number = taxBase * (taxRate / 100);

        const finalTotal: number = grandTotal + taxAmount;

        return {
            totalMaterialsDirect,
            totalLaborDirect,
            totalSubcontractsDirect,
            directCostTotal,
            indirectCostTotal,
            operationalExpensesTotal,
            grandTotal,
            taxAmount,
            finalTotal
        };
    }, [activities, indirectCosts, operationalExpenses, taxRate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!budget) return;
        setIsSubmitting(true);
        const selectedProspect = prospects.find(p => p.id === parseInt(prospectId, 10));
        if (!selectedProspect) {
            alert('Por favor, seleccione un prospecto.');
            setIsSubmitting(false);
            return;
        }
        const activitiesToSubmit = activities.map(act => {
            const { subActivities, ...restOfActivity } = act;
            const cleanedSubActivities = subActivities.map(sub => {
                const { type, ...restOfSub } = sub;
                return restOfSub;
            });
            return { ...restOfActivity, subActivities: cleanedSubActivities };
        });

        // Validate: warn if activities have empty descriptions
        const activitiesWithEmptyDesc = activitiesToSubmit.filter(act => !act.description || act.description.trim() === '');
        if (activitiesWithEmptyDesc.length > 0) {
            const names = activitiesWithEmptyDesc.map(a => `Capítulo ${a.itemNumber}`).join(', ');
            showToast(`Atención: Los siguientes capítulos no tienen descripción y se guardarán como "Sin descripción": ${names}`, 'error');
        }

        onSubmit({
            ...budget,
            prospectId: selectedProspect.id,
            prospectName: selectedProspect.company,
            description,
            activities: activitiesToSubmit,
            indirectCosts,
            operationalExpenses,
            directCostTotal: calculations.directCostTotal,
            indirectCostTotal: calculations.indirectCostTotal,
            total: calculations.grandTotal,
            countryCode,
            currency,
            taxRate,
            finalTotal: calculations.finalTotal,
            isRecurring,
        });
        showToast('Presupuesto actualizado exitosamente.', 'success');
        onClose();
        setIsSubmitting(false);
    };

    const formatCurrencyValue = (value: number) => {
        return formatNumber(value, 2, 2);
    };

    const formatCurrencyFn = (value: number) => {
        const symbol = currency === 'CRC' ? '¢' : '$';
        return `${symbol}${formatCurrencyValue(value)}`;
    };

    const selectedProspectName = prospects.find(p => p.id === Number(prospectId))?.company || 'Sin seleccionar';

    if (!isOpen || !budget) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog">
            <div className={`bg-white shadow-2xl transform transition-all h-[95vh] flex flex-col ${isFullscreenBreakdown ? 'w-full max-w-full m-0 rounded-none h-screen' : 'w-full max-w-screen-2xl p-6 sm:p-8 rounded-xl'}`} onClick={e => e.stopPropagation()}>
                {!isFullscreenBreakdown && (
                    <div className="flex-shrink-0 flex justify-between items-center mb-4 border-b pb-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-dark-gray">Editar Presupuesto ({budget.consecutiveNumber})</h2>
                            <button
                                type="button"
                                onClick={() => setIsHeaderMinimized(!isHeaderMinimized)}
                                className="text-slate-400 hover:text-primary transition-colors p-1.5 rounded-lg bg-slate-100 flex items-center gap-2 text-xs font-bold"
                            >
                                <svg className={`w-5 h-5 transition-transform duration-300 ${isHeaderMinimized ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                                {isHeaderMinimized ? "Expandir" : "Minimizar"}
                            </button>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
                    {/* Header Fields Section */}
                    {!isFullscreenBreakdown && (
                        <div className={`flex-shrink-0 bg-slate-50 rounded-xl border border-slate-200 mb-4 transition-all duration-300 overflow-hidden ${isHeaderMinimized ? 'p-3' : 'p-5'}`}>
                            {isLocked && !isHeaderMinimized && (
                                <div className="mb-4 bg-amber-50 border-l-4 border-amber-500 p-3 text-amber-800 rounded-r-lg text-xs font-semibold">
                                    Presupuesto Bloqueado: Vinculado a una oferta aprobada. Los costos son solo lectura.
                                </div>
                            )}
                            {isHeaderMinimized ? (
                                <div className="flex justify-between items-center text-sm animate-fade-in">
                                    <div className="flex gap-6">
                                        <div><span className="font-bold text-slate-400 uppercase text-[10px] mr-2">Prospecto:</span> <span className="font-semibold text-slate-700">{selectedProspectName}</span></div>
                                        <div><span className="font-bold text-slate-400 uppercase text-[10px] mr-2">ID:</span> <span className="font-semibold text-slate-700">{budget.consecutiveNumber}</span></div>
                                        <div><span className="font-bold text-slate-400 uppercase text-[10px] mr-2">Moneda:</span> <span className="font-semibold text-slate-700">{currency}</span></div>
                                        <div className="hidden lg:block"><span className="font-bold text-slate-400 uppercase text-[10px] mr-2">Descripción:</span> <span className="text-slate-600 truncate max-w-xs inline-block align-bottom">{description || 'Sin descripción'}</span></div>
                                    </div>
                                    <div className="font-bold text-primary font-mono">{formatCurrencyFn(calculations.finalTotal)}</div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-fade-in">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vincular a Prospecto</label>
                                        <select value={prospectId} onChange={e => setProspectId(e.target.value)} disabled={isLocked} className="w-full p-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100 outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                                            {prospects.map(p => <option key={p.id} value={p.id}>{p.company}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2 lg:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descripción del Alcance</label>
                                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} disabled={isLocked} className="w-full p-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100 outline-none focus:ring-2 focus:ring-primary/20 bg-white" />
                                    </div>
                                    <div className="lg:col-span-1">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">País</label>
                                        <select value={countryCode} onChange={e => setCountryCode(e.target.value)} disabled={isLocked} className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 outline-none text-sm">
                                            {VAT_RATES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="lg:col-span-1">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Moneda</label>
                                        <select value={currency} onChange={e => setCurrency(e.target.value as 'CRC' | 'USD')} disabled={isLocked} className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 outline-none text-sm">
                                            <option value="CRC">Colones (CRC)</option>
                                            <option value="USD">Dólares (USD)</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end pb-1.5 md:col-span-4 lg:col-span-6">
                                        <label className="flex items-center cursor-pointer group bg-white px-3 py-1.5 border border-slate-300 rounded-lg shadow-sm hover:border-primary transition-colors">
                                            <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                            <span className="ml-3 text-xs font-semibold text-slate-700 group-hover:text-primary transition-colors uppercase">Presupuesto Recurrente</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Toolbar Section */}
                    <div className={`flex-shrink-0 flex wrap justify-between items-center gap-4 mb-4 bg-white p-3 border rounded-xl shadow-sm ${isFullscreenBreakdown ? 'mx-4 mt-4' : ''}`}>
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-bold text-slate-800 border-r pr-4 hidden md:block">Desglose de Costo Directo</h3>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Filtrar por nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 p-2 text-sm border rounded-lg w-48 focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                            {!isLocked && (
                                <div className="flex items-center gap-2 border-l pl-4">
                                    <select
                                        value={selectedPredetActivityId}
                                        onChange={e => setSelectedPredetActivityId(e.target.value)}
                                        className="p-2 text-xs border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none w-48"
                                    >
                                        <option value="">Actividad Predeterminada...</option>
                                        {predeterminedActivities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                    <input
                                        type="number"
                                        value={predetActivityQty}
                                        onChange={e => setPredetActivityQty(e.target.value)}
                                        placeholder="Cant."
                                        className="p-2 text-xs border rounded-lg w-16 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddPredetActivity}
                                        disabled={!selectedPredetActivityId}
                                        className="bg-secondary text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-orange-600 disabled:bg-slate-300 transition-colors"
                                    >
                                        Insertar
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {!isLocked && (
                                <button type="button" onClick={handleAddActivity} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                    Agregar Capítulo
                                </button>
                            )}
                            <div className="h-8 w-px bg-slate-200 mx-2" />
                            <button
                                type="button"
                                onClick={() => setIsFullscreenBreakdown(!isFullscreenBreakdown)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isFullscreenBreakdown ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {isFullscreenBreakdown ? (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9L4 4m0 0l5 5M4 4v5M4 4h5m11 11l5 5m0 0l-5-5m5 5v-5m0 5h-5" /></svg>
                                        Salir Pantalla Completa
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                        Pantalla Completa
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Direct Cost Pillars Summary */}
                    <div className={`flex-shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 ${isFullscreenBreakdown ? 'mx-4' : ''}`}>
                        <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded-r-xl shadow-sm">
                            <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest mb-1">Monto Total Materiales</p>
                            <p className="text-lg font-mono font-bold text-orange-700">{formatCurrencyFn(calculations.totalMaterialsDirect)}</p>
                        </div>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-xl shadow-sm">
                            <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">Monto Total Mano de Obra</p>
                            <p className="text-lg font-mono font-bold text-blue-700">{formatCurrencyFn(calculations.totalLaborDirect)}</p>
                        </div>
                        <div className="bg-cyan-50 border-l-4 border-cyan-500 p-3 rounded-r-xl shadow-sm">
                            <p className="text-[10px] font-black text-cyan-800 uppercase tracking-widest mb-1">Monto Total Sub Contratos</p>
                            <p className="text-lg font-mono font-bold text-cyan-700">{formatCurrencyFn(calculations.totalSubcontractsDirect)}</p>
                        </div>
                    </div>

                    {/* Information Note */}
                    <div className={`flex-shrink-0 mb-4 bg-blue-50 border-l-4 border-primary p-3 rounded-r-lg flex items-center gap-3 ${isFullscreenBreakdown ? 'mx-4' : ''}`}>
                        <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-[10px] font-black text-primary uppercase tracking-tighter">
                            Nota: Los precios unitarios de Material, Mano de Obra y Subcontratos deben incluir el impuesto de ventas (IVA).
                        </p>
                    </div>

                    {/* Table Section */}
                    <div className={`flex-grow overflow-y-auto mb-4 border border-slate-200 rounded-xl bg-white relative custom-scrollbar ${isFullscreenBreakdown ? 'mx-4' : ''}`}>
                        <table className="min-w-full text-sm border-collapse table-fixed">
                            <thead className="bg-slate-800 text-white sticky top-0 z-20">
                                <tr>
                                    <th rowSpan={2} className="p-3 text-left w-16 border-r border-slate-700">Item</th>
                                    <th rowSpan={2} className="p-3 text-left border-r border-slate-700 min-w-[250px]">Descripción / Insumo</th>
                                    <th rowSpan={2} className="p-3 text-center w-24 border-r border-slate-700">Cant..</th>
                                    <th rowSpan={2} className="p-3 text-center w-32 border-r border-slate-700">Unid.</th>
                                    <th colSpan={3} className="p-2 text-center bg-orange-600 border-r border-slate-700 border-b">Costo Unitario (IVA Inc.)</th>
                                    <th colSpan={5} className="p-2 text-center bg-cyan-600 border-b">Montos Totales</th>
                                    <th rowSpan={2} className="w-12"></th>
                                </tr>
                                <tr className="bg-slate-700 text-[10px] uppercase tracking-tighter">
                                    <th className="p-2 text-center border-r border-slate-600">Material</th>
                                    <th className="p-2 text-center border-r border-slate-600">M.O.</th>
                                    <th className="p-2 text-center border-r border-slate-600">SubCont.</th>
                                    <th className="p-2 text-center border-r border-slate-600">Material</th>
                                    <th className="p-2 text-center border-r border-slate-600">M.O.</th>
                                    <th className="p-2 text-center border-r border-slate-600">SubCont.</th>
                                    <th className="p-2 text-center border-r border-slate-600 bg-slate-600">Unitario</th>
                                    <th className="p-2 text-center bg-slate-600 font-bold">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activities.map((act) => {
                                    const activityTotal = (act.subActivities || []).reduce((sum, sub) => {
                                        const cost = (Number(sub.materialUnitCost) || 0) + (Number(sub.laborUnitCost) || 0) + (Number(sub.subcontractUnitCost) || 0);
                                        return sum + ((Number(sub.quantity) || 0) * cost);
                                    }, 0);

                                    const chapterUnitPrice = (Number(act.quantity) || 0) > 0 ? activityTotal / Number(act.quantity) : 0;

                                    const matchesSearch = searchTerm === '' ||
                                        (act.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (act.subActivities || []).some(sub => (sub.description || '').toLowerCase().includes(searchTerm.toLowerCase()));

                                    if (!matchesSearch) return null;

                                    return (
                                        <React.Fragment key={act.id}>
                                            <tr className="bg-slate-100 font-bold border-b border-slate-200 text-slate-800">
                                                <td className="p-3 text-center text-slate-500 border-r">{act.itemNumber}</td>
                                                <td className="p-1 border-r"><input type="text" value={act.description} onChange={e => handleActivityChange(act.id, 'description', e.target.value)} disabled={isLocked} className="w-full p-2 bg-transparent border-none outline-none disabled:text-slate-600 uppercase text-xs font-black" /></td>
                                                <td className="p-1 border-r"><input type="number" value={act.quantity} onChange={e => handleActivityChange(act.id, 'quantity', e.target.value)} disabled={isLocked} className="w-full p-2 bg-transparent text-center border-none outline-none text-xs" /></td>
                                                <td className="p-1 border-r">
                                                    <select
                                                        value={act.unit}
                                                        onChange={e => handleActivityChange(act.id, 'unit', e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full p-2 bg-transparent border-none outline-none text-xs text-center cursor-pointer appearance-none disabled:cursor-not-allowed"
                                                    >
                                                        {CHAPTER_UNIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                </td>
                                                <td colSpan={6} className="bg-slate-50/50 border-r"></td>
                                                <td className="p-3 text-right font-mono text-slate-900 bg-blue-50 border-r text-xs">{formatCurrencyFn(chapterUnitPrice)}</td>
                                                <td className="p-3 text-right font-mono text-slate-900 bg-slate-200/80 text-xs">{formatCurrencyFn(activityTotal)}</td>
                                                <td className="p-3 text-center">{!isLocked && <button type="button" onClick={() => handleRemoveActivity(act.id)} className="text-slate-400 hover:text-red-500 transition-colors">&times;</button>}</td>
                                            </tr>
                                            {(act.subActivities || []).map(sub => {
                                                if (searchTerm !== '' && !(sub.description || '').toLowerCase().includes(searchTerm.toLowerCase())) return null;
                                                const tMat = (Number(sub.quantity) || 0) * (Number(sub.materialUnitCost) || 0);
                                                const tLab = (Number(sub.quantity) || 0) * (Number(sub.laborUnitCost) || 0);
                                                const tSub = (Number(sub.quantity) || 0) * (Number(sub.subcontractUnitCost) || 0);
                                                const itemUnitCost = (Number(sub.materialUnitCost) || 0) + (Number(sub.laborUnitCost) || 0) + (Number(sub.subcontractUnitCost) || 0);

                                                return (
                                                    <tr key={sub.id} className="text-[11px] hover:bg-slate-50 border-b border-slate-100 group">
                                                        <td className="p-2 text-center text-slate-400 border-r">{sub.itemNumber}</td>
                                                        <td className="p-1 border-r">
                                                            <div className="flex gap-1 items-center">
                                                                {!isLocked && (
                                                                    <select value={sub.type} onChange={e => handleSubActivityChange(act.id, sub.id, 'type', e.target.value)} className="bg-slate-100 px-1 border-none rounded text-[9px] font-bold text-slate-500">
                                                                        <option value="material">MAT</option><option value="labor">M.O.</option><option value="subcontract">SBC</option>
                                                                    </select>
                                                                )}
                                                                <input type="text" list={`item-catalog-edit-${sub.type}`} value={sub.description} onChange={e => handleSubActivityChange(act.id, sub.id, 'description', e.target.value)} disabled={isLocked} className="flex-grow p-1.5 outline-none bg-transparent" />
                                                            </div>
                                                        </td>
                                                        <td className="p-1 border-r"><input type="number" value={sub.quantity} onChange={e => handleSubActivityChange(act.id, sub.id, 'quantity', e.target.value)} disabled={isLocked} className="w-full p-1.5 text-center outline-none bg-transparent" /></td>
                                                        <td className="p-1 border-r bg-slate-50/30 text-slate-500 text-center font-semibold">{sub.unit}</td>
                                                        <td className="p-1 border-r bg-orange-50/10"><input type="number" value={sub.materialUnitCost} onChange={e => handleSubActivityChange(act.id, sub.id, 'materialUnitCost', e.target.value)} disabled={isLocked} className="w-full p-1.5 text-right outline-none bg-transparent font-mono" /></td>
                                                        <td className="p-1 border-r bg-orange-50/10"><input type="number" value={sub.laborUnitCost} onChange={e => handleSubActivityChange(act.id, sub.id, 'laborUnitCost', e.target.value)} disabled={isLocked} className="w-full p-1.5 text-right outline-none bg-transparent font-mono" /></td>
                                                        <td className="p-1 border-r bg-orange-50/10"><input type="number" value={sub.subcontractUnitCost} onChange={e => handleSubActivityChange(act.id, sub.id, 'subcontractUnitCost', e.target.value)} disabled={isLocked} className="w-full p-1.5 text-right outline-none bg-transparent font-mono" /></td>
                                                        <td className="p-2 text-right font-mono text-[10px] text-slate-500 border-r bg-cyan-50/10">{formatCurrencyValue(tMat)}</td>
                                                        <td className="p-2 text-right font-mono text-[10px] text-slate-500 border-r bg-cyan-50/10">{formatCurrencyValue(tLab)}</td>
                                                        <td className="p-2 text-right font-mono text-[10px] text-slate-500 border-r bg-cyan-50/10">{formatCurrencyValue(tSub)}</td>
                                                        <td className="p-2 text-right font-mono text-[10px] text-slate-700 border-r bg-cyan-100/10">{formatCurrencyValue(itemUnitCost)}</td>
                                                        <td className="p-2 text-right font-mono font-bold text-slate-700 bg-cyan-100/20">{formatCurrencyValue(tMat + tLab + tSub)}</td>
                                                        <td className="p-2 text-center">{!isLocked && <button type="button" onClick={() => handleRemoveSubActivity(act.id, sub.id)} className="text-red-400 opacity-0 group-hover:opacity-100">&times;</button>}</td>
                                                    </tr>
                                                );
                                            })}
                                            {!isLocked && (
                                                <tr className="bg-slate-50/30"><td colSpan={13} className="p-2 pl-12 border-b"><button type="button" onClick={() => handleAddSubActivity(act.id)} className="text-[10px] font-black text-primary flex items-center gap-1 uppercase tracking-tighter tracking-widest">+ Añadir Insumo</button></td></tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <datalist id="item-catalog-edit-material">{materials.map(item => <option key={item.id} value={item.name} />)}</datalist>
                    <datalist id="item-catalog-edit-labor">{laborItems.map(item => <option key={item.id} value={item.name} />)}</datalist>
                    <datalist id="item-catalog-edit-subcontract">{serviceItems.map(item => <option key={item.id} value={item.name} />)}</datalist>

                    {/* Summary Footer Section */}
                    {(!isFullscreenBreakdown || !isFooterMinimized) && (
                        <div className={`flex-shrink-0 bg-slate-900 text-white p-4 sm:p-6 rounded-2xl border-t-4 border-primary shadow-2xl animate-slide-up relative transition-all duration-300 ${isFullscreenBreakdown ? 'mx-4 mb-4' : ''}`}>
                            {/* Toggle Button */}
                            <button
                                type="button"
                                onClick={() => setIsFooterMinimized(!isFooterMinimized)}
                                className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white p-1 rounded-full shadow-lg hover:bg-primary-dark transition-colors"
                                title={isFooterMinimized ? "Expandir resumen" : "Minimizar resumen"}
                            >
                                <svg className={`w-6 h-6 transition-transform duration-300 ${isFooterMinimized ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" />
                                </svg>
                            </button>

                            {isFooterMinimized ? (
                                <div className="flex justify-between items-center animate-fade-in">
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Monto Total Final</span>
                                            <span className="text-xl font-mono font-black text-secondary">{formatCurrencyFn(calculations.finalTotal)}</span>
                                        </div>
                                        {/* Critical visibility for Operational Expenses and Indirect Costs when minimized */}
                                        <div className="hidden sm:block border-l border-slate-700 pl-4">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">G. Operativos</span>
                                            <span className="text-xs font-mono font-bold text-slate-100">{formatCurrencyFn(calculations.operationalExpensesTotal)}</span>
                                        </div>
                                        <div className="hidden sm:block border-l border-slate-700 pl-4">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">C. Indirectos</span>
                                            <span className="text-xs font-mono font-bold text-slate-100">{formatCurrencyFn(calculations.indirectCostTotal)}</span>
                                        </div>
                                        <div className="hidden md:block border-l border-slate-700 pl-4">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Impuestos</span>
                                            <span className="text-sm font-mono text-slate-300">{formatCurrencyFn(calculations.taxAmount)}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-bold transition-all uppercase text-[10px] tracking-widest">Cerrar</button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-6 py-2 bg-primary hover:bg-primary-dark rounded-xl font-bold transition-all shadow-lg shadow-primary/20 uppercase text-[10px] tracking-widest disabled:bg-slate-700"
                                        >
                                            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fade-in">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <button type="button" onClick={() => setIsOperationalExpensesModalOpen(true)} className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-xl hover:border-primary hover:bg-slate-700 transition-all group">
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Gastos Operativos</p>
                                                    <p className="text-sm font-bold text-slate-100">{formatCurrencyFn(calculations.operationalExpensesTotal)}</p>
                                                </div>
                                                <svg className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button type="button" onClick={() => setIsIndirectCostsModalOpen(true)} className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-xl hover:border-primary hover:bg-slate-700 transition-all group">
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Costos Indirectos</p>
                                                    <p className="text-sm font-bold text-slate-100">{formatCurrencyFn(calculations.indirectCostTotal)}</p>
                                                </div>
                                                <svg className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                        </div>
                                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center shadow-inner">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subtotal Neto</span>
                                            <span className="text-xl font-mono font-bold text-slate-100">{formatCurrencyFn(calculations.grandTotal)}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between items-center text-slate-400 text-xs px-2">
                                            <span className="uppercase tracking-widest">Impuestos ({taxRate}%) - Sobre M.O. + G.Op + C.Ind</span>
                                            <span className="font-mono text-sm">{formatCurrencyFn(calculations.taxAmount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-primary/10 p-4 rounded-xl border border-primary/20">
                                            <span className="text-sm font-black uppercase tracking-widest text-blue-300">Total Final</span>
                                            <span className="text-4xl font-mono font-black text-secondary">{formatCurrencyFn(calculations.finalTotal)}</span>
                                        </div>
                                        <div className="flex gap-4 mt-2">
                                            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl font-bold transition-all uppercase text-xs">Cerrar</button>
                                            <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 bg-primary hover:bg-primary-dark rounded-xl font-bold transition-all shadow-lg shadow-primary/20 uppercase text-xs disabled:bg-slate-700">Guardar Cambios</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </form>
            </div>
            <OperationalExpensesModal isOpen={isOperationalExpensesModalOpen} onClose={() => setIsOperationalExpensesModalOpen(false)} onSubmit={handleUpdateOperationalExpenses} initialExpenses={operationalExpenses} currency={currency} isLocked={false} />
            <IndirectCostsModal isOpen={isIndirectCostsModalOpen} onClose={() => setIsIndirectCostsModalOpen(false)} onSubmit={handleUpdateIndirectCosts} initialCosts={indirectCosts} baseCost={calculations.directCostTotal + calculations.operationalExpensesTotal} currency={currency} isLocked={false} />

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
                @keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};
