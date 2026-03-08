
import React, { useState } from 'react';
import { Budget, CompanyInfo } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { formatNumber, formatQuantity } from '../../utils/format';

interface ExportBudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    budget: Budget;
    companyInfo: CompanyInfo;
}

export const ExportBudgetModal: React.FC<ExportBudgetModalProps> = ({ isOpen, onClose, budget, companyInfo }) => {
    const [format, setFormat] = useState<'PDF' | 'EXCEL'>('PDF');
    const [detailLevel, setDetailLevel] = useState<'FULL' | 'CHAPTERS'>('FULL');

    if (!isOpen) return null;

    const formatCurrencyValue = (value: number) => {
        return formatNumber(value, 2, 2);
    };

    const formatQuantityPDF = (value: number) => {
        return formatQuantity(value);
    };

    const currencySymbol = budget.currency === 'CRC' ? '¢' : '$';

    const generatePDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Presupuesto de Obra', pageWidth / 2, 15, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(companyInfo.name, 14, 25);
        doc.text(`ID: ${budget.consecutiveNumber}`, 14, 30);
        doc.text(`Cliente: ${budget.prospectName}`, 14, 35);
        doc.text(`Fecha: ${new Date(budget.date).toLocaleDateString()}`, pageWidth - 14, 32, { align: 'right' });

        // Logo
        if (companyInfo.logoBase64) {
            try {
                // Infer type for safety (usually PNG/JPEG base64 starts as data:image/...)
                const imgFormat = companyInfo.logoBase64.match(/^data:image\/(png|jpeg|jpg);base64,/i)?.[1]?.toUpperCase() || 'PNG';

                const imgProps = doc.getImageProperties(companyInfo.logoBase64);
                const ratio = imgProps.width / imgProps.height;

                let targetHeight = 16;
                let targetWidth = targetHeight * ratio;
                const maxWidth = 50;

                if (targetWidth > maxWidth) {
                    targetWidth = maxWidth;
                    targetHeight = targetWidth / ratio;
                }

                // Align to the right margin
                const xPos = pageWidth - 14 - targetWidth;

                doc.addImage(companyInfo.logoBase64, imgFormat, xPos, 10, targetWidth, targetHeight);
            } catch (error) {
                console.error("Error adding logo matching", error);
            }
        }

        if (budget.description) {
            doc.text(`Descripción: ${budget.description}`, 14, 42, { maxWidth: pageWidth - 28 });
        }

        const tableBody: any[] = [];

        budget.activities.forEach(act => {
            const actTotal = act.subActivities.reduce((sum, sub) => {
                const cost = (Number(sub.materialUnitCost) || 0) + (Number(sub.laborUnitCost) || 0) + (Number(sub.subcontractUnitCost) || 0);
                return sum + ((Number(sub.quantity) || 0) * cost);
            }, 0);

            const chapterQty = Number(act.quantity) || 1;
            const chapterUnitCost = actTotal / chapterQty;

            // Chapter Header Row
            tableBody.push([
                { content: act.itemNumber, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: act.description.toUpperCase(), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: act.unit, styles: { fontStyle: 'bold', halign: 'center', fillColor: [240, 240, 240] } },
                { content: formatQuantityPDF(chapterQty), styles: { fontStyle: 'bold', halign: 'center', fillColor: [240, 240, 240] } },
                { content: `${currencySymbol}${formatCurrencyValue(chapterUnitCost)}`, styles: { fontStyle: 'bold', halign: 'right', fillColor: [240, 240, 240] } },
                { content: `${currencySymbol}${formatCurrencyValue(actTotal)}`, styles: { fontStyle: 'bold', halign: 'right', fillColor: [240, 240, 240] } }
            ]);

            // Item Detail Rows if level is FULL
            if (detailLevel === 'FULL') {
                act.subActivities.forEach(sub => {
                    const itemUnitCost = (Number(sub.materialUnitCost) || 0) + (Number(sub.laborUnitCost) || 0) + (Number(sub.subcontractUnitCost) || 0);
                    const itemTotal = (Number(sub.quantity) || 0) * itemUnitCost;

                    tableBody.push([
                        sub.itemNumber,
                        `   ${sub.description}`,
                        sub.unit,
                        formatQuantityPDF(Number(sub.quantity) || 0),
                        `${currencySymbol}${formatCurrencyValue(itemUnitCost)}`,
                        `${currencySymbol}${formatCurrencyValue(itemTotal)}`
                    ]);
                });
            }
        });

        autoTable(doc, {
            startY: budget.description ? 50 : 45,
            head: [['Ítem', 'Descripción', 'Unid.', 'Cant.', 'Precio Unit.', 'Total']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246], halign: 'center' },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 15 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 15, halign: 'center' },
                3: { cellWidth: 15, halign: 'center' },
                4: { cellWidth: 32, halign: 'right' },
                5: { cellWidth: 38, halign: 'right' },
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY || 150;

        // Final Summary Block
        const startX = pageWidth - 80;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50, 50, 50);
        doc.text('Subtotal Neto:', startX, finalY + 10);
        doc.text(`${currencySymbol}${formatCurrencyValue(budget.total)}`, pageWidth - 14, finalY + 10, { align: 'right' });

        doc.text(`Impuestos (${budget.taxRate}%):`, startX, finalY + 16);
        doc.text(`${currencySymbol}${formatCurrencyValue(budget.finalTotal - budget.total)}`, pageWidth - 14, finalY + 16, { align: 'right' });

        doc.setFontSize(12);
        doc.setTextColor(249, 115, 22); // secondary color
        doc.text('TOTAL FINAL:', startX, finalY + 24);
        doc.text(`${currencySymbol}${formatCurrencyValue(budget.finalTotal)}`, pageWidth - 14, finalY + 24, { align: 'right' });

        doc.save(`presupuesto_${budget.consecutiveNumber}.pdf`);
    };

    const generateExcel = () => {
        const rows: any[] = [];
        const headers = ['Ítem', 'Descripción', 'Unidad', 'Cantidad', 'Precio Unitario', 'Total'];

        budget.activities.forEach(act => {
            const actTotal = act.subActivities.reduce((sum, sub) => {
                const cost = (Number(sub.materialUnitCost) || 0) + (Number(sub.laborUnitCost) || 0) + (Number(sub.subcontractUnitCost) || 0);
                return sum + ((Number(sub.quantity) || 0) * cost);
            }, 0);

            const chapterQty = Number(act.quantity) || 1;
            const chapterUnitCost = actTotal / chapterQty;

            rows.push({
                Ítem: act.itemNumber,
                Descripción: act.description.toUpperCase(),
                Unidad: act.unit,
                Cantidad: chapterQty,
                'Precio Unitario': chapterUnitCost,
                Total: actTotal
            });

            if (detailLevel === 'FULL') {
                act.subActivities.forEach(sub => {
                    const itemUnitCost = (Number(sub.materialUnitCost) || 0) + (Number(sub.laborUnitCost) || 0) + (Number(sub.subcontractUnitCost) || 0);
                    const itemTotal = (Number(sub.quantity) || 0) * itemUnitCost;

                    rows.push({
                        Ítem: sub.itemNumber,
                        Descripción: sub.description,
                        Unidad: sub.unit,
                        Cantidad: Number(sub.quantity),
                        'Precio Unitario': itemUnitCost,
                        Total: itemTotal
                    });
                });
            }
        });

        // Add empty row
        rows.push({});
        rows.push({ Descripción: 'SUBTOTAL NETO', Total: budget.total });
        rows.push({ Descripción: `IMPUESTOS (${budget.taxRate}%)`, Total: budget.finalTotal - budget.total });
        rows.push({ Descripción: 'TOTAL GENERAL', Total: budget.finalTotal });

        const csv = Papa.unparse(rows);
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `presupuesto_${budget.consecutiveNumber}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = () => {
        if (format === 'PDF') {
            generatePDF();
        } else {
            generateExcel();
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-dark-gray">Opciones de Exportación</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Formato de Archivo</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setFormat('PDF')}
                                className={`py-3 px-4 rounded-lg border-2 font-bold flex flex-col items-center gap-2 transition-all ${format === 'PDF' ? 'border-primary bg-blue-50 text-primary' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                PDF
                            </button>
                            <button
                                onClick={() => setFormat('EXCEL')}
                                className={`py-3 px-4 rounded-lg border-2 font-bold flex flex-col items-center gap-2 transition-all ${format === 'EXCEL' ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Excel / CSV
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Nivel de Detalle</label>
                        <div className="space-y-3">
                            <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${detailLevel === 'FULL' ? 'border-primary bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                                <input type="radio" checked={detailLevel === 'FULL'} onChange={() => setDetailLevel('FULL')} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" />
                                <div className="ml-3">
                                    <span className="block text-sm font-bold text-slate-700">Desglose Completo</span>
                                    <span className="block text-xs text-slate-500">Incluye capítulos y todos los insumos detallados.</span>
                                </div>
                            </label>
                            <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${detailLevel === 'CHAPTERS' ? 'border-primary bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                                <input type="radio" checked={detailLevel === 'CHAPTERS'} onChange={() => setDetailLevel('CHAPTERS')} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" />
                                <div className="ml-3">
                                    <span className="block text-sm font-bold text-slate-700">Solo Capítulos</span>
                                    <span className="block text-xs text-slate-500">Resume el presupuesto mostrando solo los encabezados principales.</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors uppercase text-xs tracking-widest"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleExport}
                            className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 uppercase text-xs tracking-widest"
                        >
                            Generar Archivo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
