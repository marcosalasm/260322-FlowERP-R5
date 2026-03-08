import React, { useState, useEffect } from 'react';
import { ServiceRequest, ServiceRequestItem } from '../../types';

// Helper to get next ID for new baskets
const getNextId = (items: {id: number}[]) => (items.length > 0 ? Math.max(...items.map(i => i.id)) : 0) + 1;

interface SplitQuoteRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (originalRequestId: number, baskets: ServiceRequestItem[][]) => void;
    request: ServiceRequest | null;
}

export const SplitQuoteRequestModal: React.FC<SplitQuoteRequestModalProps> = ({ isOpen, onClose, onSubmit, request }) => {
    const [unassignedItems, setUnassignedItems] = useState<ServiceRequestItem[]>([]);
    const [baskets, setBaskets] = useState<{ id: number; items: ServiceRequestItem[] }[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (isOpen && request) {
            setUnassignedItems(request.items);
            // Start with one empty basket
            setBaskets([{ id: 1, items: [] }]);
            setSelectedItemIds(new Set());
        }
    }, [isOpen, request]);

    if (!isOpen || !request) return null;

    const handleToggleItemSelection = (itemId: number) => {
        setSelectedItemIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };
    
    const handleAddBasket = () => {
        setBaskets(prev => [...prev, { id: getNextId(prev), items: [] }]);
    };

    const handleAssignToBasket = (basketId: number) => {
        if (selectedItemIds.size === 0) return;
        
        const itemsToMove = unassignedItems.filter(item => selectedItemIds.has(item.id));
        
        setBaskets(prev => prev.map(basket => 
            basket.id === basketId ? { ...basket, items: [...basket.items, ...itemsToMove] } : basket
        ));

        setUnassignedItems(prev => prev.filter(item => !selectedItemIds.has(item.id)));
        setSelectedItemIds(new Set());
    };
    
    const handleUnassignFromBasket = (basketId: number, itemToMove: ServiceRequestItem) => {
        setBaskets(prev => prev.map(basket => 
            basket.id === basketId ? { ...basket, items: basket.items.filter(i => i.id !== itemToMove.id) } : basket
        ));
        setUnassignedItems(prev => [...prev, itemToMove].sort((a,b) => a.id - b.id));
    };

    const handleSubmit = () => {
        if (unassignedItems.length > 0) {
            alert("Debe asignar todos los artículos pendientes antes de generar las solicitudes.");
            return;
        }
        const nonEmptyBaskets = baskets.filter(b => b.items.length > 0).map(b => b.items);
        if (nonEmptyBaskets.length === 0) {
            alert("Debe crear al menos una solicitud de cotización con artículos.");
            return;
        }
        onSubmit(request.id, nonEmptyBaskets);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-6xl transform transition-all flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-dark-gray">Dividir Solicitud de Cotización (ID: #{request.id})</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">Asigne los artículos de la solicitud original a una o más solicitudes de cotización nuevas. Esto es útil para agrupar artículos por tipo de proveedor (ej. ferretería, eléctricos, etc.).</p>
                </div>

                <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto -mr-3 pr-3">
                    {/* Unassigned Items Column */}
                    <div className="bg-slate-50 p-4 rounded-lg flex flex-col">
                        <h3 className="text-lg font-semibold text-dark-gray mb-3">Items Pendientes ({unassignedItems.length})</h3>
                        <div className="overflow-y-auto flex-grow space-y-2">
                           {unassignedItems.length > 0 ? unassignedItems.map(item => (
                                <div key={item.id} className="bg-white p-2 rounded-md shadow-sm border border-slate-200 flex items-center gap-3">
                                   <input 
                                     type="checkbox" 
                                     checked={selectedItemIds.has(item.id)}
                                     onChange={() => handleToggleItemSelection(item.id)}
                                     className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                   />
                                   <div className="flex-grow">
                                     <p className="font-medium text-slate-800">{item.name}</p>
                                     <p className="text-xs text-slate-500">Cantidad: {item.quantity} {item.unit}</p>
                                   </div>
                                </div>
                           )) : (
                                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                   <p className="mt-2 font-semibold">¡Excelente!</p>
                                   <p>Todos los artículos han sido asignados.</p>
                                </div>
                           )}
                        </div>
                    </div>
                    
                    {/* Baskets Column */}
                    <div className="flex flex-col">
                         <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold text-dark-gray">Nuevas Solicitudes a Generar</h3>
                            <button onClick={handleAddBasket} className="text-sm bg-slate-200 text-slate-800 font-bold py-1 px-3 rounded-lg hover:bg-slate-300 transition-colors">
                                + Añadir Solicitud
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-grow space-y-4">
                           {baskets.map(basket => (
                               <div key={basket.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                                   <h4 className="font-bold text-primary mb-2">Solicitud de Cotización #{basket.id}</h4>
                                   <button 
                                     onClick={() => handleAssignToBasket(basket.id)}
                                     disabled={selectedItemIds.size === 0}
                                     className="w-full text-sm bg-blue-100 text-primary font-semibold py-2 px-3 rounded-md hover:bg-blue-200 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed mb-3"
                                   >
                                     Asignar {selectedItemIds.size > 0 ? `${selectedItemIds.size} ` : ''}item(s) aquí
                                   </button>
                                   <div className="space-y-1">
                                      {basket.items.length > 0 ? basket.items.map(item => (
                                          <div key={item.id} className="flex items-center justify-between bg-slate-50 p-1.5 rounded text-sm">
                                             <span>{item.name} <span className="text-xs text-slate-500">({item.quantity} {item.unit})</span></span>
                                             <button onClick={() => handleUnassignFromBasket(basket.id, item)} className="text-red-400 hover:text-red-600 p-1" aria-label={`Quitar ${item.name} de la solicitud`}>
                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                             </button>
                                          </div>
                                      )) : (
                                        <p className="text-xs text-center text-slate-400 py-2">Asigne items a esta solicitud</p>
                                      )}
                                   </div>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 flex justify-end gap-4 pt-4 mt-4 border-t border-light-gray">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">
                        Cancelar
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSubmit} 
                        disabled={unassignedItems.length > 0}
                        className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        Generar {baskets.filter(b => b.items.length > 0).length} Solicitud(es)
                    </button>
                </div>
            </div>
        </div>
    );
};
