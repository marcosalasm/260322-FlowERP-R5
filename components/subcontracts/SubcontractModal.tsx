
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Subcontract, PurchaseOrder, AccountPayable, POStatus, SubcontractInstallment } from '../../types';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

interface SubcontractModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Subcontract, 'id'> | Subcontract) => void;
    subcontract: Subcontract | null;
}

const fileToBase64 = (file: File): Promise<{ name: string; base64: string }> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve({ name: file.name, base64: reader.result as string });
    reader.onerror = error => reject(error);
});

const formatCurrency = (value: number) => { const num = Number(value); if (isNaN(num)) return '¢0.00'; return `¢${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}`; };;

export const SubcontractModal: React.FC<SubcontractModalProps> = ({ isOpen, onClose, onSubmit, subcontract }) => {
    const appContext = useContext(AppContext);
    const { showToast } = useToast();

    if (!appContext) return null;
    const { projects, suppliers, purchaseOrders, accountsPayable } = appContext;

    const [activeTab, setActiveTab] = useState<'details' | 'payments'>('details');
    const [formData, setFormData] = useState<Partial<Subcontract>>({});
    const [executionPeriod, setExecutionPeriod] = useState('');

    // Payment Terms Configuration State
    const [basePaymentTerm, setBasePaymentTerm] = useState<string>('Adelanto / Avance');
    const [downPaymentType, setDownPaymentType] = useState<'percentage' | 'amount'>('percentage');
    const [downPaymentValue, setDownPaymentValue] = useState<string>('');

    // Installments (Tractos) State
    const [installments, setInstallments] = useState<SubcontractInstallment[]>([]);

    const availablePOs = useMemo(() => {
        return purchaseOrders.filter(po =>
            (po.status === POStatus.Approved || po.status === POStatus.Issued) && (!po.subcontractId || (subcontract && po.subcontractId === subcontract.id))
        );
    }, [purchaseOrders, subcontract]);

    useEffect(() => {
        if (isOpen) {
            setActiveTab('details');
            if (subcontract) {
                const scope = subcontract.scopeDescription || '';
                const periodMatch = scope.match(/Plazo de Ejecución: (.*)\n\n/);
                if (periodMatch) {
                    setExecutionPeriod(periodMatch[1]);
                    const cleanedScope = scope.replace(/Plazo de Ejecución: .*\n\n/, '');
                    setFormData({ ...subcontract, scopeDescription: cleanedScope });
                } else {
                    setFormData(subcontract);
                    setExecutionPeriod('');
                }

                // Parse Payment Terms
                const terms = subcontract.paymentTerms || '';
                if (terms.includes('Tractos')) {
                    setBasePaymentTerm('Tractos');
                } else {
                    setBasePaymentTerm('Adelanto / Avance');
                }

                setInstallments(subcontract.installments || []);

                // Attempt to extract down payment info
                const match = terms.match(/- (Adelanto|Primer Tracto): ([0-9.,]+)(%|¢)/);
                if (match) {
                    const value = match[2].replace(/,/g, '');
                    const unit = match[3];
                    setDownPaymentValue(value);
                    setDownPaymentType(unit === '%' ? 'percentage' : 'amount');
                } else {
                    setDownPaymentValue('');
                    setDownPaymentType('percentage');
                }

            } else {
                setFormData({
                    creationDate: new Date().toISOString(),
                });
                setBasePaymentTerm('Adelanto / Avance');
                setDownPaymentType('percentage');
                setDownPaymentValue('');
                setExecutionPeriod('');
                setInstallments([]);
            }
        }
    }, [isOpen, subcontract]);

    const accountPayable = useMemo(() => {
        if (!formData.id) return null;
        return accountsPayable.find(ap => ap.subcontractId === formData.id);
    }, [formData.id, accountsPayable]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'purchaseOrderId' || name === 'contractAmount' ? Number(value) : value }));

        if (name === 'purchaseOrderId') {
            const selectedPO = purchaseOrders.find(po => po.id === Number(value));
            if (selectedPO) {
                setFormData(prev => ({
                    ...prev,
                    projectId: selectedPO.projectId,
                    supplierId: selectedPO.supplierId,
                    contractAmount: selectedPO.totalAmount
                }));
                // Reset installments if PO changes to new amount
                setInstallments([{ id: 1, description: 'Primer Tracto', amount: selectedPO.totalAmount, isPaid: false }]);
            }
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const { name, base64 } = await fileToBase64(file);
                setFormData(prev => ({ ...prev, contractPdfName: name, contractPdfBase64: base64 }));
                showToast('Archivo de contrato cargado.', 'success');
            } catch (error) {
                showToast('Error al cargar el archivo.', 'error');
            }
        }
    };

    // Installment handlers
    const addInstallment = () => {
        const nextId = installments.length > 0 ? Math.max(...installments.map(i => i.id)) + 1 : 1;
        setInstallments([...installments, { id: nextId, description: `Tracto ${nextId}`, amount: 0, isPaid: false }]);
    };

    const removeInstallment = (id: number) => {
        setInstallments(installments.filter(i => i.id !== id));
    };

    const updateInstallment = (id: number, field: keyof SubcontractInstallment, value: any) => {
        setInstallments(installments.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const totalInstallmentsAmount = useMemo(() => {
        return installments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    }, [installments]);

    const calculateDownPaymentAmount = () => {
        const total = formData.contractAmount || 0;
        const val = parseFloat(downPaymentValue) || 0;
        if (downPaymentType === 'percentage') {
            return total * (val / 100);
        }
        return val;
    };

    const calculateDownPaymentPercentage = () => {
        const total = formData.contractAmount || 0;
        const val = parseFloat(downPaymentValue) || 0;
        if (total === 0) return 0;
        if (downPaymentType === 'amount') {
            return (val / total) * 100;
        }
        return val;
    };

    const handleSubmit = () => {
        if (!formData.purchaseOrderId || !formData.contractNumber || !formData.scopeDescription) {
            showToast('Por favor, complete todos los campos obligatorios.', 'error');
            return;
        }

        if (basePaymentTerm === 'Tractos') {
            if (Math.abs(totalInstallmentsAmount - (formData.contractAmount || 0)) > 0.01) {
                showToast(`La suma de los tractos (${formatCurrency(totalInstallmentsAmount)}) debe ser igual al monto total del contrato (${formatCurrency(formData.contractAmount || 0)}).`, 'error');
                return;
            }
        }

        if ((formData.contractAmount || 0) > 1000000 && !formData.contractPdfBase64) {
            showToast('Para montos mayores a ₡1,000,000 es obligatorio adjuntar el contrato en PDF.', 'error');
            return;
        }

        const finalScope = `Plazo de Ejecución: ${executionPeriod}\n\n${formData.scopeDescription}`;

        let finalPaymentTerms = basePaymentTerm;
        if (basePaymentTerm !== 'Tractos' && downPaymentValue) {
            const amountVal = calculateDownPaymentAmount();
            const percentVal = calculateDownPaymentPercentage();
            const detailStr = downPaymentType === 'percentage'
                ? `${downPaymentValue}% (${formatCurrency(amountVal)})`
                : `${formatCurrency(amountVal)} (${percentVal.toFixed(2)}%)`;
            finalPaymentTerms = `${basePaymentTerm} - Adelanto: ${detailStr}`;
        }

        onSubmit({
            ...formData,
            paymentTerms: finalPaymentTerms,
            scopeDescription: finalScope,
            installments: basePaymentTerm === 'Tractos' ? installments : undefined
        } as Subcontract);
    };

    if (!isOpen) return null;

    const selectedPO = purchaseOrders.find(po => po.id === formData.purchaseOrderId);
    const project = selectedPO ? projects.find(p => p.id === selectedPO.projectId) : null;
    const supplier = selectedPO ? suppliers.find(s => s.id === selectedPO.supplierId) : null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4" onClick={onClose} role="dialog">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0">
                    <h2 className="text-2xl font-bold text-dark-gray">{subcontract ? 'Editar' : 'Nuevo'} Subcontrato</h2>
                </div>

                <div className="border-b border-slate-200 my-4">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveTab('details')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>Detalles</button>
                        <button onClick={() => setActiveTab('payments')} disabled={!subcontract} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'payments' ? 'border-primary text-primary' : 'border-transparent text-slate-500'} disabled:text-slate-200`}>Pagos</button>
                    </nav>
                </div>

                <div className="flex-grow overflow-y-auto -mr-3 pr-3">
                    {activeTab === 'details' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Orden de Compra Asociada*</label>
                                <select name="purchaseOrderId" value={formData.purchaseOrderId || ''} onChange={handleChange} className="w-full p-2 border rounded-md mt-1" disabled={!!subcontract}>
                                    <option value="">Seleccione una OC...</option>
                                    {availablePOs.map(po => <option key={po.id} value={po.id}>OC-{po.id} ({po.supplierName} - {po.projectName})</option>)}
                                </select>
                            </div>
                            {selectedPO && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-3 rounded-lg">
                                    <div><span className="font-semibold">Proyecto:</span> {project?.name}</div>
                                    <div><span className="font-semibold">Proveedor:</span> {supplier?.name}</div>
                                    <div><span className="font-semibold">Monto OC:</span> {formatCurrency(selectedPO.totalAmount)}</div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium">N° de Contrato*</label>
                                <input type="text" name="contractNumber" value={formData.contractNumber || ''} onChange={handleChange} className="w-full p-2 border rounded-md mt-1" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Plazo de Ejecución</label>
                                <input type="text" name="executionPeriod" value={executionPeriod} onChange={e => setExecutionPeriod(e.target.value)} placeholder="Ej: 30 días hábiles" className="w-full p-2 border rounded-md mt-1" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Descripción del Alcance*</label>
                                <textarea name="scopeDescription" value={formData.scopeDescription || ''} onChange={handleChange} rows={4} className="w-full p-2 border rounded-md mt-1" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Monto Contractual (¢)</label>
                                    <input type="number" name="contractAmount" value={formData.contractAmount || ''} onChange={handleChange} className="w-full p-2 border rounded-md mt-1" readOnly />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Forma de Pago</label>
                                    <select
                                        value={basePaymentTerm}
                                        onChange={(e) => setBasePaymentTerm(e.target.value)}
                                        className="w-full p-2 border rounded-md mt-1 font-bold text-primary"
                                    >
                                        <option value="Adelanto / Avance">Adelanto / Avance</option>
                                        <option value="Tractos">Tractos</option>
                                    </select>
                                </div>
                            </div>

                            {basePaymentTerm === 'Tractos' ? (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-4 animate-fade-in">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Definición de Tractos</h4>
                                        <button
                                            type="button"
                                            onClick={addInstallment}
                                            className="text-xs bg-primary text-white font-bold py-1.5 px-3 rounded-lg hover:bg-primary-dark transition-all shadow-sm"
                                        >
                                            + Agregar Tracto
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {installments.map((inst, index) => (
                                            <div key={inst.id} className="grid grid-cols-[1fr,150px,auto] gap-3 items-center bg-white p-2 rounded-lg border border-blue-200">
                                                <input
                                                    type="text"
                                                    value={inst.description}
                                                    onChange={e => updateInstallment(inst.id, 'description', e.target.value)}
                                                    placeholder="Descripción (ej: Avance cimentación)"
                                                    className="p-1.5 text-sm border-none focus:ring-0"
                                                />
                                                <div className="relative">
                                                    <span className="absolute left-2 top-2 text-slate-400 text-xs">¢</span>
                                                    <input
                                                        type="number"
                                                        value={inst.amount}
                                                        onChange={e => updateInstallment(inst.id, 'amount', Number(e.target.value))}
                                                        className="w-full p-1.5 pl-5 text-sm text-right border-slate-200 rounded focus:ring-primary focus:border-primary font-mono"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeInstallment(inst.id)}
                                                    disabled={installments.length <= 1}
                                                    className="text-red-400 hover:text-red-600 disabled:opacity-30"
                                                >
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd"></path></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={`p-3 rounded-lg border flex justify-between items-center ${Math.abs(totalInstallmentsAmount - (formData.contractAmount || 0)) < 0.01 ? 'bg-green-100 border-green-200 text-green-800' : 'bg-orange-100 border-orange-200 text-orange-800'}`}>
                                        <span className="text-xs font-bold uppercase">Suma de Tractos: <span className="font-mono">{formatCurrency(totalInstallmentsAmount)}</span></span>
                                        <span className="text-xs font-bold uppercase">Diferencia: <span className="font-mono">{formatCurrency((formData.contractAmount || 0) - totalInstallmentsAmount)}</span></span>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-4 rounded-md border border-slate-200 animate-fade-in">
                                    <label className="block text-sm font-bold text-slate-700 mb-3">Definir Adelanto (Opcional)</label>
                                    <div className="flex gap-6 mb-3">
                                        <label className="flex items-center cursor-pointer">
                                            <input type="radio" checked={downPaymentType === 'percentage'} onChange={() => setDownPaymentType('percentage')} className="mr-2 h-4 w-4 text-primary focus:ring-primary" />
                                            <span className="text-sm">Porcentaje (%)</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input type="radio" checked={downPaymentType === 'amount'} onChange={() => setDownPaymentType('amount')} className="mr-2 h-4 w-4 text-primary focus:ring-primary" />
                                            <span className="text-sm">Monto Fijo (₡)</span>
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={downPaymentValue}
                                                onChange={(e) => setDownPaymentValue(e.target.value)}
                                                className="w-40 p-2 border rounded-md pr-8"
                                                placeholder={downPaymentType === 'percentage' ? 'Ej: 30' : 'Ej: 500000'}
                                                min="0"
                                            />
                                            <span className="absolute right-3 top-2 text-slate-500">{downPaymentType === 'percentage' ? '%' : '₡'}</span>
                                        </div>
                                        <div className="text-sm bg-white border px-3 py-2 rounded-md shadow-sm">
                                            <span className="text-slate-500 mr-2">Equivalente:</span>
                                            <span className="font-bold text-dark-gray">
                                                {downPaymentType === 'percentage'
                                                    ? formatCurrency(calculateDownPaymentAmount())
                                                    : `${calculateDownPaymentPercentage().toFixed(2)}%`
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium">Adjuntar Contrato (PDF)</label>
                                <div className="flex items-center gap-4 mt-1">
                                    <input type="file" id="contract-upload" onChange={handleFileChange} accept=".pdf,image/*" className="hidden" />
                                    <label htmlFor="contract-upload" className="cursor-pointer bg-white py-1.5 px-3 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                                        {formData.contractPdfName ? 'Cambiar' : 'Seleccionar Archivo'}
                                    </label>
                                    {formData.contractPdfName && <span className="text-sm text-primary">{formData.contractPdfName}</span>}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'payments' && accountPayable && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Historial de Pagos Registrados</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="p-2 text-left">Fecha</th>
                                            <th className="p-2 text-left">Detalle</th>
                                            <th className="p-2 text-right">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accountPayable.payments.map(p => (
                                            <tr key={p.id}>
                                                <td className="p-2">{format(new Date(p.date), 'dd/MM/yyyy', { locale: es })}</td>
                                                <td className="p-2">{p.details}</td>
                                                <td className="p-2 text-right font-mono">{formatCurrency(p.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="font-bold bg-slate-200">
                                        <tr>
                                            <td colSpan={2} className="p-2 text-right">Total Pagado:</td>
                                            <td className="p-2 text-right font-mono">{formatCurrency(accountPayable.paidAmount)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={2} className="p-2 text-right">Saldo Pendiente:</td>
                                            <td className="p-2 text-right font-mono text-red-600">{formatCurrency(accountPayable.totalAmount - accountPayable.paidAmount)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 pt-4 mt-4 border-t flex justify-end gap-4">
                    <button onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300">Cancelar</button>
                    <button onClick={handleSubmit} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark">
                        {subcontract ? 'Guardar Cambios' : 'Crear Subcontrato'}
                    </button>
                </div>
            </div>
        </div>
    );
};
