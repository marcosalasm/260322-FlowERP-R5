import React, { useState, useEffect, useMemo, useContext } from 'react';
import { GoodsReceipt, PurchaseOrder, GoodsReceiptItem, GoodsReceiptStatus, User } from '../../types';
import { AppContext } from '../../context/AppContext';

interface GoodsReceiptDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    receipt: GoodsReceipt | null;
    onUpdate: (updatedReceipt: GoodsReceipt) => void;
}

import { formatCurrency, formatQuantity } from '../../utils/format';
export const GoodsReceiptDetailModal: React.FC<GoodsReceiptDetailModalProps> = ({ isOpen, onClose, receipt, onUpdate }) => {
    const appContext = useContext(AppContext);
    const [editableItems, setEditableItems] = useState<GoodsReceiptItem[]>([]);
    const [notes, setNotes] = useState('');

    const { purchaseOrder, user } = useMemo(() => {
        if (!receipt || !appContext) return { purchaseOrder: null, user: null };
        return {
            purchaseOrder: appContext.purchaseOrders.find(po => po.id === receipt.purchaseOrderId) || null,
            user: appContext.user,
        };
    }, [receipt, appContext]);

    useEffect(() => {
        if (receipt) {
            setEditableItems(JSON.parse(JSON.stringify(receipt.items)));
            setNotes(receipt.notes || '');
        }
    }, [receipt, isOpen]);

    if (!isOpen || !receipt || !purchaseOrder || !user) return null;

    const handleQuantityChange = (itemId: number, value: string) => {
        const newQty = parseInt(value, 10);
        const item = editableItems.find(i => i.purchaseOrderItemId === itemId);
        if (item && newQty > item.quantityOrdered) {
            alert('La cantidad recibida no puede ser mayor a la cantidad ordenada.');
            return;
        }
        setEditableItems(prev => prev.map(i => i.purchaseOrderItemId === itemId ? { ...i, quantityReceived: isNaN(newQty) ? 0 : newQty } : i));
    };

    const handleCheckboxChange = (itemId: number, isChecked: boolean) => {
        const item = editableItems.find(i => i.purchaseOrderItemId === itemId);
        if (item) {
            const newQty = isChecked ? item.quantityOrdered : 0;
            handleQuantityChange(itemId, String(newQty));
        }
    };

    const handleConfirm = () => {
        const isFullyReceived = editableItems.every(item => item.quantityReceived === item.quantityOrdered);
        const isPartiallyReceived = editableItems.some(item => item.quantityReceived > 0) && !isFullyReceived;

        const newStatus = isFullyReceived
            ? GoodsReceiptStatus.FullyReceived
            : isPartiallyReceived
                ? GoodsReceiptStatus.PartiallyReceived
                : receipt.status; // Keep original status if no items were received

        const updatedReceipt: GoodsReceipt = {
            ...receipt,
            items: editableItems,
            status: newStatus,
            notes,
            actualReceiptDate: new Date().toISOString(),
            receivedBy: user.name,
        };
        onUpdate(updatedReceipt);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-5xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-dark-gray">Recepción de Bienes/Servicios</h2>
                            <p className="text-md text-slate-600">
                                Para Orden de Compra <span className="font-semibold">OC-{purchaseOrder.id}</span>
                            </p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>
                    {receipt.closedByCreditNoteIds && receipt.closedByCreditNoteIds.length > 0 && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-md my-4" role="alert">
                            <div className="flex">
                                <div className="py-1">
                                    <svg className="h-5 w-5 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold">Recepción Completada por Nota de Crédito</p>
                                    <p className="text-sm">Esta recepción fue cerrada automáticamente por la aplicación de la(s) Nota(s) de Crédito: <strong>#{receipt.closedByCreditNoteIds.join(', #')}</strong>.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="bg-slate-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-slate-500">Monto Total de OC #{purchaseOrder.id}</p>
                        <p className="text-2xl font-bold font-mono text-secondary">{formatCurrency(purchaseOrder.totalAmount)}</p>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto mt-4 -mr-3 pr-3">
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-slate-100 sticky top-0">
                            <tr>
                                <th className="py-2 px-3 text-left font-medium text-slate-600 w-2/5">Descripción del Material/Bien</th>
                                <th className="py-2 px-3 text-center font-medium text-slate-600">Cantidad Ordenada</th>
                                <th className="py-2 px-3 text-center font-medium text-slate-600">Unidad</th>
                                <th className="py-2 px-3 text-center font-medium text-slate-600">Precio Unitario</th>
                                <th className="py-2 px-3 text-center font-medium text-slate-600 w-28">Cantidad Recibida</th>
                                <th className="py-2 px-3 text-center font-medium text-slate-600">Completo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {editableItems.map(item => {
                                const poItem = purchaseOrder.items.find(pi => pi.id === item.purchaseOrderItemId);
                                const isChecked = item.quantityReceived === item.quantityOrdered && item.quantityOrdered > 0;
                                return (
                                    <tr key={item.purchaseOrderItemId}>
                                        <td className="py-2 px-3 font-medium text-slate-800">{item.name}</td>
                                        <td className="py-2 px-3 text-center text-slate-600">{formatQuantity(item.quantityOrdered)}</td>
                                        <td className="py-2 px-3 text-center text-slate-600">{item.unit}</td>
                                        <td className="py-2 px-3 text-center text-slate-600 font-mono">{formatCurrency(poItem?.unitPrice || 0)}</td>
                                        <td className="py-2 px-3 text-center">
                                            <input
                                                type="number"
                                                value={item.quantityReceived}
                                                onChange={(e) => handleQuantityChange(item.purchaseOrderItemId, e.target.value)}
                                                className="w-20 p-1 border border-slate-300 rounded-md text-center focus:ring-primary focus:border-primary"
                                                max={item.quantityOrdered}
                                                min={0}
                                            />
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => handleCheckboxChange(item.purchaseOrderItemId, e.target.checked)}
                                                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex-shrink-0 pt-4 mt-4 border-t space-y-4">
                    <div>
                        <label htmlFor="receipt-notes" className="block text-sm font-medium text-slate-700">Observaciones</label>
                        <textarea
                            id="receipt-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Ej: Faltan 2 sacos de cemento. Una caja de cerámica llegó dañada."
                            className="w-full mt-1 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300">Cancelar</button>
                        <button onClick={handleConfirm} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark">
                            Confirmar Recepción
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};