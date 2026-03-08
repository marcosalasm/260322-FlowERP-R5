import React, { useState, useMemo, useContext } from 'react';
import { Card } from '../shared/Card';
import { AppContext } from '../../context/AppContext';
import { AdministrativeBudget, AdministrativeExpense, AdministrativeBudgetCategory, User, Role } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../context/ToastContext';
import { NewAdminExpenseModal } from './NewAdminExpenseModal';
import { EditAdminBudgetModal } from './EditAdminBudgetModal';
import { ConfirmationModal } from '../shared/ConfirmationModal';
// FIX: Add missing import for NewAdminBudgetModal
import { NewAdminBudgetModal } from './NewAdminBudgetModal';
import { apiService } from '../../services/apiService';

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const formatCurrency = (value: number) => { const num = Number(value); if (isNaN(num)) return '¢0.00'; return `¢${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}`; };;

// #region Sub-components
const AdministrativeBudgetView: React.FC<{
    budget: AdministrativeBudget | undefined;
    expenses: AdministrativeExpense[];
    onEdit: () => void;
    onApprove: (budgetId: number) => void;
}> = ({ budget, expenses, onEdit, onApprove }) => {
    const { can } = usePermissions();

    const categoryTotals = useMemo(() => {
        const totals = new Map<number, number>();
        expenses.forEach(expense => {
            totals.set(expense.categoryId, (totals.get(expense.categoryId) || 0) + expense.amount);
        });
        return totals;
    }, [expenses]);

    const canApproveBudget = can('adminExpenses', 'budget', 'approve');

    if (!budget) {
        return (
            <div className="text-center py-10 text-slate-500">
                <p>No hay un presupuesto administrativo definido para este año.</p>
            </div>
        );
    }

    const isEditable = budget.status === 'Borrador' || budget.status === 'En Revisión';
    const isApprovable = budget.status === 'Borrador' || budget.status === 'En Revisión';


    return (
        <div className="overflow-x-auto">
            <div className="flex justify-end items-center gap-4 mb-4">
                {can('adminExpenses', 'budget', 'edit') && (
                    <button
                        onClick={onEdit}
                        disabled={!isEditable}
                        className="text-sm bg-blue-100 text-primary font-semibold py-1 px-3 rounded-lg hover:bg-blue-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                        title={!isEditable ? 'El presupuesto debe estar en estado "Borrador" o "En Revisión" para ser editado.' : 'Editar Presupuesto'}
                    >
                        Editar Presupuesto
                    </button>
                )}
                {canApproveBudget && isApprovable && (
                    <button
                        onClick={() => onApprove(budget.id)}
                        className="text-sm bg-green-100 text-green-700 font-semibold py-1 px-3 rounded-lg hover:bg-green-200"
                    >
                        Aprobar Presupuesto
                    </button>
                )}
            </div>
            <table className="min-w-full bg-white text-xs">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="p-2 text-left font-semibold text-slate-600 sticky left-0 bg-slate-100">Rubro</th>
                        {MONTHS.map(m => <th key={m} className="p-2 text-right font-semibold text-slate-600">{m}</th>)}
                        <th className="p-2 text-right font-bold text-blue-800 bg-blue-100">Total Anual</th>
                        <th className="p-2 text-right font-bold text-orange-800 bg-orange-100">Total Gastado</th>
                        <th className="p-2 text-right font-bold text-green-800 bg-green-100">Saldo</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {budget.categories.map(cat => {
                        const spent = categoryTotals.get(cat.id) || 0;
                        const balance = cat.annualBudget - spent;
                        return (
                            <tr key={cat.id} className="hover:bg-slate-50">
                                <td className="p-2 font-medium text-slate-800 sticky left-0 bg-white">{cat.name}</td>
                                {cat.monthlyAmounts.map((amount, i) => (
                                    <td key={i} className="p-2 text-right font-mono text-slate-600">{formatCurrency(amount)}</td>
                                ))}
                                <td className="p-2 text-right font-bold font-mono text-blue-800 bg-blue-50">{formatCurrency(cat.annualBudget)}</td>
                                <td className="p-2 text-right font-bold font-mono text-orange-800 bg-orange-50">{formatCurrency(spent)}</td>
                                <td className={`p-2 text-right font-bold font-mono ${balance < 0 ? 'text-red-600' : 'text-green-800'} ${balance < 0 ? 'bg-red-50' : 'bg-green-50'}`}>{formatCurrency(balance)}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
};

const AdministrativeExpensesList: React.FC<{
    expenses: AdministrativeExpense[];
    budget: AdministrativeBudget | undefined;
}> = ({ expenses, budget }) => {

    const getCategoryName = (catId: number) => budget?.categories.find(c => c.id === catId)?.name || 'N/A';

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white text-sm">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="py-3 px-4 text-left font-medium text-slate-600">Fecha</th>
                        <th className="py-3 px-4 text-left font-medium text-slate-600">Rubro</th>
                        <th className="py-3 px-4 text-left font-medium text-slate-600">Proveedor</th>
                        <th className="py-3 px-4 text-left font-medium text-slate-600 w-1/3">Descripción</th>
                        <th className="py-3 px-4 text-right font-medium text-slate-600">Monto</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {expenses.map(exp => (
                        <tr key={exp.id}>
                            <td className="py-4 px-4 whitespace-nowrap">{exp.date}</td>
                            <td className="py-4 px-4">{getCategoryName(exp.categoryId)}</td>
                            <td className="py-4 px-4">{exp.supplier}</td>
                            <td className="py-4 px-4">{exp.description}</td>
                            <td className="py-4 px-4 text-right font-mono font-semibold">{formatCurrency(exp.amount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {expenses.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                    <p>No hay gastos registrados para este año.</p>
                </div>
            )}
        </div>
    );
};
// #endregion

const AdminExpensesDashboard: React.FC = () => {
    const appContext = useContext(AppContext);
    const { can } = usePermissions();
    const { showToast } = useToast();

    if (!appContext) return null;
    const { administrativeBudgets, setAdministrativeBudgets, administrativeExpenses, setAdministrativeExpenses, user, roles } = appContext;

    const [activeView, setActiveView] = useState<'budget' | 'expenses'>('expenses');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isNewBudgetModalOpen, setIsNewBudgetModalOpen] = useState(false);
    const [isEditBudgetModalOpen, setIsEditBudgetModalOpen] = useState(false);
    const [budgetToEdit, setBudgetToEdit] = useState<AdministrativeBudget | null>(null);
    const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [budgetToApproveId, setBudgetToApproveId] = useState<number | null>(null);


    const availableYears = useMemo(() => {
        const years = new Set(administrativeBudgets.map(b => b.year));
        years.add(new Date().getFullYear());
        return Array.from(years).sort((a: number, b: number) => b - a);
    }, [administrativeBudgets]);

    const budgetForYear = useMemo(() => {
        return administrativeBudgets.find(b => b.year === selectedYear);
    }, [selectedYear, administrativeBudgets]);

    const expensesForYear = useMemo(() => {
        return administrativeExpenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getFullYear() === selectedYear;
        });
    }, [selectedYear, administrativeExpenses]);


    const handleCreateBudget = async (newBudget: Omit<AdministrativeBudget, 'id'>) => {
        try {
            const newHistoryEntry = {
                user: user.name,
                date: new Date().toISOString(),
                action: 'Creado' as const
            };
            const budgetToCreate = { ...newBudget, approvalHistory: [newHistoryEntry] };
            const createdBudget = await apiService.createAdministrativeBudget(budgetToCreate);
            setAdministrativeBudgets(prev => [...prev, createdBudget]);
            showToast(`Presupuesto "${newBudget.name}" creado con éxito.`, 'success');
            setIsNewBudgetModalOpen(false);
        } catch (error) {
            console.error('Error creating budget:', error);
            showToast('Error al crear el presupuesto.', 'error');
        }
    };

    const handleEditBudget = () => {
        if (budgetForYear) {
            setBudgetToEdit(budgetForYear);
            setIsEditBudgetModalOpen(true);
        }
    };

    const handleUpdateBudget = async (updatedBudget: AdministrativeBudget) => {
        try {
            const newHistoryEntry = {
                user: user.name,
                date: new Date().toISOString(),
                action: 'Modificado' as const
            };
            const finalBudget = {
                ...updatedBudget,
                approvalHistory: [...(updatedBudget.approvalHistory || []), newHistoryEntry]
            };
            const result = await apiService.updateAdministrativeBudget(finalBudget.id, finalBudget);
            setAdministrativeBudgets(prev => prev.map(b => b.id === result.id ? result : b));
            showToast(`Presupuesto "${result.name}" actualizado con éxito.`, 'success');
            setIsEditBudgetModalOpen(false);
            setBudgetToEdit(null);
        } catch (error) {
            console.error('Error updating budget:', error);
            showToast('Error al actualizar el presupuesto.', 'error');
        }
    };

    const handleRequestApproval = (budgetId: number) => {
        setBudgetToApproveId(budgetId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmApproval = async () => {
        if (!budgetToApproveId) return;

        try {
            const budget = administrativeBudgets.find(b => b.id === budgetToApproveId);
            if (!budget) return;

            const newHistoryEntry = {
                user: user.name,
                date: new Date().toISOString(),
                action: 'Aprobado' as const
            };
            const updatedBudget = {
                ...budget,
                status: 'Aprobado' as const,
                approvalHistory: [...(budget.approvalHistory || []), newHistoryEntry]
            };

            const result = await apiService.updateAdministrativeBudget(budgetToApproveId, updatedBudget);
            setAdministrativeBudgets(prev => prev.map(b => b.id === result.id ? result : b));
            showToast('Presupuesto aprobado con éxito.', 'success');
            setBudgetToApproveId(null);
        } catch (error) {
            console.error('Error approving budget:', error);
            showToast('Error al aprobar el presupuesto.', 'error');
        }
    };

    const handleAddExpense = async (newExpenseData: Omit<AdministrativeExpense, 'id'>) => {
        if (!budgetForYear) {
            showToast('No se puede registrar el gasto porque no existe un presupuesto para el año seleccionado.', 'error');
            return;
        }

        try {
            const expenseToCreate = {
                ...newExpenseData,
                budgetId: budgetForYear.id,
            };

            const createdExpense = await apiService.createAdministrativeExpense(expenseToCreate);
            setAdministrativeExpenses(prev => [createdExpense, ...prev]);
            showToast('Gasto administrativo registrado con éxito.', 'success');
            setIsNewExpenseModalOpen(false);
        } catch (error) {
            console.error('Error creating expense:', error);
            showToast('Error al registrar el gasto.', 'error');
        }
    };

    if (!can('adminExpenses', 'main', 'view')) {
        return (
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-red-600">Acceso Denegado</h2>
                <p className="text-slate-500">No tiene los permisos necesarios para ver este módulo.</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-dark-gray">Módulo de Gastos Administrativos</h2>
                    <div className="flex items-center gap-4">
                        <select
                            value={selectedYear}
                            onChange={e => setSelectedYear(Number(e.target.value))}
                            className="p-2 border border-slate-300 rounded-md shadow-sm"
                        >
                            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                        {can('adminExpenses', 'expenses', 'create') && activeView === 'expenses' && (
                            <button
                                onClick={() => setIsNewExpenseModalOpen(true)}
                                className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark"
                                disabled={!budgetForYear}
                                title={!budgetForYear ? "Debe crear un presupuesto para este año antes de agregar gastos." : "Registrar nuevo gasto"}
                            >
                                + Nuevo Gasto
                            </button>
                        )}
                        {can('adminExpenses', 'budget', 'create') && activeView === 'budget' && !budgetForYear && (
                            <button onClick={() => setIsNewBudgetModalOpen(true)} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark">
                                + Crear Presupuesto para {selectedYear}
                            </button>
                        )}
                    </div>
                </div>

                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveView('budget')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeView === 'budget' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>
                            Presupuesto Anual
                        </button>
                        <button onClick={() => setActiveView('expenses')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeView === 'expenses' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>
                            Registro de Gastos
                        </button>
                    </nav>
                </div>

                <Card>
                    {activeView === 'budget' ? (
                        <AdministrativeBudgetView
                            budget={budgetForYear}
                            expenses={expensesForYear}
                            onEdit={handleEditBudget}
                            onApprove={handleRequestApproval}
                        />
                    ) : (
                        <AdministrativeExpensesList expenses={expensesForYear} budget={budgetForYear} />
                    )}
                </Card>
            </div>
            <NewAdminBudgetModal
                isOpen={isNewBudgetModalOpen}
                onClose={() => setIsNewBudgetModalOpen(false)}
                onSubmit={handleCreateBudget}
                year={selectedYear}
            />
            <EditAdminBudgetModal
                isOpen={isEditBudgetModalOpen}
                onClose={() => setIsEditBudgetModalOpen(false)}
                onSubmit={handleUpdateBudget}
                budget={budgetToEdit}
            />
            <NewAdminExpenseModal
                isOpen={isNewExpenseModalOpen}
                onClose={() => setIsNewExpenseModalOpen(false)}
                onSubmit={handleAddExpense}
                budget={budgetForYear}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmApproval}
                title="Confirmar Aprobación de Presupuesto"
                message={
                    <>
                        <p>¿Está seguro de que desea aprobar este presupuesto?</p>
                        <p className="font-semibold text-red-600 mt-2">Esta acción es irreversible y bloqueará la edición futura.</p>
                    </>
                }
            />
        </>
    );
};

export default AdminExpensesDashboard;