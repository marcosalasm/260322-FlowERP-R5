import React, { useState, useEffect, useRef } from 'react';
import { Material, ServiceItem, PredeterminedActivity, PredeterminedSubActivity, LaborItem } from '../../types';
import { analyzeMaterialList } from '../../services/geminiService';
import { useToast } from '../../context/ToastContext';
import Papa from 'papaparse';

interface EditPredeterminedActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedActivityData: PredeterminedActivity) => void;
    activity: PredeterminedActivity | null;
    materials: Material[];
    serviceItems: ServiceItem[];
    laborItems: LaborItem[];
}

const getNextId = (items: any[]) => (items.length > 0 ? Math.max(...items.map(i => i.id)) : 0) + 1;

const fileToBase64 = (file: File): Promise<{ base64: string, mimeType: string }> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const mimeType = result.substring(5, result.indexOf(';'));
        const base64 = result.split(',')[1];
        resolve({ base64, mimeType });
    };
    reader.onerror = error => reject(error);
});

// Local row type for UI state
type SubActivityRow = {
    id: number;
    type: 'material' | 'labor' | 'subcontract';
    description: string;
    quantityPerBaseUnit: number | string;
    unit: string;
};

export const EditPredeterminedActivityModal: React.FC<EditPredeterminedActivityModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    activity,
    materials,
    serviceItems,
    laborItems,
}) => {
    const { showToast } = useToast();
    const csvInputRef = useRef<HTMLInputElement>(null);
    const aiInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState('');
    const [baseUnit, setBaseUnit] = useState('');
    const [subActivities, setSubActivities] = useState<SubActivityRow[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    useEffect(() => {
        if (activity) {
            setName(activity.name);
            setBaseUnit(activity.baseUnit);

            const mappedSubActivities: SubActivityRow[] = activity.subActivities.map(sub => {
                let type: 'material' | 'labor' | 'subcontract' = sub.type || 'material';
                
                // Fallback for legacy data without type
                if (!sub.type) {
                    if (laborItems.some(l => l.name === sub.description)) type = 'labor';
                    else if (serviceItems.some(s => s.name === sub.description)) type = 'subcontract';
                }

                return {
                    id: sub.id,
                    type,
                    description: sub.description,
                    quantityPerBaseUnit: sub.quantityPerBaseUnit,
                    unit: sub.unit
                };
            });
            setSubActivities(mappedSubActivities);
        }
    }, [activity, materials, laborItems, serviceItems]);
    
    const handleSubActivityChange = (index: number, field: keyof SubActivityRow, value: string) => {
        const newSubActivities = [...subActivities];
        const currentItem = newSubActivities[index];
        (currentItem as any)[field] = value;

        if (field === 'type') {
            currentItem.description = '';
            currentItem.unit = '';
        }

        if (field === 'description') {
            let selectedItem: any;
            if (currentItem.type === 'material') {
                selectedItem = materials.find(m => m.name === value);
            } else if (currentItem.type === 'labor') {
                selectedItem = laborItems.find(l => l.name === value);
            } else if (currentItem.type === 'subcontract') {
                selectedItem = serviceItems.find(s => s.name === value);
            }

            if (selectedItem) {
                currentItem.unit = (selectedItem as any).unit || (currentItem.type === 'labor' ? 'Hora' : '');
            }
        }
        setSubActivities(newSubActivities);
    };

    const handleAddSubActivity = () => {
        setSubActivities([...subActivities, { id: getNextId(subActivities), type: 'material', description: '', quantityPerBaseUnit: 1, unit: '' }]);
    };

    const handleRemoveSubActivity = (index: number) => {
        if (subActivities.length > 1) {
            setSubActivities(subActivities.filter((_, i) => i !== index));
        }
    };

    const handleDownloadTemplate = () => {
        const headers = ['Tipo', 'Nombre', 'Cantidad', 'Unidad'];
        const exampleRow = ['Material', 'Cemento Portland', '0.5', 'Saco 42.5kg'];
        const exampleRow2 = ['Mano de Obra', 'Maestro de Obras', '0.5', 'Hora'];
        
        const csvContent = "\uFEFF" + [headers.join(','), exampleRow.join(','), exampleRow2.join(',')].join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "plantilla_edicion_receta.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- CSV Import ---
    const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const imported = results.data.map((row: any, idx: number) => {
                    const rawType = (row.type || row.Tipo || 'material').toLowerCase();
                    let type: SubActivityRow['type'] = 'material';
                    if (rawType.includes('mano') || rawType.includes('labor') || rawType === 'mo') type = 'labor';
                    else if (rawType.includes('sub') || rawType.includes('contrato')) type = 'subcontract';

                    const desc = row.description || row.Nombre || row.Descripcion || '';
                    const qty = Number(row.quantity || row.Cantidad || row.Cant) || 1;
                    
                    let unit = row.unit || row.Unidad || '';
                    if (!unit) {
                        const cat = [...materials, ...serviceItems].find(m => m.name.toLowerCase() === desc.toLowerCase());
                        if (cat) unit = cat.unit;
                        else if (type === 'labor') unit = 'Hora';
                    }

                    return {
                        id: Date.now() + idx,
                        type,
                        description: desc,
                        quantityPerBaseUnit: qty,
                        unit
                    };
                }).filter((i: any) => i.description);

                if (imported.length > 0) {
                    setSubActivities(prev => {
                        const filtered = prev.filter(p => p.description !== '');
                        return [...filtered, ...imported];
                    });
                    showToast(`${imported.length} ítems importados correctamente.`, 'success');
                }
                if (csvInputRef.current) csvInputRef.current.value = '';
            }
        });
    };

    // --- AI Import ---
    const handleAiImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        try {
            const { base64, mimeType } = await fileToBase64(file);
            const analyzed = await analyzeMaterialList(base64, mimeType);
            
            const newItems: SubActivityRow[] = analyzed.map((aiItem, idx) => {
                let type: SubActivityRow['type'] = 'material';
                if (laborItems.some(l => l.name.toLowerCase() === aiItem.name.toLowerCase())) type = 'labor';
                else if (serviceItems.some(s => s.name.toLowerCase() === aiItem.name.toLowerCase())) type = 'subcontract';

                return {
                    id: Date.now() + idx + 1000,
                    type,
                    description: aiItem.name,
                    quantityPerBaseUnit: aiItem.quantity,
                    unit: aiItem.unit
                };
            });

            setSubActivities(prev => {
                const filtered = prev.filter(p => p.description !== '');
                return [...filtered, ...newItems];
            });
            showToast(`IA analizó y agregó ${newItems.length} ítems a la receta.`, 'success');
        } catch (error) {
            showToast('Error al analizar el archivo con IA.', 'error');
        } finally {
            setIsAnalyzing(false);
            if (aiInputRef.current) aiInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activity) return;

        setIsSubmitting(true);
        
        const finalSubActivities = subActivities
            .map((sub, index) => ({
                id: sub.id,
                itemNumber: `1.${index + 1}`,
                type: sub.type,
                description: sub.description.trim(),
                quantityPerBaseUnit: Number(sub.quantityPerBaseUnit),
                unit: sub.unit
            }))
            .filter(i => i.description && i.quantityPerBaseUnit > 0);

        if (!name || !baseUnit || finalSubActivities.length === 0) {
            alert('Por favor complete el nombre, unidad base y agregue al menos una sub-actividad válida con tipo, nombre y cantidad.');
            setIsSubmitting(false);
            return;
        }

        const updatedActivity: PredeterminedActivity = {
            ...activity,
            name,
            baseUnit,
            subActivities: finalSubActivities,
        };

        onSubmit(updatedActivity);
        setIsSubmitting(false);
        onClose();
    };

    if (!isOpen || !activity) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-5xl transform transition-all h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-dark-gray">Editar Actividad Predeterminada</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6 flex-grow flex flex-col overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-shrink-0">
                        <div>
                            <label htmlFor="edit-activity-name" className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Actividad (Receta)</label>
                            <input type="text" id="edit-activity-name" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                         <div>
                            <label htmlFor="edit-base-unit" className="block text-sm font-medium text-slate-700 mb-1">Unidad de Medida Base</label>
                            <input type="text" id="edit-base-unit" value={baseUnit} onChange={e => setBaseUnit(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                    </div>
                    
                    <div className="flex-grow flex flex-col overflow-hidden border-t pt-4">
                        <div className="flex justify-between items-end mb-4 flex-shrink-0">
                             <h3 className="text-lg font-medium text-dark-gray">Composición de la Actividad</h3>
                            <div className="flex gap-2 items-center">
                                <button 
                                    type="button" 
                                    onClick={handleDownloadTemplate}
                                    className="text-[10px] text-primary hover:underline font-bold uppercase tracking-tight mr-2"
                                >
                                    Descargar Plantilla
                                </button>

                                <input type="file" ref={csvInputRef} onChange={handleCsvImport} accept=".csv" className="hidden" />
                                <button 
                                    type="button" 
                                    onClick={() => csvInputRef.current?.click()}
                                    className="text-xs bg-slate-100 text-slate-700 font-bold py-1.5 px-3 rounded-lg hover:bg-slate-200 transition-colors border flex items-center gap-1"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                                    Importar CSV
                                </button>
                                
                                <input type="file" ref={aiInputRef} onChange={handleAiImport} accept=".pdf,image/*" className="hidden" />
                                <button 
                                    type="button" 
                                    disabled={isAnalyzing}
                                    onClick={() => aiInputRef.current?.click()}
                                    className="text-xs bg-secondary/10 text-secondary font-bold py-1.5 px-3 rounded-lg hover:bg-secondary hover:text-white transition-all border border-secondary/30 flex items-center gap-1"
                                >
                                    {isAnalyzing ? (
                                        <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                    )}
                                    Analizar con IA
                                </button>
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-3">
                           {subActivities.map((sub, index) => (
                                <div key={sub.id} className="grid grid-cols-[150px,1fr,120px,120px,auto] gap-2 items-center">
                                    <select
                                        value={sub.type}
                                        onChange={e => handleSubActivityChange(index, 'type', e.target.value as any)}
                                        className="p-2 border border-slate-300 rounded-md text-sm font-semibold"
                                    >
                                        <option value="material">Material</option>
                                        <option value="labor">Mano de Obra</option>
                                        <option value="subcontract">Sub Contrato</option>
                                    </select>
                                    
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            list={`edit-list-for-${sub.id}-${sub.type}`}
                                            placeholder="Nombre del insumo..."
                                            value={sub.description}
                                            onChange={e => handleSubActivityChange(index, 'description', e.target.value)}
                                            required
                                            className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        />
                                        <datalist id={`edit-list-for-${sub.id}-material`}>
                                            {materials.map(m => <option key={m.id} value={m.name} />)}
                                        </datalist>
                                        <datalist id={`edit-list-for-${sub.id}-labor`}>
                                            {laborItems.map(l => <option key={l.id} value={l.name} />)}
                                        </datalist>
                                        <datalist id={`edit-list-for-${sub.id}-subcontract`}>
                                            {serviceItems.map(s => <option key={s.id} value={s.name} />)}
                                        </datalist>
                                    </div>

                                    <input 
                                        type="number" 
                                        step="any" 
                                        placeholder="Cant." 
                                        value={sub.quantityPerBaseUnit} 
                                        onChange={e => handleSubActivityChange(index, 'quantityPerBaseUnit', e.target.value)} 
                                        required 
                                        className="p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm text-center font-mono" 
                                    />
                                    
                                    <input 
                                        type="text" 
                                        placeholder="Unidad" 
                                        value={sub.unit} 
                                        onChange={e => handleSubActivityChange(index, 'unit', e.target.value)}
                                        required
                                        className="p-2 border border-slate-300 rounded-md text-sm text-center bg-slate-50" 
                                    />

                                    <button type="button" onClick={() => handleRemoveSubActivity(index)} disabled={subActivities.length <= 1} className="p-2 text-red-500 hover:text-red-700 disabled:text-slate-300 disabled:cursor-not-allowed" aria-label="Eliminar fila">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"/></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={handleAddSubActivity} className="mt-4 text-sm font-black text-primary hover:text-primary-dark uppercase tracking-widest flex items-center gap-2 flex-shrink-0">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                            Añadir Insumo Manualmente
                        </button>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t flex-shrink-0">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting || isAnalyzing} className="bg-primary text-white font-bold py-2 px-8 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-slate-400 disabled:cursor-wait shadow-lg">
                            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};