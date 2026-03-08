import React, { useMemo, useContext } from 'react';
import { Subcontract } from '../../types';
import { AppContext } from '../../context/AppContext';
import { usePermissions } from '../../hooks/usePermissions';

interface SubcontractsTableProps {
  subcontracts: Subcontract[];
  onEdit: (subcontract: Subcontract) => void;
}

const formatCurrency = (value: number) => { const num = Number(value); if (isNaN(num)) return '¢0.00'; return `¢${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}`; };;

export const SubcontractsTable: React.FC<SubcontractsTableProps> = ({ subcontracts, onEdit }) => {
    const appContext = useContext(AppContext);
    const { can } = usePermissions();

    if (!appContext) return null;
    const { projects, suppliers, accountsPayable } = appContext;
    const canEdit = can('subcontracts', 'main', 'edit');

    const enrichedSubcontracts = useMemo(() => {
        return subcontracts.map(sc => {
            const project = projects.find(p => p.id === sc.projectId);
            const supplier = suppliers.find(s => s.id === sc.supplierId);
            const ap = accountsPayable.find(ap => ap.subcontractId === sc.id);
            const paidAmount = ap?.paidAmount || 0;
            const balance = sc.contractAmount - paidAmount;

            return {
                ...sc,
                projectName: project?.name || 'N/A',
                supplierName: supplier?.name || 'N/A',
                balance,
            };
        }).sort((a, b) => b.id - a.id);
    }, [subcontracts, projects, suppliers, accountsPayable]);

    return (
        <div className="overflow-x-auto">
            <p className="text-xs text-slate-500 italic mb-2">Doble click en una fila para ver/editar el detalle.</p>
            <table className="min-w-full bg-white text-sm">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="p-2 text-left font-medium text-slate-600">N° Contrato</th>
                        <th className="p-2 text-left font-medium text-slate-600">Proyecto</th>
                        <th className="p-2 text-left font-medium text-slate-600">Proveedor</th>
                        <th className="p-2 text-right font-medium text-slate-600">Monto</th>
                        <th className="p-2 text-right font-medium text-slate-600">Saldo Pendiente</th>
                        <th className="p-2 text-left font-medium text-slate-600">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {enrichedSubcontracts.map(sc => (
                        <tr key={sc.id} className="hover:bg-slate-50 cursor-pointer" onDoubleClick={() => canEdit && onEdit(sc)}>
                            <td className="p-2 font-semibold">{sc.contractNumber}</td>
                            <td className="p-2">{sc.projectName}</td>
                            <td className="p-2">{sc.supplierName}</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(sc.contractAmount)}</td>
                            <td className="p-2 text-right font-mono font-bold text-red-600">{formatCurrency(sc.balance)}</td>
                            <td className="p-2">
                                {canEdit && (
                                    <button onClick={() => onEdit(sc)} className="text-blue-600 hover:text-blue-900 font-medium">
                                        Editar
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
             {enrichedSubcontracts.length === 0 && (
                <p className="text-center py-10 text-slate-500">No hay subcontratos registrados.</p>
            )}
        </div>
    );
};
