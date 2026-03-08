import React from 'react';
import { Offer, Project, ChangeOrder, ChangeOrderStatus, OfferStatus } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OfferDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    offer: Offer | null;
    project: Project | undefined;
    changeOrders: ChangeOrder[];
}

const formatCurrencyValue = (value: number) => {
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',');
};

const formatCurrency = (value: number) => `¢${formatCurrencyValue(value)}`;

const formatImpact = (impact: number) => {
    const isNegative = impact < 0;
    const color = isNegative ? 'text-red-600' : 'text-green-600';
    const sign = isNegative ? '' : '+'; // Negative sign is already part of the number
    return <span className={`${color} font-semibold`}>{sign}{formatCurrency(Math.abs(impact))}</span>;
};

const formatDate = (dateString: string) => {
    try {
        // Manually parse YYYY-MM-DD to avoid timezone issues with `new Date()`.
        const parts = dateString.split('-');
        if (parts.length !== 3) return dateString; // fallback for unexpected format
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        return format(date, "dd/MM/yyyy", { locale: es });
    } catch (error) {
        return dateString; // Fallback for invalid date strings
    }
};

const parseDdMmYyyy = (dateStr?: string): Date => {
    if (!dateStr) return new Date(0); // For sorting undefined dates to the beginning
    const [datePart, timePart] = dateStr.split(' ');
    // This function is specifically for "dd/MM/yyyy HH:mm"
    if (!datePart || !timePart) return new Date(0);
    const [day, month, year] = datePart.split('/');
    if (!day || !month || !year) return new Date(0);
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}:00`);
};

export const OfferDetailModal: React.FC<OfferDetailModalProps> = ({ isOpen, onClose, offer, project, changeOrders }) => {
    if (!isOpen || !offer) return null;

    const approvedChangeOrders = changeOrders
        .filter(co => co.status === ChangeOrderStatus.Approved)
        .sort((a, b) => parseDdMmYyyy(a.approvalDate).getTime() - parseDdMmYyyy(b.approvalDate).getTime());

    let runningTotal = project?.initialContractAmount || 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl transform transition-all flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start p-6 border-b border-light-gray">
                    <div>
                        <h2 className="text-2xl font-bold text-dark-gray">Detalle de Oferta</h2>
                        <p className="text-md text-medium-gray font-semibold">{offer.consecutiveNumber} - {offer.prospectName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[75vh] p-6">
                    {offer.status === OfferStatus.Aprobacion && project ? (
                        <section className="bg-slate-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-dark-gray mb-3">Historial de Monto del Proyecto por Órdenes de Cambio</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white text-sm border border-slate-200 rounded-md">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="p-2 text-left font-semibold text-slate-600">Fecha</th>
                                            <th className="p-2 text-left font-semibold text-slate-600">N° Orden</th>
                                            <th className="p-2 text-left font-semibold text-slate-600">Descripción</th>
                                            <th className="p-2 text-right font-semibold text-slate-600">Impacto</th>
                                            <th className="p-2 text-right font-semibold text-slate-600">Monto Acumulado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        <tr className="font-semibold bg-blue-50">
                                            <td className="p-2">{formatDate(project.creationDate)}</td>
                                            <td className="p-2"></td>
                                            <td className="p-2">Monto de Oferta Inicial</td>
                                            <td className="p-2 text-right font-mono"></td>
                                            <td className="p-2 text-right font-mono">{formatCurrency(project.initialContractAmount)}</td>
                                        </tr>

                                        {approvedChangeOrders.map(co => {
                                            runningTotal += co.amountImpact;
                                            return (
                                                <tr key={co.id}>
                                                    <td className="p-2 text-slate-600">{co.approvalDate?.split(' ')[0] || 'N/A'}</td>
                                                    <td className="p-2 font-medium text-slate-800">{co.consecutive}</td>
                                                    <td className="p-2 text-slate-700">{co.description}</td>
                                                    <td className="p-2 text-right font-mono">{formatImpact(co.amountImpact)}</td>
                                                    <td className="p-2 text-right font-mono">{formatCurrency(runningTotal)}</td>
                                                </tr>
                                            )
                                        })}

                                        <tr className="bg-slate-200 border-t-2 border-slate-300">
                                            <td colSpan={4} className="p-2 font-bold text-dark-gray text-right">MONTO MODIFICADO ACTUAL DEL PROYECTO</td>
                                            <td className="p-2 font-bold text-dark-gray text-right font-mono">{formatCurrency(project.contractAmount)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-slate-500">El historial de montos solo está disponible para ofertas aprobadas que han generado un proyecto.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};