import React, { useState, useRef, useContext } from 'react';
import { Material, ServiceItem } from '../../types';
import { analyzeMaterialList } from '../../services/geminiService';
import { useToast } from '../../context/ToastContext';
import Papa from 'papaparse';

interface NewRecurringOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newTemplateData: any) => void;
    materials: Material[];
    serviceItems: ServiceItem[];
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

export const NewRecurringOrderModal: React.FC<NewRecurringOrderModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    materials,
    serviceItems
}) => {
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const aiFileInputRef = useRef<HTMLInputElement>(null);
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [items, setItems] = useState<{ id: number; name: string; quantity: number | string; unit: string }[]>([{ id: 1, name: '', quantity: 1, unit: '' }]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const combinedItemCatalog = [...materials, ...serviceItems];

    const resetForm = () => {
        setName('');
        setDescription('');
        setItems([{ id: 1, name: '', quantity: 1, unit: '' }]);
    };
    
    const handleItemChange = (index: number, field: 'name' | 'quantity', value: string) => {
        const newItems = [...items];
        const currentItem = newItems[index];
        
        if (field === 'name') {
            currentItem.name = value;
            const catalogItem = combinedItemCatalog.find(catItem => catItem.name === value);
            currentItem.unit = catalogItem ? catalogItem.unit : '';
        } else if (field === 'quantity') {
            currentItem.quantity = value === '' ? '' : Math.max(1, parseInt(value, 10) || 1);
        }
        
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, { id: getNextId(items), name: '', quantity: 1, unit: '' }]);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    // --- CSV Import Logic ---
    const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const importedItems = results.data.map((row: any, idx: number) => {
                    const itemName = row.name || row.Nombre || '';
                    const qty = Number(row.quantity || row.Cantidad) || 1;
                    const catalogItem = combinedItemCatalog.find(c => c.name.toLowerCase() === itemName.toLowerCase());
                    return {
                        id: Date.now() + idx,
                        name: catalogItem ? catalogItem.name : itemName,
                        quantity: qty,
                        unit: catalogItem ? catalogItem.unit : (row.unit || row.Unidad || '')
                    };
                }).filter((i: any) => i.name);

                if (importedItems.length > 0) {
                    setItems(prev => {
                        const filteredPrev = prev.filter(i => i.name !== '');
                        return [...filteredPrev, ...importedItems];
                    });
                    showToast(`${importedItems.length} artículos importados desde CSV.`, 'success');
                }
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        });
    };

    // --- AI Import Logic ---
    const handleAiImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        try {
            const { base64, mimeType } = await fileToBase64(file);
            const analyzedItems = await analyzeMaterialList(base64, mimeType);
            
            const newItems = analyzedItems.map((aiItem, idx) => {
                const catalogItem = combinedItemCatalog.find(c => c.name.toLowerCase() === aiItem.name.toLowerCase());
                return {
                    id: Date.now() + idx + 500,
                    name: catalogItem ? catalogItem.name : aiItem.name,
                    quantity: aiItem.quantity,
                    unit: catalogItem ? catalogItem.unit : aiItem.unit
                };
            });

            setItems(prev => {
                const filteredPrev = prev.filter(i => i.name !== '');
                return [...filteredPrev, ...newItems];
            });
            showToast(`IA analizó y agregó ${newItems.length} artículos.`, 'success');
        } catch (error) {
            showToast('Error al analizar la lista con IA.', 'error');
        } finally {
            setIsAnalyzing(false);
            if (aiFileInputRef.current) aiFileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const finalItems = items
            .map(i => ({ id: i.id, name: i.name.trim(), quantity: Number(i.quantity), unit: i.unit }))
            .filter(i => i.name && i.quantity > 0);

        if (!name || finalItems.length === 0) {
            alert('Por favor complete el nombre de la plantilla y agregue al menos un artículo.');
            setIsSubmitting(false);
            return;
        }

        const newTemplateData = {
            name,
            description,
            items: finalItems,
        };

        onSubmit(newTemplateData);
        resetForm();
        onClose();
        setIsSubmitting(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl transform transition-all h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-dark-gray">Nuevo Pedido Recurrente</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6 flex-grow flex flex-col overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-shrink-0">
                        <div>
                            <label htmlFor="template-name" className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Plantilla</label>
                            <input type="text" id="template-name" value={name} onChange={e => setName(e.target.value)} required placeholder="Ej: Kit Inicio Obra Gris" className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                         <div>
                            <label htmlFor="template-desc" className="block text-sm font-medium text-slate-700 mb-1">Descripción (Opcional)</label>
                            <input type="text" id="template-desc" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                    </div>
                    
                    <div className="flex flex-col flex-grow overflow-hidden">
                        <div className="flex justify-between items-end mb-2 flex-shrink-0">
                            <h3 className="text-lg font-medium text-dark-gray">Lista de Artículos</h3>
                            <div className="flex gap-2">
                                <input type="file" ref={fileInputRef} onChange={handleCsvImport} accept=".csv" className="hidden" />
                                <button 
                                    type="button" 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs bg-slate-100 text-slate-700 font-bold py-1.5 px-3 rounded-lg hover:bg-slate-200 transition-colors border flex items-center gap-1"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                                    Importar CSV
                                </button>
                                
                                <input type="file" ref={aiFileInputRef} onChange={handleAiImport} accept=".pdf,image/*" className="hidden" />
                                <button 
                                    type="button" 
                                    disabled={isAnalyzing}
                                    onClick={() => aiFileInputRef.current?.click()}
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

                        <div className="space-y-3 overflow-y-auto flex-grow pr-2 -mr-2 border rounded-md p-4 bg-slate-50 shadow-inner">
                            {items.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-[1fr,100px,100px,auto] gap-2 items-center animate-fade-in">
                                    <input 
                                        type="text" 
                                        list="item-catalog-template"
                                        placeholder="Nombre del Artículo" 
                                        value={item.name} 
                                        onChange={e => handleItemChange(index, 'name', e.target.value)} 
                                        required 
                                        className="p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm" 
                                    />
                                    <input type="number" placeholder="Cant." value={item.quantity} min="1" onChange={e => handleItemChange(index, 'quantity', e.target.value)} required className="p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm text-center" />
                                    <input type="text" placeholder="Unidad" value={item.unit} readOnly className="p-2 border border-slate-300 rounded-md bg-slate-100 focus:outline-none text-sm text-center text-slate-500 font-medium" />
                                    <button type="button" onClick={() => handleRemoveItem(index)} disabled={items.length <= 1} className="p-2 text-red-500 hover:text-red-700 disabled:text-slate-300 disabled:cursor-not-allowed" aria-label="Eliminar artículo">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd"></path></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <datalist id="item-catalog-template">
                            {combinedItemCatalog.map(catItem => <option key={catItem.id} value={catItem.name} />)}
                        </datalist>
                        <button type="button" onClick={handleAddItem} className="mt-3 text-sm font-black text-primary hover:text-primary-dark uppercase tracking-widest flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                            Añadir Manualmente
                        </button>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-light-gray flex-shrink-0">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary text-white font-bold py-2 px-8 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-slate-400 disabled:cursor-wait shadow-lg">
                            {isSubmitting ? 'Guardando...' : 'Crear Plantilla'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};