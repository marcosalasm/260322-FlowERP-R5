import React from 'react';
import { AccountReceivable } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { formatNumber } from '../../utils/format';

interface PaymentHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: AccountReceivable;
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

export const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({ isOpen, onClose, account }) => {
    if (!isOpen) return null;

    const totalPaid = account.payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-dark-gray">Historial de Pagos</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <p className="text-sm text-slate-600 mb-4">Cliente: <span className="font-medium text-slate-800">{account.clientName}</span></p>

                <div className="max-h-80 overflow-y-auto border-t border-b border-slate-200 divide-y divide-slate-200">
                    {account.payments.length > 0 ? (
                        account.payments.map(payment => (
                            <div key={payment.id} className="p-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-slate-600">
                                            {format(new Date(payment.date), "dd 'de' MMMM, yyyy", { locale: es })}
                                        </p>
                                        {payment.details && (
                                            <p className="text-xs text-slate-500 mt-1 italic">
                                                {payment.details}
                                            </p>
                                        )}
                                        {payment.proofAttachmentName && (
                                            <a
                                                href={payment.proofAttachmentBase64 ? `data:${getMimeTypeFromName(payment.proofAttachmentName)};base64,${payment.proofAttachmentBase64}` : '#'}
                                                download={payment.proofAttachmentName}
                                                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                                                onClick={(e) => {
                                                    if (!payment.proofAttachmentBase64) {
                                                        e.preventDefault();
                                                        alert('No hay un archivo adjunto para descargar.');
                                                    }
                                                }}
                                                title={`Descargar ${payment.proofAttachmentName}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                {payment.proofAttachmentName}
                                            </a>
                                        )}
                                    </div>
                                    <span className="text-sm font-semibold text-dark-gray flex-shrink-0 ml-4">
                                        ¢{formatNumber(payment.amount)}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-slate-500 py-8">No se han registrados pagos.</p>
                    )}
                </div>

                <div className="flex justify-between items-center pt-4 font-bold text-dark-gray">
                    <span>Total Cancelado:</span>
                    <span className="text-lg text-green-600">¢{formatNumber(totalPaid)}</span>
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
