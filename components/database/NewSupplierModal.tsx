
import React, { useState } from 'react';

interface NewSupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newSupplierData: any) => void;
}

export const NewSupplierModal: React.FC<NewSupplierModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
}) => {
    const [name, setName] = useState('');
    const [serviceType, setServiceType] = useState('');
    const [location, setLocation] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [sinpePhone, setSinpePhone] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [bankAccountDetails, setBankAccountDetails] = useState('');
    const [bankAccount2, setBankAccount2] = useState('');
    const [bankAccount2Details, setBankAccount2Details] = useState('');
    const [comments, setComments] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setName('');
        setServiceType('');
        setLocation('');
        setPhone('');
        setEmail('');
        setSinpePhone('');
        setBankAccount('');
        setBankAccountDetails('');
        setBankAccount2('');
        setBankAccount2Details('');
        setComments('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!serviceType) {
            alert("Por favor seleccione un Bien o Servicio Principal.");
            return;
        }

        setIsSubmitting(true);

        const newSupplierData = {
            name,
            serviceType,
            location,
            phone,
            email,
            sinpePhone,
            bankAccount,
            bankAccountDetails,
            bankAccount2,
            bankAccount2Details,
            comments
        };

        onSubmit(newSupplierData);
        resetForm();
        onClose();
        setIsSubmitting(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl transform transition-all max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-dark-gray">Nuevo Proveedor</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-1">Nombre del Proveedor</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label htmlFor="serviceType" className="block text-sm font-bold text-slate-700 mb-1">Bien o Servicio Principal</label>
                        <select 
                            id="serviceType" 
                            value={serviceType} 
                            onChange={e => setServiceType(e.target.value)} 
                            required 
                            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        >
                            <option value="" disabled>Seleccione una opción...</option>
                            <option value="CONSTRUCTOR DE PROYECTOS RECURRENTES">CONSTRUCTOR DE PROYECTOS RECURRENTES</option>
                            <option value="CONSTRUCTOR">CONSTRUCTOR</option>
                            <option value="SERVICIOS">SERVICIOS</option>
                            <option value="MATERIALES">MATERIALES</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="location" className="block text-sm font-bold text-slate-700 mb-1">Ubicación</label>
                        <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-1">Teléfono</label>
                            <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-slate-400 mb-1">Correo Electrónico <span className="font-normal">(Opcional)</span></label>
                            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                    </div>

                    <div className="pt-4 mt-6">
                        <h3 className="text-lg font-bold text-[#334155] mb-4 flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Información de Pago (Opcional)
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label htmlFor="sinpePhone" className="block text-sm font-bold text-slate-700 mb-1">Teléfono (SINPE)</label>
                                <input type="tel" id="sinpePhone" value={sinpePhone} onChange={e => setSinpePhone(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Número para SINPE móvil" />
                            </div>
                            <div>
                                <label htmlFor="bankAccountPrimary" className="block text-sm font-bold text-slate-700 mb-1">Cuenta Bancaria Principal (IBAN)</label>
                                <input type="text" id="bankAccountPrimary" value={bankAccount} onChange={e => setBankAccount(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="CR..." />
                            </div>
                        </div>

                        {/* Custom Styled Account Boxes */}
                        <div className="space-y-4">
                            {/* Primary Account Box */}
                            <div className="relative border border-slate-200 rounded-lg p-5 pt-8 bg-white shadow-sm">
                                <span className="absolute -top-3 left-4 bg-white px-3 py-0.5 text-[10px] font-black text-slate-600 border border-slate-200 rounded uppercase tracking-wider">
                                    CUENTA BANCARIA PRINCIPAL (IBAN)
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col justify-center">
                                        <input 
                                            type="text" 
                                            value={bankAccount}
                                            onChange={e => setBankAccount(e.target.value)}
                                            className="w-full border-none outline-none text-sm font-mono text-slate-600 placeholder:text-slate-300 bg-transparent"
                                            placeholder="Opcional: Otra cuenta IBAN" 
                                        />
                                    </div>
                                    <div className="flex flex-col md:border-l border-slate-100 md:pl-6">
                                        <label className="text-[10px] font-black text-[#64748b] uppercase tracking-wider mb-1">DETALLE DE CUENTA</label>
                                        <input 
                                            type="text" 
                                            value={bankAccountDetails}
                                            onChange={e => setBankAccountDetails(e.target.value)}
                                            className="w-full border-none outline-none text-sm text-slate-600 placeholder:text-slate-300 bg-transparent"
                                            placeholder="" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Account Box */}
                            <div className="relative border border-slate-200 rounded-lg p-5 pt-8 bg-white shadow-sm">
                                <span className="absolute -top-3 left-4 bg-white px-3 py-0.5 text-[10px] font-black text-slate-600 border border-slate-200 rounded uppercase tracking-wider">
                                    CUENTA BANCARIA ADICIONAL (IBAN)
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col justify-center">
                                        <input 
                                            type="text" 
                                            value={bankAccount2}
                                            onChange={e => setBankAccount2(e.target.value)}
                                            className="w-full border-none outline-none text-sm font-mono text-slate-600 placeholder:text-slate-300 bg-transparent"
                                            placeholder="Ej: Cuenta principal en BAC, Cu..." 
                                        />
                                    </div>
                                    <div className="flex flex-col md:border-l border-slate-100 md:pl-6">
                                        <label className="text-[10px] font-black text-[#64748b] uppercase tracking-wider mb-1">DETALLE DE CUENTA</label>
                                        <input 
                                            type="text" 
                                            value={bankAccount2Details}
                                            onChange={e => setBankAccount2Details(e.target.value)}
                                            className="w-full border-none outline-none text-sm text-slate-600 placeholder:text-slate-300 bg-transparent"
                                            placeholder="Banco Nacional..." 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200">
                        <label htmlFor="comments" className="block text-sm font-bold text-slate-700 mb-1">Comentarios / Retroalimentación</label>
                        <textarea 
                            id="comments" 
                            value={comments} 
                            onChange={e => setComments(e.target.value)} 
                            rows={3} 
                            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" 
                            placeholder="Ingrese retroalimentación sobre calidad, cumplimiento, tiempos de respuesta, etc."
                        />
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-light-gray">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary text-white font-bold py-2 px-8 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-slate-400 disabled:cursor-wait shadow-lg">
                            {isSubmitting ? 'Creando...' : 'Crear Proveedor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
