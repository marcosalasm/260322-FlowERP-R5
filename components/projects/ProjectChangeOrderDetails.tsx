import React from 'react';
import { ChangeOrder, ChangeOrderStatus } from '../../types';
import { CHANGE_ORDER_STATUS_COLORS } from '../../constants';

interface ProjectChangeOrderDetailsProps {
    changeOrders: ChangeOrder[];
}

const formatImpact = (impact: number, type: 'Adicional' | 'Crédito') => {
    const isNegative = type === 'Crédito';
    const color = isNegative ? 'text-red-600' : 'text-green-600';
    const sign = isNegative ? '-' : '+';
    return <span className={`${color} font-semibold font-mono`}>{sign}¢{impact.toLocaleString()}</span>;
};

export const ProjectChangeOrderDetails: React.FC<ProjectChangeOrderDetailsProps> = ({ changeOrders }) => {
    if (changeOrders.length === 0) {
        return (
            <div className="bg-white p-4 rounded-md shadow-sm text-center">
                <p className="text-sm text-slate-500">Este proyecto no tiene órdenes de cambio asociadas.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-md shadow-sm">
            <h4 className="text-md font-semibold text-dark-gray mb-3">Órdenes de Cambio del Proyecto</h4>
            <div className="overflow-hidden border border-slate-200 rounded-lg">
                <table className="min-w-full bg-white text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">N° Orden</th>
                            <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Descripción</th>
                            <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Tipo</th>
                            <th className="py-2 px-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Impacto Monto</th>
                            <th className="py-2 px-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Impacto Presupuesto</th>
                            <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {changeOrders.map(co => (
                            <tr key={co.id}>
                                <td className="py-2 px-3 font-medium text-slate-700">{co.consecutive}</td>
                                <td className="py-2 px-3 text-slate-600 max-w-sm truncate">{co.description}</td>
                                <td className="py-2 px-3 text-slate-600">
                                    <span className={`font-semibold ${co.changeType === 'Crédito' ? 'text-red-700' : 'text-green-700'}`}>
                                        {co.changeType}
                                    </span>
                                </td>
                                <td className="py-2 px-3 text-right">{formatImpact(co.amountImpact, co.changeType)}</td>
                                <td className="py-2 px-3 text-right">{formatImpact(co.budgetImpact, co.changeType)}</td>
                                <td className="py-2 px-3">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${CHANGE_ORDER_STATUS_COLORS[co.status] || 'bg-gray-200 text-gray-800'}`}>
                                      {co.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};