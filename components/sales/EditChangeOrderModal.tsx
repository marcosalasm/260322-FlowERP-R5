import React, { useState, useEffect, useMemo } from 'react';
import { ChangeOrder, ChangeOrderStatus, Budget, BudgetStatus, IndirectCosts } from '../../types';

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
);

interface EditChangeOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedChangeOrder: ChangeOrder) => void;
    changeOrder: ChangeOrder | null;
    budgets: Budget[];
}

export const EditChangeOrderModal: React.FC<EditChangeOrderModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    changeOrder,
    budgets,
}) => {
    const [entryMode, setEntryMode] = useState<'link' | 'manual'>('link');
    const [description, setDescription] = useState('');
    const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
    const [manualAmountImpact, setManualAmountImpact] = useState<number | string>('');
    const [manualBudgetImpact, setManualBudgetImpact] = useState<number | string>('');
    const [changeType, setChangeType] = useState<'Adicional' | 'Crédito'>('Adicional');
    const [status, setStatus] = useState<ChangeOrderStatus>(ChangeOrderStatus.PendingApproval);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const availableBudgets = useMemo(() => {
        return budgets.filter(b => b.status === BudgetStatus.Finalized || b.id === changeOrder?.budgetId);
    }, [budgets, changeOrder]);

    const selectedBudget = useMemo(() => {
        if (entryMode === 'link') {
            return budgets.find(b => b.id === parseInt(selectedBudgetId, 10));
        }
        return null;
    }, [budgets, selectedBudgetId, entryMode]);

    const calculatedCosts = useMemo(() => {
        if (!selectedBudget) return { utility: 0, administration: 0, unexpected: 0, totalDeduction: 0 };
        const directCost = selectedBudget.directCostTotal;
        const costs: IndirectCosts = selectedBudget.indirectCosts;
        const utility = directCost * (costs.utility / 100);
        const administration = directCost * (costs.administration / 100);
        const unexpected = directCost * (costs.unexpected / 100);
        return {
            utility,
            administration,
            unexpected,
            totalDeduction: utility + administration + unexpected
        };
    }, [selectedBudget]);

    useEffect(() => {
        if (changeOrder) {
            setDescription(changeOrder.description);
            setStatus(changeOrder.status);
            setChangeType(changeOrder.changeType);
            if (changeOrder.budgetId) {
                setEntryMode('link');
                setSelectedBudgetId(String(changeOrder.budgetId));
                setManualAmountImpact('');
                setManualBudgetImpact('');
            } else {
                setEntryMode('manual');
                setSelectedBudgetId('');
                setManualAmountImpact(changeOrder.amountImpact);
                setManualBudgetImpact(changeOrder.budgetImpact);
            }
        }
    }, [changeOrder]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!changeOrder) return;
        setIsSubmitting(true);

        let impactData;
        if (entryMode === 'link') {
            if (!selectedBudget) {
                alert('Por favor, seleccione un presupuesto válido.');
                setIsSubmitting(false);
                return;
            }
            impactData = {
                changeType: changeType,
                amountImpact: selectedBudget.finalTotal,
                budgetImpact: selectedBudget.finalTotal - calculatedCosts.totalDeduction,
                budgetId: selectedBudget.id,
            };
        } else {
            if (manualAmountImpact === '' || manualBudgetImpact === '') {
                alert('Los montos de impacto no pueden estar vacíos.');
                setIsSubmitting(false);
                return;
            }
            impactData = {
                changeType: changeType,
                amountImpact: Math.abs(Number(manualAmountImpact)),
                budgetImpact: Math.abs(Number(manualBudgetImpact)),
                budgetId: undefined,
            };
        }

        const updatedChangeOrder: ChangeOrder = {
            ...changeOrder,
            ...impactData,
            description,
            status,
        };

        onSubmit(updatedChangeOrder);
        setIsSubmitting(false);
    };

    if (!isOpen || !changeOrder) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-start p-6 sm:p-8 border-b flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-dark-gray">Editar Orden de Cambio</h2>
                        <p className="text-sm font-semibold text-medium-gray">{changeOrder.consecutive}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
                    <div className="flex-grow overflow-y-auto p-6 sm:p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Proyecto Vinculado</label>
                                <input type="text" value={changeOrder.projectName} readOnly className="w-full p-2 border border-slate-200 bg-slate-100 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Creación</label>
                                <input type="text" value={changeOrder.creationDate} readOnly className="w-full p-2 border border-slate-200 bg-slate-100 rounded-md" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="edit-co-description" className="block text-sm font-medium text-slate-700 mb-1">Descripción del Cambio</label>
                            <textarea id="edit-co-description" rows={3} value={description} onChange={e => setDescription(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Cambio</label>
                            <div className="flex gap-4">
                                <label className="flex items-center p-2 border rounded-md cursor-pointer w-full">
                                    <input type="radio" name="editChangeType" value="Adicional" checked={changeType === 'Adicional'} onChange={() => setChangeType('Adicional')} className="h-4 w-4 text-primary focus:ring-primary" />
                                    <span className="ml-2 text-sm font-medium text-slate-700">Adicional (Aumenta el valor)</span>
                                </label>
                                <label className="flex items-center p-2 border rounded-md cursor-pointer w-full">
                                    <input type="radio" name="editChangeType" value="Crédito" checked={changeType === 'Crédito'} onChange={() => setChangeType('Crédito')} className="h-4 w-4 text-primary focus:ring-primary" />
                                    <span className="ml-2 text-sm font-medium text-slate-700">Crédito (Disminuye el valor)</span>
                                </label>
                            </div>
                        </div>
                        <div className="border-t pt-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Definir Impacto Financiero</label>
                            <div className="flex gap-4 rounded-lg bg-slate-100 p-1">
                                <button type="button" onClick={() => setEntryMode('link')} className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-all ${entryMode === 'link' ? 'bg-white shadow text-primary' : 'text-slate-600'}`}>Vincular Presupuesto</button>
                                <button type="button" onClick={() => setEntryMode('manual')} className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-all ${entryMode === 'manual' ? 'bg-white shadow text-primary' : 'text-slate-600'}`}>Ingreso Manual</button>
                            </div>
                        </div>

                        {entryMode === 'link' ? (
                            <div className="space-y-4 animate-fade-in">
                                <select value={selectedBudgetId} onChange={e => setSelectedBudgetId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md" disabled={availableBudgets.length === 0}>
                                    {availableBudgets.length > 0 ? availableBudgets.map(b => <option key={b.id} value={b.id}>{b.consecutiveNumber} - {b.prospectName}</option>) : <option disabled>No hay presupuestos disponibles</option>}
                                </select>
                                {selectedBudget && (
                                    <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                                        {selectedBudget.description && (
                                            <div>
                                                <p className="block text-sm font-medium text-slate-700">Descripción del Presupuesto Vinculado</p>
                                                <p className="mt-1 text-sm text-slate-600 p-2 border border-slate-200 bg-slate-100 rounded-md">{Number(selectedBudget.description).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}</p>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="block text-sm font-medium text-slate-700 mb-1">Impacto en Monto</p>
                                                <p className="w-full p-2 border border-slate-200 rounded-md bg-slate-100 font-semibold">¢{selectedBudget.finalTotal.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1 mb-1">
                                                    <p className="block text-sm font-medium text-slate-700">Impacto en Presupuesto</p>
                                                    <div className="relative group">
                                                        <InfoIcon />
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Calculado restando Utilidad, Admin. e Imprevistos del Monto Total del presupuesto vinculado.</div>
                                                    </div>
                                                </div>
                                                <p className="w-full p-2 border border-slate-200 rounded-md bg-slate-100 font-semibold">¢{(selectedBudget.finalTotal - calculatedCosts.totalDeduction).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                <div>
                                    <label htmlFor="edit-manual-amount-impact" className="block text-sm font-medium text-slate-700 mb-1">Impacto en Monto (¢)</label>
                                    <input type="number" id="edit-manual-amount-impact" value={manualAmountImpact} onChange={e => setManualAmountImpact(e.target.value)} required placeholder="Ej: 5000" min="0" className="w-full p-2 border border-slate-300 rounded-md" />
                                </div>
                                <div>
                                    <label htmlFor="edit-manual-budget-impact" className="block text-sm font-medium text-slate-700 mb-1">Impacto en Presupuesto (¢)</label>
                                    <input type="number" id="edit-manual-budget-impact" value={manualBudgetImpact} onChange={e => setManualBudgetImpact(e.target.value)} required placeholder="Ej: 3000" min="0" className="w-full p-2 border border-slate-300 rounded-md" />
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="edit-co-status" className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                                <select id="edit-co-status" value={status} onChange={e => setStatus(e.target.value as ChangeOrderStatus)} className="w-full p-2 border border-slate-300 rounded-md">
                                    {Object.values(ChangeOrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Aprobación</label>
                                <input type="text" value={changeOrder.approvalDate || 'N/A'} readOnly className="w-full p-2 border border-slate-200 bg-slate-100 rounded-md" />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t flex justify-end gap-4 bg-slate-50 flex-shrink-0">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark disabled:bg-slate-400 shadow-lg">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
};