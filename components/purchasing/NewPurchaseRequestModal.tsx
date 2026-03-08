import React, { useState, useEffect, useContext } from 'react';
import { Project, ServiceRequestStatus, User } from '../../types';

interface NewPurchaseRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newRequestData: any) => void;
    projects: Project[];
    currentUser: User;
}

export const NewPurchaseRequestModal: React.FC<NewPurchaseRequestModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    projects,
    currentUser,
}) => {
    const [projectId, setProjectId] = useState<string>(projects.length > 0 ? String(projects[0].id) : '');
    const [requiredDate, setRequiredDate] = useState('');
    const [items, setItems] = useState<{ item: string; quantity: number | string }[]>([{ item: '', quantity: 1 }]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Set default required date to 7 days from now
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        setRequiredDate(defaultDate.toISOString().split('T')[0]);
        // Set default project
        if (projects.length > 0) {
            setProjectId(String(projects[0].id));
        }
    }, [projects]);
    
    const resetForm = () => {
        setProjectId(projects.length > 0 ? String(projects[0].id) : '');
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        setRequiredDate(defaultDate.toISOString().split('T')[0]);
        setItems([{ item: '', quantity: 1 }]);
    };
    
    const handleItemChange = (index: number, field: 'item' | 'quantity', value: string) => {
        const newItems = [...items];
        if (field === 'quantity') {
            newItems[index][field] = value === '' ? '' : Math.max(1, parseInt(value, 10) || 1);
        } else {
            newItems[index][field] = value;
        }
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, { item: '', quantity: 1 }]);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const selectedProject = projects.find(p => p.id === parseInt(projectId, 10));
        const finalItems = items
            .map(i => ({ item: i.item.trim(), quantity: Number(i.quantity) }))
            .filter(i => i.item && i.quantity > 0);

        if (!selectedProject || finalItems.length === 0) {
            alert('Por favor complete todos los campos: seleccione un proyecto y agregue al menos un artículo con cantidad válida.');
            setIsSubmitting(false);
            return;
        }

        const newRequestData = {
            projectId: selectedProject.id,
            projectName: selectedProject.name,
            requestDate: new Date().toISOString().split('T')[0],
            requester: currentUser.name,
            requesterId: currentUser.id,
            requiredDate,
            status: ServiceRequestStatus.PendingApproval,
            items: finalItems,
        };

        onSubmit(newRequestData);
        resetForm();
        onClose();
        setIsSubmitting(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-dark-gray">Nueva Solicitud de Compra</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="project" className="block text-sm font-medium text-slate-700 mb-1">Proyecto</label>
                            <select id="project" value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="requiredDate" className="block text-sm font-medium text-slate-700 mb-1">Fecha Requerida</label>
                            <input type="date" id="requiredDate" value={requiredDate} onChange={e => setRequiredDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-medium text-dark-gray mb-2">Artículos</h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 -mr-2">
                            {items.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input type="text" placeholder="Nombre del Artículo" value={item.item} onChange={e => handleItemChange(index, 'item', e.target.value)} required className="flex-grow p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                                    <input type="number" placeholder="Cant." value={item.quantity} min="1" onChange={e => handleItemChange(index, 'quantity', e.target.value)} required className="w-24 p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                                    <button type="button" onClick={() => handleRemoveItem(index)} disabled={items.length <= 1} className="p-2 text-red-500 hover:text-red-700 disabled:text-slate-300 disabled:cursor-not-allowed" aria-label="Eliminar artículo">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd"></path></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={handleAddItem} className="mt-3 text-sm font-medium text-primary hover:text-primary-dark">+ Agregar otro artículo</button>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-light-gray">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-slate-400 disabled:cursor-wait">
                            {isSubmitting ? 'Creando...' : 'Crear Solicitud'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};