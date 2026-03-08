
import React, { useMemo } from 'react';
import { Project, Budget, ChangeOrder, PurchaseOrder, Offer, ChangeOrderStatus, POStatus } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

interface ProjectMaterialsModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    budgets: Budget[];
    changeOrders: ChangeOrder[];
    purchaseOrders: PurchaseOrder[];
    offers: Offer[];
}

type ConsolidatedMaterial = {
    name: string;
    unit: string;
    initialQty: number;
    changeQty: number;
    requiredQty: number;
    purchasedQty: number;
    remainingQty: number;
};

const formatNumber = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',');

export const ProjectMaterialsModal: React.FC<ProjectMaterialsModalProps> = ({ isOpen, onClose, project, budgets, changeOrders, purchaseOrders, offers }) => {
    
    const consolidatedData = useMemo((): ConsolidatedMaterial[] => {
        if (!project) return [];

        const offer = offers.find(o => o.id === project.offerId);
        if (!offer) return [];

        const initialBudget = budgets.find(b => b.id === offer.budgetId);

        const approvedCOs = changeOrders.filter(co => 
            co.offerId === offer.id && co.status === ChangeOrderStatus.Approved
        );

        const committedPOs = purchaseOrders.filter(po => 
            po.projectId === project.id &&
            [POStatus.Approved, POStatus.Issued, POStatus.PartiallyReceived, POStatus.FullyReceived].includes(po.status)
        );

        const initialMap = new Map<string, { unit: string, qty: number }>();
        if (initialBudget) {
            initialBudget.activities.forEach(act => act.subActivities.forEach(sub => {
                if (!sub.description || !sub.unit) return;
                // Normalizamos a Mayúsculas para evitar duplicados por case-sensitivity
                const normalizedName = sub.description.trim().toUpperCase();
                const normalizedUnit = sub.unit.trim().toUpperCase();
                const key = `${normalizedName}|${normalizedUnit}`;
                
                const existing = initialMap.get(key) || { unit: sub.unit, qty: 0 };
                existing.qty += Number(sub.quantity) || 0;
                initialMap.set(key, existing);
            }));
        }

        const changeMap = new Map<string, { unit: string, qty: number }>();
        approvedCOs.forEach(co => {
            const budget = budgets.find(b => b.id === co.budgetId);
            if (!budget) return;
            const multiplier = co.changeType === 'Crédito' ? -1 : 1;
            budget.activities.forEach(act => act.subActivities.forEach(sub => {
                if (!sub.description || !sub.unit) return;
                const normalizedName = sub.description.trim().toUpperCase();
                const normalizedUnit = sub.unit.trim().toUpperCase();
                const key = `${normalizedName}|${normalizedUnit}`;

                const existing = changeMap.get(key) || { unit: sub.unit, qty: 0 };
                existing.qty += (Number(sub.quantity) || 0) * multiplier;
                changeMap.set(key, existing);
            }));
        });

        const purchasedMap = new Map<string, { unit: string, qty: number }>();
        committedPOs.forEach(po => {
            po.items.forEach(item => {
                if (!item.name || !item.unit) return;
                const normalizedName = item.name.trim().toUpperCase();
                const normalizedUnit = item.unit.trim().toUpperCase();
                const key = `${normalizedName}|${normalizedUnit}`;

                const existing = purchasedMap.get(key) || { unit: item.unit, qty: 0 };
                existing.qty += Number(item.quantity) || 0;
                purchasedMap.set(key, existing);
            });
        });

        const allMaterialKeys = new Set([
            ...initialMap.keys(),
            ...changeMap.keys(),
            ...purchasedMap.keys()
        ]);
        
        const result: ConsolidatedMaterial[] = [];
        
        allMaterialKeys.forEach(key => {
            const [name, unit] = key.split('|');
            const initialQty = initialMap.get(key)?.qty || 0;
            const changeQty = changeMap.get(key)?.qty || 0;
            const purchasedQty = purchasedMap.get(key)?.qty || 0;
            
            const requiredQty = initialQty + changeQty;
            const remainingQty = requiredQty - purchasedQty;

            result.push({ 
                name, // El nombre ya viene normalizado en Mayúsculas desde las llaves
                unit, 
                initialQty, 
                changeQty, 
                requiredQty, 
                purchasedQty, 
                remainingQty 
            });
        });

        return result.sort((a, b) => a.name.localeCompare(b.name));
    }, [project, budgets, changeOrders, purchaseOrders, offers]);

    const handleDownloadPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        
        doc.setFontSize(16);
        doc.text(`Gestión de Materiales - ${project.name}`, 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);

        autoTable(doc, {
            startY: 40,
            head: [['Material', 'Unidad', 'Cant. Inicial', 'Cant. ODC', 'Cant. Requerida', 'Cant. Comprada', 'Cant. Pendiente']],
            body: consolidatedData.map(m => [
                m.name,
                m.unit,
                formatNumber(m.initialQty),
                formatNumber(m.changeQty),
                formatNumber(m.requiredQty),
                formatNumber(m.purchasedQty),
                formatNumber(m.remainingQty),
            ]),
            headStyles: { fillColor: [59, 130, 246] },
            theme: 'grid',
            columnStyles: {
                2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' },
            }
        });

        doc.save(`gestion_materiales_${project.id}.pdf`);
    };
    
    const handleDownloadCSV = () => {
        const csv = Papa.unparse(consolidatedData.map(m => ({
            'Material': m.name,
            'Unidad': m.unit,
            'Cant_Inicial': m.initialQty,
            'Cant_ODC': m.changeQty,
            'Cant_Requerida': m.requiredQty,
            'Cant_Comprada': m.purchasedQty,
            'Cant_Pendiente': m.remainingQty,
        })));
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `gestion_materiales_${project.id}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    if (!isOpen) return null;

    const getStatus = (remaining: number, required: number) => {
        if (required <= 0 && remaining <= 0) {
            return <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">No Requerido</span>;
        }
        if (remaining <= 0.009) { // Tolerancia para flotantes
            return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">Completo</span>;
        }
        if (remaining > 0 && remaining < required) {
            return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">Parcial</span>;
        }
        if (Math.abs(remaining - required) < 0.01) {
            return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">Pendiente</span>;
        }
        // Caso de sobre-compra
        if (remaining < 0) {
            return <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">Excedido</span>;
        }
        return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">Pendiente</span>;
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4" onClick={onClose} role="dialog">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-screen-xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-dark-gray">Gestión de Materiales y Presupuesto</h2>
                        <p className="text-sm text-slate-500">Proyecto: {project.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleDownloadCSV} className="text-sm bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                            Exportar CSV
                        </button>
                        <button onClick={handleDownloadPDF} className="text-sm bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                            Exportar PDF
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto border-t border-b py-4">
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-slate-100 sticky top-0">
                            <tr>
                                <th className="py-2 px-3 text-left font-semibold text-slate-600 w-2/6">Material</th>
                                <th className="py-2 px-3 text-left font-semibold text-slate-600">Unidad</th>
                                <th className="py-2 px-3 text-right font-semibold text-slate-600">Cant. Inicial</th>
                                <th className="py-2 px-3 text-right font-semibold text-slate-600">Cant. ODC</th>
                                <th className="py-2 px-3 text-right font-bold text-blue-800 bg-blue-100">Cant. Requerida</th>
                                <th className="py-2 px-3 text-right font-bold text-orange-800 bg-orange-100">Cant. Comprada</th>
                                <th className="py-2 px-3 text-right font-bold text-red-800 bg-red-100">Cant. Pendiente</th>
                                <th className="py-2 px-3 text-center font-semibold text-slate-600">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                           {consolidatedData.map((item, index) => (
                               <tr key={index} className="hover:bg-slate-50 transition-colors">
                                   <td className="py-2 px-3 font-medium text-slate-800 uppercase tracking-tight">{item.name}</td>
                                   <td className="py-2 px-3 text-slate-600 uppercase text-xs">{item.unit}</td>
                                   <td className="py-2 px-3 text-right font-mono text-slate-600">{formatNumber(item.initialQty)}</td>
                                   <td className={`py-2 px-3 text-right font-mono font-medium ${item.changeQty < 0 ? 'text-red-600' : 'text-green-600'}`}>{item.changeQty >= 0 ? '+' : ''}{formatNumber(item.changeQty)}</td>
                                   <td className="py-2 px-3 text-right font-mono font-bold text-blue-800 bg-blue-50/50">{formatNumber(item.requiredQty)}</td>
                                   <td className="py-2 px-3 text-right font-mono font-bold text-orange-800 bg-orange-50/50">{formatNumber(item.purchasedQty)}</td>
                                   <td className={`py-2 px-3 text-right font-mono font-bold bg-red-50/50 ${item.remainingQty > 0 ? 'text-red-800' : 'text-green-700'}`}>
                                       {formatNumber(item.remainingQty)}
                                   </td>
                                   <td className="py-2 px-3 text-center">{getStatus(item.remainingQty, item.requiredQty)}</td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                     {consolidatedData.length === 0 && (
                        <p className="text-center py-10 text-slate-500">No hay datos de materiales para este proyecto.</p>
                     )}
                </div>
                <div className="flex-shrink-0 pt-4 flex justify-end">
                    <button onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">Cerrar</button>
                </div>
            </div>
        </div>
    );
};
