import React, { useContext, useState } from 'react';
import { GoodsReceipt, PurchaseOrder, Project, Supplier, GoodsReceiptStatus, Subcontract } from '../../types';
import { AppContext } from '../../context/AppContext';
import { usePermissions } from '../../hooks/usePermissions';

interface GoodsReceiptListProps {
  receipts: GoodsReceipt[];
  onOpenDetail: (receipt: GoodsReceipt) => void;
  onNewCreditNote: (receipt: GoodsReceipt) => void;
  onRegisterProgress: () => void;
}

const RECEIPT_STATUS_COLORS: { [key in GoodsReceiptStatus]: string } = {
    [GoodsReceiptStatus.Pending]: 'bg-yellow-200 text-yellow-800',
    [GoodsReceiptStatus.PartiallyReceived]: 'bg-blue-200 text-blue-800',
    [GoodsReceiptStatus.FullyReceived]: 'bg-green-200 text-green-800',
};

const formatCurrency = (value: number) => { const num = Number(value); if (isNaN(num)) return '¢0.00'; return `¢${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}`; };;

export const GoodsReceiptList: React.FC<GoodsReceiptListProps> = ({ receipts, onOpenDetail, onNewCreditNote, onRegisterProgress }) => {
    const appContext = useContext(AppContext);
    const { can } = usePermissions();
    const [expandedReceiptId, setExpandedReceiptId] = useState<number | null>(null);

    if (!appContext) return null;

    const { purchaseOrders, projects, suppliers, subcontracts } = appContext;
    
    const canCreateNC = can('purchasing', 'creditNotes', 'create');

    const enrichedReceipts = receipts.map(receipt => {
        const po = purchaseOrders.find(p => p.id === receipt.purchaseOrderId);
        const project = projects.find(p => p.id === po?.projectId);
        const supplier = suppliers.find(s => s.id === po?.supplierId);
        const subcontract = subcontracts.find(sc => sc.purchaseOrderId === po?.id);
        return { ...receipt, po, project, supplier, subcontract };
    }).sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());

    const toggleExpand = (receiptId: number) => {
        setExpandedReceiptId(prev => (prev === receiptId ? null : receiptId));
    };

    return (
        <>
        <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-slate-500 italic">Doble click en una fila de materiales para confirmar la recepción.</p>
            <button
                onClick={onRegisterProgress}
                className="bg-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 text-sm"
            >
                + Registrar Avance de Subcontrato
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proyecto</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proveedor</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto Recibido / Factura</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID Orden Compra</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {enrichedReceipts.map(receipt => (
                        <React.Fragment key={receipt.id}>
                            <tr
                                className={`hover:bg-slate-50 ${receipt.isSubcontractReceipt ? '' : 'cursor-pointer'}`}
                                onDoubleClick={() => !receipt.isSubcontractReceipt && onOpenDetail(receipt)}
                            >
                                <td className="py-4 px-4">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        receipt.isSubcontractReceipt ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                        {receipt.isSubcontractReceipt ? 'Subcontrato' : 'Materiales'}
                                    </span>
                                </td>
                                <td className="py-4 px-4 text-sm font-medium text-slate-900">{receipt.project?.name || 'N/A'}</td>
                                <td className="py-4 px-4 text-sm text-slate-600">{receipt.supplier?.name || 'N/A'}</td>
                                <td className="py-4 px-4 text-sm text-slate-600">
                                    {receipt.isSubcontractReceipt ? (
                                        <>
                                            <span className="font-mono font-semibold">{formatCurrency(receipt.amountReceived || 0)}</span>
                                            <span className="block text-xs">Factura: {receipt.subcontractorInvoice || 'N/A'}</span>
                                        </>
                                    ) : (
                                        <span className="text-slate-400">N/A</span>
                                    )}
                                </td>
                                <td className="py-4 px-4 text-sm font-medium text-slate-700">OC-{receipt.purchaseOrderId}</td>
                                <td className="py-4 px-4">
                                    <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${RECEIPT_STATUS_COLORS[receipt.status] || 'bg-gray-200 text-gray-800'}`}
                                        title={
                                            receipt.closedByCreditNoteIds && receipt.closedByCreditNoteIds.length > 0
                                                ? `Completado por N.C. #${receipt.closedByCreditNoteIds.join(', #')}`
                                                : ''
                                        }
                                    >
                                        {receipt.closedByCreditNoteIds && receipt.closedByCreditNoteIds.length > 0
                                            ? 'Completado (N.C.)'
                                            : receipt.status}
                                    </span>
                                </td>
                                <td className="py-4 px-4 text-sm">
                                    <div className="flex items-center space-x-4">
                                        {receipt.isSubcontractReceipt ? (
                                            <button onClick={() => toggleExpand(receipt.id)} className="text-primary hover:text-primary-dark font-medium">
                                                {expandedReceiptId === receipt.id ? 'Ocultar Detalle' : 'Ver Detalle'}
                                            </button>
                                        ) : (
                                            <>
                                                <button onClick={() => onOpenDetail(receipt)} className="text-primary hover:text-primary-dark font-medium">
                                                    Revisar Recepción
                                                </button>
                                                {receipt.status === GoodsReceiptStatus.PartiallyReceived && canCreateNC && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onNewCreditNote(receipt); }} 
                                                        className="text-secondary hover:text-orange-700 font-medium"
                                                    >
                                                        Nueva N.C.
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                            {expandedReceiptId === receipt.id && receipt.isSubcontractReceipt && (
                                <tr className="bg-slate-100">
                                    <td colSpan={7} className="p-4">
                                        <h4 className="font-semibold text-slate-800">Detalles del Avance de Subcontrato:</h4>
                                        <p className="text-sm text-slate-600 mt-1 bg-white p-2 rounded border italic">"{receipt.progressDescription || 'Sin descripción.'}"</p>
                                        <div className="mt-2 text-xs grid grid-cols-3 gap-2">
                                             <p><strong>Monto Contractual:</strong> {formatCurrency(receipt.subcontract?.contractAmount || 0)}</p>
                                             <p><strong>Fecha Recepción:</strong> {receipt.actualReceiptDate ? new Date(receipt.actualReceiptDate).toLocaleDateString() : 'N/A'}</p>
                                             <p><strong>Recibido por:</strong> {receipt.receivedBy || 'N/A'}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
            {enrichedReceipts.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v1.5M12 16.5v1.5M12 2.75c-5.11 0-9.25 4.14-9.25 9.25S6.89 21.25 12 21.25 21.25 17.11 21.25 12 17.11 2.75 12 2.75zm0 3a6.25 6.25 0 100 12.5 6.25 6.25 0 000-12.5z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay recepciones que coincidan con los filtros</h3>
                    <p className="mt-1 text-sm text-gray-500">Cuando se emita una Orden de Compra, aparecerá aquí para su recepción.</p>
                </div>
            )}
        </div>
        </>
    );
};