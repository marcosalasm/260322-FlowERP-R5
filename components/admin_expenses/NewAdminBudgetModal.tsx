import React, { useState, useEffect, useMemo } from 'react';
import { AdministrativeBudget, AdministrativeBudgetCategory, AdministrativeBudgetSourceCategory } from '../../types';

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const PREDEFINED_CATEGORIES = [
    'Software y Licencias', 'Nómina Operativa', 'Infraestructura y Oficina',
    'Seguros y Obligaciones', 'Financieros', 'Marketing y Ventas',
    'Recursos Humanos', 'Flota Vehicular', 'Equipamiento',
];

type Frequency = 'Pago Único' | 'Mensual' | 'Trimestral' | 'Anual';

interface BudgetItem {
    id: number;
    description: string;
    amount: number | string;
    frequency: Frequency;
    month: number; // 0-11, for 'Pago Único'
    notes: string;
}

interface BudgetCategory {
    id: number;
    name: string;
    isCustom: boolean;
    items: BudgetItem[];
}

interface NewAdminBudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newBudget: Omit<AdministrativeBudget, 'id'>) => void;
    year: number;
}

const getNextId = (items: { id: number }[]) => (items.length > 0 ? Math.max(...items.map(i => i.id)) : 0) + 1;

export const NewAdminBudgetModal: React.FC<NewAdminBudgetModalProps> = ({ isOpen, onClose, onSubmit, year }) => {
    const [name, setName] = useState(`Presupuesto Operativo ${year}`);
    const [status, setStatus] = useState<'Borrador' | 'En Revisión' | 'Aprobado'>('Borrador');
    const [categories, setCategories] = useState<BudgetCategory[]>([]);
    const [customCategoryName, setCustomCategoryName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(`Presupuesto Operativo ${year}`);
            setStatus('Borrador');
            setCategories(PREDEFINED_CATEGORIES.map((catName, index) => ({
                id: index + 1,
                name: catName,
                isCustom: false,
                items: [],
            })));
        }
    }, [isOpen, year]);

    const calculations = useMemo(() => {
        const categoryTotals: { [key: number]: number } = {};
        let grandTotal = 0;
        categories.forEach(cat => {
            const catTotal = cat.items.reduce((total, item) => {
                const amount = Number(item.amount) || 0;
                let annualAmount = 0;
                switch (item.frequency) {
                    case 'Pago Único': annualAmount = amount; break;
                    case 'Mensual': annualAmount = amount * 12; break;
                    case 'Trimestral': annualAmount = amount * 4; break;
                    case 'Anual': annualAmount = amount; break;
                }
                return total + annualAmount;
            }, 0);
            categoryTotals[cat.id] = catTotal;
            grandTotal += catTotal;
        });
        return { categoryTotals, grandTotal };
    }, [categories]);

    const handleAddItem = (categoryId: number) => {
        setCategories(prev => prev.map(cat => cat.id === categoryId
            ? { ...cat, items: [...cat.items, { id: getNextId(cat.items), description: '', amount: '', frequency: 'Mensual', month: 0, notes: '' }] }
            : cat
        ));
    };

    const handleRemoveItem = (categoryId: number, itemId: number) => {
        setCategories(prev => prev.map(cat => cat.id === categoryId
            ? { ...cat, items: cat.items.filter(item => item.id !== itemId) }
            : cat
        ));
    };

    const handleItemChange = (categoryId: number, itemId: number, field: keyof BudgetItem, value: any) => {
        setCategories(prev => prev.map(cat => cat.id === categoryId
            ? { ...cat, items: cat.items.map(item => item.id === itemId ? { ...item, [field]: value } : item) }
            : cat
        ));
    };

    const handleAddCustomCategory = () => {
        if (!customCategoryName.trim()) return;
        setCategories(prev => [...prev, {
            id: getNextId(prev),
            name: customCategoryName,
            isCustom: true,
            items: [],
        }]);
        setCustomCategoryName('');
    };

    const handleSubmit = () => {
        const finalCategories: AdministrativeBudgetCategory[] = categories.map(cat => {
            const monthlyAmounts = Array(12).fill(0);
            let annualBudget = 0;
            cat.items.forEach(item => {
                const amount = Number(item.amount) || 0;
                switch (item.frequency) {
                    case 'Pago Único':
                        monthlyAmounts[item.month] += amount;
                        break;
                    case 'Mensual':
                        for (let i = 0; i < 12; i++) monthlyAmounts[i] += amount;
                        break;
                    case 'Trimestral':
                        for (let i = 0; i < 12; i += 3) monthlyAmounts[i] += amount;
                        break;
                    case 'Anual':
                        monthlyAmounts[0] += amount; // Assume January for annual payments
                        break;
                }
            });
            annualBudget = monthlyAmounts.reduce((sum, val) => sum + val, 0);
            return {
                id: cat.id,
                name: cat.name,
                monthlyAmounts,
                annualBudget,
            };
        });

        const finalSourceCategories: AdministrativeBudgetSourceCategory[] = categories.map(cat => ({
            ...cat,
            items: cat.items.map(item => ({
                ...item,
                amount: Number(item.amount) || 0
            }))
        }));

        const newBudget: Omit<AdministrativeBudget, 'id'> = {
            year,
            name,
            status,
            categories: finalCategories,
            sourceCategories: finalSourceCategories,
        };
        onSubmit(newBudget);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-7xl h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0">
                    <h2 className="text-2xl font-bold text-dark-gray">Crear Presupuesto Operativo Anual</h2>
                </div>

                <form onSubmit={e => e.preventDefault()} className="flex-grow flex flex-col overflow-hidden space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Nombre del Presupuesto</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Año Fiscal</label>
                            <input type="number" value={year} readOnly className="w-full p-2 border rounded-md bg-slate-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Estado</label>
                            <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full p-2 border rounded-md">
                                <option>Borrador</option>
                                <option>En Revisión</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto -mr-3 pr-3 border-t pt-4 space-y-4">
                        {categories.map(cat => (
                            <details key={cat.id} open className="bg-slate-50 p-3 rounded-lg border">
                                <summary className="font-semibold text-lg text-primary cursor-pointer flex justify-between">
                                    {cat.name}
                                    <span className="font-mono font-bold">Total: ¢{calculations.categoryTotals[cat.id]?.toLocaleString('en-US').replace(/,/g, '\u202F').replace(/\./g, ',')}</span>
                                </summary>
                                <div className="mt-2 space-y-2">
                                    {cat.items.map((item, index) => (
                                        <div key={item.id} className="grid grid-cols-[3fr,1.5fr,1.5fr,1.5fr,1fr,auto] gap-2 items-center text-sm">
                                            <input type="text" placeholder="Descripción del Gasto" value={item.description} onChange={e => handleItemChange(cat.id, item.id, 'description', e.target.value)} className="p-1 border rounded-md" />
                                            <input type="number" placeholder="Monto" value={item.amount} onChange={e => handleItemChange(cat.id, item.id, 'amount', e.target.value)} className="p-1 border rounded-md" />
                                            <select value={item.frequency} onChange={e => handleItemChange(cat.id, item.id, 'frequency', e.target.value)} className="p-1 border rounded-md">
                                                <option>Pago Único</option><option>Mensual</option><option>Trimestral</option><option>Anual</option>
                                            </select>
                                            {item.frequency === 'Pago Único' && (
                                                <select value={item.month} onChange={e => handleItemChange(cat.id, item.id, 'month', Number(e.target.value))} className="p-1 border rounded-md animate-fade-in">
                                                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                                </select>
                                            )}
                                            {item.frequency !== 'Pago Único' && <div />}
                                            <input type="text" placeholder="Notas" value={item.notes} onChange={e => handleItemChange(cat.id, item.id, 'notes', e.target.value)} className="p-1 border rounded-md" />
                                            <button onClick={() => handleRemoveItem(cat.id, item.id)} className="text-red-500 hover:text-red-700 p-1">&times;</button>
                                        </div>
                                    ))}
                                    <button onClick={() => handleAddItem(cat.id)} className="text-xs font-semibold text-primary hover:underline mt-2">+ Agregar Gasto</button>
                                </div>
                            </details>
                        ))}
                        <div className="flex gap-2 mt-4">
                            <input type="text" value={customCategoryName} onChange={e => setCustomCategoryName(e.target.value)} placeholder="Nombre de nueva categoría" className="flex-grow p-2 border rounded-md" />
                            <button onClick={handleAddCustomCategory} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300">Añadir Categoría</button>
                        </div>
                    </div>
                    <div className="flex-shrink-0 pt-4 mt-4 border-t flex justify-between items-center">
                        <div>
                            <span className="text-lg font-bold text-dark-gray">Total General del Presupuesto:</span>
                            <span className="text-2xl font-bold text-secondary font-mono ml-2">¢{calculations.grandTotal.toLocaleString('en-US').replace(/,/g, '\u202F').replace(/\./g, ',')}</span>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                            <button onClick={handleSubmit} className="bg-primary text-white font-bold py-2 px-6 rounded-lg">Guardar Presupuesto</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};