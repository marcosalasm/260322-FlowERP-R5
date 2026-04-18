import React, { useState, useMemo, useContext, useEffect } from 'react';
import { ServiceRequest, QuoteResponse } from '../../types';
import { AppContext } from '../../context/AppContext';
import { formatNumber } from '../../utils/format';

type WinnerSelection = { [serviceRequestItemId: number]: { quoteResponseId: number; supplierId: number; } };

interface ComparativeChartModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: ServiceRequest | null;
    onSelectWinners: (serviceRequestId: number, winners: WinnerSelection, justification: string) => void;
}

const QualityBadge: React.FC<{ quality: 'Alta' | 'Media' | 'Baja' }> = ({ quality }) => {
    const styles = {
        'Alta': 'bg-green-100 text-green-800',
        'Media': 'bg-yellow-100 text-yellow-800',
        'Baja': 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[quality]}`}>{quality}</span>;
};

const getPaymentTermRank = (term: string) => {
    if (term.includes('30')) return 4;
    if (term.includes('15')) return 3;
    if (term.includes('8')) return 2;
    if (term.toLowerCase().includes('contado')) return 1;
    return 0;
};


export const ComparativeChartModal: React.FC<ComparativeChartModalProps> = ({ isOpen, onClose, request, onSelectWinners }) => {
    const appContext = useContext(AppContext);
    const [justification, setJustification] = useState('');
    const [winners, setWinners] = useState<WinnerSelection>({});

    const quotesForRequest = useMemo(() => {
        return appContext?.quoteResponses.filter(q => q.serviceRequestId === request?.id) || [];
    }, [appContext?.quoteResponses, request]);

    const { minDeliveryDays, bestPaymentTermRank } = useMemo(() => {
        if (quotesForRequest.length === 0) {
            return { minDeliveryDays: Infinity, bestPaymentTermRank: 0 };
        }

        const deliveryDays = quotesForRequest.map(q => q.deliveryDays);
        const paymentRanks = quotesForRequest.map(q => getPaymentTermRank(q.paymentTerms));

        return {
            minDeliveryDays: Math.min(...deliveryDays),
            bestPaymentTermRank: Math.max(...paymentRanks),
        };
    }, [quotesForRequest]);

    useEffect(() => {
        // Reset state when a new request is passed in or modal is opened
        if (isOpen) {
            setWinners({});
            setJustification('');
        }
    }, [isOpen, request]);

    const handleSelectWinner = (serviceRequestItemId: number, quoteResponseId: number, supplierId: number) => {
        setWinners(prev => ({
            ...prev,
            [serviceRequestItemId]: { quoteResponseId, supplierId }
        }));
    };

    const handleSelectAllFromSupplier = (quote: QuoteResponse) => {
        if (!request) return;
        const newWinners = { ...winners };
        (request.items || []).forEach(item => {
            // Only select if the supplier has a price for this item
            if (quote.items.some(qi => 
                qi.serviceRequestItemId === item.id || 
                (qi as any).request_item_id === item.id || 
                ((qi as any).material_id && item.material_id && (qi as any).material_id === item.material_id) ||
                ((qi as any).name && item.name && (qi as any).name.toLowerCase() === item.name.toLowerCase())
            )) {
                newWinners[item.id] = { quoteResponseId: quote.id, supplierId: quote.supplierId };
            }
        });
        setWinners(newWinners);
    };

    const totalAdjudicado = useMemo(() => {
        let total = 0;
        if (!request) return 0;

        for (const itemId in winners) {
            const winnerInfo = winners[itemId];
            const serviceItem = request.items.find(i => i.id === Number(itemId));
            const quote = quotesForRequest.find(q => q.id === winnerInfo.quoteResponseId);
            const quoteItem = quote?.items.find(qi => 
                qi.serviceRequestItemId === Number(itemId) || 
                (qi as any).request_item_id === Number(itemId) || 
                ((qi as any).material_id && serviceItem?.material_id && (qi as any).material_id === serviceItem.material_id) ||
                ((qi as any).name && serviceItem?.name && (qi as any).name.toLowerCase() === serviceItem.name.toLowerCase())
            );

            if (serviceItem && quoteItem) {
                total += serviceItem.quantity * quoteItem.unitPrice;
            }
        }
        return total;
    }, [winners, request, quotesForRequest]);

    const handleSubmit = () => {
        if (Object.keys(winners).length !== request?.items.length) {
            alert("Debe seleccionar una oferta ganadora para cada artículo de la solicitud.");
            return;
        }
        if (!justification.trim()) {
            alert("Debe proveer una justificación para la selección de proveedores.");
            return;
        }
        onSelectWinners(request!.id, winners, justification);
    };

    if (!isOpen || !request) return null;

    const allItemsPriced = quotesForRequest?.every(q => q.items?.length === request?.items?.length);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-7xl transform transition-all h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-dark-gray">Cuadro Comparativo de Cotizaciones</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>

                {!allItemsPriced && (
                    <div className="text-center bg-yellow-100 p-4 rounded-lg my-4">
                        <p className="font-bold text-yellow-800">Atención:</p>
                        <p className="text-sm text-yellow-700">Algunas cotizaciones no tienen precios para todos los artículos. El cuadro comparativo puede estar incompleto.</p>
                    </div>
                )}

                <div className="flex-grow overflow-auto border-t border-b py-4">
                    <table className="min-w-full border-separate" style={{ borderSpacing: '0 0.5rem' }}>
                        <thead>
                            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="p-2 sticky left-0 bg-white z-10 align-top">Artículo Solicitado</th>
                                {quotesForRequest.map(quote => {
                                    const isBestDelivery = quote.deliveryDays === minDeliveryDays;
                                    const isBestPayment = getPaymentTermRank(quote.paymentTerms) === bestPaymentTermRank;
                                    return (
                                        <th key={quote.id} className="p-2 text-center border-l-2 border-slate-200 align-top">
                                            <div>
                                                <p className="font-bold text-base normal-case text-dark-gray">{quote.supplierName}</p>
                                                <p className="text-lg font-bold text-secondary font-mono">
                                                    ¢{formatNumber(quote.total)}
                                                </p>
                                                <div className="mt-2 text-xs text-left p-2 bg-slate-50 rounded-md space-y-1 border">
                                                    <div className={`p-1 rounded ${isBestPayment ? 'bg-green-100' : ''}`}>
                                                        <span className="font-semibold text-slate-600 block">Forma de Pago</span>
                                                        <span className={`font-bold ${isBestPayment ? 'text-green-800' : 'text-slate-800'}`}>{quote.paymentTerms}</span>
                                                    </div>
                                                    <div className={`p-1 rounded ${isBestDelivery ? 'bg-green-100' : ''}`}>
                                                        <span className="font-semibold text-slate-600 block">Días de Entrega</span>
                                                        <span className={`font-bold ${isBestDelivery ? 'text-green-800' : 'text-slate-800'}`}>{quote.deliveryDays} días</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleSelectAllFromSupplier(quote)}
                                                className="text-xs font-medium text-primary hover:underline mt-2"
                                            >
                                                Adjudicar Todo
                                            </button>
                                        </th>
                                    )
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {request.items.map(item => {
                                let minPrice = Infinity;
                                (quotesForRequest || []).forEach(q => {
                                    const quoteItem = (q.items || []).find(i => 
                                        i.serviceRequestItemId === item.id || 
                                        (i as any).request_item_id === item.id || 
                                        ((i as any).material_id && item.material_id && (i as any).material_id === item.material_id) ||
                                        ((i as any).name && item.name && (i as any).name.toLowerCase() === item.name.toLowerCase())
                                    );
                                    if (quoteItem) {
                                        const numPrice = Number(quoteItem.unitPrice);
                                        if (!isNaN(numPrice) && numPrice >= 0 && numPrice < minPrice) {
                                            minPrice = numPrice;
                                        }
                                    }
                                });

                                return (
                                    <tr key={item.id}>
                                        <td className="p-2 font-semibold bg-slate-50 rounded-l-lg sticky left-0 z-10">
                                            {item.name}
                                            <span className="block text-xs font-normal text-slate-500">Cant: {item.quantity} {item.unit}</span>
                                        </td>
                                        {quotesForRequest.map(quote => {
                                            const quoteItem = quote.items.find(i => 
                                                i.serviceRequestItemId === item.id || 
                                                (i as any).request_item_id === item.id || 
                                                ((i as any).material_id && item.material_id && (i as any).material_id === item.material_id) ||
                                                ((i as any).name && item.name && (i as any).name.toLowerCase() === item.name.toLowerCase())
                                            );
                                            const isWinner = winners[item.id]?.quoteResponseId === quote.id;
                                            const numPrice = quoteItem ? Number(quoteItem.unitPrice) : null;
                                            const isLowestPrice = numPrice !== null && minPrice !== Infinity && numPrice === minPrice;
                                            const isOverBudget = numPrice !== null && typeof item.estimatedUnitCost === 'number' && item.estimatedUnitCost > 0 && numPrice > item.estimatedUnitCost;

                                            let priceClasses = 'font-bold text-base text-dark-gray';
                                            if (isLowestPrice && isOverBudget) {
                                                priceClasses = 'font-bold text-base text-red-600 bg-green-100 px-1.5 py-0.5 rounded border border-green-500 shadow-sm';
                                            } else if (isLowestPrice) {
                                                priceClasses = 'font-bold text-base text-green-600';
                                            } else if (isOverBudget) {
                                                priceClasses = 'font-bold text-base text-red-600';
                                            }

                                            return (
                                                <td
                                                    key={quote.id}
                                                    className={`p-2 text-center border-y border-r border-slate-200 align-top transition-colors ${isWinner ? 'bg-blue-100' : 'bg-white hover:bg-slate-50'} ${quoteItem ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                                    onClick={() => quoteItem && handleSelectWinner(item.id, quote.id, quote.supplierId)}
                                                >
                                                    {quoteItem ? (
                                                        <div className="flex flex-col items-center justify-center h-full">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="radio"
                                                                    name={`winner-${item.id}`}
                                                                    checked={isWinner}
                                                                    onChange={() => handleSelectWinner(item.id, quote.id, quote.supplierId)}
                                                                    className="h-4 w-4 flex-shrink-0 text-primary focus:ring-primary border-gray-300"
                                                                />
                                                                <div className="flex flex-col items-start leading-tight">
                                                                    <p className={priceClasses} title={isOverBudget ? `Presupuestado: ¢${formatNumber(item.estimatedUnitCost || 0)}` : 'Dentro del presupuesto'}>
                                                                        ¢{formatNumber(numPrice!)}
                                                                    </p>
                                                                    {isOverBudget && <span className="text-[10px] text-red-500 font-bold tracking-tighter uppercase ml-1" title="Unitario Sobrepasa el Monto Presupuestado">USMP</span>}
                                                                </div>
                                                            </div>
                                                            <div className="mt-1">
                                                                <QualityBadge quality={quoteItem.quality} />
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-xs text-slate-400">No cotizado</span>}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex-shrink-0 pt-4 mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    <div className="md:col-span-2">
                        <label htmlFor="justification" className="block text-sm font-medium text-slate-700">Justificación General de la Selección</label>
                        <textarea
                            id="justification"
                            rows={4}
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary"
                            placeholder="Ej: Se seleccionaron los proveedores con el mejor balance entre costo y calidad, asegurando la entrega a tiempo..."
                        ></textarea>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-700">Monto Total Adjudicado</h3>
                        <div className="text-3xl font-bold text-secondary font-mono bg-slate-100 p-3 rounded-lg text-center">
                            ¢{formatNumber(totalAdjudicado)}
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 flex justify-end gap-4 pt-4 mt-4 border-t">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300">Cancelar</button>
                    <button onClick={handleSubmit} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark disabled:bg-slate-400">
                        Finalizar y Enviar a Aprobación
                    </button>
                </div>

            </div>
        </div>
    );
};