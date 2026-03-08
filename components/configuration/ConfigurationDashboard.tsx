import React, { useState, useContext } from 'react';
import { Card } from '../shared/Card';
import { AppContext } from '../../context/AppContext';
import { CompanyInfo, User, Role } from '../../types';
import { CompanyConfig } from './CompanyConfig';
import { UserManagement } from './UserManagement';
import { RoleManagement } from './RoleManagement';
import { DocumentNotesConfig } from './DocumentNotesConfig';
import { apiService } from '../../services/apiService';
import { usePermissions } from '../../hooks/usePermissions';


type ConfigView = 'general' | 'users' | 'roles' | 'documents';

const ConfigurationDashboard: React.FC = () => {
    const appContext = useContext(AppContext);
    const { can } = usePermissions();
    if (!appContext) return null;

    const { companyInfo, setCompanyInfo, users, setUsers, roles, setRoles } = appContext;
    const [activeView, setActiveView] = useState<ConfigView>('general');

    const configViews: { key: ConfigView, label: string }[] = [];
    if (can('configuration', 'general', 'edit')) configViews.push({ key: 'general', label: 'Configuración General' });
    if (can('configuration', 'users', 'view')) configViews.push({ key: 'users', label: 'Administración de Usuarios' });
    if (can('configuration', 'roles', 'view')) configViews.push({ key: 'roles', label: 'Roles y Privilegios' });
    if (can('configuration', 'general', 'edit')) configViews.push({ key: 'documents', label: 'Documentos' });


    // If the default view is not available for the current role, switch to the first available one.
    React.useEffect(() => {
        if (!configViews.some(v => v.key === activeView)) {
            setActiveView(configViews[0]?.key as ConfigView);
        }
    }, [can, activeView]);

    const handleUpdateCompanyInfo = async (info: CompanyInfo) => {
        try {
            const updated = await apiService.updateCompanyInfo(info);
            setCompanyInfo(updated);
        } catch (error) {
            console.error("Error updating company info:", error);
            alert("Error al guardar la información de la empresa.");
        }
    };

    const activeViewContent = () => {
        switch (activeView) {
            case 'general':
                return can('configuration', 'general', 'edit')
                    ? <CompanyConfig companyInfo={companyInfo} onSave={handleUpdateCompanyInfo} />
                    : null;
            case 'users':
                return can('configuration', 'users', 'view')
                    ? <UserManagement />
                    : null;
            case 'roles':
                return can('configuration', 'roles', 'view')
                    ? <RoleManagement />
                    : null;
            case 'documents':
                return can('configuration', 'general', 'edit')
                    ? <DocumentNotesConfig />
                    : null;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-dark-gray">Configuración del Sistema</h2>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {configViews.map(view => (
                        <button
                            key={view.key}
                            onClick={() => setActiveView(view.key as ConfigView)}
                            className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeView === view.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                        >
                            {view.label}
                        </button>
                    ))}
                </nav>
            </div>

            <Card title={configViews.find(v => v.key === activeView)?.label}>
                {activeViewContent()}
            </Card>
        </div>
    );
};

export default ConfigurationDashboard;