import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { Material, InventoryAdjustmentLog, AdjustmentType } from '../../types';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

export const InventoryAdjustments: React.FC = () => {
    const appContext = useContext(AppContext);
    const { showToast } = useToast();
    if (!appContext || !appContext.materials || !appContext.setMaterials || !appContext.inventoryAdjustmentLogs || !appContext.setInventoryAdjustmentLogs) {
        return <p>Cargando datos de inventario...</p>;
    }

    const { materials, setMaterials, inventoryAdjustmentLogs, setInventoryAdjustmentLogs, user } = appContext;

    // Form state
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
    const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('Entrada');
    const [quantity, setQuantity] = useState<number | string>('');
    const [justification, setJustification] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter state
    const [materialFilter, setMaterialFilter] = useState('');

    const selectedMaterial = useMemo(() => {
        return materials.find(m => m.id === Number(selectedMaterialId)) || null;
    }, [selectedMaterialId, materials]);

    const filteredLogs = useMemo(() => {
        return (inventoryAdjustmentLogs || [])
            .filter(log => {
                if (!materialFilter) return true;
                return log.materialId === Number(materialFilter);
            })
            .sort((a, b) => new Date(b.adjustmentDate).getTime() - new Date(a.adjustmentDate).getTime());
    }, [inventoryAdjustmentLogs, materialFilter]);

    const resetForm = () => {
        setSelectedMaterialId('');
        setAdjustmentType('Entrada');
        setQuantity('');
        setJustification('');
    };

    const handleAdjust = () => {
        if (!selectedMaterial || !quantity || !justification.trim()) {
            showToast('Por favor, complete todos los campos.', 'error');
            return;
        }

        const adjustmentQty = Number(quantity);
        if (adjustmentQty <= 0) {
            showToast('La cantidad a ajustar debe ser mayor que cero.', 'error');
            return;
        }

        const quantityBefore = selectedMaterial.quantity;
        let quantityAfter = quantityBefore;

        if (adjustmentType === 'Salida') {
            if (quantityBefore < adjustmentQty) {
                showToast('No se puede ajustar la salida. La cantidad excede el stock actual.', 'error');
                return;
            }
            quantityAfter = quantityBefore - adjustmentQty;
        } else {
            quantityAfter = quantityBefore + adjustmentQty;
        }

        setIsSubmitting(true);

        // Update material stock
        setMaterials(prev => prev.map(m => m.id === selectedMaterial.id ? { ...m, quantity: quantityAfter } : m));

        // Create log entry
        const nextLogId = (inventoryAdjustmentLogs.length > 0 ? Math.max(...inventoryAdjustmentLogs.map(l => l.id)) : 0) + 1;
        const newLog: InventoryAdjustmentLog = {
            id: nextLogId,
            materialId: selectedMaterial.id,
            materialName: selectedMaterial.name,
            adjustmentDate: new Date().toISOString(),
            user: user.name,
            adjustmentType,
            quantityAdjusted: adjustmentQty,
            quantityBefore,
            quantityAfter,
            justification,
        };
        setInventoryAdjustmentLogs(prev => [newLog, ...prev]);

        showToast('Ajuste de inventario realizado con éxito.', 'success');
        resetForm();
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-6">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="text-lg font-semibold text-dark-gray mb-3">Realizar Ajuste Manual</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">Material</label>
                        <select value={selectedMaterialId} onChange={e => setSelectedMaterialId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md mt-1">
                            <option value="">Seleccione un material...</option>
                            {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Cantidad Actual</label>
                        <p className="w-full p-2 border border-slate-200 bg-slate-100 rounded-md mt-1 font-bold">{selectedMaterial ? selectedMaterial.quantity.toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Tipo de Ajuste</label>
                        <select value={adjustmentType} onChange={e => setAdjustmentType(e.target.value as AdjustmentType)} className="w-full p-2 border border-slate-300 rounded-md mt-1">
                            <option value="Entrada">Entrada / Aumento</option>
                            <option value="Salida">Salida / Disminución</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Cantidad a Ajustar</label>
                        <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" className="w-full p-2 border border-slate-300 rounded-md mt-1" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mt-4">
                    <div className="md:col-span-4">
                        <label className="block text-sm font-medium text-slate-700">Justificación (Obligatorio)</label>
                        <input type="text" value={justification} onChange={e => setJustification(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md mt-1" />
                    </div>
                    <button onClick={handleAdjust} disabled={isSubmitting} className="w-full bg-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-slate-400">
                        {isSubmitting ? 'Ajustando...' : 'Realizar Ajuste'}
                    </button>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-dark-gray mb-3">Bitácora de Ajustes de Inventario</h3>
                <div className="mb-4">
                    <label className="text-sm font-medium text-slate-700">Filtrar por material:</label>
                    <select value={materialFilter} onChange={e => setMaterialFilter(e.target.value)} className="p-2 border border-slate-300 rounded-md mt-1 ml-2">
                        <option value="">Todos los materiales</option>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-2 text-left font-medium text-slate-600">Fecha</th>
                                <th className="p-2 text-left font-medium text-slate-600">Material</th>
                                <th className="p-2 text-left font-medium text-slate-600">Usuario</th>
                                <th className="p-2 text-left font-medium text-slate-600">Documento</th>
                                <th className="p-2 text-center font-medium text-slate-600">Tipo</th>
                                <th className="p-2 text-right font-medium text-slate-600">Cant. Anterior</th>
                                <th className="p-2 text-right font-medium text-slate-600">Cant. Ajustada</th>
                                <th className="p-2 text-right font-medium text-slate-600">Cant. Final</th>
                                <th className="p-2 text-left font-medium text-slate-600">Justificación</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredLogs.map(log => (
                                <tr key={log.id}>
                                    <td className="p-2 text-slate-500 whitespace-nowrap">{format(new Date(log.adjustmentDate), 'dd/MM/yy HH:mm', { locale: es })}</td>
                                    <td className="p-2 font-medium text-slate-800">{log.materialName}</td>
                                    <td className="p-2 text-slate-600">{log.user}</td>
                                    <td className="p-2 text-slate-600">{log.relatedDocument || 'Manual'}</td>
                                    <td className="p-2 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${log.adjustmentType === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {log.adjustmentType}
                                        </span>
                                    </td>
                                    <td className="p-2 text-right font-mono text-slate-500">{log.quantityBefore.toLocaleString()}</td>
                                    <td className={`p-2 text-right font-mono font-bold ${log.adjustmentType === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                        {log.adjustmentType === 'Entrada' ? '+' : '-'}{log.quantityAdjusted.toLocaleString()}
                                    </td>
                                    <td className="p-2 text-right font-mono font-bold text-slate-800">{log.quantityAfter.toLocaleString()}</td>
                                    <td className="p-2 text-slate-600 max-w-xs truncate" title={log.justification}>{log.justification}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredLogs.length === 0 && <p className="text-center p-6 text-slate-500">No hay registros de ajuste para mostrar.</p>}
                </div>
            </div>
        </div>
    );
};
