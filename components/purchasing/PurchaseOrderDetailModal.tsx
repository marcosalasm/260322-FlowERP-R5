
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { PurchaseOrder, ServiceRequest, QuoteResponse, Project, Supplier, POStatus, ProjectStatus } from '../../types';
import { AppContext } from '../../context/AppContext';

interface PurchaseOrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: ServiceRequest | PurchaseOrder | null;
    onSave: (updatedOrder: PurchaseOrder) => void;
    onApprove: (request: ServiceRequest, overrunJustification?: string) => void;
    onReject: (item: ServiceRequest | PurchaseOrder, reason: string) => void;
    onCreateSubcontract: (po: PurchaseOrder) => void;
    onApprovePO?: (po: PurchaseOrder) => void;
}

import { formatCurrency, formatNumber } from '../../utils/format';
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const QualityBadge: React.FC<{ quality: 'Alta' | 'Media' | 'Baja' }> = ({ quality }) => {
    const styles = {
        'Alta': 'bg-green-100 text-green-800',
        'Media': 'bg-yellow-100 text-yellow-800',
        'Baja': 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[quality]}`}>{quality}</span>;
};

const FileAttachmentRow: React.FC<{ label: string; fileName?: string; fileBase64?: string; onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void; inputId: string; }> =
    ({ label, fileName, fileBase64, onFileChange, inputId }) => (
        <div>
            <label className="block text-sm font-medium text-slate-700">{label}</label>
            <div className="mt-1 flex items-center space-x-4">
                <input type="file" id={inputId} accept=".pdf" onChange={onFileChange} className="hidden" />
                <label htmlFor={inputId} className="cursor-pointer bg-white py-1.5 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                    {fileName ? "Cambiar Archivo" : "Adjuntar PDF"}
                </label>
                {fileName ? (
                    <a href={fileBase64 || '#'} download={fileName} className="text-sm font-medium text-primary hover:underline truncate max-w-[200px]" onClick={(e) => !fileBase64 && e.preventDefault()}>
                        {fileName}
                    </a>
                ) : <span className="text-sm text-slate-400">Ningún archivo.</span>}
            </div>
        </div>
    );

export const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({ isOpen, onClose, item, onSave, onApprove, onReject, onCreateSubcontract, onApprovePO }) => {
    const appContext = useContext(AppContext);
    const { serviceRequests, quoteResponses, projects, companyInfo, suppliers } = appContext || {};

    const [activeTab, setActiveTab] = useState<'approval' | 'management'>('approval');
    const [editableOrder, setEditableOrder] = useState<PurchaseOrder | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [overrunJustification, setOverrunJustification] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const { serviceRequest, purchaseOrder, quotesForRequest } = useMemo(() => {
        if (!item || !serviceRequests || !quoteResponses) return { serviceRequest: null, purchaseOrder: null, quotesForRequest: [] };

        if ('requester' in item) { // It's a ServiceRequest
            const sr = item;
            const quotes = quoteResponses.filter(q => q.serviceRequestId === sr.id);
            return { serviceRequest: sr, purchaseOrder: null, quotesForRequest: quotes };
        } else { // It's a PurchaseOrder
            const po = item;
            const sr = serviceRequests.find(s => s.id === po.serviceRequestId);
            const quotes = sr ? quoteResponses.filter(q => q.serviceRequestId === sr.id) : [];
            return { serviceRequest: sr || null, purchaseOrder: po, quotesForRequest: quotes };
        }
    }, [item, serviceRequests, quoteResponses]);

    const uniqueWinnerQuoteIds = useMemo(() => {
        if (!serviceRequest?.winnerSelection) return new Set<number>();
        const ids = Object.values(serviceRequest.winnerSelection).map(winner => (winner as any).quoteResponseId);
        return new Set(ids);
    }, [serviceRequest]);

    const winningQuotes = useMemo(() => {
        if (uniqueWinnerQuoteIds.size === 0) return [];
        return quotesForRequest.filter(q => uniqueWinnerQuoteIds.has(q.id));
    }, [uniqueWinnerQuoteIds, quotesForRequest]);

    const isApprovalMode = !purchaseOrder;
    const isManagementMode = !!purchaseOrder;
    const canBeRejected = purchaseOrder && ![POStatus.Issued, POStatus.FullyReceived, POStatus.PartiallyReceived, POStatus.Cancelled, POStatus.Rejected].includes(purchaseOrder.status);
    const isSubcontractPO = useMemo(() => {
        return purchaseOrder?.items.some(i => i.name.toLowerCase().includes('sub contrato')) ?? false;
    }, [purchaseOrder]);


    const poTotalsToApprove = useMemo(() => {
        if (!isApprovalMode || !serviceRequest?.winnerSelection || !companyInfo) return { total: 0 };

        const totalValue = Object.entries(serviceRequest.winnerSelection).reduce((acc, [itemId, winnerInfo]) => {
            const item = (serviceRequest.items || []).find(i => i.id === Number(itemId));
            const quoteResponse = (quotesForRequest || []).find(qr => qr.id === (winnerInfo as any).quoteResponseId);
            const quoteLineItem = (quoteResponse?.items || []).find(qli => 
                qli.serviceRequestItemId === Number(itemId) || 
                (qli as any).request_item_id === Number(itemId) || 
                ((qli as any).material_id && item?.material_id && (qli as any).material_id === item.material_id) ||
                ((qli as any).name && item?.name && (qli as any).name.toLowerCase() === item.name.toLowerCase())
            );

            if (item && quoteResponse && quoteLineItem) {
                return acc + (item.quantity * quoteLineItem.unitPrice);
            }
            return acc;
        }, 0);

        // FIX: No sumamos IVA aquí porque el monto cotizado en Gestionar Cotizaciones ya lo incluye.
        return {
            total: totalValue
        };
    }, [isApprovalMode, serviceRequest, quotesForRequest, companyInfo]);

    const budgetCheck = useMemo(() => {
        if (!isApprovalMode || !serviceRequest || !projects) {
            return { isOverBudget: false };
        }

        const project = projects.find(p => p.id === serviceRequest.projectId);
        if (!project) {
            return { isOverBudget: false };
        }

        const { total: totalOC } = poTotalsToApprove;
        const projectedExpenses = project.expenses + totalOC;
        const isOverBudget = projectedExpenses > project.budget;

        if (isOverBudget) {
            return {
                isOverBudget: true,
                modifiedBudget: project.budget,
                currentExpenses: project.expenses,
                poAmount: totalOC,
                projectedTotal: projectedExpenses,
                overrun: projectedExpenses - project.budget,
            };
        }

        return { isOverBudget: false };
    }, [isApprovalMode, serviceRequest, projects, poTotalsToApprove]);


    useEffect(() => {
        if (purchaseOrder) {
            setEditableOrder(JSON.parse(JSON.stringify(purchaseOrder)));
            setActiveTab('management');
        } else {
            setEditableOrder(null);
            setActiveTab('approval');
        }
        setRejectionReason('');
        setOverrunJustification('');
    }, [purchaseOrder, item]);

    if (!isOpen || !serviceRequest) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldPrefix: 'signedPo' | 'proofs') => {
        const file = e.target.files?.[0];
        if (file && editableOrder) {
            const base64 = await toBase64(file);
            setEditableOrder({
                ...editableOrder,
                [`${fieldPrefix}PdfName`]: file.name,
                [`${fieldPrefix}PdfBase64`]: base64,
            });
        }
    };

    const handleSave = () => {
        if (editableOrder) {
            setIsSaving(true);
            onSave(editableOrder);
            setTimeout(() => { setIsSaving(false); onClose(); }, 500);
        }
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            alert('Por favor, ingrese una razón para el rechazo.');
            return;
        }
        if (isApprovalMode) {
            onReject(serviceRequest, rejectionReason);
        } else if (purchaseOrder) {
            onReject(purchaseOrder, rejectionReason);
        }
    };

    const handleApprove = () => {
        const project = projects?.find(p => p.id === serviceRequest.projectId);
        if (project?.status === ProjectStatus.Completed && !serviceRequest.isWarranty) {
            alert("No se puede generar una Orden de Compra para un proyecto finalizado, a menos que sea una solicitud de garantía.");
            return;
        }
        onApprove(serviceRequest, overrunJustification);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-7xl h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-dark-gray">
                            {isApprovalMode ? `Aprobar Propuesta (Solicitud #${serviceRequest.id})` : `Detalle de Orden de Compra: OC-${purchaseOrder.id}`}
                        </h2>
                        <p className="text-sm text-slate-500">Proyecto: <span className="font-medium">{serviceRequest.projectName}</span></p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="border-b border-slate-200 mb-4">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveTab('approval')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'approval' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>
                            Detalles de Aprobación
                        </button>
                        <button onClick={() => setActiveTab('management')} disabled={!purchaseOrder} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'management' ? 'border-primary text-primary' : 'border-transparent text-slate-500'} disabled:text-slate-300`}>
                            Gestión de Orden
                        </button>
                    </nav>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 -mr-4">
                    {activeTab === 'approval' && (
                        <div className="space-y-4">
                            {budgetCheck.isOverBudget && (
                                <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-md my-4" role="alert">
                                    <div className="flex">
                                        <div className="py-1">
                                            <svg className="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-bold">¡Advertencia: Exceso Presupuestario!</p>
                                            <p className="text-sm">Con la aprobación de esta Orden de Compra, los gastos totales del proyecto superarán su presupuesto modificado.</p>
                                            <ul className="text-xs list-disc pl-5 mt-2 space-y-1 font-mono">
                                                <li>Presupuesto Modificado: <span className="font-semibold">{formatCurrency(budgetCheck.modifiedBudget!)}</span></li>
                                                <li>Gastos Aprobados Actuales: <span className="font-semibold">{formatCurrency(budgetCheck.currentExpenses!)}</span></li>
                                                <li>Monto de la OC a Aprobar: <span className="font-semibold">{formatCurrency(budgetCheck.poAmount!)}</span></li>
                                                <li className="font-bold">Total Proyectado Post-Aprobación: {formatCurrency(budgetCheck.projectedTotal!)}</li>
                                                <li className="font-bold text-red-600">Exceso Estimado: {formatCurrency(budgetCheck.overrun!)}</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-semibold text-dark-gray">Cuadro Comparativo</h3>
                                <div className="overflow-x-auto border rounded-lg mt-2">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="p-2 text-left font-semibold text-slate-600 sticky left-0 bg-slate-100 z-10 align-bottom">Artículo</th>
                                                {quotesForRequest.map(q => (
                                                    <th key={q.id} className="p-2 text-left font-normal text-sm border-l align-top">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-dark-gray">{q.supplierName}</span>
                                                            <span className="text-slate-700">
                                                                Total: <span className="font-mono font-semibold text-primary">
                                                                    {(q.currency === 'USD' ? '$' : '¢')}{formatNumber(q.total, 2, 2)}
                                                                </span>
                                                            </span>
                                                            <span className="text-slate-500">
                                                                Entrega: {q.deliveryDays} Días
                                                            </span>
                                                            <span className="text-slate-500">
                                                                Cotiz. Nº: {q.quoteNumber || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {serviceRequest.items.map(item => (
                                                <tr key={item.id} className="border-t">
                                                    <td className="p-2 font-medium bg-white sticky left-0 z-10">{item.name}<br /><span className="text-xs text-slate-500">Cant: {item.quantity} {item.unit}</span></td>
                                                    {quotesForRequest.map(quote => {
                                                        const quoteItem = quote.items.find(i => 
                                                            i.serviceRequestItemId === item.id || 
                                                            (i as any).request_item_id === item.id || 
                                                            ((i as any).material_id && item.material_id && (i as any).material_id === item.material_id) ||
                                                            ((i as any).name && item.name && (i as any).name.toLowerCase() === item.name.toLowerCase())
                                                        );
                                                        const isWinner = serviceRequest.winnerSelection?.[item.id]?.quoteResponseId === quote.id;
                                                        return (
                                                            <td key={quote.id} className={`p-2 text-center border-l ${isWinner ? 'bg-blue-50' : ''}`}>
                                                                {quoteItem ? (
                                                                    <>
                                                                        <p className="font-bold">{formatCurrency(quoteItem.unitPrice)}</p>
                                                                        <QualityBadge quality={quoteItem.quality} />
                                                                    </>
                                                                ) : <span className="text-xs text-slate-400">No cotizado</span>}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-dark-gray">Justificación de Selección</h3>
                                <p className="text-sm text-slate-600 bg-slate-50 p-3 mt-2 rounded-md border italic">"{serviceRequest.finalJustification || 'Sin justificación.'}"</p>
                            </div>
                            {budgetCheck.isOverBudget && (
                                <div className="pt-2">
                                    <label htmlFor="overrun-justification" className="block text-sm font-medium text-slate-700">Justificación de Exceso Presupuestario (Obligatorio)</label>
                                    <textarea
                                        id="overrun-justification"
                                        rows={2}
                                        value={overrunJustification}
                                        onChange={(e) => setOverrunJustification(e.target.value)}
                                        className="mt-1 block w-full border border-red-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
                                        placeholder="Justifique por qué se debe aprobar esta OC a pesar de exceder el presupuesto..."
                                    ></textarea>
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-semibold text-dark-gray">Condiciones de Proveedores Seleccionados</h3>
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {winningQuotes.length > 0 ? winningQuotes.map(q => {
                                        const supplier = suppliers?.find(s => s.id === q.supplierId);
                                        return (
                                            <div key={q.id} className="border-2 border-primary rounded-lg p-3 bg-blue-50 shadow">
                                                <p className="font-bold text-primary">{q.supplierName}</p>
                                                <p className="text-sm text-slate-600">Condición Pago: <span className="font-semibold text-slate-800">{q.paymentTerms}</span></p>
                                                {q.pdfAttachmentName && (
                                                    <a href={q.pdfAttachmentBase64} download={q.pdfAttachmentName} className="text-red-500 flex items-center gap-1 text-sm hover:underline mt-1">
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 13.5l3 3m0 0l3-3m-3 3v-6m1.06-4.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                                                        Ver Cotización PDF
                                                    </a>
                                                )}
                                                {supplier && (
                                                    <div className="mt-2 pt-2 border-t border-slate-300 text-xs space-y-1">
                                                        <p className="text-slate-500">
                                                            <strong>Cuenta:</strong> <span className="font-medium text-slate-700 font-mono">{supplier.bankAccount}</span>
                                                        </p>
                                                        <p className="text-slate-500">
                                                            <strong>Email:</strong> <span className="font-medium text-slate-700">{supplier.email}</span>
                                                        </p>
                                                        <p className="text-slate-500">
                                                            <strong>Tel:</strong> <span className="font-medium text-slate-700">{supplier.phone}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    }) : <p className="text-sm text-slate-500 italic md:col-span-3">No hay proveedores seleccionados en el cuadro comparativo.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'management' && editableOrder && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="proformaNumber" className="block text-sm font-medium text-slate-700"># Proforma</label>
                                    <input type="text" id="proformaNumber" name="proformaNumber" value={editableOrder.proformaNumber || ''}
                                        readOnly
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-slate-100 text-slate-600 focus:outline-none focus:ring-0 cursor-not-allowed" />
                                </div>
                                {isSubcontractPO && (
                                    <div className="flex items-end">
                                        <button
                                            onClick={() => onCreateSubcontract(editableOrder)}
                                            disabled={!!editableOrder.subcontractId}
                                            className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                                        >
                                            {editableOrder.subcontractId ? `Vinculado a SC-${editableOrder.subcontractId}` : 'Generar Subcontrato'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <FileAttachmentRow label="OC Firmada" fileName={editableOrder.signedPoPdfName} fileBase64={editableOrder.signedPoPdfBase64} onFileChange={(e) => handleFileChange(e, 'signedPo')} inputId="signed-po-upload" />
                                <FileAttachmentRow label="Comprobantes" fileName={editableOrder.proofsPdfName} fileBase64={editableOrder.proofsPdfBase64} onFileChange={(e) => handleFileChange(e, 'proofs')} inputId="proofs-upload" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 pt-4 mt-4 border-t">
                    {isApprovalMode ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div> {/* Left column for rejection */}
                                <label htmlFor="rejectionReason" className="block text-sm font-medium text-slate-700">Razón de Rechazo (Opcional)</label>
                                <textarea id="rejectionReason" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Si rechaza, ingrese una razón clara..." className="w-full mt-1 p-2 border rounded-md" rows={3}></textarea>
                                <button onClick={handleReject} disabled={!rejectionReason.trim()} className="mt-2 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-slate-400">Rechazar Propuesta</button>
                            </div>
                            <div className="space-y-4 text-right"> {/* Right column for approval */}
                                <button
                                    onClick={handleApprove}
                                    disabled={
                                        (budgetCheck.isOverBudget && !overrunJustification.trim())
                                    }
                                    className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                                >
                                    Aprobar Orden de Compra
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                {canBeRejected && (
                                    <div className="flex flex-col items-start">
                                        <input
                                            type="text"
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Ingrese el motivo del rechazo aquí..."
                                            className="w-full md:w-96 p-2 border border-slate-300 rounded-md"
                                        />
                                        <button
                                            onClick={handleReject}
                                            disabled={!rejectionReason.trim()}
                                            className="mt-2 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-slate-400"
                                        >
                                            Confirmar Rechazo de Orden
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex-shrink-0 flex gap-4">
                                {purchaseOrder && purchaseOrder.status === POStatus.PendingFinancialApproval && onApprovePO && (
                                    <button onClick={() => onApprovePO(purchaseOrder)} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700">
                                        Aprobar Orden
                                    </button>
                                )}
                                <button onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg">Cerrar</button>
                                <button onClick={handleSave} disabled={isSaving} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark">
                                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
