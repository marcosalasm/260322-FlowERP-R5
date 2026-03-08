import React, { useMemo } from 'react';
import { AccountPayable, PurchaseOrder, APStatus, Subcontract } from '../../types';
import { isPast, isToday } from 'date-fns';
import { AP_STATUS_COLORS } from '../../constants';

interface ProjectAccountsPayableProps {
    projectId: number;
    accountsPayable: AccountPayable[];
    purchaseOrders: PurchaseOrder[];
    subcontracts: Subcontract[];
}

const formatCurrency = (value: number) => {
    const num = Number(value);
    if (isNaN(num)) return '¢0,00';
    const parts = num.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `¢${parts[0]},${parts[1]}`;
};

export const ProjectAccountsPayable: React.FC<ProjectAccountsPayableProps> = ({ projectId, accountsPayable, purchaseOrders, subcontracts }) => {

    const projectPayables = useMemo(() => {
        const projectPOIds = new Set(purchaseOrders.filter(po => po.projectId === projectId).map(po => po.id));
        const projectSubcontractIds = new Set(subcontracts.filter(sc => sc.projectId === projectId).map(sc => sc.id));

        return accountsPayable
            .filter(ap =>
                (ap.purchaseOrderId && projectPOIds.has(ap.purchaseOrderId)) ||
                (ap.subcontractId && projectSubcontractIds.has(ap.subcontractId))
            )
            .map(ap => {
                const balance = Number(ap.totalAmount) - Number(ap.paidAmount) - (Number(ap.creditedAmount) || 0);
                if (balance <= 0.001) return null; // Filter out paid invoices with a small tolerance

                // Ensure date is parsed as local time by avoiding Z
                const dueDate = new Date(`${ap.dueDate}T00:00:00`);
                const isOverdue = isPast(dueDate) && !isToday(dueDate);
                const status = isOverdue ? APStatus.Overdue : ap.status;

                return { ...ap, balance, status };
            })
            .filter((ap): ap is NonNullable<typeof ap> => ap !== null)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [projectId, accountsPayable, purchaseOrders, subcontracts]);

    const totals = useMemo(() => {
        const totalPending = projectPayables.reduce((sum, ap) => sum + ap.balance, 0);
        const totalOverdue = projectPayables.filter(ap => ap.status === APStatus.Overdue).reduce((sum, ap) => sum + ap.balance, 0);
        return { totalPending, totalOverdue };
    }, [projectPayables]);

    if (projectPayables.length === 0) {
        return (
            <section>
                <h3 className="text-lg font-semibold text-dark-gray mb-3">Cuentas por Pagar Pendientes</h3>
                <div className="bg-white p-4 rounded-md shadow-sm text-center">
                    <p className="text-sm text-slate-500">Este proyecto no tiene cuentas por pagar pendientes.</p>
                </div>
            </section>
        );
    }

    return (
        <section>
            <h3 className="text-lg font-semibold text-dark-gray mb-3">Cuentas por Pagar Pendientes</h3>
            <div className="bg-white p-4 rounded-md shadow-sm">
                <div className="overflow-hidden border border-slate-200 rounded-lg">
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Fecha Factura</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">N° Factura</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Proveedor</th>
                                <th className="py-2 px-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Monto Original</th>
                                <th className="py-2 px-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Monto Pagado</th>
                                <th className="py-2 px-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Monto Pendiente</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Fecha Vencimiento</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {projectPayables.map(ap => (
                                <tr key={ap.id}>
                                    <td className="py-2 px-3 text-slate-600">{ap.invoiceDate}</td>
                                    <td className="py-2 px-3 font-medium text-slate-800">{ap.invoiceNumber}</td>
                                    <td className="py-2 px-3 text-slate-600">{ap.supplierName}</td>
                                    <td className="py-2 px-3 text-right font-mono">{formatCurrency(Number(ap.totalAmount))}</td>
                                    <td className="py-2 px-3 text-right font-mono text-green-700">{formatCurrency(Number(ap.paidAmount))}</td>
                                    <td className="py-2 px-3 text-right font-mono font-bold text-red-700">{formatCurrency(ap.balance)}</td>
                                    <td className="py-2 px-3 text-slate-600">{ap.dueDate}</td>
                                    <td className="py-2 px-3">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${AP_STATUS_COLORS[ap.status] || 'bg-gray-200'}`}>
                                            {ap.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-orange-50 text-orange-800 p-3 rounded-md">
                        <p className="text-sm font-semibold">Total Vencido</p>
                        <p className="text-xl font-bold font-mono">{formatCurrency(totals.totalOverdue)}</p>
                    </div>
                    <div className="bg-red-50 text-red-800 p-3 rounded-md">
                        <p className="text-sm font-semibold">Total de Cuentas por Pagar</p>
                        <p className="text-xl font-bold font-mono">{formatCurrency(totals.totalPending)}</p>
                    </div>
                </div>
            </div>
        </section>
    );
};
