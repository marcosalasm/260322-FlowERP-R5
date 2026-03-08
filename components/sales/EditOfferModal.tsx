import React, { useState, useEffect, useMemo } from 'react';
import { Offer, Prospect, ProjectType, OfferStatus, Budget, BudgetStatus, IndirectCosts } from '../../types';
import { formatNumber } from '../../utils/format';

interface EditOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedOffer: Offer) => void;
    offer: Offer | null;
    prospects: Prospect[];
    budgets: Budget[];
}

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
);

export const EditOfferModal: React.FC<EditOfferModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    offer,
    prospects,
    budgets,
}) => {
    const [entryMode, setEntryMode] = useState<'link' | 'manual'>('link');

    // State for 'link' mode
    const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');

    // State for 'manual' mode
    const [manualAmount, setManualAmount] = useState<number | string>('');
    const [manualBudget, setManualBudget] = useState<number | string>('');

    const [description, setDescription] = useState('');
    const [projectType, setProjectType] = useState<ProjectType>(ProjectType.Construccion);
    const [status, setStatus] = useState<OfferStatus>(OfferStatus.Confeccion);
    const [attachment, setAttachment] = useState<File | null>(null);
    const [existingAttachmentName, setExistingAttachmentName] = useState<string | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Budgets available for selection: finalized ones, plus the one already linked to this offer
    const availableBudgets = useMemo(() => {
        return budgets.filter(b => b.status === BudgetStatus.Finalized || b.id === offer?.budgetId);
    }, [budgets, offer]);

    const selectedBudget = useMemo(() => {
        if (entryMode === 'link') {
            return budgets.find(b => b.id === parseInt(selectedBudgetId, 10));
        }
        return null;
    }, [budgets, selectedBudgetId, entryMode]);

    useEffect(() => {
        if (entryMode === 'link' && selectedBudget && selectedBudget.id !== offer?.budgetId) {
            setDescription(selectedBudget.description || '');
        }
    }, [selectedBudget, entryMode, offer]);

    const calculatedCosts = useMemo(() => {
        if (!selectedBudget) return { utility: 0, administration: 0, unexpected: 0, totalDeduction: 0 };

        const directCost = selectedBudget.directCostTotal;
        const costs: IndirectCosts = selectedBudget.indirectCosts;

        const utility = directCost * (costs.utility / 100);
        const administration = directCost * (costs.administration / 100);
        const unexpected = directCost * (costs.unexpected / 100);

        return {
            utility,
            administration,
            unexpected,
            totalDeduction: utility + administration + unexpected
        };
    }, [selectedBudget]);

    useEffect(() => {
        if (offer) {
            if (offer.budgetId) {
                setEntryMode('link');
                setSelectedBudgetId(String(offer.budgetId));
                setManualAmount('');
                setManualBudget('');
            } else {
                setEntryMode('manual');
                setSelectedBudgetId('');
                setManualAmount(offer.amount);
                setManualBudget(offer.budget);
            }
            setDescription(offer.description || '');
            setProjectType(offer.projectType);
            setStatus(offer.status);
            setExistingAttachmentName(offer.pdfAttachmentName);
            setAttachment(null);
        }
    }, [offer]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!offer) return;

        setIsSubmitting(true);
        let updatedOfferData: Partial<Offer>;

        if (entryMode === 'link') {
            if (!selectedBudget) {
                alert('Por favor, seleccione un presupuesto válido.');
                setIsSubmitting(false);
                return;
            }
            updatedOfferData = {
                amount: selectedBudget.finalTotal,
                budget: selectedBudget.finalTotal - calculatedCosts.totalDeduction,
                budgetId: selectedBudget.id,
            };
        } else { // Manual mode
            if (Number(manualAmount) <= 0 || Number(manualBudget) <= 0) {
                alert('Los montos deben ser números positivos.');
                setIsSubmitting(false);
                return;
            }
            updatedOfferData = {
                amount: Number(manualAmount),
                budget: Number(manualBudget),
                budgetId: undefined, // Ensure budgetId is cleared
            };
        }

        const updatedOffer: Offer = {
            ...offer,
            ...updatedOfferData,
            description,
            projectType,
            status,
            pdfAttachmentName: attachment?.name || existingAttachmentName,
        };

        onSubmit(updatedOffer);
        setIsSubmitting(false);
    };

    if (!isOpen || !offer) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-dark-gray">Editar Oferta Comercial</h2>
                        <p className="text-sm font-semibold text-medium-gray">{offer.consecutiveNumber}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
                    <div className="flex-grow overflow-y-auto p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Método de Ingreso</label>
                            <div className="flex gap-4 rounded-lg bg-slate-100 p-1">
                                <button type="button" onClick={() => setEntryMode('link')} className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-all ${entryMode === 'link' ? 'bg-white shadow text-primary' : 'text-slate-600'}`}>Vincular Presupuesto</button>
                                <button type="button" onClick={() => setEntryMode('manual')} className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-all ${entryMode === 'manual' ? 'bg-white shadow text-primary' : 'text-slate-600'}`}>Ingreso Manual</button>
                            </div>
                        </div>

                        {entryMode === 'link' ? (
                            <div className="space-y-4 animate-fade-in">
                                <div>
                                    <label htmlFor="edit-budget-selection" className="block text-sm font-medium text-slate-700 mb-1">Seleccionar Presupuesto</label>
                                    <select
                                        id="edit-budget-selection"
                                        value={selectedBudgetId}
                                        onChange={e => setSelectedBudgetId(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        disabled={availableBudgets.length === 0}
                                    >
                                        <option value="">Seleccione un presupuesto...</option>
                                        {availableBudgets.map(b => <option key={b.id} value={b.id}>
                                            {b.consecutiveNumber} - {b.description || 'Sin descripción'} - {b.prospectName} {b.isRecurring ? '(Recurrente)' : ''}
                                        </option>)}
                                    </select>
                                </div>
                                {selectedBudget && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                                        <div>
                                            <p className="block text-sm font-medium text-slate-700 mb-1">Monto de Oferta</p>
                                            <p className="w-full p-2 border border-slate-200 rounded-md bg-slate-100 text-slate-800 font-semibold">
                                                {selectedBudget.currency === 'CRC' ? '¢' : '$'}{formatNumber(selectedBudget.finalTotal, 2, 2)}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1 mb-1">
                                                <p className="block text-sm font-medium text-slate-700">Costo de Presupuesto</p>
                                                <div className="relative group">
                                                    <InfoIcon />
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                                        Calculado restando Utilidad ({selectedBudget.currency === 'CRC' ? '¢' : '$'}{formatNumber(calculatedCosts.utility, 2, 2)}), Administración ({selectedBudget.currency === 'CRC' ? '¢' : '$'}{formatNumber(calculatedCosts.administration, 2, 2)}) e Imprevistos ({selectedBudget.currency === 'CRC' ? '¢' : '$'}{formatNumber(calculatedCosts.unexpected, 2, 2)}) del Monto Total Final.
                                                        <svg className="absolute text-slate-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="w-full p-2 border border-slate-200 rounded-md bg-slate-100 text-slate-800 font-semibold">
                                                {selectedBudget.currency === 'CRC' ? '¢' : '$'}{formatNumber(selectedBudget.finalTotal - calculatedCosts.totalDeduction, 2, 2)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="edit-manual-amount" className="block text-sm font-medium text-slate-700 mb-1">Monto de Oferta</label>
                                        <input type="number" id="edit-manual-amount" value={manualAmount} min="0" onChange={e => setManualAmount(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                    </div>
                                    <div>
                                        <label htmlFor="edit-manual-budget" className="block text-sm font-medium text-slate-700 mb-1">Costo de Presupuesto</label>
                                        <input type="number" id="edit-manual-budget" value={manualBudget} min="0" onChange={e => setManualBudget(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div>
                            <label htmlFor="offer-edit-description" className="block text-sm font-medium text-slate-700 mb-1">Descripción de la Oferta</label>
                            <textarea id="offer-edit-description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Resumen del alcance, notas importantes, etc." />
                        </div>

                        <div>
                            <label htmlFor="edit-offer-projectType" className="block text-sm font-medium text-slate-700 mb-1">Tipo de Proyecto</label>
                            <select id="edit-offer-projectType" value={projectType} onChange={e => setProjectType(e.target.value as ProjectType)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                {Object.values(ProjectType).map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="edit-offer-status" className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                            <select id="edit-offer-status" value={status} onChange={e => setStatus(e.target.value as OfferStatus)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                {Object.values(OfferStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="pdfAttachment" className="block text-sm font-medium text-slate-700 mb-1">Adjuntar Oferta (PDF)</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="flex text-sm text-slate-600">
                                        <label htmlFor="edit-file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                                            <span>{attachment ? 'Cambiar archivo' : 'Subir un archivo'}</span>
                                            <input id="edit-file-upload" name="edit-file-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
                                        </label>
                                        <p className="pl-1">o arrastrar y soltar</p>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {attachment ? `Nuevo: ${attachment.name}` : (existingAttachmentName ? `Actual: ${existingAttachmentName}` : 'PDF hasta 10MB')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-4 p-6 border-t flex-shrink-0 bg-slate-50">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting || (entryMode === 'link' && !selectedBudgetId)} className="bg-primary text-white font-bold py-2 px-8 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed shadow-lg">
                            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};