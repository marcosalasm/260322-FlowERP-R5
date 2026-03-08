
import React, { useMemo, useContext } from 'react';
import { Project, PurchaseOrder, POStatus, ServiceRequest, ServiceRequestStatus, PreOpExpense } from '../../types';
import { AppContext } from '../../context/AppContext';
import { SERVICE_REQUEST_STATUS_COLORS } from '../../constants';

const formatCurrency = (value: number) => { const num = Number(value); if (isNaN(num)) return '¢0.00'; return `¢${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}`; };;

export const ExpenseDetailModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    project: Project;
}> = ({ isOpen, onClose, project }) => {
    const appContext = useContext(AppContext);
    const { purchaseOrders, serviceRequests, quoteResponses, preOpExpenses, offers, preOpRubros } = appContext || {};

    const { approvedPOs, pendingProposals, approvedExpenses, pendingExpenses, linkedPreOpExpenses } = useMemo(() => {
        if (!project || !purchaseOrders || !serviceRequests || !quoteResponses || !preOpExpenses || !offers) {
            return { approvedPOs: [], pendingProposals: [], approvedExpenses: 0, pendingExpenses: 0, linkedPreOpExpenses: [] };
        }

        // 1. Approved POs
        const approvedPOs = purchaseOrders.filter(po =>
            po.projectId === project.id &&
            [POStatus.Approved, POStatus.Issued, POStatus.PartiallyReceived, POStatus.FullyReceived].includes(po.status)
        );
        const poExpenses = approvedPOs.reduce((sum, po) => sum + Number(po.totalAmount), 0);

        // 2. Pre-operative Expenses from linked prospect
        const offer = offers.find(o => o.id === project.offerId);
        const linkedPreOpExpenses = offer ? preOpExpenses.filter(e => e.prospectId === offer.prospectId) : [];
        const totalPreOpAmount = linkedPreOpExpenses.reduce((sum, e) => sum + Number(e.totalGasto), 0);

        const approvedExpenses = poExpenses + totalPreOpAmount;

        // 3. Pending Proposals
        const pendingRequests = serviceRequests.filter(sr =>
            sr.projectId === project.id &&
            sr.status === ServiceRequestStatus.POPendingApproval &&
            sr.winnerSelection
        );

        const pendingProposalsData = pendingRequests.map(request => {
            let total = 0;
            const supplierNames = new Set<string>();
            if (request.winnerSelection) {
                total = Object.keys(request.winnerSelection).reduce((acc, itemId) => {
                    const winnerInfo = request.winnerSelection![parseInt(itemId, 10)];
                    const serviceItem = request.items.find(i => i.id === parseInt(itemId, 10));
                    const quote = quoteResponses.find(q => q.id === winnerInfo.quoteResponseId);
                    const quoteItem = quote?.items.find(qi => qi.serviceRequestItemId === parseInt(itemId, 10));

                    if (quote) supplierNames.add(quote.supplierName);

                    if (serviceItem && quoteItem) {
                        return acc + (serviceItem.quantity * quoteItem.unitPrice);
                    }
                    return acc;
                }, 0);
            }
            return {
                request,
                total,
                supplierNames: Array.from(supplierNames).join(', ') || 'N/A'
            };
        });

        const pendingExpenses = pendingProposalsData.reduce((sum, p) => sum + p.total, 0);

        return { approvedPOs, pendingProposals: pendingProposalsData, approvedExpenses, pendingExpenses, linkedPreOpExpenses };
    }, [project, purchaseOrders, serviceRequests, quoteResponses, preOpExpenses, offers]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-6xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-dark-gray">Detalle de Gastos del Proyecto</h2>
                            <p className="text-md text-slate-600 font-semibold">{project.name}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-slate-500">Gastos Totales Aprobados</p>
                            <p className="text-xl font-bold font-mono text-green-600">{formatCurrency(approvedExpenses)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Gastos en Trámite</p>
                            <p className="text-xl font-bold font-mono text-orange-600">{formatCurrency(pendingExpenses)}</p>
                        </div>
                        <div className="hidden md:block">
                            <p className="text-sm text-slate-500">Saldo Presupuesto Restante</p>
                            <p className="text-xl font-bold font-mono text-primary">{formatCurrency(project.budget - approvedExpenses)}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto mt-4 space-y-6 -mr-3 pr-3">
                    {/* Pre-operative Expenses Table */}
                    {linkedPreOpExpenses.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold text-indigo-700 mb-2 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Gastos Registrados Cargados (Preventa)
                            </h3>
                            <div className="overflow-hidden border border-indigo-200 rounded-lg">
                                <table className="min-w-full bg-white text-sm">
                                    <thead className="bg-indigo-50">
                                        <tr>
                                            <th className="p-2 text-left font-medium text-indigo-700">Fecha</th>
                                            <th className="p-2 text-left font-medium text-indigo-700">ID Gasto</th>
                                            <th className="p-2 text-left font-medium text-indigo-700">Rubros Incluidos</th>
                                            <th className="p-2 text-right font-medium text-indigo-700">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-indigo-100">
                                        {linkedPreOpExpenses.map(expense => (
                                            <tr key={expense.id}>
                                                <td className="p-2 text-slate-600">{new Date(expense.fecha).toLocaleDateString()}</td>
                                                <td className="p-2 font-medium text-slate-800">PRE-{expense.id}</td>
                                                <td className="p-2">
                                                    <div className="flex flex-wrap gap-1">
                                                        {Object.entries(expense.desglose).map(([rid, amt]) => (
                                                            <span key={rid} className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                                                                {preOpRubros?.find(r => r.id === Number(rid))?.nombre}: {formatCurrency(amt as number)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-2 text-right font-mono font-semibold text-indigo-800">{formatCurrency(expense.totalGasto)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-indigo-50 font-bold">
                                        <tr>
                                            <td colSpan={3} className="p-2 text-right text-indigo-700">Subtotal Gastos Registrados:</td>
                                            <td className="p-2 text-right font-mono text-indigo-900">
                                                {formatCurrency(linkedPreOpExpenses.reduce((sum, e) => sum + Number(e.totalGasto), 0))}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Approved POs Table */}
                    <section>
                        <h3 className="text-lg font-semibold text-dark-gray mb-2">Órdenes de Compra Aprobadas</h3>
                        <div className="overflow-hidden border border-slate-200 rounded-lg">
                            <table className="min-w-full bg-white text-sm">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="p-2 text-left font-medium text-slate-600">ID OC</th>
                                        <th className="p-2 text-left font-medium text-slate-600">Fecha Aprob.</th>
                                        <th className="p-2 text-left font-medium text-slate-600">Descripción Breve</th>
                                        <th className="p-2 text-left font-medium text-slate-600">Proveedor</th>
                                        <th className="p-2 text-right font-medium text-slate-600">Monto Total OC</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {approvedPOs.length > 0 ? approvedPOs.map(po => (
                                        <tr key={po.id}>
                                            <td className="p-2 font-medium">OC-{po.id}</td>
                                            <td className="p-2 text-slate-600">{po.orderDate}</td>
                                            <td className="p-2 text-slate-600 truncate max-w-xs" title={po.items.map(i => i.name).join(', ')}>
                                                {po.items.length > 0 ? `${po.items[0].name}${po.items.length > 1 ? ', ...' : ''}` : 'N/A'}
                                            </td>
                                            <td className="p-2 text-slate-600">{po.supplierName}</td>
                                            <td className="p-2 text-right font-mono font-semibold">{formatCurrency(po.totalAmount)}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="p-4 text-center text-slate-500">No hay órdenes de compra aprobadas para este proyecto.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Pending POs Table */}
                    <section>
                        <h3 className="text-lg font-semibold text-dark-gray mb-2">Órdenes de Compra en Trámite</h3>
                        <div className="overflow-hidden border border-slate-200 rounded-lg">
                            <table className="min-w-full bg-white text-sm">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="p-2 text-left font-medium text-slate-600">ID Solicitud</th>
                                        <th className="p-2 text-left font-medium text-slate-600">Fecha Creación</th>
                                        <th className="p-2 text-left font-medium text-slate-600">Estado OC</th>
                                        <th className="p-2 text-left font-medium text-slate-600">Proveedor(es)</th>
                                        <th className="p-2 text-right font-medium text-slate-600">Monto Total OC</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {pendingProposals.length > 0 ? pendingProposals.map(p => (
                                        <tr key={p.request.id}>
                                            <td className="p-2 font-medium">#{p.request.id}</td>
                                            <td className="p-2 text-slate-600">{p.request.requestDate}</td>
                                            <td className="p-2">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${SERVICE_REQUEST_STATUS_COLORS[p.request.status]}`}>
                                                    {p.request.status}
                                                </span>
                                            </td>
                                            <td className="p-2 text-slate-600">{p.supplierNames}</td>
                                            <td className="p-2 text-right font-mono font-semibold">{formatCurrency(p.total)}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="p-4 text-center text-slate-500">No hay órdenes de compra en trámite para este proyecto.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
