import React, { useState } from 'react';

interface NewLaborItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newLaborData: any) => void;
}

export const NewLaborItemModal: React.FC<NewLaborItemModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [hourlyRate, setHourlyRate] = useState<string>('');
    const [currency, setCurrency] = useState<'CRC' | 'USD'>('CRC');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setName('');
        setHourlyRate('');
        setCurrency('CRC');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        onSubmit({ name, hourlyRate: Number(hourlyRate), currency });
        resetForm();
        onClose();
        setIsSubmitting(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-dark-gray">Nuevo Puesto de Mano de Obra</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="labor-name" className="block text-sm font-medium text-slate-700 mb-1">Nombre del Puesto</label>
                        <input type="text" id="labor-name" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="labor-rate" className="block text-sm font-medium text-slate-700 mb-1">Salario por Hora</label>
                            <input type="number" step="any" id="labor-rate" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="labor-currency" className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
                            <select id="labor-currency" value={currency} onChange={e => setCurrency(e.target.value as 'CRC' | 'USD')} required className="w-full p-2 border border-slate-300 rounded-md">
                                <option value="CRC">Colones (₡)</option>
                                <option value="USD">Dólares ($)</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t border-light-gray">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-400">
                            {isSubmitting ? 'Creando...' : 'Crear Puesto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};