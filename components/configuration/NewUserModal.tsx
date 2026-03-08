import React, { useState, useContext } from 'react';
import { User, Role } from '../../types';
import { AppContext } from '../../context/AppContext';

interface NewUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newUserData: Omit<User, 'id' | 'status' | 'avatar'>) => void;
    existingUsers: User[];
}

export const NewUserModal: React.FC<NewUserModalProps> = ({ isOpen, onClose, onSubmit, existingUsers }) => {
    const appContext = useContext(AppContext);
    const { roles } = appContext || { roles: [] };

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [assignedRoleIds, setAssignedRoleIds] = useState<Set<number>>(new Set());
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const resetForm = () => {
        setName('');
        setEmail('');
        setAssignedRoleIds(new Set());
        setPassword('');
        setConfirmPassword('');
        setError('');
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

    const validate = () => {
        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return false;
        }
        if (existingUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            setError('El correo electrónico ya está en uso.');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        setIsSubmitting(true);
        onSubmit({ name, email, roleIds: Array.from(assignedRoleIds), password });
        setIsSubmitting(false);
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-dark-gray">Crear Nuevo Usuario</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="new-user-name" className="block text-sm font-medium text-slate-700">Nombre Completo</label>
                        <input type="text" id="new-user-name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary" />
                    </div>
                    <div>
                        <label htmlFor="new-user-email" className="block text-sm font-medium text-slate-700">Correo Electrónico (Login)</label>
                        <input type="email" id="new-user-email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Roles</label>
                         <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 border p-3 rounded-md">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="new-user-password" className="block text-sm font-medium text-slate-700">Contraseña</label>
                            <input type="password" id="new-user-password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary" />
                        </div>
                        <div>
                            <label htmlFor="new-user-confirm-password" className="block text-sm font-medium text-slate-700">Confirmar Contraseña</label>
                            <input type="password" id="new-user-confirm-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary" />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                    <div className="flex justify-end gap-4 pt-4 border-t border-light-gray">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-slate-400">
                            {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
