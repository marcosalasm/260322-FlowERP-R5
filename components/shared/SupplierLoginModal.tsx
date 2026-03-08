import React, { useState, useContext, useEffect } from 'react';
import { Supplier } from '../../types';
import { AppContext } from '../../context/AppContext';

interface SupplierLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (supplier: Supplier) => void;
}

export const SupplierLoginModal: React.FC<SupplierLoginModalProps> = ({ isOpen, onClose, onLogin }) => {
    const appContext = useContext(AppContext);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
    
    const suppliers = appContext?.suppliers || [];

    useEffect(() => {
        if (suppliers.length > 0) {
            setSelectedSupplierId(String(suppliers[0].id));
        }
    }, [suppliers]);
    
    if (!isOpen) return null;

    const handleLogin = () => {
        const supplier = suppliers.find(s => s.id === Number(selectedSupplierId));
        if (supplier) {
            onLogin(supplier);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-dark-gray">Ingresar como Proveedor</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <p className="text-sm text-slate-500 mb-6">Seleccione el proveedor que desea simular para acceder a su portal de cotizaciones.</p>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="supplier-select" className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
                        <select 
                            id="supplier-select" 
                            value={selectedSupplierId}
                            onChange={(e) => setSelectedSupplierId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-light-gray">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">
                            Cancelar
                        </button>
                        <button 
                            type="button" 
                            onClick={handleLogin} 
                            disabled={!selectedSupplierId}
                            className="bg-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-slate-400"
                        >
                            Ingresar al Portal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};