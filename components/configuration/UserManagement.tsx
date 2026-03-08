import React, { useState, useContext } from 'react';
import { User } from '../../types';
import { NewUserModal } from './NewUserModal';
import { EditUserModal } from './EditUserModal';
import { AppContext } from '../../context/AppContext';
import { apiService } from '../../services/apiService';
import { usePermissions } from '../../hooks/usePermissions';

export const UserManagement: React.FC = () => {
    const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const appContext = useContext(AppContext);
    const { can } = usePermissions();

    if (!appContext) return null;

    const { users, setUsers, roles, user: currentUser } = appContext;

    const handleAddNewUser = async (newUser: Omit<User, 'id' | 'status' | 'avatar'>) => {
        try {
            const userToAdd = {
                ...newUser,
                status: 'Active' as const,
                avatar: `https://picsum.photos/seed/user${Date.now()}/100`,
            };
            const created = await apiService.createUser(userToAdd);
            setUsers(prevUsers => [...prevUsers, created]);
            setIsNewUserModalOpen(false);
        } catch (error) {
            console.error("Error creating user:", error);
            alert("Error al crear el usuario.");
        }
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setIsEditUserModalOpen(true);
    };

    const handleUpdateUser = async (updatedUser: User) => {
        try {
            const updated = await apiService.updateUser(updatedUser.id, updatedUser);
            setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updated : u));
            setIsEditUserModalOpen(false);
            setSelectedUser(null);
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Error al actualizar el usuario.");
        }
    };

    const handleToggleUserStatus = async (user: User) => {
        if (window.confirm(`¿Está seguro de que desea ${user.status === 'Active' ? 'inactivar' : 'activar'} a [${user.name}]? Esto ${user.status === 'Active' ? 'impedirá' : 'permitirá'} su acceso al sistema.`)) {
            const updatedData = { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' as 'Active' | 'Inactive' };
            try {
                const updated = await apiService.updateUser(user.id, updatedData);
                setUsers(prevUsers => prevUsers.map(u => u.id === user.id ? updated : u));
            } catch (error) {
                console.error("Error toggling user status:", error);
                alert("Error al cambiar el estado del usuario.");
            }
        }
    };

    const canCreate = can('configuration', 'users', 'create');
    const canEdit = can('configuration', 'users', 'edit');
    const canDelete = can('configuration', 'users', 'delete');


    return (
        <>
            <div className="flex justify-end mb-4">
                {canCreate && (
                    <button
                        onClick={() => setIsNewUserModalOpen(true)}
                        className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                    >
                        + Nuevo Usuario
                    </button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Correo Electrónico</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Roles</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {users.map((user) => {
                            const userRoleNames = user.roleIds.map(id => roles.find(r => r.id === id)?.name).filter(Boolean).join(', ');
                            return (
                                <tr key={user.id} className="hover:bg-slate-50">
                                    <td className="py-4 px-4 text-sm font-medium text-slate-900">{user.name}</td>
                                    <td className="py-4 px-4 text-sm text-slate-600">{user.email}</td>
                                    <td className="py-4 px-4 text-sm text-slate-600">{userRoleNames}</td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.status === 'Active' ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-sm">
                                        <div className="flex items-center space-x-4">
                                            {canEdit && <button onClick={() => handleEditUser(user)} className="text-blue-600 hover:text-blue-900 font-medium">Editar</button>}

                                            {canDelete && (
                                                <button
                                                    onClick={() => handleToggleUserStatus(user)}
                                                    disabled={user.id === currentUser.id}
                                                    className="font-medium disabled:text-slate-400 disabled:cursor-not-allowed"
                                                    title={user.id === currentUser.id ? "No puede cambiar el estado de su propia cuenta." : ""}
                                                >
                                                    {user.status === 'Active' ? <span className="text-red-600 hover:text-red-900">Desactivar</span> : <span className="text-green-600 hover:text-green-900">Activar</span>}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <NewUserModal
                isOpen={isNewUserModalOpen}
                onClose={() => setIsNewUserModalOpen(false)}
                onSubmit={handleAddNewUser}
                existingUsers={users}
            />

            <EditUserModal
                isOpen={isEditUserModalOpen}
                onClose={() => {
                    setSelectedUser(null);
                    setIsEditUserModalOpen(false);
                }}
                onSubmit={handleUpdateUser}
                user={selectedUser}
                existingUsers={users}
            />
        </>
    );
};