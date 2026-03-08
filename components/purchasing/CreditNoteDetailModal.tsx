import React, { useState, useEffect, useContext, useRef } from 'react';
import { CreditNote, CreditNoteItem, CreditNoteStatus } from '../../types';
import { AppContext } from '../../context/AppContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';

interface CreditNoteDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    creditNote: CreditNote | null;
    onSubmit: (updatedNote: CreditNote) => void;
}

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});


export const CreditNoteDetailModal: React.FC<CreditNoteDetailModalProps> = ({ isOpen, onClose, creditNote, onSubmit }) => {
    const appContext = useContext(AppContext);
    const { showToast } = useToast();
    const { can } = usePermissions();
    const [editableNote, setEditableNote] = useState<CreditNote | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (creditNote) {
            setEditableNote(JSON.parse(JSON.stringify(creditNote)));
        }
    }, [creditNote, isOpen]);

    const handleItemChange = (itemId: number, field: 'quantityToCredit' | 'creditAmount', value: string) => {
        setEditableNote(prev => {
            if (!prev) return null;
            const newItems = prev.items.map(item =>
                item.purchaseOrderItemId === itemId ? { ...item, [field]: Number(value) || 0 } : item
            );
            const newTotal = newItems.reduce((sum, item) => sum + item.creditAmount, 0);
            return { ...prev, items: newItems, totalAmount: newTotal };
        });
    };

    const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditableNote(prev => prev ? { ...prev, reason: e.target.value } : null);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editableNote) {
            const base64 = await fileToBase64(file);
            setEditableNote({
                ...editableNote,
                pdfAttachmentName: file.name,
                pdfAttachmentBase64: base64,
            });
            showToast('Archivo PDF cargado.', 'info');
        }
    };

    const handleRemoveFile = () => {
        if (editableNote) {
            setEditableNote({
                ...editableNote,
                pdfAttachmentName: undefined,
                pdfAttachmentBase64: undefined,
            });
            showToast('Archivo PDF eliminado.', 'info');
        }
    };


    const handleAction = (action: 'save' | 'approve' | 'reject') => {
        if (!editableNote) return;

        let finalNote = { ...editableNote };

        if (action === 'approve') {
            if (!finalNote.pdfAttachmentBase64 && !can('configuration', 'roles', 'edit')) { // A proxy for a high-level user
                const proceed = window.confirm(
                    "Advertencia: No se ha adjuntado ningún documento de respaldo en PDF. ¿Desea aprobar esta nota de crédito de todas formas?"
                );
                if (!proceed) {
                    return; // Stop the process if user cancels
                }
            }
            finalNote.status = CreditNoteStatus.Approved;
            finalNote.approvalDate = new Date().toISOString();
        } else if (action === 'reject') {
            finalNote.status = CreditNoteStatus.Rejected;
        }

        setIsSubmitting(true);
        onSubmit(finalNote);

        // Show feedback after submission
        if (action === 'approve') showToast(`Nota de Crédito #${finalNote.id} Aprobada.`, 'success');
        if (action === 'reject') showToast(`Nota de Crédito #${finalNote.id} Rechazada.`, 'error');
        if (action === 'save') showToast(`Nota de Crédito #${finalNote.id} guardada.`, 'success');

        setIsSubmitting(false);
    };

    if (!isOpen || !editableNote || !appContext) return null;

    const canApprove = can('purchasing', 'creditNotes', 'approve');
    const canEdit = editableNote.status === CreditNoteStatus.PendingApproval;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-6xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-dark-gray">Detalle de Nota de Crédito #{editableNote.id}</h2>
                            <p className="text-sm text-slate-500">Proveedor: <span className="font-medium">{editableNote.supplierName}</span></p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-slate-50 p-3 rounded-lg">
                        <p><strong>OC Asociada:</strong> OC-{editableNote.purchaseOrderId}</p>
                        <p><strong>Recepción:</strong> #{editableNote.goodsReceiptId}</p>
                        <p><strong>Fecha Creación:</strong> {format(new Date(editableNote.creationDate), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                        <p><strong>Creado por:</strong> {editableNote.createdBy}</p>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto mt-4 space-y-4 -mr-3 pr-3">
                    <div>
                        <label htmlFor="cn-reason" className="block text-sm font-medium text-slate-700">Motivo / Descripción</label>
                        <textarea
                            id="cn-reason"
                            value={editableNote.reason}
                            onChange={handleReasonChange}
                            readOnly={!canEdit}
                            rows={3}
                            className="w-full mt-1 p-2 border border-slate-300 rounded-md shadow-sm read-only:bg-slate-100 read-only:cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-dark-gray mb-2">Ítems a Acreditar</h3>
                        <div className="overflow-hidden border border-slate-200 rounded-lg">
                            <table className="min-w-full bg-white text-sm">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="p-2 text-left font-medium text-slate-600 w-2/5">Ítem</th>
                                        <th className="p-2 text-center font-medium text-slate-600">Unidad</th>
                                        <th className="p-2 text-center font-medium text-slate-600">Precio Unit. (OC)</th>
                                        <th className="p-2 text-center font-medium text-slate-600">Cant. a Acreditar</th>
                                        <th className="p-2 text-right font-medium text-slate-600">Monto a Acreditar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {editableNote.items.map(item => (
                                        <tr key={item.purchaseOrderItemId}>
                                            <td className="p-2 font-medium text-slate-800">{item.name}</td>
                                            <td className="p-2 text-center text-slate-600">{item.unit}</td>
                                            <td className="p-2 text-center text-slate-600 font-mono">¢{item.unitPrice.toLocaleString()}</td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    value={item.quantityToCredit}
                                                    onChange={(e) => handleItemChange(item.purchaseOrderItemId, 'quantityToCredit', e.target.value)}
                                                    readOnly={!canEdit}
                                                    className="w-24 p-1 border border-slate-300 rounded-md text-center read-only:bg-slate-100"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    value={item.creditAmount}
                                                    onChange={(e) => handleItemChange(item.purchaseOrderItemId, 'creditAmount', e.target.value)}
                                                    readOnly={!canEdit}
                                                    className="w-32 p-1 border border-slate-300 rounded-md text-right font-mono read-only:bg-slate-100"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* PDF Attachment Section */}
                    <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold text-dark-gray mb-2">Documento de Respaldo (PDF)</h3>
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />
                            {canEdit ? (
                                <div className="flex items-center gap-4">
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white text-primary font-semibold py-2 px-4 rounded-lg border border-primary hover:bg-blue-50">
                                        {editableNote.pdfAttachmentName ? 'Reemplazar PDF' : 'Cargar PDF'}
                                    </button>
                                    {editableNote.pdfAttachmentName && (
                                        <div className="flex items-center gap-2">
                                            <a href={editableNote.pdfAttachmentBase64} download={editableNote.pdfAttachmentName} className="text-sm text-primary hover:underline">{editableNote.pdfAttachmentName}</a>
                                            <button onClick={handleRemoveFile} className="text-red-500 hover:text-red-700 text-sm font-semibold" title="Eliminar archivo"> (Eliminar) </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {editableNote.pdfAttachmentName ? (
                                        <a href={editableNote.pdfAttachmentBase64} download={editableNote.pdfAttachmentName} className="text-sm text-primary hover:underline flex items-center gap-2">
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                            {editableNote.pdfAttachmentName}
                                        </a>
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">No se adjuntó documento de respaldo.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 pt-4 mt-4 border-t flex items-center justify-between">
                    <div>
                        <span className="text-sm font-medium text-slate-700">Monto Total de la Nota de Crédito:</span>
                        <p className="text-3xl font-bold text-red-600 font-mono">-¢{editableNote.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}</p>
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300">Cerrar</button>
                        {canEdit && (
                            <button onClick={() => handleAction('save')} disabled={isSubmitting} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark">
                                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        )}
                        {canApprove && canEdit && (
                            <>
                                <button onClick={() => handleAction('reject')} disabled={isSubmitting} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">Rechazar</button>
                                <button onClick={() => handleAction('approve')} disabled={isSubmitting} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Aprobar</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
