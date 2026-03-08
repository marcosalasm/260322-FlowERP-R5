
import React, { useState, useMemo, useContext } from 'react';
import { Card } from '../shared/Card';
import { AppContext } from '../../context/AppContext';
import { Supplier, Material, ServiceItem, RecurringOrderTemplate, PredeterminedActivity, LaborItem } from '../../types';
import { SuppliersTable } from './SuppliersTable';
import { MaterialsTable } from './MaterialsTable';
import { GoodsAndServicesTable } from './GoodsAndServicesTable';
import { NewSupplierModal } from './NewSupplierModal';
import { EditSupplierModal } from './EditSupplierModal';
import { NewMaterialModal } from './NewMaterialModal';
import { EditMaterialModal } from './EditMaterialModal';
import { NewGoodAndServiceModal } from './NewGoodAndServiceModal';
import { RecurringOrdersList } from './RecurringOrdersList';
import { NewRecurringOrderModal } from './NewRecurringOrderModal';
import { EditRecurringOrderModal } from './EditRecurringOrderModal';
import { PredeterminedActivityList } from './PredeterminedActivityList';
import { NewPredeterminedActivityModal } from './NewPredeterminedActivityModal';
import { EditPredeterminedActivityModal } from './EditPredeterminedActivityModal';
import { ImportMaterialsModal } from './ImportMaterialsModal';
import { InventoryAdjustments } from './InventoryAdjustments';
import { LaborTable } from './LaborTable';
import { NewLaborItemModal } from './NewLaborItemModal';
import { EditLaborItemModal } from './EditLaborItemModal';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';
import { apiService } from '../../services/apiService';


type DatabaseView = 'suppliers' | 'materials' | 'inventory' | 'goodsAndServices' | 'labor' | 'recurringOrders' | 'predetermined';

const databaseViews = [
    { key: 'suppliers', label: 'Proveedores', section: 'suppliers' },
    { key: 'materials', label: 'Materiales', section: 'materials' },
    { key: 'inventory', label: 'Ajuste de Inventario', section: 'inventory' },
    { key: 'goodsAndServices', label: 'Sub Contratos', section: 'subcontracts' },
    { key: 'labor', label: 'Mano de Obra', section: 'labor' },
    { key: 'recurringOrders', label: 'Pedidos Recurrentes', section: 'recurringOrders' },
    { key: 'predetermined', label: 'Actividades Predeterminadas', section: 'predeterminedActivities' },
];

const DatabaseDashboard: React.FC = () => {
    const appContext = useContext(AppContext);
    const { showToast } = useToast();
    const { can } = usePermissions();
    if (!appContext) return null;

    const {
        suppliers, setSuppliers,
        materials, setMaterials,
        serviceItems, setServiceItems,
        laborItems, setLaborItems,
        recurringOrderTemplates, setRecurringOrderTemplates,
        predeterminedActivities, setPredeterminedActivities,
        budgets, serviceRequests, purchaseOrders, quoteResponses, accountsPayable,
    } = appContext;

    const [activeView, setActiveView] = useState<DatabaseView>('suppliers');
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isEditSupplierModalOpen, setIsEditSupplierModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
    const [isEditMaterialModalOpen, setIsEditMaterialModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [isGoodAndServiceModalOpen, setIsGoodAndServiceModalOpen] = useState(false);
    const [isLaborModalOpen, setIsLaborModalOpen] = useState(false);
    const [isEditLaborModalOpen, setIsEditLaborModalOpen] = useState(false);
    const [selectedLaborItem, setSelectedLaborItem] = useState<LaborItem | null>(null);
    const [isRecurringOrderModalOpen, setIsRecurringOrderModalOpen] = useState(false);
    const [isEditRecurringOrderModalOpen, setIsEditRecurringOrderModalOpen] = useState(false);
    const [selectedRecurringOrder, setSelectedRecurringOrder] = useState<RecurringOrderTemplate | null>(null);
    const [isPredeterminedActivityModalOpen, setIsPredeterminedActivityModalOpen] = useState(false);
    const [isEditPredeterminedActivityModalOpen, setIsEditPredeterminedActivityModalOpen] = useState(false);
    const [selectedPredeterminedActivity, setSelectedPredeterminedActivity] = useState<PredeterminedActivity | null>(null);

    // Filters
    const [supplierServiceFilter, setSupplierServiceFilter] = useState('');
    const [materialSearchTerm, setMaterialSearchTerm] = useState('');
    const [isSearchingMaterials, setIsSearchingMaterials] = useState(false);

    // Debounced search for materials
    React.useEffect(() => {
        if (activeView !== 'materials') return;

        const timer = setTimeout(async () => {
            if (materialSearchTerm.trim() === '') {
                // Fetch all materials if search is cleared
                try {
                    const allMaterials = await apiService.getMaterials();
                    setMaterials(allMaterials);
                } catch (err) {
                    console.error("Error fetching all materials:", err);
                }
                return;
            }

            setIsSearchingMaterials(true);
            try {
                const results = await apiService.searchMaterials(materialSearchTerm);
                setMaterials(results);
            } catch (err) {
                console.error("Error searching materials:", err);
                showToast('Error al buscar materiales.', 'error');
            } finally {
                setIsSearchingMaterials(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [materialSearchTerm, activeView, setMaterials, showToast]);

    const handleAddSupplier = async (newSupplierData: Omit<Supplier, 'id'>) => {
        try {
            const newSupplier = await apiService.createSupplier(newSupplierData);
            setSuppliers(prev => [newSupplier, ...prev]);
            showToast('Proveedor agregado con éxito.', 'success');
        } catch (error) {
            console.error("Error adding supplier:", error);
            showToast('Error al agregar proveedor.', 'error');
        }
    };

    const handleEditSupplier = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsEditSupplierModalOpen(true);
    };

    const handleUpdateSupplier = async (updatedSupplier: Supplier) => {
        try {
            const updated = await apiService.updateSupplier(updatedSupplier.id, updatedSupplier);
            setSuppliers(prev => prev.map(s => s.id === updated.id ? updated : s));
            showToast('Proveedor actualizado con éxito.', 'success');
        } catch (error) {
            console.error("Error updating supplier:", error);
            showToast('Error al actualizar proveedor.', 'error');
        }
    };

    const handleDeleteSupplier = async (supplierId: number) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) return;

        const isUsedInPO = purchaseOrders.some(po => po.supplierId === supplierId);
        const isUsedInQuote = quoteResponses.some(qr => qr.supplierId === supplierId);
        const isUsedInAP = accountsPayable.some(ap => ap.supplierId === supplierId);

        if (isUsedInPO || isUsedInQuote || isUsedInAP) {
            showToast(`No se puede eliminar a "${supplier.name}". Está en uso en órdenes de compra, cotizaciones o cuentas por pagar.`, 'error');
            return;
        }

        if (window.confirm(`¿Está seguro de que desea eliminar al proveedor "${supplier.name}"? Esta acción es irreversible.`)) {
            try {
                await apiService.deleteSupplier(supplierId);
                setSuppliers(prev => prev.filter(s => s.id !== supplierId));
                showToast('Proveedor eliminado con éxito.', 'success');
            } catch (error) {
                console.error("Error deleting supplier:", error);
                showToast('Error al eliminar proveedor.', 'error');
            }
        }
    };

    const filteredSuppliers = useMemo(() => {
        if (!supplierServiceFilter) return suppliers;
        return suppliers.filter(s => s.serviceType === supplierServiceFilter);
    }, [suppliers, supplierServiceFilter]);

    const handleAddMaterial = async (newMaterialData: Omit<Material, 'id' | 'lastUpdated' | 'quantity'>) => {
        try {
            const newMaterial = await apiService.createMaterial(newMaterialData);
            setMaterials(prev => [newMaterial, ...prev]);
            showToast('Material agregado con éxito.', 'success');
        } catch (error) {
            console.error("Error adding material:", error);
            showToast('Error al agregar material.', 'error');
        }
    };

    const handleDeleteMaterial = async (materialId: number) => {
        const material = materials.find(m => m.id === materialId);
        if (!material) return;

        const usage = [];
        if (budgets.some(b => b.activities.some(a => a.subActivities.some(sa => sa.description === material.name)))) usage.push('presupuestos');
        if (serviceRequests.some(sr => sr.items.some(i => i.name === material.name))) usage.push('solicitudes de servicio');
        if (predeterminedActivities.some(pa => pa.subActivities.some(sa => sa.description === material.name))) usage.push('actividades predeterminadas');

        if (usage.length > 0) {
            showToast(`No se puede eliminar "${material.name}". Está en uso en ${usage.join(', ')}.`, 'error');
            return;
        }

        if (window.confirm(`¿Está seguro de que desea eliminar el material "${material.name}"? Esta acción es irreversible.`)) {
            try {
                await apiService.deleteMaterial(materialId);
                setMaterials(prev => prev.filter(m => m.id !== materialId));
                showToast('Material eliminado con éxito.', 'success');
            } catch (error) {
                console.error("Error deleting material:", error);
                showToast('Error al eliminar material.', 'error');
            }
        }
    };


    const handleImportMaterials = async (newMaterials: Omit<Material, 'id' | 'lastUpdated' | 'quantity'>[]) => {
        try {
            // In a real app we might want a bulk export/import API endpoint
            // For now, we contribute to the database one by one or explain why it's not implemented
            // Ideally server should have a bulk endpoint.
            // Let's at least show a toast that this might take time if we loop.
            // But since there is no bulk endpoint yet, let's keep it simple and just do it for local for now OR implement bulk.
            // For the sake of the fix, let's just use the single create endpoint in a loop (not ideal but works for small batches)

            showToast('Importando materiales...', 'info');
            const createdMaterials = [];
            for (const mat of newMaterials) {
                const created = await apiService.createMaterial(mat);
                createdMaterials.push(created);
            }
            setMaterials(prev => [...prev, ...createdMaterials]);
            setIsImportModalOpen(false);
            showToast(`${newMaterials.length} materiales importados con éxito.`, 'success');
        } catch (error) {
            console.error("Error importing materials:", error);
            showToast('Error al importar materiales.', 'error');
        }
    };

    const handleEditMaterial = (material: Material) => {
        setSelectedMaterial(material);
        setIsEditMaterialModalOpen(true);
    };

    const handleUpdateMaterial = async (updatedMaterial: Material) => {
        try {
            const updated = await apiService.updateMaterial(updatedMaterial.id, updatedMaterial);
            setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
            setIsEditMaterialModalOpen(false);
            setSelectedMaterial(null);
            showToast('Material actualizado con éxito.', 'success');
        } catch (error) {
            console.error("Error updating material:", error);
            showToast('Error al actualizar material.', 'error');
        }
    };

    const handleAddGoodAndService = async (newServiceData: Omit<ServiceItem, 'id'>) => {
        try {
            const newItem = await apiService.createServiceItem(newServiceData);
            setServiceItems(prev => [newItem, ...prev]);
            showToast('Sub Contrato agregado con éxito.', 'success');
        } catch (error) {
            console.error("Error adding service item:", error);
            showToast('Error al agregar sub contrato.', 'error');
        }
    };

    const handleDeleteServiceItem = async (itemId: number) => {
        const item = serviceItems.find(i => i.id === itemId);
        if (!item) return;

        const usage = [];
        if (budgets.some(b => b.activities.some(a => a.subActivities.some(sa => sa.description === item.name)))) usage.push('presupuestos');
        if (serviceRequests.some(sr => sr.items.some(i => i.name === item.name))) usage.push('solicitudes de servicio');
        if (predeterminedActivities.some(pa => pa.subActivities.some(sa => sa.description === item.name))) usage.push('actividades predeterminadas');

        if (usage.length > 0) {
            showToast(`No se puede eliminar "${item.name}". Está en uso en ${usage.join(', ')}.`, 'error');
            return;
        }

        if (window.confirm(`¿Está seguro de que desea eliminar el sub contrato "${item.name}"? Esta acción es irreversible.`)) {
            try {
                await apiService.deleteServiceItem(itemId);
                setServiceItems(prev => prev.filter(i => i.id !== itemId));
                showToast('Sub Contrato eliminado con éxito.', 'success');
            } catch (error) {
                console.error("Error deleting service item:", error);
                showToast('Error al eliminar sub contrato.', 'error');
            }
        }
    };

    const handleAddLaborItem = async (newLaborData: Omit<LaborItem, 'id'>) => {
        try {
            const newItem = await apiService.createLaborItem(newLaborData);
            setLaborItems(prev => [newItem, ...prev]);
            showToast('Puesto de mano de obra agregado con éxito.', 'success');
        } catch (error) {
            console.error("Error adding labor item:", error);
            showToast('Error al agregar puesto de mano de obra.', 'error');
        }
    };

    const handleEditLaborItem = (item: LaborItem) => {
        setSelectedLaborItem(item);
        setIsEditLaborModalOpen(true);
    };

    const handleUpdateLaborItem = async (updatedItem: LaborItem) => {
        try {
            const updated = await apiService.updateLaborItem(updatedItem.id, updatedItem);
            setLaborItems(prev => prev.map(item => item.id === updated.id ? updated : item));
            setIsEditLaborModalOpen(false);
            setSelectedLaborItem(null);
            showToast('Puesto de mano de obra actualizado con éxito.', 'success');
        } catch (error) {
            console.error("Error updating labor item:", error);
            showToast('Error al actualizar puesto de mano de obra.', 'error');
        }
    };

    const handleDeleteLaborItem = async (itemId: number) => {
        const item = laborItems.find(i => i.id === itemId);
        if (!item) return;

        const usage = [];
        if (budgets.some(b => b.activities.some(a => a.subActivities.some(sa => sa.description === item.name)))) usage.push('presupuestos');
        if (predeterminedActivities.some(pa => pa.subActivities.some(sa => sa.description === item.name))) usage.push('actividades predeterminadas');

        if (usage.length > 0) {
            showToast(`No se puede eliminar "${item.name}". Está en uso en ${usage.join(', ')}.`, 'error');
            return;
        }

        if (window.confirm(`¿Está seguro de que desea eliminar el puesto de mano de obra "${item.name}"? Esta acción es irreversible.`)) {
            try {
                await apiService.deleteLaborItem(itemId);
                setLaborItems(prev => prev.filter(item => item.id !== itemId));
                showToast('Puesto de mano de obra eliminado con éxito.', 'success');
            } catch (error) {
                console.error("Error deleting labor item:", error);
                showToast('Error al eliminar puesto de mano de obra.', 'error');
            }
        }
    };

    const handleAddRecurringOrder = async (newTemplateData: Omit<RecurringOrderTemplate, 'id'>) => {
        try {
            const created = await apiService.createRecurringOrderTemplate(newTemplateData);
            setRecurringOrderTemplates(prev => [created, ...prev]);
            showToast('Plantilla de pedido recurrente creada con éxito.', 'success');
        } catch (error) {
            console.error("Error creating recurring order template:", error);
            showToast('Error al crear plantilla.', 'error');
        }
    };

    const handleDeleteRecurringOrder = async (templateId: number) => {
        const template = recurringOrderTemplates.find(t => t.id === templateId);
        if (!template) return;

        if (window.confirm(`¿Está seguro de que desea eliminar la plantilla "${template.name}"? Esta acción es irreversible.`)) {
            try {
                await apiService.deleteRecurringOrderTemplate(templateId);
                setRecurringOrderTemplates(prev => prev.filter(t => t.id !== templateId));
                showToast('Plantilla eliminada con éxito.', 'success');
            } catch (error) {
                console.error("Error deleting recurring order template:", error);
                showToast('Error al eliminar plantilla.', 'error');
            }
        }
    };

    const handleEditRecurringOrder = (template: RecurringOrderTemplate) => {
        setSelectedRecurringOrder(template);
        setIsEditRecurringOrderModalOpen(true);
    };

    const handleUpdateRecurringOrder = async (updatedTemplate: RecurringOrderTemplate) => {
        try {
            const updated = await apiService.updateRecurringOrderTemplate(updatedTemplate.id, updatedTemplate);
            setRecurringOrderTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
            setIsEditRecurringOrderModalOpen(false);
            setSelectedRecurringOrder(null);
            showToast('Plantilla actualizada con éxito.', 'success');
        } catch (error) {
            console.error("Error updating recurring order template:", error);
            showToast('Error al actualizar plantilla.', 'error');
        }
    };

    const handleAddPredeterminedActivity = async (newActivityData: Omit<PredeterminedActivity, 'id'>) => {
        try {
            const created = await apiService.createPredeterminedActivity(newActivityData);
            setPredeterminedActivities(prev => [created, ...prev]);
            showToast('Actividad predeterminada agregada con éxito.', 'success');
        } catch (error) {
            console.error("Error adding predetermined activity:", error);
            showToast('Error al agregar actividad predeterminada.', 'error');
        }
    };

    const handleDeletePredeterminedActivity = async (activityId: number) => {
        const activity = predeterminedActivities.find(a => a.id === activityId);
        if (!activity) return;

        const isUsed = budgets.some(b => b.activities.some(a => a.predeterminedActivityId === activityId));
        if (isUsed) {
            showToast(`No se puede eliminar "${activity.name}". Está en uso en al menos un presupuesto.`, 'error');
            return;
        }

        if (window.confirm(`¿Está seguro de que desea eliminar la actividad predeterminada "${activity.name}"? Esta acción es irreversible.`)) {
            try {
                await apiService.deletePredeterminedActivity(activityId);
                setPredeterminedActivities(prev => prev.filter(a => a.id !== activityId));
                showToast('Actividad predeterminada eliminada con éxito.', 'success');
            } catch (error) {
                console.error("Error deleting predetermined activity:", error);
                showToast('Error al eliminar actividad predeterminada.', 'error');
            }
        }
    };

    const handleEditPredeterminedActivity = (activity: PredeterminedActivity) => {
        setSelectedPredeterminedActivity(activity);
        setIsEditPredeterminedActivityModalOpen(true);
    };

    const handleUpdatePredeterminedActivity = async (updatedActivity: PredeterminedActivity) => {
        try {
            const updated = await apiService.updatePredeterminedActivity(updatedActivity.id, updatedActivity);
            setPredeterminedActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
            setIsEditPredeterminedActivityModalOpen(false);
            setSelectedPredeterminedActivity(null);
            showToast('Actividad predeterminada actualizada con éxito.', 'success');
        } catch (error) {
            console.error("Error updating predetermined activity:", error);
            showToast('Error al actualizar actividad predeterminada.', 'error');
        }
    };

    const visibleViews = useMemo(() => databaseViews.filter(view => can('database', view.section, 'view')), [can]);


    const activeViewContent = useMemo(() => {
        switch (activeView) {
            case 'suppliers':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex-1 max-w-xs">
                                <label htmlFor="supplier-filter" className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Filtrar por Bien o Servicio</label>
                                <select
                                    id="supplier-filter"
                                    value={supplierServiceFilter}
                                    onChange={e => setSupplierServiceFilter(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
                                >
                                    <option value="">TODOS</option>
                                    <option value="CONSTRUCTOR DE PROYECTOS RECURRENTES">CONSTRUCTOR DE PROYECTOS RECURRENTES</option>
                                    <option value="CONSTRUCTOR">CONSTRUCTOR</option>
                                    <option value="SERVICIOS">SERVICIOS</option>
                                    <option value="MATERIALES">MATERIALES</option>
                                </select>
                            </div>
                        </div>
                        <SuppliersTable suppliers={filteredSuppliers} onEdit={handleEditSupplier} onDelete={handleDeleteSupplier} />
                    </div>
                );
            case 'materials':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex-1 max-w-md relative">
                                <label htmlFor="material-search" className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Buscador Inteligente de Materiales</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        id="material-search"
                                        placeholder="Buscar por nombre (ej. Cemento, Varilla...)"
                                        value={materialSearchTerm}
                                        onChange={(e) => setMaterialSearchTerm(e.target.value)}
                                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-white"
                                    />
                                    {materialSearchTerm && (
                                        <button
                                            onClick={() => setMaterialSearchTerm('')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                {isSearchingMaterials && (
                                    <div className="absolute right-12 top-[34px]">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <MaterialsTable
                            materials={materials}
                            onEdit={handleEditMaterial}
                            onDelete={handleDeleteMaterial}
                            searchTerm={materialSearchTerm}
                        />
                    </div>
                );
            case 'inventory':
                return can('database', 'inventory', 'view') ? <InventoryAdjustments /> : null;
            case 'goodsAndServices':
                return <GoodsAndServicesTable serviceItems={serviceItems} onDelete={handleDeleteServiceItem} />;
            case 'labor':
                return <LaborTable laborItems={laborItems} onEdit={handleEditLaborItem} onDelete={handleDeleteLaborItem} />;
            case 'recurringOrders':
                return <RecurringOrdersList templates={recurringOrderTemplates} onEdit={handleEditRecurringOrder} onDelete={handleDeleteRecurringOrder} />;
            case 'predetermined':
                return <PredeterminedActivityList activities={predeterminedActivities} onEdit={handleEditPredeterminedActivity} onDelete={handleDeletePredeterminedActivity} />;
            default:
                return null;
        }
    }, [activeView, suppliers, filteredSuppliers, supplierServiceFilter, materials, serviceItems, laborItems, recurringOrderTemplates, predeterminedActivities, can]);

    const headerButton = useMemo(() => {
        const baseButtonClasses = "bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2";
        switch (activeView) {
            case 'suppliers':
                return can('database', 'suppliers', 'create') ? <button onClick={() => setIsSupplierModalOpen(true)} className={baseButtonClasses}> + Nuevo Proveedor </button> : null;
            case 'materials':
                return can('database', 'materials', 'create') ? (
                    <div className="flex gap-4">
                        <button onClick={() => setIsImportModalOpen(true)} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Importar Materiales
                        </button>
                        <button onClick={() => setIsMaterialModalOpen(true)} className={baseButtonClasses}> + Nuevo Material </button>
                    </div>
                ) : null;
            case 'goodsAndServices':
                return can('database', 'subcontracts', 'create') ? <button onClick={() => setIsGoodAndServiceModalOpen(true)} className={baseButtonClasses}> + Nuevo Sub Contrato </button> : null;
            case 'labor':
                return can('database', 'labor', 'create') ? <button onClick={() => setIsLaborModalOpen(true)} className={baseButtonClasses}> + Nuevo Puesto </button> : null;
            case 'recurringOrders':
                return can('database', 'recurringOrders', 'create') ? <button onClick={() => setIsRecurringOrderModalOpen(true)} className={baseButtonClasses}> + Nuevo Pedido Recurrente </button> : null;
            case 'predetermined':
                return can('database', 'predeterminedActivities', 'create') ? <button onClick={() => setIsPredeterminedActivityModalOpen(true)} className={baseButtonClasses}> + Nueva Actividad Predeterminada </button> : null;
            case 'inventory':
            default:
                return null;
        }
    }, [activeView, can]);

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-dark-gray">Módulo de Base de Datos</h2>
                    {headerButton}
                </div>

                <div className="flex justify-between items-center border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        {visibleViews.map(view => (
                            <button
                                key={view.key}
                                onClick={() => setActiveView(view.key as DatabaseView)}
                                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeView === view.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                            >
                                {view.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <Card>
                    {activeViewContent}
                </Card>
            </div>

            <NewSupplierModal
                isOpen={isSupplierModalOpen}
                onClose={() => setIsSupplierModalOpen(false)}
                onSubmit={handleAddSupplier}
            />

            <EditSupplierModal
                isOpen={isEditSupplierModalOpen}
                onClose={() => {
                    setIsEditSupplierModalOpen(false);
                    setSelectedSupplier(null);
                }}
                onSubmit={handleUpdateSupplier}
                supplier={selectedSupplier}
            />

            <NewMaterialModal
                isOpen={isMaterialModalOpen}
                onClose={() => setIsMaterialModalOpen(false)}
                onSubmit={handleAddMaterial}
            />

            <ImportMaterialsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSubmit={handleImportMaterials}
            />

            <EditMaterialModal
                isOpen={isEditMaterialModalOpen}
                onClose={() => {
                    setIsEditMaterialModalOpen(false);
                    setSelectedMaterial(null);
                }}
                onSubmit={handleUpdateMaterial}
                material={selectedMaterial}
            />

            <NewGoodAndServiceModal
                isOpen={isGoodAndServiceModalOpen}
                onClose={() => setIsGoodAndServiceModalOpen(false)}
                onSubmit={handleAddGoodAndService}
            />

            <NewLaborItemModal
                isOpen={isLaborModalOpen}
                onClose={() => setIsLaborModalOpen(false)}
                onSubmit={handleAddLaborItem}
            />

            <EditLaborItemModal
                isOpen={isEditLaborModalOpen}
                onClose={() => {
                    setSelectedLaborItem(null);
                    setIsEditLaborModalOpen(false);
                }}
                onSubmit={handleUpdateLaborItem}
                laborItem={selectedLaborItem}
            />

            <NewRecurringOrderModal
                isOpen={isRecurringOrderModalOpen}
                onClose={() => setIsRecurringOrderModalOpen(false)}
                onSubmit={handleAddRecurringOrder}
                materials={materials}
                serviceItems={serviceItems}
            />

            <EditRecurringOrderModal
                isOpen={isEditRecurringOrderModalOpen}
                onClose={() => {
                    setIsEditRecurringOrderModalOpen(false);
                    setSelectedRecurringOrder(null);
                }}
                onSubmit={handleUpdateRecurringOrder}
                template={selectedRecurringOrder}
                materials={materials}
                serviceItems={serviceItems}
            />

            <NewPredeterminedActivityModal
                isOpen={isPredeterminedActivityModalOpen}
                onClose={() => setIsPredeterminedActivityModalOpen(false)}
                onSubmit={handleAddPredeterminedActivity}
                materials={materials}
                serviceItems={serviceItems}
                laborItems={laborItems}
            />

            <EditPredeterminedActivityModal
                isOpen={isEditPredeterminedActivityModalOpen}
                onClose={() => {
                    setIsEditPredeterminedActivityModalOpen(false);
                    setSelectedPredeterminedActivity(null);
                }}
                onSubmit={handleUpdatePredeterminedActivity}
                activity={selectedPredeterminedActivity}
                materials={materials}
                serviceItems={serviceItems}
                laborItems={laborItems}
            />
        </>
    );
};

export default DatabaseDashboard;
