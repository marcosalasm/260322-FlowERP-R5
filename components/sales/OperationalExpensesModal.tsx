import React, { useState, useEffect, useMemo } from 'react';
import { OperationalExpenseItem } from '../../types';

interface OperationalExpensesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedExpenses: OperationalExpenseItem[]) => void;
    initialExpenses: OperationalExpenseItem[];
    currency: 'CRC' | 'USD';
    isLocked: boolean;
}

const getNextId = (items: {id: number}[]) => (items.length > 0 ? Math.max(...items.map(i => i.id)) : 0) + 1;

export const OperationalExpensesModal: React.FC<OperationalExpensesModalProps> = ({ isOpen, onClose, onSubmit, initialExpenses, currency, isLocked }) => {
    const [expenses, setExpenses] = useState<OperationalExpenseItem[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Deep copy to avoid mutating parent state directly
            setExpenses(JSON.parse(JSON.stringify(initialExpenses)));
        }
    }, [isOpen, initialExpenses]);

    const formatCurrencyFn = (value: number) => {
        const symbol = currency === 'CRC' ? '¢' : '$';
        return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}`;
    };

    const handleItemChange = (id: number, field: keyof OperationalExpenseItem, value: string) => {
        setExpenses(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleAddItem = () => {
        setExpenses(prev => [...prev, { id: getNextId(prev), description: '', quantity: 1, unit: '', unitCost: 0 }]);
    };
    
    const handleRemoveItem = (id: number) => {
        if (expenses.length > 1) {
            setExpenses(prev => prev.filter(item => item.id !== id));
        }
    };

    const totalExpenses = useMemo(() => {
        return expenses.reduce((total, item) => {
            return total + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
        }, 0);
    }, [expenses]);
    
    const handleSave = () => {
        onSubmit(expenses);
        onClose();
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-dark-gray">Gastos de Administración Operativa</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                 {isLocked && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                        <p className="font-bold">Presupuesto Bloqueado</p>
                        <p className="text-sm">Los gastos operativos no pueden ser modificados porque el presupuesto está vinculado a una oferta aprobada.</p>
                    </div>
                )}
                
                <div className="flex-grow overflow-y-auto -mr-3 pr-3 border-t pt-4">
                     <table className="min-w-full text-sm">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-2 text-left font-medium text-slate-600 w-2/5">Descripción</th>
                                <th className="p-2 text-left font-medium text-slate-600">Cantidad</th>
                                <th className="p-2 text-left font-medium text-slate-600">Unidad</th>
                                <th className="p-2 text-right font-medium text-slate-600">Costo Unitario</th>
                                <th className="p-2 text-right font-medium text-slate-600">Costo Total</th>
                                <th className="p-2"></th>
                            </tr>
                        </thead>
                         <tbody>
                            {expenses.map(item => (
                                <tr key={item.id}>
                                    <td className="p-1"><input type="text" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="w-full p-1 border rounded" disabled={isLocked} /></td>
                                    <td className="p-1"><input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} className="w-24 p-1 border rounded" disabled={isLocked} /></td>
                                    <td className="p-1"><input type="text" value={item.unit} onChange={e => handleItemChange(item.id, 'unit', e.target.value)} className="w-24 p-1 border rounded" disabled={isLocked} /></td>
                                    <td className="p-1"><input type="number" step="any" value={item.unitCost} onChange={e => handleItemChange(item.id, 'unitCost', e.target.value)} className="w-32 p-1 border rounded text-right" disabled={isLocked} /></td>
                                    <td className="p-1 text-right font-mono bg-slate-100 rounded">{formatCurrencyFn((Number(item.quantity) || 0) * (Number(item.unitCost) || 0))}</td>
                                    <td className="p-1 text-center"><button onClick={() => handleRemoveItem(item.id)} disabled={expenses.length <= 1 || isLocked} className="text-red-500 disabled:text-slate-300 p-1">&times;</button></td>
                                </tr>
                            ))}
                         </tbody>
                    </table>
                    {!isLocked && (
                        <button onClick={handleAddItem} className="text-xs font-semibold text-primary hover:underline mt-2">+ Agregar Gasto</button>
                    )}
                </div>
                
                <div className="flex-shrink-0 pt-4 mt-4 border-t flex justify-between items-center">
                    <div>
                        <span className="text-lg font-bold text-dark-gray">Total Gastos Operativos:</span>
                        <span className="text-2xl font-bold text-secondary font-mono ml-2">{formatCurrencyFn(totalExpenses)}</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300">Cerrar</button>
                        {!isLocked && (
                            <button onClick={handleSave} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark">Guardar Cambios</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};