import React, { useState, useEffect, useContext } from 'react';
import { QuoteResponse, ServiceRequest, QualityRating, QuoteResponseChange } from '../../types';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

interface EditQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedQuote: QuoteResponse) => void;
    quote: QuoteResponse | null;
    userWhoIsEditing: string;
}

export const EditQuoteModal: React.FC<EditQuoteModalProps> = ({ isOpen, onClose, onSubmit, quote, userWhoIsEditing }) => {
    const appContext = useContext(AppContext);
    const { showToast } = useToast();
    
    const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
    const [deliveryDays, setDeliveryDays] = useState<number | string>('');
    const [quoteNumber, setQuoteNumber] = useState<string>('');
    const [paymentCondition, setPaymentCondition] = useState<'Contado' | 'Crédito' | 'Por Avance'>('Contado');
    const [creditTerm, setCreditTerm] = useState<'8 Días' | '15 Días' | '30 Días'>('8 Días');
    const [milestones, setMilestones] = useState<{ description: string; amount: number | string }[]>([{ description: '', amount: '' }]);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfBase64, setPdfBase64] = useState<string | undefined>(undefined);
    const [pdfName, setPdfName] = useState<string | undefined>(undefined);
    const [lineItems, setLineItems] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (quote && appContext) {
            const parentRequest = appContext.serviceRequests.find(sr => sr.id === quote.serviceRequestId);
            if (!parentRequest) {
                console.error("Could not find parent service request for quote");
                onClose();
                return;
            }
            setServiceRequest(parentRequest);

            // Populate state from quote prop
            setDeliveryDays(quote.deliveryDays);
            setQuoteNumber(quote.quoteNumber || '');
            setPdfBase64(quote.pdfAttachmentBase64);
            setPdfName(quote.pdfAttachmentName);
            setPdfFile(null); // Reset file input

            const terms = quote.paymentTerms;
            if (terms.toLowerCase().startsWith('por avance')) {
                setPaymentCondition('Por Avance');
                const milestonePart = terms.substring(terms.indexOf('(') + 1, terms.lastIndexOf(')'));
                if (milestonePart) {
                    const parsedMilestones = milestonePart.split(';').map(part => {
                        const [description, amountStr] = part.split(':');
                        const amount = Number(amountStr?.trim().replace(/,/g, '')) || '';
                        return { description: description?.trim() || '', amount };
                    }).filter(m => m.description);
                    if (parsedMilestones.length > 0) {
                        setMilestones(parsedMilestones);
                    } else {
                        setMilestones([{ description: '', amount: '' }]);
                    }
                } else {
                    setMilestones([{ description: '', amount: '' }]);
                }
            } else if (terms.startsWith('Crédito')) {
                setPaymentCondition('Crédito');
                if (terms.includes('8')) setCreditTerm('8 Días');
                else if (terms.includes('15')) setCreditTerm('15 Días');
                else if (terms.includes('30')) setCreditTerm('30 Días');
            } else {
                setPaymentCondition('Contado');
            }

            setLineItems(parentRequest.items.map(reqItem => {
                const quoteItem = quote.items.find(qi => qi.serviceRequestItemId === reqItem.id);
                return {
                    serviceRequestItemId: reqItem.id,
                    unitPrice: quoteItem?.unitPrice || 0,
                    quality: quoteItem?.quality || 'Media' as QualityRating
                };
            }));
        }
    }, [quote, appContext, isOpen]);
    
    const handleMilestoneChange = (index: number, field: 'description' | 'amount', value: string) => {
        const newMilestones = [...milestones];
        newMilestones[index] = { ...newMilestones[index], [field]: value };
        setMilestones(newMilestones);
    };

    const addMilestone = () => {
        setMilestones([...milestones, { description: '', amount: '' }]);
    };

    const removeMilestone = (index: number) => {
        if (milestones.length > 1) {
            setMilestones(milestones.filter((_, i) => i !== index));
        }
    };


    const handleLineItemChange = (itemId: number, field: string, value: any) => {
        setLineItems(prev => prev.map(item => item.serviceRequestItemId === itemId ? { ...item, [field]: value } : item));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setPdfFile(file);
            setPdfName(file.name);
            const base64 = await fileToBase64(file);
            setPdfBase64(base64);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!quote || !serviceRequest) return;

        if (!quoteNumber.trim()) {
            alert("El Número de Cotización es un campo obligatorio y no puede estar vacío.");
            return;
        }
        
        setIsSubmitting(true);

        const newTotal = lineItems.reduce((acc, current) => {
            const originalItem = serviceRequest.items.find(ri => ri.id === current.serviceRequestItemId);
            return acc + ((originalItem?.quantity || 0) * current.unitPrice);
        }, 0);

        let newPaymentTerms = 'Contado';
        if (paymentCondition === 'Crédito') {
            newPaymentTerms = `Crédito ${creditTerm}`;
        } else if (paymentCondition === 'Por Avance') {
            const milestoneString = milestones
                .filter(m => m.description && Number(m.amount) > 0)
                .map(m => `${m.description.trim()}: ${Number(m.amount).toLocaleString()}`)
                .join('; ');
            newPaymentTerms = `Por Avance (${milestoneString})`;
        }

        // --- History Tracking Logic ---
        const changes: QuoteResponseChange['changes'] = [];
        if (newTotal !== quote.total) changes.push({ field: 'Monto Total', oldValue: quote.total, newValue: newTotal });
        if (Number(deliveryDays) !== quote.deliveryDays) changes.push({ field: 'Días de Entrega', oldValue: quote.deliveryDays, newValue: Number(deliveryDays) });
        if (newPaymentTerms !== quote.paymentTerms) changes.push({ field: 'Condiciones de Pago', oldValue: quote.paymentTerms, newValue: newPaymentTerms });
        if (pdfName !== quote.pdfAttachmentName) changes.push({ field: 'Archivo Adjunto', oldValue: quote.pdfAttachmentName || 'Ninguno', newValue: pdfName || 'Ninguno' });
        
        lineItems.forEach((li) => {
            const originalLi = quote.items.find(oli => oli.serviceRequestItemId === li.serviceRequestItemId);
            if (originalLi && originalLi.unitPrice !== li.unitPrice) {
                 const itemName = serviceRequest.items.find(i => i.id === li.serviceRequestItemId)?.name || `Item #${li.serviceRequestItemId}`;
                 changes.push({ field: `Precio - ${itemName}`, oldValue: originalLi.unitPrice, newValue: li.unitPrice });
            }
        });

        const newHistoryEntry: QuoteResponseChange = {
            user: userWhoIsEditing,
            changeDate: new Date().toISOString(),
            changes: changes
        };
        
        const updatedQuote: QuoteResponse = {
            ...quote,
            total: newTotal,
            deliveryDays: Number(deliveryDays),
            paymentTerms: newPaymentTerms,
            quoteNumber: quoteNumber,
            pdfAttachmentName: pdfName,
            pdfAttachmentBase64: pdfBase64,
            items: lineItems,
            history: changes.length > 0 ? [...(quote.history || []), newHistoryEntry] : (quote.history || []),
        };

        onSubmit(updatedQuote);
        showToast('Cotización actualizada exitosamente.', 'success');
        setIsSubmitting(false);
    };

    if (!isOpen || !quote || !serviceRequest) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl transform transition-all h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-dark-gray">Editar Cotización (ID: #{quote.id})</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>
                 <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Número de Cotización <span className="text-red-500">*</span></label>
                            <input type="text" value={quoteNumber} onChange={e => setQuoteNumber(e.target.value)} placeholder="# Cotización / Referencia" required className="w-full p-2 border border-slate-300 rounded-md mt-1" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Días de Entrega</label>
                            <input type="number" value={deliveryDays} onChange={e => setDeliveryDays(Number(e.target.value))} placeholder="Días de entrega" required className="w-full p-2 border border-slate-300 rounded-md mt-1" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">Condición de Pago</label>
                            <div className="flex gap-2 mt-1">
                                <select value={paymentCondition} onChange={e => setPaymentCondition(e.target.value as 'Contado' | 'Crédito' | 'Por Avance')} required className="flex-grow p-2 border border-slate-300 rounded-md">
                                    <option>Contado</option>
                                    <option>Crédito</option>
                                    <option>Por Avance</option>
                                </select>
                                {paymentCondition === 'Crédito' && (
                                    <select value={creditTerm} onChange={e => setCreditTerm(e.target.value as any)} required className="flex-grow p-2 border border-slate-300 rounded-md animate-fade-in">
                                        <option>8 Días</option>
                                        <option>15 Días</option>
                                        <option>30 Días</option>
                                    </select>
                                )}
                            </div>
                        </div>
                         {paymentCondition === 'Por Avance' && (
                            <div className="md:col-span-2 space-y-2 p-3 bg-slate-100 rounded-md border border-slate-200">
                                <h5 className="text-sm font-semibold text-slate-800">Detalle de Pagos por Avance</h5>
                                {milestones.map((milestone, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder={`Hito ${index + 1}`}
                                            value={milestone.description}
                                            onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                                            className="w-full p-1 border rounded-md"
                                            required
                                        />
                                        <div className="relative w-40">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-500 text-sm">¢</span>
                                            <input
                                                type="number"
                                                placeholder="Monto"
                                                value={milestone.amount}
                                                onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)}
                                                className="w-full p-1 border rounded-md pl-6"
                                                required
                                                min="0"
                                            />
                                        </div>
                                        <button type="button" onClick={() => removeMilestone(index)} disabled={milestones.length <= 1} className="text-red-500 disabled:text-slate-300 p-1">&times;</button>
                                    </div>
                                ))}
                                <button type="button" onClick={addMilestone} className="text-xs font-semibold text-primary hover:underline">+ Agregar Hito</button>
                            </div>
                        )}
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">Adjunto (PDF)</label>
                            <input type="file" onChange={handleFileChange} accept=".pdf" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100 mt-1" />
                            {pdfName && <span className="text-xs text-slate-500 mt-1">Archivo actual: {pdfName}</span>}
                        </div>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto border-t pt-4">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-200">
                                <tr>
                                    <th className="p-2 text-left">Artículo</th>
                                    <th className="p-2 text-left">Precio Unitario</th>
                                    <th className="p-2 text-left">Calidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {serviceRequest.items.map((item) => {
                                    const lineItem = lineItems.find(li => li.serviceRequestItemId === item.id) || {};
                                    return (
                                        <tr key={item.id} className="bg-white border-b">
                                            <td className="p-2">{item.name} <span className="text-xs text-slate-500">({item.quantity} {item.unit})</span></td>
                                            <td className="p-2">
                                                <input type="number" step="any" value={lineItem.unitPrice || 0} onChange={e => handleLineItemChange(item.id, 'unitPrice', Number(e.target.value))} className="w-full p-1 border rounded-md" />
                                            </td>
                                            <td className="p-2">
                                                <select value={lineItem.quality || 'Media'} onChange={e => handleLineItemChange(item.id, 'quality', e.target.value as QualityRating)} className="w-full p-1 border rounded-md">
                                                    <option>Alta</option>
                                                    <option>Media</option>
                                                    <option>Baja</option>
                                                </select>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                     <div className="flex-shrink-0 flex justify-end gap-4 pt-4 border-t">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary text-white font-bold py-2 px-4 rounded-lg">
                            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                 </form>
            </div>
        </div>
    );
};
