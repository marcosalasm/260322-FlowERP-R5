
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Card } from '../shared/Card';
import { ProjectStatusChart } from './ProjectStatusChart';
import { getSmartSummary } from '../../services/geminiService';
import { Project, Offer, ProjectStatus, OfferStatus } from '../../types';
import { isWithinInterval, format, parseISO } from 'date-fns';
import { AppContext } from '../../context/AppContext';
import { DashboardDetailModal, DetailType } from './DashboardDetailModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; onClick?: () => void; subValue?: string }> = ({ title, value, icon, onClick, subValue }) => (
    <Card className={`flex flex-col p-5 transition-all duration-200 border-none bg-slate-50/50 hover:bg-white shadow-sm hover:shadow-md ${onClick ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : ''}`}>
        <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
                {icon}
            </div>
            {onClick && (
                <button className="text-blue-500 hover:text-blue-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
            )}
        </div>
        <div onClick={onClick}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
            {subValue && <p className="text-xs text-slate-400 mt-2 font-medium">{subValue}</p>}
        </div>
    </Card>
);

const SectionHeader: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
    <div className="flex items-center gap-2 mb-4 mt-8 first:mt-0">
        <div className="p-1.5 bg-slate-800 text-white rounded-lg shadow-sm">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
    </div>
);

const LoadingIcon = () => (
    <svg className="animate-spin h-5 w-5 text-dark-gray" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

type TimePeriod = 'year' | 'semester' | 'quarter';

const timePeriodOptions: { key: TimePeriod, label: string }[] = [
    { key: 'year', label: 'Este Año' },
    { key: 'semester', label: 'Semestre' },
    { key: 'quarter', label: 'Trimestre' },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0 }).format(amount);
};

const Dashboard: React.FC = () => {
    const appContext = useContext(AppContext);
    const [summary, setSummary] = useState<string>('');
    const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(true);
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('year');
    const [activeDetail, setActiveDetail] = useState<DetailType>(null);

    if (!appContext) return null;

    const {
        projects,
        offers,
        administrativeBudgets,
        administrativeExpenses
    } = appContext;

    const currentYear = new Date().getFullYear();

    const filteredData = useMemo(() => {
        const now = new Date();
        let startDate: Date;

        switch (timePeriod) {
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'semester':
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                break;
            case 'quarter':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                break;
            default:
                startDate = new Date(now.getFullYear(), 0, 1);
        }

        const interval = { start: startDate, end: now };
        const filteredProjects = (projects || []).filter(p => isWithinInterval(parseISO(p.creationDate), interval));
        const filteredOffers = (offers || []).filter(o => isWithinInterval(parseISO(o.date), interval));
        const filteredAdminExpenses = (administrativeExpenses || []).filter(e => isWithinInterval(parseISO(e.date), interval));

        return { filteredProjects, filteredOffers, filteredAdminExpenses };
    }, [projects, offers, administrativeExpenses, timePeriod]);


    useEffect(() => {
        const fetchSummary = async () => {
            setIsLoadingSummary(true);
            const timePeriodLabel = timePeriodOptions.find(t => t.key === timePeriod)?.label || 'período seleccionado';
            const result = await getSmartSummary(filteredData.filteredProjects, filteredData.filteredOffers, timePeriodLabel);
            setSummary(result);
            setIsLoadingSummary(false);
        };

        fetchSummary();
    }, [filteredData, timePeriod]);

    // --- SALES CALCULATIONS ---
    const offersInProcess = filteredData.filteredOffers.filter(o =>
        [OfferStatus.Confeccion, OfferStatus.Revision, OfferStatus.Aprobacion].includes(o.status as OfferStatus)
    );
    const totalPotentialSales = offersInProcess.reduce((sum, o) => sum + Number(o.amount || 0), 0);

    // --- PROJECTS CALCULATIONS ---
    const activeProjectsData = filteredData.filteredProjects.filter(p => p.status === ProjectStatus.InProgress);
    const projectedProjectIncome = activeProjectsData.reduce((sum, p) => sum + Number(p.contractAmount || 0), 0);
    const totalApprovedBudget = activeProjectsData.reduce((sum, p) => sum + Number(p.budget || 0), 0);
    const totalProjectExpenses = activeProjectsData.reduce((sum, p) => sum + Number(p.expenses || 0), 0);
    const projectBalance = totalApprovedBudget - totalProjectExpenses;

    // --- ADMINISTRATIVE CALCULATIONS ---
    const adminBudgetForYear = (administrativeBudgets || []).find(b => b.year === currentYear);
    const totalAnnualAdminBudget = adminBudgetForYear?.categories.reduce((sum, cat) => sum + Number(cat.annualBudget || 0), 0) || 0;
    const totalPeriodAdminExpenses = filteredData.filteredAdminExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const adminBalance = (totalAnnualAdminBudget / (timePeriod === 'year' ? 1 : timePeriod === 'semester' ? 2 : 4)) - totalPeriodAdminExpenses;

    // --- PROFITABILITY ---
    const profitBeforeTaxes = projectedProjectIncome - totalProjectExpenses - totalPeriodAdminExpenses;

    // --- CHART DATA (Monthly Approved Amount) ---
    const monthlyData = useMemo(() => {
        const dataMap: { [key: string]: number } = {};
        filteredData.filteredProjects.forEach(p => {
            const monthKey = format(parseISO(p.creationDate), 'MMM yyyy');
            dataMap[monthKey] = (dataMap[monthKey] || 0) + Number(p.contractAmount || 0);
        });

        return Object.entries(dataMap).map(([name, amount]) => ({ name, amount }));
    }, [filteredData.filteredProjects]);

    return (
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Panel de Control</h2>
                    <p className="text-slate-500 mt-1 font-medium">Resumen financiero y operativo de Flowerp</p>
                </div>
                <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-xl shadow-inner">
                    {timePeriodOptions.map(option => (
                        <button
                            key={option.key}
                            onClick={() => setTimePeriod(option.key)}
                            className={`px-5 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${timePeriod === option.key
                                ? 'bg-white text-blue-600 shadow-md transform scale-105'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <section>
                <SectionHeader
                    title="Ventas y Comercial"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                        title="Ofertas en Proceso"
                        value={offersInProcess.length.toString()}
                        subValue="Confección, Revisión o Aprobación"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                        onClick={() => setActiveDetail('offers')}
                    />
                    <StatCard
                        title="Ventas Proyectadas"
                        value={formatCurrency(totalPotentialSales)}
                        subValue="Monto total de ofertas activas"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>}
                    />
                </div>
            </section>

            <section>
                <SectionHeader
                    title="Ejecución de Proyectos"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" /></svg>}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Proyectos Activos"
                        value={activeProjectsData.length.toString()}
                        subValue="En ejecución actualmente"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                        onClick={() => setActiveDetail('activeProjects')}
                    />
                    <StatCard
                        title="Ingresos Previstos"
                        value={formatCurrency(projectedProjectIncome)}
                        subValue="Monto total de contratos"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm3-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                        onClick={() => setActiveDetail('budget')}
                    />
                    <StatCard
                        title="Gastos Proyectos"
                        value={formatCurrency(totalProjectExpenses)}
                        subValue="Ejecutado a la fecha"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        onClick={() => setActiveDetail('expenses')}
                    />
                    <StatCard
                        title="Balance Proyectos"
                        value={formatCurrency(projectBalance)}
                        subValue="Margen bruto proyectado"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                        onClick={() => setActiveDetail('balance')}
                    />
                </div>
            </section>

            <section>
                <SectionHeader
                    title="Operaciones Administrativas"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" /></svg>}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                        title="Presupuesto Anual"
                        value={formatCurrency(totalAnnualAdminBudget)}
                        subValue={`Año Fiscal ${currentYear}`}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    />
                    <StatCard
                        title="Gastos Administrativos"
                        value={formatCurrency(totalPeriodAdminExpenses)}
                        subValue="Gastos fijos y operativos"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
                    />
                    <StatCard
                        title="Balance Administrativo"
                        value={formatCurrency(adminBalance)}
                        subValue="Disponible en presupuesto"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>}
                    />
                </div>
            </section>

            <section>
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-48 w-48" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <p className="text-blue-300 font-bold uppercase tracking-widest text-sm mb-2">Utilidad Estimada</p>
                            <h2 className="text-5xl font-extrabold tracking-tight">{formatCurrency(profitBeforeTaxes)}</h2>
                            <p className="text-slate-400 mt-3 font-medium max-w-md">Utilidad antes de impuestos calculada como Ingresos Proyectos - Gastos Proyectos - Gastos Admin.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10 md:min-w-[280px]">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-300">Margen de Proyectos</span>
                                    <span className="font-bold">{formatCurrency(projectedProjectIncome - totalProjectExpenses)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-300 font-mono">(-) Gastos Admin</span>
                                    <span className="text-red-300 font-bold font-mono">({formatCurrency(totalPeriodAdminExpenses)})</span>
                                </div>
                                <div className="border-t border-white/10 pt-4 flex justify-between items-center text-lg font-bold">
                                    <span>NETO</span>
                                    <span className="text-green-400 font-mono">{formatCurrency(profitBeforeTaxes)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <SectionHeader
                    title="Monto de Proyectos Aprobados por Mes"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>}
                />
                <Card className="p-6">
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} tickFormatter={(val) => `¢${Number(val) / 1000000}M`} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(val) => [formatCurrency(Number(val)), 'Monto Aprobado']}
                                />
                                <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card title="Resumen Inteligente (IA)" className="lg:col-span-1 border-none shadow-sm bg-blue-50/30">
                    <div className="p-2">
                        {isLoadingSummary ? (
                            <div className="flex items-center justify-center min-h-[250px]">
                                <div className="flex flex-col items-center space-y-3">
                                    <LoadingIcon />
                                    <p className="text-sm font-bold text-slate-500 animate-pulse">Analizando desempeño...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="prose prose-slate prose-sm max-w-none">
                                <p className="text-slate-700 leading-relaxed font-medium italic">"{summary}"</p>
                            </div>
                        )}
                    </div>
                </Card>

                <Card title="Estado de Proyectos (Presupuesto vs Gastos)" className="lg:col-span-2 border-none shadow-sm">
                    <div className="h-[350px]">
                        {filteredData.filteredProjects.length > 0 ? (
                            <ProjectStatusChart data={filteredData.filteredProjects} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                <p className="font-semibold uppercase tracking-tighter text-xs">Sin datos disponibles para el período</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <DashboardDetailModal
                isOpen={!!activeDetail}
                onClose={() => setActiveDetail(null)}
                type={activeDetail}
                projects={filteredData.filteredProjects}
                offers={filteredData.filteredOffers}
            />
        </div>
    );
};

export default Dashboard;
