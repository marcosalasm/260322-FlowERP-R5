import React, { useState, useEffect, useContext } from 'react';
import { User, Role, Permissions } from '../../types';
import { AppContext } from '../../context/AppContext';
import { PermissionTree } from './PermissionTree';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedUser: User) => void;
    user: User | null;
    existingUsers: User[];
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, onSubmit, user, existingUsers }) => {
    const appContext = useContext(AppContext);
    const { roles } = appContext || { roles: [] };

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [assignedRoleIds, setAssignedRoleIds] = useState<Set<number>>(new Set());
    const [individualPermissions, setIndividualPermissions] = useState<Permissions>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            setAssignedRoleIds(new Set(user.roleIds));
            setIndividualPermissions(user.individualPermissions ? JSON.parse(JSON.stringify(user.individualPermissions)) : {});
            setError('');
        }
    }, [user, isOpen]);

    const validate = () => {
        if (user && existingUsers.some(u => u.id !== user.id && u.email.toLowerCase() === email.toLowerCase())) {
            setError('El correo electrónico ya está en uso por otro usuario.');
            return false;
        }
        setError('');
        return true;
    };

    const handlePasswordReset = () => {
        alert(`Se ha enviado un enlace para restablecer la contraseña a ${email}. (Función simulada)`);
    };

    const handleRoleToggle = (roleId: number) => {
        setAssignedRoleIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(roleId)) {
                newSet.delete(roleId);
            } else {
                newSet.add(roleId);
            }
            return newSet;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !validate()) return;
        
        setIsSubmitting(true);
        const updatedUser: User = {
            ...user,
            name,
            email,
            roleIds: Array.from(assignedRoleIds),
            individualPermissions,
        };
        onSubmit(updatedUser);
        setIsSubmitting(false);
        onClose();
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-6xl h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-dark-gray">Editar Usuario</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="edit-user-name" className="block text-sm font-medium text-slate-700">Nombre Completo</label>
                            <input type="text" id="edit-user-name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary" />
                        </div>
                        <div>
                            <label htmlFor="edit-user-email" className="block text-sm font-medium text-slate-700">Correo Electrónico (Login)</label>
                            <input type="email" id="edit-user-email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary" />
                        </div>
                    </div>

                     <div>
                        <h3 className="text-md font-medium text-slate-700">Roles Asignados</h3>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 border p-3 rounded-md">
                            {roles.map(role => (
                                <label key={role.id} className="flex items-center text-sm">
                                    <input 
                                        type="checkbox"
                                        checked={assignedRoleIds.has(role.id)}
                                        onChange={() => handleRoleToggle(role.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="ml-2 text-slate-800">{role.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex-grow flex flex-col overflow-hidden">
                        <h3 className="text-md font-medium text-slate-700">Privilegios Individuales (Anulan roles)</h3>
                         <div className="flex-grow overflow-y-auto mt-2 -mr-4 pr-4">
                            <PermissionTree
                                permissions={individualPermissions}
                                setPermissions={setIndividualPermissions}
                            />
                        </div>
                    </div>
                    
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    
                    <div className="flex-shrink-0 flex justify-between items-center gap-4 pt-4 border-t border-light-gray">
                        <button type="button" onClick={handlePasswordReset} className="text-sm text-primary hover:text-primary-dark font-medium">
                            Enviar enlace para restablecer contraseña
                        </button>
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" disabled={isSubmitting} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-slate-400">
                                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};