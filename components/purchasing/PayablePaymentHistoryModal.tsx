import React, { useContext } from 'react';
import { AccountPayable } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { AppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/format';

interface PayablePaymentHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: AccountPayable | null;
}

const getMimeTypeFromName = (name: string): string => {
    const extension = name.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'pdf': return 'application/pdf';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'png': return 'image/png';
        default: return 'application/octet-stream';
    }
};

export const PayablePaymentHistoryModal: React.FC<PayablePaymentHistoryModalProps> = ({ isOpen, onClose, account }) => {
    const appContext = useContext(AppContext);
    if (!isOpen || !account || !appContext) return null;
    const { creditNotes } = appContext;

    const paymentsHistory = account.payments.map(p => ({
        type: 'payment',
        id: `p-${p.id}`,
        date: p.date,
        amount: p.amount,
        details: p.details,
        paidBy: p.paidBy,
        proofAttachmentName: p.proofAttachmentName,
        proofAttachmentBase64: p.proofAttachmentBase64,
    }));

    const creditHistory = (account.appliedCreditNoteIds || [])
        .map(cnId => creditNotes.find(cn => cn.id === cnId))
        .filter((cn): cn is NonNullable<typeof cn> => !!cn)
        .map(cn => ({
            type: 'credit',
            id: `cn-${cn.id}`,
            date: cn.approvalDate || cn.creationDate,
            amount: cn.totalAmount,
            details: `Aplicación de Nota de Crédito #${cn.id}`,
            paidBy: cn.createdBy,
            proofAttachmentName: cn.pdfAttachmentName,
            proofAttachmentBase64: cn.pdfAttachmentBase64,
        }));

    const combinedHistory = [...paymentsHistory, ...creditHistory]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalPaid = account.paidAmount;
    const totalCredited = account.creditedAmount || 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-dark-gray">Historial de Transacciones</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <p className="text-sm text-slate-600 mb-4">Proveedor: <span className="font-medium text-slate-800">{account.supplierName}</span></p>

                <div className="max-h-80 overflow-y-auto border-t border-b border-slate-200 divide-y divide-slate-200">
                    {combinedHistory.length > 0 ? (
                        combinedHistory.map(item => (
                            <div key={item.id} className={`p-3 ${item.type === 'credit' ? 'bg-purple-50' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-slate-600">
                                            {format(new Date(item.date), "dd 'de' MMMM, yyyy", { locale: es })}
                                        </p>
                                        {item.details && (
                                            <p className="text-xs text-slate-500 mt-1 italic">
                                                {item.details}
                                            </p>
                                        )}
                                        {item.paidBy && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                {item.type === 'payment' ? 'Registrado por' : 'Creado por'}: <strong>{item.paidBy}</strong>
                                            </p>
                                        )}
                                        {item.proofAttachmentName && (
                                            <a
                                                href={item.proofAttachmentBase64 ? `data:${getMimeTypeFromName(item.proofAttachmentName)};base64,${item.proofAttachmentBase64}` : '#'}
                                                download={item.proofAttachmentName}
                                                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                                                onClick={(e) => {
                                                    if (!item.proofAttachmentBase64) {
                                                        e.preventDefault();
                                                        alert('No hay un archivo adjunto para descargar.');
                                                    }
                                                }}
                                                title={`Descargar ${item.proofAttachmentName}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                {item.proofAttachmentName}
                                            </a>
                                        )}
                                    </div>
                                    <span className={`text-sm font-semibold flex-shrink-0 ml-4 ${item.type === 'payment' ? 'text-dark-gray' : 'text-purple-700'}`}>
                                        {item.type === 'credit' ? '-' : ''}¢{formatCurrency(item.amount)}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-slate-500 py-8">No se han registrados pagos o abonos.</p>
                    )}
                </div>

                <div className="pt-4 space-y-2">
                    <div className="flex justify-between items-center font-semibold text-dark-gray">
                        <span>Total Pagado:</span>
                        <span className="text-lg text-green-600 font-mono">¢{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center font-semibold text-dark-gray">
                        <span>Total Abonado (N.C.):</span>
                        <span className="text-lg text-purple-600 font-mono">-¢{formatCurrency(totalCredited)}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-dark-gray pt-2 border-t mt-2">
                        <span>Saldo Pendiente:</span>
                        <span className="text-xl text-red-600 font-mono">¢{formatCurrency(account.totalAmount - totalPaid - totalCredited)}</span>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button type="button" onClick={onClose} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};