import React, { useMemo } from 'react';
import { Budget } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MaterialListModalProps {
    isOpen: boolean;
    onClose: () => void;
    budget: Budget | null;
}

type ConsolidatedMaterial = {
    description: string;
    unit: string;
    quantity: number;
    totalCost: number;
    averageUnitCost: number;
};

export const MaterialListModal: React.FC<MaterialListModalProps> = ({ isOpen, onClose, budget }) => {
    
    const consolidatedMaterials = useMemo((): ConsolidatedMaterial[] => {
        if (!budget) return [];

        const materialsMap = new Map<string, { description: string; unit: string; quantity: number; totalCost: number }>();

        budget.activities.forEach(activity => {
            activity.subActivities.forEach(sub => {
                const cost = (Number(sub.materialUnitCost) || 0) + (Number(sub.laborUnitCost) || 0) + (Number(sub.subcontractUnitCost) || 0);
                const totalCost = (Number(sub.quantity) || 0) * cost;
                
                if (!sub.description) return;

                const key = `${sub.description.trim()}|${sub.unit.trim()}`;

                if (materialsMap.has(key)) {
                    const existing = materialsMap.get(key)!;
                    existing.quantity += Number(sub.quantity) || 0;
                    existing.totalCost += totalCost;
                } else {
                    materialsMap.set(key, {
                        description: sub.description,
                        unit: sub.unit,
                        quantity: Number(sub.quantity) || 0,
                        totalCost: totalCost,
                    });
                }
            });
        });

        const list: ConsolidatedMaterial[] = [];
        materialsMap.forEach(item => {
            list.push({
                ...item,
                averageUnitCost: item.quantity > 0 ? item.totalCost / item.quantity : 0,
            });
        });
        
        return list.sort((a, b) => a.description.localeCompare(b.description));

    }, [budget]);

    const handleDownloadPDF = () => {
        if (!budget) return;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(`Lista Consolidada de Materiales`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Presupuesto: ${budget.consecutiveNumber} - ${budget.prospectName}`, 14, 30);
        doc.text(`Fecha de Generación: ${new Date().toLocaleDateString()}`, 14, 36);

        autoTable(doc, {
            startY: 45,
            head: [['Descripción', 'Unidad', 'Cantidad Total', 'Costo Unit. Promedio', 'Costo Total Estimado']],
            body: consolidatedMaterials.map(m => [
                m.description,
                m.unit,
                m.quantity.toFixed(2),
                `¢${m.averageUnitCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}`,
                `¢${m.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}`
            ]),
            headStyles: { fillColor: [59, 130, 246] },
            theme: 'grid',
            columnStyles: {
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' },
            }
        });

        doc.save(`materiales_${budget.consecutiveNumber}.pdf`);
    };
    
    const handleDownloadCSV = () => {
        if (!budget) return;
        
        const headers = ['Descripción', 'Unidad', 'Cantidad Total', 'Costo Unitario Promedio', 'Costo Total Estimado'];
        const rows = consolidatedMaterials.map(m => [
            `"${m.description.replace(/"/g, '""')}"`,
            m.unit,
            m.quantity.toFixed(2),
            m.averageUnitCost.toFixed(2),
            m.totalCost.toFixed(2)
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...rows.map(r => r.join(','))].join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `materiales_${budget.consecutiveNumber}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    if (!isOpen || !budget) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-5xl transform transition-all h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-dark-gray">Lista Consolidada de Materiales Estimados</h2>
                        <p className="text-sm text-slate-500">Presupuesto: {budget.consecutiveNumber}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto border-t border-b py-4 -mx-6 px-6">
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-slate-100 sticky top-0">
                            <tr>
                                <th className="py-2 px-3 text-left font-medium text-slate-600">Descripción del Material</th>
                                <th className="py-2 px-3 text-left font-medium text-slate-600">Unidad</th>
                                <th className="py-2 px-3 text-right font-medium text-slate-600">Cantidad Total</th>
                                <th className="py-2 px-3 text-right font-medium text-slate-600">Costo Unitario Promedio</th>
                                <th className="py-2 px-3 text-right font-medium text-slate-600">Costo Total Estimado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                           {consolidatedMaterials.length > 0 ? consolidatedMaterials.map((material, index) => (
                               <tr key={index}>
                                   <td className="py-2 px-3 font-medium text-slate-800">{material.description}</td>
                                   <td className="py-2 px-3 text-slate-600">{material.unit}</td>
                                   <td className="py-2 px-3 text-right text-slate-600">{material.quantity.toLocaleString('en-US', { minimumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}</td>
                                   <td className="py-2 px-3 text-right font-mono text-slate-600">¢{material.averageUnitCost.toLocaleString('en-US', { minimumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}</td>
                                   <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">¢{material.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}</td>
                               </tr>
                           )) : (
                               <tr>
                                   <td colSpan={5} className="py-10 text-center text-slate-500">Este presupuesto no contiene materiales en sus actividades.</td>
                               </tr>
                           )}
                        </tbody>
                    </table>
                </div>

                <div className="flex-shrink-0 pt-4 mt-4 flex justify-between items-center">
                    <button onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">
                        Cerrar
                    </button>
                    <div className="flex gap-4">
                        <button onClick={handleDownloadCSV} disabled={consolidatedMaterials.length === 0} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-slate-400">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                           Descargar CSV
                        </button>
                        <button onClick={handleDownloadPDF} disabled={consolidatedMaterials.length === 0} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:bg-slate-400">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                           Descargar PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};