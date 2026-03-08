import React, { useState, useEffect, useMemo, useContext } from 'react';
import { GoodsReceipt, PurchaseOrder, CreditNoteItem } from '../../types';
import { AppContext } from '../../context/AppContext';
import { formatCurrency, formatQuantity } from '../../utils/format';

interface PendingItem {
    purchaseOrderItemId: number;
    name: string;
    unit: string;
    unitPrice: number;
    quantityOrdered: number;
    quantityReceived: number;
    quantityPending: number;
    // User-controlled fields
    selected: boolean;
    quantityToCredit: number;
}

interface NewCreditNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    receipt: GoodsReceipt | null;
    onSubmit: (items: CreditNoteItem[], reason: string) => void;
}

export const NewCreditNoteModal: React.FC<NewCreditNoteModalProps> = ({ isOpen, onClose, receipt, onSubmit }) => {
    const appContext = useContext(AppContext);
    const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
    const [reason, setReason] = useState('');

    const purchaseOrder = useMemo(() => {
        if (!receipt || !appContext) return null;
        return appContext.purchaseOrders.find(po => po.id === receipt.purchaseOrderId) || null;
    }, [receipt, appContext]);

    useEffect(() => {
        if (!receipt || !purchaseOrder) return;

        const items: PendingItem[] = receipt.items
            .map(grItem => {
                const poItem = purchaseOrder.items.find(pi => pi.id === grItem.purchaseOrderItemId);
                if (!poItem) return null;

                const quantityPending = grItem.quantityOrdered - grItem.quantityReceived;

                return {
                    purchaseOrderItemId: grItem.purchaseOrderItemId,
                    name: grItem.name,
                    unit: grItem.unit,
                    unitPrice: poItem.unitPrice,
                    quantityOrdered: grItem.quantityOrdered,
                    quantityReceived: grItem.quantityReceived,
                    quantityPending,
                    selected: quantityPending > 0,
                    quantityToCredit: quantityPending > 0 ? quantityPending : 0,
                };
            })
            .filter((item): item is PendingItem => item !== null);

        setPendingItems(items);
        setReason(`Nota de Crédito por ítems no entregados en la recepción de OC #${purchaseOrder.id}`);
    }, [receipt, purchaseOrder, isOpen]);

    if (!isOpen || !receipt || !purchaseOrder) return null;

    const handleToggleItem = (itemId: number) => {
        setPendingItems(prev => prev.map(item => {
            if (item.purchaseOrderItemId === itemId) {
                const newSelected = !item.selected;
                return {
                    ...item,
                    selected: newSelected,
                    quantityToCredit: newSelected ? (item.quantityPending > 0 ? item.quantityPending : item.quantityOrdered) : 0,
                };
            }
            return item;
        }));
    };

    const handleQuantityChange = (itemId: number, value: string) => {
        const qty = parseFloat(value);
        setPendingItems(prev => prev.map(item => {
            if (item.purchaseOrderItemId === itemId) {
                const maxQty = item.quantityPending > 0 ? item.quantityPending : item.quantityOrdered;
                const clampedQty = isNaN(qty) ? 0 : Math.min(Math.max(0, qty), maxQty);
                return { ...item, quantityToCredit: clampedQty, selected: clampedQty > 0 };
            }
            return item;
        }));
    };

    const handleSelectAll = () => {
        const allSelected = pendingItems.every(i => i.selected);
        setPendingItems(prev => prev.map(item => ({
            ...item,
            selected: !allSelected,
            quantityToCredit: !allSelected
                ? (item.quantityPending > 0 ? item.quantityPending : item.quantityOrdered)
                : 0,
        })));
    };

    const selectedItems = pendingItems.filter(i => i.selected && i.quantityToCredit > 0);
    const totalAmount = selectedItems.reduce((sum, item) => sum + (item.quantityToCredit * item.unitPrice), 0);
    const canSubmit = selectedItems.length > 0 && reason.trim().length > 0;

    const handleSubmit = () => {
        if (!canSubmit) return;

        const creditNoteItems: CreditNoteItem[] = selectedItems.map(item => ({
            purchaseOrderItemId: item.purchaseOrderItemId,
            name: item.name,
            quantityToCredit: item.quantityToCredit,
            unit: item.unit,
            unitPrice: item.unitPrice,
            creditAmount: item.quantityToCredit * item.unitPrice,
        }));

        onSubmit(creditNoteItems, reason);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex-shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-dark-gray">Nueva Nota de Crédito</h2>
                            <p className="text-sm text-slate-500">
                                Para Recepción de OC <span className="font-semibold">OC-{purchaseOrder.id}</span> — {purchaseOrder.supplierName}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Info banner */}
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg mb-4">
                        <div className="flex items-start gap-2">
                            <svg className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-amber-800">Seleccione los ítems pendientes de entrega</p>
                                <p className="text-xs text-amber-700 mt-0.5">Marque los ítems que el proveedor no entregó y ajuste las cantidades si es necesario. La nota de crédito se generará con estado "Pendiente de Aprobación".</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="flex-grow overflow-y-auto -mr-3 pr-3">
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-slate-100 sticky top-0">
                            <tr>
                                <th className="py-2 px-3 text-center font-medium text-slate-600 w-12">
                                    <input
                                        type="checkbox"
                                        checked={pendingItems.length > 0 && pendingItems.every(i => i.selected)}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                        title="Seleccionar todos"
                                    />
                                </th>
                                <th className="py-2 px-3 text-left font-medium text-slate-600 w-2/6">Material / Bien</th>
                                <th className="py-2 px-3 text-center font-medium text-slate-600">Cant. Ordenada</th>
                                <th className="py-2 px-3 text-center font-medium text-slate-600">Cant. Recibida</th>
                                <th className="py-2 px-3 text-center font-medium text-slate-600 bg-amber-50">Pendiente</th>
                                <th className="py-2 px-3 text-center font-medium text-slate-600">Unidad</th>
                                <th className="py-2 px-3 text-center font-medium text-slate-600">Precio Unit.</th>
                                <th className="py-2 px-3 text-center font-medium text-slate-600 bg-red-50 w-28">Cant. a Acreditar</th>
                                <th className="py-2 px-3 text-right font-medium text-slate-600 bg-red-50">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {pendingItems.map(item => {
                                const creditAmount = item.quantityToCredit * item.unitPrice;
                                const hasPending = item.quantityPending > 0;
                                return (
                                    <tr
                                        key={item.purchaseOrderItemId}
                                        className={`transition-colors ${item.selected ? 'bg-red-50/50' : 'hover:bg-slate-50'} ${!hasPending ? 'opacity-60' : ''}`}
                                    >
                                        <td className="py-2 px-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={item.selected}
                                                onChange={() => handleToggleItem(item.purchaseOrderItemId)}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            />
                                        </td>
                                        <td className="py-2 px-3 font-medium text-slate-800">{item.name}</td>
                                        <td className="py-2 px-3 text-center text-slate-600">{formatQuantity(item.quantityOrdered)}</td>
                                        <td className="py-2 px-3 text-center">
                                            <span className={`font-medium ${item.quantityReceived < item.quantityOrdered ? 'text-amber-600' : 'text-green-600'}`}>
                                                {formatQuantity(item.quantityReceived)}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 text-center bg-amber-50/50">
                                            <span className={`font-bold ${hasPending ? 'text-red-600' : 'text-green-600'}`}>
                                                {formatQuantity(item.quantityPending)}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 text-center text-slate-600">{item.unit}</td>
                                        <td className="py-2 px-3 text-center text-slate-600 font-mono">{formatCurrency(item.unitPrice)}</td>
                                        <td className="py-2 px-3 text-center bg-red-50/50">
                                            <input
                                                type="number"
                                                value={item.quantityToCredit}
                                                onChange={(e) => handleQuantityChange(item.purchaseOrderItemId, e.target.value)}
                                                disabled={!item.selected}
                                                className="w-20 p-1 border border-slate-300 rounded-md text-center focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100 disabled:text-slate-400"
                                                min={0}
                                                max={item.quantityPending > 0 ? item.quantityPending : item.quantityOrdered}
                                                step="any"
                                            />
                                        </td>
                                        <td className="py-2 px-3 text-right bg-red-50/50 font-mono font-semibold">
                                            {item.selected && item.quantityToCredit > 0 ? (
                                                <span className="text-red-600">-{formatCurrency(creditAmount)}</span>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {pendingItems.length === 0 && (
                        <div className="text-center py-10 text-slate-500">
                            <p className="text-sm">No se encontraron ítems en esta recepción.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 pt-4 mt-4 border-t space-y-4">
                    {/* Reason */}
                    <div>
                        <label htmlFor="cn-reason" className="block text-sm font-medium text-slate-700">Motivo de la Nota de Crédito <span className="text-red-500">*</span></label>
                        <textarea
                            id="cn-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={2}
                            placeholder="Describa el motivo por el cual se genera la nota de crédito..."
                            className="w-full mt-1 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                        />
                    </div>

                    {/* Summary & Buttons */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">{selectedItems.length} ítem(s) seleccionado(s)</p>
                            <p className="text-2xl font-bold text-red-600 font-mono">
                                -{formatCurrency(totalAmount)}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Generar Nota de Crédito
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
