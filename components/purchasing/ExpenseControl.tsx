import React, { useState, useMemo, useContext } from 'react';
import { Project, PurchaseOrder, POStatus, ServiceRequest, ServiceRequestStatus } from '../../types';
import { AppContext } from '../../context/AppContext';
import { ExpenseDetailModal } from './ExpenseDetailModal';

interface ProjectExpenseSummary {
    project: Project;
    approvedExpenses: number;
    pendingExpenses: number;
}

const formatCurrency = (value: number) => { const num = Number(value); if (isNaN(num)) return '¢0.00'; return `¢${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}`; };;

export const ExpenseControl: React.FC = () => {
    const appContext = useContext(AppContext);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const { projects, purchaseOrders, serviceRequests, quoteResponses } = appContext || {};

    const projectExpenseSummary = useMemo((): ProjectExpenseSummary[] => {
        if (!projects || !purchaseOrders || !serviceRequests || !quoteResponses) {
            return [];
        }

        return projects.map(project => {
            // Approved expenses are now taken directly from the project object, calculated centrally
            const approvedExpenses = project.expenses;
            
            // Pending expenses from Service Requests pending PO approval
            const pendingRequests = serviceRequests.filter(sr =>
                sr.projectId === project.id &&
                sr.status === ServiceRequestStatus.POPendingApproval &&
                sr.winnerSelection
            );
            
            const pendingExpenses = pendingRequests.reduce((sum, request) => {
                let requestTotal = 0;
                if (request.winnerSelection) {
                    // This calculates the total for a single service request based on winning quotes
                    const totalAdjudicado = Object.keys(request.winnerSelection).reduce((acc, itemId) => {
                        const winnerInfo = request.winnerSelection![parseInt(itemId, 10)];
                        const serviceItem = request.items.find(i => i.id === parseInt(itemId, 10));
                        const quote = quoteResponses.find(q => q.id === winnerInfo.quoteResponseId);
                        const quoteItem = quote?.items.find(qi => qi.serviceRequestItemId === parseInt(itemId, 10));
                        
                        if(serviceItem && quoteItem) {
                            return acc + (serviceItem.quantity * quoteItem.unitPrice);
                        }
                        return acc;
                    }, 0);
                    requestTotal = totalAdjudicado;
                }
                return sum + requestTotal;
            }, 0);

            return {
                project,
                approvedExpenses,
                pendingExpenses
            };
        });
    }, [projects, purchaseOrders, serviceRequests, quoteResponses]);

    const handleViewDetails = (project: Project) => {
        setSelectedProject(project);
    };

    return (
        <>
            <div className="overflow-x-auto">
                <p className="text-xs text-slate-500 italic mb-2">Doble click en una fila para ver el desglose de gastos del proyecto.</p>
                <table className="min-w-full bg-white">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre del Proyecto</th>
                            <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Gastos Aprobados</th>
                            <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Gastos en Trámite</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {projectExpenseSummary.map(summary => (
                            <tr key={summary.project.id} className="hover:bg-slate-50 cursor-pointer" onDoubleClick={() => handleViewDetails(summary.project)}>
                                <td className="py-4 px-4 text-sm font-medium text-slate-900">{summary.project.name}</td>
                                <td className="py-4 px-4 text-sm text-green-600 text-right font-mono font-semibold">{formatCurrency(summary.approvedExpenses)}</td>
                                <td className="py-4 px-4 text-sm text-orange-600 text-right font-mono font-semibold">{formatCurrency(summary.pendingExpenses)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {projectExpenseSummary.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                        <p>No hay proyectos con gastos para mostrar.</p>
                    </div>
                )}
            </div>
            {selectedProject && (
                <ExpenseDetailModal
                    isOpen={!!selectedProject}
                    onClose={() => setSelectedProject(null)}
                    project={selectedProject}
                />
            )}
        </>
    );
};