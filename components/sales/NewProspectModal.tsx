import React, { useState } from 'react';

interface NewProspectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newProspectData: any) => void;
}

export const NewProspectModal: React.FC<NewProspectModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
}) => {
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [nextFollowUpDate, setNextFollowUpDate] = useState('');
    const [birthday, setBirthday] = useState('');
    const [spouseName, setSpouseName] = useState('');
    const [children, setChildren] = useState('');
    const [hobbies, setHobbies] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setName('');
        setCompany('');
        setPhone('');
        setEmail('');
        setNextFollowUpDate('');
        setBirthday('');
        setSpouseName('');
        setChildren('');
        setHobbies('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const newProspectData = {
            name,
            company,
            phone,
            email,
            nextFollowUpDate,
            birthday,
            spouseName,
            children,
            hobbies
        };

        onSubmit(newProspectData);
        resetForm();
        onClose();
        setIsSubmitting(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-dark-gray">Nuevo Prospecto</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-4 -mr-4">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Empresa</label>
                        <input type="text" id="company" value={company} onChange={e => setCompany(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                            <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico <span className="text-slate-400 font-normal">(Opcional)</span></label>
                            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="nextFollowUpDate" className="block text-sm font-medium text-slate-700 mb-1">Fecha de Recordatorio de Seguimiento <span className="text-slate-400 font-normal">(Opcional)</span></label>
                        <input type="date" id="nextFollowUpDate" value={nextFollowUpDate} onChange={e => setNextFollowUpDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    
                    <div className="border-t border-slate-200 pt-4">
                         <h3 className="text-lg font-medium text-dark-gray mb-2">Información Personal (Opcional)</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="birthday" className="block text-sm font-medium text-slate-700 mb-1">Fecha de Cumpleaños</label>
                                <input type="date" id="birthday" value={birthday} onChange={e => setBirthday(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                             <div>
                                <label htmlFor="spouseName" className="block text-sm font-medium text-slate-700 mb-1">Nombre de Esposa/o</label>
                                <input type="text" id="spouseName" value={spouseName} onChange={e => setSpouseName(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                             <div>
                                <label htmlFor="children" className="block text-sm font-medium text-slate-700 mb-1">Hijos</label>
                                <input type="text" id="children" placeholder="Ej: Ana (5), Pedro (8)" value={children} onChange={e => setChildren(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                             <div>
                                <label htmlFor="hobbies" className="block text-sm font-medium text-slate-700 mb-1">Pasatiempos / Intereses</label>
                                <input type="text" id="hobbies" value={hobbies} onChange={e => setHobbies(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                         </div>
                    </div>


                    <div className="flex justify-end gap-4 pt-4 border-t border-light-gray">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-slate-400 disabled:cursor-wait">
                            {isSubmitting ? 'Creando...' : 'Crear Prospecto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};