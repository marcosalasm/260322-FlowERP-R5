
import React from 'react';
import { PreOpExpense, PreOpRubro } from '../../types';

interface PreOpExpensesListProps {
    expenses: PreOpExpense[];
    rubros: PreOpRubro[];
    onEdit?: (expense: PreOpExpense) => void;
}

const formatCurrency = (value: number) => { const num = Number(value); if (isNaN(num)) return '¢0.00'; return `¢${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}`; };;

export const PreOpExpensesList: React.FC<PreOpExpensesListProps> = ({ expenses, rubros, onEdit }) => {
    return (
        <div className="overflow-x-auto">
            <p className="text-xs text-slate-500 italic mb-4">Haga clic en un registro para ver el desglose por rubro.</p>
            <table className="min-w-full bg-white text-sm">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Prospecto / Presupuesto</th>
                        <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</th>
                        <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                        <th className="py-3 px-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total del Gasto</th>
                        <th className="py-3 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                        <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Rubros</th>
                        <th className="py-3 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {expenses.map(expense => (
                        <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="py-4 px-4 font-semibold text-slate-700">
                                {expense.budgetName ? (
                                    <span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase mr-1 border px-1 rounded bg-slate-50">PRE</span>
                                        {expense.budgetName}
                                    </span>
                                ) : (
                                    <span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase mr-1 border px-1 rounded bg-slate-50">PRO</span>
                                        {expense.prospectName}
                                    </span>
                                )}
                                {expense.id > 1000 && ( // Visual hint for automated records if ID logic allows
                                    <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-black uppercase">Vía OC</span>
                                )}
                            </td>
                            <td className="py-4 px-4 text-slate-600 text-sm truncate max-w-xs" title={expense.descripcion || '-'}>
                                {expense.descripcion || '-'}
                            </td>
                            <td className="py-4 px-4 text-slate-500">{new Date(expense.fecha).toLocaleDateString()}</td>
                            <td className="py-4 px-4 text-right font-mono font-bold text-primary">{formatCurrency(expense.totalGasto)}</td>
                            <td className="py-4 px-4 text-center">
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">{expense.status}</span>
                            </td>
                            <td className="py-4 px-4">
                                <div className="flex flex-wrap gap-1">
                                    {Object.entries(expense.desglose).map(([rubroId, amount]) => {
                                        const rubro = rubros.find(r => r.id === Number(rubroId));
                                        return (
                                            <span key={rubroId} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                                                {rubro?.nombre || 'N/A'}: {formatCurrency(amount as number)}
                                            </span>
                                        );
                                    })}
                                </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                                <button className="text-slate-400 hover:text-primary transition-colors" title="Ver Detalle">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                                {onEdit && (
                                    <button onClick={() => onEdit(expense)} className="text-slate-400 hover:text-orange-500 transition-colors ml-2" title="Corregir Gasto">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {expenses.length === 0 && (
                        <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400 italic">No hay gastos registrados.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
