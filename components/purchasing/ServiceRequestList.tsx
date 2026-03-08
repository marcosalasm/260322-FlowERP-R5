
import React, { useState } from 'react';
import { ServiceRequest, ServiceRequestStatus, User, Project, Offer, ChangeOrder, Budget, OfferStatus, ChangeOrderStatus, Role } from '../../types';
import { SERVICE_REQUEST_STATUS_COLORS } from '../../constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { usePermissions } from '../../hooks/usePermissions';

interface ServiceRequestListProps {
  requests: ServiceRequest[];
  updateRequestStatus: (id: number, newStatus: ServiceRequestStatus, payload?: { overrunJustification?: string; rejectionHistory?: any; }) => void;
  currentUser: User;
  onEdit: (request: ServiceRequest) => void;
  projects: Project[];
  offers: Offer[];
  changeOrders: ChangeOrder[];
  budgets: Budget[];
  allServiceRequests: ServiceRequest[];
  roles: Role[];
}

const formatCurrency = (value: number) => { const num = Number(value); if (isNaN(num)) return '¢0.00'; return `¢${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}`; };;

export const ServiceRequestList: React.FC<ServiceRequestListProps> = ({ requests, updateRequestStatus, currentUser, onEdit, projects, offers, changeOrders, budgets, allServiceRequests, roles }) => {
  const { can } = usePermissions();
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null);

  // State for the justification modal (Approval)
  const [isJustificationModalOpen, setJustificationModalOpen] = useState(false);
  const [requestForJustification, setRequestForJustification] = useState<ServiceRequest | null>(null);
  const [justificationText, setJustificationText] = useState('');

  // State for the rejection modal
  const [isRejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [requestForRejection, setRequestForRejection] = useState<ServiceRequest | null>(null);
  const [rejectionText, setRejectionText] = useState('');


  const handleToggleExpand = (requestId: number) => {
    setExpandedRequestId(prevId => (prevId === requestId ? null : requestId));
  };

  const canTakeAction = (requestStatus: ServiceRequestStatus): boolean => {
    if (requestStatus === ServiceRequestStatus.PendingApproval || requestStatus === ServiceRequestStatus.PendingGMApproval) {
      return can('purchasing', 'requests', 'approve');
    }
    if (requestStatus === ServiceRequestStatus.Approved) {
      return can('purchasing', 'quotes', 'create');
    }
    if (requestStatus === ServiceRequestStatus.POPendingApproval) {
      return can('purchasing', 'orders', 'approve');
    }
    return false;
  };

  const canEdit = (request: ServiceRequest): boolean => {
    return [ServiceRequestStatus.PendingApproval, ServiceRequestStatus.PendingGMApproval].includes(request.status) && can('purchasing', 'requests', 'edit');
  }

  const getAnalysisForRequest = (request: ServiceRequest) => {
    const project = projects.find(p => p.id === request.projectId);
    const offer = offers.find(o => o.id === project?.offerId);
    if (!offer) return { itemDetails: [], totalAdditionalCost: 0 };

    // 1. Build a consolidated list of all budgeted materials for the project.
    const consolidatedMaterialsMap = new Map<string, { unit: string; quantity: number }>();
    if (offer.budgetId) {
      const initialBudget = budgets.find(b => b.id === offer.budgetId);
      initialBudget?.activities.forEach(act => act.subActivities.forEach(sub => {
        if (!sub.description) return;
        const key = `${sub.description.trim()}|${sub.unit.trim()}`;
        const existing = consolidatedMaterialsMap.get(key) || { unit: sub.unit, quantity: 0 };
        existing.quantity += Number(sub.quantity) || 0;
        consolidatedMaterialsMap.set(key, existing);
      }));
    }
    const approvedChangeOrders = changeOrders.filter(co => co.offerId === offer.id && co.status === ChangeOrderStatus.Approved);
    approvedChangeOrders.forEach(co => {
      if (!co.budgetId) return;
      const budget = budgets.find(b => b.id === co.budgetId);
      if (!budget) return;
      const multiplier = co.changeType === 'Crédito' ? -1 : 1;
      budget.activities.forEach(act => act.subActivities.forEach(sub => {
        if (!sub.description) return;
        const key = `${sub.description.trim()}|${sub.unit.trim()}`;
        const existing = consolidatedMaterialsMap.get(key) || { unit: sub.unit, quantity: 0 };
        existing.quantity += (Number(sub.quantity) || 0) * multiplier;
        consolidatedMaterialsMap.set(key, existing);
      }));
    });
    const consolidatedMaterials = Array.from(consolidatedMaterialsMap.entries()).map(([key, value]) => ({ name: key.split('|')[0], ...value }));

    // 2. Calculate previously requested quantities for this project (excluding the current request)
    const previouslyRequestedQuantities = new Map<string, number>();
    allServiceRequests
      .filter(req => req.id !== request.id && req.projectId === request.projectId && req.status !== ServiceRequestStatus.Rejected)
      .forEach(req => {
        req.items.forEach(item => {
          if (!item.isUnforeseen) {
            previouslyRequestedQuantities.set(item.name, (previouslyRequestedQuantities.get(item.name) || 0) + item.quantity);
          }
        });
      });

    // 3. Analyze each item in the current request
    const itemDetails = request.items.map(item => {
      if (item.isUnforeseen) {
        return {
          ...item,
          status: 'Imprevisto',
          additionalQty: item.quantity,
          additionalCost: item.quantity * (item.estimatedUnitCost || 0)
        };
      }

      const budgetItem = consolidatedMaterials.find(m => m.name === item.name);
      if (!budgetItem) {
        return {
          ...item,
          status: 'No Presupuestado',
          additionalQty: item.quantity,
          additionalCost: item.quantity * (item.estimatedUnitCost || 0)
        };
      }

      const budgetedQty = budgetItem.quantity;
      const previouslyReq = previouslyRequestedQuantities.get(item.name) || 0;
      const availableQty = budgetedQty - previouslyReq;

      if (item.quantity <= availableQty) {
        return { ...item, status: 'Presupuestado', additionalQty: 0, additionalCost: 0 };
      } else {
        const additionalQty = Math.max(0, item.quantity - availableQty);
        return {
          ...item,
          status: 'Excede Presupuesto',
          additionalQty,
          additionalCost: additionalQty * (item.estimatedUnitCost || 0)
        };
      }
    });

    const totalAdditionalCost = itemDetails.reduce((sum, item) => sum + item.additionalCost, 0);
    return { itemDetails, totalAdditionalCost };
  };

  const handleAction = (id: number, action: 'approve' | 'reject') => {
    const request = requests.find(r => r.id === id);
    if (!request) return;

    if (action === 'reject') {
      setRequestForRejection(request);
      setRejectionModalOpen(true);
      return;
    }

    // --- Approval Logic ---
    const { totalAdditionalCost } = getAnalysisForRequest(request);

    // If there's an additional cost, a justification is required via modal.
    if (totalAdditionalCost > 0 && [ServiceRequestStatus.PendingApproval, ServiceRequestStatus.PendingGMApproval].includes(request.status)) {
      setRequestForJustification(request);
      setJustificationModalOpen(true);
      return; // Modal will handle the final approval call
    }

    // If no additional cost, or it's a different approval step, proceed normally.
    let newStatus: ServiceRequestStatus | null = null;
    switch (request.status) {
      case ServiceRequestStatus.PendingApproval:
      case ServiceRequestStatus.PendingGMApproval:
        newStatus = ServiceRequestStatus.Approved;
        break;
      case ServiceRequestStatus.Approved:
        newStatus = ServiceRequestStatus.InQuotation;
        break;
      case ServiceRequestStatus.POPendingApproval:
        newStatus = ServiceRequestStatus.POApproved;
        break;
    }

    if (newStatus) {
      updateRequestStatus(id, newStatus);
    }
  };

  const handleConfirmRejection = () => {
    if (!requestForRejection || !rejectionText.trim()) return;

    const rejectionEntry = {
      date: new Date().toISOString(),
      user: currentUser.name,
      reason: rejectionText.trim()
    };

    updateRequestStatus(
      requestForRejection.id,
      ServiceRequestStatus.Rejected,
      { rejectionHistory: [...(requestForRejection.rejectionHistory || []), rejectionEntry] }
    );

    setRejectionModalOpen(false);
    setRequestForRejection(null);
    setRejectionText('');
  };

  const handleConfirmJustification = () => {
    if (!requestForJustification || !justificationText.trim()) return;

    updateRequestStatus(
      requestForJustification.id,
      ServiceRequestStatus.Approved,
      { overrunJustification: justificationText }
    );

    // Close and reset state
    setJustificationModalOpen(false);
    setRequestForJustification(null);
    setJustificationText('');
  };

  const getActionLabel = (status: ServiceRequestStatus): string => {
    if (status === ServiceRequestStatus.PendingApproval) return "Aprobar para Cotizar";
    if (status === ServiceRequestStatus.PendingGMApproval) return "Aprobar Exceso";
    if (status === ServiceRequestStatus.Approved) return "Cotizar";
    if (status === ServiceRequestStatus.POPendingApproval) return "Aprobar OC";
    return "Aprobar";
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Presupuestado': return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">{status}</span>;
      case 'Excede Presupuesto': return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">{status}</span>;
      case 'Imprevisto': return <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">{status}</span>;
      case 'No Presupuestado': return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">{status}</span>;
      default: return null;
    }
  };

  const analysisForModal = requestForJustification ? getAnalysisForRequest(requestForJustification) : { totalAdditionalCost: 0 };


  return (
    <>
      <div className="overflow-x-auto">
        <p className="text-xs text-slate-500 italic mb-2">Doble click en una fila para ver el análisis de costo y el historial de cambios.</p>
        <table className="min-w-full bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proyecto</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Solicitante</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha Requerida</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {requests.map((req) => (
              <React.Fragment key={req.id}>
                <tr
                  className="hover:bg-slate-100 cursor-pointer"
                  onDoubleClick={() => handleToggleExpand(req.id)}
                  aria-expanded={expandedRequestId === req.id}
                >
                  <td className="py-4 px-4 text-sm font-medium text-slate-900">#{req.id}</td>
                  <td className="py-4 px-4 text-sm text-slate-600">{req.projectName}</td>
                  <td className="py-4 px-4 text-sm text-slate-600">{req.requester}</td>
                  <td className="py-4 px-4 text-sm text-slate-600">{new Date(req.requiredDate).toLocaleDateString()}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${SERVICE_REQUEST_STATUS_COLORS[req.status] || 'bg-gray-200 text-gray-800'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">
                    <div className="flex space-x-2">
                      {canTakeAction(req.status) && (
                        <>
                          <button onClick={() => handleAction(req.id, 'approve')} className="text-green-600 hover:text-green-900 font-medium">{getActionLabel(req.status)}</button>
                          <button onClick={() => handleAction(req.id, 'reject')} className="text-red-600 hover:text-red-900 font-medium">Rechazar</button>
                        </>
                      )}
                      {canEdit(req) && (
                        <button onClick={() => onEdit(req)} className="text-blue-600 hover:text-blue-900 font-medium">Editar</button>
                      )}
                      {!canTakeAction(req.status) && !canEdit(req) && (
                        <span className="text-slate-400 text-xs">Sin acciones</span>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedRequestId === req.id && (
                  <tr className="bg-slate-50 border-l-4 border-l-primary">
                    <td colSpan={6} className="p-4 transition-all duration-300 ease-in-out space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 mb-2">Análisis de Costo Adicional:</h4>
                        <div className="overflow-hidden border border-slate-200 rounded-lg">
                          <table className="min-w-full bg-white text-sm">
                            <thead className="bg-slate-100">
                              <tr>
                                <th className="py-2 px-3 text-left font-medium text-slate-600">Artículo</th>
                                <th className="py-2 px-3 text-right font-medium text-slate-600">Cant. Solicitada</th>
                                <th className="py-2 px-3 text-center font-medium text-slate-600">Estado</th>
                                <th className="py-2 px-3 text-right font-medium text-slate-600">Cant. Adicional</th>
                                <th className="py-2 px-3 text-right font-medium text-slate-600">Costo Adicional</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {getAnalysisForRequest(req).itemDetails.map(item => (
                                <React.Fragment key={item.id}>
                                  <tr className={item.isUnforeseen ? 'bg-purple-50' : ''}>
                                    <td className="py-2 px-3 text-slate-800">{item.name}</td>
                                    <td className="py-2 px-3 text-right text-slate-800">{item.quantity} {item.unit}</td>
                                    <td className="py-2 px-3 text-center">{getStatusBadge(item.status)}</td>
                                    <td className={`py-2 px-3 text-right font-semibold ${item.additionalQty > 0 ? 'text-orange-600' : 'text-slate-500'}`}>{item.additionalQty > 0 ? item.additionalQty : '-'}</td>
                                    <td className={`py-2 px-3 text-right font-mono font-semibold ${item.additionalCost > 0 ? 'text-red-600' : 'text-slate-500'}`}>{formatCurrency(item.additionalCost)}</td>
                                  </tr>
                                  {item.isUnforeseen && (
                                    <tr className="bg-purple-100">
                                      <td colSpan={5} className="py-1 px-8 text-xs italic text-purple-800 border-b border-purple-200">
                                        <strong>Justificación:</strong> {item.unforeseenJustification || "No provista"}
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-200 font-bold">
                                <td colSpan={4} className="py-2 px-3 text-right text-dark-gray">Costo Total Adicional Estimado:</td>
                                <td className="py-2 px-3 text-right font-mono text-red-700">{formatCurrency(getAnalysisForRequest(req).totalAdditionalCost)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>

                      {req.itemHistory && req.itemHistory.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-800 mb-2">Historial de Cambios en Artículos:</h4>
                          <div className="overflow-hidden border border-slate-200 rounded-lg">
                            <table className="min-w-full bg-white text-xs">
                              <thead className="bg-slate-100">
                                <tr>
                                  <th className="py-2 px-3 text-left font-medium text-slate-600">Fecha</th>
                                  <th className="py-2 px-3 text-left font-medium text-slate-600">Usuario</th>
                                  <th className="py-2 px-3 text-left font-medium text-slate-600">Acción</th>
                                  <th className="py-2 px-3 text-left font-medium text-slate-600">Artículo</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {req.itemHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((change, index) => (
                                  <tr key={index} className={change.type === 'added' ? 'bg-green-50' : 'bg-red-50'}>
                                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{format(new Date(change.date), "dd/MM/yy HH:mm", { locale: es })}</td>
                                    <td className="py-2 px-3 text-slate-800">{change.user}</td>
                                    <td className="py-2 px-3">
                                      <span className={`font-semibold ${change.type === 'added' ? 'text-green-700' : 'text-red-700'}`}>
                                        {change.type === 'added' ? 'Agregado' : 'Eliminado'}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-slate-800">
                                      {change.item.name} ({change.item.quantity} {change.item.unit})
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            <p>No hay solicitudes que requieran su atención en este momento.</p>
          </div>
        )}
      </div>

      {/* Modal de Justificación para Excesos (Aprobación) */}
      {isJustificationModalOpen && requestForJustification && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={() => { setJustificationModalOpen(false); setJustificationText(''); }} role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-dark-gray">Justificar Aprobación</h2>
              <button onClick={() => { setJustificationModalOpen(false); setJustificationText(''); }} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              Está a punto de aprobar la solicitud <strong>#{requestForJustification.id}</strong> que excede el presupuesto por un monto de <strong className="text-red-600">{formatCurrency(analysisForModal.totalAdditionalCost)}</strong>.
            </p>
            <p className="text-sm text-slate-600 mb-4">
              Por favor, ingrese una justificación clara para esta aprobación.
            </p>

            <div>
              <label htmlFor="justification-text" className="block text-sm font-medium text-slate-700 mb-1">Justificación (Obligatoria)</label>
              <textarea
                id="justification-text"
                value={justificationText}
                onChange={(e) => setJustificationText(e.target.value)}
                rows={4}
                className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-light-gray">
              <button type="button" onClick={() => { setJustificationModalOpen(false); setJustificationText(''); }} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmJustification}
                disabled={!justificationText.trim()}
                className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                Confirmar Aprobación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rechazo (Motivo) */}
      {isRejectionModalOpen && requestForRejection && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={() => { setRejectionModalOpen(false); setRejectionText(''); }} role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-red-600">Rechazar Solicitud</h2>
              <button onClick={() => { setRejectionModalOpen(false); setRejectionText(''); }} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Está rechazando la solicitud <strong>#{requestForRejection.id}</strong>. Para ayudar al solicitante a corregirla, por favor indique el motivo del rechazo.
            </p>

            <div>
              <label htmlFor="rejection-text" className="block text-sm font-medium text-slate-700 mb-1">Motivo del Rechazo (Obligatorio)</label>
              <textarea
                id="rejection-text"
                value={rejectionText}
                onChange={(e) => setRejectionText(e.target.value)}
                rows={4}
                className="w-full p-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                placeholder="Ej: Cantidades excesivas para esta etapa, el material no corresponde al presupuesto..."
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-light-gray">
              <button type="button" onClick={() => { setRejectionModalOpen(false); setRejectionText(''); }} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={!rejectionText.trim()}
                className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
