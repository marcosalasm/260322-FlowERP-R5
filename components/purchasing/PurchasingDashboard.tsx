
import React, { useState, useMemo, useContext, useCallback } from 'react';
import { Card } from '../shared/Card';
import { ServiceRequest, ServiceRequestStatus, PurchaseOrder, POStatus, QuoteResponse, PurchaseOrder as PurchaseOrderType, WinnerSelection, GoodsReceipt, CreditNote, CreditNoteItem, CreditNoteStatus, InventoryAdjustmentLog, AccountPayable, Payment, APStatus, GoodsReceiptStatus, ProjectStatus, Subcontract, PreOpRubro, PreOpExpense } from '../../types';
import { AppContext } from '../../context/AppContext';
import { NewServiceRequestModal } from './NewServiceRequestModal';
import { ServiceRequestList } from './ServiceRequestList';
import { QuoteList } from './QuoteList';
import { PurchaseOrderList } from './PurchaseOrderList';
import { GoodsReceiptList } from './GoodsReceiptList';
import { CreditNoteList } from './CreditNoteList';
import { AccountsPayableList } from './AccountsPayableList';
import { ExpenseControl } from './ExpenseControl';
import { EditServiceRequestModal } from './EditServiceRequestModal';
import { QuoteManagementModal } from './QuoteManagementModal';
import { ComparativeChartModal } from './ComparativeChartModal';
import { GoodsReceiptDetailModal } from './GoodsReceiptDetailModal';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { CreditNoteDetailModal } from './CreditNoteDetailModal';
import { apiService } from '../../services/apiService';
import { usePermissions } from '../../hooks/usePermissions';
import { AddPayablePaymentModal } from './AddPayablePaymentModal';
import { PayablePaymentHistoryModal } from './PayablePaymentHistoryModal';
import { addDays, isWithinInterval } from 'date-fns';
import { FilterBar, FilterState } from './FilterBar';
import { SubcontractProgressModal } from './SubcontractProgressModal';
import { PreOpExpensesList } from './PreOpExpensesList';
import { NewPreOpExpenseModal } from './NewPreOpExpenseModal';
import { PreOpConfigModal } from './PreOpConfigModal';
import { NewCreditNoteModal } from './NewCreditNoteModal';


type PurchaseView = 'requests' | 'quotes' | 'orders' | 'receipts' | 'notes' | 'payables' | 'preop' | 'expenses';

const purchasingViews: { key: PurchaseView; label: string }[] = [
    { key: 'requests', label: 'Solicitud de Bienes/Servicios' },
    { key: 'quotes', label: 'Solicitud de Cotización' },
    { key: 'orders', label: 'Órdenes de Compra' },
    { key: 'receipts', label: 'Recepción de Bienes/Servicios' },
    { key: 'notes', label: 'Notas de Crédito' },
    { key: 'payables', label: 'Cuentas por Pagar' },
    { key: 'preop', label: 'Registrar Gastos' },
    { key: 'expenses', label: 'Control de Gastos' },
];

const PurchasingDashboard: React.FC = () => {
    const appContext = useContext(AppContext);
    const { can } = usePermissions();

    if (!appContext) return null;

    const {
        user, roles,
        serviceRequests, setServiceRequests,
        quoteResponses, setQuoteResponses,
        purchaseOrders, setPurchaseOrders,
        accountsPayable, setAccountsPayable,
        goodsReceipts, setGoodsReceipts,
        creditNotes, setCreditNotes,
        subcontracts, setSubcontracts,
        projects, materials, setMaterials,
        serviceItems, recurringOrderTemplates,
        offers, budgets, changeOrders,
        inventoryAdjustmentLogs, setInventoryAdjustmentLogs,
        suppliers, companyInfo, prospects,
        preOpRubros, setPreOpRubros,
        preOpExpenses, setPreOpExpenses
    } = appContext;

    const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
    const [isEditRequestModalOpen, setIsEditRequestModalOpen] = useState(false);
    const [isQuoteManagementModalOpen, setIsQuoteManagementModalOpen] = useState(false);
    const [isComparativeChartModalOpen, setIsComparativeChartModalOpen] = useState(false);
    const [isReceiptDetailModalOpen, setIsReceiptDetailModalOpen] = useState(false);
    const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
    const [isAddPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
    const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
    const [isSubcontractProgressModalOpen, setIsSubcontractProgressModalOpen] = useState(false);
    const [isNewPreOpModalOpen, setIsNewPreOpModalOpen] = useState(false);
    const [isPreOpConfigModalOpen, setIsPreOpConfigModalOpen] = useState(false);
    const [isNewCreditNoteModalOpen, setIsNewCreditNoteModalOpen] = useState(false);

    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null);
    const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNote | null>(null);
    const [selectedPayable, setSelectedPayable] = useState<AccountPayable | null>(null);
    const [receiptForCreditNote, setReceiptForCreditNote] = useState<GoodsReceipt | null>(null);
    const [selectedPreOpExpense, setSelectedPreOpExpense] = useState<PreOpExpense | null>(null);

    const [filters, setFilters] = useState<FilterState>({});
    const [activeView, setActiveView] = useState<PurchaseView>('requests');
    const { showToast } = useToast();
    const { addNotification } = useNotifications();


    const handleFilterChange = useCallback((newFilters: FilterState) => {
        setFilters(newFilters);
    }, []);

    const updateRequestStatus = useCallback(async (id: number, newStatus: ServiceRequestStatus, payload?: { overrunJustification?: string; rejectionHistory?: any; }) => {
        try {
            const req = serviceRequests.find(r => r.id === id);
            if (!req) return;

            const updatedReq = { ...req, status: newStatus, ...payload };
            const saved = await apiService.updateServiceRequest(id, updatedReq);

            setServiceRequests(prevRequests =>
                prevRequests.map(r => r.id === id ? saved : r)
            );
        } catch (error) {
            console.error('Error updating request status:', error);
            showToast('Error al actualizar el estado de la solicitud.', 'error');
        }
    }, [serviceRequests, setServiceRequests]);

    const handleAddRequest = async (newRequestData: Omit<ServiceRequest, 'id'>) => {
        try {
            const savedRequest = await apiService.createServiceRequest(newRequestData);
            setServiceRequests(prev => [savedRequest, ...prev]);
            setIsNewRequestModalOpen(false);
            showToast('Solicitud creada exitosamente.', 'success');
        } catch (error) {
            console.error('Error adding request:', error);
            showToast('Error al crear la solicitud.', 'error');
            throw error; // Re-throw to inform the modal
        }
    };

    const handleOpenEditModal = useCallback((request: ServiceRequest) => {
        setSelectedRequest(request);
        setIsEditRequestModalOpen(true);
    }, []);

    const handleUpdateRequest = async (updatedRequest: ServiceRequest) => {
        try {
            const savedRequest = await apiService.updateServiceRequest(updatedRequest.id, updatedRequest);
            setServiceRequests(prev => prev.map(req => req.id === savedRequest.id ? savedRequest : req));
            setIsEditRequestModalOpen(false);
            setSelectedRequest(null);
            showToast(`Solicitud #${savedRequest.id} actualizada correctamente.`, 'success');
        } catch (error) {
            console.error('Error updating request:', error);
            showToast('Error al actualizar la solicitud.', 'error');
        }
    };

    const handleOpenQuoteManagementModal = useCallback((request: ServiceRequest) => {
        setSelectedRequest(request);
        // Ensure the request status allows for quotation management
        if (request.status === ServiceRequestStatus.Approved) {
            updateRequestStatus(request.id, ServiceRequestStatus.InQuotation);
        }
        setIsQuoteManagementModalOpen(true);
    }, [updateRequestStatus]);

    const handleOpenComparativeChartModal = useCallback((request: ServiceRequest) => {
        setSelectedRequest(request);
        setIsQuoteManagementModalOpen(false); // Close management modal
        setIsComparativeChartModalOpen(true); // Open chart modal
    }, []);

    const handleAddQuoteResponse = async (newQuote: Omit<QuoteResponse, 'id'>) => {
        try {
            const saved = await apiService.createQuoteResponse(newQuote);
            setQuoteResponses(prev => [...prev, saved]);
            showToast(`Cotización de ${newQuote.supplierName} agregada.`, 'success');
        } catch (error) {
            console.error('Error adding quote:', error);
            showToast('Error al agregar la cotización.', 'error');
        }
    };

    const handleUpdateQuoteResponse = async (updatedQuote: QuoteResponse) => {
        try {
            const saved = await apiService.updateQuoteResponse(updatedQuote.id, updatedQuote);
            setQuoteResponses(prev => prev.map(q => q.id === saved.id ? saved : q));
            showToast(`Cotización de ${updatedQuote.supplierName} fue actualizada.`, 'success');
            addNotification(`El proveedor ${updatedQuote.supplierName} actualizó su cotización para la solicitud #${updatedQuote.serviceRequestId}.`);
        } catch (error) {
            console.error('Error updating quote:', error);
            showToast('Error al actualizar la cotización.', 'error');
        }
    };

    const handleSelectWinners = async (serviceRequestId: number, winners: WinnerSelection, justification: string) => {
        try {
            const req = serviceRequests.find(r => r.id === serviceRequestId);
            if (!req) return;

            const itemsBySupplier = Object.entries(winners).reduce((acc, [itemId, winnerInfo]) => {
                const item = (req.items || []).find(i => i.id === Number(itemId));
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
            }, {} as { [supplierId: string]: { items: any[], deliveryDays: number, proformaNumber?: string, paymentTerms: string } });

            const newPOs: PurchaseOrder[] = [];
            const newAPs: AccountPayable[] = [];

            for (const supplierId in itemsBySupplier) {
                const supplierData = itemsBySupplier[supplierId];
                const supplier = suppliers.find(s => s.id === Number(supplierId));
                if (!supplier) continue;

                const subtotal = supplierData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
                const paymentTermsString = supplierData.paymentTerms;

                const newPOData: Omit<PurchaseOrder, 'id'> = {
                    serviceRequestId: req.id,
                    projectId: req.projectId,
                    projectName: req.projectName,
                    supplierId: supplier.id,
                    supplierName: supplier.name,
                    orderDate: new Date().toISOString().split('T')[0],
                    expectedDeliveryDate: addDays(new Date(), supplierData.deliveryDays).toISOString().split('T')[0],
                    items: supplierData.items,
                    subtotal,
                    discount: 0,
                    iva: 0,
                    totalAmount: subtotal,
                    status: POStatus.Approved,
                    paymentTerms: paymentTermsString,
                    proformaNumber: supplierData.proformaNumber,
                    isPreOp: req.isPreOp,
                    prospectId: req.prospectId,
                };
                const savedPO = await apiService.createPurchaseOrder(newPOData);
                newPOs.push(savedPO);

                let creditDays = 0;
                if (paymentTermsString.toLowerCase().includes('crédito')) {
                    const daysMatch = paymentTermsString.match(/\d+/);
                    creditDays = daysMatch ? parseInt(daysMatch[0], 10) : 30;
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

            if (req.isPreOp && req.prospectId && newPOs.length > 0 && typeof preOpRubros !== 'undefined' && typeof apiService.createPreOpExpense !== 'undefined') {
                const totalPreOp = newPOs.reduce((sum, po) => sum + po.totalAmount, 0);
                const firstRubroId = preOpRubros.length > 0 ? preOpRubros[0].id : 0;
                const newPreOpEntryData: Omit<PreOpExpense, 'id'> = {
                    prospectId: req.prospectId,
                    prospectName: req.projectName.replace('GASTO PRE-OP: ', ''),
                    fecha: new Date().toISOString().split('T')[0],
                    totalGasto: totalPreOp,
                    status: 'Registrado',
                    desglose: { [firstRubroId]: totalPreOp }
                };
                try {
                    const savedPreOp = await apiService.createPreOpExpense(newPreOpEntryData);
                    setPreOpExpenses(prev => [savedPreOp, ...prev]);
                    addNotification(`Se ha registrado automáticamente un Gasto Pre-operativo de $${totalPreOp} para el prospecto.`);
                } catch (e) {
                    console.error("Error creating Pre-Op Expense", e);
                }
            }

            setPurchaseOrders(prev => [...newPOs, ...prev]);
            if (newAPs.length > 0) {
                setAccountsPayable(prev => [...newAPs, ...prev]);
            }

            const updatedReq = {
                ...req,
                status: ServiceRequestStatus.POApproved,
                finalJustification: justification,
                winnerSelection: winners
            };

            const saved = await apiService.updateServiceRequest(serviceRequestId, updatedReq);
            setServiceRequests(prev => prev.map(r => r.id === serviceRequestId ? saved : r));

            setIsComparativeChartModalOpen(false);
            setSelectedRequest(null);
            showToast('Órdenes de Compra generadas y solicitud aprobada.', 'success');
        } catch (error) {
            console.error('Error selecting winners:', error);
            showToast('Error al procesar la aprobación y crear OC.', 'error');
        }
    };

    const handleOpenReceiptDetailModal = (receipt: GoodsReceipt) => {
        setSelectedReceipt(receipt);
        setIsReceiptDetailModalOpen(true);
    };

    const handleUpdateReceipt = async (updatedReceipt: GoodsReceipt) => {
        try {
            const originalReceipt = goodsReceipts.find(r => r.id === updatedReceipt.id);
            const po = purchaseOrders.find(p => p.id === updatedReceipt.purchaseOrderId);

            if (po) {
                const project = projects.find(p => p.id === po.projectId);
                if (project?.status === ProjectStatus.Completed && !po.isWarranty) {
                    showToast('No se puede registrar la recepción de bienes para un proyecto finalizado.', 'error');
                    setIsReceiptDetailModalOpen(false);
                    setSelectedReceipt(null);
                    return;
                }
            }

            if (!originalReceipt || !materials || !setMaterials || !inventoryAdjustmentLogs || !setInventoryAdjustmentLogs) return;

            const quantityChanges = new Map<string, { delta: number, unit: string }>();

            updatedReceipt.items.forEach(updatedItem => {
                const originalItem = originalReceipt.items.find(i => i.purchaseOrderItemId === updatedItem.purchaseOrderItemId);
                if (originalItem) {
                    const delta = updatedItem.quantityReceived - originalItem.quantityReceived;
                    if (delta > 0) { // Only track increases from receipts
                        quantityChanges.set(updatedItem.name, { delta, unit: updatedItem.unit });
                    }
                }
            });

            if (quantityChanges.size > 0) {
                const newLogs: any[] = [];
                const updatedMaterials = [...materials];
                const materialUpdatePromises: Promise<any>[] = [];

                quantityChanges.forEach(({ delta, unit }, materialName) => {
                    const materialIndex = updatedMaterials.findIndex(m => m.name === materialName && m.unit === unit);
                    if (materialIndex !== -1) {
                        const materialToUpdate = updatedMaterials[materialIndex];
                        const quantityBefore = materialToUpdate.quantity;
                        const quantityAfter = quantityBefore + delta;

                        const updatedMaterial = { ...materialToUpdate, quantity: quantityAfter };
                        updatedMaterials[materialIndex] = updatedMaterial;

                        // Persist material change
                        materialUpdatePromises.push(apiService.updateMaterial(materialToUpdate.id, updatedMaterial));

                        newLogs.push({
                            materialId: materialToUpdate.id,
                            materialName: materialToUpdate.name,
                            adjustmentDate: new Date().toISOString(),
                            user: 'Sistema',
                            adjustmentType: 'Entrada',
                            quantityAdjusted: delta,
                            quantityBefore,
                            quantityAfter,
                            justification: `Recepción automática por OC #${updatedReceipt.purchaseOrderId}`,
                            relatedDocument: `OC-${updatedReceipt.purchaseOrderId}`
                        });
                    }
                });

                if (materialUpdatePromises.length > 0) {
                    await Promise.all(materialUpdatePromises);
                    setMaterials(updatedMaterials);
                    setInventoryAdjustmentLogs(prev => [...newLogs, ...prev]);
                }
            }

            const saved = await apiService.updateGoodsReceipt(updatedReceipt.id, updatedReceipt);
            setGoodsReceipts(prev => prev.map(r => r.id === saved.id ? saved : r));
            showToast(`Recepción para OC #${updatedReceipt.purchaseOrderId} actualizada. Inventario actualizado.`, 'success');
            setIsReceiptDetailModalOpen(false);
            setSelectedReceipt(null);
        } catch (error) {
            console.error('Error updating receipt:', error);
            showToast('Error al actualizar la recepción.', 'error');
        }
    };


    const handleNewCreditNote = (receipt: GoodsReceipt) => {
        const po = purchaseOrders.find(p => p.id === receipt.purchaseOrderId);
        if (!po) {
            showToast('Error: No se encontró la Orden de Compra asociada.', 'error');
            return;
        }
        setReceiptForCreditNote(receipt);
        setIsNewCreditNoteModalOpen(true);
    };

    const handleSubmitNewCreditNote = async (items: CreditNoteItem[], reason: string) => {
        if (!receiptForCreditNote) return;

        const po = purchaseOrders.find(p => p.id === receiptForCreditNote.purchaseOrderId);
        if (!po) {
            showToast('Error: No se encontró la Orden de Compra asociada.', 'error');
            return;
        }

        const totalAmount = items.reduce((sum, item) => sum + Number(item.creditAmount), 0);

        try {
            const newCreditNoteData: Omit<CreditNote, 'id'> = {
                goodsReceiptId: receiptForCreditNote.id,
                purchaseOrderId: po.id,
                projectId: po.projectId,
                supplierId: po.supplierId,
                supplierName: po.supplierName,
                creationDate: new Date().toISOString(),
                createdBy: user.name,
                reason,
                items,
                totalAmount,
                status: CreditNoteStatus.PendingApproval,
                appliedToInvoice: false,
            };

            const saved = await apiService.createCreditNote(newCreditNoteData);
            setCreditNotes(prev => [saved, ...prev]);
            setIsNewCreditNoteModalOpen(false);
            setReceiptForCreditNote(null);
            setSelectedCreditNote(saved);
            setIsCreditNoteModalOpen(true);
            showToast(`Nota de Crédito #${saved.id} generada exitosamente. Revise los detalles.`, 'success');
        } catch (error) {
            console.error('Error creating credit note:', error);
            showToast('Error al generar la nota de crédito.', 'error');
        }
    };

    const handleSelectCreditNote = (creditNote: CreditNote) => {
        setSelectedCreditNote(creditNote);
        setIsCreditNoteModalOpen(true);
    };

    const handleUpdateCreditNote = async (updatedNote: CreditNote) => {
        try {
            const originalNote = creditNotes.find(cn => cn.id === updatedNote.id);
            const wasApproved = originalNote?.status === CreditNoteStatus.Approved;
            const isNowApproved = updatedNote.status === CreditNoteStatus.Approved;

            let noteToUpdate = { ...updatedNote };

            if (isNowApproved && !wasApproved) {
                const targetAP = accountsPayable.find(ap => ap.purchaseOrderId === updatedNote.purchaseOrderId);

                if (targetAP) {
                    if (targetAP.status !== APStatus.Paid) {
                        const creditedAmount = (targetAP.creditedAmount || 0) + updatedNote.totalAmount;
                        const balance = targetAP.totalAmount - targetAP.paidAmount - creditedAmount;
                        const newStatus = balance <= 0 ? APStatus.Paid : targetAP.status;

                        const updatedAP = {
                            ...targetAP,
                            creditedAmount,
                            appliedCreditNoteIds: [...(targetAP.appliedCreditNoteIds || []), updatedNote.id],
                            status: newStatus
                        };

                        await apiService.updateAccountPayable(updatedAP.id, updatedAP);
                        setAccountsPayable(prev => prev.map(ap => ap.id === updatedAP.id ? updatedAP : ap));
                        noteToUpdate.appliedToInvoice = true;
                        addNotification(`Nota de Crédito #${updatedNote.id} aplicada a la factura #${targetAP.invoiceNumber}.`);
                    }
                }

                const associatedGR = goodsReceipts.find(gr => gr.id === updatedNote.goodsReceiptId);
                if (associatedGR && associatedGR.status !== GoodsReceiptStatus.FullyReceived) {
                    const allApprovedCNsForPO = [
                        ...creditNotes.filter(cn => cn.purchaseOrderId === updatedNote.purchaseOrderId && cn.status === CreditNoteStatus.Approved),
                        updatedNote
                    ];

                    const totalCreditedByItem = new Map<number, number>();
                    allApprovedCNsForPO.forEach(cn => {
                        cn.items.forEach(item => {
                            const current = totalCreditedByItem.get(item.purchaseOrderItemId) || 0;
                            totalCreditedByItem.set(item.purchaseOrderItemId, current + item.quantityToCredit);
                        });
                    });

                    const allItemsSettled = associatedGR.items.every(grItem => {
                        const creditedQty = totalCreditedByItem.get(grItem.purchaseOrderItemId) || 0;
                        return grItem.quantityReceived + creditedQty >= grItem.quantityOrdered;
                    });

                    if (allItemsSettled) {
                        const uniqueCnIds = [...new Set(allApprovedCNsForPO.map(cn => cn.id))];
                        const updatedGR = { ...associatedGR, status: GoodsReceiptStatus.FullyReceived, closedByCreditNoteIds: uniqueCnIds };
                        await apiService.updateGoodsReceipt(updatedGR.id, updatedGR);
                        setGoodsReceipts(prevGRs => prevGRs.map(gr => gr.id === updatedGR.id ? updatedGR : gr));
                    }
                }
            }

            const savedNote = await apiService.updateCreditNote(noteToUpdate.id, noteToUpdate);
            setCreditNotes(prev => prev.map(cn => cn.id === savedNote.id ? savedNote : cn));
            showToast(`Nota de Crédito #${savedNote.id} actualizada.`, 'info');
            setIsCreditNoteModalOpen(false);
            setSelectedCreditNote(null);
        } catch (error) {
            console.error('Error updating credit note:', error);
            showToast('Error al actualizar la nota de crédito.', 'error');
        }
    };

    const handleCreateSubcontractFromPO = async (po: PurchaseOrderType) => {
        try {
            const newSubcontractData: Omit<Subcontract, 'id'> = {
                purchaseOrderId: po.id,
                projectId: po.projectId,
                supplierId: po.supplierId,
                contractNumber: `SC-${po.id}-${po.projectId}`,
                scopeDescription: `Trabajos de subcontrato según OC #${po.id} para el proyecto ${po.projectName}.`,
                contractAmount: po.totalAmount,
                paymentTerms: po.paymentTerms,
                creationDate: new Date().toISOString(),
            };

            const savedSubcontract = await apiService.createSubcontract(newSubcontractData);
            setSubcontracts(prev => [...prev, savedSubcontract]);

            // Update PO and AP with the new subcontract ID
            await apiService.updatePurchaseOrder(po.id, { subcontractId: savedSubcontract.id });
            setPurchaseOrders(prev => prev.map(p => p.id === po.id ? { ...p, subcontractId: savedSubcontract.id } : p));

            const associatedAP = accountsPayable.find(ap => ap.purchaseOrderId === po.id);
            if (associatedAP) {
                await apiService.updateAccountPayable(associatedAP.id, { subcontractId: savedSubcontract.id });
                setAccountsPayable(prev => prev.map(ap => ap.id === associatedAP.id ? { ...ap, subcontractId: savedSubcontract.id } : ap));
            }

            showToast(`Subcontrato #${savedSubcontract.id} generado exitosamente desde la OC #${po.id}.`, 'success');
            addNotification(`Se generó el subcontrato SC-${po.id} para el proyecto ${po.projectName}.`);
        } catch (error) {
            console.error('Error creating subcontract:', error);
            showToast('Error al generar el subcontrato.', 'error');
        }
    };

    // Payable Payment Handlers
    const handleOpenAddPaymentModal = (payable: AccountPayable) => {
        setSelectedPayable(payable);
        setAddPaymentModalOpen(true);
    };

    const handleOpenHistoryModal = (payable: AccountPayable) => {
        setSelectedPayable(payable);
        setHistoryModalOpen(true);
    };

    const handleAddPayablePayment = async (accountId: number, paymentData: { amount: number; date: string; details: string; proofAttachmentName?: string; proofAttachmentBase64?: string }) => {
        try {
            const ap = accountsPayable.find(a => a.id === accountId);
            if (!ap) return;

            const newPayment: Payment = {
                id: (ap.payments.length > 0 ? Math.max(...ap.payments.map(p => p.id)) : 0) + 1,
                date: paymentData.date,
                amount: paymentData.amount,
                details: paymentData.details || undefined,
                proofAttachmentName: paymentData.proofAttachmentName,
                proofAttachmentBase64: paymentData.proofAttachmentBase64,
                paidBy: user.name, // Audit trail
                paidById: user.id
            };

            const newPaidAmount = ap.paidAmount + newPayment.amount;
            let newStatus = ap.status;
            const balance = ap.totalAmount - newPaidAmount - (ap.creditedAmount || 0);

            if (balance <= 0) {
                newStatus = APStatus.Paid;
            } else if (newPaidAmount > 0) {
                newStatus = APStatus.PartiallyPaid;
            }

            const updatedAP = {
                ...ap,
                payments: [...ap.payments, newPayment],
                paidAmount: newPaidAmount,
                status: newStatus
            };

            const savedAP = await apiService.updateAccountPayable(accountId, updatedAP);
            setAccountsPayable(prev => prev.map(a => a.id === accountId ? savedAP : a));

            setAddPaymentModalOpen(false);
            setSelectedPayable(null);
            showToast('Pago registrado con éxito.', 'success');
        } catch (error) {
            console.error('Error adding payment:', error);
            showToast('Error al registrar el pago.', 'error');
        }
    };

    // --- NEW SUBCONTRACT PROGRESS HANDLER ---
    const handleAddSubcontractProgress = async (data: { poId: number; amount: number; description: string; invoiceNumber: string; invoiceDate: string; }) => {
        try {
            const { poId, amount, description, invoiceNumber, invoiceDate } = data;
            const po = purchaseOrders.find(p => p.id === poId);
            const subcontract = subcontracts.find(s => s.purchaseOrderId === poId);

            if (!po || !subcontract) {
                showToast("Error: no se pudo encontrar la orden de compra o el subcontrato asociado.", "error");
                return;
            }

            const existingReceipts = goodsReceipts.filter(gr => gr.purchaseOrderId === poId && gr.isSubcontractReceipt);
            const alreadyReceivedAmount = existingReceipts.reduce((sum, gr) => sum + (Number(gr.amountReceived) || 0), 0);

            if (alreadyReceivedAmount + amount > subcontract.contractAmount) {
                showToast(`Error: El monto total recibido (¢${(alreadyReceivedAmount + amount).toLocaleString()}) excede el monto del contrato (¢${subcontract.contractAmount.toLocaleString()}).`, "error");
                return;
            }

            // 1. Create Goods Receipt
            const newReceiptData: Omit<GoodsReceipt, 'id'> = {
                purchaseOrderId: poId,
                creationDate: new Date().toISOString(),
                expectedReceiptDate: po.expectedDeliveryDate,
                actualReceiptDate: new Date().toISOString(),
                receivedBy: user.name,
                items: [], // Not used for subcontracts
                status: GoodsReceiptStatus.PartiallyReceived,
                isSubcontractReceipt: true,
                amountReceived: amount,
                progressDescription: description,
                subcontractorInvoice: invoiceNumber,
            };
            const savedGR = await apiService.createGoodsReceipt(newReceiptData);

            // 2. Create Account Payable
            const newAPData: Omit<AccountPayable, 'id'> = {
                purchaseOrderId: poId,
                subcontractId: subcontract.id,
                supplierId: po.supplierId,
                supplierName: po.supplierName,
                invoiceNumber: invoiceNumber,
                invoiceDate: invoiceDate,
                dueDate: addDays(new Date(invoiceDate), 30).toISOString().split('T')[0],
                totalAmount: amount,
                paidAmount: 0,
                payments: [],
                status: APStatus.PendingPayment,
            };
            const savedAP = await apiService.createAccountPayable(newAPData);

            // 3. Update PO and GR status
            const newTotalReceived = alreadyReceivedAmount + amount;
            const isFull = newTotalReceived >= subcontract.contractAmount;
            const newPoStatus = isFull ? POStatus.FullyReceived : POStatus.PartiallyReceived;

            await apiService.updatePurchaseOrder(poId, { status: newPoStatus });
            const finalGR = await apiService.updateGoodsReceipt(savedGR.id, {
                ...savedGR,
                status: isFull ? GoodsReceiptStatus.FullyReceived : GoodsReceiptStatus.PartiallyReceived
            });

            // Update local state
            setGoodsReceipts(prev => [finalGR, ...prev]);
            setAccountsPayable(prev => [savedAP, ...prev]);
            setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, status: newPoStatus } : p));

            showToast("Avance de subcontrato registrado y cuenta por pagar generada.", "success");
            setIsSubcontractProgressModalOpen(false);
        } catch (error) {
            console.error('Error adding subcontract progress:', error);
            showToast('Error al registrar el avance.', 'error');
        }
    };

    const handleSavePreOpRubros = async (updatedRubros: PreOpRubro[]) => {
        try {
            // Update rubros individually
            const updatePromises = updatedRubros.map(rubro => {
                if (rubro.id < 0 || rubro.id > 100000) { // New rubro (using large IDs or negative for mock)
                    const { id, ...rest } = rubro;
                    return apiService.createPreOpRubro(rest);
                }
                return apiService.updatePreOpRubro(rubro.id, rubro);
            });
            const results = await Promise.all(updatePromises);
            setPreOpRubros(results);
            showToast('Configuración de rubros actualizada.', 'success');
        } catch (error) {
            console.error('Error saving rubros:', error);
            showToast('Error al guardar los rubros.', 'error');
        }
    };

    const handleSavePreOpExpense = async (data: Omit<PreOpExpense, 'id' | 'status'>) => {
        try {
            if (selectedPreOpExpense) {
                const updatedExpense = { ...selectedPreOpExpense, ...data };
                const saved = await apiService.updatePreOpExpense(updatedExpense.id, updatedExpense);
                setPreOpExpenses(prev => prev.map(e => e.id === saved.id ? saved : e));
                showToast('Gasto guardado con éxito.', 'success');
            } else {
                const newExpense = await apiService.createPreOpExpense({
                    ...data,
                    status: 'Registrado'
                });
                setPreOpExpenses(prev => [newExpense, ...prev]);
                showToast('Gasto pre-operativo registrado con éxito.', 'success');
            }
            setIsNewPreOpModalOpen(false);
            setSelectedPreOpExpense(null);
        } catch (error) {
            console.error('Error saving expense:', error);
            showToast('Error al guardar el gasto.', 'error');
        }
    };


    const requestsInQuotationProcess = useMemo(() => {
        return serviceRequests.filter(req => [
            ServiceRequestStatus.Approved,
            ServiceRequestStatus.InQuotation,
            ServiceRequestStatus.QuotationReady,
        ].includes(req.status));
    }, [serviceRequests]);


    // Filter requests based on user role to simulate workflow
    const filteredRequests = useMemo(() => {
        const userRoleNames = new Set(user.roleIds.map(id => (roles || []).find(r => r.id === id)?.name));

        // High-level approvers
        if (userRoleNames.has('Gerente General') || userRoleNames.has('Director financiero') || userRoleNames.has('Director de proyectos')) {
            const statusesToView: ServiceRequestStatus[] = [
                ServiceRequestStatus.PendingApproval,
                ServiceRequestStatus.PendingGMApproval
            ];
            // Financial Director and GM also see the PO approval stage
            if (userRoleNames.has('Gerente General') || userRoleNames.has('Director financiero')) {
                statusesToView.push(ServiceRequestStatus.POPendingApproval, ServiceRequestStatus.POApproved, ServiceRequestStatus.Completed);
            }
            return serviceRequests.filter(r => statusesToView.includes(r.status));
        }

        if (userRoleNames.has('Encargado de proyectos')) {
            return serviceRequests.filter(r => r.requesterId === user.id || r.status === ServiceRequestStatus.Rejected);
        }
        if (userRoleNames.has('Proveeduria')) {
            return serviceRequests.filter(r => ![
                ServiceRequestStatus.PendingApproval,
                ServiceRequestStatus.PendingGMApproval,
                ServiceRequestStatus.Rejected,
                ServiceRequestStatus.Completed
            ].includes(r.status));
        }

        return serviceRequests;

    }, [serviceRequests, user.roleIds, user.id, roles]);

    // --- Filtered Data Hooks ---
    const dateFilter = useCallback((dateStr: string, startDate?: string, endDate?: string) => {
        if (!startDate && !endDate) return true;
        try {
            const date = new Date(dateStr);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate + 'T23:59:59Z') : null; // Inclusive end date, in UTC

            if (start && end) return isWithinInterval(date, { start, end });
            if (start) return date >= start;
            if (end) return date <= end;
            return true;
        } catch (e) {
            return true; // Invalid date string, don't filter it out
        }
    }, []);

    const filteredRequestsForList = useMemo(() => {
        return filteredRequests.filter(req => {
            if (filters.projectId && req.projectId !== Number(filters.projectId)) return false;
            if (!dateFilter(req.requestDate, filters.startDate, filters.endDate)) return false;
            return true;
        });
    }, [filteredRequests, filters, dateFilter]);

    const filteredRequestsForQuoting = useMemo(() => {
        return requestsInQuotationProcess.filter(req => {
            if (filters.projectId && req.projectId !== Number(filters.projectId)) return false;
            if (!dateFilter(req.requestDate, filters.startDate, filters.endDate)) return false;
            return true;
        });
    }, [requestsInQuotationProcess, filters, dateFilter]);

    const filteredPurchaseOrders = useMemo(() => {
        return purchaseOrders.filter(po => {
            if (filters.projectId && po.projectId !== Number(filters.projectId)) return false;
            if (filters.supplierId && po.supplierId !== Number(filters.supplierId)) return false;
            if (filters.minAmount && po.totalAmount < Number(filters.minAmount)) return false;
            if (filters.maxAmount && po.totalAmount > Number(filters.maxAmount)) return false;
            if (!dateFilter(po.orderDate, filters.startDate, filters.endDate)) return false;
            return true;
        });
    }, [purchaseOrders, filters, dateFilter]);

    const filteredGoodsReceipts = useMemo(() => {
        const poMap = new Map<number, PurchaseOrderType>(purchaseOrders.map(po => [po.id, po]));
        return goodsReceipts.filter(gr => {
            const po = poMap.get(gr.purchaseOrderId);
            if (!po) return false;
            if (filters.projectId && po.projectId !== Number(filters.projectId)) return false;
            if (filters.supplierId && po.supplierId !== Number(filters.supplierId)) return false;
            if (!dateFilter(gr.creationDate, filters.startDate, filters.endDate)) return false;
            return true;
        });
    }, [goodsReceipts, purchaseOrders, filters, dateFilter]);

    const filteredCreditNotes = useMemo(() => {
        return creditNotes.filter(cn => {
            if (filters.projectId && cn.projectId !== Number(filters.projectId)) return false;
            if (filters.supplierId && cn.supplierId !== Number(filters.supplierId)) return false;
            if (filters.minAmount && cn.totalAmount < Number(filters.minAmount)) return false;
            if (filters.maxAmount && cn.totalAmount > Number(filters.maxAmount)) return false;
            if (!dateFilter(cn.creationDate, filters.startDate, filters.endDate)) return false;
            return true;
        });
    }, [creditNotes, filters, dateFilter]);

    const filteredAccountsPayable = useMemo(() => {
        const poMap = new Map<number, { projectId: number }>(purchaseOrders.map(po => [po.id, { projectId: po.projectId }]));
        return accountsPayable.filter(ap => {
            const po = poMap.get(ap.purchaseOrderId);
            if (filters.projectId && po?.projectId !== Number(filters.projectId)) return false;
            if (filters.supplierId && ap.supplierId !== Number(filters.supplierId)) return false;
            if (filters.minAmount && ap.totalAmount < Number(filters.minAmount)) return false;
            if (filters.maxAmount && ap.totalAmount > Number(filters.maxAmount)) return false;
            if (!dateFilter(ap.invoiceDate, filters.startDate, filters.endDate)) return false;
            if (!dateFilter(ap.dueDate, filters.startDueDate, filters.endDueDate)) return false;
            return true;
        });
    }, [accountsPayable, purchaseOrders, filters, dateFilter]);

    const activeViewContent = useMemo(() => {
        switch (activeView) {
            case 'requests':
                return (
                    <>
                        <FilterBar config={{ showProject: true, showDateRange: true }} projects={projects} suppliers={suppliers} onFilterChange={handleFilterChange} />
                        <ServiceRequestList
                            requests={filteredRequestsForList}
                            updateRequestStatus={updateRequestStatus}
                            currentUser={user}
                            onEdit={handleOpenEditModal}
                            projects={projects}
                            offers={offers}
                            changeOrders={changeOrders}
                            budgets={budgets}
                            allServiceRequests={serviceRequests}
                            roles={roles}
                        />
                    </>
                );
            case 'quotes':
                return (
                    <>
                        <FilterBar config={{ showProject: true, showDateRange: true }} projects={projects} suppliers={suppliers} onFilterChange={handleFilterChange} />
                        <QuoteList
                            requests={filteredRequestsForQuoting}
                            onManageQuotes={handleOpenQuoteManagementModal}
                            currentUser={user}
                        />
                    </>
                );
            case 'orders':
                return (
                    <>
                        <FilterBar config={{ showProject: true, showSupplier: true, showDateRange: true, showAmountRange: true }} projects={projects} suppliers={suppliers} onFilterChange={handleFilterChange} />
                        <PurchaseOrderList orders={filteredPurchaseOrders} onCreateSubcontract={handleCreateSubcontractFromPO} />
                    </>
                );
            case 'receipts':
                return (
                    <>
                        <FilterBar config={{ showProject: true, showSupplier: true, showDateRange: true }} projects={projects} suppliers={suppliers} onFilterChange={handleFilterChange} />
                        <GoodsReceiptList
                            receipts={filteredGoodsReceipts}
                            onOpenDetail={handleOpenReceiptDetailModal}
                            onNewCreditNote={handleNewCreditNote}
                            onRegisterProgress={() => setIsSubcontractProgressModalOpen(true)}
                        />
                    </>
                );
            case 'notes':
                return (
                    <>
                        <FilterBar config={{ showProject: true, showSupplier: true, showDateRange: true, showAmountRange: true }} projects={projects} suppliers={suppliers} onFilterChange={handleFilterChange} />
                        <CreditNoteList creditNotes={filteredCreditNotes} onSelect={handleSelectCreditNote} onUpdate={handleUpdateCreditNote} />
                    </>
                );
            case 'payables':
                return (
                    <>
                        <FilterBar config={{ showProject: true, showSupplier: true, showDateRange: true, showAmountRange: true, showDueDateRange: true }} projects={projects} suppliers={suppliers} onFilterChange={handleFilterChange} />
                        <AccountsPayableList accounts={filteredAccountsPayable} onAddPayment={handleOpenAddPaymentModal} onViewHistory={handleOpenHistoryModal} />
                    </>
                );
            case 'preop':
                return <PreOpExpensesList expenses={preOpExpenses} rubros={preOpRubros} onEdit={(expense) => { setSelectedPreOpExpense(expense); setIsNewPreOpModalOpen(true); }} />;
            case 'expenses':
                return <ExpenseControl />;
            default:
                return (
                    <>
                        <FilterBar config={{ showProject: true, showDateRange: true }} projects={projects} suppliers={suppliers} onFilterChange={handleFilterChange} />
                        <ServiceRequestList
                            requests={filteredRequestsForList}
                            updateRequestStatus={updateRequestStatus}
                            currentUser={user}
                            onEdit={handleOpenEditModal}
                            projects={projects}
                            offers={offers}
                            changeOrders={changeOrders}
                            budgets={budgets}
                            allServiceRequests={serviceRequests}
                            roles={roles}
                        />
                    </>
                );
        }
    }, [
        activeView, user, projects, suppliers, handleFilterChange,
        filteredRequestsForList, updateRequestStatus, handleOpenEditModal,
        filteredRequestsForQuoting, handleOpenQuoteManagementModal,
        filteredPurchaseOrders, handleCreateSubcontractFromPO,
        filteredGoodsReceipts, handleOpenReceiptDetailModal, handleNewCreditNote,
        filteredCreditNotes, handleSelectCreditNote, handleUpdateCreditNote,
        filteredAccountsPayable, handleOpenAddPaymentModal, handleOpenHistoryModal,
        offers, budgets, changeOrders, serviceRequests, roles, materials, serviceItems,
        preOpExpenses, preOpRubros
    ]);


    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-dark-gray">Módulo de Compras</h2>
                    <div className="flex items-center gap-3">
                        {activeView === 'preop' && (
                            <>
                                <button
                                    onClick={() => setIsPreOpConfigModalOpen(true)}
                                    className="p-2 text-slate-500 hover:text-primary transition-colors bg-white border rounded-lg shadow-sm"
                                    title="Configuración de Rubros Pre-Op"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </button>
                                <button
                                    onClick={() => setIsNewPreOpModalOpen(true)}
                                    className="bg-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-lg shadow-orange-200"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                    Nuevo Gasto
                                </button>
                            </>
                        )}
                        {activeView !== 'preop' && can('purchasing', 'requests', 'create') && (
                            <button
                                onClick={() => setIsNewRequestModalOpen(true)}
                                className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                Nueva Solicitud
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        {purchasingViews.map(view => (
                            <button
                                key={view.key}
                                onClick={() => setActiveView(view.key)}
                                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeView === view.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                            >
                                {view.label}
                            </button>
                        ))}
                    </nav>
                </div>


                <Card title={purchasingViews.find(v => v.key === activeView)?.label}>
                    {activeViewContent}
                </Card>
            </div>
            <NewServiceRequestModal
                isOpen={isNewRequestModalOpen}
                onClose={() => setIsNewRequestModalOpen(false)}
                onSubmit={handleAddRequest}
                projects={projects}
                currentUser={user}
                materials={materials}
                serviceItems={serviceItems}
                recurringOrderTemplates={recurringOrderTemplates}
                budgets={budgets}
                offers={offers}
                changeOrders={changeOrders}
                allServiceRequests={serviceRequests}
                purchaseOrders={purchaseOrders}
            />
            <EditServiceRequestModal
                isOpen={isEditRequestModalOpen}
                onClose={() => setIsEditRequestModalOpen(false)}
                onSubmit={handleUpdateRequest}
                request={selectedRequest}
                projects={projects}
                materials={materials}
                serviceItems={serviceItems}
                currentUser={user}
                budgets={budgets}
                offers={offers}
                changeOrders={changeOrders}
                allServiceRequests={serviceRequests}
                purchaseOrders={purchaseOrders}
            />
            <QuoteManagementModal
                isOpen={isQuoteManagementModalOpen}
                onClose={() => setIsQuoteManagementModalOpen(false)}
                request={selectedRequest}
                onAddQuote={handleAddQuoteResponse}
                onUpdateQuote={handleUpdateQuoteResponse}
                onOpenChart={handleOpenComparativeChartModal}
            />
            <ComparativeChartModal
                isOpen={isComparativeChartModalOpen}
                onClose={() => setIsComparativeChartModalOpen(false)}
                request={selectedRequest}
                onSelectWinners={handleSelectWinners}
            />
            <GoodsReceiptDetailModal
                isOpen={isReceiptDetailModalOpen}
                onClose={() => setIsReceiptDetailModalOpen(false)}
                receipt={selectedReceipt}
                onUpdate={handleUpdateReceipt}
            />
            <CreditNoteDetailModal
                isOpen={isCreditNoteModalOpen}
                onClose={() => setIsCreditNoteModalOpen(false)}
                creditNote={selectedCreditNote}
                onSubmit={handleUpdateCreditNote}
            />
            <AddPayablePaymentModal
                isOpen={isAddPaymentModalOpen}
                onClose={() => setAddPaymentModalOpen(false)}
                account={selectedPayable}
                onSubmit={handleAddPayablePayment}
            />
            <PayablePaymentHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setHistoryModalOpen(false)}
                account={selectedPayable}
            />
            <SubcontractProgressModal
                isOpen={isSubcontractProgressModalOpen}
                onClose={() => setIsSubcontractProgressModalOpen(false)}
                onSubmit={handleAddSubcontractProgress}
            />
            <NewPreOpExpenseModal
                isOpen={isNewPreOpModalOpen}
                onClose={() => { setIsNewPreOpModalOpen(false); setSelectedPreOpExpense(null); }}
                onSubmit={handleSavePreOpExpense}
                prospects={prospects}
                rubros={preOpRubros}
                budgets={budgets}
                initialExpense={selectedPreOpExpense}
            />
            <PreOpConfigModal
                isOpen={isPreOpConfigModalOpen}
                onClose={() => setIsPreOpConfigModalOpen(false)}
                onSave={handleSavePreOpRubros}
                rubros={preOpRubros}
            />
            <NewCreditNoteModal
                isOpen={isNewCreditNoteModalOpen}
                onClose={() => { setIsNewCreditNoteModalOpen(false); setReceiptForCreditNote(null); }}
                receipt={receiptForCreditNote}
                onSubmit={handleSubmitNewCreditNote}
            />
        </>
    );
};

export default PurchasingDashboard;
