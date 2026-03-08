
import React from 'react';
import { Project, Offer, OfferStatus } from '../../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';

export type DetailType = 'activeProjects' | 'budget' | 'expenses' | 'balance' | 'offers' | null;

interface DashboardDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: DetailType;
    projects: Project[];
    offers: Offer[];
}

const formatCurrency = (value: number) => { const num = Number(value); if (isNaN(num)) return '¢0.00'; return `¢${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}`; };;

export const DashboardDetailModal: React.FC<DashboardDetailModalProps> = ({ isOpen, onClose, type, projects, offers }) => {
    if (!isOpen || !type) return null;

    let title = '';
    let content = null;

    // Filter offers strictly for the pipeline metric (Revision, Confeccion, or Aprobacion)
    const pipelineOffers = offers.filter(o =>
        o.status === OfferStatus.Revision ||
        o.status === OfferStatus.Confeccion ||
        o.status === OfferStatus.Aprobacion
    );

    switch (type) {
        case 'activeProjects':
            title = 'Detalle de Proyectos Activos';
            content = (
                <table className="min-w-full bg-white text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="py-3 px-4 text-left font-bold text-slate-600 uppercase tracking-tighter">Proyecto</th>
                            <th className="py-3 px-4 text-left font-bold text-slate-600 uppercase tracking-tighter">Cliente</th>
                            <th className="py-3 px-4 text-left font-bold text-slate-600 uppercase tracking-tighter">Ubicación</th>
                            <th className="py-3 px-4 text-left font-bold text-slate-600 uppercase tracking-tighter">Fecha Inicio</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {projects.length > 0 ? projects.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                                <td className="py-3 px-4 text-slate-600 font-medium">{p.owner}</td>
                                <td className="py-3 px-4 text-slate-500">{p.location}</td>
                                <td className="py-3 px-4 text-slate-500 font-mono italic">{format(parseISO(p.creationDate), 'dd/MM/yyyy', { locale: es })}</td>
                            </tr>
                        )) : <tr><td colSpan={4} className="p-8 text-center text-slate-400 font-medium italic">No hay proyectos activos en este periodo.</td></tr>}
                    </tbody>
                </table>
            );
            break;

        case 'budget':
            title = 'Detalle de Ingresos Previstos';
            content = (
                <table className="min-w-full bg-white text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="py-3 px-4 text-left font-bold text-slate-600 uppercase tracking-tighter">Proyecto</th>
                            <th className="py-3 px-4 text-right font-bold text-slate-600 uppercase tracking-tighter">Monto Contrato</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {projects.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                                <td className="py-3 px-4 text-right font-mono text-blue-600 font-bold">{formatCurrency(Number(p.contractAmount || 0))}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                        <tr>
                            <td className="py-4 px-4 font-extrabold text-slate-900 text-right">TOTAL INGRESOS:</td>
                            <td className="py-4 px-4 text-right font-mono font-black text-blue-800 text-lg">
                                {formatCurrency(projects.reduce((sum, p) => sum + Number(p.contractAmount || 0), 0))}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            );
            break;

        case 'expenses':
            title = 'Detalle de Gastos de Proyectos';
            content = (
                <table className="min-w-full bg-white text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="py-3 px-4 text-left font-bold text-slate-600 uppercase tracking-tighter">Proyecto</th>
                            <th className="py-3 px-4 text-right font-bold text-slate-600 uppercase tracking-tighter">Ejecutado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {projects.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                                <td className="py-3 px-4 text-right font-mono text-orange-600 font-bold">{formatCurrency(Number(p.expenses))}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                        <tr>
                            <td className="py-4 px-4 font-extrabold text-slate-900 text-right">TOTAL GASTOS:</td>
                            <td className="py-4 px-4 text-right font-mono font-black text-orange-800 text-lg">
                                {formatCurrency(projects.reduce((sum, p) => sum + Number(p.expenses), 0))}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            );
            break;

        case 'balance':
            title = 'Detalle de Balance Operativo';
            content = (
                <table className="min-w-full bg-white text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="py-3 px-4 text-left font-bold text-slate-600 uppercase tracking-tighter">Proyecto</th>
                            <th className="py-3 px-4 text-right font-bold text-slate-600 uppercase tracking-tighter">Contrato</th>
                            <th className="py-3 px-4 text-right font-bold text-slate-600 uppercase tracking-tighter">Gastos</th>
                            <th className="py-3 px-4 text-right font-bold text-slate-600 uppercase tracking-tighter">Margen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {projects.map(p => {
                            const balance = Number(p.contractAmount || 0) - Number(p.expenses);
                            return (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                                    <td className="py-3 px-4 text-right font-mono text-slate-600">{formatCurrency(Number(p.contractAmount || 0))}</td>
                                    <td className="py-3 px-4 text-right font-mono text-slate-600">{formatCurrency(Number(p.expenses))}</td>
                                    <td className={`py-3 px-4 text-right font-mono font-black ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(balance)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                        <tr>
                            <td colSpan={3} className="py-4 px-4 font-extrabold text-slate-900 text-right text-lg">BALANCE NETO OPERATIVO:</td>
                            <td className="py-4 px-4 text-right font-mono font-black text-slate-900 text-xl underline decoration-double">
                                {formatCurrency(projects.reduce((sum, p) => sum + (Number(p.contractAmount || 0) - Number(p.expenses)), 0))}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            );
            break;

        case 'offers':
            title = 'Pipeline de Ventas (Ofertas Activas)';
            content = (
                <table className="min-w-full bg-white text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="py-3 px-4 text-left font-bold text-slate-600 uppercase tracking-tighter">N° Oferta</th>
                            <th className="py-3 px-4 text-left font-bold text-slate-600 uppercase tracking-tighter">Cliente</th>
                            <th className="py-3 px-4 text-left font-bold text-slate-600 uppercase tracking-tighter">Fecha</th>
                            <th className="py-3 px-4 text-left font-bold text-slate-600 uppercase tracking-tighter">Estado</th>
                            <th className="py-3 px-4 text-right font-bold text-slate-600 uppercase tracking-tighter">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {pipelineOffers.length > 0 ? pipelineOffers.map(o => (
                            <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-800">{o.consecutiveNumber}</td>
                                <td className="py-3 px-4 text-slate-600 font-medium">{o.prospectName}</td>
                                <td className="py-3 px-4 text-slate-500 font-mono">{format(parseISO(o.date), 'dd/MM/yyyy', { locale: es })}</td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${o.status === OfferStatus.Revision ? 'bg-yellow-100 text-yellow-800' :
                                            o.status === OfferStatus.Aprobacion ? 'bg-blue-100 text-blue-800' :
                                                'bg-slate-100 text-slate-800'
                                        }`}>
                                        {o.status}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-slate-900 font-black">{formatCurrency(Number(o.amount))}</td>
                            </tr>
                        )) : <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium italic">No hay ofertas en proceso en este periodo.</td></tr>}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                        <tr>
                            <td colSpan={4} className="py-4 px-4 font-extrabold text-slate-900 text-right">POTENCIAL DE VENTAS:</td>
                            <td className="py-4 px-4 text-right font-mono font-black text-blue-800 text-lg">
                                {formatCurrency(pipelineOffers.reduce((sum, o) => sum + Number(o.amount), 0))}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            );
            break;
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4 transition-all" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-5xl max-h-[90vh] flex flex-col transform scale-100 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
                        <p className="text-slate-500 text-sm font-medium">Información detallada para el período seleccionado</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto border border-slate-200 rounded-xl shadow-inner bg-slate-50/30">
                    {content}
                </div>
                <div className="mt-6 flex justify-end flex-shrink-0">
                    <button onClick={onClose} className="bg-slate-800 text-white font-black py-3 px-8 rounded-xl hover:bg-slate-900 transform active:scale-95 transition-all shadow-lg hover:shadow-xl">
                        CERRAR DETALLE
                    </button>
                </div>
            </div>
        </div>
    );
};
