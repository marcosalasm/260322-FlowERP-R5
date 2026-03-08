
import React, { useState, useEffect } from 'react';
import { PreOpRubro } from '../../types';

interface PreOpConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (rubros: PreOpRubro[]) => void;
    rubros: PreOpRubro[];
}

export const PreOpConfigModal: React.FC<PreOpConfigModalProps> = ({ isOpen, onClose, onSave, rubros }) => {
    const [localRubros, setLocalRubros] = useState<PreOpRubro[]>([]);
    const [newName, setNewName] = useState('');
    const [newLimit, setNewLimit] = useState<number | string>('');

    useEffect(() => {
        if (isOpen) {
            setLocalRubros([...rubros]);
            setNewName('');
            setNewLimit('');
        }
    }, [isOpen, rubros]);

    const handleAdd = () => {
        if (!newName.trim() || !newLimit) return;
        const newRubro: PreOpRubro = {
            id: Date.now(),
            nombre: newName.toUpperCase().trim(),
            limitePorProspecto: Number(newLimit)
        };
        setLocalRubros([...localRubros, newRubro]);
        setNewName('');
        setNewLimit('');
    };

    const handleRemove = (id: number) => {
        setLocalRubros(localRubros.filter(r => r.id !== id));
    };

    const handleLimitChange = (id: number, value: string) => {
        setLocalRubros(localRubros.map(r => r.id === id ? { ...r, limitePorProspecto: Number(value) } : r));
    };

    const totalLimit = localRubros.reduce((sum, r) => sum + r.limitePorProspecto, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl transform transition-all flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-bold text-slate-800">Configuración de Rubros Pre-op</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <p className="text-slate-500 text-sm italic mb-6">Defina los rubros permitidos y sus límites por prospecto.</p>

                {/* Add Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Agregar Nuevo Rubro</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr,1fr,auto] gap-3 items-end">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre del Rubro</label>
                            <input 
                                type="text" 
                                value={newName} 
                                onChange={e => setNewName(e.target.value)} 
                                placeholder="Ej: Planos, Avalúo" 
                                className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Límite por Prospecto (¢)</label>
                            <input 
                                type="number" 
                                value={newLimit} 
                                onChange={e => setNewLimit(e.target.value)} 
                                placeholder="Ej: 100000" 
                                className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                            />
                        </div>
                        <button 
                            onClick={handleAdd}
                            className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-all text-sm h-10 shadow-md shadow-blue-100"
                        >
                            Añadir Rubro
                        </button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rubros Configurados</h3>
                    {localRubros.map(rubro => (
                        <div key={rubro.id} className="flex items-center gap-4 bg-white border p-3 rounded-xl shadow-sm hover:border-primary transition-colors group">
                            <span className="flex-grow font-bold text-slate-700 uppercase text-xs tracking-wide">{rubro.nombre}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 font-mono text-sm">¢</span>
                                <input 
                                    type="number" 
                                    value={rubro.limitePorProspecto} 
                                    onChange={e => handleLimitChange(rubro.id, e.target.value)}
                                    className="w-32 p-1.5 border border-slate-200 rounded-lg text-right text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                                <button onClick={() => handleRemove(rubro.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    {localRubros.length === 0 && <p className="text-center text-slate-400 text-sm py-4 italic">No hay rubros configurados.</p>}
                </div>

                {/* Total Summary Footer */}
                <div className="flex-shrink-0 mt-6 bg-orange-50 border border-orange-100 p-5 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-orange-800 uppercase tracking-widest">Límite Total Acumulado de Preventa (¢)</span>
                        <span className="text-2xl font-mono font-black text-secondary">¢ {totalLimit.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-orange-600 italic">Este es el tope máximo que un prospecto puede acumular sumando todos sus rubros de preventa.</p>
                </div>

                <div className="flex-shrink-0 pt-6 mt-4 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="bg-slate-200 text-slate-700 font-bold py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors">Cancelar</button>
                    <button onClick={() => onSave(localRubros)} className="bg-primary text-white font-bold py-2 px-8 rounded-lg hover:bg-primary-dark transition-all shadow-lg shadow-blue-200">Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
};
