import React, { useState, useEffect } from 'react';
import { AccountReceivable, Payment } from '../../types';
import { analyzePaymentProof } from '../../services/geminiService';
import { useToast } from '../../context/ToastContext';
import { formatNumber } from '../../utils/format';

const fileToBase64 = (file: File): Promise<{ base64: string, mimeType: string }> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const mimeType = result.substring(5, result.indexOf(';'));
        const base64 = result.split(',')[1];
        resolve({ base64, mimeType });
    };
    reader.onerror = error => reject(error);
});

const AILoadingSpinner: React.FC = () => (
    <div className="flex items-center space-x-2">
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Analizando...</span>
    </div>
);


interface AddPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: AccountReceivable;
    onSubmit: (accountId: number, paymentData: { amount: number; date: string; details: string; proofAttachmentName?: string; proofAttachmentBase64?: string }) => void;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ isOpen, onClose, account, onSubmit }) => {
    const { showToast } = useToast();
    const [amount, setAmount] = useState<string>('');
    const [date, setDate] = useState<string>('');
    const [details, setDetails] = useState<string>('');
    const [error, setError] = useState<string>('');

    const [file, setFile] = useState<File | null>(null);
    const [fileBase64, setFileBase64] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const paidAmount = account.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const receivableAmount = Number(account.contractAmount) - paidAmount;

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setDetails('');
            setError('');
            setFile(null);
            setFileBase64(null);
            setMimeType('');
            setIsAnalyzing(false);
        }
    }, [isOpen]);


    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAmount(value);
        const numericValue = parseFloat(value);
        if (numericValue > receivableAmount) {
            setError(`El monto no puede exceder el saldo de ¢${formatNumber(receivableAmount)}`);
        } else if (numericValue <= 0) {
            setError('El monto debe ser un número positivo.');
        } else {
            setError('');
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            try {
                const { base64, mimeType } = await fileToBase64(selectedFile);
                setFileBase64(base64);
                setMimeType(mimeType);
            } catch (error) {
                showToast('Error al procesar el archivo.', 'error');
                console.error(error);
            }
        }
    };

    const handleAnalyze = async () => {
        if (!fileBase64) {
            showToast('Por favor, seleccione un archivo primero.', 'info');
            return;
        }
        setIsAnalyzing(true);
        try {
            const result = await analyzePaymentProof(fileBase64, mimeType);
            setAmount(String(result.amount));
            setDate(result.date);
            setDetails(result.details);
            showToast('Comprobante analizado exitosamente. Revise los datos.', 'success');
        } catch (error: any) {
            showToast(error.message || 'Error al analizar el comprobante.', 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!error && numericAmount > 0) {
            onSubmit(account.id, {
                amount: numericAmount,
                date,
                details: details.trim(),
                proofAttachmentName: file?.name,
                proofAttachmentBase64: fileBase64 || undefined
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-dark-gray">Registrar Pago</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <p className="text-sm text-slate-600 mb-1">Cliente: <span className="font-medium text-slate-800">{account.clientName}</span></p>
                <p className="text-sm text-slate-600 mb-4">Saldo Pendiente: <span className="font-semibold text-red-600">¢{formatNumber(receivableAmount)}</span></p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Comprobante de Pago (PDF, JPG, PNG)</label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="file"
                                id="payment-proof"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                className="flex-grow text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
                            />
                            <button
                                type="button"
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || !file}
                                className="bg-secondary text-white font-bold py-2 px-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 text-sm disabled:bg-slate-400"
                            >
                                {isAnalyzing ? <AILoadingSpinner /> : '✨ Analizar con IA'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="payment-date" className="block text-sm font-medium text-slate-700 mb-1">Fecha de Pago</label>
                            <input
                                type="date"
                                id="payment-date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label htmlFor="payment-amount" className="block text-sm font-medium text-slate-700 mb-1">Monto a Cancelar (¢)</label>
                            <input
                                type="number"
                                id="payment-amount"
                                value={amount}
                                onChange={handleAmountChange}
                                required
                                autoFocus
                                className={`w-full p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${error ? 'border-red-500 ring-red-500' : 'border-slate-300 focus:ring-primary'}`}
                            />
                        </div>
                    </div>
                    {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
                    <div>
                        <label htmlFor="payment-details" className="block text-sm font-medium text-slate-700 mb-1">Detalle / Referencia</label>
                        <textarea
                            id="payment-details"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            rows={3}
                            placeholder="Ej: Transferencia #12345, abono factura #567"
                            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-light-gray">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={!!error || !amount || isAnalyzing} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                            Registrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
