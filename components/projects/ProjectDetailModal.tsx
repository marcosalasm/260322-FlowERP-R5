
import React, { useMemo, useState, useContext } from 'react';
import { Project, ChangeOrder, AccountReceivable, PurchaseOrder, AccountPayable, POStatus, Budget, Offer, ProjectStatus, ServiceRequestStatus, ServiceRequest, Subcontract } from '../../types';
import { ProjectChangeOrderDetails } from './ProjectChangeOrderDetails';
import { PROJECT_STATUS_COLORS } from '../../constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { ProjectMaterialsModal } from './ProjectMaterialsModal';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';
import { ProjectAccountsPayable } from './ProjectAccountsPayable';
import { ProjectPurchasePayments } from './ProjectPurchasePayments';

interface ProjectDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    changeOrders: ChangeOrder[];
    accountsReceivable: AccountReceivable[];
    purchaseOrders: PurchaseOrder[];
    accountsPayable: AccountPayable[];
    subcontracts: Subcontract[];
    budgets: Budget[];
    offers: Offer[];
}

const formatCurrency = (value: number) => {
    const num = Number(value);
    if (isNaN(num)) return '¢0,00';
    const parts = num.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `¢${parts[0]},${parts[1]}`;
};

const FinancialStat: React.FC<{ label: string; value: string; color?: string; className?: string }> = ({ label, value, color = 'text-dark-gray', className = '' }) => (
    <div className={`bg-slate-50 p-4 rounded-lg ${className}`}>
        <p className="text-sm text-slate-500">{label}</p>
        <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
    </div>
);

const KPIStat: React.FC<{ label: string; value: number; }> = ({ label, value }) => {
    const color = value >= 0 ? 'text-green-600' : 'text-red-600';
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-md font-semibold text-slate-700">{label}</p>
            <p className={`text-3xl font-bold font-mono ${color}`}>{formatCurrency(value)}</p>
        </div>
    );
};

const AttachmentIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
);

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
    isOpen,
    onClose,
    project,
    setProjects,
    changeOrders,
    accountsReceivable,
    purchaseOrders,
    accountsPayable,
    subcontracts,
    budgets,
    offers
}) => {
    const appContext = useContext(AppContext);
    const { showToast } = useToast();
    const { can } = usePermissions();
    const [isMaterialsModalOpen, setIsMaterialsModalOpen] = useState(false);

    const { user, roles, serviceRequests, preOpExpenses, preOpRubros } = appContext!;

    const userRoleNames = useMemo(() => new Set(user.roleIds.map(id => roles.find(r => r.id === id)?.name)), [user, roles]);
    const canChangeStatus = useMemo(() =>
        (userRoleNames.has('Director de proyectos') || userRoleNames.has('Director financiero') || userRoleNames.has('Gerente General')) && project.status !== ProjectStatus.Completed
        , [userRoleNames, project.status]);


    const projectData = useMemo(() => {
        const totalExpenses = Number(project.expenses);
        const associatedAR = accountsReceivable.find(ar => ar.offerId === project.offerId);
        const paidAmount = associatedAR ? associatedAR.payments.reduce((sum, p) => sum + Number(p.amount), 0) : 0;
        const outstandingReceivables = associatedAR ? Number(associatedAR.contractAmount) - paidAmount : 0;
        const projectBalance = Number(project.contractAmount) - totalExpenses;
        const budgetCompliance = Number(project.budget) - totalExpenses;

        const offer = offers.find(o => o.id === project.offerId);
        const budget = budgets.find(b => b.id === offer?.budgetId);
        const totalUnforeseenBudget = budget ? budget.directCostTotal * (budget.indirectCosts.unexpected / 100) : 0;

        // Breakdown of pre-op vs direct purchases
        const linkedPreOpExpensesList = offer && preOpExpenses
            ? preOpExpenses.filter(e => e.prospectId === offer.prospectId)
            : [];

        const linkedPreOpAmount = linkedPreOpExpensesList.reduce((sum, e) => sum + Number(e.totalGasto), 0);

        const unforeseenItems = serviceRequests
            .filter(sr => sr.projectId === project.id && [ServiceRequestStatus.Approved, ServiceRequestStatus.InQuotation, ServiceRequestStatus.QuotationReady, ServiceRequestStatus.POPendingApproval, ServiceRequestStatus.POApproved, ServiceRequestStatus.Completed].includes(sr.status))
            .flatMap(sr => sr.items.filter(item => item.isUnforeseen).map(item => ({ ...item, serviceRequestId: sr.id })));

        const filteredChangeOrders = changeOrders
            .filter(co => co.offerId === project.offerId);

        const projectPOIds = new Set(purchaseOrders.filter(po => po.projectId === project.id).map(po => po.id));
        const projectSubcontractIds = new Set(subcontracts.filter(sc => sc.projectId === project.id).map(sc => sc.id));

        const totalAccountsPayable = accountsPayable
            .filter(ap =>
                (ap.purchaseOrderId && projectPOIds.has(ap.purchaseOrderId)) ||
                (ap.subcontractId && projectSubcontractIds.has(ap.subcontractId))
            )
            .reduce((sum, ap) => {
                const balance = Number(ap.totalAmount) - Number(ap.paidAmount) - (Number(ap.creditedAmount) || 0);
                return sum + (balance > 0 ? balance : 0);
            }, 0);

        // All project-related purchase payments
        const purchasePayments = accountsPayable
            .filter(ap =>
                (ap.purchaseOrderId && projectPOIds.has(ap.purchaseOrderId)) ||
                (ap.subcontractId && projectSubcontractIds.has(ap.subcontractId))
            )
            .flatMap(ap => ap.payments.map(p => ({
                ...p,
                supplierName: ap.supplierName,
                invoiceNumber: ap.invoiceNumber
            })))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
            totalExpenses,
            linkedPreOpAmount,
            directPurchaseAmount: totalExpenses - linkedPreOpAmount,
            outstandingReceivables,
            paidAmount,
            projectBalance,
            budgetCompliance,
            filteredChangeOrders,
            payments: associatedAR?.payments || [],
            purchasePayments,
            totalUnforeseenBudget,
            unforeseenItems,
            totalAccountsPayable,
            linkedPreOpExpensesList
        };
    }, [project, purchaseOrders, accountsReceivable, changeOrders, budgets, offers, serviceRequests, subcontracts, preOpExpenses]);

    if (!isOpen) return null;

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as ProjectStatus;

        const performUpdate = () => {
            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: newStatus } : p));
            showToast(`Estado del proyecto actualizado a "${newStatus}".`, 'success');
        };

        if (newStatus === ProjectStatus.Completed) {
            if (window.confirm('ADVERTENCIA: ¿Está seguro de que desea finalizar este proyecto? Al hacerlo, se bloqueará la creación de nuevas compras y gastos (a excepción de las garantías).')) {
                performUpdate();
            } else {
                e.target.value = project.status;
            }
        } else {
            performUpdate();
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] transform transition-all flex flex-col" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex-shrink-0 flex justify-between items-start p-6 border-b border-light-gray">
                        <div>
                            <h2 className="text-3xl font-bold text-dark-gray">{project.name}</h2>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                <span>ID Proyecto: <span className="font-semibold text-slate-700">#{project.id}</span></span>
                                {project.offerId && <span>ID Oferta Origen: <span className="font-semibold text-slate-700">#{project.offerId}</span></span>}
                                <span>Cliente: <span className="font-semibold text-slate-700">{project.owner}</span></span>
                                <div className="flex items-center gap-2">
                                    <label htmlFor="project-status-detail" className="font-medium">Estado:</label>
                                    {can('projects', 'main', 'edit') && canChangeStatus ? (
                                        <select
                                            id="project-status-detail"
                                            value={project.status}
                                            onChange={handleStatusChange}
                                            className={`px-2 py-0.5 text-xs leading-5 font-semibold rounded-full border border-transparent focus:outline-none focus:ring-2 focus:ring-primary ${PROJECT_STATUS_COLORS[project.status]} cursor-pointer`}
                                        >
                                            {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    ) : (
                                        <span className={`px-2 py-0.5 text-xs leading-5 font-semibold rounded-full ${PROJECT_STATUS_COLORS[project.status]}`}>
                                            {project.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsMaterialsModalOpen(true)}
                                className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 text-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2-2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h4a1 1 0 100-2H7zm0 4a1 1 0 100 2h4a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                                Gestión de Materiales
                            </button>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-6 space-y-8 bg-slate-100/50">
                        {/* Financial Summary & KPIs */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-dark-gray">Resumen Financiero</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FinancialStat label="Monto Inicial" value={formatCurrency(project.initialContractAmount)} />
                                    <FinancialStat label="Presupuesto Inicial" value={formatCurrency(project.initialBudget)} />
                                    <FinancialStat label="Monto Modificado" value={formatCurrency(project.contractAmount)} />
                                    <FinancialStat label="Presupuesto Modificado" value={formatCurrency(project.budget)} />
                                    <div className="bg-slate-50 p-4 rounded-lg border border-orange-100 col-span-2">
                                        <p className="text-sm text-slate-500">Total Gastos Reales (Pagos + Pre-Op)</p>
                                        <p className="text-2xl font-bold font-mono text-orange-600">{formatCurrency(projectData.totalExpenses)}</p>
                                        <div className="mt-2 grid grid-cols-2 text-[10px] uppercase font-bold text-slate-400">
                                            <span>OC Aprobadas: {formatCurrency(projectData.directPurchaseAmount)}</span>
                                            <span>Pre-Operativos: {formatCurrency(projectData.linkedPreOpAmount)}</span>
                                        </div>
                                    </div>
                                    <FinancialStat label="Cuentas por Pagar Totales" value={formatCurrency(projectData.totalAccountsPayable)} color="text-red-600" className="col-span-2" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-dark-gray">Indicadores Clave</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <KPIStat label="Balance General del Proyecto" value={projectData.projectBalance} />
                                    <KPIStat label="Cumplimiento de Presupuesto" value={projectData.budgetCompliance} />
                                    <div className="bg-white p-4 rounded-lg shadow-sm border grid grid-cols-3 gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-500">Total Imprevistos</p>
                                            <p className="text-xl font-bold font-mono text-purple-700">{formatCurrency(projectData.totalUnforeseenBudget)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-500">Imprevistos Consumidos</p>
                                            <p className="text-xl font-bold font-mono text-orange-700">{formatCurrency(project.unforeseenExpenses)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-500">Saldo Imprevistos</p>
                                            <p className="text-xl font-bold font-mono text-green-700">{formatCurrency(projectData.totalUnforeseenBudget - project.unforeseenExpenses)}</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 italic text-right">
                                    * Balance General = Monto Modificado - Compras | Cumplimiento Presupuesto = Presupuesto Modificado - Compras
                                </p>
                            </div>
                        </div>

                        {/* Change Orders */}
                        <ProjectChangeOrderDetails changeOrders={projectData.filteredChangeOrders} />

                        {/* Accounts Payable */}
                        <ProjectAccountsPayable
                            projectId={project.id}
                            accountsPayable={accountsPayable}
                            purchaseOrders={purchaseOrders}
                            subcontracts={subcontracts}
                        />

                        {/* Purchase Payments History (Supplier Payments) */}
                        <ProjectPurchasePayments
                            payments={projectData.purchasePayments}
                        />

                        {/* Pre-Operative Expenses Breakdown */}
                        <section>
                            <h3 className="text-lg font-semibold text-dark-gray mb-3">Gastos Pre-Operativos (Desglose)</h3>
                            <div className="bg-white p-4 rounded-md shadow-sm border">
                                <div className="overflow-hidden border border-slate-200 rounded-lg">
                                    <table className="min-w-full bg-white text-sm">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Gasto ID</th>
                                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Fecha</th>
                                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Categoría (Rubro)</th>
                                                <th className="py-2 px-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {projectData.linkedPreOpExpensesList.length > 0 ? (
                                                projectData.linkedPreOpExpensesList.flatMap(exp => {
                                                    const rows: React.ReactNode[] = [];
                                                    Object.entries(exp.desglose).forEach(([rubroId, amount]) => {
                                                        const numAmount = amount as number;
                                                        if (numAmount > 0) {
                                                            const rubro = preOpRubros.find(r => r.id === Number(rubroId));
                                                            rows.push(
                                                                <tr key={`${exp.id}-${rubroId}`} className="hover:bg-slate-50 transition-colors">
                                                                    <td className="py-2 px-3 text-slate-600">#{exp.id}</td>
                                                                    <td className="py-2 px-3 text-slate-600">{format(new Date(exp.fecha), 'dd/MM/yyyy', { locale: es })}</td>
                                                                    <td className="py-2 px-3 font-medium text-slate-800">{rubro?.nombre || 'Categoría Desconocida'}</td>
                                                                    <td className="py-2 px-3 text-right font-mono font-semibold text-orange-700">{formatCurrency(numAmount)}</td>
                                                                </tr>
                                                            );
                                                        }
                                                    });
                                                    return rows;
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="py-4 text-center text-slate-500">No hay gastos pre-operativos vinculados al proyecto.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <div className="bg-orange-50 text-orange-800 p-3 rounded-md border border-orange-100 min-w-[250px] text-right">
                                        <p className="text-xs font-bold uppercase text-slate-500">Total Pre-Operativos</p>
                                        <p className="text-xl font-bold font-mono">{formatCurrency(projectData.linkedPreOpAmount)}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Unforeseen Expenses */}
                        <section>
                            <h3 className="text-lg font-semibold text-dark-gray mb-3">Gastos Imprevistos Aprobados</h3>
                            <div className="bg-white p-4 rounded-md shadow-sm border">
                                <div className="overflow-hidden border border-slate-200 rounded-lg">
                                    <table className="min-w-full bg-white text-sm">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">ID Solicitud</th>
                                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Descripción del Gasto</th>
                                                <th className="py-2 px-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Costo Estimado</th>
                                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Justificación</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {projectData.unforeseenItems.length > 0 ? (
                                                projectData.unforeseenItems.map(item => (
                                                    <tr key={`${item.serviceRequestId}-${item.id}`}>
                                                        <td className="py-2 px-3 text-slate-600">#{item.serviceRequestId}</td>
                                                        <td className="py-2 px-3 font-medium text-slate-800">{item.name} ({item.quantity} {item.unit})</td>
                                                        <td className="py-2 px-3 text-right font-mono font-semibold text-orange-700">{formatCurrency(item.quantity * (item.estimatedUnitCost || 0))}</td>
                                                        <td className="py-2 px-3 text-slate-600 italic max-w-sm truncate" title={item.unforeseenJustification}>"{item.unforeseenJustification}"</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="py-4 text-center text-slate-500">No se han registrado gastos imprevistos para este proyecto.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        {/* Registered Income (Customer Payments) */}
                        <section>
                            <h3 className="text-lg font-semibold text-dark-gray mb-3">Ingresos Registrados (Pagos de Cliente)</h3>
                            <div className="bg-white p-4 rounded-md shadow-sm border">
                                <div className="overflow-hidden border border-slate-200 rounded-lg">
                                    <table className="min-w-full bg-white text-sm">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Fecha de Pago</th>
                                                <th className="py-2 px-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Monto del Pago</th>
                                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Detalles / Factura</th>
                                                <th className="py-2 px-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">Comprobante</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {projectData.payments.length > 0 ? (
                                                projectData.payments.map(payment => (
                                                    <tr key={payment.id}>
                                                        <td className="py-2 px-3 text-slate-600">{format(new Date(payment.date), 'dd/MM/yyyy', { locale: es })}</td>
                                                        <td className="py-2 px-3 text-right font-mono font-semibold text-green-700">{formatCurrency(payment.amount)}</td>
                                                        <td className="py-2 px-3 text-slate-600">{payment.details || 'N/A'}</td>
                                                        <td className="py-2 px-3 text-center">
                                                            {payment.proofAttachmentName ? (
                                                                <a href={payment.proofAttachmentBase64 || '#'} download={payment.proofAttachmentName} className="text-primary hover:text-primary-dark inline-block transition-transform hover:scale-110" title={`Descargar Comprobante: ${payment.proofAttachmentName}`}>
                                                                    <AttachmentIcon />
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-400">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="py-4 text-center text-slate-500">No se han registrado pagos para este proyecto.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div className="bg-green-50 text-green-800 p-3 rounded-md border border-green-100">
                                        <p className="text-sm font-semibold">Total de Ingresos Recibidos</p>
                                        <p className="text-xl font-bold font-mono">{formatCurrency(projectData.paidAmount)}</p>
                                    </div>
                                    <div className="bg-red-50 text-red-800 p-3 rounded-md border border-red-100">
                                        <p className="text-sm font-semibold">Monto Total por Cobrar</p>
                                        <p className="text-xl font-bold font-mono">{formatCurrency(projectData.outstandingReceivables)}</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
            <ProjectMaterialsModal
                isOpen={isMaterialsModalOpen}
                onClose={() => setIsMaterialsModalOpen(false)}
                project={project}
                budgets={budgets}
                changeOrders={changeOrders}
                purchaseOrders={purchaseOrders}
                offers={offers}
            />
        </>
    );
};
