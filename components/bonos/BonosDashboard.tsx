
import React, { useState, useContext, useMemo } from 'react';
import { Card } from '../shared/Card';
import { NewRequisitoModal } from './NewRequisitoModal';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { AppContext } from '../../context/AppContext';
import { BonoRequisito, Prospect, Offer, OfferStatus, ProjectType, BudgetStatus, Project, ProjectStatus, AccountReceivable, APStatus, Budget } from '../../types';
import { apiService } from '../../services/apiService';
import { addDays } from 'date-fns';

interface BonosDashboardProps {
    activeView: string;
}

const REQUISITOS_STATUS_LIST = [
    "Armando",
    "Estudio Crediticio",
    "Avalúo MUCAP",
    "Avalúo Condi MUCAP",
    "Avalúo Rechazado",
    "Listo para entrega",
    "Sin Continuidad"
];

const CASOS_STATUS_LIST = [
    "Entregado",
    "Avalúo",
    "Condicionado",
    "Subsanación",
    "Rev Subsanación",
    "Registrado",
    "Aprobado",
    "En APC",
    "Rechazo Muni",
    "Con Permisos",
    "Formalizado",
    "En Pausa",
    "En Construcción",
    "Finalizado"
];

const NO_PROCEDE_STATUS = "No Procede";

const formatCurrencyValue = (value: number) => {
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',');
};

const formatCurrency = (value: number) => `¢${formatCurrencyValue(value)}`;

const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (['ARMANDO', 'PARA REGISTRO'].includes(s)) return 'bg-yellow-500 text-white';
    if (['ESTUDIO CREDITICIO', 'REGISTRADO', 'EN BANHVI'].includes(s)) return 'bg-blue-500 text-white';
    if (['AVALÚO MUCAP', 'AVALÚO CONDI MUCAP', 'AVALÚO'].includes(s)) return 'bg-purple-600 text-white';
    if (['AVALÚO RECHAZADO', 'NO PROCEDE', 'RECHAZO MUNI'].includes(s)) return 'bg-red-500 text-white';
    if (['LISTO PARA ENTREGA', 'CON PERMISOS'].includes(s)) return 'bg-cyan-600 text-white';
    if (['ENTREGADO', 'FORMALIZADO', 'APROBADO'].includes(s)) return 'bg-green-500 text-white';
    if (['EN CONSTRUCCIÓN', 'PARA FORMALIZAR'].includes(s)) return 'bg-orange-500 text-white';
    if (['FINALIZADO'].includes(s)) return 'bg-emerald-600 text-white';
    if (['EN PAUSA', 'SUBSANACIÓN', 'REV SUBSANACIÓN'].includes(s)) return 'bg-amber-600 text-white';
    return 'bg-gray-400 text-white';
};

const bonoTypeToProjectType = (bonoType: string): ProjectType => {
    switch (bonoType) {
        case 'Ordinario': return ProjectType.BonoOrdinario;
        case 'Bono Crédito': return ProjectType.BonoCredito;
        case 'Bono Ramt': return ProjectType.BonoRAMT;
        case 'Bono Art 59': return ProjectType.BonoArt59;
        default: return ProjectType.Construccion;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS: Funciones reutilizables para buscar o crear entidades
// ─────────────────────────────────────────────────────────────────────────────

/** Busca un prospecto existente por nombre (case-insensitive). Si no existe, lo crea. */
const findOrCreateProspect = async (
    data: Omit<BonoRequisito, 'id'>,
    currentBonoId: number | undefined,
    prospects: Prospect[],
    setProspects: React.Dispatch<React.SetStateAction<Prospect[]>>,
    sourceLabel: string,
): Promise<Prospect> => {
    const existing = prospects.find(p => p.name.toLowerCase() === data.nombre.toLowerCase());
    if (existing) return existing;

    const newProspect = await apiService.createProspect({
        name: data.nombre,
        company: data.constructora || data.nombre,
        phone: '0000-0000',
        email: 'prospecto@flowerp.com',
        nextFollowUpDate: addDays(new Date(), 7).toISOString().split('T')[0],
        source: 'Conversión de Requisito Recurrente',
        sourceBonoId: currentBonoId || null,
        followUps: [{
            date: new Date().toISOString(),
            comments: `Prospecto creado automáticamente desde Proyectos Recurrentes (${sourceLabel}). ID Bono: ${currentBonoId || 'N/A'}`
        }]
    });
    setProspects(prev => [newProspect, ...prev]);
    return newProspect;
};

/** Genera el consecutivo para una nueva Oferta basado en el año actual. */
const generateOfferConsecutive = (offers: Offer[]): string => {
    const currentYear = new Date().getFullYear();
    const offersThisYear = offers.filter(o => o.consecutiveNumber.startsWith(`OF-${currentYear}`));
    const lastNumber = offersThisYear.length > 0
        ? Math.max(...offersThisYear.map(o => parseInt(o.consecutiveNumber.split('-')[2])))
        : 0;
    return `OF-${currentYear}-${(lastNumber + 1).toString().padStart(3, '0')}`;
};

/** Crea una Oferta vinculada a un Prospecto y (opcionalmente) un Budget. */
const createLinkedOffer = async (
    data: Omit<BonoRequisito, 'id'>,
    prospect: Prospect,
    linkedBudget: Budget | undefined,
    offers: Offer[],
    setOffers: React.Dispatch<React.SetStateAction<Offer[]>>,
    statusLabel: string,
    initialOfferStatus: OfferStatus = OfferStatus.Revision,
): Promise<Offer> => {
    const consecutive = generateOfferConsecutive(offers);
    const today = new Date().toISOString().split('T')[0];

    const amount = linkedBudget ? linkedBudget.finalTotal : (data.monto || 0);
    const budgetTotal = linkedBudget ? linkedBudget.directCostTotal : (data.monto || 0);

    const newOffer = await apiService.createOffer({
        consecutiveNumber: consecutive,
        prospectId: prospect.id,
        prospectName: data.nombre,
        date: today,
        description: `Oferta generada automáticamente por transición a ${statusLabel} para ${data.nombre}`,
        amount: amount,
        budget: budgetTotal,
        projectType: bonoTypeToProjectType(data.tipoBono),
        status: initialOfferStatus,
        budgetId: linkedBudget ? linkedBudget.id : null
    });
    setOffers(prev => [newOffer, ...prev]);
    return newOffer;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

const BonosDashboard: React.FC<BonosDashboardProps> = ({ activeView }) => {
    const appContext = useContext(AppContext);
    const { showToast } = useToast();
    const { addNotification } = useNotifications();

    const [isRequisitoModalOpen, setIsRequisitoModalOpen] = useState(false);
    const [selectedRequisito, setSelectedRequisito] = useState<BonoRequisito | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    if (!appContext) return null;
    const {
        budgets, setBudgets,
        bonosItems, setBonosItems,
        prospects, setProspects,
        offers, setOffers,
        projects, setProjects,
        accountsReceivable, setAccountsReceivable,
        suppliers
    } = appContext;

    const requisitosData = useMemo(() => {
        return bonosItems.filter(item => REQUISITOS_STATUS_LIST.includes(item.estatus));
    }, [bonosItems]);

    const casosData = useMemo(() => {
        return bonosItems.filter(item => CASOS_STATUS_LIST.includes(item.estatus));
    }, [bonosItems]);

    const noProcedeData = useMemo(() => {
        return bonosItems.filter(item => item.estatus === NO_PROCEDE_STATUS);
    }, [bonosItems]);

    const getTitle = () => {
        switch (activeView) {
            case 'bonos_requisitos': return 'Gestión de Requisitos';
            case 'bonos_casos': return 'Gestión del Caso';
            case 'bonos_noprocede': return 'No Procede';
            default: return 'Proyectos Recurrentes';
        }
    };

    // ═════════════════════════════════════════════════════════════════════════
    // TRIGGER 1: Estatus → "Avalúo"
    // Acción: Crear Prospecto (si no existe) + Crear Oferta en "Revisión"
    // ═════════════════════════════════════════════════════════════════════════
    const triggerAvaluo = async (data: Omit<BonoRequisito, 'id'>, currentBonoId: number | undefined) => {
        const linkedBudget = budgets.find(b => b.id === Number(data.budgetId));

        if (!linkedBudget) {
            showToast('El caso pasó a Avalúo pero no tiene presupuesto vinculado. No se creó oferta automática.', 'info');
            return;
        }

        try {
            // 1. Buscar o crear Prospecto (anti-duplicado)
            const prospect = await findOrCreateProspect(data, currentBonoId, prospects, setProspects, 'Avalúo');
            const prospectWasNew = !prospects.find(p => p.name.toLowerCase() === data.nombre.toLowerCase());

            // 2. Verificar si ya existe una Oferta vinculada a este presupuesto (anti-duplicado)
            const existingOffer = offers.find(o => o.budgetId === linkedBudget.id);
            if (existingOffer) {
                showToast(`Ya existe la oferta ${existingOffer.consecutiveNumber} vinculada a este presupuesto.`, 'info');
                return;
            }

            // 3. Crear Oferta
            const newOffer = await createLinkedOffer(data, prospect, linkedBudget, offers, setOffers, 'Avalúo', OfferStatus.Revision);

            // 4. Actualizar Budget Status si no es recurrente
            if (!linkedBudget.isRecurring) {
                const updatedBudget = await apiService.updateBudget(linkedBudget.id, { ...linkedBudget, status: BudgetStatus.Linked });
                setBudgets(prev => prev.map(b => b.id === linkedBudget.id ? updatedBudget : b));
            }

            showToast(`${prospectWasNew ? 'Prospecto y ' : ''}Oferta (${newOffer.consecutiveNumber}) creados correctamente.`, 'success');
            addNotification(`Trigger Avalúo: Oferta ${newOffer.consecutiveNumber} generada para "${data.nombre}".`);
        } catch (error) {
            console.error("[Trigger Avalúo] Error:", error);
            showToast('Error al crear prospecto u oferta automática en transición a Avalúo.', 'error');
        }
    };

    // ═════════════════════════════════════════════════════════════════════════
    // TRIGGER 2: Estatus → "En APC"
    // Acción: Crear Prospecto + Crear Oferta en "Revisión" (con vínculo de ID)
    // Transaccionalidad: Si falla la oferta, el estatus del bono YA se guardó
    //                     pero se informa al usuario del error parcial.
    // ═════════════════════════════════════════════════════════════════════════
    const triggerEnAPC = async (data: Omit<BonoRequisito, 'id'>, currentBonoId: number | undefined) => {
        try {
            // 1. Buscar o crear Prospecto (anti-duplicado)
            const prospectExisted = !!prospects.find(p => p.name.toLowerCase() === data.nombre.toLowerCase());
            const prospect = await findOrCreateProspect(data, currentBonoId, prospects, setProspects, 'En APC');

            if (!prospectExisted) {
                showToast(`✅ Prospecto "${data.nombre}" creado en Ventas (Prospectos).`, 'success');
                addNotification(`Se creó automáticamente el prospecto "${data.nombre}" en el módulo de Ventas (En APC).`);
            } else {
                showToast(`El prospecto "${data.nombre}" ya existe en Ventas.`, 'info');
            }

            // 2. Crear Oferta (incondicional en "En APC", vinculada si hay budget)
            const linkedBudget = data.budgetId ? budgets.find(b => b.id === Number(data.budgetId)) : undefined;
            const existingOffer = linkedBudget ? offers.find(o => o.budgetId === linkedBudget.id) : undefined;
            
            if (!existingOffer) {
                try {
                    const newOffer = await createLinkedOffer(data, prospect, linkedBudget, offers, setOffers, 'En APC', OfferStatus.Revision);

                    if (linkedBudget && !linkedBudget.isRecurring) {
                        const updatedBudget = await apiService.updateBudget(linkedBudget.id, { ...linkedBudget, status: BudgetStatus.Linked });
                        setBudgets(prev => prev.map(b => b.id === linkedBudget.id ? updatedBudget : b));
                    }

                    showToast(`✅ Oferta (${newOffer.consecutiveNumber}) creada en Ventas.`, 'success');
                    addNotification(`Trigger En APC: Oferta ${newOffer.consecutiveNumber} generada para "${data.nombre}".`);
                } catch (offerError) {
                    console.error("[Trigger En APC] Error creando oferta (no fatal):", offerError);
                    showToast('Prospecto creado, pero hubo un error al crear la oferta automática. Puede crearla manualmente.', 'warning');
                }
            } else {
                showToast(`Ya existe la oferta ${existingOffer.consecutiveNumber} vinculada a este presupuesto.`, 'info');
            }
        } catch (error) {
            console.error("[Trigger En APC] Error:", error);
            showToast('Error al crear prospecto automático en transición a En APC.', 'error');
        }
    };

    // ═════════════════════════════════════════════════════════════════════════
    // TRIGGER 3: Estatus → "Formalizado" O "En Construcción"
    // Acción: Buscar Oferta vinculada → Aprobar → Crear Proyecto + CxC
    // Validación: Si no hay oferta, log error + toast warning. No rompe.
    // ═════════════════════════════════════════════════════════════════════════
    const triggerFormalizadoOConstruccion = async (data: Omit<BonoRequisito, 'id'>, currentBonoId: number | undefined) => {
        if (!data.budgetId) {
            console.error("[Trigger Formalizado/Construcción] No hay budgetId vinculado. Abortando trigger.");
            showToast('⚠️ No se puede procesar: el caso no tiene presupuesto vinculado.', 'warning');
            return;
        }

        const linkedBudget = budgets.find(b => b.id === Number(data.budgetId));
        let linkedOffer = offers.find(o => o.budgetId === Number(data.budgetId));
        let currentProspect: Prospect | undefined = undefined;
        const today = new Date().toISOString().split('T')[0];

        try {
            // ── CASO A: No existe Oferta previa → Crear cadena completa ──
            if (!linkedOffer && linkedBudget) {
                console.warn("[Trigger Formalizado/Construcción] No se encontró oferta vinculada. Creando cadena completa.");

                const prospect = await findOrCreateProspect(data, currentBonoId, prospects, setProspects, data.estatus);
                currentProspect = prospect;

                linkedOffer = await createLinkedOffer(data, prospect, linkedBudget, offers, setOffers, data.estatus, OfferStatus.Aprobacion);

                if (!linkedBudget.isRecurring) {
                    const updatedBudget = await apiService.updateBudget(linkedBudget.id, { ...linkedBudget, status: BudgetStatus.Linked });
                    setBudgets(prev => prev.map(b => b.id === linkedBudget.id ? updatedBudget : b));
                }
            } else if (linkedOffer) {
                // ── CASO B: Ya existe Oferta → Actualizar a Aprobación ──
                if (linkedOffer.status !== OfferStatus.Aprobacion) {
                    const updatedOffer = await apiService.updateOffer(linkedOffer.id, { ...linkedOffer, status: OfferStatus.Aprobacion });
                    setOffers(prev => prev.map(o => o.id === linkedOffer!.id ? updatedOffer : o));
                    linkedOffer = updatedOffer;
                }
            } else {
                // ── CASO C: No hay Budget ni Oferta → Solo log (no romper) ──
                console.error("[Trigger Formalizado/Construcción] No se encontró presupuesto ni oferta vinculada.");
                showToast('⚠️ No se encontró oferta previa. El caso fue actualizado pero no se generaron entidades automáticas.', 'warning');
                addNotification(`⚠️ ATENCIÓN: El caso "${data.nombre}" cambió a ${data.estatus} sin oferta vinculada. Verificar manualmente.`);
                return;
            }

            // ── Crear Proyecto y CxC si la Oferta está aprobada ──
            if (linkedOffer && linkedOffer.status === OfferStatus.Aprobacion) {
                const prospect = currentProspect ||
                    prospects.find(p => p.id === linkedOffer!.prospectId) ||
                    (prospects.length > 0 ? prospects[0] : null);

                const projectExists = projects.some(p => p.offerId === linkedOffer!.id);

                if (!projectExists && prospect) {
                    // Crear CxC
                    const arExists = accountsReceivable.some(ar => ar.offerId === linkedOffer!.id);
                    if (!arExists) {
                        const newAR = await apiService.createAccountReceivable({
                            offerId: linkedOffer!.id,
                            clientName: prospect.name,
                            companyName: prospect.company,
                            paymentDate: addDays(new Date(), 30).toISOString().split('T')[0],
                            contractAmount: linkedOffer!.amount,
                            payments: [],
                            phone: prospect.phone,
                        });
                        setAccountsReceivable(prev => [...prev, newAR]);
                    }

                    // Crear Proyecto
                    const newProject = await apiService.createProject({
                        offerId: linkedOffer!.id,
                        name: `Proyecto ${linkedOffer!.projectType} - ${prospect.company}`,
                        creationDate: today,
                        initialContractAmount: linkedOffer!.amount,
                        initialBudget: linkedOffer!.budget,
                        contractAmount: linkedOffer!.amount,
                        budget: linkedOffer!.budget,
                        location: data.ubicacion || 'Por definir',
                        owner: prospect.company,
                        type: linkedOffer!.projectType,
                        status: ProjectStatus.InProgress,
                        expenses: 0,
                        unforeseenExpenses: 0,
                    });
                    setProjects(prev => [...prev, newProject]);

                    showToast(`✅ Oferta ${linkedOffer!.consecutiveNumber} aprobada y Proyecto generado automáticamente.`, 'success');
                    addNotification(`Trigger ${data.estatus}: Proyecto generado para oferta ${linkedOffer!.consecutiveNumber}.`);
                } else if (projectExists) {
                    showToast(`Oferta ${linkedOffer!.consecutiveNumber} marcada como aprobada. El proyecto ya existe.`, 'success');
                }
            }
        } catch (error) {
            console.error(`[Trigger ${data.estatus}] Error:`, error);
            showToast(`Error al procesar la transición a ${data.estatus}.`, 'error');
        }
    };

    // ═════════════════════════════════════════════════════════════════════════
    // HANDLER PRINCIPAL: Guardar Requisito/Caso
    // ═════════════════════════════════════════════════════════════════════════
    const handleSaveRequisito = async (data: Omit<BonoRequisito, 'id'>) => {
        // ── GUARD 1: Prevenir doble envío ──
        if (isProcessing) return;
        setIsProcessing(true);

        // ── GUARD 2: Detectar cambio REAL de estatus (prevenir bucles infinitos) ──
        const previousStatus = selectedRequisito?.estatus;
        const newStatus = data.estatus;
        const statusDidChange = previousStatus !== newStatus;

        // Flags de transición (solo se activan si el estatus REALMENTE cambió)
        const isTransitionToAvaluo = statusDidChange && newStatus === 'Avalúo';
        const isTransitionToEnAPC = statusDidChange && newStatus === 'En APC';
        const isTransitionToFormalizado = statusDidChange && newStatus === 'Formalizado';
        const isTransitionToEnConstruccion = statusDidChange && newStatus === 'En Construcción';
        const isTransitionToEntregado = statusDidChange && newStatus === 'Entregado';

        let currentBonoId = selectedRequisito?.id;

        // ── PASO 1: Persistir el Bono (siempre, independiente de los triggers) ──
        try {
            if (selectedRequisito) {
                const updatedData = { ...data };
                const updatedItem = await apiService.updateBono(selectedRequisito.id, updatedData);
                setBonosItems(prev => prev.map(item => item.id === selectedRequisito.id ? updatedItem : item));
            } else {
                const newItem = await apiService.createBono(data);
                setBonosItems(prev => [newItem, ...prev]);
                currentBonoId = newItem.id;
            }
        } catch (error) {
            showToast('Error al guardar el bono', 'error');
            setIsProcessing(false);
            return;
        }

        // ── PASO 2: Disparar Triggers según transición de estatus ──

        if (isTransitionToAvaluo) {
            await triggerAvaluo(data, currentBonoId);
        }

        if (isTransitionToEnAPC) {
            await triggerEnAPC(data, currentBonoId);
        }

        if (isTransitionToFormalizado || isTransitionToEnConstruccion) {
            await triggerFormalizadoOConstruccion(data, currentBonoId);
        }

        if (isTransitionToEntregado) {
            showToast(`✅ "${data.nombre}" movido a Gestión del Caso.`, 'success');
            addNotification(`El requisito "${data.nombre}" ha sido entregado y movido a Gestión del Caso.`);
        }

        if (newStatus === 'No Procede') {
            showToast(`Caso "${data.nombre}" movido a No Procede.`, 'info');
        }

        setIsRequisitoModalOpen(false);
        setSelectedRequisito(null);
        setIsProcessing(false);
    };

    const handleDeleteRequisito = async (id: number) => {
        if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
            try {
                await apiService.deleteBono(id);
                setBonosItems(prev => prev.filter(item => item.id !== id));
                showToast('Registro eliminado.', 'success');
            } catch (error) {
                showToast('Error al eliminar el bono', 'error');
            }
        }
    };

    const handleEditRequisito = (req: BonoRequisito) => {
        setSelectedRequisito(req);
        setIsRequisitoModalOpen(true);
    };

    const renderTable = (data: BonoRequisito[], showActions: boolean = true) => {
        const isCasoView = activeView === 'bonos_casos';

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="py-3 px-4 text-left font-semibold text-slate-600">Nombre</th>
                            <th className="py-3 px-4 text-left font-semibold text-slate-600">Tipo de Bono</th>
                            <th className="py-3 px-4 text-left font-semibold text-slate-600">Entidad</th>
                            <th className="py-3 px-4 text-center font-semibold text-slate-600">Estatus</th>
                            <th className="py-3 px-4 text-left font-semibold text-slate-600">Ubicación</th>
                            {isCasoView && <th className="py-3 px-4 text-left font-semibold text-slate-600">Presupuesto</th>}
                            <th className="py-3 px-4 text-left font-semibold text-slate-600">Fecha Actualización</th>
                            <th className="py-3 px-4 text-right font-semibold text-slate-600">Monto</th>
                            {showActions && <th className="py-3 px-4 text-center font-semibold text-slate-600">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {data.map((item) => {
                            const linkedBudget = item.budgetId ? budgets.find(b => b.id === item.budgetId) : null;
                            return (
                                <tr key={item.id} className={showActions ? "hover:bg-slate-50 cursor-pointer" : ""} onDoubleClick={() => showActions && handleEditRequisito(item)}>
                                    <td className="py-3 px-4 font-medium text-slate-900">{item.nombre}</td>
                                    <td className="py-3 px-4 text-slate-600">{item.tipoBono}</td>
                                    <td className="py-3 px-4 text-slate-600">{item.entidad}</td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.estatus)}`}>
                                            {item.estatus}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-600">{item.ubicacion}</td>
                                    {isCasoView && (
                                        <td className="py-3 px-4 text-slate-600">
                                            {linkedBudget ? (
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-primary">{Number(linkedBudget.consecutiveNumber).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}</span>
                                                    {linkedBudget.isRecurring && (
                                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md w-fit font-bold mt-0.5 uppercase">Recurrente</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic">Sin vincular</span>
                                            )}
                                        </td>
                                    )}
                                    <td className="py-3 px-4 text-slate-600">{new Date(item.fechaEntrega).toLocaleDateString()}</td>
                                    <td className="py-3 px-4 text-right font-mono text-slate-700">{formatCurrency(item.monto)}</td>
                                    {showActions && (
                                        <td className="py-3 px-4 text-center">
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteRequisito(item.id); }} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeView) {
            case 'bonos_requisitos':
                return (
                    <Card title="Gestión de Requisitos">
                        <div className="flex justify-end mb-4">
                            <button onClick={() => { setSelectedRequisito(null); setIsRequisitoModalOpen(true); }} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors">+ Nuevo Requisito</button>
                        </div>
                        {renderTable(requisitosData)}
                    </Card>
                );
            case 'bonos_casos':
                return (
                    <Card title="Gestión del Caso">
                        <div className="flex justify-end mb-4">
                            <button onClick={() => { setSelectedRequisito(null); setIsRequisitoModalOpen(true); }} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors">+ Nuevo Caso</button>
                        </div>
                        {renderTable(casosData)}
                    </Card>
                );
            case 'bonos_noprocede':
                return <Card title="Casos que No Proceden">{renderTable(noProcedeData)}</Card>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-dark-gray">{getTitle()}</h2>
            {renderContent()}
            <NewRequisitoModal
                isOpen={isRequisitoModalOpen}
                onClose={() => setIsRequisitoModalOpen(false)}
                onSubmit={handleSaveRequisito}
                initialData={selectedRequisito}
                activeView={activeView}
                budgets={budgets}
                suppliers={suppliers}
            />
        </div>
    );
};

export default BonosDashboard;
