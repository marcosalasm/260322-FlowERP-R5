import React, { useState, useEffect, useCallback } from 'react';
import { Project, Supplier } from '../../types';

export interface FilterState {
    projectId?: string;
    supplierId?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number | string;
    maxAmount?: number | string;
    startDueDate?: string;
    endDueDate?: string;
}

interface FilterBarProps {
    projects: Project[];
    suppliers: Supplier[];
    onFilterChange: (filters: FilterState) => void;
    config: {
        showProject?: boolean;
        showSupplier?: boolean;
        showDateRange?: boolean;
        showAmountRange?: boolean;
        showDueDateRange?: boolean;
    };
}

export const FilterBar: React.FC<FilterBarProps> = ({ projects, suppliers, onFilterChange, config }) => {
    const [filters, setFilters] = useState<FilterState>({});

    useEffect(() => {
        onFilterChange(filters);
    }, [filters, onFilterChange]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleReset = () => {
        setFilters({});
    };

    return (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {config.showProject && (
                    <div>
                        <label className="text-sm font-medium text-slate-600">Proyecto</label>
                        <select name="projectId" value={filters.projectId || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md mt-1 text-sm">
                            <option value="">Todos los Proyectos</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                )}
                {config.showSupplier && (
                    <div>
                        <label className="text-sm font-medium text-slate-600">Proveedor</label>
                        <select name="supplierId" value={filters.supplierId || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md mt-1 text-sm">
                             <option value="">Todos los Proveedores</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                )}
                {config.showDateRange && (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-sm font-medium text-slate-600">Fecha Desde</label>
                            <input type="date" name="startDate" value={filters.startDate || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md mt-1 text-sm" />
                        </div>
                         <div>
                            <label className="text-sm font-medium text-slate-600">Fecha Hasta</label>
                            <input type="date" name="endDate" value={filters.endDate || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md mt-1 text-sm" />
                        </div>
                    </div>
                )}
                 {config.showAmountRange && (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-sm font-medium text-slate-600">Monto Mín.</label>
                            <input type="number" name="minAmount" value={filters.minAmount || ''} onChange={handleChange} placeholder="Ej: 1000" className="w-full p-2 border border-slate-300 rounded-md mt-1 text-sm" />
                        </div>
                         <div>
                            <label className="text-sm font-medium text-slate-600">Monto Máx.</label>
                            <input type="number" name="maxAmount" value={filters.maxAmount || ''} onChange={handleChange} placeholder="Ej: 50000" className="w-full p-2 border border-slate-300 rounded-md mt-1 text-sm" />
                        </div>
                    </div>
                )}
                {config.showDueDateRange && (
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-sm font-medium text-slate-600">Vencim. Desde</label>
                            <input type="date" name="startDueDate" value={filters.startDueDate || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md mt-1 text-sm" />
                        </div>
                         <div>
                            <label className="text-sm font-medium text-slate-600">Vencim. Hasta</label>
                            <input type="date" name="endDueDate" value={filters.endDueDate || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md mt-1 text-sm" />
                        </div>
                    </div>
                )}
                <div className="flex items-end">
                    <button onClick={handleReset} className="w-full bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">
                        Limpiar Filtros
                    </button>
                </div>
            </div>
        </div>
    );
};
