
import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { ServiceRequest, Supplier, QuoteResponse, QualityRating, ServiceRequestStatus } from '../../types';
import { AppContext } from '../../context/AppContext';
import { analyzeQuotePDF } from '../../services/geminiService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { EditQuoteModal } from './EditQuoteModal';
import { NewSupplierModal } from '../database/NewSupplierModal';
import { apiService } from '../../services/apiService';

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


interface AddQuoteFormProps {
    request: ServiceRequest;
    suppliers: Supplier[];
    onSubmit: (newQuote: Omit<QuoteResponse, 'id'>) => void;
    onCancel: () => void;
    onOpenNewSupplier: () => void;
    initialData?: Partial<QuoteResponse>;
    initialPdfFile?: File | null;
    initialPdfBase64?: string | null;
}

const AddQuoteForm: React.FC<AddQuoteFormProps> = ({ request, suppliers, onSubmit, onCancel, onOpenNewSupplier, initialData, initialPdfFile, initialPdfBase64 }) => {
    const [supplierId, setSupplierId] = useState<string>('');
    const [deliveryDays, setDeliveryDays] = useState<number | string>(initialData?.deliveryDays ?? '');
    const [quoteNumber, setQuoteNumber] = useState<string>(initialData?.quoteNumber ?? '');
    const [localPdfFile, setLocalPdfFile] = useState<File | null>(initialPdfFile || null);
    const [localPdfBase64, setLocalPdfBase64] = useState<string | null>(initialPdfBase64 || null);

    // New state for structured payment terms
    const [paymentCondition, setPaymentCondition] = useState<'Contado' | 'Crédito' | 'Por Avance'>('Contado');
    const [creditTerm, setCreditTerm] = useState<'8 Días' | '15 Días' | '30 Días'>('8 Días');
    const [milestones, setMilestones] = useState<{ description: string; amount: number | string }[]>([{ description: '', amount: '' }]);


    const [lineItems, setLineItems] = useState<any[]>(() => {
        if (initialData?.items) {
            return request.items.map(reqItem => {
                const analyzedItem = initialData.items?.find(ai => ai.serviceRequestItemId === reqItem.id);
                return {
                    serviceRequestItemId: reqItem.id,
                    unitPrice: analyzedItem?.unitPrice || 0,
                    quality: analyzedItem?.quality || 'Media' as QualityRating
                };
            });
        }
        return request.items.map(i => ({ serviceRequestItemId: i.id, unitPrice: 0, quality: 'Media' as QualityRating }));
    });

    // Parse initialData to set payment term dropdowns
    useEffect(() => {
        const terms = initialData?.paymentTerms ?? 'Contado';
        if (terms.toLowerCase().startsWith('por avance')) {
            setPaymentCondition('Por Avance');
            setMilestones([{ description: '', amount: '' }]);
        } else if (terms.startsWith('Crédito')) {
            setPaymentCondition('Crédito');
            if (terms.includes('8')) {
                setCreditTerm('8 Días');
            } else if (terms.includes('15')) {
                setCreditTerm('15 Días');
            } else if (terms.includes('30')) {
                setCreditTerm('30 Días');
            } else {
                setCreditTerm('8 Días'); // Default if not found
            }
        } else {
            setPaymentCondition('Contado');
        }
    }, [initialData]);

    useEffect(() => {
        if (suppliers.length > 0 && !supplierId) {
            setSupplierId(String(suppliers[0].id));
        }
    }, [suppliers, supplierId]);

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
        setLocalPdfFile(file);
        if (file) {
            const base64 = await fileToBase64(file);
            setLocalPdfBase64(base64);
        } else {
            setLocalPdfBase64(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!quoteNumber.trim()) {
            alert("El Número de Cotización es un campo obligatorio y no puede estar vacío.");
            return;
        }

        const selectedSupplier = suppliers.find(s => s.id === Number(supplierId));
        if (!selectedSupplier) {
            alert("Por favor, seleccione un proveedor válido.");
            return;
        }

        const total = lineItems.reduce((acc, current, index) => {
            const originalItem = request.items.find(ri => ri.id === current.serviceRequestItemId);
            return acc + ((originalItem?.quantity || 0) * current.unitPrice);
        }, 0);

        let finalPaymentTerms = 'Contado';
        if (paymentCondition === 'Crédito') {
            finalPaymentTerms = `Crédito ${creditTerm}`;
        } else if (paymentCondition === 'Por Avance') {
            const milestoneString = milestones
                .filter(m => m.description && Number(m.amount) > 0)
                .map(m => `${m.description.trim()}: ${Number(m.amount).toLocaleString()}`)
                .join('; ');
            finalPaymentTerms = `Por Avance (${milestoneString})`;
        }

        const newQuote: Omit<QuoteResponse, 'id'> = {
            serviceRequestId: request.id,
            supplierId: selectedSupplier.id,
            supplierName: selectedSupplier.name,
            quoteNumber,
            deliveryDays: Number(deliveryDays),
            paymentTerms: finalPaymentTerms,
            qualityNotes: initialData ? 'Analizado con IA' : 'Ingresado Manualmente',
            total,
            pdfAttachmentName: localPdfFile?.name,
            pdfAttachmentBase64: localPdfBase64 || undefined,
            items: lineItems,
            currency: initialData?.currency,
            history: [],
            aiValidation: initialData?.aiValidation,
        };
        onSubmit(newQuote);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-primary-dark p-4 rounded-lg mt-4 space-y-4 animate-fade-in">
            <h4 className="text-lg font-semibold text-dark-gray">{initialData ? 'Revisar Cotización Analizada por IA' : 'Registrar Nueva Cotización'}</h4>

            {initialData?.aiValidation && (
                <div className={`p-3 rounded-lg border-l-4 shadow-sm flex items-start gap-3 ${(initialData.aiValidation.totalMatch && initialData.aiValidation.namesMatch) ? 'bg-green-50 border-green-500' : 'bg-amber-50 border-amber-500'}`}>
                    <div className="flex-shrink-0 mt-1">
                        {(initialData.aiValidation.totalMatch && initialData.aiValidation.namesMatch) ? (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        )}
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${(initialData.aiValidation.totalMatch && initialData.aiValidation.namesMatch) ? 'text-green-800' : 'text-amber-800'}`}>
                            Corroboración Automática de la IA:
                        </p>
                        <div className="text-xs space-y-1 mt-1 font-medium">
                            <p className={initialData.aiValidation.totalMatch ? 'text-green-700' : 'text-amber-700 font-bold'}>
                                {initialData.aiValidation.totalMatch ? '✅ El monto total declarado coincide con la suma de los ítems.' : '❌ DISCREPANCIA EN MONTOS: El total declarado no coincide con el cálculo de los ítems.'}
                            </p>
                            <p className={initialData.aiValidation.namesMatch ? 'text-green-700' : 'text-amber-700 font-bold'}>
                                {initialData.aiValidation.namesMatch ? '✅ Los nombres de los artículos coinciden razonablemente.' : '❌ DISCREPANCIA EN ARTÍCULOS: Los nombres extraídos difieren de la solicitud original.'}
                            </p>
                            {initialData.aiValidation.discrepancyNote && (
                                <p className="mt-2 text-slate-700 bg-white/50 p-2 rounded border border-amber-200 italic">
                                    " {initialData.aiValidation.discrepancyNote} "
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {initialData && !initialData.aiValidation && <p className="text-xs -mt-3 text-slate-500 italic">Por favor, verifique que los datos extraídos son correctos antes de guardar.</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-slate-700">Proveedor</label>
                    <div className="flex gap-2 mt-1">
                        <select value={supplierId} onChange={e => setSupplierId(e.target.value)} required className="flex-grow p-2 border border-slate-300 rounded-md">
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <button
                            type="button"
                            onClick={onOpenNewSupplier}
                            className="bg-blue-100 text-primary p-2 rounded-md hover:bg-blue-200 transition-colors"
                            title="Crear Nuevo Proveedor"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700">Número de Cotización <span className="text-red-500">*</span></label>
                    <input type="text" value={quoteNumber} onChange={e => setQuoteNumber(e.target.value)} placeholder="# Cotización / Referencia" required className="w-full p-2 border border-slate-300 rounded-md mt-1" />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700">Días de Entrega</label>
                    <input type="number" value={deliveryDays} onChange={e => setDeliveryDays(Number(e.target.value))} placeholder="Días de entrega" required className="w-full p-2 border border-slate-300 rounded-md mt-1" />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700">Condición de Pago</label>
                    <div className="flex gap-2 mt-1">
                        <select
                            value={paymentCondition}
                            onChange={e => setPaymentCondition(e.target.value as 'Contado' | 'Crédito' | 'Por Avance')}
                            required
                            className="flex-grow p-2 border border-slate-300 rounded-md"
                        >
                            <option value="Contado">Contado</option>
                            <option value="Crédito">Crédito</option>
                            <option value="Por Avance">Por Avance</option>
                        </select>
                        {paymentCondition === 'Crédito' && (
                            <select
                                value={creditTerm}
                                onChange={e => setCreditTerm(e.target.value as any)}
                                required
                                className="flex-grow p-2 border border-slate-300 rounded-md animate-fade-in"
                            >
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
                    {localPdfFile && <span className="text-xs text-slate-500 mt-1">Archivo actual: {localPdfFile.name}</span>}
                </div>
            </div>

            <div className="space-y-2 mt-6">
                <div className="flex items-center justify-end gap-2 px-1">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Nota: Los montos unitarios deben incluir el impuesto de ventas (IVA)
                    </span>
                </div>
                <div className="overflow-y-auto max-h-48 border rounded-lg">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-200">
                            <tr>
                                <th className="p-2 text-left">Artículo</th>
                                <th className="p-2 text-left">Precio Unitario</th>
                                <th className="p-2 text-left">Calidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {request.items.map((item) => {
                                const lineItem = lineItems.find(li => li.serviceRequestItemId === item.id) || {};
                                return (
                                    <tr key={item.id} className="bg-white">
                                        <td className="p-2">{item.name} <span className="text-xs text-slate-500">({item.quantity} {item.unit})</span></td>
                                        <td className="p-2">
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400">¢</span>
                                                <input type="number" step="any" value={lineItem.unitPrice || 0} onChange={e => handleLineItemChange(item.id, 'unitPrice', Number(e.target.value))} className="w-full p-1 pl-6 border rounded-md" />
                                            </div>
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
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-primary text-white font-bold py-2 px-4 rounded-lg">Guardar Cotización</button>
            </div>
        </form>
    );
};

interface QuoteManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: ServiceRequest | null;
    onAddQuote: (newQuoteData: Omit<QuoteResponse, 'id'>) => void;
    onUpdateQuote: (updatedQuote: QuoteResponse) => void;
    onOpenChart: (request: ServiceRequest) => void;
}

export const QuoteManagementModal: React.FC<QuoteManagementModalProps> = ({ isOpen, onClose, request, onAddQuote, onUpdateQuote, onOpenChart }) => {
    const appContext = useContext(AppContext);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<Partial<QuoteResponse> | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [analyzedPdfFile, setAnalyzedPdfFile] = useState<File | null>(null);
    const [analyzedPdfBase64, setAnalyzedPdfBase64] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [expandedHistoryQuoteId, setExpandedHistoryQuoteId] = useState<number | null>(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState<QuoteResponse | null>(null);
    const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setShowAddForm(false);
            setIsAnalyzing(false);
            setAnalysisResult(null);
            setAnalysisError(null);
            setAnalyzedPdfFile(null);
            setAnalyzedPdfBase64(null);
            setExpandedHistoryQuoteId(null);
            setIsEditModalOpen(false);
            setSelectedQuote(null);
            setIsNewSupplierModalOpen(false);
        }
    }, [isOpen]);

    const quotesForRequest = useMemo(() => {
        return appContext?.quoteResponses.filter(q => q.serviceRequestId === request?.id) || [];
    }, [appContext?.quoteResponses, request]);

    const availableSuppliers = useMemo(() => {
        const quotedSupplierIds = new Set(quotesForRequest.map(q => q.supplierId));
        return appContext?.suppliers.filter(s => !quotedSupplierIds.has(s.id)) || [];
    }, [appContext?.suppliers, quotesForRequest]);

    const handleAnalyzePDF = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !request) return;

        setIsAnalyzing(true);
        setAnalysisError(null);
        setAnalysisResult(null);
        setAnalyzedPdfFile(file);

        try {
            const pdfBase64Url = await fileToBase64(file);
            const base64Content = pdfBase64Url.split(',')[1];
            if (!base64Content) throw new Error("No se pudo procesar el archivo PDF.");

            setAnalyzedPdfBase64(pdfBase64Url);
            const result = await analyzeQuotePDF(base64Content, request.items);
            setAnalysisResult(result);
            setShowAddForm(true);
        } catch (error: any) {
            setAnalysisError(error.message || "Ocurrió un error inesperado durante el análisis.");
            setAnalyzedPdfBase64(null);
            setAnalyzedPdfFile(null);
        } finally {
            setIsAnalyzing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleAddQuoteSubmit = (newQuote: Omit<QuoteResponse, 'id'>) => {
        onAddQuote(newQuote);
        setShowAddForm(false);
        setAnalysisResult(null);
        setAnalyzedPdfFile(null);
        setAnalyzedPdfBase64(null);
    };

    const handleCancelForm = () => {
        setShowAddForm(false);
        setAnalysisResult(null);
        setAnalysisError(null);
        setAnalyzedPdfFile(null);
        setAnalyzedPdfBase64(null);
    };

    const handleEditQuote = (quote: QuoteResponse) => {
        setSelectedQuote(quote);
        setIsEditModalOpen(true);
    };

    const handleUpdateAndCloseModal = (updatedQuote: QuoteResponse) => {
        onUpdateQuote(updatedQuote);
        setIsEditModalOpen(false);
        setSelectedQuote(null);
    };

    const handleCreateSupplier = async (newSupplierData: Omit<Supplier, 'id'>) => {
        if (!appContext) return;
        try {
            const savedSupplier = await apiService.createSupplier(newSupplierData);
            appContext.setSuppliers(prev => [...prev, savedSupplier]);
            setIsNewSupplierModalOpen(false);
        } catch (error) {
            console.error('Error creating supplier:', error);
            alert('Error al crear el proveedor. Por favor intente de nuevo.');
        }
    };

    if (!isOpen || !request || !appContext) return null;
    const { user, roles } = appContext;

    const userRoles = new Set(user.roleIds.map(id => roles.find(r => r.id === id)?.name));
    const canEditAnyQuote = (userRoles.has('Director financiero') || userRoles.has('Gerente General')) &&
        [ServiceRequestStatus.Approved, ServiceRequestStatus.InQuotation, ServiceRequestStatus.QuotationReady].includes(request.status);


    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
                <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <div>
                            <h2 className="text-2xl font-bold text-dark-gray">Gestionar Cotizaciones</h2>
                            <p className="text-sm text-slate-500">Solicitud ID: #{request.id} - {request.projectName}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2 -mr-4">
                        <h3 className="text-lg font-semibold text-dark-gray mb-2">Cotizaciones Recibidas ({quotesForRequest.length})</h3>
                        <div className="space-y-3">
                            {quotesForRequest.length > 0 ? quotesForRequest.map(quote => (
                                <div key={quote.id} className="bg-white border p-3 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-primary">{quote.supplierName}</p>
                                            <p className="text-sm text-slate-600">Total: {quote.currency || 'CRC'} {quote.total.toLocaleString()} | Entrega: {quote.deliveryDays} días | Pago: {quote.paymentTerms}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {canEditAnyQuote && (
                                                <button onClick={() => handleEditQuote(quote)} className="text-sm font-medium text-blue-600 hover:text-blue-800">Editar</button>
                                            )}
                                            {quote.history && quote.history.length > 0 && (
                                                <button
                                                    onClick={() => setExpandedHistoryQuoteId(prev => prev === quote.id ? null : quote.id)}
                                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                                    title="Ver historial de cambios"
                                                >
                                                    {/* FIX: Removed redundant stroke attribute from SVG below */}
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    Historial ({quote.history.length})
                                                </button>
                                            )}
                                            {quote.pdfAttachmentName && (
                                                <a href={quote.pdfAttachmentBase64} download={quote.pdfAttachmentName} className="text-red-500 flex items-center gap-1 text-sm hover:underline">
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 13.5l3 3m0 0l3-3m-3 3v-6m1.06-4.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                                                    {quote.pdfAttachmentName}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    {expandedHistoryQuoteId === quote.id && (
                                        <div className="mt-3 pt-3 border-t bg-slate-50 p-2 rounded-md text-xs">
                                            <h5 className="font-bold mb-1">Historial de Cambios:</h5>
                                            <ul className="space-y-1">
                                                {quote.history?.slice().reverse().map((entry, idx) => (
                                                    <li key={idx}>
                                                        <span className="font-semibold">{format(new Date(entry.changeDate), "dd/MM/yy HH:mm", { locale: es })} por {entry.user}:</span>
                                                        {entry.changes.map((change, cIdx) => (
                                                            <span key={cIdx} className="ml-1 text-slate-600">
                                                                "{change.field}" cambió de "{change.oldValue}" a "{change.newValue}".
                                                            </span>
                                                        ))}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <p className="text-sm text-center text-slate-400 py-4">No hay cotizaciones registradas para esta solicitud.</p>
                            )}
                        </div>

                        <input type="file" ref={fileInputRef} onChange={handleAnalyzePDF} className="hidden" accept="application/pdf" />

                        {isAnalyzing && (
                            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg mt-4">
                                <LoadingSpinner />
                                <p className="mt-2 text-sm text-slate-600">Analizando documento... Esto puede tomar unos segundos.</p>
                            </div>
                        )}

                        {analysisError && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-lg mt-4" role="alert">
                                <p className="font-bold">Error en el Análisis</p>
                                <p className="text-sm">{analysisError}</p>
                            </div>
                        )}

                        {!showAddForm && !isAnalyzing && (
                            <div className="mt-6 flex flex-col gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button onClick={() => setShowAddForm(true)} disabled={availableSuppliers.length === 0} className="w-full bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed">
                                        Registrar Manualmente
                                    </button>
                                    <button onClick={() => fileInputRef.current?.click()} disabled={availableSuppliers.length === 0} className="w-full bg-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:bg-orange-300 disabled:cursor-not-allowed">
                                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a3.375 3.375 0 00-2.456-2.456L12.75 18l1.197-.398a3.375 3.375 0 002.456-2.456L16.5 14.25l.398 1.197a3.375 3.375 0 002.456 2.456L20.25 18l-1.197.398a3.375 3.375 0 00-2.456 2.456z" /></svg>
                                        Analizar Cotización con IA
                                    </button>
                                </div>
                                <div className="flex justify-center mt-2">
                                    <button
                                        onClick={() => setIsNewSupplierModalOpen(true)}
                                        className="text-xs font-bold text-primary hover:text-primary-dark uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                                        Nuevo Proveedor
                                    </button>
                                </div>
                            </div>
                        )}
                        {availableSuppliers.length === 0 && !showAddForm && (
                            <p className="text-center text-xs text-slate-500 mt-2">No hay más proveedores disponibles para cotizar. Edite o elimine una cotización existente para agregar una nueva.</p>
                        )}

                        {showAddForm && (
                            <AddQuoteForm
                                request={request}
                                suppliers={availableSuppliers}
                                onSubmit={handleAddQuoteSubmit}
                                onCancel={handleCancelForm}
                                onOpenNewSupplier={() => setIsNewSupplierModalOpen(true)}
                                initialData={analysisResult || {}}
                                initialPdfFile={analyzedPdfFile}
                                initialPdfBase64={analyzedPdfBase64}
                            />
                        )}
                    </div>

                    <div className="flex justify-end gap-4 pt-4 mt-4 border-t flex-shrink-0">
                        <button onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg">Cerrar</button>
                        <button
                            onClick={() => onOpenChart(request)}
                            disabled={quotesForRequest.length < 1}
                            className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-400"
                        >
                            Ver Cuadro Comparativo
                        </button>
                    </div>
                </div>
            </div>
            {selectedQuote && (
                <EditQuoteModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSubmit={handleUpdateAndCloseModal}
                    quote={selectedQuote}
                    userWhoIsEditing={user.name}
                />
            )}
            <NewSupplierModal
                isOpen={isNewSupplierModalOpen}
                onClose={() => setIsNewSupplierModalOpen(false)}
                onSubmit={handleCreateSupplier}
            />
        </>
    );
};
