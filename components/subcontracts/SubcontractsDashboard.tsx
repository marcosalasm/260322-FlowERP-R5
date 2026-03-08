import React, { useState, useMemo, useContext } from 'react';
import { Card } from '../shared/Card';
import { AppContext } from '../../context/AppContext';
import { Subcontract, AccountPayable, APStatus } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../context/ToastContext';
import { SubcontractsTable } from './SubcontractsTable';
import { SubcontractModal } from './SubcontractModal';

const SubcontractsDashboard: React.FC = () => {
    const appContext = useContext(AppContext);
    const { can } = usePermissions();
    const { showToast } = useToast();

    if (!appContext) return null;

    const { subcontracts, setSubcontracts, projects, suppliers, purchaseOrders, accountsPayable, setAccountsPayable } = appContext;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubcontract, setSelectedSubcontract] = useState<Subcontract | null>(null);

    const handleOpenModal = (subcontract: Subcontract | null) => {
        setSelectedSubcontract(subcontract);
        setIsModalOpen(true);
    };

    const handleSaveSubcontract = (data: Omit<Subcontract, 'id'> | Subcontract) => {
        if ('id' in data) { // Editing
            setSubcontracts(prev => prev.map(s => s.id === data.id ? data : s));
            showToast('Subcontrato actualizado con éxito.', 'success');
        } else { // Creating
            const nextId = (subcontracts.length > 0 ? Math.max(...subcontracts.map(s => s.id)) : 0) + 1;
            const newSubcontract = { ...data, id: nextId };
            setSubcontracts(prev => [newSubcontract, ...prev]);

            // Create associated Account Payable if it doesn't already exist for the PO
            const existingAP = accountsPayable.find(ap => ap.purchaseOrderId === newSubcontract.purchaseOrderId);
            if (existingAP) {
                // Link existing AP to the new subcontract
                setAccountsPayable(prev => prev.map(ap => ap.id === existingAP.id ? {...ap, subcontractId: newSubcontract.id} : ap));
            } else {
                 const nextAPId = (accountsPayable.length > 0 ? Math.max(...accountsPayable.map(ap => ap.id)) : 0) + 1;
                const supplier = suppliers.find(s => s.id === newSubcontract.supplierId);
                const newAP: AccountPayable = {
                    id: nextAPId,
                    purchaseOrderId: newSubcontract.purchaseOrderId,
                    subcontractId: newSubcontract.id,
                    supplierId: newSubcontract.supplierId,
                    supplierName: supplier?.name || 'N/A',
                    invoiceNumber: `SC-${newSubcontract.id}-PENDIENTE`, // Placeholder invoice number
                    invoiceDate: newSubcontract.creationDate,
                    dueDate: newSubcontract.creationDate, // Should be adjusted based on terms
                    totalAmount: newSubcontract.contractAmount,
                    paidAmount: 0,
                    payments: [],
                    status: APStatus.PendingPayment,
                };
                setAccountsPayable(prev => [...prev, newAP]);
            }

            showToast('Subcontrato creado con éxito.', 'success');
        }
        setIsModalOpen(false);
        setSelectedSubcontract(null);
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-dark-gray">Módulo de Subcontratos</h2>
                    {can('subcontracts', 'main', 'create') && (
                        <button
                            onClick={() => handleOpenModal(null)}
                            className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                        >
                            + Nuevo Subcontrato
                        </button>
                    )}
                </div>

                <Card title="Gestión de Subcontratos">
                    <SubcontractsTable
                        subcontracts={subcontracts}
                        onEdit={handleOpenModal}
                    />
                </Card>
            </div>
            <SubcontractModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveSubcontract}
                subcontract={selectedSubcontract}
            />
        </>
    );
};

export default SubcontractsDashboard;
