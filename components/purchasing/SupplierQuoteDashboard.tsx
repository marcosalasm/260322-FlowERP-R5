import React, { useState, useMemo, useContext } from 'react';
import { Card } from '../shared/Card';
import { Supplier, QuoteResponse, ServiceRequest, ServiceRequestStatus } from '../../types';
import { AppContext } from '../../context/AppContext';
import { EditQuoteModal } from './EditQuoteModal';
import { useToast } from '../../context/ToastContext';

const QUOTE_RESPONSE_STATUS_COLORS: { [key: string]: string } = {
  'Editable': 'bg-blue-200 text-blue-800',
  'Enviada': 'bg-green-200 text-green-800',
  'Adjudicada': 'bg-yellow-200 text-yellow-800',
  'Cerrada': 'bg-gray-400 text-gray-900',
};

interface SupplierQuoteListProps {
    quotes: QuoteResponse[];
    serviceRequests: ServiceRequest[];
    onEdit: (quote: QuoteResponse) => void;
}

const SupplierQuoteList: React.FC<SupplierQuoteListProps> = ({ quotes, serviceRequests, onEdit }) => {
    const { showToast } = useToast();

    const getQuoteStatus = (quote: QuoteResponse): { status: string, editable: boolean } => {
        const parentRequest = serviceRequests.find(sr => sr.id === quote.serviceRequestId);
        if (!parentRequest) return { status: 'Cerrada', editable: false };

        const editableStatuses = [ServiceRequestStatus.Approved, ServiceRequestStatus.InQuotation, ServiceRequestStatus.QuotationReady];
        
        if (editableStatuses.includes(parentRequest.status)) {
            return { status: 'Editable', editable: true };
        }
        
        const isWinner = Object.values(parentRequest.winnerSelection || {}).some(winner => (winner as any).quoteResponseId === quote.id);
        if (isWinner) {
            return { status: 'Adjudicada', editable: false };
        }
        
        if (parentRequest.status === ServiceRequestStatus.POPendingApproval || parentRequest.status === ServiceRequestStatus.POApproved || parentRequest.status === ServiceRequestStatus.Completed) {
             return { status: 'Cerrada', editable: false };
        }

        return { status: 'Enviada', editable: false };
    };
    
    const handleEditAttempt = (quote: QuoteResponse) => {
        const { editable } = getQuoteStatus(quote);
        if (editable) {
            onEdit(quote);
        } else {
            showToast('Esta cotización no puede editarse porque la solicitud ya ha sido procesada.', 'info');
        }
    };

    return (
        <div className="overflow-x-auto">
             <p className="text-xs text-slate-500 italic mb-2">Haga doble clic en una cotización editable para modificarla.</p>
            <table className="min-w-full bg-white">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID Cotización</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID Solicitud</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proyecto</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto Total</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {quotes.map(quote => {
                        const { status, editable } = getQuoteStatus(quote);
                        const parentRequest = serviceRequests.find(sr => sr.id === quote.serviceRequestId);
                        return (
                            <tr key={quote.id} className="hover:bg-slate-50 cursor-pointer" onDoubleClick={() => handleEditAttempt(quote)}>
                                <td className="py-4 px-4 text-sm font-medium">#{quote.id}</td>
                                <td className="py-4 px-4 text-sm">#{quote.serviceRequestId}</td>
                                <td className="py-4 px-4 text-sm font-semibold">{parentRequest?.projectName || 'N/A'}</td>
                                <td className="py-4 px-4 text-sm font-mono">¢{quote.total.toLocaleString()}</td>
                                <td className="py-4 px-4">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${QUOTE_RESPONSE_STATUS_COLORS[status]}`}>
                                        {status}
                                    </span>
                                </td>
                                <td className="py-4 px-4 text-sm">
                                    <button 
                                        onClick={() => handleEditAttempt(quote)}
                                        className={`font-medium ${editable ? 'text-primary hover:text-primary-dark' : 'text-slate-400 cursor-not-allowed'}`}
                                    >
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};


interface SupplierQuoteDashboardProps {
    supplier: Supplier;
    onUpdateQuote: (updatedQuote: QuoteResponse) => void;
}

export const SupplierQuoteDashboard: React.FC<SupplierQuoteDashboardProps> = ({ supplier, onUpdateQuote }) => {
    const appContext = useContext(AppContext);
    const [selectedQuote, setSelectedQuote] = useState<QuoteResponse | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (!appContext) return null;
    const { quoteResponses, serviceRequests } = appContext;

    const myQuotes = useMemo(() => {
        return quoteResponses.filter(q => q.supplierId === supplier.id)
            .sort((a,b) => b.id - a.id);
    }, [quoteResponses, supplier.id]);
    
    const handleEditClick = (quote: QuoteResponse) => {
        setSelectedQuote(quote);
        setIsEditModalOpen(true);
    };

    const handleModalClose = () => {
        setIsEditModalOpen(false);
        setSelectedQuote(null);
    };

    const handleSaveChanges = (updatedQuote: QuoteResponse) => {
        onUpdateQuote(updatedQuote);
        handleModalClose();
    };

    return (
        <>
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-dark-gray">Portal de Proveedor: {supplier.name}</h2>
                <Card title="Mis Cotizaciones Enviadas">
                    {myQuotes.length > 0 ? (
                        <SupplierQuoteList 
                            quotes={myQuotes}
                            serviceRequests={serviceRequests}
                            onEdit={handleEditClick}
                        />
                    ) : (
                         <div className="text-center py-10 text-slate-500">
                            <p>No ha enviado ninguna cotización.</p>
                        </div>
                    )}
                </Card>
            </div>
            {selectedQuote && (
                <EditQuoteModal
                    isOpen={isEditModalOpen}
                    onClose={handleModalClose}
                    onSubmit={handleSaveChanges}
                    quote={selectedQuote}
                    userWhoIsEditing={supplier.name}
                />
            )}
        </>
    );
};