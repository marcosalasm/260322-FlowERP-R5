import React, { useState, useEffect } from 'react';

interface BonoFormulario {
    id: number;
    nombre: string;
    cedula: string;
    telefono: string;
    canton: string;
    direccion: string;
    estadoCivil: string;
    hijos: number;
    recibioBono: boolean;
    propiedades: number;
    tipoIngreso: string;
    ingresoTotal: number;
    analisis: string;
}

interface NewBonoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<BonoFormulario, 'id'>) => void;
    initialData?: BonoFormulario | null;
}

const CANTON_OPTIONS = [
    "Coto Brus",
    "Pérez Zeledón",
    "Corredores",
    "Buenos Aires",
    "Osa",
    "Puerto Jimenez",
    "Golfito",
    "Parrita",
    "Quepos",
    "Orotina",
    "Otro Canton"
];

const ESTADO_CIVIL_OPTIONS = [
    "Soltero(a)",
    "Casado(a)",
    "Unión de Hecho",
    "Divorciado(a)",
    "Viudo(a)",
    "Separado(a)"
];

const TIPO_INGRESO_OPTIONS = [
    "Asalariado Sector Privado",
    "Asalariado Sector Público",
    "Trabajador Independiente",
    "Pensionado",
    "Pensión Alimenticia",
    "Ayuda Social / Sin Ingresos"
];

export const NewBonoModal: React.FC<NewBonoModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        cedula: '',
        telefono: '',
        canton: CANTON_OPTIONS[0],
        direccion: '',
        estadoCivil: ESTADO_CIVIL_OPTIONS[0],
        hijos: 0,
        recibioBono: false,
        propiedades: 0,
        tipoIngreso: TIPO_INGRESO_OPTIONS[0],
        ingresoTotal: 0,
        analisis: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    nombre: initialData.nombre,
                    cedula: initialData.cedula,
                    telefono: initialData.telefono,
                    canton: initialData.canton,
                    direccion: initialData.direccion,
                    estadoCivil: initialData.estadoCivil,
                    hijos: initialData.hijos,
                    recibioBono: initialData.recibioBono,
                    propiedades: initialData.propiedades,
                    tipoIngreso: initialData.tipoIngreso,
                    ingresoTotal: initialData.ingresoTotal,
                    analisis: initialData.analisis
                });
            } else {
                // Reset to defaults
                setFormData({
                    nombre: '',
                    cedula: '',
                    telefono: '',
                    canton: CANTON_OPTIONS[0],
                    direccion: '',
                    estadoCivil: ESTADO_CIVIL_OPTIONS[0],
                    hijos: 0,
                    recibioBono: false,
                    propiedades: 0,
                    tipoIngreso: TIPO_INGRESO_OPTIONS[0],
                    ingresoTotal: 0,
                    analisis: ''
                });
            }
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                    type === 'number' ? Number(value) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-dark-gray">{initialData ? 'Editar Formulario' : 'Nuevo Formulario'} - Bono Ordinario</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Nombre Completo</label>
                            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Cédula</label>
                            <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Teléfono</label>
                            <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Cantón</label>
                            <select name="canton" value={formData.canton} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md">
                                {CANTON_OPTIONS.map(canton => (
                                    <option key={canton} value={canton}>{canton}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Dirección Exacta</label>
                            <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Estado Civil</label>
                            <select name="estadoCivil" value={formData.estadoCivil} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md">
                                {ESTADO_CIVIL_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Hijos</label>
                            <input type="number" name="hijos" value={formData.hijos} onChange={handleChange} min="0" className="w-full mt-1 p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Propiedades</label>
                            <input type="number" name="propiedades" value={formData.propiedades} onChange={handleChange} min="0" className="w-full mt-1 p-2 border rounded-md" />
                        </div>
                        <div className="flex items-center pt-6">
                            <input type="checkbox" name="recibioBono" id="recibioBono" checked={formData.recibioBono} onChange={handleChange} className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary" />
                            <label htmlFor="recibioBono" className="ml-2 block text-sm text-slate-700">¿Ha recibido bono?</label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Tipo de Ingreso</label>
                            <select name="tipoIngreso" value={formData.tipoIngreso} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md">
                                {TIPO_INGRESO_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Ingreso Familiar Total</label>
                            <input type="number" name="ingresoTotal" value={formData.ingresoTotal} onChange={handleChange} min="0" className="w-full mt-1 p-2 border rounded-md" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Análisis</label>
                        <select name="analisis" value={formData.analisis} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md">
                            <option value="">Seleccione...</option>
                            <option value="Aplica">Aplica</option>
                            <option value="No aplica">No aplica</option>
                        </select>
                    </div>
                </form>

                <div className="flex-shrink-0 pt-4 border-t mt-4 flex justify-end gap-4">
                    <button onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300">Cancelar</button>
                    <button onClick={handleSubmit} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark">{initialData ? 'Actualizar' : 'Guardar'}</button>
                </div>
            </div>
        </div>
    );
};
