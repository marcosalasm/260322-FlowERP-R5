
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { ServiceRequest, ServiceRequestStatus, POStatus, PurchaseOrder as PurchaseOrderType, PurchaseOrderItem, GoodsReceipt, GoodsReceiptStatus, AccountPayable, APStatus, PreOpExpense } from '../../types';
import { addDays } from 'date-fns';
import { PurchaseOrderDetailModal } from './PurchaseOrderDetailModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { apiService } from '../../services/apiService';
import { formatCurrency, formatNumber, formatQuantity } from '../../utils/format';

const PO_STATUS_COLORS: { [key: string]: string } = {
    [POStatus.PendingFinancialApproval]: 'bg-orange-200 text-orange-800',
    [POStatus.Approved]: 'bg-blue-200 text-blue-800',
    [POStatus.Issued]: 'bg-green-200 text-green-800',
    [POStatus.PartiallyReceived]: 'bg-yellow-200 text-yellow-800',
    [POStatus.FullyReceived]: 'bg-gray-400 text-gray-900',
    [POStatus.Cancelled]: 'bg-red-200 text-red-800',
    [POStatus.Rejected]: 'bg-red-200 text-red-800',
};

const PDFIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);


const PendingPOApprovalList: React.FC<{
    requests: ServiceRequest[];
    onViewDetails: (request: ServiceRequest) => void;
}> = ({ requests, onViewDetails }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID Solicitud</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proyecto / Prospecto</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Solicitante</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {requests.map(req => (
                        <tr key={req.id} className="hover:bg-slate-50 cursor-pointer" onDoubleClick={() => onViewDetails(req)}>
                            <td className="py-4 px-4 text-sm font-medium text-slate-900">#{req.id}</td>
                            <td className="py-4 px-4 text-sm">
                                {req.projectName}
                                {req.isPreOp && <span className="ml-2 px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[10px] font-bold">PRE-OP</span>}
                            </td>
                            <td className="py-4 px-4 text-sm">{req.requester}</td>
                            <td className="py-4 px-4 text-sm">
                                <button onClick={() => onViewDetails(req)} className="text-primary hover:text-primary-dark font-medium">
                                    Revisar y Aprobar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ActualPurchaseOrderList: React.FC<{
    orders: PurchaseOrderType[];
    onIssue: (poId: number) => void;
    onGeneratePDF: (order: PurchaseOrderType) => void;
    onViewDetails: (order: PurchaseOrderType) => void;
}> = ({ orders, onIssue, onGeneratePDF, onViewDetails }) => {

    const { can } = usePermissions();
    const canIssue = can('purchasing', 'orders', 'approve');

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID OC</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proveedor</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proyecto / Prospecto</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha Orden</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto Total</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {orders.map(po => (
                        <tr key={po.id} className="hover:bg-slate-50 cursor-pointer" onDoubleClick={() => onViewDetails(po)}>
                            <td className="py-4 px-4 text-sm font-medium text-slate-900">OC-{po.id}</td>
                            <td className="py-4 px-4 text-sm">{po.supplierName}</td>
                            <td className="py-4 px-4 text-sm font-medium">
                                {po.projectName}
                                {po.isPreOp && <span className="ml-2 px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[10px] font-bold">PRE-OP</span>}
                            </td>
                            <td className="py-4 px-4 text-sm">{po.orderDate}</td>
                            <td className="py-4 px-4 text-sm font-mono">{formatCurrency(po.totalAmount)}</td>
                            <td className="py-4 px-4">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${PO_STATUS_COLORS[po.status] || 'bg-gray-200 text-gray-800'}`}>
                                    {po.status}
                                </span>
                            </td>
                            <td className="py-4 px-4 text-sm">
                                <div className="flex items-center space-x-2">
                                    {canIssue && po.status === POStatus.Approved && (
                                        <button onClick={(e) => { e.stopPropagation(); onIssue(po.id); }} className="text-blue-600 hover:text-blue-900 font-medium text-sm">Emitir a Proveedor</button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); onViewDetails(po) }} className="text-primary hover:text-primary-dark font-medium text-sm">Ver Detalle</button>
                                    <button onClick={(e) => { e.stopPropagation(); onGeneratePDF(po); }} className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-100" title="Generar PDF">
                                        <PDFIcon />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {orders.length === 0 && (
                <p className="text-center text-slate-500 py-8">No hay órdenes de compra que coincidan con los filtros.</p>
            )}
        </div>
    );
};

interface PurchaseOrderListProps {
    orders: PurchaseOrderType[];
    onCreateSubcontract: (po: PurchaseOrderType) => void;
}

export const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({ orders, onCreateSubcontract }) => {
    const appContext = useContext(AppContext);
    const { can } = usePermissions();
    const { showToast } = useToast();
    const { addNotification } = useNotifications();
    const [detailModalItem, setDetailModalItem] = useState<ServiceRequest | PurchaseOrderType | null>(null);

    if (!appContext) return null;

    const {
        user, serviceRequests, setServiceRequests, purchaseOrders, setPurchaseOrders,
        goodsReceipts, setGoodsReceipts, accountsPayable, setAccountsPayable,
        quoteResponses, suppliers, companyInfo, preOpRubros, preOpExpenses, setPreOpExpenses,
        projects
    } = appContext;

    const pendingApprovals = useMemo(() => serviceRequests.filter(
        req => req.status === ServiceRequestStatus.POPendingApproval
    ), [serviceRequests]);

    const sortedPurchaseOrders = useMemo(() =>
        [...orders].sort((a, b) => b.id - a.id),
        [orders]);

    const handleViewDetails = (item: ServiceRequest | PurchaseOrderType) => {
        setDetailModalItem(item);
    };

    const handleApproveProposal = async (request: ServiceRequest, overrunJustification?: string) => {
        try {
            if (!request.winnerSelection) return;

            const itemsBySupplier = Object.entries(request.winnerSelection).reduce((acc, [itemId, winnerInfo]) => {
                const item = (request.items || []).find(i => i.id === Number(itemId));
                const quoteResponse = (quoteResponses || []).find(qr => qr.id === (winnerInfo as any).quoteResponseId);
                const quoteLineItem = (quoteResponse?.items || []).find(qli => qli.serviceRequestItemId === Number(itemId));

                if (item && quoteResponse && quoteLineItem) {
                    if (!acc[(winnerInfo as any).supplierId]) {
                        acc[(winnerInfo as any).supplierId] = {
                            items: [],
                            deliveryDays: quoteResponse.deliveryDays,
                            proformaNumber: quoteResponse.quoteNumber,
                            paymentTerms: quoteResponse.paymentTerms
                        };
                    }
                    acc[(winnerInfo as any).supplierId].items.push({
                        ...item,
                        unitPrice: quoteLineItem.unitPrice,
                    });
                }
                return acc;
            }, {} as { [supplierId: string]: { items: PurchaseOrderItem[], deliveryDays: number, proformaNumber?: string, paymentTerms: string } });

            const newPOs: PurchaseOrderType[] = [];
            const newAPs: AccountPayable[] = [];

            for (const supplierId in itemsBySupplier) {
                const supplierData = itemsBySupplier[supplierId];
                const supplier = suppliers.find(s => s.id === Number(supplierId));
                if (!supplier) continue;

                // FIX: Impuestos ya incluidos en precio unitario de cotización. No se recalculan impuestos adicionales.
                const subtotal = supplierData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
                const iva = 0;
                const discount = 0;
                const totalAmount = subtotal;

                const paymentTermsString = supplierData.paymentTerms;

                const newPOData: Omit<PurchaseOrderType, 'id'> = {
                    serviceRequestId: request.id,
                    projectId: request.projectId,
                    projectName: request.projectName,
                    supplierId: supplier.id,
                    supplierName: supplier.name,
                    orderDate: new Date().toISOString().split('T')[0],
                    expectedDeliveryDate: addDays(new Date(), supplierData.deliveryDays).toISOString().split('T')[0],
                    items: supplierData.items,
                    subtotal,
                    discount,
                    iva,
                    totalAmount,
                    status: POStatus.PendingFinancialApproval,
                    paymentTerms: paymentTermsString,
                    proformaNumber: supplierData.proformaNumber,
                    isPreOp: request.isPreOp,
                    prospectId: request.prospectId,
                };
                const savedPO = await apiService.createPurchaseOrder(newPOData);
                newPOs.push(savedPO);

                let creditDays = 0;
                if (paymentTermsString.toLowerCase().includes('crédito')) {
                    const daysMatch = paymentTermsString.match(/\d+/); // find number of days
                    creditDays = daysMatch ? parseInt(daysMatch[0], 10) : 30; // fallback to 30
                }
                const dueDate = addDays(new Date(savedPO.orderDate), creditDays).toISOString().split('T')[0];

                const newAPData: Omit<AccountPayable, 'id'> = {
                    purchaseOrderId: savedPO.id,
                    supplierId: savedPO.supplierId,
                    supplierName: savedPO.supplierName,
                    invoiceNumber: `PENDIENTE-OC-${savedPO.id}`,
                    invoiceDate: savedPO.orderDate,
                    dueDate: dueDate,
                    totalAmount: savedPO.totalAmount,
                    paidAmount: 0,
                    payments: [],
                    status: APStatus.PendingPayment,
                };
                const savedAP = await apiService.createAccountPayable(newAPData);
                newAPs.push(savedAP);
            }

            // --- NEW PRE-OP AUTOMATION ---
            if (request.isPreOp && request.prospectId) {
                const totalPreOp = newPOs.reduce((sum, po) => sum + po.totalAmount, 0);
                const firstRubroId = preOpRubros.length > 0 ? preOpRubros[0].id : 0;

                const newPreOpEntryData: Omit<PreOpExpense, 'id'> = {
                    prospectId: request.prospectId,
                    prospectName: request.projectName.replace('GASTO PRE-OP: ', ''),
                    fecha: new Date().toISOString().split('T')[0],
                    totalGasto: totalPreOp,
                    status: 'Registrado',
                    desglose: { [firstRubroId]: totalPreOp }
                };
                const savedPreOp = await apiService.createPreOpExpense(newPreOpEntryData);
                setPreOpExpenses(prev => [savedPreOp, ...prev]);
                addNotification(`Se ha registrado automáticamente un Gasto Pre-operativo de ${formatCurrency(totalPreOp)} para el prospecto.`);
            }

            let finalJustification = request.finalJustification || '';
            if (overrunJustification) {
                finalJustification += `\n\n--- Justificación de Exceso Presupuestario ---\n${overrunJustification}`;
            }

            setPurchaseOrders(prev => [...newPOs, ...prev]);
            if (newAPs.length > 0) {
                setAccountsPayable(prev => [...newAPs, ...prev]);
            }

            const updatedSR = {
                ...request,
                status: ServiceRequestStatus.POApproved,
                finalJustification: finalJustification.trim()
            };
            const savedSR = await apiService.updateServiceRequest(request.id, updatedSR);
            setServiceRequests(prev => prev.map(r => r.id === savedSR.id ? savedSR : r));

            setDetailModalItem(null); // Close modal on success
            showToast('Propuesta aprobada y Órdenes de Compra generadas.', 'success');
        } catch (error) {
            console.error('Error approving proposal:', error);
            showToast('Error al aprobar la propuesta.', 'error');
        }
    };

    const handleRejection = async (item: ServiceRequest | PurchaseOrderType, reason: string) => {
        try {
            if ('requester' in item) { // It's a ServiceRequest
                const request = item;
                const updatedRequest = {
                    ...request,
                    status: ServiceRequestStatus.InQuotation,
                    finalJustification: undefined,
                    winnerSelection: undefined,
                };
                const savedRequest = await apiService.updateServiceRequest(request.id, updatedRequest);
                setServiceRequests(prev => prev.map(r => r.id === savedRequest.id ? savedRequest : r));
                showToast(`Propuesta Rechazada. Se ha notificado al solicitante y a proveeduría.`, 'info');
            } else { // It's a PurchaseOrder
                const poToReject = item;
                const serviceRequest = serviceRequests.find(sr => sr.id === poToReject.serviceRequestId);
                if (!serviceRequest) {
                    showToast('Error: No se encontró la solicitud de servicio asociada.', 'error');
                    return;
                }

                // 1. Update PO
                const updatedPO = { ...poToReject, status: POStatus.Rejected, rejectionReason: reason };
                const savedPO = await apiService.updatePurchaseOrder(poToReject.id, updatedPO);
                setPurchaseOrders(prev => prev.map(po => po.id === savedPO.id ? savedPO : po));

                // 2. Revert Service Request
                const updatedSR = {
                    ...serviceRequest,
                    status: ServiceRequestStatus.InQuotation,
                    winnerSelection: undefined,
                    finalJustification: undefined,
                    rejectionHistory: [
                        ...(serviceRequest.rejectionHistory || []),
                        { date: new Date().toISOString(), user: user.name, reason }
                    ]
                };
                const savedSR = await apiService.updateServiceRequest(serviceRequest.id, updatedSR);
                setServiceRequests(prev => prev.map(sr => sr.id === savedSR.id ? savedSR : sr));

                // 3. Delete associated AP and GR
                const associatedAP = accountsPayable.find(ap => ap.purchaseOrderId === poToReject.id);
                if (associatedAP && associatedAP.paidAmount === 0 && (associatedAP.payments || []).length === 0) {
                    await apiService.deleteAccountPayable(associatedAP.id);
                    setAccountsPayable(prev => prev.filter(ap => ap.id !== associatedAP.id));
                }

                const associatedGR = goodsReceipts.find(gr => gr.purchaseOrderId === poToReject.id);
                if (associatedGR) {
                    await apiService.deleteGoodsReceipt(associatedGR.id);
                    setGoodsReceipts(prev => prev.filter(gr => gr.id !== associatedGR.id));
                }

                // 4. Notify
                addNotification(`La OC #${poToReject.id} para el proveedor ${poToReject.supplierName} fue rechazada. Razón: ${reason}. La solicitud #${serviceRequest.id} ha vuelto a cotización.`);
                showToast(`Orden de Compra #${poToReject.id} rechazada.`, 'success');
            }
            setDetailModalItem(null); // Close modal on success
        } catch (error) {
            console.error('Error rejecting item:', error);
            showToast('Error al procesar el rechazo.', 'error');
        }
    };

    const handleIssuePO = async (poId: number) => {
        try {
            const issuedPO = purchaseOrders.find(po => po.id === poId);
            if (!issuedPO) return;

            const updatedPO = { ...issuedPO, status: POStatus.Issued };
            const savedPO = await apiService.updatePurchaseOrder(poId, updatedPO);
            setPurchaseOrders(prev => prev.map(po => po.id === poId ? savedPO : po));

            // Generate a new Goods Receipt record
            const newReceipt: Omit<GoodsReceipt, 'id'> = {
                purchaseOrderId: poId,
                creationDate: new Date().toISOString().split('T')[0],
                expectedReceiptDate: issuedPO.expectedDeliveryDate,
                items: issuedPO.items.map(item => ({
                    purchaseOrderItemId: item.id,
                    name: item.name,
                    quantityOrdered: item.quantity,
                    unit: item.unit,
                    quantityReceived: 0,
                })),
                status: GoodsReceiptStatus.Pending,
            };
            const savedReceipt = await apiService.createGoodsReceipt(newReceipt);
            setGoodsReceipts(prev => [savedReceipt, ...prev]);
            showToast(`OC #${poId} emitida y recepción generada.`, 'success');
        } catch (error) {
            console.error('Error issuing PO:', error);
            showToast('Error al emitir la Orden de Compra.', 'error');
        }
    };

    const handleUpdatePO = async (updatedOrder: PurchaseOrderType) => {
        try {
            const saved = await apiService.updatePurchaseOrder(updatedOrder.id, updatedOrder);
            setPurchaseOrders(prev => prev.map(po => po.id === saved.id ? saved : po));
            showToast(`Orden de Compra #${saved.id} actualizada.`, 'success');
        } catch (error) {
            console.error('Error updating PO:', error);
            showToast('Error al actualizar la Orden de Compra.', 'error');
        }
    };

    const handleGeneratePDF = async (order: PurchaseOrderType) => {
        try {
            // ── Validate required data ────────────────────────────────────
            if (!order.items || order.items.length === 0) {
                showToast('La Orden de Compra no tiene ítems para generar el PDF.', 'error');
                return;
            }

            const ci = companyInfo; // alias for brevity & null safety

            const doc = new jsPDF();
            const margin = 20;
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let startY = 20;

            const fmt = (value: number) => formatNumber(value, 2, 2);

            // ── Header: Logo (loaded asynchronously) ──────────────────────
            if (ci?.logoBase64) {
                try {
                    // Load the image into an HTMLImageElement so we can read
                    // its natural dimensions before handing it to jsPDF.
                    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                        const el = new Image();
                        el.onload = () => resolve(el);
                        el.onerror = (err) => reject(err);
                        el.src = ci.logoBase64!;
                    });

                    const logoHeight = 20;
                    const aspect = img.naturalWidth / img.naturalHeight || 1;
                    const logoWidth = logoHeight * aspect;
                    doc.addImage(img, 'PNG', margin, startY, logoWidth, logoHeight);
                } catch (logoErr) {
                    console.warn('No se pudo agregar el logo al PDF:', logoErr);
                    // Continue without logo – not a fatal error
                }
            }

            // Title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('ORDEN DE COMPRA', pageWidth - margin, startY + 8, { align: 'right' });

            startY += 25;
            doc.setDrawColor(200);
            doc.line(margin, startY, pageWidth - margin, startY);
            startY += 10;

            // ── Info Columns ──────────────────────────────────────────────
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            // Left column: Order Info
            const project = projects?.find(p => p.id === order.projectId);
            const displayProjectName = project?.name || order.projectName || 'Desconocido';

            doc.text(`FECHA: ${order.orderDate}`, margin, startY);
            doc.text(`ID OC (No. REFERENCIA): ${order.id}`, margin, startY + 5);
            const projectLines = doc.splitTextToSize(`PROYECTO: ${displayProjectName}`, 80);
            doc.text(projectLines, margin, startY + 10);

            let currentStateY = startY + 10 + (projectLines.length * 5);
            if (order.status === POStatus.Approved || order.status === POStatus.Issued) {
                doc.setFont('helvetica', 'bold');
                doc.text('ESTADO: APROBADA', margin, currentStateY);
                doc.setFont('helvetica', 'normal');
                currentStateY += 5;
            }

            // Right column: Supplier Info
            const rightColX = pageWidth - margin - 70;
            const rightValueX = pageWidth - margin;

            doc.text('PROVEEDOR:', rightColX, startY);
            doc.text(order.supplierName || 'N/A', rightValueX, startY, { align: 'right' });

            doc.text('FORMA DE PAGO:', rightColX, startY + 5);
            doc.text(order.paymentTerms || 'N/A', rightValueX, startY + 5, { align: 'right' });

            doc.text('# PROFORMA:', rightColX, startY + 10);
            doc.text(order.proformaNumber || 'N/A', rightValueX, startY + 10, { align: 'right' });

            startY = Math.max(currentStateY, startY + 20) + 10;

            // ── Billing Info ──────────────────────────────────────────────
            if (ci) {
                doc.setFont('helvetica', 'bold');
                doc.text('DATOS DE FACTURACIÓN:', margin, startY);
                doc.setFont('helvetica', 'normal');
                doc.text(`Nombre: ${ci.name || ''}`, margin, startY + 5);
                doc.text(`Cédula Jurídica: ${ci.legalId || ''}`, margin, startY + 10);
                doc.text(`Correo: ${ci.email || ''}`, margin, startY + 15);
                doc.text(`Teléfono: ${ci.phone || ''}`, margin, startY + 20);
                const addrLines = doc.splitTextToSize(`Dirección: ${ci.address || ''}`, pageWidth - margin * 2);
                doc.text(addrLines, margin, startY + 25);
                startY += 30 + (addrLines.length > 1 ? (addrLines.length - 1) * 4 : 0);
            }

            startY += 5;

            // ── Items Table (auto-paginates via jspdf-autotable) ──────────
            autoTable(doc, {
                startY,
                margin: { left: margin, right: margin },
                head: [['DESCRIPCIÓN', 'CANT', 'UND', 'UNITARIO', 'MONTO TOTAL']],
                body: order.items.map(item => [
                    item.name || '',
                    formatQuantity(item.quantity),
                    item.unit || '',
                    `¢${fmt(item.unitPrice ?? 0)}`,
                    `¢${fmt((item.quantity ?? 0) * (item.unitPrice ?? 0))}`,
                ]),
                headStyles: { fillColor: [59, 130, 246], halign: 'center' },
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    1: { halign: 'right', cellWidth: 20 },
                    2: { halign: 'center', cellWidth: 20 },
                    3: { halign: 'right', cellWidth: 32 },
                    4: { halign: 'right', cellWidth: 38 },
                },
            });

            // ── Totals ────────────────────────────────────────────────────
            let finalY = (doc as any).lastAutoTable.finalY + 10;
            const totalXLabel = pageWidth - margin - 55;
            const totalXValue = pageWidth - margin;

            // If totals won't fit on the current page, add a new one
            if (finalY + 30 > pageHeight) {
                doc.addPage();
                finalY = margin;
            }

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Subtotal:', totalXLabel, finalY);
            doc.text(`¢${fmt(order.subtotal ?? 0)}`, totalXValue, finalY, { align: 'right' });

            doc.text('Descuento:', totalXLabel, finalY + 6);
            doc.text(`¢${fmt(order.discount ?? 0)}`, totalXValue, finalY + 6, { align: 'right' });

            doc.text('IVA (Incluido):', totalXLabel, finalY + 12);
            doc.text(`¢${fmt(order.iva ?? 0)}`, totalXValue, finalY + 12, { align: 'right' });

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('MONTO TOTAL:', totalXLabel, finalY + 20);
            doc.text(`¢${fmt(order.totalAmount ?? 0)}`, totalXValue, finalY + 20, { align: 'right' });

            // ── Signatures & Notes ────────────────────────────────────────
            // Load custom notes from configuration (localStorage / API)
            let notesBlock: string[];
            try {
                const stored = localStorage.getItem('flowerp_document_notes');
                const docNotes = stored ? JSON.parse(stored) : null;
                if (docNotes && docNotes['orden_compra'] && docNotes['orden_compra'].length > 0) {
                    notesBlock = docNotes['orden_compra']
                        .filter((n: string) => n.trim())
                        .map((n: string) => n.replace('${ci?.phone}', ci?.phone || 'N/A').replace('${phone}', ci?.phone || 'N/A'));
                } else {
                    // Fallback defaults
                    notesBlock = [
                        'Sin firma de un representante legal el presente documento carece de validez.',
                        'Se debe indicar en la factura el nombre del proyecto y el consecutivo o número de referencia de la orden de compra.',
                        'Los pagos se realizarán los viernes siempre y cuando la respectiva factura haya sido emitida.',
                        `Para contactarse con nosotros lo puede hacer al teléfono ${ci?.phone || 'N/A'}.`,
                    ];
                }
            } catch {
                notesBlock = [
                    'Sin firma de un representante legal el presente documento carece de validez.',
                    'Se debe indicar en la factura el nombre del proyecto y el consecutivo o número de referencia de la orden de compra.',
                    'Los pagos se realizarán los viernes siempre y cuando la respectiva factura haya sido emitida.',
                    `Para contactarse con nosotros lo puede hacer al teléfono ${ci?.phone || 'N/A'}.`,
                ];
            }

            // Estimate how much vertical space the footer needs (~50 px)
            const footerHeight = 20 + 5 + 15 + notesBlock.length * 8;
            let bottomY = finalY + 35;

            // If the footer doesn't fit, add a new page
            if (bottomY + footerHeight > pageHeight) {
                doc.addPage();
                bottomY = margin;
            }

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.line(margin, bottomY, margin + 50, bottomY);
            doc.text('Firmas autorizadas', margin, bottomY + 5);

            doc.setFont('helvetica', 'bold');
            doc.text('NOTAS GENERALES:', margin, bottomY + 15);
            doc.setFont('helvetica', 'normal');

            let noteY = bottomY + 20;
            notesBlock.forEach(note => {
                const splitNote = doc.splitTextToSize(`• ${note}`, pageWidth - margin * 2);
                // Check if the note overflows the page
                if (noteY + splitNote.length * 4 > pageHeight - 10) {
                    doc.addPage();
                    noteY = margin;
                }
                doc.text(splitNote, margin, noteY);
                noteY += splitNote.length * 4 + 1;
            });

            // ── Save / Download ───────────────────────────────────────────
            // Sanitize the file name: remove characters that are invalid in file names
            const safeName = (order.supplierName || 'Proveedor')
                .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ _-]/g, '')
                .replace(/\s+/g, '_')
                .substring(0, 60);
            const fileName = `OC-${order.id}_${safeName}.pdf`;

            doc.save(fileName);
            showToast(`PDF generado: ${fileName}`, 'success');
        } catch (err) {
            console.error('Error al generar PDF de Orden de Compra:', err);
            showToast('Error al generar el PDF. Revise la consola para más detalles.', 'error');
        }
    };

    const canApproveProposals = can('purchasing', 'orders', 'approve');

    const handleApprovePO = async (po: PurchaseOrderType) => {
        try {
            const saved = await apiService.updatePurchaseOrder(po.id, { status: POStatus.Approved });
            setPurchaseOrders(prev => prev.map(p => p.id === saved.id ? saved : p));

            // Create Account Payable
            let creditDays = 0;
            if ((po.paymentTerms || '').toLowerCase().includes('crédito')) {
                const daysMatch = (po.paymentTerms || '').match(/\d+/);
                creditDays = daysMatch ? parseInt(daysMatch[0], 10) : 30;
            }
            const dueDate = addDays(new Date(saved.orderDate), creditDays).toISOString().split('T')[0];

            const newAPData: Omit<AccountPayable, 'id'> = {
                purchaseOrderId: saved.id,
                supplierId: saved.supplierId,
                supplierName: saved.supplierName,
                invoiceNumber: `PENDIENTE-OC-${saved.id}`,
                invoiceDate: saved.orderDate,
                dueDate: dueDate,
                totalAmount: saved.totalAmount,
                paidAmount: 0,
                payments: [],
                status: APStatus.PendingPayment,
            };
            const savedAP = await apiService.createAccountPayable(newAPData);
            setAccountsPayable(prev => [...prev, savedAP]);

            showToast(`Orden de Compra #${saved.id} aprobada y cuenta por pagar generada.`, 'success');
            setDetailModalItem(null);
        } catch (error) {
            console.error('Error approving PO:', error);
            showToast('Error al aprobar la Orden de Compra.', 'error');
        }
    };

    return (
        <>
            <div className="space-y-8">
                {canApproveProposals && pendingApprovals.length > 0 && (
                    <div>
                        <h3 className="text-xl font-semibold text-dark-gray mb-2">Propuestas Pendientes de Aprobación</h3>
                        <p className="text-sm text-slate-500 mb-4">Revise las siguientes selecciones de proveedores y apruebe para generar las Órdenes de Compra.</p>
                        <div className="border rounded-lg overflow-hidden">
                            <PendingPOApprovalList requests={pendingApprovals} onViewDetails={handleViewDetails} />
                        </div>
                    </div>
                )}

                <div>
                    <h3 className="text-xl font-semibold text-dark-gray mb-4">Historial de Órdenes de Compra</h3>
                    <div className="border rounded-lg overflow-hidden">
                        <ActualPurchaseOrderList
                            orders={sortedPurchaseOrders}
                            onIssue={handleIssuePO}
                            onGeneratePDF={handleGeneratePDF}
                            onViewDetails={handleViewDetails}
                        />
                    </div>
                </div>
            </div>
            <PurchaseOrderDetailModal
                isOpen={!!detailModalItem}
                onClose={() => setDetailModalItem(null)}
                item={detailModalItem}
                onSave={handleUpdatePO}
                onApprove={handleApproveProposal}
                onReject={handleRejection}
                onCreateSubcontract={onCreateSubcontract}
                onApprovePO={handleApprovePO}
            />
        </>
    );
};
