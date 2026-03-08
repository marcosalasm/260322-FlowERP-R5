import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Subcontract, PurchaseOrder, GoodsReceipt, POStatus } from '../../types';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

interface SubcontractProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { poId: number; amount: number; description: string; invoiceNumber: string; invoiceDate: string; }) => void;
}

const formatCurrency = (value: number) => { const num = Number(value); if (isNaN(num)) return '¢0.00'; return `¢${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}`; };;

export const SubcontractProgressModal: React.FC<SubcontractProgressModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const appContext = useContext(AppContext);
    const { showToast } = useToast();
    
    if (!appContext) return null;
    const { purchaseOrders, subcontracts, goodsReceipts } = appContext;

    const [selectedPoId, setSelectedPoId] = useState<string>('');
    const [amount, setAmount] = useState<number | string>('');
    const [description, setDescription] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');
    const [error, setError] = useState('');

    const availablePOs = useMemo(() => {
        const subcontractPoIds = new Set(subcontracts.map(s => s.purchaseOrderId));
        return purchaseOrders.filter(po => 
            subcontractPoIds.has(po.id) && po.status !== POStatus.FullyReceived && po.status !== POStatus.Cancelled
        );
    }, [purchaseOrders, subcontracts]);
    
    const selectedPO = useMemo(() => {
        return purchaseOrders.find(po => po.id === Number(selectedPoId));
    }, [selectedPoId, purchaseOrders]);

    const subcontractForPO = useMemo(() => {
        return subcontracts.find(sc => sc.purchaseOrderId === selectedPO?.id);
    }, [selectedPO, subcontracts]);

    const alreadyReceivedAmount = useMemo(() => {
        if (!selectedPO) return 0;
        return goodsReceipts
            .filter(gr => gr.purchaseOrderId === selectedPO.id && gr.isSubcontractReceipt)
            .reduce((sum, gr) => sum + (gr.amountReceived || 0), 0);
    }, [selectedPO, goodsReceipts]);

    const remainingBalance = useMemo(() => {
        if (!subcontractForPO) return 0;
        return subcontractForPO.contractAmount - alreadyReceivedAmount;
    }, [subcontractForPO, alreadyReceivedAmount]);

    useEffect(() => {
        if (isOpen) {
            setSelectedPoId(availablePOs[0]?.id.toString() || '');
            setAmount('');
            setDescription('');
            setInvoiceNumber('');
            setInvoiceDate(new Date().toISOString().split('T')[0]);
            setError('');
        }
    }, [isOpen, availablePOs]);
    
    useEffect(() => {
        const value = Number(amount);
        if (value > remainingBalance) {
            setError(`El monto no puede exceder el saldo de ${formatCurrency(remainingBalance)}`);
        } else if (value < 0) {
            setError('El monto no puede ser negativo.');
        } else {
            setError('');
        }
    }, [amount, remainingBalance]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (error || !selectedPoId || !amount || !description || !invoiceNumber || !invoiceDate) {
            showToast("Por favor complete todos los campos y corrija los errores.", "error");
            return;
        }
        onSubmit({
            poId: Number(selectedPoId),
            amount: Number(amount),
            description,
            invoiceNumber,
            invoiceDate
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-3xl transform transition-all" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-dark-gray">Registrar Avance de Subcontrato</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Subcontrato (Orden de Compra)</label>
                        <select value={selectedPoId} onChange={e => setSelectedPoId(e.target.value)} className="w-full p-2 border rounded-md mt-1" required>
                            <option value="">Seleccione un subcontrato...</option>
                            {availablePOs.map(po => {
                                const subcontract = subcontracts.find(sc => sc.purchaseOrderId === po.id);
                                return (
                                <option key={po.id} value={po.id}>OC-{po.id} ({po.supplierName} / {subcontract?.contractNumber})</option>
                            )})}
                        </select>
                    </div>

                    {subcontractForPO && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-3 rounded-lg text-sm">
                            <div><span className="font-semibold">Monto del Contrato:</span> <span className="block font-mono">{formatCurrency(subcontractForPO.contractAmount)}</span></div>
                            <div><span className="font-semibold">Monto Recibido:</span> <span className="block font-mono">{formatCurrency(alreadyReceivedAmount)}</span></div>
                            <div><span className="font-semibold text-red-600">Saldo Pendiente:</span> <span className="block font-mono font-bold text-red-600">{formatCurrency(remainingBalance)}</span></div>
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium">Descripción de Trabajos Realizados*</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-2 border rounded-md mt-1" required />
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                             <label className="block text-sm font-medium">Monto del Avance (¢)*</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="0.01" step="any" className={`w-full p-2 border rounded-md mt-1 ${error ? 'border-red-500' : ''}`} required />
                            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                        </div>
                         <div>
                            <label className="block text-sm font-medium">N° Factura de Subcontratista*</label>
                            <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full p-2 border rounded-md mt-1" required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Fecha de Factura*</label>
                            <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full p-2 border rounded-md mt-1" required />
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-4 pt-4 border-t border-light-gray">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300">Cancelar</button>
                        <button type="submit" disabled={!!error || !selectedPoId || !amount} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark disabled:bg-slate-400">
                            Registrar y Generar C.P.
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};