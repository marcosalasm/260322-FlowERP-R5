
import React from 'react';
import { Budget } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { formatCurrency } from '../../utils/format';

interface BudgetsTableProps {
  budgets: Budget[];
  onEdit: (budget: Budget) => void;
  onViewMaterials: (budget: Budget) => void;
  onExport: (budget: Budget) => void;
  onDelete: (budgetId: number) => void;
}

export const BudgetsTable: React.FC<BudgetsTableProps> = ({ budgets, onEdit, onViewMaterials, onExport, onDelete }) => {
  const { can } = usePermissions();
  const canDelete = can('sales', 'budgets', 'delete');
  const canEdit = can('sales', 'budgets', 'edit');



  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">N° Presupuesto</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Prospecto</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto Total Final</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Recurrente</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Detalles</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {budgets.map((budget) => (
            <tr key={budget.id} className="hover:bg-slate-50">
              <td className="py-4 px-4 text-sm font-medium text-slate-700">{budget.consecutiveNumber}</td>
              <td className="py-4 px-4 text-sm font-medium text-slate-900">{budget.prospectName}</td>
              <td className="py-4 px-4 text-sm text-slate-600">{new Date(budget.date).toLocaleDateString()}</td>
              <td className="py-4 px-4 text-sm text-slate-600 max-w-xs truncate" title={budget.description}>{budget.description || '-'}</td>
              <td className="py-4 px-4 text-sm font-semibold text-slate-800">{budget.currency === 'CRC' ? '¢' : '$'}{formatCurrency(budget.finalTotal).replace('¢', '').replace('$', '')}</td>
              <td className="py-4 px-4 text-sm">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${budget.isRecurring ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'}`}>
                  {budget.isRecurring ? 'Sí' : 'No'}
                </span>
              </td>
              <td className="py-4 px-4 text-sm">
                <button onClick={(e) => { e.stopPropagation(); onViewMaterials(budget); }} className="text-green-600 hover:text-green-900 font-medium">Materiales</button>
              </td>
              <td className="py-4 px-4 text-sm">
                <div className="flex items-center space-x-3">
                  <button onClick={(e) => { e.stopPropagation(); onExport(budget); }} className="text-secondary hover:text-orange-900 font-medium flex items-center gap-1" title="Exportar Presupuesto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Exportar
                  </button>
                  {canEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(budget); }} className="text-blue-600 hover:text-blue-900 font-medium">Editar</button>}
                  {canDelete && (
                    <button onClick={(e) => { e.stopPropagation(); onDelete(budget.id); }} className="text-red-600 hover:text-red-900 font-medium">Eliminar</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {budgets.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <p>No hay presupuestos registrados. ¡Comienza creando uno!</p>
        </div>
      )}
    </div>
  );
};
