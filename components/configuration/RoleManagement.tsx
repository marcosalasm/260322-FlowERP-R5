import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';
import { RoleEditorModal } from './RoleEditorModal';
import { apiService } from '../../services/apiService';
import { Role } from '../../types';

export const RoleManagement: React.FC = () => {
    const { showToast } = useToast();
    const { can } = usePermissions();
    const appContext = useContext(AppContext);
    if (!appContext) return null;

    const { roles, setRoles, users } = appContext;
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    const handleOpenEditor = (role: Role | null) => {
        setSelectedRole(role);
        setIsEditorOpen(true);
    };

    const handleSaveRole = async (roleToSave: Omit<Role, 'id'> | Role) => {
        try {
            if ('id' in roleToSave) {
                // Update
                const updated = await apiService.updateRole(roleToSave.id, roleToSave);
                setRoles(prev => prev.map(r => r.id === roleToSave.id ? updated : r));
                showToast('Rol actualizado con éxito.', 'success');
            } else {
                // Create
                const created = await apiService.createRole(roleToSave);
                setRoles(prev => [...prev, created]);
                showToast('Rol creado con éxito.', 'success');
            }
            setIsEditorOpen(false);
            setSelectedRole(null);
        } catch (error) {
            console.error("Error saving role:", error);
            showToast('Error al guardar el rol.', 'error');
        }
    };

    const handleDeleteRole = async (roleToDelete: Role) => {
        if (roleToDelete.isDefault) {
            showToast('No se pueden eliminar los roles por defecto.', 'error');
            return;
        }
        const isAssigned = users.some(u => u.roleIds.includes(roleToDelete.id));
        if (isAssigned) {
            showToast(`No se puede eliminar el rol "${roleToDelete.name}" porque está asignado a uno o más usuarios.`, 'error');
            return;
        }

        if (window.confirm(`¿Está seguro de que desea eliminar el rol "${roleToDelete.name}"? Esta acción es irreversible.`)) {
            try {
                await apiService.deleteRole(roleToDelete.id);
                setRoles(prev => prev.filter(r => r.id !== roleToDelete.id));
                showToast('Rol eliminado con éxito.', 'success');
            } catch (error) {
                console.error("Error deleting role:", error);
                showToast('Error al eliminar el rol.', 'error');
            }
        }
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                {can('configuration', 'roles', 'create') && (
                    <button
                        onClick={() => handleOpenEditor(null)}
                        className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                    >
                        + Nuevo Rol
                    </button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre del Rol</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {roles.map(role => (
                            <tr key={role.id}>
                                <td className="py-4 px-4 font-medium">{role.name} {role.isDefault && <span className="text-xs text-slate-400">(Por Defecto)</span>}</td>
                                <td className="py-4 px-4 text-slate-600">{role.description}</td>
                                <td className="py-4 px-4">
                                    <div className="flex gap-4">
                                        {can('configuration', 'roles', 'edit') && (
                                            <button onClick={() => handleOpenEditor(role)} className="text-blue-600 hover:text-blue-900 font-medium">Editar</button>
                                        )}
                                        {can('configuration', 'roles', 'delete') && !role.isDefault && (
                                            <button onClick={() => handleDeleteRole(role)} className="text-red-600 hover:text-red-900 font-medium">Eliminar</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <RoleEditorModal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSaveRole}
                role={selectedRole}
            />
        </>
    );
};
