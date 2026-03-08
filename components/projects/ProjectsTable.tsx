import React, { useState, useMemo } from 'react';
import { Project, AccountReceivable } from '../../types';
import { PROJECT_STATUS_COLORS } from '../../constants';

interface ProjectsTableProps {
    projects: Project[];
    accountsReceivable: AccountReceivable[];
    onViewDetails: (project: Project) => void;
}

// Define the shape of the data we'll actually use in the table
type EnrichedProject = Project & {
    balance: number;
    amountReceivable: number;
};

// Define the keys we can sort by
type SortableKey = 'id' | 'name' | 'owner' | 'status' | 'budget' | 'expenses' | 'balance' | 'amountReceivable';

const formatCurrency = (value: number) => {
    const num = Number(value);
    if (isNaN(num)) return '¢0,00';
    const parts = num.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `¢${parts[0]},${parts[1]}`;
};

export const ProjectsTable: React.FC<ProjectsTableProps> = ({ projects, accountsReceivable, onViewDetails }) => {

    const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'asc' | 'desc' } | null>({ key: 'id', direction: 'desc' });

    const sortedProjects = useMemo(() => {
        // 1. Enrich the project data with calculated fields
        const enriched: EnrichedProject[] = projects.map(project => {
            const balance = Number(project.budget) - Number(project.expenses);

            const associatedAR = accountsReceivable.find(ar => ar.offerId === project.offerId);
            const paidAmount = associatedAR ? associatedAR.payments.reduce((sum, p) => sum + Number(p.amount), 0) : 0;
            const amountReceivable = associatedAR ? Number(associatedAR.contractAmount) - paidAmount : 0;

            return {
                ...project,
                balance,
                amountReceivable
            };
        });

        // 2. Sort the enriched data
        if (sortConfig !== null) {
            enriched.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return enriched;

    }, [projects, accountsReceivable, sortConfig]);

    const requestSort = (key: SortableKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIndicator: React.FC<{ for_key: SortableKey }> = ({ for_key }) => {
        if (!sortConfig || sortConfig.key !== for_key) {
            return <span className="ml-1 text-slate-400 opacity-50">↕</span>;
        }
        return <span className="ml-1 text-slate-700">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    };


    return (
        <div className="overflow-x-auto">
            <p className="text-xs text-slate-500 italic mb-2">Haga doble clic en una fila para ver el resumen completo del proyecto.</p>
            <table className="min-w-full bg-white">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-200" onClick={() => requestSort('id')}>ID <SortIndicator for_key='id' /></th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-200" onClick={() => requestSort('name')}>Nombre del Proyecto <SortIndicator for_key='name' /></th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-200" onClick={() => requestSort('owner')}>Cliente <SortIndicator for_key='owner' /></th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-200" onClick={() => requestSort('status')}>Estado <SortIndicator for_key='status' /></th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-200" onClick={() => requestSort('budget')}>Presupuesto Modificado <SortIndicator for_key='budget' /></th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-200" onClick={() => requestSort('expenses')}>Total Compras <SortIndicator for_key='expenses' /></th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-200" onClick={() => requestSort('balance')}>Balance General <SortIndicator for_key='balance' /></th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-200" onClick={() => requestSort('amountReceivable')}>Monto por Cobrar <SortIndicator for_key='amountReceivable' /></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {sortedProjects.map((project) => (
                        <tr
                            key={project.id}
                            className="hover:bg-slate-100 cursor-pointer"
                            onDoubleClick={() => onViewDetails(project)}
                        >
                            <td className="py-4 px-4 text-sm font-medium text-slate-700">#{project.id}</td>
                            <td className="py-4 px-4 text-sm font-medium text-slate-900">{project.name}</td>
                            <td className="py-4 px-4 text-sm text-slate-600">{project.owner}</td>
                            <td className="py-4 px-4 text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${PROJECT_STATUS_COLORS[project.status] || 'bg-gray-200 text-gray-800'}`}>
                                    {project.status}
                                </span>
                            </td>
                            <td className="py-4 px-4 text-sm text-right font-mono font-semibold text-dark-gray">{formatCurrency(Number(project.budget))}</td>
                            <td className="py-4 px-4 text-sm text-right font-mono font-semibold text-orange-600">{formatCurrency(Number(project.expenses))}</td>
                            <td className={`py-4 px-4 text-sm text-right font-mono font-bold ${project.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(project.balance)}</td>
                            <td className="py-4 px-4 text-sm text-right font-mono font-semibold text-blue-600">{formatCurrency(project.amountReceivable)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {projects.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                    <p>No se encontraron proyectos.</p>
                </div>
            )}
        </div>
    );
};