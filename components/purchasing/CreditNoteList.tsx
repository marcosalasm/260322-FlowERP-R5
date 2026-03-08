import React, { useContext } from 'react';
import { CreditNote, CreditNoteStatus } from '../../types';
import { AppContext } from '../../context/AppContext';
import { CREDIT_NOTE_STATUS_COLORS } from '../../constants';
import { usePermissions } from '../../hooks/usePermissions';

interface CreditNoteListProps {
  creditNotes: CreditNote[];
  onSelect: (creditNote: CreditNote) => void;
  onUpdate: (creditNote: CreditNote) => void;
}

export const CreditNoteList: React.FC<CreditNoteListProps> = ({ creditNotes, onSelect, onUpdate }) => {
  const appContext = useContext(AppContext);
  const { can } = usePermissions();
  if (!appContext) return null;

  const { projects } = appContext;
  
  const canApproveNotes = can('purchasing', 'creditNotes', 'approve');

  const handleApprove = (note: CreditNote) => {
    if (window.confirm(`¿Está seguro de que desea APROBAR la Nota de Crédito #${note.id} por un monto de ¢${note.totalAmount.toLocaleString()}?`)) {
      const updatedNote: CreditNote = {
        ...note,
        status: CreditNoteStatus.Approved,
        approvalDate: new Date().toISOString(),
      };
      onUpdate(updatedNote);
    }
  };

  const handleReject = (note: CreditNote) => {
     if (window.confirm(`¿Está seguro de que desea RECHAZAR la Nota de Crédito #${note.id}?`)) {
      const updatedNote: CreditNote = {
        ...note,
        status: CreditNoteStatus.Rejected,
      };
      onUpdate(updatedNote);
    }
  };


  return (
    <div className="overflow-x-auto">
      <p className="text-xs text-slate-500 italic mb-2">Doble click en una fila para ver/editar el detalle de la nota de crédito.</p>
      <table className="min-w-full bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID N.C.</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proyecto</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proveedor</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha Creación</th>
            <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto Total</th>
            <th className="py-3 px-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Aplicada</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {creditNotes.map((cn) => {
            const project = projects.find(p => p.id === cn.projectId);
            return (
              <tr key={cn.id} className="hover:bg-slate-50 cursor-pointer" onDoubleClick={() => onSelect(cn)}>
                <td className="py-4 px-4 text-sm font-medium text-slate-900">NC-{cn.id}</td>
                <td className="py-4 px-4 text-sm text-slate-600">{project?.name || `Proyecto #${cn.projectId}`}</td>
                <td className="py-4 px-4 text-sm text-slate-600">{cn.supplierName}</td>
                <td className="py-4 px-4 text-sm text-slate-600">{new Date(cn.creationDate).toLocaleDateString()}</td>
                <td className="py-4 px-4 text-sm text-right font-mono font-semibold text-red-600">
                  -¢{cn.totalAmount.toLocaleString('en-US').replace(/,/g, '\u202F').replace(/\./g, ',')}
                </td>
                <td className="py-4 px-4 text-center">
                    {cn.appliedToInvoice ? (
                        <span title="Aplicada a factura" className="inline-block text-green-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </span>
                    ) : (
                         <span title="No aplicada" className="inline-block text-slate-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                        </span>
                    )}
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${CREDIT_NOTE_STATUS_COLORS[cn.status] || 'bg-gray-200 text-gray-800'}`}>
                    {cn.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm">
                  {cn.status === CreditNoteStatus.PendingApproval && canApproveNotes ? (
                    <div className="flex items-center space-x-3">
                      <button onClick={(e) => { e.stopPropagation(); handleApprove(cn); }} className="text-green-600 hover:text-green-900 font-medium">Aprobar</button>
                      <button onClick={(e) => { e.stopPropagation(); handleReject(cn); }} className="text-red-600 hover:text-red-900 font-medium">Rechazar</button>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">Sin acciones</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {creditNotes.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2-2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay notas de crédito</h3>
          <p className="mt-1 text-sm text-gray-500">Las notas de crédito se generan desde recepciones de bienes parciales.</p>
        </div>
      )}
    </div>
  );
};