import React from 'react';
import { Offer, OfferStatus } from '../../types';
import { OFFER_STATUS_COLORS } from '../../constants';
import { usePermissions } from '../../hooks/usePermissions';


interface OffersTableProps {
  offers: Offer[];
  updateOfferStatus: (id: number, newStatus: OfferStatus) => void;
  onEdit: (offer: Offer) => void;
  onViewDetails: (offer: Offer) => void;
}

export const OffersTable: React.FC<OffersTableProps> = ({ offers, updateOfferStatus, onEdit, onViewDetails }) => {
  const { can } = usePermissions();

  const canApprove = can('sales', 'offers', 'approve');
  const canEdit = can('sales', 'offers', 'edit');

  const formatCurrencyValue = (value: number) => {
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',');
};

  const canTakeAction = (offerStatus: OfferStatus): boolean => {
    return canApprove && (offerStatus === OfferStatus.Confeccion || offerStatus === OfferStatus.Revision);
  }

  const isEditable = (offerStatus: OfferStatus): boolean => {
    // Prevent editing of already approved offers.
    if (offerStatus === OfferStatus.Aprobacion) {
      return false;
    }
    return canEdit;
  }

  const handleAction = (id: number, action: 'approve' | 'reject') => {
    const offer = offers.find(o => o.id === id);
    if (!offer) return;

    let newStatus: OfferStatus | null = null;
    if (action === 'reject') {
      newStatus = OfferStatus.Rechazada;
    } else {
      switch (offer.status) {
        case OfferStatus.Confeccion:
          newStatus = OfferStatus.Revision;
          break;
        case OfferStatus.Revision:
          newStatus = OfferStatus.Aprobacion;
          break;
      }
    }

    if (newStatus) {
      updateOfferStatus(id, newStatus);
    }
  }

  return (
    <div className="overflow-x-auto">
      <p className="text-xs text-slate-500 italic mb-2">Doble click en una oferta aprobada para ver su historial de montos.</p>
      <table className="min-w-full bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">N° Oferta</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Prospecto</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Presupuesto</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo Proyecto</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Adjunto</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {offers.map((offer: any) => (
            <tr key={offer.id} className="hover:bg-slate-50 cursor-pointer" onDoubleClick={() => onViewDetails(offer)}>
              <td className="py-4 px-4 text-sm font-medium text-slate-700">{offer.consecutiveNumber}</td>
              <td className="py-4 px-4 text-sm font-medium text-slate-900">{offer.prospectName || 'N/A'}</td>
              <td className="py-4 px-4 text-sm text-slate-600">{offer.date ? new Date(offer.date).toLocaleDateString() : 'N/A'}</td>
              <td className="py-4 px-4 text-sm text-slate-600">¢{formatCurrencyValue(Number(offer.amount || 0))}</td>
              <td className="py-4 px-4 text-sm text-slate-600">¢{formatCurrencyValue(Number(offer.budget || offer.budgetAmount || 0))}</td>
              <td className="py-4 px-4 text-sm text-slate-600">{offer.projectType}</td>
              <td className="py-4 px-4 text-sm text-slate-600">
                {offer.pdfAttachmentName ? (
                  <a href="#" onClick={(e) => { e.preventDefault(); alert(`Abriendo ${offer.pdfAttachmentName}...`) }} className="flex items-center space-x-1 text-primary hover:underline">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                    <span>Ver PDF</span>
                  </a>
                ) : (
                  <span className="text-slate-400">N/A</span>
                )}
              </td>
              <td className="py-4 px-4">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${OFFER_STATUS_COLORS[offer.status] || 'bg-gray-200 text-gray-800'}`}>
                  {offer.status || 'N/A'}
                </span>
              </td>
              <td className="py-4 px-4 text-sm">
                <div className="flex items-center space-x-3">
                  {canTakeAction(offer.status) && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleAction(offer.id, 'approve'); }} className="text-green-600 hover:text-green-900 font-medium">{offer.status === OfferStatus.Confeccion ? 'Enviar a Revisión' : 'Aprobar'}</button>
                      <button onClick={(e) => { e.stopPropagation(); handleAction(offer.id, 'reject'); }} className="text-red-600 hover:text-red-900 font-medium">Rechazar</button>
                    </>
                  )}
                  {isEditable(offer.status) && (
                    <button onClick={(e) => { e.stopPropagation(); onEdit(offer); }} className="text-blue-600 hover:text-blue-900 font-medium">Editar</button>
                  )}
                  {!canTakeAction(offer.status) && !isEditable(offer.status) && (
                    <span className="text-slate-400 text-xs">Sin acciones</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {offers.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <p>No hay ofertas registradas.</p>
        </div>
      )}
    </div>
  );
};