import React, { useState, useEffect, useMemo } from 'react';
import { IndirectCosts } from '../../types';

interface IndirectCostsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedCosts: IndirectCosts) => void;
    initialCosts: IndirectCosts;
    baseCost: number; // Direct Cost + Operational Expenses
    currency: 'CRC' | 'USD';
    isLocked: boolean;
}

const COST_ITEMS: { key: keyof IndirectCosts; label: string }[] = [
    { key: 'utility', label: 'Utilidad' },
    { key: 'unexpected', label: 'Imprevistos' },
    { key: 'administration', label: 'Administración del Contratista' },
    { key: 'permit', label: 'Permiso de Construcción' },
    { key: 'professionalFees', label: 'Honorarios Profesionales' },
    { key: 'rtPolicy', label: 'Póliza RT' },
    { key: 'cfa', label: 'Tasado CFIA' },
    { key: 'pettyCash', label: 'Caja Chica' },
];

export const IndirectCostsModal: React.FC<IndirectCostsModalProps> = ({ isOpen, onClose, onSubmit, initialCosts, baseCost, currency, isLocked }) => {
    const [costs, setCosts] = useState<IndirectCosts>(initialCosts);

    useEffect(() => {
        if (isOpen) {
            setCosts(initialCosts);
        }
    }, [isOpen, initialCosts]);

    const formatCurrencyFn = (value: number) => {
        const symbol = currency === 'CRC' ? '¢' : '$';
        return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}`;
    };
    
    const handleCostChange = (key: keyof IndirectCosts, value: string) => {
        setCosts(prev => ({ ...prev, [key]: Number(value) || 0 }));
    };

    const { totalPercentage, totalAmount } = useMemo(() => {
        const totalPercentage = Object.values(costs).reduce<number>((sum, val: any) => sum + (Number(val) || 0), 0);
        const totalAmount = baseCost * (totalPercentage / 100);
        return { totalPercentage, totalAmount };
    }, [costs, baseCost]);

    const handleSave = () => {
        onSubmit(costs);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-dark-gray">Configuración de Costos Indirectos</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                 {isLocked && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                        <p className="font-bold">Presupuesto Bloqueado</p>
                        <p className="text-sm">Los costos indirectos no pueden ser modificados porque el presupuesto está vinculado a una oferta aprobada.</p>
                    </div>
                )}
                <div className="space-y-3">
                    {COST_ITEMS.map(({ key, label }) => (
                        <div key={key} className="grid grid-cols-3 items-center gap-4">
                            <label htmlFor={`cost-${key}`} className="text-sm font-medium text-slate-700 col-span-2">{label}</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    id={`cost-${key}`}
                                    value={costs[key]}
                                    onChange={e => handleCostChange(key, e.target.value)}
                                    step="0.01"
                                    className="w-full p-1 border rounded-md text-right pr-6"
                                    disabled={isLocked}
                                />
                                <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500">%</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-4 border-t space-y-2">
                    <div className="flex justify-between font-semibold">
                        <span>Base de Cálculo (C. Directo + G.A.O.):</span>
                        <span>{formatCurrencyFn(baseCost)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                        <span>Porcentaje Total de Costos Indirectos:</span>
                        <span>{totalPercentage.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-primary">
                        <span>Monto Total de Costos Indirectos:</span>
                        <span>{formatCurrencyFn(totalAmount)}</span>
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
                    <button onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg">Cerrar</button>
                    {!isLocked && (
                        <button onClick={handleSave} className="bg-primary text-white font-bold py-2 px-6 rounded-lg">Guardar y Aplicar</button>
                    )}
                </div>
            </div>
        </div>
    );
};