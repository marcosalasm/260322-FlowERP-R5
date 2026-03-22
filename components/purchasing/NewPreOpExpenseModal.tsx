
import React, { useState, useEffect, useMemo } from 'react';
import { Prospect, PreOpRubro, PreOpExpense, Budget } from '../../types';

interface NewPreOpExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<PreOpExpense, 'id' | 'status'>) => void;
    prospects: Prospect[];
    rubros: PreOpRubro[];
    budgets: Budget[];
}

export const NewPreOpExpenseModal: React.FC<NewPreOpExpenseModalProps> = ({ isOpen, onClose, onSubmit, prospects, rubros, budgets }) => {
    const [linkType, setLinkType] = useState<'prospect' | 'budget'>('prospect');
    const [prospectId, setProspectId] = useState<string>('');
    const [budgetId, setBudgetId] = useState<string>('');
    const [amounts, setAmounts] = useState<{ [rubroId: number]: string }>({});
    const [descripcion, setDescripcion] = useState<string>('');
    const [montoGeneral, setMontoGeneral] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            setLinkType('prospect');
            setProspectId('');
            setBudgetId('');
            setAmounts({});
            setDescripcion('');
            setMontoGeneral('');
        }
    }, [isOpen]);

    // Fix: Added explicit return type to reduce to avoid 'unknown' inference for the accumulator
    const totalGasto = useMemo(() => {
        const rubrosTotal = Object.values(amounts).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
        return rubrosTotal + (Number(montoGeneral) || 0);
    }, [amounts, montoGeneral]);

    const handleAmountChange = (rubroId: number, value: string) => {
        setAmounts(prev => ({ ...prev, [rubroId]: value }));
    };

    const handleSave = () => {
        let selectedProspectId: number | undefined = undefined;
        let selectedProspectName: string | undefined = undefined;
        let selectedBudgetId: number | undefined = undefined;
        let selectedBudgetName: string | undefined = undefined;

        if (linkType === 'prospect') {
            const selectedProspect = prospects.find(p => p.id === Number(prospectId));
            if (!selectedProspect) {
                alert('Debe seleccionar un prospecto vinculado.');
                return;
            }
            selectedProspectId = selectedProspect.id;
            selectedProspectName = selectedProspect.company;
        } else {
            const selectedBudget = budgets.find(b => b.id === Number(budgetId));
            if (!selectedBudget) {
                alert('Debe seleccionar un presupuesto vinculado.');
                return;
            }
            selectedBudgetId = selectedBudget.id;
            selectedBudgetName = selectedBudget.clientName + ' - ' + selectedBudget.projectName;
        }

        const cleanAmounts: { [rubroId: number]: number } = {};
        Object.entries(amounts).forEach(([id, val]) => {
            if (val && Number(val) > 0) cleanAmounts[Number(id)] = Number(val);
        });

        if (Object.keys(cleanAmounts).length === 0 && (!montoGeneral || Number(montoGeneral) <= 0)) {
            alert('Debe ingresar al menos un monto (general o en los rubros).');
            return;
        }

        if (!descripcion.trim()) {
            alert('Debe ingresar una descripción para el gasto.');
            return;
        }

        onSubmit({
            prospectId: selectedProspectId,
            prospectName: selectedProspectName,
            budgetId: selectedBudgetId,
            budgetName: selectedBudgetName,
            fecha: new Date().toISOString().split('T')[0],
            totalGasto,
            desglose: cleanAmounts,
            descripcion: descripcion.trim()
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4">
            <style>
                {`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                `}
            </style>
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg min-h-[500px] h-full max-h-[90vh] flex flex-col transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6 shrink-0">
                    <h2 className="text-2xl font-bold text-slate-800">Registrar Gasto</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="space-y-6 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                            <input
                                type="radio"
                                name="linkType"
                                value="prospect"
                                checked={linkType === 'prospect'}
                                onChange={() => setLinkType('prospect')}
                                className="text-primary focus:ring-primary h-4 w-4"
                            />
                            Vincular a Prospecto
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                            <input
                                type="radio"
                                name="linkType"
                                value="budget"
                                checked={linkType === 'budget'}
                                onChange={() => setLinkType('budget')}
                                className="text-primary focus:ring-primary h-4 w-4"
                            />
                            Vincular a Presupuesto
                        </label>
                    </div>

                    {linkType === 'prospect' ? (
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Prospecto Vinculado (Obligatorio)*</label>
                            <select
                                value={prospectId}
                                onChange={e => setProspectId(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                                <option value="">Seleccione un prospecto...</option>
                                {prospects.map(p => (
                                    <option key={p.id} value={p.id}>{p.company} ({p.name})</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Presupuesto Vinculado (Obligatorio)*</label>
                            <select
                                value={budgetId}
                                onChange={e => setBudgetId(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                                <option value="">Seleccione un presupuesto...</option>
                                {budgets.map(b => (
                                    <option key={b.id} value={b.id}>{b.code} - {b.projectName} ({b.clientName})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-4 pt-4 border-t">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Descripción del Gasto *</label>
                            <input
                                type="text"
                                value={descripcion}
                                onChange={e => setDescripcion(e.target.value)}
                                placeholder="Ej. Compra de suministros..."
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monto General</label>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 font-mono text-sm">¢</span>
                                <input
                                    type="number"
                                    value={montoGeneral}
                                    onChange={e => setMontoGeneral(e.target.value)}
                                    placeholder="0"
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Desglose del Gasto</h3>
                        <div className="space-y-3">
                            {rubros.map(rubro => (
                                <div key={rubro.id} className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                                    <span className="flex-grow text-xs font-bold text-slate-700 uppercase tracking-tight">{rubro.nombre}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 font-mono text-sm">¢</span>
                                        <input
                                            type="number"
                                            value={amounts[rubro.id] || ''}
                                            onChange={e => handleAmountChange(rubro.id, e.target.value)}
                                            placeholder="0"
                                            className="w-32 p-1.5 border border-slate-200 rounded-lg text-right text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                </div>
                            ))}
                            {rubros.length === 0 && <p className="text-center text-slate-400 text-xs py-4">No hay rubros configurados en el sistema.</p>}
                        </div>
                    </div>
                </div>

                <div className="border-t pt-4 mt-6 shrink-0 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monto Total del Gasto:</span>
                        <span className="text-2xl font-mono font-black text-primary">¢ {totalGasto.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="bg-slate-100 text-slate-600 font-bold py-2.5 px-6 rounded-xl hover:bg-slate-200 transition-colors text-sm">Cancelar</button>
                        <button
                            onClick={handleSave}
                            className="bg-slate-400 text-white font-bold py-2.5 px-8 rounded-xl hover:bg-slate-500 transition-all text-sm shadow-lg shadow-slate-100"
                        >
                            Guardar Registro
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
