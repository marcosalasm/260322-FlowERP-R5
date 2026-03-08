import React from 'react';
import { ChangeOrder, ChangeOrderStatus } from '../../types';
import { CHANGE_ORDER_STATUS_COLORS } from '../../constants';
import { usePermissions } from '../../hooks/usePermissions';

interface ChangeOrdersTableProps {
  changeOrders: ChangeOrder[];
  updateChangeOrderStatus: (id: number, newStatus: ChangeOrderStatus) => void;
  onEdit: (changeOrder: ChangeOrder) => void;
}

export const ChangeOrdersTable: React.FC<ChangeOrdersTableProps> = ({ changeOrders, updateChangeOrderStatus, onEdit }) => {
  const { can } = usePermissions();

  const canTakeAction = (status: ChangeOrderStatus): boolean => {
    return can('sales', 'changeOrders', 'approve') && status === ChangeOrderStatus.PendingApproval;
  }

  const canEdit = (status: ChangeOrderStatus): boolean => {
    if (status === ChangeOrderStatus.Rejected) {
      return false;
    }
    return can('sales', 'changeOrders', 'edit');
  };

  const handleAction = (id: number, action: 'approve' | 'reject') => {
    const newStatus = action === 'approve' ? ChangeOrderStatus.Approved : ChangeOrderStatus.Rejected;
    updateChangeOrderStatus(id, newStatus);
  }

  const formatCurrencyValue = (value: number) => {
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',');
};

  const formatImpact = (impact: number, type: 'Adicional' | 'Crédito') => {
    const isNegative = type === 'Crédito';
    const color = isNegative ? 'text-red-600' : 'text-green-600';
    const sign = isNegative ? '-' : '+';
    return <span className={`${color} font-semibold font-mono`}>{sign}¢{formatCurrencyValue(Math.abs(impact))}</span>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">N° Orden</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proyecto</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo de Cambio</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Impacto Monto</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Impacto Presupuesto</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha Creación</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha Aprobación</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {changeOrders.map((co) => (
            <tr key={co.id} className="hover:bg-slate-50">
              <td className="py-4 px-4 text-sm font-medium text-slate-700">{co.consecutive}</td>
              <td className="py-4 px-4 text-sm font-medium text-slate-900">{co.projectName}</td>
              <td className="py-4 px-4 text-sm text-slate-600 max-w-xs truncate">{co.description}</td>
              <td className="py-4 px-4 text-sm">
                <span className={`font-semibold ${co.changeType === 'Crédito' ? 'text-red-700' : 'text-green-700'}`}>
                  {co.changeType}
                </span>
              </td>
              <td className="py-4 px-4 text-sm">{formatImpact(co.amountImpact, co.changeType)}</td>
              <td className="py-4 px-4 text-sm">{formatImpact(co.budgetImpact, co.changeType)}</td>
              <td className="py-4 px-4 text-sm text-slate-600">{co.creationDate}</td>
              <td className="py-4 px-4 text-sm text-slate-600">{co.approvalDate || 'N/A'}</td>
              <td className="py-4 px-4">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${CHANGE_ORDER_STATUS_COLORS[co.status] || 'bg-gray-200 text-gray-800'}`}>
                  {co.status}
                </span>
              </td>
              <td className="py-4 px-4 text-sm">
                <div className="flex items-center space-x-3">
                  {canTakeAction(co.status) && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleAction(co.id, 'approve'); }} className="text-green-600 hover:text-green-900 font-medium">Aprobar</button>
                      <button onClick={(e) => { e.stopPropagation(); handleAction(co.id, 'reject'); }} className="text-red-600 hover:text-red-900 font-medium">Rechazar</button>
                    </>
                  )}
                  {canEdit(co.status) && (
                    <button onClick={(e) => { e.stopPropagation(); onEdit(co); }} className="text-blue-600 hover:text-blue-900 font-medium">Editar</button>
                  )}
                  {!canTakeAction(co.status) && !canEdit(co.status) && (
                    <span className="text-slate-400 text-xs">Sin acciones</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {changeOrders.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <p>No hay órdenes de cambio registradas.</p>
        </div>
      )}
    </div>
  );
};
