
import React from 'react';
import { Payment } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

interface EnrichedPayment extends Payment {
    supplierName: string;
    invoiceNumber: string;
}

interface ProjectPurchasePaymentsProps {
    payments: EnrichedPayment[];
}

const formatCurrency = (value: number) => {
    const num = Number(value);
    if (isNaN(num)) return '¢0,00';
    const parts = num.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `¢${parts[0]},${parts[1]}`;
};

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

const AttachmentIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
);

export const ProjectPurchasePayments: React.FC<ProjectPurchasePaymentsProps> = ({ payments }) => {
    if (payments.length === 0) {
        return (
            <section>
                <h3 className="text-lg font-semibold text-dark-gray mb-3">Pagos Realizados a Proveedores</h3>
                <div className="bg-white p-4 rounded-md shadow-sm text-center border">
                    <p className="text-sm text-slate-500">No se han registrado pagos a proveedores para este proyecto aún.</p>
                </div>
            </section>
        );
    }

    return (
        <section>
            <h3 className="text-lg font-semibold text-dark-gray mb-3">Pagos Realizados a Proveedores (Egresos)</h3>
            <div className="bg-white p-4 rounded-md shadow-sm border">
                <div className="overflow-hidden border border-slate-200 rounded-lg">
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Fecha</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Proveedor</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Factura / Ref</th>
                                <th className="py-2 px-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Monto Pagado</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Detalles</th>
                                <th className="py-2 px-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">Comprobante</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {payments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-2 px-3 text-slate-600">{format(new Date(payment.date), 'dd/MM/yyyy', { locale: es })}</td>
                                    <td className="py-2 px-3 font-medium text-slate-800">{payment.supplierName}</td>
                                    <td className="py-2 px-3 text-slate-600">{payment.invoiceNumber}</td>
                                    <td className="py-2 px-3 text-right font-mono font-semibold text-orange-700">{formatCurrency(Number(payment.amount))}</td>
                                    <td className="py-2 px-3 text-slate-500 text-xs italic max-w-xs truncate" title={payment.details}>{payment.details || 'N/A'}</td>
                                    <td className="py-2 px-3 text-center">
                                        {payment.proofAttachmentName ? (
                                            <a
                                                href={payment.proofAttachmentBase64 ? `data:${getMimeTypeFromName(payment.proofAttachmentName)};base64,${payment.proofAttachmentBase64}` : '#'}
                                                download={payment.proofAttachmentName}
                                                className="text-primary hover:text-primary-dark inline-block transition-transform hover:scale-110"
                                                title={`Descargar Comprobante: ${payment.proofAttachmentName}`}
                                                onClick={(e) => !payment.proofAttachmentBase64 && e.preventDefault()}
                                            >
                                                <AttachmentIcon />
                                            </a>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex justify-end">
                    <div className="bg-orange-50 text-orange-800 p-3 rounded-md border border-orange-100 min-w-[250px] text-right">
                        <p className="text-xs font-bold uppercase text-slate-500">Total Desembolsado</p>
                        <p className="text-xl font-bold font-mono">{formatCurrency(payments.reduce((sum, p) => sum + Number(p.amount), 0))}</p>
                    </div>
                </div>
            </div>
        </section>
    );
};
