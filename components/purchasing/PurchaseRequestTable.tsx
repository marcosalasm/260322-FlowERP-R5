import React from 'react';
import { ServiceRequest, ServiceRequestStatus } from '../../types';
import { SERVICE_REQUEST_STATUS_COLORS } from '../../constants';
import { usePermissions } from '../../hooks/usePermissions';

interface PurchaseRequestTableProps {
  requests: ServiceRequest[];
  updateRequestStatus: (id: number, newStatus: ServiceRequestStatus) => void;
}

export const PurchaseRequestTable: React.FC<PurchaseRequestTableProps> = ({ requests, updateRequestStatus }) => {
  const { can } = usePermissions();

  const canTakeAction = (requestStatus: ServiceRequestStatus): boolean => {
    switch (requestStatus) {
        case ServiceRequestStatus.PendingApproval:
            return can('purchasing', 'requests', 'approve');
        case ServiceRequestStatus.Approved:
            // Assuming this moves to quotation, which is a procurement task
            return can('purchasing', 'quotes', 'create');
        case ServiceRequestStatus.POPendingApproval:
            return can('purchasing', 'orders', 'approve');
        default:
            return false;
    }
  }

  const handleAction = (id: number, action: 'approve' | 'reject') => {
    const request = requests.find(r => r.id === id);
    if (!request) return;

    let newStatus: ServiceRequestStatus | null = null;
    if (action === 'reject') {
        newStatus = ServiceRequestStatus.Rejected;
    } else {
        switch (request.status) {
            case ServiceRequestStatus.PendingApproval:
                newStatus = ServiceRequestStatus.Approved;
                break;
            case ServiceRequestStatus.Approved:
                // In a real app, this would trigger a modal to create a quote comparison
                // For demo, we'll move it to financial approval
                newStatus = ServiceRequestStatus.POPendingApproval;
                break;
            case ServiceRequestStatus.POPendingApproval:
                newStatus = ServiceRequestStatus.POApproved;
                // In a real app, you might move this to "Completed" after delivery confirmation
                setTimeout(() => updateRequestStatus(id, ServiceRequestStatus.Completed), 2000); // Simulate completion
                break;
        }
    }

    if (newStatus) {
        updateRequestStatus(id, newStatus);
    }
  }

  return (
    <div className="overflow-x-auto">
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
            <tr key={req.id} className="hover:bg-slate-50">
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
                {canTakeAction(req.status) ? (
                  <div className="flex space-x-2">
                    <button onClick={() => handleAction(req.id, 'approve')} className="text-green-600 hover:text-green-900 font-medium">Aprobar</button>
                    <button onClick={() => handleAction(req.id, 'reject')} className="text-red-600 hover:text-red-900 font-medium">Rechazar</button>
                  </div>
                ) : (
                   <span className="text-slate-400 text-xs">Sin acciones</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
        {requests.length === 0 && (
            <div className="text-center py-10 text-slate-500">
                <p>No hay solicitudes que requieran su atención en este momento.</p>
            </div>
        )}
    </div>
  );
};
