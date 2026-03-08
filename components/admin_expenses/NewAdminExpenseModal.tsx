import React, { useState, useEffect } from 'react';
import { AdministrativeBudget, AdministrativeExpense } from '../../types';
import { useToast } from '../../context/ToastContext';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<{ name: string; base64: string }> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        resolve({ name: file.name, base64: result.split(',')[1] });
    };
    reader.onerror = error => reject(error);
});


interface NewAdminExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newExpense: Omit<AdministrativeExpense, 'id' | 'budgetId'>) => void;
    budget: AdministrativeBudget | undefined;
}

export const NewAdminExpenseModal: React.FC<NewAdminExpenseModalProps> = ({ isOpen, onClose, onSubmit, budget }) => {
    const { showToast } = useToast();

    const [date, setDate] = useState('');
    const [categoryId, setCategoryId] = useState<string>('');
    const [supplier, setSupplier] = useState('');
    const [amount, setAmount] = useState<string | number>('');
    const [description, setDescription] = useState('');
    const [paymentProofName, setPaymentProofName] = useState<string | undefined>();
    const [paymentProofBase64, setPaymentProofBase64] = useState<string | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Reset form
            setDate(new Date().toISOString().split('T')[0]);
            setCategoryId(budget?.categories[0]?.id.toString() || '');
            setSupplier('');
            setAmount('');
            setDescription('');
            setPaymentProofName(undefined);
            setPaymentProofBase64(undefined);
            setIsSubmitting(false);
        }
    }, [isOpen, budget]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const { name, base64 } = await fileToBase64(file);
                setPaymentProofName(name);
                setPaymentProofBase64(base64);
            } catch (error) {
                showToast('Error al procesar el archivo.', 'error');
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryId || !amount || !description.trim() || !supplier.trim()) {
            showToast('Por favor, complete todos los campos obligatorios.', 'error');
            return;
        }

        if (!budget) {
            showToast('Error: No se encontró un presupuesto para asociar el gasto.', 'error');
            return;
        }
        
        setIsSubmitting(true);
        const newExpense = {
            date,
            categoryId: Number(categoryId),
            amount: Number(amount),
            supplier,
            description,
            paymentProofName,
            paymentProofBase64,
        };

        onSubmit(newExpense as any);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-dark-gray">Registrar Nuevo Gasto Administrativo</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="expense-date" className="block text-sm font-medium text-slate-700">Fecha</label>
                            <input type="date" id="expense-date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="expense-category" className="block text-sm font-medium text-slate-700">Rubro</label>
                            <select id="expense-category" value={categoryId} onChange={e => setCategoryId(e.target.value)} required className="mt-1 w-full p-2 border border-slate-300 rounded-md">
                                <option value="" disabled>Seleccione un rubro...</option>
                                {budget?.categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="expense-supplier" className="block text-sm font-medium text-slate-700">Proveedor</label>
                            <input type="text" id="expense-supplier" value={supplier} onChange={e => setSupplier(e.target.value)} required className="mt-1 w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                         <div>
                            <label htmlFor="expense-amount" className="block text-sm font-medium text-slate-700">Monto (¢)</label>
                            <input type="number" id="expense-amount" value={amount} onChange={e => setAmount(e.target.value)} required min="0" step="any" className="mt-1 w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="expense-description" className="block text-sm font-medium text-slate-700">Descripción</label>
                        <textarea id="expense-description" rows={3} value={description} onChange={e => setDescription(e.target.value)} required className="mt-1 w-full p-2 border border-slate-300 rounded-md" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Adjuntar Comprobante (Opcional)</label>
                        <div className="mt-1 flex items-center gap-4">
                            <input type="file" id="expense-proof" onChange={handleFileChange} accept=".pdf,image/*" className="hidden" />
                            <label htmlFor="expense-proof" className="cursor-pointer bg-white py-1.5 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                                {paymentProofName ? 'Cambiar Archivo' : 'Seleccionar Archivo'}
                            </label>
                            {paymentProofName && <span className="text-sm text-primary">{paymentProofName}</span>}
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t border-light-gray">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark disabled:bg-slate-400">
                            {isSubmitting ? 'Guardando...' : 'Guardar Gasto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
