
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Budget, BudgetStatus, Supplier } from '../../types';
import { AppContext } from '../../context/AppContext';

interface NewRequisitoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
    activeView?: string;
    budgets: Budget[];
    suppliers: Supplier[];
}

const STATUS_REQUISITOS = [
    "Armando",
    "Estudio Crediticio",
    "Avalúo MUCAP",
    "Avalúo Condi MUCAP",
    "Avalúo Rechazado",
    "Listo para entrega",
    "Entregado",
    "No Procede",
    "Sin Continuidad"
];

const STATUS_CASOS = [
    "Entregado",
    "Avalúo",
    "Condicionado",
    "Subsanación",
    "Rev Subsanación",
    "Registrado",
    "Aprobado",
    "En APC",
    "Rechazo Muni",
    "Con Permisos",
    "Formalizado",
    "En Pausa",
    "En Construcción",
    "Finalizado",
    "No Procede"
];

const UBICACION_OPTIONS = [
    "Coto Brus",
    "Corredores",
    "Golfito",
    "Puerto Jimenez",
    "Buenos Aires",
    "Perez Zeledon",
    "Osa",
    "Quepos",
    "Parrita",
    "Orotina",
    "Otro Canton"
];

const TIPO_BONO_OPTIONS = [
    "Ordinario",
    "Bono Crédito",
    "Bono Ramt",
    "Bono Art 59",
    "Adulto Mayor",
    "Discapacidad",
    "Patio"
];

const ENTIDAD_OPTIONS = [
    "Coopeande",
    "Mucap",
    "Mutual"
];

const DEFAULT_CHECKLIST_ITEMS = [
    "AGUA",
    "ELECTRICIDAD",
    "USO DE SUELO",
    "EXCLUSION",
    "DOC TECNICOS",
    "FIRMAS",
    "PAGO DE AVALUO",
    "HISTORICO",
    "TRASPASO"
];

const formatCurrencyValue = (value: number) => {
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',');
};

export const NewRequisitoModal: React.FC<NewRequisitoModalProps> = ({ isOpen, onClose, onSubmit, initialData, activeView, budgets, suppliers }) => {
    const appContext = useContext(AppContext);
    const currentUser = appContext?.user;

    // Form State
    const [formData, setFormData] = useState({
        nombre: '',
        tipoBono: '',
        entidad: '',
        estatus: '',
        ubicacion: '',
        fechaEntrega: '',
        monto: '',
        budgetId: '',
        constructora: ''
    });

    // Checklist State
    const [checklist, setChecklist] = useState<{ name: string, status: string }[]>([]);
    const [newRequirement, setNewRequirement] = useState('');

    // Logs State
    const [logs, setLogs] = useState<{ date: string, user: string, content: string }[]>([]);
    const [newLogEntry, setNewLogEntry] = useState('');

    const [isMontoFocused, setIsMontoFocused] = useState(false);

    const isGestionCasos = activeView === 'bonos_casos';
    const showBudgetLink = activeView === 'bonos_casos' || activeView === 'bonos_requisitos';
    const statusOptions = isGestionCasos ? STATUS_CASOS : STATUS_REQUISITOS;

    // Filtrar presupuestos disponibles o recurrentes
    const availableBudgets = useMemo(() => {
        return budgets.filter(b =>
            b.status === BudgetStatus.Finalized ||
            b.isRecurring ||
            (initialData?.budgetId && b.id === initialData.budgetId)
        );
    }, [budgets, initialData]);

    // Filtrar proveedores que son CONSTRUCTOR DE PROYECTOS RECURRENTES
    const recurringConstructors = useMemo(() => {
        return suppliers.filter(s => s.serviceType === 'CONSTRUCTOR DE PROYECTOS RECURRENTES');
    }, [suppliers]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    nombre: initialData.nombre,
                    tipoBono: initialData.tipoBono,
                    entidad: initialData.entidad,
                    estatus: initialData.estatus,
                    ubicacion: initialData.ubicacion,
                    fechaEntrega: initialData.fechaEntrega,
                    monto: String(initialData.monto),
                    budgetId: initialData.budgetId ? String(initialData.budgetId) : '',
                    constructora: initialData.constructora || ''
                });

                // Initialize checklist from data or default with migration to status logic
                const initialChecklist = initialData.checklist && initialData.checklist.length > 0
                    ? initialData.checklist.map((item: any) => ({
                        name: item.name,
                        status: item.status || ''
                    }))
                    : DEFAULT_CHECKLIST_ITEMS.map(item => ({ name: item, status: '' }));
                setChecklist(initialChecklist);

                // Initialize logs
                setLogs(initialData.logs || []);
            } else {
                setFormData({
                    nombre: '',
                    tipoBono: '',
                    entidad: '',
                    estatus: statusOptions[0],
                    ubicacion: '',
                    fechaEntrega: new Date().toISOString().split('T')[0],
                    monto: '',
                    budgetId: '',
                    constructora: ''
                });
                setChecklist(DEFAULT_CHECKLIST_ITEMS.map(item => ({ name: item, status: '' })));
                setLogs([]);
            }
            setIsMontoFocused(false);
            setNewRequirement('');
            setNewLogEntry('');
        }
    }, [isOpen, initialData, activeView, statusOptions]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        let cleanValue = value;
        if (name === 'monto') {
            // Allow only numbers and dots for decimal
            cleanValue = value.replace(/[^0-9.]/g, '');
        }

        let updatedFormData = { ...formData, [name]: cleanValue };

        if (name === 'tipoBono') {
            if (['Ordinario', 'Patio', 'Bono Ramt'].includes(value)) {
                updatedFormData.monto = '9300000';
            } else if (['Adulto Mayor', 'Discapacidad'].includes(value)) {
                updatedFormData.monto = '13950000';
            }
        }

        if (name === 'budgetId') {
            const selectedBudget = budgets.find(b => b.id === Number(value));
            if (selectedBudget) {
                updatedFormData.monto = String(selectedBudget.finalTotal);
            }
        }

        setFormData(updatedFormData);
    };

    // Checklist Handlers
    const handleStatusChange = (index: number, newStatus: string) => {
        const newChecklist = [...checklist];
        newChecklist[index].status = newStatus;
        setChecklist(newChecklist);
    };

    const addRequirement = () => {
        if (newRequirement.trim()) {
            setChecklist([...checklist, { name: newRequirement.toUpperCase(), status: '' }]);
            setNewRequirement('');
        }
    };

    // Log Handlers
    const addLogEntry = () => {
        if (newLogEntry.trim() && currentUser) {
            const newEntry = {
                date: new Date().toISOString(),
                user: currentUser.name,
                content: newLogEntry
            };
            setLogs([newEntry, ...logs]);
            setNewLogEntry('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validación estricta para estado "Entregado"
        if (formData.estatus === 'Entregado') {
            const missingFields: string[] = [];
            if (!formData.tipoBono) missingFields.push("Tipo de Bono");
            if (!formData.entidad) missingFields.push("Entidad");
            if (!formData.ubicacion) missingFields.push("Ubicación");
            if (!formData.budgetId) missingFields.push("Vincular Presupuesto");

            if (missingFields.length > 0) {
                alert(`Para establecer el estatus "Entregado", los siguientes campos son obligatorios:\n\n- ${missingFields.join('\n- ')}`);
                return;
            }
        }

        onSubmit({
            ...formData,
            monto: Number(formData.monto),
            budgetId: formData.budgetId ? Number(formData.budgetId) : undefined,
            checklist,
            logs
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-dark-gray">
                        {initialData ? 'Editar' : 'Nuevo'} {isGestionCasos ? 'Caso' : 'Requisito'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Content - 3 Column Layout */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">

                        {/* Col 1: Datos del Expediente */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Datos del Expediente
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre del Proyecto / Familia</label>
                                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary outline-none" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo de Bono</label>
                                        <select name="tipoBono" value={formData.tipoBono} onChange={handleChange} required className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-sm">
                                            <option value="">- Seleccione -</option>
                                            {TIPO_BONO_OPTIONS.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Entidad</label>
                                        <select name="entidad" value={formData.entidad} onChange={handleChange} required className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-sm">
                                            <option value="">- Seleccione -</option>
                                            {ENTIDAD_OPTIONS.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Estatus Actual</label>
                                        <select name="estatus" value={formData.estatus} onChange={handleChange} required className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-sm font-semibold text-primary">
                                            {statusOptions.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha Referencia</label>
                                        <input type="date" name="fechaEntrega" value={formData.fechaEntrega} onChange={handleChange} required className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-sm" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ubicación</label>
                                    <select name="ubicacion" value={formData.ubicacion} onChange={handleChange} required className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-sm">
                                        <option value="">- Seleccione Cantón -</option>
                                        {UBICACION_OPTIONS.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Constructora / Asignado a</label>
                                    <select name="constructora" value={formData.constructora} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-sm">
                                        <option value="">- No asignado -</option>
                                        {recurringConstructors.map(supplier => (
                                            <option key={supplier.id} value={supplier.name}>
                                                {supplier.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {showBudgetLink && (
                                    <div className={`p-3 rounded-lg border ${formData.estatus === 'Entregado' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'}`}>
                                        <label className={`block text-xs font-bold uppercase mb-1 ${formData.estatus === 'Entregado' ? 'text-red-600' : 'text-blue-600'}`}>
                                            Vincular Presupuesto {formData.estatus === 'Entregado' ? '(Requerido)' : '(Opcional)'}
                                        </label>
                                        <select
                                            name="budgetId"
                                            value={formData.budgetId}
                                            onChange={handleChange}
                                            className={`w-full p-2 border rounded-md bg-white text-sm ${formData.estatus === 'Entregado' && !formData.budgetId ? 'border-red-300 ring-1 ring-red-200' : 'border-blue-200'}`}
                                        >
                                            <option value="">- {formData.estatus === 'Entregado' ? 'Seleccione un presupuesto' : 'No vincular presupuesto'} -</option>
                                            {availableBudgets.map(budget => (
                                                <option key={budget.id} value={budget.id}>
                                                    {budget.consecutiveNumber} - {budget.description || 'Sin descripción'} - {budget.prospectName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Monto del Proyecto (¢)</label>
                                    <input
                                        type="text"
                                        name="monto"
                                        value={isMontoFocused ? formData.monto : (formData.monto ? formatCurrencyValue(Number(formData.monto)) : '')}
                                        onChange={handleChange}
                                        onFocus={() => setIsMontoFocused(true)}
                                        onBlur={() => setIsMontoFocused(false)}
                                        required
                                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary outline-none bg-slate-50 font-mono text-right"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Col 2: Check List de Requisitos */}
                        <div className="space-y-6 flex flex-col h-full">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Check List de Requisitos
                            </h3>

                            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex-grow overflow-y-auto max-h-[500px]">
                                <div className="space-y-3">
                                    {checklist.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded shadow-sm border border-slate-100">
                                            <span className="text-sm font-bold uppercase text-slate-700 tracking-wide">{item.name}</span>
                                            <select
                                                value={item.status}
                                                onChange={(e) => handleStatusChange(index, e.target.value)}
                                                className={`text-xs font-bold py-1 px-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer transition-colors ${item.status === 'Listo' ? 'bg-green-100 text-green-700 border-green-200' :
                                                    item.status === 'Aplica' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        item.status === 'No aplica' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                                                            item.status === 'Pendiente' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                                'bg-white text-slate-400 border-slate-200'
                                                    }`}
                                            >
                                                <option value="">-</option>
                                                <option value="Aplica">Aplica</option>
                                                <option value="No aplica">No aplica</option>
                                                <option value="Pendiente">Pendiente</option>
                                                <option value="Listo">Listo</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
                                    <input
                                        type="text"
                                        value={newRequirement}
                                        onChange={e => setNewRequirement(e.target.value)}
                                        placeholder="AGREGAR OTRO REQUISITO..."
                                        className="flex-grow p-2 text-sm border border-slate-300 rounded uppercase outline-none focus:ring-2 focus:ring-primary"
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                                    />
                                    <button
                                        type="button"
                                        onClick={addRequirement}
                                        className="bg-primary text-white p-2 rounded hover:bg-primary-dark transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Col 3: Bitácora de Avance */}
                        <div className="space-y-6 flex flex-col h-full">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Bitácora de Control de Avance
                            </h3>

                            <div className="flex flex-col h-full">
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nueva Actualización / Comentario</label>
                                    <textarea
                                        value={newLogEntry}
                                        onChange={e => setNewLogEntry(e.target.value)}
                                        rows={4}
                                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none text-sm"
                                        placeholder="Escriba aquí los avances de la gestión..."
                                    ></textarea>
                                    <button
                                        type="button"
                                        onClick={addLogEntry}
                                        disabled={!newLogEntry.trim()}
                                        className="w-full mt-2 bg-slate-300 text-slate-700 font-bold py-2 rounded hover:bg-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <span>+ Registrar Avance</span>
                                    </button>
                                </div>

                                <div className="flex-grow overflow-y-auto max-h-[400px] border border-slate-200 rounded-lg bg-slate-50 p-4 space-y-4">
                                    {logs.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                            </svg>
                                            <p className="text-sm italic">No hay actualizaciones registradas.</p>
                                        </div>
                                    ) : (
                                        logs.map((log, index) => (
                                            <div key={index} className="bg-white p-3 rounded shadow-sm border-l-4 border-primary">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-slate-700">{log.user}</span>
                                                    <span className="text-[10px] text-slate-400">{new Date(log.date).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 leading-relaxed">{log.content}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t bg-slate-50 rounded-b-xl flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-white transition-colors">
                        Cancelar
                    </button>
                    <button type="button" onClick={handleSubmit} className="px-8 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark shadow-lg shadow-primary/30 transition-colors">
                        {initialData ? 'Guardar Cambios' : 'Crear Caso'}
                    </button>
                </div>
            </div>
        </div>
    );
};
