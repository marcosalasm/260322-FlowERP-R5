
import React, { useState, useEffect } from 'react';
import { Material } from '../../types';

interface EditMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedMaterial: Material) => void;
    material: Material | null;
}

export const EditMaterialModal: React.FC<EditMaterialModalProps> = ({ isOpen, onClose, onSubmit, material }) => {
    const [name, setName] = useState('');
    const [unit, setUnit] = useState('');
    const [unitCost, setUnitCost] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (material) {
            setName(material.name);
            setUnit(material.unit);
            setUnitCost(String(material.unitCost || ''));
        }
    }, [material]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!material) return;

        setIsSubmitting(true);
        const updatedMaterial: Material = {
            ...material,
            name,
            unit,
            unitCost: Number(unitCost) || 0,
        };
        onSubmit(updatedMaterial);
        setIsSubmitting(false);
    };

    if (!isOpen || !material) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-dark-gray">Editar Material</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="edit-mat-name" className="block text-sm font-medium text-slate-700 mb-1">Nombre del Material</label>
                        <input type="text" id="edit-mat-name" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label htmlFor="edit-mat-unit" className="block text-sm font-medium text-slate-700 mb-1">Unidad de Medida</label>
                        <input type="text" id="edit-mat-unit" placeholder='Ej: Saco, m³, Unidad, Rollo' value={unit} onChange={e => setUnit(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label htmlFor="edit-mat-cost" className="block text-sm font-medium text-slate-700 mb-1">
                            Costo Unitario (₡) <span className="text-primary font-bold text-[10px] uppercase ml-1">(Incluye IVA)</span>
                        </label>
                        <input type="number" step="any" id="edit-mat-cost" placeholder='Ej: 4500.50' value={unitCost} onChange={e => setUnitCost(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono" />
                    </div>


                    <div className="flex justify-end gap-4 pt-4 border-t border-light-gray">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-slate-400 disabled:cursor-wait">
                            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
